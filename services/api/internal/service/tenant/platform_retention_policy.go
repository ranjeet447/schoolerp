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

var ErrInvalidRetentionPolicy = errors.New("invalid retention policy")

type PlatformDataRetentionPolicy struct {
	AuditLogsDays       int        `json:"audit_logs_days"`
	SecurityEventsDays  int        `json:"security_events_days"`
	SessionsDays        int        `json:"sessions_days"`
	IntegrationLogsDays int        `json:"integration_logs_days"`
	OutboxEventsDays    int        `json:"outbox_events_days"`
	UpdatedAt           *time.Time `json:"updated_at,omitempty"`
}

type UpdatePlatformDataRetentionPolicyParams struct {
	AuditLogsDays       int    `json:"audit_logs_days"`
	SecurityEventsDays  int    `json:"security_events_days"`
	SessionsDays        int    `json:"sessions_days"`
	IntegrationLogsDays int    `json:"integration_logs_days"`
	OutboxEventsDays    int    `json:"outbox_events_days"`
	UpdatedBy           string `json:"-"`
}

func (s *Service) GetPlatformDataRetentionPolicy(ctx context.Context) (PlatformDataRetentionPolicy, error) {
	const query = `
		SELECT value, updated_at
		FROM platform_settings
		WHERE key = 'security.data_retention_policy'
		LIMIT 1
	`

	defaults := PlatformDataRetentionPolicy{
		AuditLogsDays:       365,
		SecurityEventsDays:  90,
		SessionsDays:        30,
		IntegrationLogsDays: 30,
		OutboxEventsDays:    30,
	}

	var raw []byte
	var updatedAt pgtype.Timestamptz
	err := s.db.QueryRow(ctx, query).Scan(&raw, &updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return defaults, nil
		}
		return PlatformDataRetentionPolicy{}, err
	}

	out := defaults
	if len(raw) > 0 {
		var payload map[string]interface{}
		if err := json.Unmarshal(raw, &payload); err == nil {
			if v, ok := payload["audit_logs_days"].(float64); ok {
				out.AuditLogsDays = int(v)
			}
			if v, ok := payload["security_events_days"].(float64); ok {
				out.SecurityEventsDays = int(v)
			}
			if v, ok := payload["sessions_days"].(float64); ok {
				out.SessionsDays = int(v)
			}
			if v, ok := payload["integration_logs_days"].(float64); ok {
				out.IntegrationLogsDays = int(v)
			}
			if v, ok := payload["outbox_events_days"].(float64); ok {
				out.OutboxEventsDays = int(v)
			}
		}
	}

	if updatedAt.Valid {
		v := updatedAt.Time
		out.UpdatedAt = &v
	}

	return sanitizeRetentionPolicy(out, defaults)
}

func (s *Service) UpdatePlatformDataRetentionPolicy(ctx context.Context, params UpdatePlatformDataRetentionPolicyParams) (PlatformDataRetentionPolicy, error) {
	defaults := PlatformDataRetentionPolicy{
		AuditLogsDays:       365,
		SecurityEventsDays:  90,
		SessionsDays:        30,
		IntegrationLogsDays: 30,
		OutboxEventsDays:    30,
	}

	policy, err := sanitizeRetentionPolicy(PlatformDataRetentionPolicy{
		AuditLogsDays:       params.AuditLogsDays,
		SecurityEventsDays:  params.SecurityEventsDays,
		SessionsDays:        params.SessionsDays,
		IntegrationLogsDays: params.IntegrationLogsDays,
		OutboxEventsDays:    params.OutboxEventsDays,
	}, defaults)
	if err != nil {
		return PlatformDataRetentionPolicy{}, err
	}

	payload := map[string]interface{}{
		"audit_logs_days":       policy.AuditLogsDays,
		"security_events_days":  policy.SecurityEventsDays,
		"sessions_days":         policy.SessionsDays,
		"integration_logs_days": policy.IntegrationLogsDays,
		"outbox_events_days":    policy.OutboxEventsDays,
		"updated_at":            time.Now().UTC().Format(time.RFC3339),
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return PlatformDataRetentionPolicy{}, err
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO platform_settings (key, value, updated_by, updated_at)
		VALUES ('security.data_retention_policy', $1, $2, NOW())
		ON CONFLICT (key)
		DO UPDATE SET
			value = EXCLUDED.value,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	if _, err := s.db.Exec(ctx, upsert, raw, updatedBy); err != nil {
		return PlatformDataRetentionPolicy{}, err
	}

	return s.GetPlatformDataRetentionPolicy(ctx)
}

func sanitizeRetentionPolicy(policy PlatformDataRetentionPolicy, defaults PlatformDataRetentionPolicy) (PlatformDataRetentionPolicy, error) {
	// Accept non-negative days; 0 means "retain indefinitely" (enforcement is a separate workflow).
	maxDays := 3650
	fields := []*int{
		&policy.AuditLogsDays,
		&policy.SecurityEventsDays,
		&policy.SessionsDays,
		&policy.IntegrationLogsDays,
		&policy.OutboxEventsDays,
	}
	for _, f := range fields {
		if *f < 0 || *f > maxDays {
			return PlatformDataRetentionPolicy{}, ErrInvalidRetentionPolicy
		}
	}

	if policy.AuditLogsDays == 0 {
		policy.AuditLogsDays = defaults.AuditLogsDays
	}
	if policy.SecurityEventsDays == 0 {
		policy.SecurityEventsDays = defaults.SecurityEventsDays
	}
	if policy.SessionsDays == 0 {
		policy.SessionsDays = defaults.SessionsDays
	}
	if policy.IntegrationLogsDays == 0 {
		policy.IntegrationLogsDays = defaults.IntegrationLogsDays
	}
	if policy.OutboxEventsDays == 0 {
		policy.OutboxEventsDays = defaults.OutboxEventsDays
	}

	return policy, nil
}
