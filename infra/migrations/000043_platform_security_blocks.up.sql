-- 000043_platform_security_blocks.up.sql

-- Manual risk-based blocks for tenants and users (platform super admin).
-- Enforcement is handled at request time (middleware) for authenticated requests.

CREATE TABLE IF NOT EXISTS platform_security_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type TEXT NOT NULL, -- tenant, user
    target_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- active, released
    severity TEXT NOT NULL DEFAULT 'warning', -- info, warning, critical
    reason TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    released_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    CHECK (target_type IN ('tenant', 'user')),
    CHECK (status IN ('active', 'released')),
    CHECK (severity IN ('info', 'warning', 'critical')),
    CHECK (target_tenant_id IS NOT NULL OR target_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_platform_security_blocks_active_tenant
    ON platform_security_blocks(target_tenant_id)
    WHERE status = 'active' AND target_tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_security_blocks_active_user
    ON platform_security_blocks(target_user_id)
    WHERE status = 'active' AND target_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_security_blocks_status_created
    ON platform_security_blocks(status, created_at DESC);

