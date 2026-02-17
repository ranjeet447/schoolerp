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
	ErrInvalidSessionID = errors.New("invalid session id")
)

type PlatformUserSession struct {
	ID         string                 `json:"id"`
	UserID     string                 `json:"user_id"`
	IPAddress  string                 `json:"ip_address,omitempty"`
	DeviceInfo map[string]interface{} `json:"device_info"`
	ExpiresAt  time.Time              `json:"expires_at"`
	CreatedAt  time.Time              `json:"created_at"`
}

func (s *Service) ListPlatformInternalUserSessions(ctx context.Context, userID string, limit int32) ([]PlatformUserSession, error) {
	uid, err := parsePlatformUserUUID(userID)
	if err != nil {
		return nil, err
	}
	if err := s.assertPlatformInternalUser(ctx, uid); err != nil {
		return nil, err
	}

	if limit <= 0 || limit > 500 {
		limit = 200
	}

	const query = `
		SELECT
			s.id::text,
			s.user_id::text,
			COALESCE(s.ip_address, '') AS ip_address,
			COALESCE(s.device_info, '{}'::jsonb) AS device_info,
			s.expires_at,
			s.created_at
		FROM sessions s
		WHERE s.user_id = $1
		ORDER BY s.created_at DESC
		LIMIT $2
	`
	rows, err := s.db.Query(ctx, query, uid, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformUserSession, 0)
	for rows.Next() {
		var row PlatformUserSession
		var deviceInfoJSON []byte
		var expiresAt pgtype.Timestamptz
		var createdAt pgtype.Timestamptz
		if err := rows.Scan(
			&row.ID,
			&row.UserID,
			&row.IPAddress,
			&deviceInfoJSON,
			&expiresAt,
			&createdAt,
		); err != nil {
			return nil, err
		}

		row.DeviceInfo = map[string]interface{}{}
		if len(deviceInfoJSON) > 0 {
			_ = json.Unmarshal(deviceInfoJSON, &row.DeviceInfo)
		}
		if expiresAt.Valid {
			row.ExpiresAt = expiresAt.Time
		}
		if createdAt.Valid {
			row.CreatedAt = createdAt.Time
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) RevokePlatformInternalUserSessions(ctx context.Context, userID string, sessionID string) (int64, error) {
	uid, err := parsePlatformUserUUID(userID)
	if err != nil {
		return 0, err
	}
	if err := s.assertPlatformInternalUser(ctx, uid); err != nil {
		return 0, err
	}

	sessionID = strings.TrimSpace(sessionID)
	if sessionID == "" {
		tag, err := s.db.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, uid)
		if err != nil {
			return 0, err
		}
		return tag.RowsAffected(), nil
	}

	var sid pgtype.UUID
	if err := sid.Scan(sessionID); err != nil || !sid.Valid {
		return 0, ErrInvalidSessionID
	}

	tag, err := s.db.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1 AND id = $2`, uid, sid)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (s *Service) RotatePlatformInternalUserTokens(ctx context.Context, userID string) (int64, error) {
	return s.RevokePlatformInternalUserSessions(ctx, userID, "")
}

func (s *Service) assertPlatformInternalUser(ctx context.Context, userID pgtype.UUID) error {
	systemTenantID, err := ensureSystemTenantID(ctx, s.db)
	if err != nil {
		return err
	}

	const query = `
		SELECT EXISTS(
			SELECT 1
			FROM role_assignments ra
			WHERE ra.tenant_id = $1
			  AND ra.user_id = $2
			  AND ra.scope_type = 'platform'
		)
	`
	var exists bool
	if err := s.db.QueryRow(ctx, query, systemTenantID, userID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return ErrPlatformUserNotFound
	}
	return nil
}
