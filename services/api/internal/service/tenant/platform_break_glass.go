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
	ErrBreakGlassDisabled        = errors.New("break-glass policy is disabled")
	ErrBreakGlassTicketRequired  = errors.New("break-glass ticket reference is required")
	ErrBreakGlassCooldown        = errors.New("break-glass activation is in cooldown")
	ErrInvalidBreakGlassDuration = errors.New("invalid break-glass duration")
	ErrInvalidBreakGlassReason   = errors.New("invalid break-glass reason")
)

type PlatformBreakGlassPolicy struct {
	Enabled            bool       `json:"enabled"`
	MaxDurationMinutes int        `json:"max_duration_minutes"`
	RequireTicket      bool       `json:"require_ticket"`
	CooldownMinutes    int        `json:"cooldown_minutes"`
	UpdatedAt          *time.Time `json:"updated_at,omitempty"`
}

type UpdatePlatformBreakGlassPolicyParams struct {
	Enabled            bool   `json:"enabled"`
	MaxDurationMinutes int    `json:"max_duration_minutes"`
	RequireTicket      bool   `json:"require_ticket"`
	CooldownMinutes    int    `json:"cooldown_minutes"`
	UpdatedBy          string `json:"-"`
}

type BreakGlassActivationParams struct {
	Reason          string `json:"reason"`
	DurationMinutes int    `json:"duration_minutes"`
	TicketRef       string `json:"ticket_ref"`
	ActorUserID     string `json:"-"`
}

type BreakGlassActivationResult struct {
	ApprovalID      string    `json:"approval_id"`
	RequestedBy     string    `json:"requested_by"`
	Reason          string    `json:"reason"`
	TicketRef       string    `json:"ticket_ref,omitempty"`
	DurationMinutes int       `json:"duration_minutes"`
	ExpiresAt       time.Time `json:"expires_at"`
	ActivatedAt     time.Time `json:"activated_at"`
}

type BreakGlassEvent struct {
	ID               string     `json:"id"`
	RequestedBy      string     `json:"requested_by"`
	RequestedByName  string     `json:"requested_by_name,omitempty"`
	RequestedByEmail string     `json:"requested_by_email,omitempty"`
	Status           string     `json:"status"`
	Reason           string     `json:"reason"`
	TicketRef        string     `json:"ticket_ref,omitempty"`
	DurationMinutes  int        `json:"duration_minutes,omitempty"`
	ExpiresAt        *time.Time `json:"expires_at,omitempty"`
	ApprovedAt       *time.Time `json:"approved_at,omitempty"`
	CreatedAt        *time.Time `json:"created_at,omitempty"`
}

func (s *Service) GetPlatformBreakGlassPolicy(ctx context.Context) (PlatformBreakGlassPolicy, error) {
	const query = `
		SELECT value, updated_at
		FROM platform_settings
		WHERE key = 'security.break_glass_policy'
		LIMIT 1
	`

	defaults := PlatformBreakGlassPolicy{
		Enabled:            false,
		MaxDurationMinutes: 30,
		RequireTicket:      true,
		CooldownMinutes:    60,
	}

	var raw []byte
	var updatedAt pgtype.Timestamptz
	err := s.db.QueryRow(ctx, query).Scan(&raw, &updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return defaults, nil
		}
		return PlatformBreakGlassPolicy{}, err
	}

	out := defaults
	if len(raw) > 0 {
		var payload map[string]interface{}
		if err := json.Unmarshal(raw, &payload); err == nil {
			if v, ok := payload["enabled"].(bool); ok {
				out.Enabled = v
			}
			if v, ok := payload["max_duration_minutes"].(float64); ok {
				out.MaxDurationMinutes = int(v)
			}
			if v, ok := payload["require_ticket"].(bool); ok {
				out.RequireTicket = v
			}
			if v, ok := payload["cooldown_minutes"].(float64); ok {
				out.CooldownMinutes = int(v)
			}
		}
	}

	if out.MaxDurationMinutes <= 0 {
		out.MaxDurationMinutes = defaults.MaxDurationMinutes
	}
	if out.CooldownMinutes < 0 {
		out.CooldownMinutes = defaults.CooldownMinutes
	}
	if updatedAt.Valid {
		v := updatedAt.Time
		out.UpdatedAt = &v
	}
	return out, nil
}

func (s *Service) UpdatePlatformBreakGlassPolicy(ctx context.Context, params UpdatePlatformBreakGlassPolicyParams) (PlatformBreakGlassPolicy, error) {
	maxDuration := params.MaxDurationMinutes
	if maxDuration <= 0 {
		maxDuration = 30
	}
	if maxDuration > 180 {
		return PlatformBreakGlassPolicy{}, ErrInvalidBreakGlassDuration
	}

	cooldown := params.CooldownMinutes
	if cooldown < 0 {
		return PlatformBreakGlassPolicy{}, ErrInvalidBreakGlassDuration
	}
	if cooldown > 1440 {
		return PlatformBreakGlassPolicy{}, ErrInvalidBreakGlassDuration
	}

	payload := map[string]interface{}{
		"enabled":              params.Enabled,
		"max_duration_minutes": maxDuration,
		"require_ticket":       params.RequireTicket,
		"cooldown_minutes":     cooldown,
		"updated_at":           time.Now().UTC().Format(time.RFC3339),
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return PlatformBreakGlassPolicy{}, err
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO platform_settings (key, value, updated_by, updated_at)
		VALUES ('security.break_glass_policy', $1, $2, NOW())
		ON CONFLICT (key)
		DO UPDATE SET
			value = EXCLUDED.value,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	if _, err := s.db.Exec(ctx, upsert, raw, updatedBy); err != nil {
		return PlatformBreakGlassPolicy{}, err
	}

	return s.GetPlatformBreakGlassPolicy(ctx)
}

func (s *Service) ActivateBreakGlass(ctx context.Context, params BreakGlassActivationParams) (BreakGlassActivationResult, error) {
	actorID := strings.TrimSpace(params.ActorUserID)
	reason := strings.TrimSpace(params.Reason)
	ticket := strings.TrimSpace(params.TicketRef)

	if reason == "" {
		return BreakGlassActivationResult{}, ErrInvalidBreakGlassReason
	}

	policy, err := s.GetPlatformBreakGlassPolicy(ctx)
	if err != nil {
		return BreakGlassActivationResult{}, err
	}
	if !policy.Enabled {
		return BreakGlassActivationResult{}, ErrBreakGlassDisabled
	}
	if policy.RequireTicket && ticket == "" {
		return BreakGlassActivationResult{}, ErrBreakGlassTicketRequired
	}

	duration := params.DurationMinutes
	if duration <= 0 {
		duration = 15
	}
	if duration > policy.MaxDurationMinutes {
		return BreakGlassActivationResult{}, ErrInvalidBreakGlassDuration
	}

	var actorUUID pgtype.UUID
	if err := actorUUID.Scan(actorID); err != nil || !actorUUID.Valid {
		return BreakGlassActivationResult{}, ErrInvalidPlatformUserID
	}

	if policy.CooldownMinutes > 0 {
		const cooldownQuery = `
			SELECT COUNT(*)::INT
			FROM platform_action_approvals
			WHERE action_type = 'break_glass_access'
			  AND requested_by = $1
			  AND status IN ('approved', 'pending')
			  AND created_at >= NOW() - ($2::int * INTERVAL '1 minute')
		`
		var count int
		if err := s.db.QueryRow(ctx, cooldownQuery, actorUUID, policy.CooldownMinutes).Scan(&count); err != nil {
			return BreakGlassActivationResult{}, err
		}
		if count > 0 {
			return BreakGlassActivationResult{}, ErrBreakGlassCooldown
		}
	}

	now := time.Now().UTC()
	expiresAt := now.Add(time.Duration(duration) * time.Minute)
	payload := map[string]interface{}{
		"reason":           reason,
		"ticket_ref":       ticket,
		"duration_minutes": duration,
		"activated_at":     now.Format(time.RFC3339),
		"expires_at":       expiresAt.Format(time.RFC3339),
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return BreakGlassActivationResult{}, err
	}

	const insert = `
		INSERT INTO platform_action_approvals (
			action_type,
			payload,
			requested_by,
			approved_by,
			status,
			reason,
			expires_at,
			approved_at,
			created_at
		)
		VALUES (
			'break_glass_access',
			$1,
			$2,
			$2,
			'approved',
			$3,
			$4,
			NOW(),
			NOW()
		)
		RETURNING id::text
	`
	var approvalID string
	if err := s.db.QueryRow(ctx, insert, payloadJSON, actorUUID, reason, expiresAt).Scan(&approvalID); err != nil {
		return BreakGlassActivationResult{}, err
	}

	return BreakGlassActivationResult{
		ApprovalID:      approvalID,
		RequestedBy:     actorID,
		Reason:          reason,
		TicketRef:       ticket,
		DurationMinutes: duration,
		ExpiresAt:       expiresAt,
		ActivatedAt:     now,
	}, nil
}

func (s *Service) ListBreakGlassEvents(ctx context.Context, limit, offset int32) ([]BreakGlassEvent, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	const query = `
		SELECT
			pa.id::text,
			COALESCE(pa.requested_by::text, '') AS requested_by,
			COALESCE(u.full_name, '') AS requested_by_name,
			COALESCE(u.email, '') AS requested_by_email,
			pa.status,
			COALESCE(pa.reason, '') AS reason,
			pa.payload,
			pa.expires_at,
			pa.approved_at,
			pa.created_at
		FROM platform_action_approvals pa
		LEFT JOIN users u ON u.id = pa.requested_by
		WHERE pa.action_type = 'break_glass_access'
		ORDER BY pa.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := s.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]BreakGlassEvent, 0)
	for rows.Next() {
		var row BreakGlassEvent
		var payloadJSON []byte
		var expiresAt pgtype.Timestamptz
		var approvedAt pgtype.Timestamptz
		var createdAt pgtype.Timestamptz
		if err := rows.Scan(
			&row.ID,
			&row.RequestedBy,
			&row.RequestedByName,
			&row.RequestedByEmail,
			&row.Status,
			&row.Reason,
			&payloadJSON,
			&expiresAt,
			&approvedAt,
			&createdAt,
		); err != nil {
			return nil, err
		}

		if len(payloadJSON) > 0 {
			var payload map[string]interface{}
			if err := json.Unmarshal(payloadJSON, &payload); err == nil {
				if ticket, ok := payload["ticket_ref"].(string); ok {
					row.TicketRef = strings.TrimSpace(ticket)
				}
				if duration, ok := payload["duration_minutes"].(float64); ok {
					row.DurationMinutes = int(duration)
				}
			}
		}
		if expiresAt.Valid {
			v := expiresAt.Time
			row.ExpiresAt = &v
		}
		if approvedAt.Valid {
			v := approvedAt.Time
			row.ApprovedAt = &v
		}
		if createdAt.Valid {
			v := createdAt.Time
			row.CreatedAt = &v
		}

		out = append(out, row)
	}

	return out, rows.Err()
}
