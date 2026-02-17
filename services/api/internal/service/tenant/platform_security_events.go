package tenant

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type PlatformSecurityEventFilters struct {
	TenantID    string
	UserID      string
	EventType   string
	Severity    string
	CreatedFrom *time.Time
	CreatedTo   *time.Time
	Limit       int32
	Offset      int32
}

type PlatformSecurityEventRow struct {
	ID         string         `json:"id"`
	TenantID   string         `json:"tenant_id"`
	TenantName string         `json:"tenant_name"`
	UserID     string         `json:"user_id"`
	UserEmail  string         `json:"user_email"`
	UserName   string         `json:"user_name"`
	RoleName   string         `json:"role_name"`
	EventType  string         `json:"event_type"`
	Severity   string         `json:"severity"`
	Method     string         `json:"method"`
	Path       string         `json:"path"`
	StatusCode int32          `json:"status_code"`
	IPAddress  string         `json:"ip_address"`
	Origin     string         `json:"origin"`
	RequestID  string         `json:"request_id"`
	Metadata   map[string]any `json:"metadata"`
	CreatedAt  time.Time      `json:"created_at"`
}

func (s *Service) ListPlatformSecurityEvents(ctx context.Context, filters PlatformSecurityEventFilters) ([]PlatformSecurityEventRow, error) {
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
		uid, err := parsePlatformUserUUID(raw)
		if err != nil {
			return nil, err
		}
		userID = uid
	}

	eventType := strings.TrimSpace(filters.EventType)
	severity := strings.ToLower(strings.TrimSpace(filters.Severity))

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
			se.id::text,
			COALESCE(se.tenant_id::text, '') AS tenant_id,
			COALESCE(t.name, '') AS tenant_name,
			COALESCE(se.user_id::text, '') AS user_id,
			COALESCE(u.email, '') AS user_email,
			COALESCE(u.full_name, '') AS user_name,
			COALESCE(se.role_name, '') AS role_name,
			se.event_type,
			se.severity,
			COALESCE(se.method, '') AS method,
			COALESCE(se.path, '') AS path,
			COALESCE(se.status_code, 0)::int AS status_code,
			COALESCE(se.ip_address, '') AS ip_address,
			COALESCE(se.origin, '') AS origin,
			COALESCE(se.request_id, '') AS request_id,
			se.metadata,
			se.created_at
		FROM security_events se
		LEFT JOIN tenants t ON t.id = se.tenant_id
		LEFT JOIN users u ON u.id = se.user_id
		WHERE ($1::uuid IS NULL OR se.tenant_id = $1)
		  AND ($2::uuid IS NULL OR se.user_id = $2)
		  AND ($3::text = '' OR se.event_type ILIKE '%' || $3 || '%')
		  AND ($4::text = '' OR se.severity = $4)
		  AND ($5::timestamptz IS NULL OR se.created_at >= $5)
		  AND ($6::timestamptz IS NULL OR se.created_at <= $6)
		ORDER BY se.created_at DESC
		LIMIT $7 OFFSET $8
	`

	rows, err := s.db.Query(ctx, query, tenantID, userID, eventType, severity, createdFrom, createdTo, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformSecurityEventRow, 0)
	for rows.Next() {
		var row PlatformSecurityEventRow
		var metadataRaw []byte
		if err := rows.Scan(
			&row.ID,
			&row.TenantID,
			&row.TenantName,
			&row.UserID,
			&row.UserEmail,
			&row.UserName,
			&row.RoleName,
			&row.EventType,
			&row.Severity,
			&row.Method,
			&row.Path,
			&row.StatusCode,
			&row.IPAddress,
			&row.Origin,
			&row.RequestID,
			&metadataRaw,
			&row.CreatedAt,
		); err != nil {
			return nil, err
		}

		row.Metadata = map[string]any{}
		if len(metadataRaw) > 0 {
			_ = json.Unmarshal(metadataRaw, &row.Metadata)
		}

		out = append(out, row)
	}
	return out, rows.Err()
}
