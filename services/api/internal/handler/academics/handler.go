package academics

import (
	"encoding/json"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/middleware"
	academicservice "github.com/schoolerp/api/internal/service/academics"
)

type Handler struct {
	svc *academicservice.Service
}

func NewHandler(svc *academicservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/certificates", func(r chi.Router) {
		r.Get("/requests", h.ListCertificateRequests)
		r.Post("/requests", h.CreateCertificateRequest)
		r.Post("/requests/{id}/status", h.UpdateCertificateRequestStatus)
	})

	r.Route("/timetable", func(r chi.Router) {
		r.Get("/", h.GetTimetable)
		r.Put("/", h.SaveTimetable)
	})

	r.Route("/homework", func(r chi.Router) {
		r.Get("/options", h.ListHomeworkOptions)
		r.Post("/", h.CreateHomework)
		r.Get("/section/{sectionId}", h.ListHomeworkForSection)
		r.Get("/{id}/submissions", h.ListSubmissions)
		r.Post("/submissions/{id}/grade", h.GradeSubmission)
	})
	r.Route("/lesson-plans", func(r chi.Router) {
		r.Post("/", h.UpsertLessonPlan)
		r.Get("/", h.ListLessonPlans)
		r.Get("/lag", h.GetSyllabusLag)
		r.Patch("/{id}/status", h.UpdateLessonPlanStatus)
	})
	r.Route("/subjects", func(r chi.Router) {
		r.Get("/", h.ListSubjects)
	})
	r.Get("/calendar", h.GetAcademicCalendar)

	h.RegisterHolidayRoutes(r)
}

func (h *Handler) RegisterStudentRoutes(r chi.Router) {
	r.Route("/homework", func(r chi.Router) {
		r.Get("/", h.GetHomeworkForStudent)
		r.Post("/{id}/submit", h.SubmitHomework)
	})
}

func (h *Handler) ListHomeworkOptions(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	teacherID := r.URL.Query().Get("teacher_id")

	var tIDPtr *string
	if teacherID != "" {
		tIDPtr = &teacherID
	}

	options, err := h.svc.ListHomeworkOptions(r.Context(), tenantID, tIDPtr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sort.SliceStable(options.ClassSections, func(i, j int) bool {
		return options.ClassSections[i].Label < options.ClassSections[j].Label
	})
	sort.SliceStable(options.Subjects, func(i, j int) bool {
		return options.Subjects[i].Name < options.Subjects[j].Name
	})

	json.NewEncoder(w).Encode(options)
}

func (h *Handler) ListCertificateRequests(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	list, err := h.svc.ListCertificateRequests(r.Context(), middleware.GetTenantID(r.Context()), status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) CreateCertificateRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID   string                         `json:"student_id"`
		Type        academicservice.CertificateType `json:"type"`
		Reason      string                         `json:"reason"`
		RequestedOn string                         `json:"requested_on"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	item, err := h.svc.CreateCertificateRequest(r.Context(), academicservice.CreateCertificateRequestParams{
		TenantID:    middleware.GetTenantID(r.Context()),
		StudentID:   req.StudentID,
		Type:        req.Type,
		Reason:      req.Reason,
		RequestedOn: req.RequestedOn,
		UserID:      middleware.GetUserID(r.Context()),
		RequestID:   middleware.GetReqID(r.Context()),
		IP:          r.RemoteAddr,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(item)
}

func (h *Handler) UpdateCertificateRequestStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status  academicservice.CertificateStatus `json:"status"`
		Remarks string                           `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	updated, err := h.svc.UpdateCertificateRequestStatus(
		r.Context(),
		middleware.GetTenantID(r.Context()),
		id,
		req.Status,
		req.Remarks,
		middleware.GetUserID(r.Context()),
		middleware.GetReqID(r.Context()),
		r.RemoteAddr,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(updated)
}

func (h *Handler) GetTimetable(w http.ResponseWriter, r *http.Request) {
	entries, err := h.svc.GetTimetable(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"entries": entries,
	})
}

func (h *Handler) SaveTimetable(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Entries []academicservice.TimetableEntry `json:"entries"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.svc.SaveTimetable(
		r.Context(),
		middleware.GetTenantID(r.Context()),
		middleware.GetUserID(r.Context()),
		middleware.GetReqID(r.Context()),
		r.RemoteAddr,
		req.Entries,
	); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) CreateHomework(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SubjectID      string    `json:"subject_id"`
		ClassSectionID string    `json:"class_section_id"`
		Title          string    `json:"title"`
		Description    string    `json:"description"`
		DueDate        time.Time `json:"due_date"`
		Attachments    []byte    `json:"attachments"`
		ResourceID     string    `json:"resource_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	hw, err := h.svc.CreateHomework(r.Context(), academicservice.CreateHomeworkParams{
		TenantID:       middleware.GetTenantID(r.Context()),
		SubjectID:      req.SubjectID,
		ClassSectionID: req.ClassSectionID,
		TeacherID:      middleware.GetUserID(r.Context()),
		Title:          req.Title,
		Description:    req.Description,
		DueDate:        pgtype.Timestamptz{Time: req.DueDate, Valid: true},
		Attachments:    req.Attachments,
		ResourceID:     req.ResourceID,
		UserID:         middleware.GetUserID(r.Context()),
		RequestID:      middleware.GetReqID(r.Context()),
		IP:             r.RemoteAddr,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(hw)
}

func (h *Handler) ListHomeworkForSection(w http.ResponseWriter, r *http.Request) {
	sectionID := chi.URLParam(r, "sectionId")
	list, err := h.svc.ListHomeworkForSection(r.Context(), middleware.GetTenantID(r.Context()), sectionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) SubmitHomework(w http.ResponseWriter, r *http.Request) {
	hwID := chi.URLParam(r, "id")
	var req struct {
		StudentID     string `json:"student_id"`
		AttachmentURL string `json:"attachment_url"`
		Remarks       string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	sub, err := h.svc.SubmitHomework(r.Context(), hwID, req.StudentID, req.AttachmentURL, req.Remarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(sub)
}

func (h *Handler) GradeSubmission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status   string `json:"status"`
		Feedback string `json:"feedback"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	sub, err := h.svc.GradeSubmission(r.Context(), id, req.Status, req.Feedback)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(sub)
}

func (h *Handler) UpsertLessonPlan(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SubjectID string    `json:"subject_id"`
		ClassID   string    `json:"class_id"`
		Week      int32     `json:"week_number"`
		Topic     string    `json:"planned_topic"`
		CoveredAt time.Time `json:"covered_at"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	lp, err := h.svc.UpsertLessonPlan(r.Context(), middleware.GetTenantID(r.Context()), req.SubjectID, req.ClassID, req.Week, req.Topic, pgtype.Timestamptz{Time: req.CoveredAt, Valid: !req.CoveredAt.IsZero()})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(lp)
}

func (h *Handler) ListLessonPlans(w http.ResponseWriter, r *http.Request) {
	subjectID := r.URL.Query().Get("subject_id")
	classID := r.URL.Query().Get("class_id")
	list, err := h.svc.ListLessonPlans(r.Context(), middleware.GetTenantID(r.Context()), subjectID, classID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) GetHomeworkForStudent(w http.ResponseWriter, r *http.Request) {
	studentID := r.URL.Query().Get("student_id")
	list, err := h.svc.GetHomeworkForStudent(r.Context(), middleware.GetTenantID(r.Context()), studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) ListSubmissions(w http.ResponseWriter, r *http.Request) {
	hwID := chi.URLParam(r, "id")
	list, err := h.svc.ListSubmissions(r.Context(), hwID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}


func (h *Handler) ListSubjects(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.ListSubjects(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
}

func (h *Handler) GetSyllabusLag(w http.ResponseWriter, r *http.Request) {
	weekStr := r.URL.Query().Get("current_week")
	week, _ := strconv.Atoi(weekStr)
	if week == 0 {
		week = 1
	}
	lag, err := h.svc.GetSyllabusLag(r.Context(), middleware.GetTenantID(r.Context()), int32(week))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(lag)
}

func (h *Handler) UpdateLessonPlanStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status  string `json:"status"`
		Remarks string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	lp, err := h.svc.UpdateLessonPlanStatus(r.Context(), id, middleware.GetTenantID(r.Context()), req.Status, req.Remarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(lp)
}

func (h *Handler) GetAcademicCalendar(w http.ResponseWriter, r *http.Request) {
	calendar, err := h.svc.GetAcademicCalendar(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(calendar)
}
