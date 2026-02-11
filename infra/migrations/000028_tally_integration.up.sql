-- 000028_tally_integration.up.sql

CREATE TABLE tally_ledger_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES fee_heads(id) ON DELETE CASCADE,
    tally_ledger_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, fee_head_id)
);

-- Index for mapping lookups
CREATE INDEX idx_tally_mappings_tenant ON tally_ledger_mappings(tenant_id);
