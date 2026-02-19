package exams

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/middleware"
	examservice "github.com/schoolerp/api/internal/service/exams"
)

type Handler struct {
	svc *examservice.Service
}

func NewHandler(svc *examservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/exams", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.Get)
		r.Post("/{id}/subjects", h.AddSubject)
		r.Get("/{id}/subjects", h.ListSubjects)
		r.Get("/{id}/subjects/{subjectId}/marks", h.GetMarks)
		r.Post("/{id}/subjects/{subjectId}/marks", h.UpsertMarks)
		r.Post("/{id}/subjects/{subjectId}/marks/bulk", h.UpsertMarksBulk)
		r.Post("/{id}/publish", h.Publish)
	})
	r.Route("/grading", func(r chi.Router) {
		r.Post("/scales", h.UpsertScale)
		r.Post("/weights", h.UpsertWeight)
	})
	r.Route("/aggregates", func(r chi.Router) {
		r.Post("/calculate", h.CalculateAggregates)
	})
	r.Route("/questions", func(r chi.Router) {
		r.Post("/", h.CreateQuestion)
		r.Get("/", h.ListQuestions)
	})
	r.Route("/papers", func(r chi.Router) {
		r.Post("/", h.CreatePaper)
		r.Get("/", h.ListPapers)
		r.Get("/{id}", h.GetPaper)
		r.Post("/generate", h.GeneratePaper)
	})
}

func (h *Handler) RegisterParentRoutes(r chi.Router) {
	r.Get("/children/{id}/exams/results", h.GetResultsForStudent)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name      string `json:"name"`
		AYID      string `json:"academic_year_id"`
		StartDate string `json:"start_date"`
		EndDate   string `json:"end_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(req.Name)
	ayID := strings.TrimSpace(req.AYID)
	if name == "" || ayID == "" {
		http.Error(w, "name and academic_year_id are required", http.StatusBadRequest)
		return
	}

	var start pgtype.Date
	var end pgtype.Date
	if strings.TrimSpace(req.StartDate) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(req.StartDate))
		if err != nil {
			http.Error(w, "invalid start_date format, expected YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		start = pgtype.Date{Time: parsed, Valid: true}
	}
	if strings.TrimSpace(req.EndDate) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(req.EndDate))
		if err != nil {
			http.Error(w, "invalid end_date format, expected YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		end = pgtype.Date{Time: parsed, Valid: true}
	}

	exam, err := h.svc.CreateExam(r.Context(), examservice.CreateExamParams{
		TenantID:  middleware.GetTenantID(r.Context()),
		AYID:      ayID,
		Name:      name,
		Start:     start,
		End:       end,
		UserID:    middleware.GetUserID(r.Context()),
		RequestID: middleware.GetReqID(r.Context()),
		IP:        r.RemoteAddr,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(exam)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	exams, err := h.svc.ListExams(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(exams)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	exam, err := h.svc.GetExam(r.Context(), middleware.GetTenantID(r.Context()), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(exam)
}

func (h *Handler) ListSubjects(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	subjects, err := h.svc.ListSubjects(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(subjects)
}

func (h *Handler) GetMarks(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "id")
	subjectID := chi.URLParam(r, "subjectId")
	marks, err := h.svc.GetExamMarks(r.Context(), middleware.GetTenantID(r.Context()), examID, subjectID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(marks)
}

func (h *Handler) UpsertMarks(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "id")
	subjectID := chi.URLParam(r, "subjectId")

	var req struct {
		StudentID string  `json:"student_id"`
		Marks     float64 `json:"marks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.StudentID) == "" {
		http.Error(w, "student_id is required", http.StatusBadRequest)
		return
	}
	if req.Marks < 0 {
		http.Error(w, "marks cannot be negative", http.StatusBadRequest)
		return
	}

	err := h.svc.UpsertMarks(r.Context(), examservice.UpsertMarksParams{
		TenantID:  middleware.GetTenantID(r.Context()),
		ExamID:    examID,
		SubjectID: subjectID,
		StudentID: req.StudentID,
		Marks:     req.Marks,
		UserID:    middleware.GetUserID(r.Context()),
		RequestID: middleware.GetReqID(r.Context()),
		IP:        r.RemoteAddr,
	})
	if err != nil {
		if strings.Contains(err.Error(), "locked") {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) UpsertMarksBulk(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "id")
	subjectID := chi.URLParam(r, "subjectId")

	var req struct {
		Entries []examservice.BulkUpsertMarksEntry `json:"entries"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	err := h.svc.BulkUpsertMarks(r.Context(), examservice.BulkUpsertMarksParams{
		TenantID:  middleware.GetTenantID(r.Context()),
		ExamID:    examID,
		SubjectID: subjectID,
		Entries:   req.Entries,
		UserID:    middleware.GetUserID(r.Context()),
		RequestID: middleware.GetReqID(r.Context()),
		IP:        r.RemoteAddr,
	})
	if err != nil {
		if strings.Contains(err.Error(), "locked") {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) AddSubject(w http.ResponseWriter, r *http.Request) {
	examID := strings.TrimSpace(chi.URLParam(r, "id"))
	if examID == "" {
		http.Error(w, "exam id is required", http.StatusBadRequest)
		return
	}

	var req struct {
		SubjectID string `json:"subject_id"`
		MaxMarks  int32  `json:"max_marks"`
		ExamDate  string `json:"exam_date"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	subjectID := strings.TrimSpace(req.SubjectID)
	if subjectID == "" {
		http.Error(w, "subject_id is required", http.StatusBadRequest)
		return
	}
	if req.MaxMarks <= 0 {
		http.Error(w, "max_marks must be greater than 0", http.StatusBadRequest)
		return
	}

	var examDate pgtype.Date
	if strings.TrimSpace(req.ExamDate) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(req.ExamDate))
		if err != nil {
			http.Error(w, "invalid exam_date format, expected YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		examDate = pgtype.Date{Time: parsed, Valid: true}
	}

	err := h.svc.AddSubject(
		r.Context(),
		middleware.GetTenantID(r.Context()),
		examID,
		subjectID,
		req.MaxMarks,
		examDate,
		middleware.GetUserID(r.Context()),
		middleware.GetReqID(r.Context()),
		r.RemoteAddr,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) Publish(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	exam, err := h.svc.PublishExam(r.Context(), middleware.GetTenantID(r.Context()), id,
		middleware.GetUserID(r.Context()), middleware.GetReqID(r.Context()), r.RemoteAddr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(exam)
}

func (h *Handler) GetResultsForStudent(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "id")
	results, err := h.svc.GetExamResultsForStudent(r.Context(), middleware.GetTenantID(r.Context()), studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(results)
}

func (h *Handler) UpsertScale(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Min   float64 `json:"min_percent"`
		Max   float64 `json:"max_percent"`
		Label string  `json:"grade_label"`
		Point float64 `json:"grade_point"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Label) == "" {
		http.Error(w, "grade_label is required", http.StatusBadRequest)
		return
	}

	err := h.svc.UpsertGradingScale(r.Context(), middleware.GetTenantID(r.Context()), req.Min, req.Max, req.Label, req.Point)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) UpsertWeight(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AYID       string  `json:"academic_year_id"`
		Type       string  `json:"exam_type"`
		Percentage float64 `json:"weight_percentage"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.AYID) == "" || strings.TrimSpace(req.Type) == "" {
		http.Error(w, "academic_year_id and exam_type are required", http.StatusBadRequest)
		return
	}

	err := h.svc.UpsertWeightageConfig(r.Context(), middleware.GetTenantID(r.Context()), req.AYID, req.Type, req.Percentage)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) CalculateAggregates(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AYID string `json:"academic_year_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	err := h.svc.CalculateAggregates(r.Context(), middleware.GetTenantID(r.Context()), req.AYID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
func (h *Handler) CreatePaper(w http.ResponseWriter, r *http.Request) {
    var req struct {
        ExamID         *string `json:"exam_id"`
        SubjectID      *string `json:"subject_id"`
        SetName        string  `json:"set_name"`
        FilePath       string  `json:"file_path"`
        IsEncrypted    bool    `json:"is_encrypted"`
        UnlockAt       *string `json:"unlock_at"`
        IsPreviousYear bool    `json:"is_previous_year"`
        AYID           string  `json:"academic_year_id"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request", http.StatusBadRequest)
        return
    }

    var unlockAt pgtype.Timestamptz
    if req.UnlockAt != nil {
        parsed, err := time.Parse(time.RFC3339, *req.UnlockAt)
        if err != nil {
            http.Error(w, "invalid unlock_at format, expected RFC3339", http.StatusBadRequest)
            return
        }
        unlockAt = pgtype.Timestamptz{Time: parsed, Valid: true}
    }

    paper, err := h.svc.CreateQuestionPaper(r.Context(), examservice.CreateQuestionPaperParams{
        TenantID:       middleware.GetTenantID(r.Context()),
        ExamID:         req.ExamID,
        SubjectID:      req.SubjectID,
        SetName:        req.SetName,
        FilePath:       req.FilePath,
        IsEncrypted:    req.IsEncrypted,
        UnlockAt:       &unlockAt,
        IsPreviousYear: req.IsPreviousYear,
        AYID:           req.AYID,
        UserID:         middleware.GetUserID(r.Context()),
        RequestID:      middleware.GetReqID(r.Context()),
        IP:             r.RemoteAddr,
    })
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(paper)
}

func (h *Handler) ListPapers(w http.ResponseWriter, r *http.Request) {
    examID := r.URL.Query().Get("exam_id")
    var eID *string
    if examID != "" { eID = &examID }

    papers, err := h.svc.ListQuestionPapers(r.Context(), middleware.GetTenantID(r.Context()), eID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(papers)
}

func (h *Handler) GetPaper(w http.ResponseWriter, r *http.Request) {
    paperID := chi.URLParam(r, "id")
    paper, err := h.svc.GetPaperWithAudit(r.Context(), middleware.GetTenantID(r.Context()), paperID,
        middleware.GetUserID(r.Context()), r.RemoteAddr, r.UserAgent())
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(paper)
}

// ==================== Question Bank Handlers ====================

func (h *Handler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SubjectID     string  `json:"subject_id"`
		Topic         string  `json:"topic"`
		Difficulty    string  `json:"difficulty"`
		Type          string  `json:"question_type"`
		Text          string  `json:"question_text"`
		Options       []byte  `json:"options"` // JSON array
		CorrectAnswer string  `json:"correct_answer"`
		Marks         float64 `json:"marks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	q, err := h.svc.CreateQuestion(r.Context(), examservice.CreateQuestionParams{
		TenantID:      middleware.GetTenantID(r.Context()),
		SubjectID:     req.SubjectID,
		Topic:         req.Topic,
		Difficulty:    req.Difficulty,
		Type:          req.Type,
		Text:          req.Text,
		Options:       req.Options,
		CorrectAnswer: req.CorrectAnswer,
		Marks:         req.Marks,
		UserID:        middleware.GetUserID(r.Context()),
		RequestID:     middleware.GetReqID(r.Context()),
		IP:            r.RemoteAddr,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(q)
}

func (h *Handler) ListQuestions(w http.ResponseWriter, r *http.Request) {
	subjectID := r.URL.Query().Get("subject_id")
	topic := r.URL.Query().Get("topic")

	var sID *string
	if subjectID != "" {
		sID = &subjectID
	}
	var t *string
	if topic != "" {
		t = &topic
	}

	questions, err := h.svc.ListQuestions(r.Context(), middleware.GetTenantID(r.Context()), sID, t)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(questions)
}

func (h *Handler) GeneratePaper(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ExamID     *string                        `json:"exam_id"`
		SubjectID  string                         `json:"subject_id"`
		AYID       string                         `json:"academic_year_id"`
		SetName    string                         `json:"set_name"`
		Blueprints []examservice.QuestionBlueprint `json:"blueprints"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	paper, err := h.svc.GenerateQuestionPaper(r.Context(), examservice.GeneratePaperParams{
		TenantID:   middleware.GetTenantID(r.Context()),
		ExamID:     req.ExamID,
		SubjectID:  req.SubjectID,
		AYID:       req.AYID,
		SetName:    req.SetName,
		Blueprints: req.Blueprints,
		UserID:     middleware.GetUserID(r.Context()),
		RequestID:  middleware.GetReqID(r.Context()),
		IP:         r.RemoteAddr,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(paper)
}
