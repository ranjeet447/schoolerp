-- Copyright 2026 Google LLC
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- name: CreateFeeHead :one
INSERT INTO fee_heads (tenant_id, name, type)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CreatePaymentOrder :one
INSERT INTO payment_orders (
    tenant_id, student_id, amount, mode, status, external_ref
) VALUES (
    $1, $2, $3, $4, 'pending', $5
) RETURNING *;

-- name: UpdatePaymentOrderStatus :one
UPDATE payment_orders
SET status = $3, external_ref = $4
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: GetPaymentOrder :one
SELECT * FROM payment_orders
WHERE id = $1 AND tenant_id = $2;

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

-- name: LogPaymentEvent :one
INSERT INTO payment_events (tenant_id, gateway_event_id, event_type)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CheckPaymentEventProcessed :one
SELECT EXISTS (
    SELECT 1 FROM payment_events 
    WHERE tenant_id = $1 AND gateway_event_id = $2
) as processed;

-- name: CreateReceiptSeries :one
INSERT INTO receipt_series (tenant_id, branch_id, prefix, current_number, is_active)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListReceiptSeries :many
SELECT * FROM receipt_series WHERE tenant_id = $1;

-- name: UpdateReceiptSeries :one
UPDATE receipt_series
SET is_active = $3, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: UpsertLedgerMapping :one
INSERT INTO tally_ledger_mappings (tenant_id, fee_head_id, tally_ledger_name)
VALUES ($1, $2, $3)
ON CONFLICT (tenant_id, fee_head_id) DO UPDATE
SET tally_ledger_name = EXCLUDED.tally_ledger_name
RETURNING *;

-- name: ListLedgerMappings :many
SELECT lm.*, fh.name as fee_head_name
FROM tally_ledger_mappings lm
JOIN fee_heads fh ON lm.fee_head_id = fh.id
WHERE lm.tenant_id = $1;

-- name: GetTallyExportData :many
SELECT 
    r.receipt_number,
    r.amount_paid,
    r.created_at,
    r.payment_mode,
    s.admission_number,
    s.full_name as student_name,
    tlm.tally_ledger_name
FROM receipts r
JOIN students s ON r.student_id = s.id
LEFT JOIN student_fee_plans sfp ON s.id = sfp.student_id
LEFT JOIN fee_plans fp ON sfp.plan_id = fp.id
-- Simple mapping for demo: using the first head's mapping from the plan
LEFT JOIN fee_plan_items fpi ON fp.id = fpi.plan_id
LEFT JOIN tally_ledger_mappings tlm ON fpi.head_id = tlm.fee_head_id AND r.tenant_id = tlm.tenant_id
WHERE r.tenant_id = $1 AND r.created_at BETWEEN $2 AND $3
ORDER BY r.created_at ASC;



