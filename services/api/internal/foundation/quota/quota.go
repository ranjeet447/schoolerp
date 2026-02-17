package quota

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Service struct {
	q db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{q: q}
}

type QuotaType string

const (
	QuotaStudents QuotaType = "students"
	QuotaStaff    QuotaType = "staff"
)

func (s *Service) CheckQuota(ctx context.Context, tenantID string, qType QuotaType) error {
	tUUID := pgtype.UUID{}
	if err := tUUID.Scan(tenantID); err != nil || !tUUID.Valid {
		return errors.New("invalid tenant id")
	}

	limit, err := s.q.GetEffectiveTenantLimit(ctx, db.GetEffectiveTenantLimitParams{
		TenantID: tUUID,
		QuotaKey: string(qType),
	})
	if err != nil {
		return err
	}
	if limit <= 0 {
		// 0 means unlimited for this quota key.
		return nil
	}

	var current int64
	switch qType {
	case QuotaStudents:
		current, err = s.q.CountStudents(ctx, tUUID)
	case QuotaStaff:
		current, err = s.q.CountEmployees(ctx, tUUID)
	default:
		return nil
	}
	if err != nil {
		return err
	}
	if current >= limit {
		return fmt.Errorf("%s quota exceeded (limit: %d)", qType, limit)
	}
	return nil
}
