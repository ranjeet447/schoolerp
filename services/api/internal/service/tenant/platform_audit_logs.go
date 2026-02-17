package tenant

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type PlatformAuditLogFilters struct {
	TenantID    string
	UserID      string
	Action      string
	CreatedFrom *time.Time
	CreatedTo   *time.Time
	Limit       int32
	Offset      int32
}

type PlatformAuditLogRow struct {
	ID           int64     `json:"id"`
	TenantID     string    `json:"tenant_id"`
	TenantName   string    `json:"tenant_name"`
	UserID       string    `json:"user_id"`
	UserEmail    string    `json:"user_email"`
	UserName     string    `json:"user_name"`
	Action       string    `json:"action"`
	ResourceType string    `json:"resource_type"`
	ResourceID   string    `json:"resource_id"`
	ReasonCode   string    `json:"reason_code"`
	RequestID    string    `json:"request_id"`
	IPAddress    string    `json:"ip_address"`
	CreatedAt    time.Time `json:"created_at"`
}

func (s *Service) ListPlatformAuditLogs(ctx context.Context, filters PlatformAuditLogFilters) ([]PlatformAuditLogRow, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	var tenantID pgtype.UUID
	if raw := strings.TrimSpace(filters.TenantID); raw != "" {
		if err := tenantID.Scan(raw); err != nil || !tenantID.Valid {
			return nil, ErrInvalidTenantID
		}
	}

	var userID pgtype.UUID
	if raw := strings.TrimSpace(filters.UserID); raw != "" {
		parsedUserID, err := parsePlatformUserUUID(raw)
		if err != nil {
			return nil, ErrInvalidPlatformUserID
		}
		userID = parsedUserID
	}

	action := strings.TrimSpace(filters.Action)

	var createdFrom pgtype.Timestamptz
	if filters.CreatedFrom != nil {
		createdFrom = pgtype.Timestamptz{Time: filters.CreatedFrom.UTC(), Valid: true}
	}

	var createdTo pgtype.Timestamptz
	if filters.CreatedTo != nil {
		createdTo = pgtype.Timestamptz{Time: filters.CreatedTo.UTC(), Valid: true}
	}

	const query = `
		SELECT
			al.id,
			COALESCE(al.tenant_id::text, '') AS tenant_id,
			COALESCE(t.name, '') AS tenant_name,
			COALESCE(al.user_id::text, '') AS user_id,
			COALESCE(u.email, '') AS user_email,
			COALESCE(u.full_name, '') AS user_name,
			al.action,
			al.resource_type,
			COALESCE(al.resource_id::text, '') AS resource_id,
			COALESCE(al.reason_code, '') AS reason_code,
			COALESCE(al.request_id, '') AS request_id,
			COALESCE(al.ip_address, '') AS ip_address,
			al.created_at
		FROM audit_logs al
		LEFT JOIN tenants t ON t.id = al.tenant_id
		LEFT JOIN users u ON u.id = al.user_id
		WHERE ($1::uuid IS NULL OR al.tenant_id = $1)
		  AND ($2::uuid IS NULL OR al.user_id = $2)
		  AND ($3::text = '' OR al.action ILIKE '%' || $3 || '%')
		  AND ($4::timestamptz IS NULL OR al.created_at >= $4)
		  AND ($5::timestamptz IS NULL OR al.created_at <= $5)
		ORDER BY al.created_at DESC
		LIMIT $6 OFFSET $7
	`

	rows, err := s.db.Query(ctx, query, tenantID, userID, action, createdFrom, createdTo, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformAuditLogRow, 0)
	for rows.Next() {
		var row PlatformAuditLogRow
		if err := rows.Scan(
			&row.ID,
			&row.TenantID,
			&row.TenantName,
			&row.UserID,
			&row.UserEmail,
			&row.UserName,
			&row.Action,
			&row.ResourceType,
			&row.ResourceID,
			&row.ReasonCode,
			&row.RequestID,
			&row.IPAddress,
			&row.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, row)
	}

	return out, rows.Err()
}
