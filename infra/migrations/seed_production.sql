-- SchoolERP DESTRUCTIVE RESET + RESEED
-- WARNING:
--   - this script TRUNCATES core tables
--   - intended for disposable/staging environments
--   - do not run on live production data unless wipe is intentional
--
-- For safe/default seeding (no truncation), use:
--   infra/migrations/seed_users.sql
--
-- Password for all users: "password123" (SHA256: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f)

BEGIN;

-- 1. CLEANUP (Wipe existing data to ensure clean IDs)
TRUNCATE 
    sessions, user_identities, role_assignments, 
    ai_knowledge_base, role_permissions, permissions, 
    roles, students, employees, tenants, users 
    CASCADE;

-- 2. TENANTS
-- Platform Management (Line 1)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active) VALUES
('019c4d42-49ca-7e0a-b047-86336ebac7ae', 'Platform Management', 'system', 'system.schoolerp.com', '{"is_system": true}', TRUE);

-- Demo School (Line 2)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active) VALUES
('019c4d42-49ca-7efe-b28e-6feeebc4cd13', 'Demo International School', 'demo', 'demo.schoolerp.com', '{"white_label": false}', TRUE);

-- Elite Academy (Line 3)
INSERT INTO tenants (id, name, subdomain, domain, config, is_active) VALUES
('019c4d42-49ca-7861-9293-59cbaaea5d14', 'Elite Academy', 'elite', 'elite.academy.com', '{"white_label": true}', TRUE);

-- 3. PERMISSIONS (Lines 11-18)
INSERT INTO permissions (id, code, module, description) VALUES
('019c4d42-49ca-74cf-ad4c-647cbcf6c99b', 'dashboard:view', 'core', 'Access dashboard'),
('019c4d42-49ca-7319-9ad6-e9491c672bd3', 'sis:read', 'sis', 'View students'),
('019c4d42-49ca-7c6c-af4c-f966bf0e59df', 'sis:write', 'sis', 'Edit students'),
('019c4d42-49ca-773d-aea7-34deb37577e1', 'fees:read', 'fees', 'View fees'),
('019c4d42-49ca-761c-aaf8-24e6628c030a', 'fees:collect', 'fees', 'Collect fees'),
('019c4d42-49ca-7f83-b4a1-7408a5b65f0e', 'attendance:read', 'attendance', 'View attendance'),
('019c4d42-49ca-70a7-994c-fc86e052d584', 'attendance:write', 'attendance', 'Mark attendance'),
('019c4d42-49ca-799b-a6bf-971a1e1321f1', 'tenant:manage', 'settings', 'Manage school');

-- 4. ROLES (Lines 21-26)
INSERT INTO roles (id, tenant_id, name, code, is_system) VALUES
('019c4d42-49ca-7166-9de9-5e97220dc819', NULL, 'Super Admin', 'super_admin', TRUE),
('019c4d42-49ca-744e-8547-8071d51aef0d', NULL, 'Tenant Admin', 'tenant_admin', TRUE),
('019c4d42-49ca-7279-8903-5dd40619d787', NULL, 'Teacher', 'teacher', TRUE),
('019c4d42-49ca-7b7a-a200-b3ee92384e98', NULL, 'Accountant', 'accountant', TRUE),
('019c4d42-49ca-7daf-983a-209e52e1371f', NULL, 'Parent', 'parent', TRUE),
('019c4d42-49ca-7f3f-95ce-50b223320178', NULL, 'Student', 'student', TRUE);

-- Map permissions (Tenant Admin gets all)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT '019c4d42-49ca-744e-8547-8071d51aef0d', id FROM permissions;

-- Super Admin gets all permissions (including platform)
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-7166-9de9-5e97220dc819', id FROM permissions;

-- 5. USERS (Lines 31-34)
-- SaaS Admin
INSERT INTO users (id, email, phone, full_name, is_active) 
VALUES ('019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'saas_admin@schoolerp.com', '+919999999999', 'System Administrator', TRUE);

-- Demo Admin
INSERT INTO users (id, email, phone, full_name, is_active) 
VALUES ('019c4d42-49ca-70b0-a772-e58913e13446', 'admin@demo.school', '+919876543210', 'Demo Admin', TRUE);

-- Demo Teacher
INSERT INTO users (id, email, phone, full_name, is_active) 
VALUES ('019c4d42-49ca-765c-a638-deef0366aff8', 'teacher@demo.school', '+919876543211', 'Demo Teacher', TRUE);

-- Elite Admin
INSERT INTO users (id, email, phone, full_name, is_active) 
VALUES ('019c4d42-49ca-7351-a604-7d7bc4b46f54', 'admin@elite.academy', '+919876543333', 'Elite Admin', TRUE);

-- 6. IDENTITIES (Lines 41-44)
INSERT INTO user_identities (id, user_id, provider, identifier, credential) VALUES
('019c4d42-49ca-7593-ad83-721b9b43bc23', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'password', 'saas_admin@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-49ca-7fe1-bc66-a780c450ccff', '019c4d42-49ca-70b0-a772-e58913e13446', 'password', 'admin@demo.school', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-49ca-7c90-8765-83d01b1de50a', '019c4d42-49ca-765c-a638-deef0366aff8', 'password', 'teacher@demo.school', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
('019c4d42-49ca-788c-b6c0-615844439267', '019c4d42-49ca-7351-a604-7d7bc4b46f54', 'password', 'admin@elite.academy', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');

-- 7. ASSIGNMENTS (Lines 51-54)
-- SaaS Admin (Assigned to Platform Tenant)
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) 
VALUES ('019c4d42-49ca-73e1-be64-56377f64b05b', '019c4d42-49ca-7e0a-b047-86336ebac7ae', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', '019c4d42-49ca-7166-9de9-5e97220dc819', 'platform');

-- Demo Admin
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) 
VALUES ('019c4d42-49ca-79d3-9605-35dd2d160a39', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-70b0-a772-e58913e13446', '019c4d42-49ca-744e-8547-8071d51aef0d', 'tenant');

-- Demo Teacher
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) 
VALUES ('019c4d42-49ca-7442-b328-d20c9de8a543', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-765c-a638-deef0366aff8', '019c4d42-49ca-7279-8903-5dd40619d787', 'tenant');

-- Elite Admin
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type) 
VALUES ('019c4d42-49ca-723c-b274-f345b99eb12a', '019c4d42-49ca-7861-9293-59cbaaea5d14', '019c4d42-49ca-7351-a604-7d7bc4b46f54', '019c4d42-49ca-744e-8547-8071d51aef0d', 'tenant');

COMMIT;
