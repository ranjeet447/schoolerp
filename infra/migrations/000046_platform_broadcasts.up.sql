BEGIN;

-- Platform broadcast notifications for incident response and operations.
-- Broadcasts are platform-scoped and can target one or more tenants. Delivery is queued via the outbox.

CREATE TABLE IF NOT EXISTS platform_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES platform_incidents(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    channels TEXT[] NOT NULL DEFAULT '{in_app}',
    tenant_ids UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, failed
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_broadcasts_incident_created ON platform_broadcasts(incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_broadcasts_status_created ON platform_broadcasts(status, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_broadcast_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID NOT NULL REFERENCES platform_broadcasts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outbox_id UUID REFERENCES outbox(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, completed, failed
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_broadcast_deliveries_broadcast ON platform_broadcast_deliveries(broadcast_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_broadcast_deliveries_tenant_status ON platform_broadcast_deliveries(tenant_id, status);

COMMIT;

