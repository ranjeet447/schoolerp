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
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Demo International School',
    'demo',
    'demo.schoolerp.com',
    '{"white_label": false, "branding": {"primary_color": "#4f46e5"}}',
    TRUE
) ON CONFLICT (subdomain) DO NOTHING;

-- Elite Academy (White Labeled)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active)
VALUES (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
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
('11111111-1111-1111-1111-111111111111', NULL, 'Super Admin', 'super_admin', 'Platform wide access', TRUE),
('22222222-2222-2222-2222-222222222222', NULL, 'Tenant Admin', 'tenant_admin', 'School owner/administrator', TRUE),
('33333333-3333-3333-3333-333333333333', NULL, 'Teacher', 'teacher', 'Academic staff', TRUE),
('44444444-4444-4444-4444-444444444444', NULL, 'Accountant', 'accountant', 'Finance and fee collector', TRUE),
('55555555-5555-5555-5555-555555555555', NULL, 'Parent', 'parent', 'Guardian view', TRUE),
('66666666-6666-6666-6666-666666666666', NULL, 'Student', 'student', 'Student view', TRUE)
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
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'admin@school.edu.in',
    '+919876543210',
    'Dr. Admin Kumar',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'password',
    'admin@school.edu.in',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- Teacher User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'teacher@school.edu.in',
    '+919876543211',
    'Ms. Priya Sharma',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'password',
    'teacher@school.edu.in',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- Parent User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'parent@school.edu.in',
    '+919876543212',
    'Mr. Rajesh Patel',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccd',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'password',
    'parent@school.edu.in',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- Accountant User
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'accountant@school.edu.in',
    '+919876543213',
    'Mr. Finance Singh',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    'dddddddd-dddd-dddd-dddd-ddddddddddde',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
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
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'admin@elite.academy',
    '+919876543333',
    'Elite Director',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'password',
    'admin@elite.academy',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- Elite Teacher
INSERT INTO users (id, email, phone, full_name, is_active)
VALUES (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'teacher@elite.academy',
    '+919876543334',
    'Elite Professor',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES (
    'ffffffff-ffff-ffff-ffff-fffffffffffa',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'password',
    'teacher@elite.academy',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
) ON CONFLICT (provider, identifier) DO NOTHING;

-- ASSIGN ROLES
INSERT INTO role_assignments (tenant_id, user_id, role_id, scope_type)
VALUES 
    -- Demo Portal
    ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'tenant'),
    ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'tenant'),
    ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'tenant'),
    ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'tenant'),
    
    -- Elite Portal
    ((SELECT id FROM tenants WHERE subdomain = 'elite'), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'tenant'),
    ((SELECT id FROM tenants WHERE subdomain = 'elite'), 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'tenant')
ON CONFLICT DO NOTHING;


COMMIT;

-- ============================================
-- TEST CREDENTIALS
-- ============================================
-- | Email                  | Password    | Role        |
-- |------------------------|-------------|-------------|
-- | admin@school.edu.in       | password123 | Tenant Admin|
-- | teacher@school.edu.in     | password123 | Teacher     |
-- | parent@school.edu.in      | password123 | Parent      |
-- | accountant@school.edu.in  | password123 | Accountant  |
