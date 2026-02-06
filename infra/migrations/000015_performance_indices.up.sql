-- 000015_performance_indices.up.sql

-- 1. Financial Performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_tenant_date ON payment_orders (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_date ON receipts (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_refunds_tenant_receipt ON fee_refunds (tenant_id, receipt_id);

-- 2. SIS & Academic Performance
CREATE INDEX IF NOT EXISTS idx_attendance_entries_session ON attendance_entries (tenant_id, session_id);
CREATE INDEX IF NOT EXISTS idx_marks_entries_exam_subject ON marks_entries (tenant_id, exam_subject_id);

-- 3. Audit & Logging
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_events (tenant_id, event_type, created_at DESC);
