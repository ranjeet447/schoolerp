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

package attendance

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

func (s *Service) CreateLeaveRequest(ctx context.Context, tenantID, studentID string, from, to time.Time, reason string) (db.LeaveRequest, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	return s.q.CreateLeaveRequest(ctx, db.CreateLeaveRequestParams{
		TenantID:  tUUID,
		StudentID: sUUID,
		FromDate:  pgtype.Date{Time: from, Valid: true},
		ToDate:    pgtype.Date{Time: to, Valid: true},
		Reason:    pgtype.Text{String: reason, Valid: reason != ""},
	})
}

func (s *Service) ListLeaves(ctx context.Context, tenantID string, status string) ([]db.ListLeaveRequestsRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.ListLeaveRequests(ctx, db.ListLeaveRequestsParams{
		TenantID: tUUID,
		Status:   pgtype.Text{String: status, Valid: status != ""},
	})
}

func (s *Service) ProcessLeave(ctx context.Context, tenantID, requestID, status, userID string) (db.LeaveRequest, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	rUUID := pgtype.UUID{}
	rUUID.Scan(requestID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	return s.q.UpdateLeaveStatus(ctx, db.UpdateLeaveStatusParams{
		ID:        rUUID,
		TenantID:  tUUID,
		Status:    pgtype.Text{String: status, Valid: true},
		DecidedBy: uUUID,
	})
}
