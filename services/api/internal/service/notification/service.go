package notification

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Service struct {
	q db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{q: q}
}

func (s *Service) ListLogs(ctx context.Context, tenantID string, limit, offset int32) ([]db.Outbox, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.ListOutboxEvents(ctx, db.ListOutboxEventsParams{
		TenantID:    tUUID,
		LimitCount:  limit,
		OffsetCount: offset,
	})
}
