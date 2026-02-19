-- 000070_ptm_automated_reminders.up.sql

CREATE TABLE ptm_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES ptm_slots(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL, -- '24h', '1h'
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, slot_id, student_id, reminder_type)
);

CREATE INDEX idx_ptm_reminder_logs_slot ON ptm_reminder_logs(slot_id);
