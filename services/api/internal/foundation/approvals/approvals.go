package approvals

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Service struct {
	q db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{q: q}
}

func (s *Service) CreateRequest(ctx context.Context, tenantID, requesterID, module, action, resourceID string, payload any) (db.ApprovalRequest, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	
	uUUID := pgtype.UUID{}
	uUUID.Scan(requesterID)

	rUUID := pgtype.UUID{}
	rUUID.Scan(resourceID)

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return db.ApprovalRequest{}, err
	}

	arg := db.CreateApprovalRequestParams{
		TenantID:    tUUID,
		RequesterID: uUUID,
		Module:      module,
		Action:      action,
		ResourceID:  rUUID,
		Payload:     payloadJSON,
	}

	return s.q.CreateApprovalRequest(ctx, arg)
}

func (s *Service) ProcessRequest(ctx context.Context, requestID string, status string, reason string) (db.ApprovalRequest, error) {
	rUUID := pgtype.UUID{}
	rUUID.Scan(requestID)

	return s.q.UpdateApprovalStatus(ctx, db.UpdateApprovalStatusParams{
		ID:     rUUID,
		Status: pgtype.Text{String: status, Valid: true},
		Reason: pgtype.Text{String: reason, Valid: reason != ""},
	})
}

func (s *Service) ListPending(ctx context.Context, tenantID string) ([]db.ApprovalRequest, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.ListPendingApprovals(ctx, tUUID)
}
