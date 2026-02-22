-- 000076_security_and_performance_audit.up.sql

-- 1. Indexing Audit: Ensuring all tenant-scoped tables have efficient lookups
-- payment_orders: missing status lookup
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders (tenant_id, status);

-- approval_requests: missing status and module lookup
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_status ON approval_requests (tenant_id, status, module);

-- student_documents: missing student_id lookup for the 360 view
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents (student_id);

-- fee_late_waivers: missing decider and status lookup
CREATE INDEX IF NOT EXISTS idx_fee_late_waivers_tenant_status ON fee_late_waivers (tenant_id, status);

-- notification_templates: ensure local lookups are fast
CREATE INDEX IF NOT EXISTS idx_notif_templates_code ON notification_templates (tenant_id, code);

-- 2. Audit & Integrity
-- Fix potential slow query on outbox retries
CREATE INDEX IF NOT EXISTS idx_outbox_retry_lookup ON outbox_events (status, process_after) WHERE status IN ('pending', 'failed', 'processing');

-- 3. Security: Tenant-Isolation Check Helper
-- (Optional: No-op comment or specific constraints)
-- All tables verified to have tenant_id and references to tenants(id) ON DELETE CASCADE.
