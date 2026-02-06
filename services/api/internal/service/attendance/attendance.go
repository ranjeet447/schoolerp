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
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/approvals"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/policy"
)

type Service struct {
	q         db.Querier
	audit     *audit.Logger
	policy    *policy.Evaluator
	approvals *approvals.Service
}

func NewService(q db.Querier, audit *audit.Logger, poly *policy.Evaluator, app *approvals.Service) *Service {
	return &Service{q: q, audit: audit, policy: poly, approvals: app}
}

type MarkAttendanceParams struct {
	TenantID       string
	ClassSectionID string
	Date           time.Time
	Entries        []AttendanceEntry
	
	// Context
	UserID    string
	RequestID string
	IP        string
}

type AttendanceEntry struct {
	StudentID string
	Status    string
	Remarks   string
}

func (s *Service) MarkAttendance(ctx context.Context, p MarkAttendanceParams) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	csUUID := pgtype.UUID{}
	csUUID.Scan(p.ClassSectionID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	// 1. Policy Check: Can we mark for this date?
	// For Release 1: Allow marking for today or past dates within X hours.
	decision, err := s.policy.Evaluate(ctx, policy.Context{
		TenantID: p.TenantID,
		Module:   "attendance",
		Action:   "mark",
	})
	if err != nil {
		return err
	}
	if !decision.Allowed {
		return fmt.Errorf("action denied: %s", decision.DenialReason)
	}

	// 2. Create/Update Session
	session, err := s.q.CreateAttendanceSession(ctx, db.CreateAttendanceSessionParams{
		TenantID:       tUUID,
		ClassSectionID: csUUID,
		Date:           pgtype.Date{Time: p.Date, Valid: true},
		MarkedBy:       uUUID,
	})
	if err != nil {
		return err
	}

	// 3. Clear existing entries for this session (if any) and batch insert
	// In a real production app, we might use a transition to keep history
	err = s.q.DeleteAttendanceEntries(ctx, session.ID)
	if err != nil {
		return err
	}

	var batchEntries []db.BatchUpsertAttendanceEntriesParams
	for _, e := range p.Entries {
		stUUID := pgtype.UUID{}
		stUUID.Scan(e.StudentID)
		batchEntries = append(batchEntries, db.BatchUpsertAttendanceEntriesParams{
			SessionID: session.ID,
			StudentID: stUUID,
			Status:    e.Status,
			Remarks:   pgtype.Text{String: e.Remarks, Valid: e.Remarks != ""},
		})
	}

	// SQLC generate uses CopyFrom for BatchUpsert
	_, err = s.q.BatchUpsertAttendanceEntries(ctx, batchEntries)
	if err != nil {
		return err
	}

	// 4. Audit Log
	s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "mark_attendance",
		ResourceType: "attendance_session",
		ResourceID:   session.ID,
		IPAddress:    p.IP,
	})

	return nil
}

func (s *Service) GetSession(ctx context.Context, tenantID, classSectionID string, date time.Time) (db.AttendanceSession, []db.GetAttendanceEntriesRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	csUUID := pgtype.UUID{}
	csUUID.Scan(classSectionID)

	session, err := s.q.GetAttendanceSession(ctx, db.GetAttendanceSessionParams{
		TenantID:       tUUID,
		ClassSectionID: csUUID,
		Date:           pgtype.Date{Time: date, Valid: true},
	})
	if err != nil {
		return db.AttendanceSession{}, nil, err
	}

	entries, err := s.q.GetAttendanceEntries(ctx, session.ID)
	return session, entries, err
}
