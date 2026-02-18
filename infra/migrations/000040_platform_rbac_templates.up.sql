-- 000040_platform_rbac_templates.up.sql

-- Ensure baseline platform roles exist.
INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Super Admin', 'super_admin', 'Full platform access', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'super_admin'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Support L1', 'support_l1', 'First-line support operations', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'support_l1'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Support L2', 'support_l2', 'Escalated support operations', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'support_l2'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Finance', 'finance', 'Billing and payment operations', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'finance'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Operations', 'ops', 'Platform operations and lifecycle control', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'ops'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Developer', 'developer', 'Technical integrations and diagnostics', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'developer'
);

-- Baseline platform permission matrix.
INSERT INTO permissions (code, module, description) VALUES
  ('platform:tenant.read', 'platform', 'View tenant directory and tenant profile'),
  ('platform:tenant.write', 'platform', 'Update tenant settings and lifecycle state'),
  ('platform:billing.read', 'platform', 'View subscriptions, invoices, and collections'),
  ('platform:billing.write', 'platform', 'Mutate subscriptions, invoices, and lockout controls'),
  ('platform:user.read', 'platform', 'View internal platform users and role assignments'),
  ('platform:user.write', 'platform', 'Create/update internal platform users and role assignments'),
  ('platform:audit.read', 'platform', 'View platform audit logs and security trails'),
  ('platform:impersonation.use', 'platform', 'Use login-as tenant admin controls'),
  ('platform:ops.manage', 'platform', 'Manage incident, queue, and reliability operations'),
  ('platform:dev.manage', 'platform', 'Access developer-only tooling and controls'),
  ('platform:integrations.manage', 'platform', 'Manage API keys, webhooks, and integrations'),
  ('platform:monitoring.read', 'platform', 'View monitoring and system health dashboards'),
  ('platform:settings.write', 'platform', 'Manage platform-wide settings and templates'),
  ('platform:marketing.write', 'platform', 'Manage platform announcements and changelogs'),
  ('platform:analytics.read', 'platform', 'View business and platform analytics dashboard'),
  ('platform:data.export', 'platform', 'Run tenant/platform exports'),
  ('platform:data.restore', 'platform', 'Run restore and destructive data workflows')
ON CONFLICT (code) DO NOTHING;

-- Role-to-permission defaults.
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'super_admin' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code LIKE 'platform:%'
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'support_l1' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenant.read',
  'platform:billing.read',
  'platform:user.read',
  'platform:audit.read',
  'platform:monitoring.read'
)
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'support_l2' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenant.read',
  'platform:tenant.write',
  'platform:billing.read',
  'platform:user.read',
  'platform:audit.read',
  'platform:impersonation.use',
  'platform:monitoring.read'
)
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'finance' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:billing.read',
  'platform:billing.write',
  'platform:tenant.read',
  'platform:user.read',
  'platform:audit.read',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'ops' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenant.read',
  'platform:tenant.write',
  'platform:billing.read',
  'platform:billing.write',
  'platform:ops.manage',
  'platform:monitoring.read',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'developer' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenant.read',
  'platform:integrations.manage',
  'platform:dev.manage',
  'platform:monitoring.read',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;
