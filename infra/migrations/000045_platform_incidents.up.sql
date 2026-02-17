BEGIN;

-- Incident management for the SaaS platform ops console.
-- This is intentionally platform-scoped (not tenant data) and can be surfaced in a status-page style UI.

CREATE TABLE IF NOT EXISTS platform_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'investigating', -- investigating, identified, monitoring, resolved
    severity TEXT NOT NULL DEFAULT 'minor', -- minor, major, critical
    scope TEXT NOT NULL DEFAULT 'platform', -- platform, tenant
    affected_tenant_ids UUID[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_incidents_status_created ON platform_incidents(status, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_incident_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES platform_incidents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'update', -- update, note, status_change
    message TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_incident_events_incident_created ON platform_incident_events(incident_id, created_at ASC);

COMMIT;

