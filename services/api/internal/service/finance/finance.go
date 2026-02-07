package finance

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type Service struct {
	q     db.Querier
	audit *audit.Logger
}

func NewService(q db.Querier, audit *audit.Logger) *Service {
	return &Service{q: q, audit: audit}
}

func (s *Service) CreateFeeHead(ctx context.Context, tenantID, name, headType string) (db.FeeHead, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.CreateFeeHead(ctx, db.CreateFeeHeadParams{
		TenantID: tUUID,
		Name:     name,
		Type:     pgtype.Text{String: headType, Valid: headType != ""},
	})
}

func (s *Service) ListFeeHeads(ctx context.Context, tenantID string) ([]db.FeeHead, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListFeeHeads(ctx, tUUID)
}

func (s *Service) CreateFeePlan(ctx context.Context, tenantID, name, ayID string, total int64) (db.FeePlan, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	ayUUID := pgtype.UUID{}
	ayUUID.Scan(ayID)

	return s.q.CreateFeePlan(ctx, db.CreateFeePlanParams{
		TenantID:       tUUID,
		Name:           name,
		AcademicYearID: ayUUID,
		TotalAmount:    pgtype.Int8{Int64: total, Valid: true},
	})
}

func (s *Service) CreateFeePlanItem(ctx context.Context, planID, headID string, amount int64) (db.FeePlanItem, error) {
	pUUID := pgtype.UUID{}
	pUUID.Scan(planID)

	hUUID := pgtype.UUID{}
	hUUID.Scan(headID)

	return s.q.CreateFeePlanItem(ctx, db.CreateFeePlanItemParams{
		PlanID: pUUID,
		HeadID: hUUID,
		Amount: amount,
	})
}

func (s *Service) AssignPlanToStudent(ctx context.Context, studentID, planID string) error {
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	pUUID := pgtype.UUID{}
	pUUID.Scan(planID)

	_, err := s.q.AssignPlanToStudent(ctx, db.AssignPlanToStudentParams{
		StudentID: sUUID,
		PlanID:    pUUID,
	})
	return err
}

func (s *Service) GetStudentFeeSummary(ctx context.Context, studentID string) ([]db.GetStudentFeeSummaryRow, error) {
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)
	return s.q.GetStudentFeeSummary(ctx, sUUID)
}
