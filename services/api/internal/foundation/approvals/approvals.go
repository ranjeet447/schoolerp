// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
