-- Create automation_rules table
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL, -- e.g. 'student.created', 'fee.overdue'
    condition_json JSONB DEFAULT '{}'::jsonb,
    action_json JSONB NOT NULL, -- e.g. {"type": "sms", "template_id": "...", "to": ["{{student.parent_phone}}"]}
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Add indexes
CREATE INDEX idx_automation_rules_tenant_trigger ON automation_rules(tenant_id, trigger_event) WHERE is_active = true;

-- Update library_reading_logs to add student_name for faster global lookups if needed
-- Actually, the join in the query is fine, but let's add a metadata column if we want more extensibility
ALTER TABLE library_reading_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
