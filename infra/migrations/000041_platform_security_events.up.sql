-- 000041_platform_security_events.up.sql

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role_name TEXT,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info', -- info, warning, critical
    method TEXT,
    path TEXT,
    status_code INT,
    ip_address TEXT,
    user_agent TEXT,
    origin TEXT,
    request_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_created_at ON security_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_created_at ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type_created_at ON security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity_created_at ON security_events(severity, created_at DESC);
