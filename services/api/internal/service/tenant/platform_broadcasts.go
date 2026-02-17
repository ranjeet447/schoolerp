package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

var (
	ErrInvalidPlatformBroadcastPayload = errors.New("invalid platform broadcast payload")
)

type PlatformBroadcast struct {
	ID         string     `json:"id"`
	IncidentID string     `json:"incident_id,omitempty"`
	Title      string     `json:"title"`
	Message    string     `json:"message"`
	Channels   []string   `json:"channels"`
	TenantIDs  []string   `json:"tenant_ids"`
	Status     string     `json:"status"`
	CreatedBy  string     `json:"created_by,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	SentAt     *time.Time `json:"sent_at,omitempty"`
	Queued     int        `json:"queued"`
}

type CreatePlatformIncidentBroadcastParams struct {
	Title     string   `json:"title,omitempty"`
	Message   string   `json:"message"`
	Channels  []string `json:"channels,omitempty"`
	TenantIDs []string `json:"tenant_ids,omitempty"`
	CreatedBy string   `json:"-"`
}

func normalizeBroadcastChannels(raw []string) []string {
	allowed := map[string]struct{}{
		"in_app":   {},
		"push":     {},
		"email":    {},
		"sms":      {},
		"whatsapp": {},
	}

	out := make([]string, 0, len(raw))
	seen := map[string]struct{}{}
	for _, v := range raw {
		c := strings.ToLower(strings.TrimSpace(v))
		if c == "" {
			continue
		}
		if _, ok := allowed[c]; !ok {
			continue
		}
		if _, ok := seen[c]; ok {
			continue
		}
		seen[c] = struct{}{}
		out = append(out, c)
	}
	if len(out) == 0 {
		return []string{"in_app"}
	}
	return out
}

func (s *Service) CreatePlatformIncidentBroadcast(ctx context.Context, incidentID string, params CreatePlatformIncidentBroadcastParams) (PlatformBroadcast, error) {
	incidentID = strings.TrimSpace(incidentID)
	var iid pgtype.UUID
	if err := iid.Scan(incidentID); err != nil || !iid.Valid {
		return PlatformBroadcast{}, ErrInvalidPlatformIncidentID
	}

	message := strings.TrimSpace(params.Message)
	if message == "" || len(message) > 10_000 {
		return PlatformBroadcast{}, ErrInvalidPlatformBroadcastPayload
	}

	title := strings.TrimSpace(params.Title)
	if len(title) > 200 {
		return PlatformBroadcast{}, ErrInvalidPlatformBroadcastPayload
	}

	channels := normalizeBroadcastChannels(params.Channels)

	targetTenantIDs, err := validateUUIDStrings(params.TenantIDs)
	if err != nil {
		return PlatformBroadcast{}, ErrInvalidPlatformBroadcastPayload
	}

	if len(targetTenantIDs) == 0 {
		const incQuery = `
			SELECT COALESCE(affected_tenant_ids::text[], '{}') AS affected_tenant_ids
			FROM platform_incidents
			WHERE id = $1
		`
		var affected []string
		if err := s.db.QueryRow(ctx, incQuery, iid).Scan(&affected); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return PlatformBroadcast{}, ErrPlatformIncidentNotFound
			}
			return PlatformBroadcast{}, err
		}
		targetTenantIDs = affected
	}

	if len(targetTenantIDs) == 0 {
		return PlatformBroadcast{}, ErrInvalidPlatformBroadcastPayload
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PlatformBroadcast{}, err
	}
	defer tx.Rollback(ctx)

	// Ensure incident exists (and avoid broadcasting against deleted IDs).
	var exists bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM platform_incidents WHERE id = $1)`, iid).Scan(&exists); err != nil {
		return PlatformBroadcast{}, err
	}
	if !exists {
		return PlatformBroadcast{}, ErrPlatformIncidentNotFound
	}

	var bid pgtype.UUID
	var createdAt pgtype.Timestamptz
	var sentAt pgtype.Timestamptz
	err = tx.QueryRow(ctx, `
		INSERT INTO platform_broadcasts (
			incident_id,
			title,
			message,
			channels,
			tenant_ids,
			status,
			created_by,
			created_at,
			sent_at
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			(SELECT COALESCE(array_agg(x::uuid), '{}') FROM unnest($5::text[]) AS x),
			'queued',
			$6,
			NOW(),
			NOW()
		)
		RETURNING id, created_at, sent_at
	`, iid, title, message, channels, targetTenantIDs, createdBy).Scan(&bid, &createdAt, &sentAt)
	if err != nil {
		return PlatformBroadcast{}, err
	}

	qtx := s.q.WithTx(tx)
	queued := 0
	for _, rawTenantID := range targetTenantIDs {
		tid, err := parseTenantUUID(rawTenantID)
		if err != nil {
			return PlatformBroadcast{}, err
		}

		payload, _ := json.Marshal(map[string]interface{}{
			"broadcast_id": bid.String(),
			"incident_id":  iid.String(),
			"title":        title,
			"message":      message,
			"channels":     channels,
			"tenant_id":    tid.String(),
			"queued_at":    time.Now().UTC().Format(time.RFC3339),
		})

		ob, err := qtx.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
			TenantID:  tid,
			EventType: "platform.broadcast",
			Payload:   payload,
		})
		if err != nil {
			return PlatformBroadcast{}, err
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO platform_broadcast_deliveries (broadcast_id, tenant_id, outbox_id, status, created_at)
			VALUES ($1, $2, $3, 'queued', NOW())
		`, bid, tid, ob.ID)
		if err != nil {
			return PlatformBroadcast{}, err
		}
		queued++
	}

	if err := tx.Commit(ctx); err != nil {
		return PlatformBroadcast{}, err
	}

	out := PlatformBroadcast{
		ID:         bid.String(),
		IncidentID: iid.String(),
		Title:      title,
		Message:    message,
		Channels:   channels,
		TenantIDs:  targetTenantIDs,
		Status:     "queued",
		CreatedBy:  createdBy.String(),
		Queued:     queued,
	}
	if createdAt.Valid {
		out.CreatedAt = createdAt.Time
	}
	if sentAt.Valid {
		v := sentAt.Time
		out.SentAt = &v
	}
	return out, nil
}
