-- Create SaaS Admin Account (v7)
-- EXHAUSTIVELY USING USER-PROVIDED PROPER UUID v7
-- Email: saas_admin@schoolerp.com
-- Password: password123

BEGIN;

-- 1. Create User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 
    'saas_admin@schoolerp.com', 
    '+919999999999', 
    'SaaS Platform Admin', 
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- 2. Create Identity
INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    '019c4d42-49ca-7593-ad83-721b9b43bc23', 
    '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 
    'password', 
    'saas_admin@schoolerp.com', 
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (id) DO NOTHING;

-- 3. Assign Super Admin Role
-- Using Platform Tenant ID from seed_production
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES (
    '019c4d42-49ca-73e1-be64-56377f64b05b', 
    '019c4d42-49ca-7e0a-b047-86336ebac7ae', 
    '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 
    '019c4d42-49ca-7166-9de9-5e97220dc819', 
    'platform'
) ON CONFLICT DO NOTHING;

COMMIT;
