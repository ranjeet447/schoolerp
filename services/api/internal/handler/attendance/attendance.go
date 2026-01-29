package attendance

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	attendservice "github.com/schoolerp/api/internal/service/attendance"
)

type Handler struct {
	svc *attendservice.Service
}

func NewHandler(svc *attendservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/attendance", func(r chi.Router) {
		r.Get("/sessions", h.GetSession)
		r.Post("/mark", h.MarkAttendance)
	})
	r.Route("/leaves", func(r chi.Router) {
		r.Get("/", h.ListLeaves)
		r.Post("/{id}/approve", h.ApproveLeave)
		r.Post("/{id}/reject", h.RejectLeave)
	})
}

func (h *Handler) RegisterParentRoutes(r chi.Router) {
	r.Post("/leaves", h.CreateLeave)
}

func (h *Handler) MarkAttendance(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ClassSectionID string                         `json:"class_section_id"`
		Date           string                         `json:"date"`
		Entries        []attendservice.AttendanceEntry `json:"entries"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	date, _ := time.Parse("2006-01-02", req.Date)
	
	p := attendservice.MarkAttendanceParams{
		TenantID:       middleware.GetTenantID(r.Context()),
		ClassSectionID: req.ClassSectionID,
		Date:           date,
		Entries:        req.Entries,
		UserID:         middleware.GetUserID(r.Context()),
		RequestID:      middleware.GetReqID(r.Context()),
		IP:             r.RemoteAddr,
	}

	if err := h.svc.MarkAttendance(r.Context(), p); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) GetSession(w http.ResponseWriter, r *http.Request) {
	classSectionID := r.URL.Query().Get("class_section_id")
	dateStr := r.URL.Query().Get("date")
	
	date, _ := time.Parse("2006-01-02", dateStr)
	tenantID := middleware.GetTenantID(r.Context())

	session, entries, err := h.svc.GetSession(r.Context(), tenantID, classSectionID, date)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"session": session,
		"entries": entries,
	})
}

func (h *Handler) CreateLeave(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID string `json:"student_id"`
		From      string `json:"from_date"`
		To        string `json:"to_date"`
		Reason    string `json:"reason"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	from, _ := time.Parse("2006-01-02", req.From)
	to, _ := time.Parse("2006-01-02", req.To)
	tenantID := middleware.GetTenantID(r.Context())

	leave, err := h.svc.CreateLeaveRequest(r.Context(), tenantID, req.StudentID, from, to, req.Reason)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(leave)
}

func (h *Handler) ListLeaves(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	tenantID := middleware.GetTenantID(r.Context())

	leaves, err := h.svc.ListLeaves(r.Context(), tenantID, status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(leaves)
}

func (h *Handler) ApproveLeave(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	leave, err := h.svc.ProcessLeave(r.Context(), tenantID, id, "approved", userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(leave)
}

func (h *Handler) RejectLeave(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	leave, err := h.svc.ProcessLeave(r.Context(), tenantID, id, "rejected", userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(leave)
}
