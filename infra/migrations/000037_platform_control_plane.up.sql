-- 000037_platform_control_plane.up.sql

CREATE TABLE IF NOT EXISTS platform_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly BIGINT NOT NULL DEFAULT 0,
    price_yearly BIGINT NOT NULL DEFAULT 0,
    modules JSONB NOT NULL DEFAULT '{}'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES platform_plans(id),
    status TEXT NOT NULL DEFAULT 'trial', -- trial, active, suspended, closed
    trial_starts_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    renews_at TIMESTAMPTZ,
    grace_period_ends_at TIMESTAMPTZ,
    billing_email TEXT,
    tax_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    dunning_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);

CREATE TABLE IF NOT EXISTS tenant_signup_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    country TEXT,
    student_count_range TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    review_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_signup_requests_status ON tenant_signup_requests(status);

CREATE TABLE IF NOT EXISTS platform_action_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL,
    target_tenant_id UUID REFERENCES tenants(id),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, expired
    reason TEXT,
    expires_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_action_approvals_status ON platform_action_approvals(status, action_type);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    subject TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, critical
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    tags TEXT[] NOT NULL DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'internal', -- internal, email, api
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    due_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority);

CREATE TABLE IF NOT EXISTS support_ticket_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    note_type TEXT NOT NULL DEFAULT 'internal', -- internal, customer
    note TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_last4 TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    rotated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_api_keys_tenant_active ON platform_api_keys(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS platform_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_webhooks_tenant_active ON platform_webhooks(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES platform_webhooks(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, delivered, failed
    http_status INT,
    request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_status_created ON integration_logs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- backup, restore, export, data_fix
    status TEXT NOT NULL DEFAULT 'requested', -- requested, approved, running, completed, failed
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_backups_tenant_action ON platform_backups(tenant_id, action, created_at DESC);
