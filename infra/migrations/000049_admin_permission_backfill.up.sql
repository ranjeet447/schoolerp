BEGIN;

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure core admin roles exist in global templates.
INSERT INTO roles (tenant_id, name, code, description, is_system, created_at, updated_at)
SELECT NULL, v.name, v.code, v.description, TRUE, NOW(), NOW()
FROM (
  VALUES
    ('Super Admin', 'super_admin', 'Platform wide access'),
    ('Tenant Admin', 'tenant_admin', 'School owner/administrator')
) AS v(name, code, description)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.tenant_id IS NULL AND r.code = v.code
);

UPDATE roles
SET
  name = CASE code
    WHEN 'super_admin' THEN 'Super Admin'
    WHEN 'tenant_admin' THEN 'Tenant Admin'
    ELSE name
  END,
  description = CASE code
    WHEN 'super_admin' THEN 'Platform wide access'
    WHEN 'tenant_admin' THEN 'School owner/administrator'
    ELSE description
  END,
  updated_at = NOW()
WHERE tenant_id IS NULL
  AND code IN ('super_admin', 'tenant_admin');

-- Tenant admins should have all tenant/application permissions (everything except platform:*).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code NOT LIKE 'platform:%'
WHERE r.code = 'tenant_admin'
ON CONFLICT DO NOTHING;

-- Super admins should have every permission, including platform:*.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

COMMIT;
