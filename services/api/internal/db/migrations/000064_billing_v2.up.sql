-- 000064_billing_v2.up.sql

-- 1. Platform Addons (definitions)
CREATE TABLE IF NOT EXISTS platform_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_paise BIGINT NOT NULL DEFAULT 0,
    billing_period TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, one-time
    category TEXT NOT NULL DEFAULT 'General',
    config_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tenant Addons (entitlements)
CREATE TABLE IF NOT EXISTS tenant_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES platform_addons(id),
    status TEXT NOT NULL DEFAULT 'active', -- active, suspended
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, addon_id)
);

-- 3. Credit Packs
CREATE TABLE IF NOT EXISTS credit_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    credits BIGINT NOT NULL, -- amount of credits granted
    price_paise BIGINT NOT NULL, -- cost in paise
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Rate Cards (metering configuration)
CREATE TABLE IF NOT EXISTS rate_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- null means global default
    feature_code TEXT NOT NULL, -- 'sms', 'whatsapp', 'ai_token', 'ai_request'
    cost_per_unit BIGINT NOT NULL, -- in credits
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, feature_code)
);

-- 5. Enhanced Wallet Ledger Metrics
ALTER TABLE wallet_ledger ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE wallet_ledger ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 6. Indexes for Billing Performance
CREATE INDEX IF NOT EXISTS idx_tenant_addons_tenant_id ON tenant_addons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_cards_feature_code ON rate_cards(feature_code);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON wallet_ledger(wallet_id);
