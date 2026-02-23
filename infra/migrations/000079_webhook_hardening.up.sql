-- 000079_webhook_hardening.up.sql

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    event_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'received', -- 'received', 'processing', 'completed', 'failed'
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, provider, event_id)
);

CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Add unique constraint for online transaction receipts to avoid duplicates
-- Note: transaction_ref is nullable, so we use a partial unique index
CREATE UNIQUE INDEX idx_receipts_tenant_transaction_ref 
ON receipts(tenant_id, transaction_ref) 
WHERE transaction_ref IS NOT NULL AND transaction_ref != '';
