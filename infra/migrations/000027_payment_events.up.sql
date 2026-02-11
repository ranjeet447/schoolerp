-- 000027_payment_events.up.sql

CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    gateway_event_id TEXT NOT NULL, -- Razorpay's internal event ID
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, gateway_event_id)
);

-- Index for idempotency checks
CREATE INDEX idx_payment_events_gateway_id ON payment_events(tenant_id, gateway_event_id);
