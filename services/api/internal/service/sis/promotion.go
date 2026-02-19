package sis

import (
	"context"
	"math/big"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type PromotionService struct {
	q     db.Querier
	audit *audit.Logger
}

func NewPromotionService(q db.Querier, audit *audit.Logger) *PromotionService {
	return &PromotionService{q: q, audit: audit}
}

func (s *PromotionService) CreateRule(ctx context.Context, tenantID string, priority int32, minAgg, minSub, minAtt float64) (db.PromotionRule, error) {
	tUUID := toPgUUID(tenantID)
	
	rule, err := s.q.CreatePromotionRule(ctx, db.CreatePromotionRuleParams{
		TenantID:                  tUUID,
		Priority:                  pgtype.Int4{Int32: priority, Valid: true},
		MinAggregatePercent:       toNumeric(minAgg),
		MinSubjectPercent:         toNumeric(minSub),
		RequiredAttendancePercent: toNumeric(minAtt),
	})
	return rule, err
}

type PromotionParams struct {
	TenantID       string
	StudentID      string
	FromAYID       string
	ToAYID         string
	FromSectionID  *string
	ToSectionID    *string
	PromotedBy     string
	Status         string
	Remarks        string
}

func (s *PromotionService) PromoteStudent(ctx context.Context, p PromotionParams) error {
	tUUID := toPgUUID(p.TenantID)
	stUUID := toPgUUID(p.StudentID)
	fromAYUUID := toPgUUID(p.FromAYID)
	toAYUUID := toPgUUID(p.ToAYID)
	uUUID := toPgUUID(p.PromotedBy)

	var fromSecUUID, toSecUUID pgtype.UUID
	if p.FromSectionID != nil { fromSecUUID = toPgUUID(*p.FromSectionID) }
	if p.ToSectionID != nil { toSecUUID = toPgUUID(*p.ToSectionID) }

	promotion, err := s.q.PromoteStudent(ctx, db.PromoteStudentParams{
		TenantID:           tUUID,
		StudentID:          stUUID,
		FromAcademicYearID: fromAYUUID,
		ToAcademicYearID:   toAYUUID,
		FromSectionID:      fromSecUUID,
		ToSectionID:        toSecUUID,
		PromotedBy:         uUUID,
		Status:             p.Status,
		Remarks:            pgtype.Text{String: p.Remarks, Valid: p.Remarks != ""},
	})
	if err != nil {
		return err
	}

	// Update student's current section and potentially status
	if p.Status == "promoted" && p.ToSectionID != nil {
		_, err = s.q.UpdateStudent(ctx, db.UpdateStudentParams{
			ID:        stUUID,
			TenantID:  tUUID,
			SectionID: toSecUUID,
			Status:    pgtype.Text{String: "active", Valid: true},
			// Note: This logic assumes UpdateStudent exists with these params. 
			// We might need a specialized MoveStudent method if UpdateStudent is more restrictive.
		})
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		Action:       "sis.promote",
		ResourceType: "student_promotion",
		ResourceID:   promotion.ID,
		After:        promotion,
	})

	return nil
}

func toNumeric(f float64) pgtype.Numeric {
	return pgtype.Numeric{Int: big.NewInt(int64(f * 100)), Exp: -2, Valid: true}
}
