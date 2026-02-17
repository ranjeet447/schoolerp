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
	ErrInvalidSecurityBlockID      = errors.New("invalid security block id")
	ErrInvalidSecurityBlockPayload = errors.New("invalid security block payload")
	ErrSecurityBlockNotFound       = errors.New("security block not found")
)

type PlatformSecurityBlock struct {
	ID             string                 `json:"id"`
	TargetType     string                 `json:"target_type"`
	TargetTenantID string                 `json:"target_tenant_id,omitempty"`
	TargetUserID   string                 `json:"target_user_id,omitempty"`
	Status         string                 `json:"status"`
	Severity       string                 `json:"severity"`
	Reason         string                 `json:"reason"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`

	CreatedBy      string     `json:"created_by,omitempty"`
	CreatedByName  string     `json:"created_by_name,omitempty"`
	CreatedByEmail string     `json:"created_by_email,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`

	ReleasedBy      string     `json:"released_by,omitempty"`
	ReleasedByName  string     `json:"released_by_name,omitempty"`
	ReleasedByEmail string     `json:"released_by_email,omitempty"`
	ReleasedAt      *time.Time `json:"released_at,omitempty"`
}

type PlatformSecurityBlockFilters struct {
	TargetType string
	TenantID   string
	UserID     string
	Status     string
	Limit      int32
	Offset     int32
}

type CreatePlatformSecurityBlockParams struct {
	TargetType       string                 `json:"target_type"`
	TargetTenantID   string                 `json:"target_tenant_id,omitempty"`
	TargetUserID     string                 `json:"target_user_id,omitempty"`
	Severity         string                 `json:"severity,omitempty"`
	Reason           string                 `json:"reason"`
	ExpiresInMinutes int                    `json:"expires_in_minutes,omitempty"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
	CreatedBy        string                 `json:"-"`
}

func (s *Service) ListPlatformSecurityBlocks(ctx context.Context, filters PlatformSecurityBlockFilters) ([]PlatformSecurityBlock, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	targetType := strings.ToLower(strings.TrimSpace(filters.TargetType))
	status := strings.ToLower(strings.TrimSpace(filters.Status))
	tenantID := strings.TrimSpace(filters.TenantID)
	userID := strings.TrimSpace(filters.UserID)

	var tid pgtype.UUID
	_ = tid.Scan(tenantID)
	if tenantID != "" && !tid.Valid {
		return nil, ErrInvalidTenantID
	}

	var uid pgtype.UUID
	_ = uid.Scan(userID)
	if userID != "" && !uid.Valid {
		return nil, ErrInvalidPlatformUserID
	}

	if status == "" {
		status = "active"
	}
	if status != "active" && status != "released" {
		return nil, ErrInvalidSecurityBlockPayload
	}

	if targetType != "" && targetType != "tenant" && targetType != "user" {
		return nil, ErrInvalidSecurityBlockPayload
	}

	const query = `
		SELECT
			b.id::text,
			b.target_type,
			COALESCE(b.target_tenant_id::text, '') AS target_tenant_id,
			COALESCE(b.target_user_id::text, '') AS target_user_id,
			b.status,
			b.severity,
			b.reason,
			COALESCE(b.metadata, '{}'::jsonb) AS metadata,
			COALESCE(b.created_by::text, '') AS created_by,
			COALESCE(cu.full_name, '') AS created_by_name,
			COALESCE(cu.email, '') AS created_by_email,
			b.created_at,
			b.expires_at,
			COALESCE(b.released_by::text, '') AS released_by,
			COALESCE(ru.full_name, '') AS released_by_name,
			COALESCE(ru.email, '') AS released_by_email,
			b.released_at
		FROM platform_security_blocks b
		LEFT JOIN users cu ON cu.id = b.created_by
		LEFT JOIN users ru ON ru.id = b.released_by
		WHERE ($1::text = '' OR b.target_type = $1)
		  AND ($2::uuid IS NULL OR b.target_tenant_id = $2)
		  AND ($3::uuid IS NULL OR b.target_user_id = $3)
		  AND b.status = $4
		ORDER BY b.created_at DESC
		LIMIT $5 OFFSET $6
	`

	rows, err := s.db.Query(ctx, query, targetType, tid, uid, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformSecurityBlock, 0)
	for rows.Next() {
		block, err := scanPlatformSecurityBlock(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, block)
	}
	return out, rows.Err()
}

func (s *Service) CreatePlatformSecurityBlock(ctx context.Context, params CreatePlatformSecurityBlockParams) (PlatformSecurityBlock, error) {
	targetType := strings.ToLower(strings.TrimSpace(params.TargetType))
	if targetType != "tenant" && targetType != "user" {
		return PlatformSecurityBlock{}, ErrInvalidSecurityBlockPayload
	}

	reason := strings.TrimSpace(params.Reason)
	if reason == "" {
		return PlatformSecurityBlock{}, ErrInvalidSecurityBlockPayload
	}

	severity := strings.ToLower(strings.TrimSpace(params.Severity))
	if severity == "" {
		severity = "warning"
	}
	switch severity {
	case "info", "warning", "critical":
	default:
		return PlatformSecurityBlock{}, ErrInvalidSecurityBlockPayload
	}

	var tid pgtype.UUID
	_ = tid.Scan(strings.TrimSpace(params.TargetTenantID))
	if strings.TrimSpace(params.TargetTenantID) != "" && !tid.Valid {
		return PlatformSecurityBlock{}, ErrInvalidTenantID
	}

	var uid pgtype.UUID
	_ = uid.Scan(strings.TrimSpace(params.TargetUserID))
	if strings.TrimSpace(params.TargetUserID) != "" && !uid.Valid {
		return PlatformSecurityBlock{}, ErrInvalidPlatformUserID
	}

	if !tid.Valid && !uid.Valid {
		return PlatformSecurityBlock{}, ErrInvalidSecurityBlockPayload
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	metadata := params.Metadata
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return PlatformSecurityBlock{}, err
	}

	var expiresAt pgtype.Timestamptz
	if params.ExpiresInMinutes > 0 {
		if params.ExpiresInMinutes > 525600 { // 365 days
			return PlatformSecurityBlock{}, ErrInvalidSecurityBlockPayload
		}
		expiresAt = pgtype.Timestamptz{Time: time.Now().UTC().Add(time.Duration(params.ExpiresInMinutes) * time.Minute), Valid: true}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PlatformSecurityBlock{}, err
	}
	defer tx.Rollback(ctx)

	var blockID pgtype.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO platform_security_blocks (
			target_type,
			target_tenant_id,
			target_user_id,
			status,
			severity,
			reason,
			metadata,
			created_by,
			expires_at,
			created_at
		)
		VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8, NOW())
		RETURNING id
	`, targetType, tid, uid, severity, reason, metadataJSON, createdBy, expiresAt).Scan(&blockID); err != nil {
		return PlatformSecurityBlock{}, err
	}

	// Best-effort: revoke sessions so existing tokens stop working immediately.
	if uid.Valid {
		_, _ = tx.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, uid)
	} else if tid.Valid {
		_, _ = tx.Exec(ctx, `
			DELETE FROM sessions
			WHERE user_id IN (
				SELECT DISTINCT user_id
				FROM role_assignments
				WHERE tenant_id = $1
			)
		`, tid)
	}

	block, err := getPlatformSecurityBlockByID(ctx, tx, blockID)
	if err != nil {
		return PlatformSecurityBlock{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PlatformSecurityBlock{}, err
	}

	return block, nil
}

func (s *Service) ReleasePlatformSecurityBlock(ctx context.Context, blockID string, actorID string, notes string) (PlatformSecurityBlock, error) {
	var bid pgtype.UUID
	if err := bid.Scan(strings.TrimSpace(blockID)); err != nil || !bid.Valid {
		return PlatformSecurityBlock{}, ErrInvalidSecurityBlockID
	}

	var releasedBy pgtype.UUID
	_ = releasedBy.Scan(strings.TrimSpace(actorID))

	notes = strings.TrimSpace(notes)

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PlatformSecurityBlock{}, err
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx, `
		UPDATE platform_security_blocks
		SET status = 'released',
			released_by = $2,
			released_at = NOW(),
			metadata = CASE
				WHEN $3::text = '' THEN metadata
				ELSE metadata || jsonb_build_object('release_notes', $3)
			END
		WHERE id = $1 AND status = 'active'
	`, bid, releasedBy, notes)
	if err != nil {
		return PlatformSecurityBlock{}, err
	}
	if tag.RowsAffected() == 0 {
		return PlatformSecurityBlock{}, ErrSecurityBlockNotFound
	}

	block, err := getPlatformSecurityBlockByID(ctx, tx, bid)
	if err != nil {
		return PlatformSecurityBlock{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PlatformSecurityBlock{}, err
	}

	return block, nil
}

func scanPlatformSecurityBlock(rows pgx.Rows) (PlatformSecurityBlock, error) {
	var out PlatformSecurityBlock
	var metadataJSON []byte
	var createdAt pgtype.Timestamptz
	var expiresAt pgtype.Timestamptz
	var releasedAt pgtype.Timestamptz

	if err := rows.Scan(
		&out.ID,
		&out.TargetType,
		&out.TargetTenantID,
		&out.TargetUserID,
		&out.Status,
		&out.Severity,
		&out.Reason,
		&metadataJSON,
		&out.CreatedBy,
		&out.CreatedByName,
		&out.CreatedByEmail,
		&createdAt,
		&expiresAt,
		&out.ReleasedBy,
		&out.ReleasedByName,
		&out.ReleasedByEmail,
		&releasedAt,
	); err != nil {
		return PlatformSecurityBlock{}, err
	}

	out.Metadata = map[string]interface{}{}
	if len(metadataJSON) > 0 {
		_ = json.Unmarshal(metadataJSON, &out.Metadata)
	}
	if createdAt.Valid {
		out.CreatedAt = createdAt.Time
	}
	if expiresAt.Valid {
		v := expiresAt.Time
		out.ExpiresAt = &v
	}
	if releasedAt.Valid {
		v := releasedAt.Time
		out.ReleasedAt = &v
	}

	out.TargetType = strings.ToLower(strings.TrimSpace(out.TargetType))
	out.Status = strings.ToLower(strings.TrimSpace(out.Status))
	out.Severity = strings.ToLower(strings.TrimSpace(out.Severity))

	out.TargetTenantID = strings.TrimSpace(out.TargetTenantID)
	out.TargetUserID = strings.TrimSpace(out.TargetUserID)
	out.CreatedBy = strings.TrimSpace(out.CreatedBy)
	out.ReleasedBy = strings.TrimSpace(out.ReleasedBy)

	return out, nil
}

func getPlatformSecurityBlockByID(ctx context.Context, tx interface {
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
}, blockID pgtype.UUID) (PlatformSecurityBlock, error) {
	const query = `
		SELECT
			b.id::text,
			b.target_type,
			COALESCE(b.target_tenant_id::text, '') AS target_tenant_id,
			COALESCE(b.target_user_id::text, '') AS target_user_id,
			b.status,
			b.severity,
			b.reason,
			COALESCE(b.metadata, '{}'::jsonb) AS metadata,
			COALESCE(b.created_by::text, '') AS created_by,
			COALESCE(cu.full_name, '') AS created_by_name,
			COALESCE(cu.email, '') AS created_by_email,
			b.created_at,
			b.expires_at,
			COALESCE(b.released_by::text, '') AS released_by,
			COALESCE(ru.full_name, '') AS released_by_name,
			COALESCE(ru.email, '') AS released_by_email,
			b.released_at
		FROM platform_security_blocks b
		LEFT JOIN users cu ON cu.id = b.created_by
		LEFT JOIN users ru ON ru.id = b.released_by
		WHERE b.id = $1
		LIMIT 1
	`

	rows, err := tx.Query(ctx, query, blockID)
	if err != nil {
		return PlatformSecurityBlock{}, err
	}
	defer rows.Close()
	if !rows.Next() {
		return PlatformSecurityBlock{}, pgx.ErrNoRows
	}
	return scanPlatformSecurityBlock(rows)
}
