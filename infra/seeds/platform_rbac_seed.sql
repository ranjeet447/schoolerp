-- SchoolERP COMPREHENSIVE RBAC SEED
-- Ensures all platform roles have correct, granular permissions.
-- Safe to re-run (uses ON CONFLICT DO NOTHING).

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1. PLATFORM PERMISSIONS — granular per-module/per-action
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO permissions (code, module, description) VALUES
  -- Tenant Management
  ('platform:tenants.read',        'tenants',       'View tenant directory and profiles'),
  ('platform:tenants.write',       'tenants',       'Create, update, and manage tenant lifecycle'),
  ('platform:tenants.delete',      'tenants',       'Request and execute tenant deletion'),

  -- Billing & Plans
  ('platform:billing.read',        'billing',       'View subscriptions, invoices, and collections'),
  ('platform:billing.write',       'billing',       'Manage subscriptions, dunning, locks, and freezes'),
  ('platform:plans.read',          'plans',         'View platform plans'),
  ('platform:plans.write',         'plans',         'Create and modify platform plans'),

  -- User Management
  ('platform:user.read',           'users',         'View internal and global user directory'),
  ('platform:user.write',          'users',         'Create, update, and manage user accounts'),
  ('platform:user.impersonate',    'users',         'Impersonate tenant admin accounts'),
  ('platform:user.password_reset', 'users',         'Reset passwords for any user'),

  -- Support & Incidents
  ('platform:support.read',        'support',       'View support tickets'),
  ('platform:support.write',       'support',       'Create, assign, and resolve support tickets'),
  ('platform:incidents.read',      'incidents',     'View service incidents'),
  ('platform:incidents.write',     'incidents',     'Create, update, and resolve incidents'),

  -- Marketing & Communications
  ('platform:marketing.read',      'marketing',     'View announcements and changelogs'),
  ('platform:marketing.write',     'marketing',     'Create and publish announcements and changelogs'),

  -- Analytics & Monitoring
  ('platform:analytics.read',      'analytics',     'View revenue and business analytics'),
  ('platform:monitoring.read',     'monitoring',    'View system health and queue telemetry'),
  ('platform:monitoring.write',    'monitoring',    'Manage queue operations and system actions'),

  -- Security & Audit
  ('platform:security.read',       'security',      'View security events and threat data'),
  ('platform:security.write',      'security',      'Manage security blocks and risk actions'),
  ('platform:audit.read',          'audit',         'View platform audit trails'),
  ('platform:audit.export',        'audit',         'Export audit logs'),

  -- Integrations & Infrastructure
  ('platform:integrations.read',   'integrations',  'View integration health and logs'),
  ('platform:integrations.write',  'integrations',  'Manage webhooks, API keys, and configs'),
  ('platform:addons.read',         'addons',        'View tenant add-ons and activation requests'),
  ('platform:addons.write',        'addons',        'Configure tenant add-ons and process activation requests'),

  -- Global Config & Settings
  ('platform:settings.read',       'settings',      'View platform settings and templates'),
  ('platform:settings.write',      'settings',      'Modify platform settings, password policies, and templates'),

  -- Data Operations
  ('platform:data.export',         'data_ops',      'Run tenant and platform data exports'),
  ('platform:data.restore',        'data_ops',      'Execute restore and destructive data workflows'),

  -- Legal & Compliance
  ('platform:legal.read',          'legal',         'View legal documents and policies'),
  ('platform:legal.write',         'legal',         'Publish and manage legal document versions'),

  -- Platform Secrets
  ('platform:secrets.read',        'secrets',       'View platform secrets inventory'),
  ('platform:secrets.write',       'secrets',       'Create, rotate, and revoke secrets'),

  -- Signup Requests
  ('platform:signup.read',         'signup',        'View tenant signup/onboarding requests'),
  ('platform:signup.write',        'signup',        'Approve or reject signup requests')
ON CONFLICT (code) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- 2. ROLE PERMISSION ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════════════

-- ── super_admin: ALL permissions ──────────────────────────────────
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'super_admin' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code LIKE 'platform:%'
ON CONFLICT DO NOTHING;


-- ── support_l1: Read-only + basic support ─────────────────────────
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'support_l1' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenants.read',
  'platform:billing.read',
  'platform:plans.read',
  'platform:user.read',
  'platform:support.read',
  'platform:support.write',
  'platform:incidents.read',
  'platform:marketing.read',
  'platform:analytics.read',
  'platform:monitoring.read',
  'platform:security.read',
  'platform:audit.read',
  'platform:integrations.read',
  'platform:addons.read',
  'platform:settings.read',
  'platform:legal.read',
  'platform:signup.read'
)
ON CONFLICT DO NOTHING;


-- ── support_l2: L1 permissions + escalation powers ────────────────
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'support_l2' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenants.read',
  'platform:tenants.write',
  'platform:billing.read',
  'platform:billing.write',
  'platform:plans.read',
  'platform:user.read',
  'platform:user.write',
  'platform:user.impersonate',
  'platform:user.password_reset',
  'platform:support.read',
  'platform:support.write',
  'platform:incidents.read',
  'platform:incidents.write',
  'platform:marketing.read',
  'platform:analytics.read',
  'platform:monitoring.read',
  'platform:monitoring.write',
  'platform:security.read',
  'platform:audit.read',
  'platform:audit.export',
  'platform:integrations.read',
  'platform:addons.read',
  'platform:settings.read',
  'platform:legal.read',
  'platform:signup.read',
  'platform:signup.write',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;


-- ── finance: Billing-focused permissions ──────────────────────────
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'finance' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenants.read',
  'platform:billing.read',
  'platform:billing.write',
  'platform:plans.read',
  'platform:plans.write',
  'platform:user.read',
  'platform:analytics.read',
  'platform:audit.read',
  'platform:audit.export',
  'platform:signup.read',
  'platform:data.export',
  'platform:legal.read'
)
ON CONFLICT DO NOTHING;


-- ── ops: Operations and lifecycle management ──────────────────────
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'ops' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenants.read',
  'platform:tenants.write',
  'platform:billing.read',
  'platform:billing.write',
  'platform:plans.read',
  'platform:user.read',
  'platform:user.impersonate',
  'platform:support.read',
  'platform:support.write',
  'platform:incidents.read',
  'platform:incidents.write',
  'platform:marketing.read',
  'platform:marketing.write',
  'platform:monitoring.read',
  'platform:monitoring.write',
  'platform:security.read',
  'platform:audit.read',
  'platform:integrations.read',
  'platform:settings.read',
  'platform:signup.read',
  'platform:signup.write',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;


-- ── developer: Technical and integration access ───────────────────
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'developer' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenants.read',
  'platform:user.read',
  'platform:monitoring.read',
  'platform:monitoring.write',
  'platform:integrations.read',
  'platform:integrations.write',
  'platform:addons.read',
  'platform:addons.write',
  'platform:settings.read',
  'platform:secrets.read',
  'platform:secrets.write',
  'platform:audit.read',
  'platform:data.export',
  'platform:security.read'
)
ON CONFLICT DO NOTHING;

COMMIT;
