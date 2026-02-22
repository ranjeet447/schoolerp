-- 000062_notification_gateways.up.sql

CREATE TABLE notification_gateway_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('smshorizon', 'twilio', 'gupshup', 'aws_sns')),
    api_key TEXT,
    api_secret TEXT, -- Can be username or secret
    sender_id TEXT,
    is_active BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

CREATE INDEX idx_notification_gateway_config ON notification_gateway_configs(tenant_id, is_active);

-- Register a migration version if there's a migration tracker table
-- INSERT INTO schema_migrations (version, dirty) VALUES (62, false);
