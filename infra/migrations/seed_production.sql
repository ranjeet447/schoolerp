-- SchoolERP Comprehensive Cleanup & Re-Seed
-- EXHAUSTIVELY USING UNIQUE, PROPER UUIDS FROM USER LIST
-- Password for all users: "password123" (SHA256: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f)

BEGIN;

-- 1. CLEANUP (Wipe existing data to ensure clean IDs)
TRUNCATE 
    sessions, user_identities, role_assignments, 
    ai_knowledge_base, role_permissions, permissions, 
    roles, students, employees, tenants, users 
    CASCADE;

-- 2. TENANTS
-- Platform Management (id 1)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active) VALUES
('6ce0c3c1-e2e1-480e-b3ba-f2fc24683e4a', 'Platform Management', 'system', 'system.schoolerp.com', '{"is_system": true}', TRUE);

-- Demo School (id 2)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active) VALUES
('528b652b-91aa-498e-b3b5-eab9560b11e5', 'Demo International School', 'demo', 'demo.schoolerp.com', '{"white_label": false}', TRUE);

-- Elite Academy (id 3)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active) VALUES
('b12f5935-76e6-4821-9940-2dd711080a86', 'Elite Academy', 'elite', 'elite.academy.com', '{"white_label": true}', TRUE);

-- 3. PERMISSIONS (id 11-18)
INSERT INTO permissions (id, code, module, description) VALUES
('1aed3003-f825-45fe-99d2-287d12b0b889', 'dashboard:view', 'core', 'Access dashboard'),
('7b1fa784-41f9-43fd-b660-dd2fd7167344', 'sis:read', 'sis', 'View students'),
('b8825ab5-e5f6-4975-b217-eb3707952de5', 'sis:write', 'sis', 'Edit students'),
('4e10c54d-339b-4e28-b62e-2665e8ee5255', 'fees:read', 'fees', 'View fees'),
('d6ec4fcf-ffbc-4b48-b293-0caf60f96272', 'fees:collect', 'fees', 'Collect fees'),
('e30d0645-f58b-4fbb-b7e3-a92fc9b41b88', 'attendance:read', 'attendance', 'View attendance'),
('fee67808-e8b5-4bd6-b28e-9ade116d43d3', 'attendance:write', 'attendance', 'Mark attendance'),
('9af87a43-3066-4dfd-b6ad-295dfdaf726b', 'tenant:manage', 'settings', 'Manage school');

-- 4. ROLES (id 21-26)
INSERT INTO roles (id, tenant_id, name, code, is_system) VALUES
('ad093559-c5b3-43bc-b23f-a2e0ff5249df', NULL, 'Super Admin', 'super_admin', TRUE),
('ec350dec-1c09-40e0-a9f2-b3a2943731bf', NULL, 'Tenant Admin', 'tenant_admin', TRUE),
('0bd964a3-beff-43c6-9293-c1943e390e26', NULL, 'Teacher', 'teacher', TRUE),
('2f3be4c5-d554-4ef3-b1de-150bfb17ad7d', NULL, 'Accountant', 'accountant', TRUE),
('c837c446-6a7d-4a04-90a8-ca7bcbfd56d4', NULL, 'Parent', 'parent', TRUE),
('3c7e8a06-88d8-40a6-a982-5a19309a670b', NULL, 'Student', 'student', TRUE);

-- Map permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 'ec350dec-1c09-40e0-a9f2-b3a2943731bf', id FROM permissions;

-- 5. USERS (id 31-35)
-- SaaS Admin
INSERT INTO users (id, email, phone, full_name, is_active) 
VALUES ('703c80e6-d9bf-4155-bd18-88fa29bae2ac', 'saas_admin@schoolerp.com', '+919999999999', 'System Administrator', TRUE);

-- Demo Admin
INSERT INTO users (id, email, phone, full_name, is_active) 
VALUES ('46739cd1-26a0-40d1-b719-fe4290d16e71', 'admin@demo.school', '+919876543210', 'Demo Admin', TRUE);

-- Demo Teacher
INSERT INTO users (id, email, phone, full_name, is_active) 
VALUES ('87d5a0ac-3293-4bb3-8aa0-fdf2e1a0b2d6', 'teacher@demo.school', '+919876543211', 'Demo Teacher', TRUE);

-- Elite Admin
INSERT INTO users (id, email, phone, full_name, is_active) 
VALUES ('1d04e2c3-7ff9-437d-b59c-c10726eade93', 'admin@elite.academy', '+919876543333', 'Elite Admin', TRUE);

-- 6. IDENTITIES (id 41-45)
INSERT INTO user_identities (id, user_id, provider, identifier, credential) VALUES
('b80f3356-c4a8-461c-99e8-b3e0cec92804', '703c80e6-d9bf-4155-bd18-88fa29bae2ac', 'password', 'saas_admin@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('5f86dc2f-54fc-4a2f-97cd-3d0bb2512ff3', '46739cd1-26a0-40d1-b719-fe4290d16e71', 'password', 'admin@demo.school', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('7bf3b769-4dd6-4a13-9088-444742a76b6d', '87d5a0ac-3293-4bb3-8aa0-fdf2e1a0b2d6', 'password', 'teacher@demo.school', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('f8ff616e-f0c0-4a4a-8afe-53031e4aacc3', '1d04e2c3-7ff9-437d-b59c-c10726eade93', 'password', 'admin@elite.academy', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');

-- 7. ASSIGNMENTS (id 51-55)
-- SaaS Admin (Assigned to Platform Tenant)
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) 
VALUES ('483a784a-cf62-477b-b9b6-e408d7e779ab', '6ce0c3c1-e2e1-480e-b3ba-f2fc24683e4a', '703c80e6-d9bf-4155-bd18-88fa29bae2ac', 'ad093559-c5b3-43bc-b23f-a2e0ff5249df', 'platform');

-- Demo Admin
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) 
VALUES ('9bb357ff-dcae-4ad1-99df-908b121b68bb', '528b652b-91aa-498e-b3b5-eab9560b11e5', '46739cd1-26a0-40d1-b719-fe4290d16e71', 'ec350dec-1c09-40e0-a9f2-b3a2943731bf', 'tenant');

-- Demo Teacher
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) 
VALUES ('f6599a2b-32e5-42b6-a2ed-52a5aadaf0fa', '528b652b-91aa-498e-b3b5-eab9560b11e5', '87d5a0ac-3293-4bb3-8aa0-fdf2e1a0b2d6', '0bd964a3-beff-43c6-9293-c1943e390e26', 'tenant');

-- Elite Admin
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) 
VALUES ('7741d805-db70-4d86-909a-4defa944d843', 'b12f5935-76e6-4821-9940-2dd711080a86', '1d04e2c3-7ff9-437d-b59c-c10726eade93', 'ec350dec-1c09-40e0-a9f2-b3a2943731bf', 'tenant');

COMMIT;
