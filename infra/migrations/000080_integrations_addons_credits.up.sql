-- Add-on catalog extensions (monthly subscriptions + feature flags + allowances)
ALTER TABLE platform_addons
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS features_unlocked JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS integration_unlocked TEXT,
  ADD COLUMN IF NOT EXISTS included_credits JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE tenant_addons
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renew_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_source TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE tenant_addons
SET start_at = COALESCE(start_at, activated_at),
    renew_at = COALESCE(renew_at, expires_at, activated_at + INTERVAL '1 month')
WHERE start_at IS NULL OR renew_at IS NULL;

-- Tenant-owned OAuth / integration tokens (Google, Microsoft, etc.)
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- google_workspace, microsoft_365, ...
  status TEXT NOT NULL DEFAULT 'not_connected', -- connected, needs_reauth, disconnected, error
  account_email TEXT,
  account_name TEXT,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  access_token TEXT,
  refresh_token TEXT,
  token_type TEXT,
  expiry_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_tenant_integrations_status ON tenant_integrations(status, provider);

-- Live class events generated from Google Meet / Microsoft Teams integration
CREATE TABLE IF NOT EXISTS live_class_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- google_workspace / microsoft_365
  teacher_user_id UUID NOT NULL REFERENCES users(id),
  class_id UUID REFERENCES classes(id),
  section_id UUID REFERENCES sections(id),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  external_event_id TEXT,
  external_calendar_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_class_events_tenant_schedule ON live_class_events(tenant_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_class_events_teacher ON live_class_events(tenant_id, teacher_user_id, starts_at DESC);

-- Per-category usage credits (separate from legacy wallets/balance_paise ledger)
CREATE TABLE IF NOT EXISTS tenant_credit_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL, -- sms_credits, whatsapp_credits, email_credits, ai_credits
  balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, wallet_type)
);

CREATE TABLE IF NOT EXISTS tenant_credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL,
  entry_type TEXT NOT NULL, -- debit, credit, reserve(optional)
  amount BIGINT NOT NULL,
  source TEXT NOT NULL, -- included_allowance, topup, message_send, ai_usage, support_adjustment
  reference_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, wallet_type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_credit_ledger_tenant_wallet_created
  ON tenant_credit_ledger(tenant_id, wallet_type, created_at DESC);

-- Payment webhook observability and retention helpers
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tenant_provider_created
  ON webhook_logs(tenant_id, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at
  ON webhook_logs(created_at);
