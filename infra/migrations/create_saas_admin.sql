-- Create SaaS Admin Account
-- EXHAUSTIVELY USING USER-PROVIDED PROPER UUIDS
-- Email: saas_admin@schoolerp.com
-- Password: password123

BEGIN;

-- 1. Create User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    'e30d0645-f58b-4fbb-b7e3-a92fc9b41b88', 
    'saas_admin@schoolerp.com', 
    '+919999999999', 
    'SaaS Platform Admin', 
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- 2. Create Identity
INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    'c837c446-6a7d-4a04-90a8-ca7bcbfd56d4', 
    'e30d0645-f58b-4fbb-b7e3-a92fc9b41b88', 
    'password', 
    'saas_admin@schoolerp.com', 
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (id) DO NOTHING;

-- 3. Assign Super Admin Role
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES (
    '5f86dc2f-54fc-4a2f-97cd-3d0bb2512ff3', 
    NULL, 
    'e30d0645-f58b-4fbb-b7e3-a92fc9b41b88', 
    'b12f5935-76e6-4821-9940-2dd711080a86', 
    'platform'
) ON CONFLICT DO NOTHING;

COMMIT;
