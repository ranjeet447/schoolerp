package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/service/auth"
)

var (
	ErrInvalidPasswordPolicy     = errors.New("invalid password policy")
	ErrPasswordPolicyViolation   = errors.New("password does not meet policy")
	ErrPasswordReuseNotAllowed   = errors.New("password reuse is not allowed")
	ErrInvalidPasswordPolicyUser = errors.New("invalid password policy user id")
)

type PlatformPasswordPolicy struct {
	MinLength    int        `json:"min_length"`
	HistoryCount int        `json:"history_count"`
	MaxAgeDays   int        `json:"max_age_days"`
	UpdatedAt    *time.Time `json:"updated_at,omitempty"`
}

type UpdatePlatformPasswordPolicyParams struct {
	MinLength    int    `json:"min_length"`
	HistoryCount int    `json:"history_count"`
	MaxAgeDays   int    `json:"max_age_days"`
	UpdatedBy    string `json:"-"`
}

func defaultPlatformPasswordPolicy() PlatformPasswordPolicy {
	return PlatformPasswordPolicy{
		MinLength:    8,
		HistoryCount: 0,
		MaxAgeDays:   0,
	}
}

func (s *Service) GetPlatformPasswordPolicy(ctx context.Context) (PlatformPasswordPolicy, error) {
	const query = `
		SELECT value, updated_at
		FROM platform_settings
		WHERE key = 'security.password_policy'
		LIMIT 1
	`

	out := defaultPlatformPasswordPolicy()

	var raw []byte
	var updatedAt pgtype.Timestamptz
	err := s.db.QueryRow(ctx, query).Scan(&raw, &updatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return out, nil
		}
		return PlatformPasswordPolicy{}, err
	}

	if len(raw) > 0 {
		var payload map[string]interface{}
		if err := json.Unmarshal(raw, &payload); err == nil {
			if v, ok := payload["min_length"].(float64); ok {
				out.MinLength = int(v)
			}
			if v, ok := payload["history_count"].(float64); ok {
				out.HistoryCount = int(v)
			}
			if v, ok := payload["max_age_days"].(float64); ok {
				out.MaxAgeDays = int(v)
			}
		}
	}

	if out.MinLength <= 0 {
		out.MinLength = 8
	}
	if out.HistoryCount < 0 {
		out.HistoryCount = 0
	}
	if out.MaxAgeDays < 0 {
		out.MaxAgeDays = 0
	}

	if updatedAt.Valid {
		v := updatedAt.Time
		out.UpdatedAt = &v
	}
	return out, nil
}

func (s *Service) UpdatePlatformPasswordPolicy(ctx context.Context, params UpdatePlatformPasswordPolicyParams) (PlatformPasswordPolicy, error) {
	minLen := params.MinLength
	if minLen <= 0 {
		minLen = 8
	}
	if minLen < 8 || minLen > 128 {
		return PlatformPasswordPolicy{}, ErrInvalidPasswordPolicy
	}

	history := params.HistoryCount
	if history < 0 || history > 20 {
		return PlatformPasswordPolicy{}, ErrInvalidPasswordPolicy
	}

	maxAgeDays := params.MaxAgeDays
	if maxAgeDays < 0 || maxAgeDays > 3650 {
		return PlatformPasswordPolicy{}, ErrInvalidPasswordPolicy
	}

	payload := map[string]interface{}{
		"min_length":    minLen,
		"history_count": history,
		"max_age_days":  maxAgeDays,
		"updated_at":    time.Now().UTC().Format(time.RFC3339),
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return PlatformPasswordPolicy{}, err
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO platform_settings (key, value, updated_by, updated_at)
		VALUES ('security.password_policy', $1, $2, NOW())
		ON CONFLICT (key)
		DO UPDATE SET
			value = EXCLUDED.value,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	if _, err := s.db.Exec(ctx, upsert, raw, updatedBy); err != nil {
		return PlatformPasswordPolicy{}, err
	}

	return s.GetPlatformPasswordPolicy(ctx)
}

func (s *Service) validatePasswordAgainstPolicy(ctx context.Context, userID string, password string) (PlatformPasswordPolicy, string, error) {
	policy, err := s.GetPlatformPasswordPolicy(ctx)
	if err != nil {
		return PlatformPasswordPolicy{}, "", err
	}

	trimmed := strings.TrimSpace(password)
	if len(trimmed) < policy.MinLength {
		return policy, "", ErrPasswordPolicyViolation
	}

	hash := auth.HashPasswordForSeed(trimmed)
	if policy.HistoryCount > 0 && strings.TrimSpace(userID) != "" {
		var uid pgtype.UUID
		if err := uid.Scan(strings.TrimSpace(userID)); err != nil || !uid.Valid {
			return policy, "", ErrInvalidPasswordPolicyUser
		}

		const query = `
			SELECT credential_hash
			FROM user_credential_history
			WHERE user_id = $1
			  AND provider = 'password'
			ORDER BY created_at DESC
			LIMIT $2
		`
		rows, err := s.db.Query(ctx, query, uid, int32(policy.HistoryCount))
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "42P01" {
				// Missing migration/table. Fail open for reuse checks but still enforce length.
				return policy, hash, nil
			}
			return policy, "", err
		}
		defer rows.Close()

		for rows.Next() {
			var h string
			if err := rows.Scan(&h); err != nil {
				return policy, "", err
			}
			if strings.TrimSpace(h) == hash {
				return policy, "", ErrPasswordReuseNotAllowed
			}
		}
		if err := rows.Err(); err != nil {
			return policy, "", err
		}
	}

	return policy, hash, nil
}
