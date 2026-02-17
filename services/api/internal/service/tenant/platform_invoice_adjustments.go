package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidAdjustmentPayload = errors.New("invalid invoice adjustment payload")
)

type PlatformInvoiceAdjustment struct {
	ID             string                 `json:"id"`
	InvoiceID      string                 `json:"invoice_id"`
	InvoiceNumber  string                 `json:"invoice_number"`
	TenantID       string                 `json:"tenant_id"`
	TenantName     string                 `json:"tenant_name"`
	AdjustmentType string                 `json:"adjustment_type"`
	Amount         int64                  `json:"amount"`
	Currency       string                 `json:"currency"`
	Status         string                 `json:"status"`
	Reason         string                 `json:"reason,omitempty"`
	ExternalRef    string                 `json:"external_ref,omitempty"`
	Metadata       map[string]interface{} `json:"metadata"`
	CreatedBy      string                 `json:"created_by,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
}

type PlatformInvoiceAdjustmentResult struct {
	Invoice    PlatformInvoice           `json:"invoice"`
	Adjustment PlatformInvoiceAdjustment `json:"adjustment"`
}

type ListPlatformInvoiceAdjustmentsFilters struct {
	InvoiceID      string
	TenantID       string
	AdjustmentType string
	Status         string
	Limit          int32
	Offset         int32
}

type CreatePlatformInvoiceRefundParams struct {
	Amount      int64                  `json:"amount"`
	Reason      string                 `json:"reason"`
	ExternalRef string                 `json:"external_ref"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedBy   string                 `json:"-"`
}

type CreatePlatformCreditNoteParams struct {
	Amount           int64                  `json:"amount"`
	Reason           string                 `json:"reason"`
	ApplyImmediately bool                   `json:"apply_immediately"`
	ExternalRef      string                 `json:"external_ref"`
	Metadata         map[string]interface{} `json:"metadata"`
	CreatedBy        string                 `json:"-"`
}

func (s *Service) ListPlatformInvoiceAdjustments(ctx context.Context, filters ListPlatformInvoiceAdjustmentsFilters) ([]PlatformInvoiceAdjustment, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	var invoiceID pgtype.UUID
	if strings.TrimSpace(filters.InvoiceID) != "" {
		parsed, err := parseInvoiceUUID(filters.InvoiceID)
		if err != nil {
			return nil, err
		}
		invoiceID = parsed
	}

	var tenantID pgtype.UUID
	if strings.TrimSpace(filters.TenantID) != "" {
		parsed, err := parseTenantUUID(filters.TenantID)
		if err != nil {
			return nil, err
		}
		tenantID = parsed
	}

	const query = `
		SELECT
			a.id::text,
			a.invoice_id::text,
			i.invoice_number,
			a.tenant_id::text,
			t.name,
			a.adjustment_type,
			a.amount,
			a.currency,
			a.status,
			COALESCE(a.reason, '') AS reason,
			COALESCE(a.external_ref, '') AS external_ref,
			a.metadata,
			COALESCE(a.created_by::text, '') AS created_by,
			a.created_at
		FROM platform_invoice_adjustments a
		JOIN platform_invoices i ON i.id = a.invoice_id
		JOIN tenants t ON t.id = a.tenant_id
		WHERE ($1::uuid IS NULL OR a.invoice_id = $1)
		  AND ($2::uuid IS NULL OR a.tenant_id = $2)
		  AND ($3::text = '' OR LOWER(a.adjustment_type) = LOWER($3))
		  AND ($4::text = '' OR LOWER(a.status) = LOWER($4))
		ORDER BY a.created_at DESC
		LIMIT $5 OFFSET $6
	`
	rows, err := s.db.Query(
		ctx,
		query,
		invoiceID,
		tenantID,
		strings.TrimSpace(filters.AdjustmentType),
		strings.TrimSpace(filters.Status),
		limit,
		offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformInvoiceAdjustment, 0)
	for rows.Next() {
		row, err := scanPlatformInvoiceAdjustment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) CreatePlatformInvoiceRefund(ctx context.Context, invoiceID string, params CreatePlatformInvoiceRefundParams) (PlatformInvoiceAdjustmentResult, error) {
	invID, err := parseInvoiceUUID(invoiceID)
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}
	if params.Amount <= 0 || strings.TrimSpace(params.Reason) == "" {
		return PlatformInvoiceAdjustmentResult{}, ErrInvalidAdjustmentPayload
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}
	defer tx.Rollback(ctx)

	invoice, err := fetchPlatformInvoiceForUpdate(ctx, tx, invID)
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}
	if !canRefundInvoiceStatus(invoice.Status) {
		return PlatformInvoiceAdjustmentResult{}, ErrInvalidAdjustmentPayload
	}

	invoiceGross := invoice.AmountBase + invoice.AmountTax
	refundedTotal, refundedCount, err := getInvoiceAdjustmentStats(ctx, tx, invID, "refund", []string{"recorded", "applied"})
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}
	if refundedTotal+params.Amount > invoiceGross {
		return PlatformInvoiceAdjustmentResult{}, ErrInvalidAdjustmentPayload
	}

	adjustment, err := insertPlatformInvoiceAdjustment(ctx, tx, platformInvoiceAdjustmentInsertParams{
		InvoiceID:      invID,
		TenantID:       invoice.TenantID,
		AdjustmentType: "refund",
		Amount:         params.Amount,
		Currency:       defaultInvoiceAdjustmentCurrency(invoice.Currency),
		Status:         "recorded",
		Reason:         strings.TrimSpace(params.Reason),
		ExternalRef:    strings.TrimSpace(params.ExternalRef),
		Metadata:       params.Metadata,
		CreatedBy:      strings.TrimSpace(params.CreatedBy),
	})
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	newRefundTotal := refundedTotal + params.Amount
	nextStatus := "partially_refunded"
	if newRefundTotal >= invoiceGross {
		nextStatus = "refunded"
	}
	patch := map[string]interface{}{
		"refund_total":       newRefundTotal,
		"refund_count":       refundedCount + 1,
		"last_refund_at":     time.Now().UTC().Format(time.RFC3339),
		"last_refund_reason": strings.TrimSpace(params.Reason),
	}
	if strings.TrimSpace(params.ExternalRef) != "" {
		patch["last_refund_ref"] = strings.TrimSpace(params.ExternalRef)
	}
	if err := patchPlatformInvoiceMetadata(ctx, tx, invID, nextStatus, patch); err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	updatedInvoice, err := fetchPlatformInvoiceByID(ctx, tx, invID)
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	return PlatformInvoiceAdjustmentResult{Invoice: updatedInvoice, Adjustment: adjustment}, nil
}

func (s *Service) CreatePlatformCreditNote(ctx context.Context, invoiceID string, params CreatePlatformCreditNoteParams) (PlatformInvoiceAdjustmentResult, error) {
	invID, err := parseInvoiceUUID(invoiceID)
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}
	if params.Amount <= 0 || strings.TrimSpace(params.Reason) == "" {
		return PlatformInvoiceAdjustmentResult{}, ErrInvalidAdjustmentPayload
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}
	defer tx.Rollback(ctx)

	invoice, err := fetchPlatformInvoiceForUpdate(ctx, tx, invID)
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}
	if strings.EqualFold(invoice.Status, "cancelled") {
		return PlatformInvoiceAdjustmentResult{}, ErrInvalidAdjustmentPayload
	}

	invoiceGross := invoice.AmountBase + invoice.AmountTax
	issuedTotal, issuedCount, err := getInvoiceAdjustmentStats(ctx, tx, invID, "credit_note", []string{"issued", "applied"})
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}
	if issuedTotal+params.Amount > invoiceGross {
		return PlatformInvoiceAdjustmentResult{}, ErrInvalidAdjustmentPayload
	}

	appliedTotal, _, err := getInvoiceAdjustmentStats(ctx, tx, invID, "credit_note", []string{"applied"})
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	adjustmentStatus := "issued"
	newAppliedTotal := appliedTotal
	if params.ApplyImmediately {
		adjustmentStatus = "applied"
		newAppliedTotal += params.Amount
	}

	adjustment, err := insertPlatformInvoiceAdjustment(ctx, tx, platformInvoiceAdjustmentInsertParams{
		InvoiceID:      invID,
		TenantID:       invoice.TenantID,
		AdjustmentType: "credit_note",
		Amount:         params.Amount,
		Currency:       defaultInvoiceAdjustmentCurrency(invoice.Currency),
		Status:         adjustmentStatus,
		Reason:         strings.TrimSpace(params.Reason),
		ExternalRef:    strings.TrimSpace(params.ExternalRef),
		Metadata:       params.Metadata,
		CreatedBy:      strings.TrimSpace(params.CreatedBy),
	})
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	nextStatus := invoice.Status
	if params.ApplyImmediately {
		switch {
		case canCreditAffectInvoiceStatus(invoice.Status) && newAppliedTotal >= invoiceGross:
			nextStatus = "credited"
		case canCreditAffectInvoiceStatus(invoice.Status) && newAppliedTotal > 0:
			nextStatus = "partially_credited"
		}
	}

	patch := map[string]interface{}{
		"credit_note_total":       issuedTotal + params.Amount,
		"credit_note_count":       issuedCount + 1,
		"credit_applied_total":    newAppliedTotal,
		"last_credit_note_at":     time.Now().UTC().Format(time.RFC3339),
		"last_credit_note_reason": strings.TrimSpace(params.Reason),
	}
	if strings.TrimSpace(params.ExternalRef) != "" {
		patch["last_credit_note_ref"] = strings.TrimSpace(params.ExternalRef)
	}
	if err := patchPlatformInvoiceMetadata(ctx, tx, invID, nextStatus, patch); err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	updatedInvoice, err := fetchPlatformInvoiceByID(ctx, tx, invID)
	if err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PlatformInvoiceAdjustmentResult{}, err
	}

	return PlatformInvoiceAdjustmentResult{Invoice: updatedInvoice, Adjustment: adjustment}, nil
}

type platformInvoiceLookup struct {
	TenantID   string
	Currency   string
	AmountBase int64
	AmountTax  int64
	Status     string
}

func fetchPlatformInvoiceForUpdate(ctx context.Context, tx pgx.Tx, invID pgtype.UUID) (platformInvoiceLookup, error) {
	const query = `
		SELECT
			i.tenant_id::text,
			i.currency,
			i.amount_total,
			i.tax_amount,
			i.status
		FROM platform_invoices i
		WHERE i.id = $1
		FOR UPDATE
	`
	var row platformInvoiceLookup
	err := tx.QueryRow(ctx, query, invID).Scan(
		&row.TenantID,
		&row.Currency,
		&row.AmountBase,
		&row.AmountTax,
		&row.Status,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return platformInvoiceLookup{}, ErrInvoiceNotFound
		}
		return platformInvoiceLookup{}, err
	}
	return row, nil
}

func fetchPlatformInvoiceByID(ctx context.Context, tx pgx.Tx, invID pgtype.UUID) (PlatformInvoice, error) {
	const query = `
		SELECT
			i.id::text,
			i.invoice_number,
			i.tenant_id::text,
			t.name AS tenant_name,
			i.currency,
			i.amount_total,
			i.tax_amount,
			i.status,
			i.due_date,
			i.issued_at,
			i.paid_at,
			COALESCE(i.external_ref, '') AS external_ref,
			i.line_items,
			i.metadata,
			i.created_at,
			i.updated_at
		FROM platform_invoices i
		JOIN tenants t ON t.id = i.tenant_id
		WHERE i.id = $1
	`
	row, err := scanPlatformInvoice(tx.QueryRow(ctx, query, invID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformInvoice{}, ErrInvoiceNotFound
		}
		return PlatformInvoice{}, err
	}
	return row, nil
}

func getInvoiceAdjustmentStats(ctx context.Context, tx pgx.Tx, invID pgtype.UUID, adjustmentType string, statuses []string) (int64, int64, error) {
	const query = `
		SELECT
			COALESCE(SUM(a.amount), 0)::BIGINT AS total_amount,
			COUNT(*)::BIGINT AS total_count
		FROM platform_invoice_adjustments a
		WHERE a.invoice_id = $1
		  AND a.adjustment_type = $2
		  AND (
			COALESCE(array_length($3::text[], 1), 0) = 0
			OR a.status = ANY($3::text[])
		  )
	`
	var totalAmount int64
	var totalCount int64
	if err := tx.QueryRow(ctx, query, invID, adjustmentType, statuses).Scan(&totalAmount, &totalCount); err != nil {
		return 0, 0, err
	}
	return totalAmount, totalCount, nil
}

type platformInvoiceAdjustmentInsertParams struct {
	InvoiceID      pgtype.UUID
	TenantID       string
	AdjustmentType string
	Amount         int64
	Currency       string
	Status         string
	Reason         string
	ExternalRef    string
	Metadata       map[string]interface{}
	CreatedBy      string
}

func insertPlatformInvoiceAdjustment(ctx context.Context, tx pgx.Tx, params platformInvoiceAdjustmentInsertParams) (PlatformInvoiceAdjustment, error) {
	tenantID, err := parseTenantUUID(params.TenantID)
	if err != nil {
		return PlatformInvoiceAdjustment{}, err
	}
	metadata := params.Metadata
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	metaJSON, err := json.Marshal(metadata)
	if err != nil {
		return PlatformInvoiceAdjustment{}, ErrInvalidAdjustmentPayload
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	const query = `
		INSERT INTO platform_invoice_adjustments (
			invoice_id,
			tenant_id,
			adjustment_type,
			amount,
			currency,
			status,
			reason,
			external_ref,
			metadata,
			created_by
		)
		VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''), NULLIF($8, ''), $9, $10)
		RETURNING
			id::text,
			invoice_id::text,
			(SELECT invoice_number FROM platform_invoices WHERE id = invoice_id) AS invoice_number,
			tenant_id::text,
			(SELECT name FROM tenants WHERE id = tenant_id) AS tenant_name,
			adjustment_type,
			amount,
			currency,
			status,
			COALESCE(reason, '') AS reason,
			COALESCE(external_ref, '') AS external_ref,
			metadata,
			COALESCE(created_by::text, '') AS created_by,
			created_at
	`
	row, err := scanPlatformInvoiceAdjustment(tx.QueryRow(
		ctx,
		query,
		params.InvoiceID,
		tenantID,
		params.AdjustmentType,
		params.Amount,
		params.Currency,
		params.Status,
		params.Reason,
		params.ExternalRef,
		metaJSON,
		createdBy,
	))
	if err != nil {
		return PlatformInvoiceAdjustment{}, err
	}
	return row, nil
}

func patchPlatformInvoiceMetadata(ctx context.Context, tx pgx.Tx, invID pgtype.UUID, status string, patch map[string]interface{}) error {
	patchJSON, err := json.Marshal(patch)
	if err != nil {
		return ErrInvalidAdjustmentPayload
	}

	const query = `
		UPDATE platform_invoices
		SET
			status = $2,
			metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
			updated_at = NOW()
		WHERE id = $1
	`
	_, err = tx.Exec(ctx, query, invID, status, patchJSON)
	return err
}

type invoiceAdjustmentRowScanner interface {
	Scan(dest ...interface{}) error
}

func scanPlatformInvoiceAdjustment(scanner invoiceAdjustmentRowScanner) (PlatformInvoiceAdjustment, error) {
	var row PlatformInvoiceAdjustment
	var metadataJSON []byte

	if err := scanner.Scan(
		&row.ID,
		&row.InvoiceID,
		&row.InvoiceNumber,
		&row.TenantID,
		&row.TenantName,
		&row.AdjustmentType,
		&row.Amount,
		&row.Currency,
		&row.Status,
		&row.Reason,
		&row.ExternalRef,
		&metadataJSON,
		&row.CreatedBy,
		&row.CreatedAt,
	); err != nil {
		return PlatformInvoiceAdjustment{}, err
	}

	row.Metadata = map[string]interface{}{}
	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &row.Metadata); err != nil {
			return PlatformInvoiceAdjustment{}, err
		}
	}

	return row, nil
}

func canRefundInvoiceStatus(status string) bool {
	s := strings.ToLower(strings.TrimSpace(status))
	return s == "paid" || s == "partially_refunded" || s == "refunded"
}

func canCreditAffectInvoiceStatus(status string) bool {
	s := strings.ToLower(strings.TrimSpace(status))
	switch s {
	case "draft", "issued", "overdue", "partially_credited":
		return true
	default:
		return false
	}
}

func defaultInvoiceAdjustmentCurrency(raw string) string {
	currency := strings.ToUpper(strings.TrimSpace(raw))
	if currency == "" {
		currency = "INR"
	}
	return currency
}
