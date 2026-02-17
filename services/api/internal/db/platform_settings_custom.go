package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

func (q *Queries) GetPlatformSettingValue(ctx context.Context, key string) ([]byte, error) {
	const query = `SELECT value FROM platform_settings WHERE key = $1`
	var raw []byte
	err := q.db.QueryRow(ctx, query, key).Scan(&raw)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return raw, nil
}
