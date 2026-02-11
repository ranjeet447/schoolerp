-- Consolidated Seed Script for SchoolERP
-- Seeds: Tenants, Users, Roles, Permissions, Role Assignments
-- Password for all test users: "password123"
-- SHA256: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

BEGIN;

-- 1. SEED TENANTS
INSERT INTO tenants (id, name, subdomain, domain, config, is_active)
VALUES (
    '6ce0c3c1-e2e1-480e-b3ba-f2fc24683e4a',
    'Demo International School',
    'demo',
    'demo.schoolerp.com',
    '{"white_label": false}',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 2. SEED PERMISSIONS
INSERT INTO permissions (id, code, module, description) VALUES
('483a784a-cf62-477b-b9b6-e408d7e779ab', 'dashboard:view', 'core', 'Access the administration dashboard'),
('9bb357ff-dcae-4ad1-99df-908b121b68bb', 'sis:read', 'sis', 'View student profiles'),
('22d74228-502c-47b5-91fe-654b53b002d4', 'sis:write', 'sis', 'Create/Edit student profiles'),
('a2f31bd7-e2c3-40f3-a89b-002057c4743d', 'fees:read', 'fees', 'View fee structures'),
('f6599a2b-32e5-42b6-a2ed-52a5aadaf0fa', 'fees:collect', 'fees', 'Collect fee payments'),
('7741d805-db70-4d86-909a-4defa944d843', 'attendance:read', 'attendance', 'View attendance'),
('266cb32e-17ee-4033-81e0-b298d2a8d8bb', 'attendance:write', 'attendance', 'Mark attendance'),
('f4a71633-6c12-4296-a94c-770b57d637aa', 'tenant:manage', 'settings', 'Manage school settings')
ON CONFLICT (code) DO NOTHING;

-- 3. SEED ROLES
INSERT INTO roles (id, tenant_id, name, code, description, is_system) VALUES
('b12f5935-76e6-4821-9940-2dd711080a86', NULL, 'Super Admin', 'super_admin', 'Platform wide access', TRUE),
('1aed3003-f825-45fe-99d2-287d12b0b889', NULL, 'Tenant Admin', 'tenant_admin', 'School owner/administrator', TRUE),
('7b1fa784-41f9-43fd-b660-dd2fd7167344', NULL, 'Teacher', 'teacher', 'Academic staff', TRUE),
('b8825ab5-e5f6-4975-b217-eb3707952de5', NULL, 'Accountant', 'accountant', 'Finance and fee collector', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. MAP ROLES
INSERT INTO role_permissions (role_id, permission_id)
SELECT '1aed3003-f825-45fe-99d2-287d12b0b889', id FROM permissions ON CONFLICT DO NOTHING;

-- 5. SEED USERS
-- SaaS Admin
INSERT INTO users (id, email, full_name, is_active)
VALUES ('5f86dc2f-54fc-4a2f-97cd-3d0bb2512ff3', 'saas_admin@schoolerp.com', 'SaaS Platform Admin', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('7bf3b769-4dd6-4a13-9088-444742a76b6d', '5f86dc2f-54fc-4a2f-97cd-3d0bb2512ff3', 'password', 'saas_admin@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (id) DO NOTHING;

-- Demo School Admin
INSERT INTO users (id, email, full_name, is_active)
VALUES ('ed1d186e-814f-44b5-8269-074708f07b89', 'admin@demo.school', 'Demo School Admin', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('97609aed-7e7a-462d-80c9-ae44138b6442', 'ed1d186e-814f-44b5-8269-074708f07b89', 'password', 'admin@demo.school', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (id) DO NOTHING;

-- 6. ASSIGN ROLES
INSERT INTO role_assignments (id, user_id, role_id, scope_type)
VALUES ('f8ff616e-f0c0-4a4a-8afe-53031e4aacc3', '5f86dc2f-54fc-4a2f-97cd-3d0bb2512ff3', 'b12f5935-76e6-4821-9940-2dd711080a86', 'platform')
ON CONFLICT DO NOTHING;

INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('77bdb6fc-257a-461c-9161-a50e08e9c716', '6ce0c3c1-e2e1-480e-b3ba-f2fc24683e4a', 'ed1d186e-814f-44b5-8269-074708f07b89', '1aed3003-f825-45fe-99d2-287d12b0b889', 'tenant')
ON CONFLICT DO NOTHING;

COMMIT;
