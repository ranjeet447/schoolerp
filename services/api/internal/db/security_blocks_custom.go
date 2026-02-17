package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

// IsPlatformSecurityBlocked checks if a user or tenant is blocked by an active platform security block.
// Callers should handle undefined_table errors in environments where the migration hasn't been applied yet.
func (q *Queries) IsPlatformSecurityBlocked(ctx context.Context, userID pgtype.UUID, tenantID pgtype.UUID) (bool, error) {
	const query = `
		SELECT EXISTS(
			SELECT 1
			FROM platform_security_blocks b
			WHERE b.status = 'active'
			  AND (b.expires_at IS NULL OR b.expires_at > NOW())
			  AND (
				b.target_user_id = $1
				OR ($2::uuid IS NOT NULL AND b.target_tenant_id = $2)
			  )
		)
	`

	var blocked bool
	err := q.db.QueryRow(ctx, query, userID, tenantID).Scan(&blocked)
	return blocked, err
}
