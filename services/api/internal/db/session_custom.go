package db

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func (q *Queries) CreateSessionRecord(ctx context.Context, userID pgtype.UUID, tokenHash string, expiresAt time.Time) error {
	const query = `
		INSERT INTO sessions (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`
	_, err := q.db.Exec(ctx, query, userID, tokenHash, pgtype.Timestamptz{Time: expiresAt, Valid: true})
	return err
}
