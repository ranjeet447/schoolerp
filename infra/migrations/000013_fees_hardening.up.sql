-- 000013_fees_hardening.up.sql

-- 1. Receipt Numbering Series
CREATE TABLE receipt_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id), -- NULL for all branches
    prefix TEXT NOT NULL, -- "REC/2025/"
    current_number INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, prefix)
);

-- 2. Refunds
CREATE TABLE fee_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    receipt_id UUID NOT NULL REFERENCES receipts(id),
    amount BIGINT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- "pending", "approved", "rejected"
    decided_by UUID REFERENCES users(id),
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhance Receipts with series link
ALTER TABLE receipts ADD COLUMN series_id UUID REFERENCES receipt_series(id);

-- 4. Payment Orders (Pre-receipt)
CREATE TABLE payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    amount BIGINT NOT NULL,
    mode TEXT NOT NULL, -- "online", "offline"
    status TEXT DEFAULT 'pending', -- "pending", "success", "failed"
    external_ref TEXT, -- Gateway txn id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
