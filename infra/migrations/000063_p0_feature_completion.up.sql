-- 000063_p0_feature_completion.up.sql

-- 1. Notice Enhancements
ALTER TABLE notices ADD COLUMN attachments JSONB DEFAULT '[]';

-- Add index for scheduled publishing
CREATE INDEX idx_notices_publish_at ON notices(tenant_id, publish_at);

-- 2. Outbox Scheduling Support
ALTER TABLE outbox ADD COLUMN process_after TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX idx_outbox_process_after ON outbox(status, process_after);

-- 3. Fee Reminder Configuration
CREATE TABLE fee_reminder_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    days_offset INTEGER NOT NULL, -- e.g., 7
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'after_due', 'on_due')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, days_offset, reminder_type)
);

-- 4. Track which students were already reminded for a specific fee and offset
CREATE TABLE fee_reminder_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES fee_heads(id) ON DELETE CASCADE,
    reminder_config_id UUID NOT NULL REFERENCES fee_reminder_configs(id) ON DELETE CASCADE,
    reminded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, fee_head_id, reminder_config_id)
);
