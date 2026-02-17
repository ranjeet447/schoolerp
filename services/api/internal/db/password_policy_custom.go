package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

// GetIdentityCredentialUpdatedAt returns the credential_updated_at timestamp for an identity.
// This column may not exist in older environments; callers should handle undefined_column errors.
func (q *Queries) GetIdentityCredentialUpdatedAt(ctx context.Context, identityID pgtype.UUID) (pgtype.Timestamptz, error) {
	const query = `
		SELECT COALESCE(credential_updated_at, created_at)
		FROM user_identities
		WHERE id = $1
		LIMIT 1
	`

	var ts pgtype.Timestamptz
	err := q.db.QueryRow(ctx, query, identityID).Scan(&ts)
	return ts, err
}
