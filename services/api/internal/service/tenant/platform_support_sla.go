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
	ErrInvalidSupportSLAPolicy = errors.New("invalid support sla policy")
)

type PlatformSupportSLAEscalationPolicy struct {
	Enabled      bool   `json:"enabled"`
	Tag          string `json:"tag,omitempty"`
	BumpPriority string `json:"bump_priority,omitempty"` // optional: normal/high/critical
}

type PlatformSupportSLAPolicy struct {
	ResponseHours   map[string]int                 `json:"response_hours"`
	ResolutionHours map[string]int                 `json:"resolution_hours"`
	Escalation      PlatformSupportSLAEscalationPolicy `json:"escalation"`
	UpdatedAt       *time.Time                     `json:"updated_at,omitempty"`
}

type UpdatePlatformSupportSLAPolicyParams struct {
	ResponseHours   map[string]int `json:"response_hours"`
	ResolutionHours map[string]int `json:"resolution_hours"`
	Escalation      PlatformSupportSLAEscalationPolicy `json:"escalation"`
	UpdatedBy       string         `json:"-"`
}

type PlatformSupportSLAOverview struct {
	Open             int64     `json:"open"`
	InProgress       int64     `json:"in_progress"`
	Resolved         int64     `json:"resolved"`
	Closed           int64     `json:"closed"`
	ResponseOverdue  int64     `json:"response_overdue"`
	ResolutionOverdue int64    `json:"resolution_overdue"`
	GeneratedAt      time.Time `json:"generated_at"`
}

type PlatformSupportSLAEscalationRunResult struct {
	ResponseEscalated   int64     `json:"response_escalated"`
	ResolutionEscalated int64     `json:"resolution_escalated"`
	Tag                 string    `json:"tag"`
	GeneratedAt         time.Time `json:"generated_at"`
}

func defaultPlatformSupportSLAPolicy() PlatformSupportSLAPolicy {
	return PlatformSupportSLAPolicy{
		ResponseHours: map[string]int{
			"low":      24,
			"normal":   12,
			"high":     6,
			"critical": 1,
		},
		ResolutionHours: map[string]int{
			"low":      168, // 7 days
			"normal":   72,  // 3 days
			"high":     24,
			"critical": 8,
		},
		Escalation: PlatformSupportSLAEscalationPolicy{
			Enabled: true,
			Tag:     "sla_breached",
		},
	}
}

func normalizeSupportSLAMap(in map[string]int, defaults map[string]int) map[string]int {
	out := make(map[string]int, len(defaults))
	for k, v := range defaults {
		out[k] = v
	}
	for k, v := range in {
		key := strings.ToLower(strings.TrimSpace(k))
		if key == "" {
			continue
		}
		out[key] = v
	}
	return out
}

func validateSupportSLAHours(hours map[string]int) bool {
	required := []string{"low", "normal", "high", "critical"}
	for _, k := range required {
		v, ok := hours[k]
		if !ok {
			return false
		}
		if v <= 0 || v > 24*365 {
			return false
		}
	}
	return true
}

func (s *Service) GetPlatformSupportSLAPolicy(ctx context.Context) (PlatformSupportSLAPolicy, error) {
	const query = `
		SELECT value, updated_at
		FROM platform_settings
		WHERE key = 'support.sla_policy'
		LIMIT 1
	`

	out := defaultPlatformSupportSLAPolicy()

	var raw []byte
	var updatedAt pgtype.Timestamptz
	err := s.db.QueryRow(ctx, query).Scan(&raw, &updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return out, nil
		}
		return PlatformSupportSLAPolicy{}, err
	}

	if len(raw) > 0 {
		var payload map[string]any
		if err := json.Unmarshal(raw, &payload); err == nil {
			if v, ok := payload["response_hours"].(map[string]any); ok {
				m := map[string]int{}
				for k, rawV := range v {
					if f, ok := rawV.(float64); ok {
						m[strings.ToLower(strings.TrimSpace(k))] = int(f)
					}
				}
				out.ResponseHours = normalizeSupportSLAMap(m, out.ResponseHours)
			}
			if v, ok := payload["resolution_hours"].(map[string]any); ok {
				m := map[string]int{}
				for k, rawV := range v {
					if f, ok := rawV.(float64); ok {
						m[strings.ToLower(strings.TrimSpace(k))] = int(f)
					}
				}
				out.ResolutionHours = normalizeSupportSLAMap(m, out.ResolutionHours)
			}

			if esc, ok := payload["escalation"].(map[string]any); ok {
				if b, ok := esc["enabled"].(bool); ok {
					out.Escalation.Enabled = b
				}
				if s, ok := esc["tag"].(string); ok {
					out.Escalation.Tag = strings.TrimSpace(s)
				}
				if s, ok := esc["bump_priority"].(string); ok {
					out.Escalation.BumpPriority = strings.ToLower(strings.TrimSpace(s))
				}
			}
		}
	}

	if strings.TrimSpace(out.Escalation.Tag) == "" {
		out.Escalation.Tag = "sla_breached"
	}

	if !validateSupportSLAHours(out.ResponseHours) || !validateSupportSLAHours(out.ResolutionHours) {
		// If stored policy is malformed, fall back to defaults.
		out = defaultPlatformSupportSLAPolicy()
	}

	if updatedAt.Valid {
		v := updatedAt.Time
		out.UpdatedAt = &v
	}
	return out, nil
}

func (s *Service) UpdatePlatformSupportSLAPolicy(ctx context.Context, params UpdatePlatformSupportSLAPolicyParams) (PlatformSupportSLAPolicy, error) {
	defaults := defaultPlatformSupportSLAPolicy()

	responseHours := normalizeSupportSLAMap(params.ResponseHours, defaults.ResponseHours)
	resolutionHours := normalizeSupportSLAMap(params.ResolutionHours, defaults.ResolutionHours)
	if !validateSupportSLAHours(responseHours) || !validateSupportSLAHours(resolutionHours) {
		return PlatformSupportSLAPolicy{}, ErrInvalidSupportSLAPolicy
	}

	esc := params.Escalation
	esc.Tag = strings.TrimSpace(esc.Tag)
	esc.BumpPriority = strings.ToLower(strings.TrimSpace(esc.BumpPriority))
	if esc.Tag == "" {
		esc.Tag = "sla_breached"
	}
	if esc.BumpPriority != "" {
		switch esc.BumpPriority {
		case "normal", "high", "critical":
		default:
			return PlatformSupportSLAPolicy{}, ErrInvalidSupportSLAPolicy
		}
	}

	payload := map[string]any{
		"response_hours":   responseHours,
		"resolution_hours": resolutionHours,
		"escalation": map[string]any{
			"enabled":       esc.Enabled,
			"tag":           esc.Tag,
			"bump_priority": esc.BumpPriority,
		},
		"updated_at": time.Now().UTC().Format(time.RFC3339),
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return PlatformSupportSLAPolicy{}, err
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO platform_settings (key, value, updated_by, updated_at)
		VALUES ('support.sla_policy', $1, $2, NOW())
		ON CONFLICT (key)
		DO UPDATE SET
			value = EXCLUDED.value,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	if _, err := s.db.Exec(ctx, upsert, raw, updatedBy); err != nil {
		return PlatformSupportSLAPolicy{}, err
	}
	return s.GetPlatformSupportSLAPolicy(ctx)
}

func (s *Service) GetPlatformSupportSLAOverview(ctx context.Context) (PlatformSupportSLAOverview, error) {
	policy, err := s.GetPlatformSupportSLAPolicy(ctx)
	if err != nil {
		return PlatformSupportSLAOverview{}, err
	}

	const query = `
		WITH first_notes AS (
			SELECT ticket_id, MIN(created_at) AS first_note_at
			FROM support_ticket_notes
			GROUP BY ticket_id
		)
		SELECT
			COUNT(*) FILTER (WHERE t.status = 'open') AS open,
			COUNT(*) FILTER (WHERE t.status = 'in_progress') AS in_progress,
			COUNT(*) FILTER (WHERE t.status = 'resolved') AS resolved,
			COUNT(*) FILTER (WHERE t.status = 'closed') AS closed,
			COUNT(*) FILTER (
				WHERE t.status IN ('open','in_progress')
				  AND fn.first_note_at IS NULL
				  AND NOW() > t.created_at + make_interval(hours => (
						CASE t.priority
							WHEN 'low' THEN $1
							WHEN 'normal' THEN $2
							WHEN 'high' THEN $3
							WHEN 'critical' THEN $4
							ELSE $2
						END
				  ))
			) AS response_overdue,
			COUNT(*) FILTER (
				WHERE t.status IN ('open','in_progress')
				  AND NOW() > t.created_at + make_interval(hours => (
						CASE t.priority
							WHEN 'low' THEN $5
							WHEN 'normal' THEN $6
							WHEN 'high' THEN $7
							WHEN 'critical' THEN $8
							ELSE $6
						END
				  ))
			) AS resolution_overdue
		FROM support_tickets t
		LEFT JOIN first_notes fn ON fn.ticket_id = t.id
	`

	var out PlatformSupportSLAOverview
	if err := s.db.QueryRow(ctx, query,
		int32(policy.ResponseHours["low"]),
		int32(policy.ResponseHours["normal"]),
		int32(policy.ResponseHours["high"]),
		int32(policy.ResponseHours["critical"]),
		int32(policy.ResolutionHours["low"]),
		int32(policy.ResolutionHours["normal"]),
		int32(policy.ResolutionHours["high"]),
		int32(policy.ResolutionHours["critical"]),
	).Scan(
		&out.Open,
		&out.InProgress,
		&out.Resolved,
		&out.Closed,
		&out.ResponseOverdue,
		&out.ResolutionOverdue,
	); err != nil {
		return PlatformSupportSLAOverview{}, err
	}

	out.GeneratedAt = time.Now().UTC()
	return out, nil
}

func (s *Service) RunPlatformSupportSLAEscalations(ctx context.Context) (PlatformSupportSLAEscalationRunResult, error) {
	policy, err := s.GetPlatformSupportSLAPolicy(ctx)
	if err != nil {
		return PlatformSupportSLAEscalationRunResult{}, err
	}

	tag := strings.TrimSpace(policy.Escalation.Tag)
	if !policy.Escalation.Enabled || tag == "" {
		return PlatformSupportSLAEscalationRunResult{
			Tag:         tag,
			GeneratedAt: time.Now().UTC(),
		}, nil
	}

	bump := strings.ToLower(strings.TrimSpace(policy.Escalation.BumpPriority))
	if bump != "" {
		switch bump {
		case "normal", "high", "critical":
		default:
			bump = ""
		}
	}

	// Escalate "response overdue" tickets (no notes yet).
	const responseUpdate = `
		WITH first_notes AS (
			SELECT ticket_id, MIN(created_at) AS first_note_at
			FROM support_ticket_notes
			GROUP BY ticket_id
		),
		breached AS (
			SELECT t.id
			FROM support_tickets t
			LEFT JOIN first_notes fn ON fn.ticket_id = t.id
			WHERE t.status IN ('open','in_progress')
			  AND fn.first_note_at IS NULL
			  AND NOW() > t.created_at + make_interval(hours => (
					CASE t.priority
						WHEN 'low' THEN $1
						WHEN 'normal' THEN $2
						WHEN 'high' THEN $3
						WHEN 'critical' THEN $4
						ELSE $2
					END
			  ))
			  AND NOT ($5 = ANY(t.tags))
		)
		UPDATE support_tickets t
		SET
			tags = array_append(t.tags, $5),
			updated_at = NOW()
		WHERE t.id IN (SELECT id FROM breached)
	`

	tagRes, err := s.db.Exec(ctx, responseUpdate,
		int32(policy.ResponseHours["low"]),
		int32(policy.ResponseHours["normal"]),
		int32(policy.ResponseHours["high"]),
		int32(policy.ResponseHours["critical"]),
		tag,
	)
	if err != nil {
		return PlatformSupportSLAEscalationRunResult{}, err
	}
	responseEscalated := tagRes.RowsAffected()

	// Escalate "resolution overdue" tickets (not resolved/closed).
	query := `
		WITH breached AS (
			SELECT t.id
			FROM support_tickets t
			WHERE t.status IN ('open','in_progress')
			  AND NOW() > t.created_at + make_interval(hours => (
					CASE t.priority
						WHEN 'low' THEN $1
						WHEN 'normal' THEN $2
						WHEN 'high' THEN $3
						WHEN 'critical' THEN $4
						ELSE $2
					END
			  ))
			  AND NOT ($5 = ANY(t.tags))
		)
		UPDATE support_tickets t
		SET
			tags = array_append(t.tags, $5),
			updated_at = NOW()
		WHERE t.id IN (SELECT id FROM breached)
	`

	args := []any{
		int32(policy.ResolutionHours["low"]),
		int32(policy.ResolutionHours["normal"]),
		int32(policy.ResolutionHours["high"]),
		int32(policy.ResolutionHours["critical"]),
		tag,
	}

	if bump != "" {
		query = `
			WITH breached AS (
				SELECT t.id
				FROM support_tickets t
				WHERE t.status IN ('open','in_progress')
				  AND NOW() > t.created_at + make_interval(hours => (
						CASE t.priority
							WHEN 'low' THEN $1
							WHEN 'normal' THEN $2
							WHEN 'high' THEN $3
							WHEN 'critical' THEN $4
							ELSE $2
						END
				  ))
				  AND NOT ($5 = ANY(t.tags))
			)
			UPDATE support_tickets t
			SET
				tags = array_append(t.tags, $5),
				priority = $6,
				updated_at = NOW()
			WHERE t.id IN (SELECT id FROM breached)
		`
		args = append(args, bump)
	}

	resRes, err := s.db.Exec(ctx, query, args...)
	if err != nil {
		return PlatformSupportSLAEscalationRunResult{}, err
	}

	return PlatformSupportSLAEscalationRunResult{
		ResponseEscalated:   responseEscalated,
		ResolutionEscalated: resRes.RowsAffected(),
		Tag:                 tag,
		GeneratedAt:         time.Now().UTC(),
	}, nil
}

