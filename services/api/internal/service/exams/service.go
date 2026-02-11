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

func (s *Service) UpsertGradingScale(ctx context.Context, tenantID string, min, max float64, label string, point float64) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	minNum := pgtype.Numeric{Int: big.NewInt(int64(min * 100)), Exp: -2, Valid: true}
	maxNum := pgtype.Numeric{Int: big.NewInt(int64(max * 100)), Exp: -2, Valid: true}
	pointNum := pgtype.Numeric{Int: big.NewInt(int64(point * 100)), Exp: -2, Valid: true}

	_, err := s.q.UpsertGradingScale(ctx, db.UpsertGradingScaleParams{
		TenantID:   tUUID,
		MinPercent: minNum,
		MaxPercent: maxNum,
		GradeLabel: label,
		GradePoint: pointNum,
	})
	return err
}

func (s *Service) UpsertWeightageConfig(ctx context.Context, tenantID, ayID, examType string, weight float64) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	ayUUID := pgtype.UUID{}
	ayUUID.Scan(ayID)

	weightNum := pgtype.Numeric{Int: big.NewInt(int64(weight * 100)), Exp: -2, Valid: true}

	_, err := s.q.UpsertWeightageConfig(ctx, db.UpsertWeightageConfigParams{
		TenantID:         tUUID,
		AcademicYearID:   ayUUID,
		ExamType:         examType,
		WeightPercentage: weightNum,
	})
	return err
}

func (s *Service) CalculateAggregates(ctx context.Context, tenantID, ayID string) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	ayUUID := pgtype.UUID{}
	ayUUID.Scan(ayID)

	// 1. Fetch Weightage Config
	weights, err := s.q.ListWeightageConfigs(ctx, db.ListWeightageConfigsParams{
		TenantID:       tUUID,
		AcademicYearID: ayUUID,
	})
	if err != nil {
		return err
	}
	weightMap := make(map[string]float64)
	for _, w := range weights {
		val, _ := w.WeightPercentage.Float64Value()
		weightMap[w.ExamType] = val.Float64 / 100.0
	}

	// 2. Fetch Grading Scales
	scales, err := s.q.ListGradingScales(ctx, tUUID)
	if err != nil {
		return err
	}

	getGrade := func(percent float64) string {
		for _, sc := range scales {
			min, _ := sc.MinPercent.Float64Value()
			max, _ := sc.MaxPercent.Float64Value()
			if percent >= min.Float64 && percent <= max.Float64 {
				return sc.GradeLabel
			}
		}
		return ""
	}

	// 3. Fetch Marks
	marks, err := s.q.GetMarksForAggregation(ctx, db.GetMarksForAggregationParams{
		TenantID:       tUUID,
		AcademicYearID: ayUUID,
	})
	if err != nil {
		return err
	}

	// 4. Group marks by Student and Subject
	type studentSubject struct {
		studentID pgtype.UUID
		subjectID pgtype.UUID
	}
	aggregates := make(map[studentSubject]float64)

	for _, m := range marks {
		key := studentSubject{studentID: m.StudentID, subjectID: m.SubjectID}
		obtained, _ := m.MarksObtained.Float64Value()
		weight := weightMap[m.ExamType]
		if weight == 0 {
			continue // Skip if no weight defined
		}
		
		// percentage = (obtained / max) * 100
		percent := (obtained.Float64 / float64(m.MaxMarks)) * 100.0
		aggregates[key] += percent * weight
	}

	// 5. Upsert aggregates
	for key, score := range aggregates {
		grade := getGrade(score)
		scoreNum := pgtype.Numeric{Int: big.NewInt(int64(score * 100)), Exp: -2, Valid: true}
		
		_, err = s.q.UpsertMarksAggregate(ctx, db.UpsertMarksAggregateParams{
			TenantID:       tUUID,
			StudentID:      key.studentID,
			AcademicYearID: ayUUID,
			SubjectID:      key.subjectID,
			AggregateMarks: scoreNum,
			GradeLabel:     pgtype.Text{String: grade, Valid: grade != ""},
		})
		if err != nil {
			return fmt.Errorf("failed to upsert aggregate for %s: %w", key.studentID, err)
		}
	}

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

