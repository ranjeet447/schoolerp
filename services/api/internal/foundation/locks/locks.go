package locks

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

func (s *Service) Lock(ctx context.Context, tenantID, module string, resourceID *string, userID string, reason string) (db.Lock, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	
	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	var resUUID pgtype.UUID
	if resourceID != nil {
		resUUID.Scan(*resourceID)
	}

	arg := db.CreateLockParams{
		TenantID:   tUUID,
		Module:     module,
		ResourceID: resUUID,
		LockedBy:   uUUID,
		Reason:     pgtype.Text{String: reason, Valid: reason != ""},
	}

	return s.q.CreateLock(ctx, arg)
}

func (s *Service) IsLocked(ctx context.Context, tenantID, module string, resourceID *string) (bool, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	var resUUID pgtype.UUID
	if resourceID != nil {
		resUUID.Scan(*resourceID)
	}

	arg := db.CheckLockParams{
		TenantID:   tUUID,
		Module:     module,
		ResourceID: resUUID,
	}

	return s.q.CheckLock(ctx, arg)
}

func (s *Service) Unlock(ctx context.Context, tenantID, module string, resourceID *string) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	var resUUID pgtype.UUID
	if resourceID != nil {
		resUUID.Scan(*resourceID)
	}

	return s.q.DeleteLock(ctx, db.DeleteLockParams{
		TenantID:   tUUID,
		Module:     module,
		ResourceID: resUUID,
	})
}
