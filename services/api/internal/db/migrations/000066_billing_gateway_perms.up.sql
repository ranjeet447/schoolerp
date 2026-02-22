-- Migration: Add billing and gateway management permissions
-- Target: System-wide and existing tenants

-- 1. Add new permissions to the global list
INSERT INTO permissions (code, module, description) VALUES
  ('fees:gateways.manage', 'fees', 'Manage payment gateway configurations'),
  ('tenant:billing.read', 'tenant', 'View tenant billing and subscription status')
ON CONFLICT (code) DO NOTHING;

-- 2. Grant these permissions to all existing 'tenant_admin' roles
WITH admin_roles AS (
    SELECT id FROM roles WHERE code = 'tenant_admin'
),
new_perms AS (
    SELECT id FROM permissions WHERE code IN ('fees:gateways.manage', 'tenant:billing.read')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
CROSS JOIN new_perms p
ON CONFLICT DO NOTHING;

-- 3. Also grant 'fees:gateways.manage' to existing 'accountant' roles if appropriate
WITH accountant_roles AS (
    SELECT id FROM roles WHERE code = 'accountant'
),
gateway_perm AS (
    SELECT id FROM permissions WHERE code = 'fees:gateways.manage'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM accountant_roles r
CROSS JOIN gateway_perm p
ON CONFLICT DO NOTHING;
