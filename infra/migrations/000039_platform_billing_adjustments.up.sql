-- 000039_platform_billing_adjustments.up.sql

CREATE TABLE IF NOT EXISTS platform_invoice_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES platform_invoices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL, -- refund, credit_note
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'recorded', -- recorded, issued, applied, cancelled
    reason TEXT,
    external_ref TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_invoice_adjustments_invoice_created
    ON platform_invoice_adjustments(invoice_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_invoice_adjustments_tenant_type_status
    ON platform_invoice_adjustments(tenant_id, adjustment_type, status, created_at DESC);
