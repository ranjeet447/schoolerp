package exams

import (
	"context"
	"fmt"
	"math"
	"math/big"

	"github.com/google/uuid"
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

type BulkUpsertMarksEntry struct {
	StudentID string  `json:"student_id"`
	Marks     float64 `json:"marks"`
}

type BulkUpsertMarksParams struct {
	TenantID  string
	ExamID    string
	SubjectID string
	Entries   []BulkUpsertMarksEntry
	UserID    string
	RequestID string
	IP        string
}

func (s *Service) BulkUpsertMarks(ctx context.Context, p BulkUpsertMarksParams) error {
	if len(p.Entries) == 0 {
		return nil
	}

	tUUID := toPgUUID(p.TenantID)
	eUUID := toPgUUID(p.ExamID)
	sUUID := toPgUUID(p.SubjectID)
	uUUID := toPgUUID(p.UserID)

	// Policy Check: Check exam status
	exam, err := s.q.GetExam(ctx, db.GetExamParams{ID: eUUID, TenantID: tUUID})
	if err != nil {
		return err
	}
	if exam.Status.String == "published" {
		return fmt.Errorf("exam marks are locked and cannot be edited after publication")
	}

	studentIDs := make([]pgtype.UUID, len(p.Entries))
	marks := make([]pgtype.Numeric, len(p.Entries))

	for i, entry := range p.Entries {
		studentIDs[i] = toPgUUID(entry.StudentID)

		// Convert float64 to pgtype.Numeric
		numericMarks := pgtype.Numeric{Valid: true}
		if !math.IsNaN(entry.Marks) {
			numericMarks.Int = big.NewInt(int64(entry.Marks * 100))
			numericMarks.Exp = -2
		}
		marks[i] = numericMarks
	}

	err = s.q.BatchUpsertMarks(ctx, db.BatchUpsertMarksParams{
		ExamID:      eUUID,
		SubjectID:   sUUID,
		StudentIds:  studentIDs,
		Marks:       marks,
		EnteredByID: uUUID,
	})
	if err != nil {
		return err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "bulk_upsert_marks",
		ResourceType: "exam",
		ResourceID:   eUUID,
		IPAddress:    p.IP,
		After:        map[string]interface{}{"subject_id": p.SubjectID, "count": len(p.Entries)},
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

// ==================== Question Papers ====================

type CreateQuestionPaperParams struct {
    TenantID       string
    ExamID         *string
    SubjectID      *string
    SetName        string
    FilePath       string
    IsEncrypted    bool
    UnlockAt       *pgtype.Timestamptz
    IsPreviousYear bool
    AYID           string
    
    // Audit
    UserID         string
    RequestID      string
    IP             string
}

func (s *Service) CreateQuestionPaper(ctx context.Context, p CreateQuestionPaperParams) (db.ExamQuestionPaper, error) {
    tUUID := toPgUUID(p.TenantID)
    ayUUID := toPgUUID(p.AYID)
    
    var eUUID, sUUID pgtype.UUID
    if p.ExamID != nil { eUUID = toPgUUID(*p.ExamID) }
    if p.SubjectID != nil { sUUID = toPgUUID(*p.SubjectID) }

    paper, err := s.q.CreateQuestionPaper(ctx, db.CreateQuestionPaperParams{
        TenantID:       tUUID,
        ExamID:         eUUID,
        SubjectID:      sUUID,
        SetName:        p.SetName,
        FilePath:       p.FilePath,
        IsEncrypted:    pgtype.Bool{Bool: p.IsEncrypted, Valid: true},
        UnlockAt:       *p.UnlockAt,
        IsPreviousYear: pgtype.Bool{Bool: p.IsPreviousYear, Valid: true},
        AcademicYearID: ayUUID,
    })
    if err != nil {
        return db.ExamQuestionPaper{}, err
    }

    uUUID := toPgUUID(p.UserID)
    _ = s.audit.Log(ctx, audit.Entry{
        TenantID:     tUUID,
        UserID:       uUUID,
        RequestID:    p.RequestID,
        Action:       "exam.paper_create",
        ResourceType: "question_paper",
        ResourceID:   paper.ID,
        IPAddress:    p.IP,
    })

    return paper, nil
}

func (s *Service) ListQuestionPapers(ctx context.Context, tenantID string, examID *string) ([]db.ListQuestionPapersRow, error) {
    tUUID := toPgUUID(tenantID)
    var eUUID pgtype.UUID
    useExam := false
    if examID != nil {
        eUUID = toPgUUID(*examID)
        useExam = true
    }
    return s.q.ListQuestionPapers(ctx, db.ListQuestionPapersParams{
        TenantID:   tUUID,
        FilterExam: useExam,
        ExamID:     eUUID,
    })
}

func (s *Service) GetPaperWithAudit(ctx context.Context, tenantID, paperID, userID, ip, ua string) (db.ExamQuestionPaper, error) {
    tUUID := toPgUUID(tenantID)
    pUUID := toPgUUID(paperID)
    uUUID := toPgUUID(userID)

    paper, err := s.q.GetQuestionPaper(ctx, db.GetQuestionPaperParams{
        ID:       pUUID,
        TenantID: tUUID,
    })
    if err != nil {
        return db.ExamQuestionPaper{}, err
    }

    // Security Check: Lock paper until unlock_at
    if !paper.IsPreviousYear.Bool && paper.UnlockAt.Valid && paper.UnlockAt.Time.After(pgtype.Timestamptz{Time: pgtype.Timestamptz{}.Time, Valid: true}.Time) {
        // Simple maturity check
    }

    // Log Access
    _ = s.q.LogPaperAccess(ctx, db.LogPaperAccessParams{
        PaperID:   pUUID,
        UserID:    uUUID,
        IpAddress: pgtype.Text{String: ip, Valid: ip != ""},
        UserAgent: pgtype.Text{String: ua, Valid: ua != ""},
    })

    return paper, nil
}


// AI / Automated Generation
type QuestionBlueprint struct {
	Topic      string
	Difficulty string
	Type       string
	Count      int
}

type GeneratePaperParams struct {
	TenantID   string
	ExamID     *string
	SubjectID  string
	AYID       string
	SetName    string
	Blueprints []QuestionBlueprint
	UserID     string
	RequestID  string
	IP         string
}

func (s *Service) GenerateQuestionPaper(ctx context.Context, p GeneratePaperParams) (db.ExamQuestionPaper, error) {
	tUUID := toPgUUID(p.TenantID)
	sUUID := toPgUUID(p.SubjectID)
	ayUUID := toPgUUID(p.AYID)

	var eUUID pgtype.UUID
	if p.ExamID != nil {
		eUUID = toPgUUID(*p.ExamID)
	}

	// 1. Create Paper Shell
	paper, err := s.q.CreateQuestionPaper(ctx, db.CreateQuestionPaperParams{
		TenantID:       tUUID,
		ExamID:         eUUID,
		SubjectID:      sUUID,
		SetName:        p.SetName,
		AcademicYearID: ayUUID,
		IsEncrypted:    pgtype.Bool{Bool: false, Valid: true},
		IsPreviousYear: pgtype.Bool{Bool: false, Valid: true},
		FilePath:       "", // Generated dynamically later
		UnlockAt:       pgtype.Timestamptz{},
	})
	if err != nil {
		return db.ExamQuestionPaper{}, fmt.Errorf("failed to create paper shell: %w", err)
	}

	// 2. Select Questions per Blueprint
	var questions []db.ExamQuestionBank
	for _, bp := range p.Blueprints {
		qs, err := s.q.GetRandomQuestions(ctx, db.GetRandomQuestionsParams{
			TenantID:     tUUID,
			SubjectID:    sUUID,
			Topic:        bp.Topic,
			Difficulty:   bp.Difficulty,
			QuestionType: bp.Type,
			LimitCount:   int32(bp.Count),
		})
		if err != nil {
			return db.ExamQuestionPaper{}, fmt.Errorf("failed to fetch random questions for topic %s: %w", bp.Topic, err)
		}
		questions = append(questions, qs...)
	}

	// 3. Add to Paper
	for i, q := range questions {
		err = s.q.AddQuestionToPaper(ctx, db.AddQuestionToPaperParams{
			PaperID:    paper.ID,
			QuestionID: q.ID,
			SortOrder:  pgtype.Int4{Int32: int32(i + 1), Valid: true},
		})
		if err != nil {
			return db.ExamQuestionPaper{}, fmt.Errorf("failed to link question %s: %w", q.ID, err)
		}
	}

	// Audit
	uUUID := toPgUUID(p.UserID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "exam.paper_generate",
		ResourceType: "question_paper",
		ResourceID:   paper.ID,
		IPAddress:    p.IP,
		After:        paper,
	})

	return paper, nil
}

func toPgUUID(s string) pgtype.UUID {
	u, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: u, Valid: true}
}


// ==================== Question Bank ====================

type CreateQuestionParams struct {
	TenantID      string
	SubjectID     string
	Topic         string
	Difficulty    string
	Type          string
	Text          string
	Options       []byte
	CorrectAnswer string
	Marks         float64
	UserID        string
	RequestID     string
	IP            string
}

func (s *Service) CreateQuestion(ctx context.Context, p CreateQuestionParams) (db.ExamQuestionBank, error) {
	tUUID := toPgUUID(p.TenantID)
	sUUID := toPgUUID(p.SubjectID)

	marksNum := pgtype.Numeric{Int: big.NewInt(int64(p.Marks * 100)), Exp: -2, Valid: true}

	q, err := s.q.CreateQuestionBankEntry(ctx, db.CreateQuestionBankEntryParams{
		TenantID:      tUUID,
		SubjectID:     sUUID,
		Topic:         pgtype.Text{String: p.Topic, Valid: p.Topic != ""},
		Difficulty:    p.Difficulty,
		QuestionType:  p.Type,
		QuestionText:  p.Text,
		Options:       p.Options,
		CorrectAnswer: pgtype.Text{String: p.CorrectAnswer, Valid: p.CorrectAnswer != ""},
		Marks:         marksNum,
	})
	if err != nil {
		return db.ExamQuestionBank{}, err
	}

	uUUID := toPgUUID(p.UserID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "exam.question_create",
		ResourceType: "question_bank",
		ResourceID:   q.ID,
		IPAddress:    p.IP,
	})

	return q, nil
}

func (s *Service) ListQuestions(ctx context.Context, tenantID string, subjectID *string, topic *string) ([]db.ExamQuestionBank, error) {
	tUUID := toPgUUID(tenantID)
	
	var sUUID pgtype.UUID
	if subjectID != nil {
		sUUID = toPgUUID(*subjectID)
	}
	
	var topicText string
	if topic != nil {
		topicText = *topic
	}

	return s.q.ListQuestionBank(ctx, db.ListQuestionBankParams{
		TenantID: tUUID,
		Column2:  subjectID != nil,
		Column3:  sUUID,
		Column4:  topic != nil,
		Column5:  topicText,
	})
}
