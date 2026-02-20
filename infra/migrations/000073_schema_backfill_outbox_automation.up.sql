-- Backfill schema pieces required by the current API binary.
-- This migration is intentionally idempotent to repair partially-migrated environments.

-- Outbox scheduling support (required by GetPendingOutboxEvents).
ALTER TABLE outbox
    ADD COLUMN IF NOT EXISTS process_after TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_outbox_process_after
    ON outbox(status, process_after);

-- Automation rules (required by scheduler and automation APIs).
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    condition_json JSONB DEFAULT '{}'::jsonb,
    action_json JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    trigger_type TEXT NOT NULL DEFAULT 'event',
    schedule_cron TEXT
);

-- Repair older automation_rules schemas that predate scheduling fields.
ALTER TABLE automation_rules
    ADD COLUMN IF NOT EXISTS trigger_type TEXT,
    ADD COLUMN IF NOT EXISTS schedule_cron TEXT;

UPDATE automation_rules
SET trigger_type = 'event'
WHERE trigger_type IS NULL;

ALTER TABLE automation_rules
    ALTER COLUMN trigger_type SET DEFAULT 'event',
    ALTER COLUMN trigger_type SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'automation_rules_trigger_type_check'
    ) THEN
        ALTER TABLE automation_rules
            ADD CONSTRAINT automation_rules_trigger_type_check
            CHECK (trigger_type IN ('event', 'time'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_trigger
    ON automation_rules(tenant_id, trigger_event)
    WHERE is_active = true;

-- Distributed scheduler dedup table used by TryMarkAutomationRuleRun.
CREATE TABLE IF NOT EXISTS automation_rule_runs (
    id BIGSERIAL PRIMARY KEY,
    rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    run_minute TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(rule_id, run_minute)
);

CREATE INDEX IF NOT EXISTS idx_automation_rule_runs_tenant_minute
    ON automation_rule_runs(tenant_id, run_minute DESC);
