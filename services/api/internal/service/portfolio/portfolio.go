package portfolio

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

type CreateGroupParams struct {
	Name        string
	Description string
	OwnerUserID string
}

func (s *Service) CreateSchoolGroup(ctx context.Context, p CreateGroupParams) (db.SchoolGroup, error) {
	oID := pgtype.UUID{}
	oID.Scan(p.OwnerUserID)

	return s.q.CreateSchoolGroup(ctx, db.CreateSchoolGroupParams{
		Name:        p.Name,
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
		OwnerUserID: oID,
	})
}

func (s *Service) ListSchoolGroups(ctx context.Context, ownerUserID string) ([]db.SchoolGroup, error) {
	oID := pgtype.UUID{}
	oID.Scan(ownerUserID)
	return s.q.ListSchoolGroups(ctx, oID)
}

func (s *Service) AddGroupMember(ctx context.Context, groupID, tenantID string) error {
	gID := pgtype.UUID{}
	gID.Scan(groupID)
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.AddGroupMember(ctx, db.AddGroupMemberParams{
		GroupID:  gID,
		TenantID: tID,
	})
}

func (s *Service) ListGroupMembers(ctx context.Context, groupID string) ([]db.ListGroupMembersRow, error) {
	gID := pgtype.UUID{}
	gID.Scan(groupID)
	return s.q.ListGroupMembers(ctx, gID)
}

func (s *Service) GetGroupAnalytics(ctx context.Context, groupID string) (db.GetGroupAnalyticsRow, error) {
	gID := pgtype.UUID{}
	gID.Scan(groupID)
	return s.q.GetGroupAnalytics(ctx, gID)
}

func (s *Service) GetGroupFinancialAnalytics(ctx context.Context, groupID string) (db.GetGroupFinancialAnalyticsRow, error) {
	gID := pgtype.UUID{}
	gID.Scan(groupID)
	return s.q.GetGroupFinancialAnalytics(ctx, gID)
}

func (s *Service) GetGroupMemberComparison(ctx context.Context, groupID string) ([]db.GetGroupMemberComparisonRow, error) {
	gID := pgtype.UUID{}
	gID.Scan(groupID)
	return s.q.GetGroupMemberComparison(ctx, gID)
}

func (s *Service) GetGroupEnrollmentTrend(ctx context.Context, groupID string) ([]db.GetGroupEnrollmentTrendRow, error) {
	gID := pgtype.UUID{}
	gID.Scan(groupID)
	return s.q.GetGroupEnrollmentTrend(ctx, gID)
}

func (s *Service) GetGroupRevenueTrend(ctx context.Context, groupID string) ([]db.GetGroupRevenueTrendRow, error) {
	gID := pgtype.UUID{}
	gID.Scan(groupID)
	return s.q.GetGroupRevenueTrend(ctx, gID)
}
