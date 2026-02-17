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
	ErrInvalidSupportTicketID      = errors.New("invalid support ticket id")
	ErrInvalidSupportTicketPayload = errors.New("invalid support ticket payload")
	ErrSupportTicketNotFound       = errors.New("support ticket not found")
)

type PlatformSupportTicket struct {
	ID         string                 `json:"id"`
	TenantID   string                 `json:"tenant_id,omitempty"`
	Subject    string                 `json:"subject"`
	Priority   string                 `json:"priority"`
	Status     string                 `json:"status"`
	Tags       []string               `json:"tags"`
	Source     string                 `json:"source"`
	AssignedTo string                 `json:"assigned_to,omitempty"`
	CreatedBy  string                 `json:"created_by,omitempty"`
	DueAt      *time.Time             `json:"due_at,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}

type PlatformSupportTicketFilters struct {
	Search     string
	TenantID   string
	Status     string
	Priority   string
	AssignedTo string
	Tag        string
	Limit      int32
	Offset     int32
}

type CreatePlatformSupportTicketParams struct {
	TenantID   string                 `json:"tenant_id,omitempty"`
	Subject    string                 `json:"subject"`
	Priority   string                 `json:"priority,omitempty"`
	Tags       []string               `json:"tags,omitempty"`
	AssignedTo string                 `json:"assigned_to,omitempty"`
	DueAt      string                 `json:"due_at,omitempty"` // RFC3339
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	CreatedBy  string                 `json:"-"`
}

type UpdatePlatformSupportTicketParams struct {
	Subject    *string  `json:"subject,omitempty"`
	Priority   *string  `json:"priority,omitempty"`
	Status     *string  `json:"status,omitempty"`
	Tags       []string `json:"tags,omitempty"`
	AssignedTo *string  `json:"assigned_to,omitempty"`
	DueAt      *string  `json:"due_at,omitempty"` // RFC3339 or "" to clear
}

func (s *Service) ListPlatformSupportTickets(ctx context.Context, filters PlatformSupportTicketFilters) ([]PlatformSupportTicket, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	search := strings.TrimSpace(filters.Search)
	status := strings.ToLower(strings.TrimSpace(filters.Status))
	priority := strings.ToLower(strings.TrimSpace(filters.Priority))
	tag := strings.TrimSpace(filters.Tag)

	var tid pgtype.UUID
	_ = tid.Scan(strings.TrimSpace(filters.TenantID))
	if strings.TrimSpace(filters.TenantID) != "" && !tid.Valid {
		return nil, ErrInvalidTenantID
	}

	var assigned pgtype.UUID
	_ = assigned.Scan(strings.TrimSpace(filters.AssignedTo))
	if strings.TrimSpace(filters.AssignedTo) != "" && !assigned.Valid {
		return nil, ErrInvalidPlatformUserID
	}

	const query = `
		SELECT
			t.id::text,
			COALESCE(t.tenant_id::text, '') AS tenant_id,
			t.subject,
			t.priority,
			t.status,
			COALESCE(t.tags, '{}') AS tags,
			t.source,
			COALESCE(t.assigned_to::text, '') AS assigned_to,
			COALESCE(t.created_by::text, '') AS created_by,
			t.due_at,
			COALESCE(t.metadata, '{}'::jsonb) AS metadata,
			t.created_at,
			t.updated_at
		FROM support_tickets t
		WHERE ($1::text = '' OR t.subject ILIKE '%' || $1 || '%')
		  AND ($2::uuid IS NULL OR t.tenant_id = $2)
		  AND ($3::text = '' OR t.status = $3)
		  AND ($4::text = '' OR t.priority = $4)
		  AND ($5::uuid IS NULL OR t.assigned_to = $5)
		  AND ($6::text = '' OR $6 = ANY(t.tags))
		ORDER BY t.created_at DESC
		LIMIT $7 OFFSET $8
	`

	rows, err := s.db.Query(ctx, query, search, tid, status, priority, assigned, tag, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformSupportTicket, 0)
	for rows.Next() {
		var row PlatformSupportTicket
		var dueAt pgtype.Timestamptz
		var metadataJSON []byte
		var createdAt pgtype.Timestamptz
		var updatedAt pgtype.Timestamptz
		if err := rows.Scan(
			&row.ID,
			&row.TenantID,
			&row.Subject,
			&row.Priority,
			&row.Status,
			&row.Tags,
			&row.Source,
			&row.AssignedTo,
			&row.CreatedBy,
			&dueAt,
			&metadataJSON,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, err
		}

		row.Metadata = map[string]interface{}{}
		if len(metadataJSON) > 0 {
			_ = json.Unmarshal(metadataJSON, &row.Metadata)
		}
		if dueAt.Valid {
			v := dueAt.Time
			row.DueAt = &v
		}
		if createdAt.Valid {
			row.CreatedAt = createdAt.Time
		}
		if updatedAt.Valid {
			row.UpdatedAt = updatedAt.Time
		}

		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) CreatePlatformSupportTicket(ctx context.Context, params CreatePlatformSupportTicketParams) (PlatformSupportTicket, error) {
	subject := strings.TrimSpace(params.Subject)
	if subject == "" {
		return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
	}

	priority := strings.ToLower(strings.TrimSpace(params.Priority))
	if priority == "" {
		priority = "normal"
	}
	switch priority {
	case "low", "normal", "high", "critical":
	default:
		return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
	}

	tags := make([]string, 0)
	for _, t := range params.Tags {
		v := strings.TrimSpace(t)
		if v != "" {
			tags = append(tags, v)
		}
	}

	var tid pgtype.UUID
	_ = tid.Scan(strings.TrimSpace(params.TenantID))
	if strings.TrimSpace(params.TenantID) != "" && !tid.Valid {
		return PlatformSupportTicket{}, ErrInvalidTenantID
	}

	var assigned pgtype.UUID
	_ = assigned.Scan(strings.TrimSpace(params.AssignedTo))
	if strings.TrimSpace(params.AssignedTo) != "" && !assigned.Valid {
		return PlatformSupportTicket{}, ErrInvalidPlatformUserID
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	var dueAt pgtype.Timestamptz
	if strings.TrimSpace(params.DueAt) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(params.DueAt))
		if err != nil {
			return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
		}
		dueAt = pgtype.Timestamptz{Time: parsed.UTC(), Valid: true}
	}

	metadata := params.Metadata
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	metaJSON, err := json.Marshal(metadata)
	if err != nil {
		return PlatformSupportTicket{}, err
	}

	var id string
	err = s.db.QueryRow(ctx, `
		INSERT INTO support_tickets (
			tenant_id,
			subject,
			priority,
			status,
			tags,
			source,
			assigned_to,
			created_by,
			due_at,
			metadata,
			created_at,
			updated_at
		)
		VALUES ($1, $2, $3, 'open', $4, 'internal', $5, $6, $7, $8, NOW(), NOW())
		RETURNING id::text
	`, tid, subject, priority, tags, assigned, createdBy, dueAt, metaJSON).Scan(&id)
	if err != nil {
		return PlatformSupportTicket{}, err
	}

	return s.getPlatformSupportTicketByID(ctx, id)
}

func (s *Service) UpdatePlatformSupportTicket(ctx context.Context, ticketID string, params UpdatePlatformSupportTicketParams) (PlatformSupportTicket, error) {
	var tid pgtype.UUID
	if err := tid.Scan(strings.TrimSpace(ticketID)); err != nil || !tid.Valid {
		return PlatformSupportTicket{}, ErrInvalidSupportTicketID
	}

	setClauses := make([]string, 0, 6)
	args := make([]interface{}, 0, 8)
	idx := 1

	if params.Subject != nil {
		v := strings.TrimSpace(*params.Subject)
		if v == "" {
			return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
		}
		setClauses = append(setClauses, fmt.Sprintf("subject = $%d", idx))
		args = append(args, v)
		idx++
	}

	if params.Priority != nil {
		v := strings.ToLower(strings.TrimSpace(*params.Priority))
		switch v {
		case "low", "normal", "high", "critical":
		default:
			return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
		}
		setClauses = append(setClauses, fmt.Sprintf("priority = $%d", idx))
		args = append(args, v)
		idx++
	}

	if params.Status != nil {
		v := strings.ToLower(strings.TrimSpace(*params.Status))
		switch v {
		case "open", "in_progress", "resolved", "closed":
		default:
			return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
		}
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", idx))
		args = append(args, v)
		idx++
	}

	if params.AssignedTo != nil {
		raw := strings.TrimSpace(*params.AssignedTo)
		var assigned pgtype.UUID
		if raw != "" {
			if err := assigned.Scan(raw); err != nil || !assigned.Valid {
				return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
			}
		}
		setClauses = append(setClauses, fmt.Sprintf("assigned_to = $%d", idx))
		args = append(args, assigned)
		idx++
	}

	if params.DueAt != nil {
		raw := strings.TrimSpace(*params.DueAt)
		var due pgtype.Timestamptz
		if raw != "" {
			parsed, err := time.Parse(time.RFC3339, raw)
			if err != nil {
				return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
			}
			due = pgtype.Timestamptz{Time: parsed.UTC(), Valid: true}
		}
		setClauses = append(setClauses, fmt.Sprintf("due_at = $%d", idx))
		args = append(args, due)
		idx++
	}

	if params.Tags != nil {
		tags := make([]string, 0)
		for _, t := range params.Tags {
			v := strings.TrimSpace(t)
			if v != "" {
				tags = append(tags, v)
			}
		}
		setClauses = append(setClauses, fmt.Sprintf("tags = $%d", idx))
		args = append(args, tags)
		idx++
	}

	if len(setClauses) == 0 {
		return PlatformSupportTicket{}, ErrInvalidSupportTicketPayload
	}

	args = append(args, tid)
	query := fmt.Sprintf("UPDATE support_tickets SET %s, updated_at = NOW() WHERE id = $%d", strings.Join(setClauses, ", "), idx)

	tag, err := s.db.Exec(ctx, query, args...)
	if err != nil {
		return PlatformSupportTicket{}, err
	}
	if tag.RowsAffected() == 0 {
		return PlatformSupportTicket{}, ErrSupportTicketNotFound
	}

	return s.getPlatformSupportTicketByID(ctx, ticketID)
}

func (s *Service) getPlatformSupportTicketByID(ctx context.Context, ticketID string) (PlatformSupportTicket, error) {
	var tid pgtype.UUID
	if err := tid.Scan(strings.TrimSpace(ticketID)); err != nil || !tid.Valid {
		return PlatformSupportTicket{}, ErrInvalidSupportTicketID
	}

	const query = `
		SELECT
			t.id::text,
			COALESCE(t.tenant_id::text, '') AS tenant_id,
			t.subject,
			t.priority,
			t.status,
			COALESCE(t.tags, '{}') AS tags,
			t.source,
			COALESCE(t.assigned_to::text, '') AS assigned_to,
			COALESCE(t.created_by::text, '') AS created_by,
			t.due_at,
			COALESCE(t.metadata, '{}'::jsonb) AS metadata,
			t.created_at,
			t.updated_at
		FROM support_tickets t
		WHERE t.id = $1
		LIMIT 1
	`

	var out PlatformSupportTicket
	var dueAt pgtype.Timestamptz
	var metadataJSON []byte
	var createdAt pgtype.Timestamptz
	var updatedAt pgtype.Timestamptz

	if err := s.db.QueryRow(ctx, query, tid).Scan(
		&out.ID,
		&out.TenantID,
		&out.Subject,
		&out.Priority,
		&out.Status,
		&out.Tags,
		&out.Source,
		&out.AssignedTo,
		&out.CreatedBy,
		&dueAt,
		&metadataJSON,
		&createdAt,
		&updatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformSupportTicket{}, ErrSupportTicketNotFound
		}
		return PlatformSupportTicket{}, err
	}

	out.Metadata = map[string]interface{}{}
	if len(metadataJSON) > 0 {
		_ = json.Unmarshal(metadataJSON, &out.Metadata)
	}
	if dueAt.Valid {
		v := dueAt.Time
		out.DueAt = &v
	}
	if createdAt.Valid {
		out.CreatedAt = createdAt.Time
	}
	if updatedAt.Valid {
		out.UpdatedAt = updatedAt.Time
	}
	return out, nil
}
