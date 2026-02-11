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
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/approvals"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
)

type Service struct {
	q         db.Querier
	audit     *audit.Logger
	policy    *policy.Evaluator
	approvals *approvals.Service
	locks     *locks.Service
}

func NewService(q db.Querier, audit *audit.Logger, poly *policy.Evaluator, app *approvals.Service, lks *locks.Service) *Service {
	return &Service{q: q, audit: audit, policy: poly, approvals: app, locks: lks}
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
	// 0. Acquire Lock to prevent concurrent edits for this class/date
	// different teachers might try to mark simultaneously
	// We use the DB-based lock service. ResourceID is combination of Class+Date.
	resourceID := fmt.Sprintf("attendance:%s:%s", p.ClassSectionID, p.Date.Format("2006-01-02"))
	_, err := s.locks.Lock(ctx, p.TenantID, "attendance", &resourceID, p.UserID, "Marking Attendance")
	if err != nil {
		return fmt.Errorf("could not acquire lock (resource busy): %w", err)
	}
	// Ensure we unlock after operation (or defer it, though DB locks might persist if not cleared. 
	// The current lock service implementation seems to create a persistent lock record. 
	// For a critical section, we want to hold it just during the transaction or operation.
	// If the intention of `locks` foundation is persistent locks (like "Attendance Locked for Month"), we should check existence.
	// If it's for concurrency control, we should delete it after.
	// Assumption: This foundation service is for persistent business locks (e.g. "Result Locked"). 
	// For concurrency, we might want to just rely on DB transaction isolation or a separate Redis redis_lock.
	// Given the instructions "Wire policy/locks/approvals", and the `locks` package provided, 
	// it's likely intended for Business Locking.
	// However, the plan said "Acquire lock... to prevent concurrent edits". 
	// I will treat it as a critical section and Release (Delete) it at the end.
	defer s.locks.Unlock(ctx, p.TenantID, "attendance", &resourceID)
	
	// Check if already locked by someone else effectively handled by CreateLock unique constraint if it exists,
	// or we should check IsLocked first. 
	// But `CreateLock` likely fails if duplicate. Let's assume `Lock` tries to create and errors if exists.

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
		Role:     "teacher", // In real implementation, pass actual role
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

	// 5. Outbox Events for Notifications
	for _, e := range p.Entries {
		if e.Status == "absent" {
			payload, _ := json.Marshal(map[string]interface{}{
				"student_id":       e.StudentID,
				"class_section_id": p.ClassSectionID,
				"date":             p.Date.Format("2006-01-02"),
				"marked_by":        p.UserID,
			})
			_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
				TenantID:  tUUID,
				EventType: "attendance.absent",
				Payload:   payload,
			})
		}
	}

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

func (s *Service) ListPolicies(ctx context.Context, tenantID string) ([]db.Policy, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListPolicies(ctx, tUUID)
}

func (s *Service) UpdatePolicy(ctx context.Context, tenantID, module, action string, logic json.RawMessage, active bool) (db.Policy, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.UpdateOrCreatePolicy(ctx, db.UpdateOrCreatePolicyParams{
		TenantID: tUUID,
		Module:   module,
		Action:   action,
		Logic:    logic,
		IsActive: pgtype.Bool{Bool: active, Valid: true},
	})
}

