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

-- name: CreateReceiptItem :one
INSERT INTO receipt_items (receipt_id, fee_head_id, amount)
VALUES ($1, $2, $3)
RETURNING *;

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
SELECT 
    fpi.plan_id, 
    fpi.head_id, 
    fpi.amount, 
    fpi.due_date, 
    fpi.info, 
    fh.name as head_name,
    COALESCE((
        SELECT SUM(ri.amount)
        FROM receipt_items ri
        JOIN receipts r ON ri.receipt_id = r.id
        WHERE r.student_id = sfp.student_id 
          AND ri.fee_head_id = fpi.head_id
          AND r.status != 'cancelled'
    ), 0)::BIGINT as paid_amount
FROM student_fee_plans sfp
JOIN fee_plan_items fpi ON sfp.plan_id = fpi.plan_id
JOIN fee_heads fh ON fpi.head_id = fh.id
WHERE sfp.student_id = $1
ORDER BY fpi.due_date ASC, fh.name ASC;

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
    r.id,
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

-- name: UpsertFeeClassConfig :one
INSERT INTO fee_class_configurations (
    tenant_id, academic_year_id, class_id, fee_head_id, amount, due_date, is_optional
) VALUES (
    @tenant_id, @academic_year_id, @class_id, @fee_head_id, @amount, @due_date, @is_optional
)
ON CONFLICT (tenant_id, academic_year_id, class_id, fee_head_id) DO UPDATE
SET amount = EXCLUDED.amount, 
    due_date = EXCLUDED.due_date,
    is_optional = EXCLUDED.is_optional,
    updated_at = NOW()
RETURNING *;

-- name: ListFeeClassConfigs :many
SELECT fc.*, fh.name as fee_head_name, c.name as class_name
FROM fee_class_configurations fc
JOIN fee_heads fh ON fc.fee_head_id = fh.id
JOIN classes c ON fc.class_id = c.id
WHERE fc.tenant_id = @tenant_id 
  AND fc.academic_year_id = @academic_year_id
  AND (@class_id::UUID IS NULL OR fc.class_id = @class_id::UUID)
ORDER BY c.level, fh.name;

-- name: UpsertScholarship :one
INSERT INTO fee_discounts_scholarships (
    tenant_id, name, type, value, description, is_active
) VALUES (
    @tenant_id, @name, @type, @value, @description, @is_active
) RETURNING *;

-- name: ListScholarships :many
SELECT * FROM fee_discounts_scholarships
WHERE tenant_id = @tenant_id AND (@is_active::BOOLEAN = false OR is_active = @is_active::BOOLEAN)
ORDER BY created_at DESC;

-- name: AssignScholarship :one
INSERT INTO student_scholarships (
    tenant_id, student_id, scholarship_id, academic_year_id, approved_by
) VALUES (
    @tenant_id, @student_id, @scholarship_id, @academic_year_id, @approved_by
) RETURNING *;

-- name: UpsertGatewayConfig :one
INSERT INTO payment_gateway_configs (
    tenant_id, provider, api_key, api_secret, webhook_secret, is_active, settings
) VALUES (
    @tenant_id, @provider, @api_key, @api_secret, @webhook_secret, @is_active, @settings
)
ON CONFLICT (tenant_id, provider) DO UPDATE
SET api_key = EXCLUDED.api_key,
    api_secret = EXCLUDED.api_secret,
    webhook_secret = EXCLUDED.webhook_secret,
    is_active = EXCLUDED.is_active,
    settings = EXCLUDED.settings,
    updated_at = NOW()
RETURNING *;

-- name: GetActiveGatewayConfig :one
SELECT * FROM payment_gateway_configs
WHERE tenant_id = @tenant_id AND provider = @provider AND is_active = true;

-- name: GetTenantActiveGateway :one
SELECT * FROM payment_gateway_configs
WHERE tenant_id = @tenant_id AND is_active = true
LIMIT 1;

-- name: CreateAutoDebitMandate :one
INSERT INTO auto_debit_mandates (
    tenant_id, student_id, provider, mandate_ref, max_amount, status, start_date, end_date
) VALUES (
    @tenant_id, @student_id, @provider, @mandate_ref, @max_amount, @status, @start_date, @end_date
) RETURNING *;

-- name: ListOptionalFeeItems :many
SELECT * FROM optional_fee_items
WHERE tenant_id = @tenant_id
ORDER BY category, name;

-- name: UpsertOptionalFeeItem :one
INSERT INTO optional_fee_items (
    tenant_id, name, amount, category
) VALUES (
    @tenant_id, @name, @amount, @category
)
ON CONFLICT (tenant_id, name) DO UPDATE
SET amount = EXCLUDED.amount,
    category = EXCLUDED.category
RETURNING *;


-- name: UpsertStudentOptionalFee :one
INSERT INTO student_optional_fees (
    tenant_id, student_id, item_id, academic_year_id, status
) VALUES (
    @tenant_id, @student_id, @item_id, @academic_year_id, @status
)
ON CONFLICT (tenant_id, student_id, item_id, academic_year_id) DO UPDATE
SET status = EXCLUDED.status
RETURNING *;



