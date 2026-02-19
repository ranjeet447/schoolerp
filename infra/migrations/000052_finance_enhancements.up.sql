-- 000052_finance_enhancements.up.sql

-- Late Fee Rules
CREATE TABLE IF NOT EXISTS fee_late_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fee_head_id UUID REFERENCES fee_heads(id) ON DELETE CASCADE, -- Optional: Specific head or all
    rule_type VARCHAR(20) NOT NULL, -- 'fixed', 'daily'
    amount NUMERIC(12, 2) NOT NULL,
    grace_days INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, fee_head_id)
);

-- Concession/Discount Rules
CREATE TABLE IF NOT EXISTS fee_concession_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    value NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'sibling', 'employee', 'scholarship', 'special'
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Concessions (Applied)
CREATE TABLE IF NOT EXISTS student_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES fee_concession_rules(id) ON DELETE CASCADE,
    approved_by UUID, -- employee_id
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, rule_id)
);

-- Indices
CREATE INDEX idx_fee_late_rules_tenant ON fee_late_rules(tenant_id);
CREATE INDEX idx_fee_concession_rules_tenant ON fee_concession_rules(tenant_id);
