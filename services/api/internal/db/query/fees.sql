-- name: CreateFeeHead :one
INSERT INTO fee_heads (tenant_id, name, type)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListFeeHeads :many
SELECT * FROM fee_heads WHERE tenant_id = $1;

-- name: CreateFeePlan :one
INSERT INTO fee_plans (tenant_id, name, academic_year_id, total_amount)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: CreateFeePlanItem :one
INSERT INTO fee_plan_items (plan_id, head_id, amount, due_date, info)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: AssignPlanToStudent :one
INSERT INTO student_fee_plans (student_id, plan_id)
VALUES ($1, $2)
ON CONFLICT (student_id, plan_id) DO NOTHING
RETURNING *;

-- name: GetNextReceiptNumber :one
UPDATE receipt_series
SET current_number = current_number + 1, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING prefix || (current_number)::text as receipt_number;

-- name: GetActiveSeries :one
SELECT * FROM receipt_series
WHERE tenant_id = $1 AND is_active = TRUE
LIMIT 1;

-- name: CreateReceipt :one
INSERT INTO receipts (
    tenant_id, receipt_number, student_id, amount_paid, 
    payment_mode, series_id, created_by, transaction_ref
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;

-- name: CancelReceipt :one
UPDATE receipts
SET status = 'cancelled', cancelled_by = $2, cancellation_reason = $3, updated_at = NOW()
WHERE id = $1 AND tenant_id = $4
RETURNING *;

-- name: CreateRefund :one
INSERT INTO fee_refunds (tenant_id, receipt_id, amount, reason)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetStudentFeeSummary :many
SELECT fpi.*, fh.name as head_name
FROM student_fee_plans sfp
JOIN fee_plan_items fpi ON sfp.plan_id = fpi.plan_id
JOIN fee_heads fh ON fpi.head_id = fh.id
WHERE sfp.student_id = $1;

-- name: ListStudentReceipts :many
SELECT * FROM receipts
WHERE student_id = $1 AND tenant_id = $2
ORDER BY created_at DESC;
