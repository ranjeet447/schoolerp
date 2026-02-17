-- 000038_platform_billing_invoices.up.sql

CREATE TABLE IF NOT EXISTS platform_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'INR',
    amount_total BIGINT NOT NULL,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, issued, paid, overdue, cancelled
    due_date TIMESTAMPTZ,
    issued_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    external_ref TEXT,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_invoices_tenant_status ON platform_invoices(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_number ON platform_invoices(invoice_number);
