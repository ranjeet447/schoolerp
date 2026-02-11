-- SchoolERP User Seeding (v7)
-- Consolidated Seed Script: Tenants, Users, Roles, Permissions, Role Assignments
-- USES UNIQUE UUID v7 FROM USER LIST

BEGIN;

-- 1. SEED TENANTS
INSERT INTO tenants (id, name, subdomain, domain, config, is_active)
VALUES (
    '019c4d42-49ca-7efe-b28e-6feeebc4cd13',
    'Demo International School',
    'demo',
    'demo.schoolerp.com',
    '{"white_label": false}',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 2. SEED PERMISSIONS
INSERT INTO permissions (id, code, module, description) VALUES
('019c4d42-49ca-74cf-ad4c-647cbcf6c99b', 'dashboard:view', 'core', 'Access the administration dashboard'),
('019c4d42-49ca-7319-9ad6-e9491c672bd3', 'sis:read', 'sis', 'View student profiles'),
('019c4d42-49ca-7c6c-af4c-f966bf0e59df', 'sis:write', 'sis', 'Create/Edit student profiles'),
('019c4d42-49ca-773d-aea7-34deb37577e1', 'fees:read', 'fees', 'View fee structures'),
('019c4d42-49ca-761c-aaf8-24e6628c030a', 'fees:collect', 'fees', 'Collect fee payments'),
('019c4d42-49ca-7f83-b4a1-7408a5b65f0e', 'attendance:read', 'attendance', 'View attendance'),
('019c4d42-49ca-70a7-994c-fc86e052d584', 'attendance:write', 'attendance', 'Mark attendance'),
('019c4d42-49ca-799b-a6bf-971a1e1321f1', 'tenant:manage', 'settings', 'Manage school settings')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED ROLES
INSERT INTO roles (id, tenant_id, name, code, is_system) VALUES
('019c4d42-49ca-7166-9de9-5e97220dc819', NULL, 'Super Admin', 'super_admin', TRUE),
('019c4d42-49ca-744e-8547-8071d51aef0d', NULL, 'Tenant Admin', 'tenant_admin', TRUE),
('019c4d42-49ca-7279-8903-5dd40619d787', NULL, 'Teacher', 'teacher', TRUE),
('019c4d42-49ca-7b7a-a200-b3ee92384e98', NULL, 'Accountant', 'accountant', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. MAP PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-744e-8547-8071d51aef0d', id FROM permissions ON CONFLICT DO NOTHING;

-- 5. SEED USERS
-- SaaS Admin
INSERT INTO users (id, email, full_name, is_active)
VALUES ('019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'saas_admin@schoolerp.com', 'SaaS Platform Admin', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('019c4d42-49ca-7593-ad83-721b9b43bc23', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'password', 'saas_admin@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (id) DO NOTHING;

-- Demo School Admin
INSERT INTO users (id, email, full_name, is_active)
VALUES ('019c4d42-49ca-70b0-a772-e58913e13446', 'admin@demo.school', 'Demo School Admin', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('019c4d42-49ca-7fe1-bc66-a780c450ccff', '019c4d42-49ca-70b0-a772-e58913e13446', 'password', 'admin@demo.school', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (id) DO NOTHING;

-- 6. ASSIGN ROLES
-- Note: SaaS Admin assigned to Platform Tenant (v7 mapping)
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('019c4d42-49ca-73e1-be64-56377f64b05b', '019c4d42-49ca-7e0a-b047-86336ebac7ae', '019c4d42-49ca-767c-b3bd-b1a7faf5ad04', '019c4d42-49ca-7166-9de9-5e97220dc819', 'platform')
ON CONFLICT DO NOTHING;

INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('019c4d42-49ca-79d3-9605-35dd2d160a39', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', '019c4d42-49ca-70b0-a772-e58913e13446', '019c4d42-49ca-744e-8547-8071d51aef0d', 'tenant')
ON CONFLICT DO NOTHING;

COMMIT;
