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
