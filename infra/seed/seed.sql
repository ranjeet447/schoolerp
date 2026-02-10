-- seed.sql

-- 1. Platforms Roles & Permissions
INSERT INTO permissions (code, module, description) VALUES
('tenant:manage', 'saas', 'Manage tenants and plans'),
('rbac:manage', 'governance', 'Manage roles and assignments'),
('audit:read', 'governance', 'Read audit logs'),
('sis:read', 'academic', 'Read student information'),
('sis:write', 'academic', 'Create/Update students'),
('fees:manage', 'finance', 'Manage fees and receipts')
ON CONFLICT (code) DO NOTHING;

-- Default Platform Roles
INSERT INTO roles (name, code, description, is_system) VALUES
('SaaS Super Admin', 'super_admin', 'Global platform manager', TRUE)
ON CONFLICT DO NOTHING;

-- Link Super Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE code = 'super_admin' AND tenant_id IS NULL LIMIT 1), id FROM permissions
ON CONFLICT DO NOTHING;

-- 2. Basic Tenant for Testing
DO $$
DECLARE
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO tenants (id, name, subdomain) 
    VALUES (v_tenant_id, 'Demo International School', 'demo')
    ON CONFLICT DO NOTHING;

    INSERT INTO branches (tenant_id, name, code)
    VALUES (v_tenant_id, 'Main Campus', 'MAIN')
    ON CONFLICT DO NOTHING;

    INSERT INTO wallets (tenant_id, balance_paise)
    VALUES (v_tenant_id, 100000) -- ₹1000 balance
    ON CONFLICT DO NOTHING;
    -- 3. Seed Users & Roles (Merged from seed_users.sql)
    -- Roles
    INSERT INTO roles (id, tenant_id, name, code, description, is_system) VALUES
    ('11111111-1111-1111-1111-111111111111', NULL, 'Super Admin', 'super_admin', 'Platform wide access', TRUE),
    ('22222222-2222-2222-2222-222222222222', NULL, 'Tenant Admin', 'tenant_admin', 'School owner/administrator', TRUE),
    ('33333333-3333-3333-3333-333333333333', NULL, 'Teacher', 'teacher', 'Academic staff', TRUE),
    ('44444444-4444-4444-4444-444444444444', NULL, 'Accountant', 'accountant', 'Finance and fee collector', TRUE),
    ('55555555-5555-5555-5555-555555555555', NULL, 'Parent', 'parent', 'Guardian view', TRUE),
    ('66666666-6666-6666-6666-666666666666', NULL, 'Student', 'student', 'Student view', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Map Roles (Simplified for brevity, assuming permissions exist)
    -- Tenant Admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT '22222222-2222-2222-2222-222222222222', id FROM permissions
    ON CONFLICT DO NOTHING;

    -- Users
    -- Admin
    INSERT INTO users (id, email, full_name, is_active)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@school.edu', 'Dr. Admin Kumar', TRUE)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO user_identities (user_id, provider, identifier, credential)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'password', 'admin@school.edu', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
    ON CONFLICT (provider, identifier) DO NOTHING;

    -- Teacher
    INSERT INTO users (id, email, full_name, is_active)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'teacher@school.edu', 'Ms. Priya Sharma', TRUE)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO user_identities (user_id, provider, identifier, credential)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'password', 'teacher@school.edu', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
    ON CONFLICT (provider, identifier) DO NOTHING;

    -- Parent
    INSERT INTO users (id, email, full_name, is_active)
    VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'parent@school.edu', 'Mr. Rajesh Patel', TRUE)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO user_identities (user_id, provider, identifier, credential)
    VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccd', 'password', 'parent@school.edu', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
    ON CONFLICT (provider, identifier) DO NOTHING;
    
    -- Assign Roles
    INSERT INTO role_assignments (tenant_id, user_id, role_id, scope_type)
    VALUES 
    (v_tenant_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'tenant'),
    (v_tenant_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'tenant'),
    (v_tenant_id, 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'tenant')
    ON CONFLICT DO NOTHING;

END $$;
