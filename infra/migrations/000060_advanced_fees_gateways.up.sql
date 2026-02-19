-- 000060_advanced_fees_gateways.up.sql

-- 1. Yearly Fee Setup by Class (Dynamic Configuration)
CREATE TABLE fee_class_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    fee_head_id UUID NOT NULL REFERENCES fee_heads(id),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, academic_year_id, class_id, fee_head_id)
);

-- 2. Scholarships & Discounts
CREATE TABLE fee_discounts_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Merit Scholarship", "Staff Child Discount"
    type TEXT NOT NULL CHECK (type IN ('percentage', 'flat_amount')),
    value DECIMAL(12, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    scholarship_id UUID NOT NULL REFERENCES fee_discounts_scholarships(id),
    academic_year_id UUID REFERENCES academic_years(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, student_id, scholarship_id, academic_year_id)
);

-- 3. Payment Gateway Configuration (Multi-Tenant)
CREATE TABLE payment_gateway_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('razorpay', 'stripe', 'payu')),
    api_key TEXT, -- Encrypted or securely stored
    api_secret TEXT, -- Encrypted
    webhook_secret TEXT,
    is_active BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}', -- Provider specific settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

-- 4. Auto-Debit Mandates (eNACH / Subscriptions)
CREATE TABLE auto_debit_mandates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- razorpay_subscription, stripe_subscription
    mandate_ref TEXT NOT NULL, -- External ID
    max_amount DECIMAL(12, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Optional Fee Items (Add-ons)
CREATE TABLE optional_fee_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Transport: Zone A, Uniform Set
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT, -- Transport, Books, Uniform, Activity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_optional_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES optional_fee_items(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    status TEXT NOT NULL DEFAULT 'selected', -- selected, paid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, student_id, item_id, academic_year_id)
);

-- Indexes
CREATE INDEX idx_fee_class_config ON fee_class_configurations(academic_year_id, class_id);
CREATE INDEX idx_student_scholarships_lookup ON student_scholarships(student_id, academic_year_id);
CREATE INDEX idx_gateway_config ON payment_gateway_configs(tenant_id, is_active);
