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

package exams

import (
	"context"
	"fmt"
	"math"
	"math/big"

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

type CreateExamParams struct {
	TenantID string
	AYID     string
	Name     string
	Start    pgtype.Date
	End      pgtype.Date
	
	// Audit
	UserID    string
	RequestID string
	IP        string
}

func (s *Service) CreateExam(ctx context.Context, p CreateExamParams) (db.Exam, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	ayUUID := pgtype.UUID{}
	ayUUID.Scan(p.AYID)

	exam, err := s.q.CreateExam(ctx, db.CreateExamParams{
		TenantID:       tUUID,
		AcademicYearID: ayUUID,
		Name:           p.Name,
		StartDate:      p.Start,
		EndDate:        p.End,
	})
	if err != nil {
		return db.Exam{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "exam.create",
		ResourceType: "exam",
		ResourceID:   exam.ID,
		After:        exam,
		IPAddress:    p.IP,
	})

	return exam, nil
}

func (s *Service) AddSubject(ctx context.Context, tenantID, examID, subjectID string, maxMarks int32, date pgtype.Date, userID, reqID, ip string) error {
	eUUID := pgtype.UUID{}
	eUUID.Scan(examID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(subjectID)

	err := s.q.AddExamSubject(ctx, db.AddExamSubjectParams{
		ExamID:    eUUID,
		SubjectID: sUUID,
		MaxMarks:  maxMarks,
		ExamDate:  date,
	})
	if err != nil {
		return err
	}

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	
	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "exam.add_subject",
		ResourceType: "exam_subject",
		ResourceID:   eUUID, // Log against Exam
		After:        map[string]interface{}{"subject_id": subjectID, "max_marks": maxMarks},
		IPAddress:    ip,
	})

	return nil
}

func (s *Service) GetExam(ctx context.Context, tenantID, id string) (db.Exam, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	eUUID := pgtype.UUID{}
	eUUID.Scan(id)

	return s.q.GetExam(ctx, db.GetExamParams{
		ID:       eUUID,
		TenantID: tUUID,
	})
}

func (s *Service) ListExams(ctx context.Context, tenantID string) ([]db.Exam, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListExams(ctx, tUUID)
}

func (s *Service) ListSubjects(ctx context.Context, examID string) ([]db.ListExamSubjectsRow, error) {
	eUUID := pgtype.UUID{}
	eUUID.Scan(examID)
	return s.q.ListExamSubjects(ctx, eUUID)
}

func (s *Service) GetExamMarks(ctx context.Context, tenantID, examID, subjectID string) ([]db.GetExamMarksRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	eUUID := pgtype.UUID{}
	eUUID.Scan(examID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(subjectID)

	return s.q.GetExamMarks(ctx, db.GetExamMarksParams{
		ExamID:    eUUID,
		SubjectID: sUUID,
		TenantID:  tUUID,
	})
}

type UpsertMarksParams struct {
	TenantID  string
	ExamID    string
	SubjectID string
	StudentID string
	Marks     float64
	UserID    string
	RequestID string
	IP        string
}

func (s *Service) UpsertMarks(ctx context.Context, p UpsertMarksParams) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	eUUID := pgtype.UUID{}
	eUUID.Scan(p.ExamID)

	// Policy Check: Check exam status
	exam, err := s.q.GetExam(ctx, db.GetExamParams{ID: eUUID, TenantID: tUUID})
	if err != nil {
		return err
	}
	if exam.Status.String == "published" {
		return fmt.Errorf("exam marks are locked and cannot be edited after publication")
	}

	sUUID := pgtype.UUID{}
	sUUID.Scan(p.SubjectID)

	stUUID := pgtype.UUID{}
	stUUID.Scan(p.StudentID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	// Convert float64 to pgtype.Numeric
	numericMarks := pgtype.Numeric{Valid: true}
	// TODO: import math/big if needed, or assume it's there
	// Assuming imports are missing? Let's check imports.
	// Imports in file: "context", "github.com/jackc/pgx/v5/pgtype", "github.com/schoolerp/api/internal/db", "github.com/schoolerp/api/internal/foundation/audit"
	// Missing "fmt", "math", "math/big". 
	// I need to add imports too!
	
	if !math.IsNaN(p.Marks) {
		numericMarks.Int = big.NewInt(int64(p.Marks * 100))
		numericMarks.Exp = -2
	}

	err = s.q.UpsertMarks(ctx, db.UpsertMarksParams{
		ExamID:        eUUID,
		SubjectID:     sUUID,
		StudentID:     stUUID,
		MarksObtained: numericMarks,
		EnteredBy:     uUUID,
	})
	if err != nil {
		return err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "upsert_marks",
		ResourceType: "exam",
		ResourceID:   eUUID,
		IPAddress:    p.IP,
	})

	return nil
}

func (s *Service) PublishExam(ctx context.Context, tenantID, id string, userID, reqID, ip string) (db.Exam, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	eUUID := pgtype.UUID{}
	eUUID.Scan(id)

	exam, err := s.q.PublishExam(ctx, db.PublishExamParams{
		ID:       eUUID,
		TenantID: tUUID,
	})
	if err != nil {
		return db.Exam{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    reqID,
		Action:       "exam.publish",
		ResourceType: "exam",
		ResourceID:   exam.ID,
		After:        exam,
		IPAddress:    ip,
	})

	return exam, nil
}

func (s *Service) GetExamResultsForStudent(ctx context.Context, tenantID, studentID string) ([]db.GetExamResultsForStudentRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	stUUID := pgtype.UUID{}
	stUUID.Scan(studentID)

	return s.q.GetExamResultsForStudent(ctx, db.GetExamResultsForStudentParams{
		StudentID: stUUID,
		TenantID:  tUUID,
	})
}
