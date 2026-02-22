-- 000063_performance_security.up.sql

-- 1. Tenant Isolation Indexes (P2 Security Verification)
CREATE INDEX IF NOT EXISTS idx_subjects_tenant_id ON subjects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guardians_tenant_id ON guardians(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fee_heads_tenant_id ON fee_heads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fee_plans_tenant_id ON fee_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sections_tenant_id ON sections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_tenant_id ON attendance_sessions(tenant_id);

-- 2. Performance Indexes for Common Lookups
CREATE INDEX IF NOT EXISTS idx_students_section_status ON students(section_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_entries_status ON attendance_entries(status);
CREATE INDEX IF NOT EXISTS idx_outbox_events_process_after ON outbox_events(process_after) WHERE status = 'pending';

-- 3. Security: Audit Trail Performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
