package exams

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
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
		r.Get("/{id}/subjects", h.ListSubjects)
		r.Get("/{id}/subjects/{subjectId}/marks", h.GetMarks)
		r.Post("/{id}/subjects/{subjectId}/marks", h.UpsertMarks)
		r.Post("/{id}/publish", h.Publish)
	})
}

func (h *Handler) RegisterParentRoutes(r chi.Router) {
	r.Get("/children/{id}/exams/results", h.GetResultsForStudent)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
		AYID string `json:"academic_year_id"`
		// Start/End dates can be added here
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	exam, err := h.svc.CreateExam(r.Context(), examservice.CreateExamParams{
		TenantID: middleware.GetTenantID(r.Context()),
		AYID:     req.AYID,
		Name:     req.Name,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

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
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) Publish(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	exam, err := h.svc.PublishExam(r.Context(), middleware.GetTenantID(r.Context()), id)
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
