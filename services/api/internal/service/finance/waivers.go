package finance

import (
	"context"

	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

func (s *Service) CreateFeeLateWaiver(ctx context.Context, arg db.CreateFeeLateWaiverParams) (db.FeeLateWaiver, error) {
	waiver, err := s.q.CreateFeeLateWaiver(ctx, arg)
	if err != nil {
		return db.FeeLateWaiver{}, err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     arg.TenantID,
		UserID:       arg.RequestedBy,
		Action:       "finance.create_waiver",
		ResourceType: "fee_late_waiver",
		ResourceID:   waiver.ID,
		After:        waiver,
	})

	return waiver, nil
}

func (s *Service) UpdateFeeLateWaiverStatus(ctx context.Context, arg db.UpdateFeeLateWaiverStatusParams) (db.FeeLateWaiver, error) {
	waiver, err := s.q.UpdateFeeLateWaiverStatus(ctx, arg)
	if err != nil {
		return db.FeeLateWaiver{}, err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     arg.TenantID,
		UserID:       arg.DecidedBy,
		Action:       "finance.update_waiver_status",
		ResourceType: "fee_late_waiver",
		ResourceID:   waiver.ID,
		After:        waiver,
	})

	return waiver, nil
}

func (s *Service) ListFeeLateWaivers(ctx context.Context, arg db.ListFeeLateWaiversParams) ([]db.ListFeeLateWaiversRow, error) {
	return s.q.ListFeeLateWaivers(ctx, arg)
}
