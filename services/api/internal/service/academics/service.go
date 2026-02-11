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

package academics

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

type CreateHomeworkParams struct {
	TenantID       string
	SubjectID      string
	ClassSectionID string
	TeacherID      string
	Title          string
	Description    string
	DueDate        pgtype.Timestamptz
	Attachments    []byte // JSONB

	// Audit
	UserID    string
	RequestID string
	IP        string
}

func (s *Service) CreateHomework(ctx context.Context, p CreateHomeworkParams) (db.Homework, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(p.SubjectID)
	csUUID := pgtype.UUID{}
	csUUID.Scan(p.ClassSectionID)
	teachUUID := pgtype.UUID{}
	teachUUID.Scan(p.TeacherID)

	hw, err := s.q.CreateHomework(ctx, db.CreateHomeworkParams{
		TenantID:       tUUID,
		SubjectID:      sUUID,
		ClassSectionID: csUUID,
		TeacherID:      teachUUID,
		Title:          p.Title,
		Description:    pgtype.Text{String: p.Description, Valid: p.Description != ""},
		DueDate:        p.DueDate,
		Attachments:    p.Attachments,
	})
	if err != nil {
		return db.Homework{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "homework.create",
		ResourceType: "homework",
		ResourceID:   hw.ID,
		After:        hw,
		IPAddress:    p.IP,
	})

	// TODO: Trigger notification for students in the class/section
	// This would involve creating an outbox event

	return hw, nil
}

func (s *Service) SubmitHomework(ctx context.Context, homeworkID, studentID, url, remarks string) (db.HomeworkSubmission, error) {
	hUUID := pgtype.UUID{}
	hUUID.Scan(homeworkID)
	stUUID := pgtype.UUID{}
	stUUID.Scan(studentID)

	return s.q.SubmitHomework(ctx, db.SubmitHomeworkParams{
		HomeworkID:    hUUID,
		StudentID:     stUUID,
		AttachmentUrl: pgtype.Text{String: url, Valid: url != ""},
		Remarks:       pgtype.Text{String: remarks, Valid: remarks != ""},
	})
}

func (s *Service) GradeSubmission(ctx context.Context, id, status, feedback string) (db.HomeworkSubmission, error) {
	uUUID := pgtype.UUID{}
	uUUID.Scan(id)

	return s.q.GradeSubmission(ctx, db.GradeSubmissionParams{
		ID:              uUUID,
		Column2:          status,
		TeacherFeedback: pgtype.Text{String: feedback, Valid: feedback != ""},
	})
}

func (s *Service) UpsertLessonPlan(ctx context.Context, tenantID, subjectID, classID string, week int32, topic string, covered pgtype.Timestamptz) (db.LessonPlan, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(subjectID)
	cUUID := pgtype.UUID{}
	cUUID.Scan(classID)

	return s.q.UpsertLessonPlan(ctx, db.UpsertLessonPlanParams{
		TenantID:     tUUID,
		SubjectID:    sUUID,
		ClassID:      cUUID,
		WeekNumber:   week,
		PlannedTopic: topic,
		CoveredAt:    covered,
	})
}

func (s *Service) ListHomeworkForSection(ctx context.Context, tenantID, sectionID string) ([]db.ListHomeworkForSectionRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	csUUID := pgtype.UUID{}
	csUUID.Scan(sectionID)
	return s.q.ListHomeworkForSection(ctx, db.ListHomeworkForSectionParams{
		TenantID:       tUUID,
		ClassSectionID: csUUID,
	})
}

func (s *Service) GetHomeworkForStudent(ctx context.Context, tenantID, studentID string) ([]db.GetHomeworkForStudentRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	stUUID := pgtype.UUID{}
	stUUID.Scan(studentID)
	return s.q.GetHomeworkForStudent(ctx, db.GetHomeworkForStudentParams{
		ID:       stUUID,
		TenantID: tUUID,
	})
}

func (s *Service) ListSubmissions(ctx context.Context, homeworkID string) ([]db.ListSubmissionsRow, error) {
	hUUID := pgtype.UUID{}
	hUUID.Scan(homeworkID)
	return s.q.ListSubmissions(ctx, hUUID)
}

func (s *Service) ListLessonPlans(ctx context.Context, tenantID, subjectID, classID string) ([]db.LessonPlan, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(subjectID)
	cUUID := pgtype.UUID{}
	cUUID.Scan(classID)
	return s.q.ListLessonPlans(ctx, db.ListLessonPlansParams{
		TenantID:  tUUID,
		SubjectID: sUUID,
		ClassID:   cUUID,
	})
}

func (s *Service) GetHomework(ctx context.Context, tenantID, id string) (db.Homework, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	hUUID := pgtype.UUID{}
	hUUID.Scan(id)
	return s.q.GetHomework(ctx, db.GetHomeworkParams{
		ID:       hUUID,
		TenantID: tUUID,
	})
}

