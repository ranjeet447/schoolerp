package sis

import (
	"github.com/jackc/pgx/v5/pgtype"
)

func toPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}

func nullUUID(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
