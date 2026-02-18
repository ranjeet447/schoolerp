-- SchoolERP SAFE BOOTSTRAP SEED (non-destructive)
-- PURPOSE:
--   - idempotent baseline data for auth/login and initial demo usage
--   - safe to run repeatedly in shared/dev/prod environments
-- BEHAVIOR:
--   - NO TRUNCATE / NO DELETE
--   - uses ON CONFLICT upserts where possible
--
-- If you need a destructive full reset, run:
--   infra/migrations/seed_production.sql
--
-- Default credentials (password for all): password123
--   saas_admin@schoolerp.com
--   admin@demo.school
--   teacher@demo.school
--   admin@school.edu.in

BEGIN;

-- 1. SEED TENANTS
INSERT INTO tenants (id, name, subdomain, domain, config, is_active) VALUES
(
    '019c4d42-49ca-7e0a-b047-86336ebac7ae',
    'Platform Management',
    'system',
    'system.schoolerp.com',
    '{"is_system": true}',
    TRUE
),
(
    '019c4d42-49ca-7efe-b28e-6feeebc4cd13',
    'Demo International School',
    'demo',
    'demo.schoolerp.com',
    '{"white_label": false}',
    TRUE
) ON CONFLICT (subdomain) DO UPDATE
SET
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    config = EXCLUDED.config,
    is_active = EXCLUDED.is_active;

-- 2. SEED PERMISSIONS
INSERT INTO permissions (id, code, module, description) VALUES
('019c4d42-49ca-74cf-ad4c-647cbcf6c99b', 'dashboard:view', 'core', 'Access the administration dashboard'),
('019c4d42-49ca-7319-9ad6-e9491c672bd3', 'sis:read', 'sis', 'View student profiles'),
('019c4d42-49ca-7c6c-af4c-f966bf0e59df', 'sis:write', 'sis', 'Create/Edit student profiles'),
('019c4d42-49ca-773d-aea7-34deb37577e1', 'fees:read', 'fees', 'View fee structures'),
('019c4d42-49ca-761c-aaf8-24e6628c030a', 'fees:collect', 'fees', 'Collect fee payments'),
('019c4d42-49ca-7f83-b4a1-7408a5b65f0e', 'attendance:read', 'attendance', 'View attendance'),
('019c4d42-49ca-70a7-994c-fc86e052d584', 'attendance:write', 'attendance', 'Mark attendance'),
('019c4d42-49ca-799b-a6bf-971a1e1321f1', 'tenant:manage', 'settings', 'Manage school settings'),
-- Platform Permissions
('019c4d42-49ca-766b-af08-9fc7f638f168', 'platform:tenant.read', 'platform', 'View tenant directory and tenant profile'),
('019c4d42-49ca-7e5b-9c2d-6c1ff19a3ee3', 'platform:tenant.write', 'platform', 'Update tenant settings and lifecycle state'),
('019c4d42-49ca-78ab-9895-9f60ac891674', 'platform:billing.read', 'platform', 'View subscriptions, invoices, and collections'),
('019c4d42-49ca-7f70-8043-a72182ee56f6', 'platform:billing.write', 'platform', 'Mutate subscriptions, invoices, and lockout controls'),
('019c4d42-49ca-7b81-a6a3-548c83d93975', 'platform:user.read', 'platform', 'View internal platform users and role assignments'),
('019c4d42-49ca-7d84-bbe8-c769d683537c', 'platform:user.write', 'platform', 'Create/update internal platform users and role assignments'),
('019c4d42-49ca-7ca0-b44e-4eabca67c940', 'platform:audit.read', 'platform', 'View platform audit logs and security trails'),
('019c4d42-49ca-7710-958d-61af060c72be', 'platform:impersonation.use', 'platform', 'Use login-as tenant admin controls'),
('019c4d42-49ca-7c3c-8dd7-f5428fba5fdc', 'platform:ops.manage', 'platform', 'Manage incident, queue, and reliability operations'),
('019c4d42-49ca-7bb8-ade4-607aae4e6554', 'platform:dev.manage', 'platform', 'Access developer-only tooling and controls'),
('019c4d42-49ca-7e3a-a998-b5cd5afdc6bc', 'platform:integrations.manage', 'platform', 'Manage API keys, webhooks, and integrations'),
('019c4d42-49ca-71b6-a4a7-2981fea25b77', 'platform:monitoring.read', 'platform', 'View monitoring and system health dashboards'),
('019c4d42-49ca-7ca2-b591-6268f8b71787', 'platform:settings.write', 'platform', 'Manage platform-wide settings and templates'),
('019c4d42-49ca-7cee-85c2-768c45d6187b', 'platform:marketing.write', 'platform', 'Manage platform announcements and changelogs'),
('019c4d42-49ca-782c-922b-9f8f7e7a4950', 'platform:analytics.read', 'platform', 'View business and platform analytics dashboard')
ON CONFLICT (code) DO UPDATE
SET
    module = EXCLUDED.module,
    description = EXCLUDED.description;

-- 3. SEED ROLES
INSERT INTO roles (id, tenant_id, name, code, is_system) VALUES
('019c4d42-49ca-7166-9de9-5e97220dc819', NULL, 'Super Admin', 'super_admin', TRUE),
('019c4d42-49ca-744e-8547-8071d51aef0d', NULL, 'Tenant Admin', 'tenant_admin', TRUE),
('019c4d42-49ca-7279-8903-5dd40619d787', NULL, 'Teacher', 'teacher', TRUE),
('019c4d42-49ca-7b7a-a200-b3ee92384e98', NULL, 'Accountant', 'accountant', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. MAP PERMISSIONS
-- Tenant Admin: Tenant-level only
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-744e-8547-8071d51aef0d', id 
FROM permissions 
WHERE code NOT LIKE 'platform:%'
ON CONFLICT DO NOTHING;

-- Super Admin: Everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT '019c4d42-49ca-7166-9de9-5e97220dc819', id 
FROM permissions
ON CONFLICT DO NOTHING;

-- 5. SEED USERS
-- SaaS Admin
INSERT INTO users (id, email, full_name, is_active)
VALUES ('019c4d42-49ca-767c-b3bd-b1a7faf5ad04', 'saas_admin@schoolerp.com', 'SaaS Platform Admin', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('019c4d42-49ca-7593-ad83-721b9b43bc23', (SELECT id FROM users WHERE email = 'saas_admin@schoolerp.com'), 'password', 'saas_admin@schoolerp.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (provider, identifier) DO UPDATE
SET
    user_id = EXCLUDED.user_id,
    credential = EXCLUDED.credential;

-- Demo School Admin
INSERT INTO users (id, email, full_name, is_active)
VALUES ('019c4d42-49ca-70b0-a772-e58913e13446', 'admin@demo.school', 'Demo School Admin', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('019c4d42-49ca-7fe1-bc66-a780c450ccff', (SELECT id FROM users WHERE email = 'admin@demo.school'), 'password', 'admin@demo.school', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (provider, identifier) DO UPDATE
SET
    user_id = EXCLUDED.user_id,
    credential = EXCLUDED.credential;

-- Demo Teacher
INSERT INTO users (id, email, full_name, is_active)
VALUES ('019c4d42-49ca-765c-a638-deef0366aff8', 'teacher@demo.school', 'Demo Teacher', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('019c4d42-49ca-7c90-8765-83d01b1de50a', (SELECT id FROM users WHERE email = 'teacher@demo.school'), 'password', 'teacher@demo.school', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (provider, identifier) DO UPDATE
SET
    user_id = EXCLUDED.user_id,
    credential = EXCLUDED.credential;

-- School Admin alias used in login UI examples
INSERT INTO users (id, email, full_name, is_active)
VALUES ('3b74529c-6f73-4f3f-bde2-5811765ffdf7', 'admin@school.edu.in', 'School Admin India', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_identities (id, user_id, provider, identifier, credential)
VALUES ('fca9a6cf-66c0-4c59-b8b2-061d5dd180cc', (SELECT id FROM users WHERE email = 'admin@school.edu.in'), 'password', 'admin@school.edu.in', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
ON CONFLICT (provider, identifier) DO UPDATE
SET
    user_id = EXCLUDED.user_id,
    credential = EXCLUDED.credential;

-- 6. ASSIGN ROLES
-- Note: SaaS Admin assigned to Platform Tenant (v7 mapping)
INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('019c4d42-49ca-73e1-be64-56377f64b05b', '019c4d42-49ca-7e0a-b047-86336ebac7ae', (SELECT id FROM users WHERE email = 'saas_admin@schoolerp.com'), '019c4d42-49ca-7166-9de9-5e97220dc819', 'platform')
ON CONFLICT DO NOTHING;

INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('019c4d42-49ca-79d3-9605-35dd2d160a39', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', (SELECT id FROM users WHERE email = 'admin@demo.school'), '019c4d42-49ca-744e-8547-8071d51aef0d', 'tenant')
ON CONFLICT DO NOTHING;

INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('019c4d42-49ca-7442-b328-d20c9de8a543', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', (SELECT id FROM users WHERE email = 'teacher@demo.school'), '019c4d42-49ca-7279-8903-5dd40619d787', 'tenant')
ON CONFLICT DO NOTHING;

INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_type)
VALUES ('11dd08d1-93f1-4ab6-8f25-ffdcf08f06e2', '019c4d42-49ca-7efe-b28e-6feeebc4cd13', (SELECT id FROM users WHERE email = 'admin@school.edu.in'), '019c4d42-49ca-744e-8547-8071d51aef0d', 'tenant')
ON CONFLICT DO NOTHING;

COMMIT;
