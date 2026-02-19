-- reminders.sql

-- name: UpsertFeeReminderConfig :one
INSERT INTO fee_reminder_configs (tenant_id, days_offset, reminder_type, is_active)
VALUES (@tenant_id, @days_offset, @reminder_type, @is_active)
ON CONFLICT (tenant_id, days_offset, reminder_type) DO UPDATE
SET is_active = EXCLUDED.is_active, updated_at = NOW()
RETURNING *;

-- name: ListFeeReminderConfigs :many
SELECT * FROM fee_reminder_configs
WHERE tenant_id = @tenant_id
ORDER BY reminder_type, days_offset;

-- name: GetActiveReminderConfigs :many
SELECT * FROM fee_reminder_configs
WHERE is_active = true;

-- name: GetStudentsForFeeReminder :many
SELECT 
    s.id as student_id,
    s.tenant_id,
    s.full_name as student_name,
    fh.name as fee_head_name,
    fh.id as fee_head_id,
    fc.due_date,
    fc.amount as expected_amount,
    COALESCE(paid.amount, 0)::BIGINT as paid_amount
FROM fee_class_configurations fc
JOIN fee_heads fh ON fc.fee_head_id = fh.id
JOIN students s ON s.section_id IN (SELECT id FROM sections WHERE class_id = fc.class_id)
JOIN student_fee_plans sfp ON s.id = sfp.student_id AND sfp.plan_id IN (SELECT plan_id FROM fee_plan_items WHERE head_id = fc.fee_head_id)
LEFT JOIN (
    SELECT r.student_id, ri.fee_head_id, SUM(ri.amount) as amount
    FROM receipts r
    JOIN receipt_items ri ON r.id = ri.receipt_id
    WHERE r.status != 'cancelled'
    GROUP BY r.student_id, ri.fee_head_id
) paid ON s.id = paid.student_id AND fc.fee_head_id = paid.fee_head_id
WHERE fc.tenant_id = @tenant_id::UUID
  AND fc.academic_year_id = @academic_year_id::UUID
  AND fc.due_date = @target_due_date::DATE
  AND (fc.amount - COALESCE(paid.amount, 0)) > 0
  AND NOT EXISTS (
      SELECT 1 FROM fee_reminder_logs frl
      WHERE frl.student_id = s.id 
        AND frl.fee_head_id = fc.fee_head_id
        AND frl.reminder_config_id = @reminder_config_id
  );

-- name: LogFeeReminder :one
INSERT INTO fee_reminder_logs (tenant_id, student_id, fee_head_id, reminder_config_id)
VALUES (@tenant_id, @student_id, @fee_head_id, @reminder_config_id)
RETURNING *;
