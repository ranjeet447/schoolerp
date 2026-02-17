package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

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
		return defaults, nil
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
