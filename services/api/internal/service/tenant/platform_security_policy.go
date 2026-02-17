package tenant

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type PlatformSecurityPolicy struct {
	EnforceInternalMFA bool       `json:"enforce_internal_mfa"`
	UpdatedAt          *time.Time `json:"updated_at,omitempty"`
}

type UpdatePlatformMFAPolicyParams struct {
	EnforceInternalMFA bool   `json:"enforce_internal_mfa"`
	UpdatedBy          string `json:"-"`
}

func (s *Service) GetPlatformSecurityPolicy(ctx context.Context) (PlatformSecurityPolicy, error) {
	const query = `
		SELECT value, updated_at
		FROM platform_settings
		WHERE key = 'security.internal_mfa_policy'
		LIMIT 1
	`

	var raw []byte
	var updatedAt pgtype.Timestamptz
	err := s.db.QueryRow(ctx, query).Scan(&raw, &updatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return PlatformSecurityPolicy{}, nil
		}
		return PlatformSecurityPolicy{}, err
	}

	out := PlatformSecurityPolicy{}
	if len(raw) > 0 {
		var payload map[string]interface{}
		if err := json.Unmarshal(raw, &payload); err == nil {
			if v, ok := payload["enforce_for_internal_users"].(bool); ok {
				out.EnforceInternalMFA = v
			}
		}
	}
	if updatedAt.Valid {
		v := updatedAt.Time
		out.UpdatedAt = &v
	}
	return out, nil
}

func (s *Service) UpdatePlatformMFAPolicy(ctx context.Context, params UpdatePlatformMFAPolicyParams) (PlatformSecurityPolicy, error) {
	payload := map[string]interface{}{
		"enforce_for_internal_users": params.EnforceInternalMFA,
		"updated_at":                 time.Now().UTC().Format(time.RFC3339),
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return PlatformSecurityPolicy{}, err
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO platform_settings (key, value, updated_by, updated_at)
		VALUES ('security.internal_mfa_policy', $1, $2, NOW())
		ON CONFLICT (key)
		DO UPDATE SET
			value = EXCLUDED.value,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	if _, err := s.db.Exec(ctx, upsert, raw, updatedBy); err != nil {
		return PlatformSecurityPolicy{}, err
	}

	return s.GetPlatformSecurityPolicy(ctx)
}
