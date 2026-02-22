package sis

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	sisservice "github.com/schoolerp/api/internal/service/sis"
)

type Student360Handler struct {
	svc *sisservice.Student360Service
}

func NewStudent360Handler(svc *sisservice.Student360Service) *Student360Handler {
	return &Student360Handler{svc: svc}
}

func (h *Student360Handler) RegisterRoutes(r chi.Router) {
	r.Route("/students/{studentID}/360", func(r chi.Router) {
		r.Get("/", h.GetStudent360)
		r.Get("/behavior", h.ListBehavioralLogs)
		r.Post("/behavior", h.AddBehavioralLog)
		r.Get("/health", h.GetHealthRecord)
		r.Post("/health", h.UpsertHealthRecord)
		r.Get("/documents", h.ListDocuments)
		r.Post("/documents", h.UploadDocument)
		r.With(middleware.RateLimitByKey("student_360_export", 10, time.Hour, nil)).Get("/export", h.ExportPortfolioPDF)
	})
}

func (h *Student360Handler) GetStudent360(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentID")
	tenantID := middleware.GetTenantID(r.Context())

	data, err := h.svc.GetStudent360(r.Context(), tenantID, studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(data)
}

func (h *Student360Handler) ListBehavioralLogs(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentID")
	logs, err := h.svc.ListBehavioralLogs(r.Context(), studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(logs)
}

func (h *Student360Handler) AddBehavioralLog(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentID")
	var req sisservice.BehavioralLog
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.StudentID = studentID
	req.LoggedBy = middleware.GetUserID(r.Context())
	if req.IncidentDate.IsZero() {
		req.IncidentDate = time.Now()
	}

	id, err := h.svc.AddBehavioralLog(r.Context(), middleware.GetTenantID(r.Context()), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func (h *Student360Handler) GetHealthRecord(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentID")
	record, err := h.svc.GetHealthRecord(r.Context(), studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(record)
}

func (h *Student360Handler) UpsertHealthRecord(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentID")
	var req sisservice.HealthRecord
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.StudentID = studentID

	err := h.svc.UpsertHealthRecord(r.Context(), middleware.GetTenantID(r.Context()), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Student360Handler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentID")
	docs, err := h.svc.ListDocuments(r.Context(), studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(docs)
}

func (h *Student360Handler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentID")
	var req sisservice.StudentDocument
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	req.StudentID = studentID

	id, err := h.svc.UploadDocument(r.Context(), middleware.GetTenantID(r.Context()), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"id": id})
}
func (h *Student360Handler) ExportPortfolioPDF(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "studentID")
	tenantID := middleware.GetTenantID(r.Context())

	pdfBytes, err := h.svc.GetStudentPortfolioPDF(r.Context(), tenantID, studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=portfolio_%s.pdf", studentID))
	w.Write(pdfBytes)
}
