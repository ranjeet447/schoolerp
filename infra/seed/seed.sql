-- seed.sql

-- 1. Platforms Roles & Permissions
INSERT INTO permissions (code, module, description) VALUES
('tenant:manage', 'saas', 'Manage tenants and plans'),
('rbac:manage', 'governance', 'Manage roles and assignments'),
('audit:read', 'governance', 'Read audit logs'),
('sis:read', 'academic', 'Read student information'),
('sis:write', 'academic', 'Create/Update students'),
('fees:manage', 'finance', 'Manage fees and receipts');

-- Default Platform Roles
INSERT INTO roles (name, code, description, is_system) VALUES
('SaaS Super Admin', 'super_admin', 'Global platform manager', TRUE);

-- Link Super Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE code = 'super_admin'), id FROM permissions;

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
END $$;
