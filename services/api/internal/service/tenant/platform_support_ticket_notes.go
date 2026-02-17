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
	ErrInvalidSupportTicketNotePayload = errors.New("invalid support ticket note payload")
	ErrSupportTicketNoteNotFound       = errors.New("support ticket note not found")
)

type PlatformSupportTicketNote struct {
	ID             string                   `json:"id"`
	TicketID       string                   `json:"ticket_id"`
	NoteType       string                   `json:"note_type"`
	Note           string                   `json:"note"`
	Attachments    []map[string]any         `json:"attachments"`
	CreatedBy      string                   `json:"created_by,omitempty"`
	CreatedByEmail string                   `json:"created_by_email,omitempty"`
	CreatedByName  string                   `json:"created_by_name,omitempty"`
	CreatedAt      time.Time                `json:"created_at"`
}

type CreatePlatformSupportTicketNoteParams struct {
	NoteType    string           `json:"note_type,omitempty"` // internal, customer
	Note        string           `json:"note"`
	Attachments []map[string]any `json:"attachments,omitempty"`
	CreatedBy   string           `json:"-"`
}

func (s *Service) ListPlatformSupportTicketNotes(ctx context.Context, ticketID string) ([]PlatformSupportTicketNote, error) {
	var tid pgtype.UUID
	if err := tid.Scan(strings.TrimSpace(ticketID)); err != nil || !tid.Valid {
		return nil, ErrInvalidSupportTicketID
	}

	var exists bool
	if err := s.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM support_tickets WHERE id = $1)`, tid).Scan(&exists); err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrSupportTicketNotFound
	}

	const query = `
		SELECT
			n.id::text,
			n.ticket_id::text,
			n.note_type,
			n.note,
			COALESCE(n.attachments, '[]'::jsonb) AS attachments,
			COALESCE(n.created_by::text, '') AS created_by,
			COALESCE(u.email::text, '') AS created_by_email,
			COALESCE(u.full_name, '') AS created_by_name,
			n.created_at
		FROM support_ticket_notes n
		LEFT JOIN users u ON u.id = n.created_by
		WHERE n.ticket_id = $1
		ORDER BY n.created_at ASC
		LIMIT 500
	`

	rows, err := s.db.Query(ctx, query, tid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformSupportTicketNote, 0)
	for rows.Next() {
		var row PlatformSupportTicketNote
		var attachmentsJSON []byte
		var createdAt pgtype.Timestamptz
		if err := rows.Scan(
			&row.ID,
			&row.TicketID,
			&row.NoteType,
			&row.Note,
			&attachmentsJSON,
			&row.CreatedBy,
			&row.CreatedByEmail,
			&row.CreatedByName,
			&createdAt,
		); err != nil {
			return nil, err
		}

		row.Attachments = make([]map[string]any, 0)
		if len(attachmentsJSON) > 0 {
			_ = json.Unmarshal(attachmentsJSON, &row.Attachments)
		}
		if createdAt.Valid {
			row.CreatedAt = createdAt.Time
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) CreatePlatformSupportTicketNote(ctx context.Context, ticketID string, params CreatePlatformSupportTicketNoteParams) (PlatformSupportTicketNote, error) {
	var tid pgtype.UUID
	if err := tid.Scan(strings.TrimSpace(ticketID)); err != nil || !tid.Valid {
		return PlatformSupportTicketNote{}, ErrInvalidSupportTicketID
	}

	note := strings.TrimSpace(params.Note)
	if note == "" {
		return PlatformSupportTicketNote{}, ErrInvalidSupportTicketNotePayload
	}
	if len(note) > 10_000 {
		return PlatformSupportTicketNote{}, ErrInvalidSupportTicketNotePayload
	}

	noteType := strings.ToLower(strings.TrimSpace(params.NoteType))
	if noteType == "" {
		noteType = "internal"
	}
	switch noteType {
	case "internal", "customer":
	default:
		return PlatformSupportTicketNote{}, ErrInvalidSupportTicketNotePayload
	}

	attachments := params.Attachments
	if attachments == nil {
		attachments = make([]map[string]any, 0)
	}
	if len(attachments) > 20 {
		return PlatformSupportTicketNote{}, ErrInvalidSupportTicketNotePayload
	}
	for i := range attachments {
		if attachments[i] == nil {
			attachments[i] = map[string]any{}
			continue
		}
		if v, ok := attachments[i]["name"].(string); ok {
			attachments[i]["name"] = strings.TrimSpace(v)
		}
		if v, ok := attachments[i]["url"].(string); ok {
			attachments[i]["url"] = strings.TrimSpace(v)
		}
	}

	attachmentsJSON, err := json.Marshal(attachments)
	if err != nil {
		return PlatformSupportTicketNote{}, err
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	// Ensure the ticket exists first so we can return a clean 404.
	var exists bool
	if err := s.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM support_tickets WHERE id = $1)`, tid).Scan(&exists); err != nil {
		return PlatformSupportTicketNote{}, err
	}
	if !exists {
		return PlatformSupportTicketNote{}, ErrSupportTicketNotFound
	}

	var noteID string
	if err := s.db.QueryRow(ctx, `
		INSERT INTO support_ticket_notes (ticket_id, note_type, note, attachments, created_by, created_at)
		VALUES ($1, $2, $3, $4::jsonb, $5, NOW())
		RETURNING id::text
	`, tid, noteType, note, attachmentsJSON, createdBy).Scan(&noteID); err != nil {
		return PlatformSupportTicketNote{}, err
	}

	// Touch ticket updated_at for timeline/sorting.
	_, _ = s.db.Exec(ctx, `UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`, tid)

	return s.getPlatformSupportTicketNoteByID(ctx, noteID)
}

func (s *Service) getPlatformSupportTicketNoteByID(ctx context.Context, noteID string) (PlatformSupportTicketNote, error) {
	var nid pgtype.UUID
	if err := nid.Scan(strings.TrimSpace(noteID)); err != nil || !nid.Valid {
		return PlatformSupportTicketNote{}, ErrInvalidSupportTicketNotePayload
	}

	const query = `
		SELECT
			n.id::text,
			n.ticket_id::text,
			n.note_type,
			n.note,
			COALESCE(n.attachments, '[]'::jsonb) AS attachments,
			COALESCE(n.created_by::text, '') AS created_by,
			COALESCE(u.email::text, '') AS created_by_email,
			COALESCE(u.full_name, '') AS created_by_name,
			n.created_at
		FROM support_ticket_notes n
		LEFT JOIN users u ON u.id = n.created_by
		WHERE n.id = $1
		LIMIT 1
	`

	var out PlatformSupportTicketNote
	var attachmentsJSON []byte
	var createdAt pgtype.Timestamptz
	if err := s.db.QueryRow(ctx, query, nid).Scan(
		&out.ID,
		&out.TicketID,
		&out.NoteType,
		&out.Note,
		&attachmentsJSON,
		&out.CreatedBy,
		&out.CreatedByEmail,
		&out.CreatedByName,
		&createdAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformSupportTicketNote{}, ErrSupportTicketNoteNotFound
		}
		return PlatformSupportTicketNote{}, err
	}

	out.Attachments = make([]map[string]any, 0)
	if len(attachmentsJSON) > 0 {
		_ = json.Unmarshal(attachmentsJSON, &out.Attachments)
	}
	if createdAt.Valid {
		out.CreatedAt = createdAt.Time
	}
	return out, nil
}
