-- Migration to fix missing dashboard:view permission for parent and student roles
-- This ensures existing tenants also get the permission.

WITH roles_to_fix AS (
  SELECT id, code, tenant_id
  FROM roles
  WHERE code IN ('parent', 'student')
),
dash_perm AS (
  SELECT id
  FROM permissions
  WHERE code = 'dashboard:view'
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles_to_fix r
CROSS JOIN dash_perm p
ON CONFLICT DO NOTHING;
