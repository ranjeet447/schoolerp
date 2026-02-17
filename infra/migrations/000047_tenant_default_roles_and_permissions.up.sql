BEGIN;

-- Make role editing safe: some code paths expect roles.updated_at.
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Baseline permissions used across the app (tenant scope).
INSERT INTO permissions (code, module, description) VALUES
  ('sis:read', 'sis', 'View student profiles'),
  ('sis:write', 'sis', 'Create/Edit student profiles'),
  ('sis:delete', 'sis', 'Delete student profiles'),
  ('fees:read', 'fees', 'View fee structures and payments'),
  ('fees:collect', 'fees', 'Collect fee payments'),
  ('fees:manage', 'fees', 'Manage fee structures and concessions'),
  ('attendance:read', 'attendance', 'View attendance records'),
  ('attendance:write', 'attendance', 'Mark/Edit attendance'),
  ('finance:read', 'finance', 'View financial reports'),
  ('finance:write', 'finance', 'Manage expenses and accounting'),
  ('tenant:manage', 'tenant', 'Manage tenant settings and users')
ON CONFLICT (code) DO NOTHING;

-- Global role templates (tenant_id IS NULL). These should exist even in "no-seed" environments.
INSERT INTO roles (tenant_id, name, code, description, is_system, created_at, updated_at)
SELECT NULL, v.name, v.code, v.description, TRUE, NOW(), NOW()
FROM (
  VALUES
    ('Tenant Admin', 'tenant_admin', 'School owner/administrator'),
    ('Teacher', 'teacher', 'Academic staff'),
    ('Accountant', 'accountant', 'Finance and fee collector'),
    ('Parent', 'parent', 'Guardian view'),
    ('Student', 'student', 'Student view')
) AS v(name, code, description)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.tenant_id IS NULL AND r.code = v.code
);

-- Template role permissions (idempotent).
WITH role_ref AS (
  SELECT DISTINCT ON (code) id, code
  FROM roles
  WHERE tenant_id IS NULL
    AND code IN ('tenant_admin','teacher','accountant','parent','student')
  ORDER BY code, created_at ASC
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT rr.id, p.id
FROM role_ref rr
JOIN permissions p ON (
  (rr.code = 'tenant_admin' AND p.code IN ('sis:read','sis:write','sis:delete','fees:read','fees:collect','fees:manage','attendance:read','attendance:write','finance:read','finance:write','tenant:manage'))
  OR (rr.code = 'teacher' AND p.code IN ('sis:read','sis:write','attendance:read','attendance:write','fees:read'))
  OR (rr.code = 'accountant' AND p.code IN ('fees:read','fees:collect','fees:manage','finance:read','finance:write','sis:read'))
  OR (rr.code = 'parent' AND p.code IN ('attendance:read','fees:read','sis:read'))
  OR (rr.code = 'student' AND p.code IN ('attendance:read','fees:read','sis:read'))
)
ON CONFLICT DO NOTHING;

-- Create per-tenant default roles (editable, is_system = FALSE) by cloning templates.
WITH tmpl AS (
  SELECT DISTINCT ON (code) id AS template_role_id, code, name, description
  FROM roles
  WHERE tenant_id IS NULL
    AND code IN ('tenant_admin','teacher','accountant','parent','student')
  ORDER BY code, created_at ASC
),
target_tenants AS (
  SELECT t.id AS tenant_id
  FROM tenants t
  WHERE NOT (t.config ? 'is_system' AND t.config->>'is_system' = 'true')
),
inserted AS (
  INSERT INTO roles (tenant_id, name, code, description, is_system, created_at, updated_at)
  SELECT tt.tenant_id, tmpl.name, tmpl.code, tmpl.description, FALSE, NOW(), NOW()
  FROM target_tenants tt
  JOIN tmpl ON TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.tenant_id = tt.tenant_id AND r.code = tmpl.code
  )
  RETURNING tenant_id, id, code
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT tr.id, rp.permission_id
FROM roles tr
JOIN target_tenants tt ON tt.tenant_id = tr.tenant_id
JOIN tmpl ON tmpl.code = tr.code
JOIN role_permissions rp ON rp.role_id = tmpl.template_role_id
WHERE tr.code IN ('tenant_admin','teacher','accountant','parent','student')
ON CONFLICT DO NOTHING;

-- If any users were assigned to template roles, migrate those assignments to the tenant-scoped default roles.
UPDATE role_assignments ra
SET role_id = tr.id
FROM roles tmpl
JOIN roles tr
  ON tr.tenant_id = ra.tenant_id
 AND tr.code = tmpl.code
WHERE ra.role_id = tmpl.id
  AND tmpl.tenant_id IS NULL
  AND tmpl.code IN ('tenant_admin','teacher','accountant','parent','student')
  AND tr.is_system = FALSE;

COMMIT;

