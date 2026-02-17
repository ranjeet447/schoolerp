package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidInvoiceID      = errors.New("invalid invoice id")
	ErrInvoiceNotFound       = errors.New("invoice not found")
	ErrInvalidInvoicePayload = errors.New("invalid invoice payload")
)

type PlatformInvoice struct {
	ID            string                   `json:"id"`
	InvoiceNumber string                   `json:"invoice_number"`
	TenantID      string                   `json:"tenant_id"`
	TenantName    string                   `json:"tenant_name"`
	Currency      string                   `json:"currency"`
	AmountTotal   int64                    `json:"amount_total"`
	TaxAmount     int64                    `json:"tax_amount"`
	Status        string                   `json:"status"`
	DueDate       *time.Time               `json:"due_date,omitempty"`
	IssuedAt      *time.Time               `json:"issued_at,omitempty"`
	PaidAt        *time.Time               `json:"paid_at,omitempty"`
	ExternalRef   string                   `json:"external_ref,omitempty"`
	LineItems     []map[string]interface{} `json:"line_items"`
	Metadata      map[string]interface{}   `json:"metadata"`
	CreatedAt     time.Time                `json:"created_at"`
	UpdatedAt     time.Time                `json:"updated_at"`
}

type CreatePlatformInvoiceParams struct {
	TenantID    string                   `json:"tenant_id"`
	Currency    string                   `json:"currency"`
	AmountTotal int64                    `json:"amount_total"`
	TaxAmount   int64                    `json:"tax_amount"`
	DueDate     string                   `json:"due_date"`
	LineItems   []map[string]interface{} `json:"line_items"`
	Metadata    map[string]interface{}   `json:"metadata"`
	CreatedBy   string                   `json:"-"`
}

type MarkPlatformInvoicePaidParams struct {
	PaymentMode string `json:"payment_mode"`
	Reference   string `json:"reference"`
	PaidAt      string `json:"paid_at"`
}

type ListPlatformInvoicesFilters struct {
	TenantID string
	Status   string
	Limit    int32
	Offset   int32
}

func (s *Service) ListPlatformInvoices(ctx context.Context, filters ListPlatformInvoicesFilters) ([]PlatformInvoice, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	var tenantID pgtype.UUID
	_ = tenantID.Scan(strings.TrimSpace(filters.TenantID))

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
		WHERE ($1::uuid IS NULL OR i.tenant_id = $1)
		  AND ($2::text = '' OR LOWER(i.status) = LOWER($2))
		ORDER BY i.created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := s.db.Query(ctx, query, tenantID, strings.TrimSpace(filters.Status), limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformInvoice, 0)
	for rows.Next() {
		row, err := scanPlatformInvoice(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) CreatePlatformInvoice(ctx context.Context, params CreatePlatformInvoiceParams) (PlatformInvoice, error) {
	tenantID, err := parseTenantUUID(params.TenantID)
	if err != nil {
		return PlatformInvoice{}, err
	}
	if params.AmountTotal < 0 || params.TaxAmount < 0 {
		return PlatformInvoice{}, ErrInvalidInvoicePayload
	}
	if params.AmountTotal == 0 {
		return PlatformInvoice{}, ErrInvalidInvoicePayload
	}

	currency := strings.ToUpper(strings.TrimSpace(params.Currency))
	if currency == "" {
		currency = "INR"
	}

	var dueDate pgtype.Timestamptz
	if raw := strings.TrimSpace(params.DueDate); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return PlatformInvoice{}, ErrInvalidInvoicePayload
		}
		dueDate = pgtype.Timestamptz{Time: parsed, Valid: true}
	}

	items := params.LineItems
	if items == nil {
		items = []map[string]interface{}{}
	}
	itemsJSON, err := json.Marshal(items)
	if err != nil {
		return PlatformInvoice{}, ErrInvalidInvoicePayload
	}

	metadata := params.Metadata
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	metaJSON, err := json.Marshal(metadata)
	if err != nil {
		return PlatformInvoice{}, ErrInvalidInvoicePayload
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	invoiceNumber := fmt.Sprintf("INV-%s-%06d", time.Now().UTC().Format("200601"), time.Now().UTC().UnixNano()%1000000)

	const query = `
		INSERT INTO platform_invoices (
			tenant_id,
			invoice_number,
			currency,
			amount_total,
			tax_amount,
			status,
			due_date,
			issued_at,
			line_items,
			metadata,
			created_by
		)
		VALUES ($1, $2, $3, $4, $5, 'issued', $6, NOW(), $7, $8, $9)
		RETURNING
			id::text,
			invoice_number,
			tenant_id::text,
			(SELECT name FROM tenants WHERE id = tenant_id) AS tenant_name,
			currency,
			amount_total,
			tax_amount,
			status,
			due_date,
			issued_at,
			paid_at,
			COALESCE(external_ref, '') AS external_ref,
			line_items,
			metadata,
			created_at,
			updated_at
	`
	row, err := scanPlatformInvoice(s.db.QueryRow(
		ctx,
		query,
		tenantID,
		invoiceNumber,
		currency,
		params.AmountTotal,
		params.TaxAmount,
		dueDate,
		itemsJSON,
		metaJSON,
		createdBy,
	))
	if err != nil {
		return PlatformInvoice{}, err
	}
	return row, nil
}

func (s *Service) ResendPlatformInvoice(ctx context.Context, invoiceID string) (PlatformInvoice, error) {
	invID, err := parseInvoiceUUID(invoiceID)
	if err != nil {
		return PlatformInvoice{}, err
	}

	const query = `
		UPDATE platform_invoices
		SET
			metadata = jsonb_set(
				jsonb_set(
					COALESCE(metadata, '{}'::jsonb),
					'{resent_at}',
					to_jsonb(NOW()::text),
					TRUE
				),
				'{resent_count}',
				to_jsonb(
					COALESCE(
						CASE
							WHEN COALESCE(metadata->>'resent_count', '') ~ '^[0-9]+$'
							THEN (metadata->>'resent_count')::int
						END,
						0
					) + 1
				),
				TRUE
			),
			updated_at = NOW()
		WHERE id = $1
		RETURNING
			id::text,
			invoice_number,
			tenant_id::text,
			(SELECT name FROM tenants WHERE id = tenant_id) AS tenant_name,
			currency,
			amount_total,
			tax_amount,
			status,
			due_date,
			issued_at,
			paid_at,
			COALESCE(external_ref, '') AS external_ref,
			line_items,
			metadata,
			created_at,
			updated_at
	`
	row, err := scanPlatformInvoice(s.db.QueryRow(ctx, query, invID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformInvoice{}, ErrInvoiceNotFound
		}
		return PlatformInvoice{}, err
	}
	return row, nil
}

func (s *Service) MarkPlatformInvoicePaid(ctx context.Context, invoiceID string, params MarkPlatformInvoicePaidParams) (PlatformInvoice, error) {
	invID, err := parseInvoiceUUID(invoiceID)
	if err != nil {
		return PlatformInvoice{}, err
	}

	var paidAt pgtype.Timestamptz
	if raw := strings.TrimSpace(params.PaidAt); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return PlatformInvoice{}, ErrInvalidInvoicePayload
		}
		paidAt = pgtype.Timestamptz{Time: parsed, Valid: true}
	}

	paymentMode := strings.TrimSpace(params.PaymentMode)
	reference := strings.TrimSpace(params.Reference)

	const query = `
		UPDATE platform_invoices
		SET
			status = 'paid',
			paid_at = COALESCE($2, NOW()),
			external_ref = NULLIF($3, ''),
			metadata = jsonb_set(
				COALESCE(metadata, '{}'::jsonb),
				'{payment_mode}',
				to_jsonb($4::text),
				TRUE
			),
			updated_at = NOW()
		WHERE id = $1
		RETURNING
			id::text,
			invoice_number,
			tenant_id::text,
			(SELECT name FROM tenants WHERE id = tenant_id) AS tenant_name,
			currency,
			amount_total,
			tax_amount,
			status,
			due_date,
			issued_at,
			paid_at,
			COALESCE(external_ref, '') AS external_ref,
			line_items,
			metadata,
			created_at,
			updated_at
	`
	row, err := scanPlatformInvoice(s.db.QueryRow(ctx, query, invID, paidAt, reference, paymentMode))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformInvoice{}, ErrInvoiceNotFound
		}
		return PlatformInvoice{}, err
	}
	return row, nil
}

func (s *Service) ExportPlatformInvoice(ctx context.Context, invoiceID string) (PlatformInvoice, error) {
	invID, err := parseInvoiceUUID(invoiceID)
	if err != nil {
		return PlatformInvoice{}, err
	}

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
	row, err := scanPlatformInvoice(s.db.QueryRow(ctx, query, invID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformInvoice{}, ErrInvoiceNotFound
		}
		return PlatformInvoice{}, err
	}
	return row, nil
}

type invoiceRowScanner interface {
	Scan(dest ...interface{}) error
}

func scanPlatformInvoice(scanner invoiceRowScanner) (PlatformInvoice, error) {
	var row PlatformInvoice
	var dueDate pgtype.Timestamptz
	var issuedAt pgtype.Timestamptz
	var paidAt pgtype.Timestamptz
	var itemsJSON []byte
	var metadataJSON []byte

	if err := scanner.Scan(
		&row.ID,
		&row.InvoiceNumber,
		&row.TenantID,
		&row.TenantName,
		&row.Currency,
		&row.AmountTotal,
		&row.TaxAmount,
		&row.Status,
		&dueDate,
		&issuedAt,
		&paidAt,
		&row.ExternalRef,
		&itemsJSON,
		&metadataJSON,
		&row.CreatedAt,
		&row.UpdatedAt,
	); err != nil {
		return PlatformInvoice{}, err
	}

	row.LineItems = make([]map[string]interface{}, 0)
	if len(itemsJSON) > 0 {
		if err := json.Unmarshal(itemsJSON, &row.LineItems); err != nil {
			return PlatformInvoice{}, err
		}
	}

	row.Metadata = map[string]interface{}{}
	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &row.Metadata); err != nil {
			return PlatformInvoice{}, err
		}
	}

	if dueDate.Valid {
		v := dueDate.Time
		row.DueDate = &v
	}
	if issuedAt.Valid {
		v := issuedAt.Time
		row.IssuedAt = &v
	}
	if paidAt.Valid {
		v := paidAt.Time
		row.PaidAt = &v
	}

	return row, nil
}

func parseInvoiceUUID(raw string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(strings.TrimSpace(raw)); err != nil || !id.Valid {
		return pgtype.UUID{}, ErrInvalidInvoiceID
	}
	return id, nil
}
