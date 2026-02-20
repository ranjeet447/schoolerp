package tenant

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/foundation/sessionstore"
)

type sessionExec interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	Query(context.Context, string, ...any) (pgx.Rows, error)
}

func (s *Service) cacheSessionInStore(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	if s.sessionStore == nil || !s.sessionStore.Enabled() {
		return nil
	}
	return s.sessionStore.SetSession(ctx, strings.TrimSpace(userID), strings.TrimSpace(tokenHash), expiresAt)
}

func (s *Service) revokeSessionRefsInStore(ctx context.Context, refs []sessionstore.SessionRef) error {
	if s.sessionStore == nil || !s.sessionStore.Enabled() || len(refs) == 0 {
		return nil
	}
	return s.sessionStore.DeleteSessionRefs(ctx, refs)
}

func listSessionRefsForUser(ctx context.Context, exec sessionExec, uid pgtype.UUID) ([]sessionstore.SessionRef, error) {
	rows, err := exec.Query(ctx, `SELECT user_id::text, token_hash FROM sessions WHERE user_id = $1`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	refs := make([]sessionstore.SessionRef, 0)
	for rows.Next() {
		var ref sessionstore.SessionRef
		if err := rows.Scan(&ref.UserID, &ref.TokenHash); err != nil {
			return nil, err
		}
		ref.UserID = strings.TrimSpace(ref.UserID)
		ref.TokenHash = strings.TrimSpace(ref.TokenHash)
		if ref.UserID == "" || ref.TokenHash == "" {
			continue
		}
		refs = append(refs, ref)
	}
	return refs, rows.Err()
}

func listSessionRefsForTenant(ctx context.Context, exec sessionExec, tid pgtype.UUID) ([]sessionstore.SessionRef, error) {
	rows, err := exec.Query(ctx, `
		SELECT s.user_id::text, s.token_hash
		FROM sessions s
		WHERE s.user_id IN (
			SELECT DISTINCT ra.user_id
			FROM role_assignments ra
			WHERE ra.tenant_id = $1
		)
	`, tid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	refs := make([]sessionstore.SessionRef, 0)
	for rows.Next() {
		var ref sessionstore.SessionRef
		if err := rows.Scan(&ref.UserID, &ref.TokenHash); err != nil {
			return nil, err
		}
		ref.UserID = strings.TrimSpace(ref.UserID)
		ref.TokenHash = strings.TrimSpace(ref.TokenHash)
		if ref.UserID == "" || ref.TokenHash == "" {
			continue
		}
		refs = append(refs, ref)
	}
	return refs, rows.Err()
}

func listSessionRefBySessionID(ctx context.Context, exec sessionExec, uid pgtype.UUID, sid pgtype.UUID) ([]sessionstore.SessionRef, error) {
	rows, err := exec.Query(ctx, `
		SELECT user_id::text, token_hash
		FROM sessions
		WHERE user_id = $1
		  AND id = $2
	`, uid, sid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	refs := make([]sessionstore.SessionRef, 0, 1)
	for rows.Next() {
		var ref sessionstore.SessionRef
		if err := rows.Scan(&ref.UserID, &ref.TokenHash); err != nil {
			return nil, err
		}
		ref.UserID = strings.TrimSpace(ref.UserID)
		ref.TokenHash = strings.TrimSpace(ref.TokenHash)
		if ref.UserID == "" || ref.TokenHash == "" {
			continue
		}
		refs = append(refs, ref)
	}
	return refs, rows.Err()
}
