-- Comprehensive Seed Script for SchoolERP
-- Seeds: Tenants, Users, Roles, Permissions, Role Assignments
-- Password for all test users: "password123"
-- SHA256 hash of "password123": ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

BEGIN;

-- ============================================
-- 1. SEED TENANT (Demo School)
-- ============================================
-- Demo International School (Standard)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active)
VALUES (
    '96dce8ae-18b1-4d3c-8a09-11341b1d3a0f',
    'Demo International School',
    'demo',
    'demo.schoolerp.com',
    '{"white_label": false, "branding": {"primary_color": "#4f46e5"}}',
    TRUE
) ON CONFLICT (subdomain) DO NOTHING;

-- Elite Academy (White Labeled)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active)
VALUES (
    '5482c5f8-86e7-4655-a9af-5235d61fe7a8',
    'Elite Academy',
    'elite',
    'elite.academy.com',
    '{"white_label": true, "branding": {"primary_color": "#be123c", "name_override": "Elite LMS"}}',
    TRUE
) ON CONFLICT (subdomain) DO NOTHING;

-- ============================================
-- 2. SEED PERMISSIONS
-- ============================================
INSERT INTO permissions (code, module, description) VALUES
-- Core Module
('dashboard:view', 'core', 'Access the administration dashboard'),

-- SIS Module
('sis:read', 'sis', 'View student profiles'),
('sis:write', 'sis', 'Create/Edit student profiles'),
('sis:delete', 'sis', 'Delete student profiles'),

-- Fees Module
('fees:read', 'fees', 'View fee structures and payments'),
('fees:collect', 'fees', 'Collect fee payments'),
('fees:manage', 'fees', 'Manage fee structures and concessions'),

-- Attendance Module
('attendance:read', 'attendance', 'View attendance records'),
('attendance:write', 'attendance', 'Mark/Edit attendance'),

-- Finance/Accounting
('finance:read', 'finance', 'View financial reports'),
('finance:write', 'finance', 'Manage expenses and accounting'),

-- Tenant Management
('tenant:settings:view', 'settings', 'View school settings'),
('tenant:roles:manage', 'settings', 'Manage roles and permissions'),
('tenant:users:manage', 'settings', 'Manage staff accounts'),

-- Exams Module
('exams:read', 'exams', 'View exam results'),
('exams:write', 'exams', 'Create exams and enter marks'),

-- Notices Module
('notices:read', 'notices', 'View notices'),
('notices:write', 'notices', 'Create and publish notices'),

-- Transport Module
('transport:read', 'transport', 'View routes and stops'),
('transport:write', 'transport', 'Manage transport routes'),

-- Library Module
('library:read', 'library', 'View and search books'),
('library:write', 'library', 'Manage library inventory and issues'),

-- Inventory Module
('inventory:read', 'inventory', 'View stock and items'),
('inventory:write', 'inventory', 'Manage inventory and POs')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. SEED ROLES (Platform-wide)
-- ============================================
INSERT INTO roles (id, tenant_id, name, code, description, is_system) VALUES
('6fb79fd2-bb41-4d41-bac6-cfaca9dbf1ee', NULL, 'Super Admin', 'super_admin', 'Platform wide access', TRUE),
('cf7410be-f1e3-49f4-bfa1-e4eccc941fdd', NULL, 'Tenant Admin', 'tenant_admin', 'School owner/administrator', TRUE),
('7574705b-9e25-4583-adca-b7d3150c1213', NULL, 'Teacher', 'teacher', 'Academic staff', TRUE),
('3842893d-9222-4dbe-885d-7c34293e9220', NULL, 'Accountant', 'accountant', 'Finance and fee collector', TRUE),
('c615adfa-1393-4a8f-815a-e8f7ae1ac5d7', NULL, 'Parent', 'parent', 'Guardian view', TRUE),
('6fb13f8c-dc6c-4b88-a153-99c98c0fe0dc', NULL, 'Student', 'student', 'Student view', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. MAP ROLES TO PERMISSIONS
-- ============================================
-- Tenant Admin: Full Access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM permissions
WHERE code IN ('dashboard:view', 'sis:read', 'sis:write', 'sis:delete', 'fees:read', 'fees:collect', 'fees:manage', 
               'attendance:read', 'attendance:write', 'finance:read', 'finance:write', 
               'tenant:settings:view', 'tenant:roles:manage', 'tenant:users:manage',
               'exams:read', 'exams:write', 'notices:read', 'notices:write',
               'transport:read', 'transport:write', 'library:read', 'library:write',
               'inventory:read', 'inventory:write')
ON CONFLICT DO NOTHING;

-- Teacher: Academic + Attendance
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM permissions
WHERE code IN ('sis:read', 'sis:write', 'attendance:read', 'attendance:write', 'exams:read', 'exams:write', 'notices:read', 'notices:write')
ON CONFLICT DO NOTHING;

-- Accountant: Fee Collection + Finance
INSERT INTO role_permissions (role_id, permission_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM permissions
WHERE code IN ('sis:read', 'fees:read', 'fees:collect', 'fees:manage', 'finance:read', 'finance:write')
ON CONFLICT DO NOTHING;

-- Parent: Read Only
INSERT INTO role_permissions (role_id, permission_id)
SELECT '55555555-5555-5555-5555-555555555555', id FROM permissions
WHERE code IN ('sis:read', 'attendance:read', 'fees:read', 'exams:read', 'notices:read')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. SEED TEST USERS
-- ============================================
-- Admin User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    'bffda29e-b791-4dd0-8a10-532c7b487d97',
    'admin@school.edu.in',
    '+919876543210',
    'Dr. Admin Kumar',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    '11ea3c55-2e78-49de-861b-e5fd78eb7363',
    'bffda29e-b791-4dd0-8a10-532c7b487d97',
    'password',
    'admin@school.edu.in',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- Teacher User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    '595fa4b0-62fe-4b7c-a8c4-c0696228b952',
    'teacher@school.edu.in',
    '+919876543211',
    'Ms. Priya Sharma',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    '1e8093f7-1cdf-4ca9-80c5-4f6b932b63ce',
    '595fa4b0-62fe-4b7c-a8c4-c0696228b952',
    'password',
    'teacher@school.edu.in',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- Parent User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    '5b0b28fd-af68-4046-9d8a-bd615612a3c1',
    'parent@school.edu.in',
    '+919876543212',
    'Mr. Rajesh Patel',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    'd1df5d08-2d2c-4bf2-b433-2248df8eb49b',
    '5b0b28fd-af68-4046-9d8a-bd615612a3c1',
    'password',
    'parent@school.edu.in',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- Accountant User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    '6541a882-63f4-4ad2-9345-a01cd56ee4b1',
    'accountant@school.edu.in',
    '+919876543213',
    'Mr. Finance Singh',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    '6a90848b-deeb-4a33-b27e-363a3e47f9a0',
    '6541a882-63f4-4ad2-9345-a01cd56ee4b1',
    'password',
    'accountant@school.edu.in',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- ============================================
-- 6. ASSIGN ROLES TO USERS
-- ============================================
-- Elite Admin
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    '8900e5b5-e907-4eab-a1aa-17d9f89d39a4',
    'admin@elite.academy',
    '+919876543333',
    'Elite Director',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    '79acb6c0-e483-415e-a8ea-0590699e8e13',
    '8900e5b5-e907-4eab-a1aa-17d9f89d39a4',
    'password',
    'admin@elite.academy',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- Elite Teacher
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    'd5495d0f-d0cb-46f5-ad3f-88b0cc6fc127',
    'teacher@elite.academy',
    '+919876543334',
    'Elite Professor',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    '7ac97399-3572-416e-b02f-38018fb5a338',
    'd5495d0f-d0cb-46f5-ad3f-88b0cc6fc127',
    'password',
    'teacher@elite.academy',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- ASSIGN ROLES
INSERT INTO role_assignments (tenant_id, user_id, role_id, scope_type)
VALUES 
    -- Demo Portal
    ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'bffda29e-b791-4dd0-8a10-532c7b487d97', 'cf7410be-f1e3-49f4-bfa1-e4eccc941fdd', 'tenant'),
    ((SELECT id FROM tenants WHERE subdomain = 'demo'), '595fa4b0-62fe-4b7c-a8c4-c0696228b952', '7574705b-9e25-4583-adca-b7d3150c1213', 'tenant'),
    ((SELECT id FROM tenants WHERE subdomain = 'demo'), '5b0b28fd-af68-4046-9d8a-bd615612a3c1', 'c615adfa-1393-4a8f-815a-e8f7ae1ac5d7', 'tenant'),
    ((SELECT id FROM tenants WHERE subdomain = 'demo'), '6541a882-63f4-4ad2-9345-a01cd56ee4b1', '3842893d-9222-4dbe-885d-7c34293e9220', 'tenant'),
    
    -- Elite Portal
    ((SELECT id FROM tenants WHERE subdomain = 'elite'), '8900e5b5-e907-4eab-a1aa-17d9f89d39a4', 'cf7410be-f1e3-49f4-bfa1-e4eccc941fdd', 'tenant'),
    ((SELECT id FROM tenants WHERE subdomain = 'elite'), 'd5495d0f-d0cb-46f5-ad3f-88b0cc6fc127', '7574705b-9e25-4583-adca-b7d3150c1213', 'tenant')
ON CONFLICT DO NOTHING;


COMMIT;

-- ============================================
-- TEST CREDENTIALS
-- ============================================
-- | Email                  | Password    | Role        |
-- |------------------------|-------------|-------------|
-- | admin@school.edu.in    | password123 | Tenant Admin|
-- | teacher@school.edu.in  | password123 | Teacher     |
-- | parent@school.edu.in   | password123 | Parent      |
-- | accountant@school.edu.in| password123 | Accountant  |
