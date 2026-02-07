-- Seed Standard Roles and Permissions
-- Based on docs/03-rbac-permissions.md

BEGIN;

-- 1. Clean up existing (optional, careful in prod)
-- TRUNCATE role_permissions, role_assignments, permissions, roles CASCADE;

-- 2. Insert Permissions (Atomic Actions)
INSERT INTO permissions (code, module, description) VALUES
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
('finance:write', 'finance', 'Manage expenses and specialized accounting'),

-- Tenant Management
('tenant:manage', 'tenant', 'Manage tenant settings and users')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Standard Roles
INSERT INTO roles (name, code, description, is_system) VALUES
('Super Admin', 'super_admin', 'Platform wide access', TRUE),
('Tenant Admin', 'tenant_admin', 'School owner/administrator', TRUE),
('Teacher', 'teacher', 'Academic staff', TRUE),
('Accountant', 'accountant', 'Finance and fee collector', TRUE),
('Parent', 'parent', 'Guardian view', TRUE),
('Student', 'student', 'Student view', TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING; -- Note: tenant_id is NULL for system roles

-- 4. Map Roles to Permissions
-- Helper function or direct inserts. Using temporary table for mapping clarity is common, but direct INSERT-SELECT is efficient here.

-- Tenant Admin: All Tenant Level Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'tenant_admin' AND p.code IN (
    'sis:read', 'sis:write', 'sis:delete',
    'fees:read', 'fees:collect', 'fees:manage',
    'attendance:read', 'attendance:write',
    'finance:read', 'finance:write',
    'tenant:manage'
)
ON CONFLICT DO NOTHING;

-- Teacher: Academic + Attendance
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'teacher' AND p.code IN (
    'sis:read', 'sis:write', -- Can edit student details often
    'attendance:read', 'attendance:write',
    'fees:read' -- Often need to see if fees are paid
)
ON CONFLICT DO NOTHING;

-- Accountant: Fees + Finance
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'accountant' AND p.code IN (
    'fees:read', 'fees:collect', 'fees:manage',
    'finance:read', 'finance:write',
    'sis:read'
)
ON CONFLICT DO NOTHING;

-- Parent: Read Only limited
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'parent' AND p.code IN (
    'attendance:read',
    'fees:read',
    'sis:read'
)
ON CONFLICT DO NOTHING;

COMMIT;
