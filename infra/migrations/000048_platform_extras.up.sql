BEGIN;

DROP TABLE IF EXISTS platform_notification_templates CASCADE;
DROP TABLE IF EXISTS platform_document_templates CASCADE;
DROP TABLE IF EXISTS platform_announcements CASCADE;
DROP TABLE IF EXISTS platform_changelogs CASCADE;
DROP TABLE IF EXISTS platform_analytics_snapshots CASCADE;
DROP TABLE IF EXISTS platform_master_data_templates CASCADE;

-- PS-003: Notification template manager
CREATE TABLE IF NOT EXISTS platform_notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- email, sms, whatsapp
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PS-006: Document templates
CREATE TABLE IF NOT EXISTS platform_document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'generic', -- report_card, certificate, receipt
    file_url TEXT,
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    template_html TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CM-002: In-app announcement banner
CREATE TABLE IF NOT EXISTS platform_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_cohorts TEXT[] NOT NULL DEFAULT '{}',
    target_tenants UUID[] NOT NULL DEFAULT '{}',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CM-004: Changelog publishing
CREATE TABLE IF NOT EXISTS platform_changelogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- markdown
    type TEXT NOT NULL DEFAULT 'feature', -- feature, improvement, fix, security
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AN-001: Analytics Aggregates
CREATE TABLE IF NOT EXISTS platform_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_analytics_metric_date ON platform_analytics_snapshots(metric_name, snapshot_date);

-- Global master data templates (PS-005)
CREATE TABLE IF NOT EXISTS platform_master_data_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    type TEXT NOT NULL, -- holidays, grade_system, subjects
    name TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add permissions for new modules
INSERT INTO permissions (code, module, description) VALUES
  ('platform:settings.write', 'platform', 'Update global platform settings and templates'),
  ('platform:marketing.write', 'platform', 'Manage announcements, changelogs, and checklists'),
  ('platform:analytics.read', 'platform', 'View business analytics and metrics snapshots')
ON CONFLICT (code) DO NOTHING;

-- Grant to Super Admin
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'super_admin' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
    'platform:settings.write',
    'platform:marketing.write',
    'platform:analytics.read'
)
ON CONFLICT DO NOTHING;

COMMIT;
