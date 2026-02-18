package attendance

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"
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
		r.Get("/class-sections", h.ListClassSections)
		r.Get("/stats", h.GetDailyStats)
		r.Post("/mark", h.MarkAttendance)
		r.Get("/policies", h.ListPolicies)
		r.Post("/policies", h.UpdatePolicy)
		r.Get("/locks/emergency", h.GetEmergencyLockStatus)
		r.Post("/locks/emergency", h.EnableEmergencyLock)
		r.Delete("/locks/emergency", h.DisableEmergencyLock)
	})
	r.Route("/leaves", func(r chi.Router) {
		r.Get("/", h.ListLeaves)
		r.Post("/{id}/approve", h.ApproveLeave)
		r.Post("/{id}/reject", h.RejectLeave)
	})
}

func (h *Handler) RegisterParentRoutes(r chi.Router) {
	r.Get("/leaves", h.ListParentLeaves)
	r.Post("/leaves", h.CreateLeave)
}

func (h *Handler) MarkAttendance(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ClassSectionID string                          `json:"class_section_id"`
		Date           string                          `json:"date"`
		OverrideReason string                          `json:"override_reason"`
		Entries        []attendservice.AttendanceEntry `json:"entries"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.ClassSectionID) == "" {
		http.Error(w, "class_section_id is required", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Date) == "" {
		http.Error(w, "date is required", http.StatusBadRequest)
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		http.Error(w, "invalid date format, expected YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	p := attendservice.MarkAttendanceParams{
		TenantID:       middleware.GetTenantID(r.Context()),
		ClassSectionID: req.ClassSectionID,
		Date:           date,
		Entries:        req.Entries,
		OverrideReason: req.OverrideReason,
		UserID:         middleware.GetUserID(r.Context()),
		Role:           middleware.GetRole(r.Context()),
		RequestID:      middleware.GetReqID(r.Context()),
		IP:             r.RemoteAddr,
	}

	if err := h.svc.MarkAttendance(r.Context(), p); err != nil {
		if attendservice.IsApprovalRequiredError(err) {
			http.Error(w, err.Error(), http.StatusAccepted)
			return
		}
		if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "invalid") || strings.Contains(err.Error(), "denied") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
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

func (h *Handler) ListClassSections(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	items, err := h.svc.ListClassSections(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sort.SliceStable(items, func(i, j int) bool {
		return items[i].Label < items[j].Label
	})

	json.NewEncoder(w).Encode(items)
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

func (h *Handler) ListParentLeaves(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	studentID := r.URL.Query().Get("student_id")
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	leaves, err := h.svc.ListLeavesForParent(r.Context(), tenantID, userID, status, studentID)
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

func (h *Handler) ListPolicies(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	policies, err := h.svc.ListPolicies(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(policies)
}

func (h *Handler) UpdatePolicy(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "tenant_admin" && role != "super_admin" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	var req struct {
		Module   string          `json:"module"`
		Action   string          `json:"action"`
		Logic    json.RawMessage `json:"logic"`
		IsActive bool            `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Module) == "" || strings.TrimSpace(req.Action) == "" {
		http.Error(w, "module and action are required", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	policy, err := h.svc.UpdatePolicy(r.Context(), tenantID, req.Module, req.Action, req.Logic, req.IsActive)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(policy)
}

func (h *Handler) GetEmergencyLockStatus(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	locked, err := h.svc.GetEmergencyLockStatus(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]bool{"locked": locked})
}

func (h *Handler) EnableEmergencyLock(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "tenant_admin" && role != "super_admin" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err.Error() != "EOF" {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		reason = "Emergency attendance lock"
	}

	if err := h.svc.EnableEmergencyLock(r.Context(), tenantID, userID, reason); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"status": "locked"})
}

func (h *Handler) DisableEmergencyLock(w http.ResponseWriter, r *http.Request) {
	role := middleware.GetRole(r.Context())
	if role != "tenant_admin" && role != "super_admin" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	if err := h.svc.DisableEmergencyLock(r.Context(), tenantID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"status": "unlocked"})
}

func (h *Handler) GetDailyStats(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	dateStr := r.URL.Query().Get("date")

	var targetDate time.Time
	var err error
	if dateStr == "" {
		targetDate = time.Now()
	} else {
		targetDate, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			http.Error(w, "invalid date format, expected YYYY-MM-DD", http.StatusBadRequest)
			return
		}
	}

	stats, err := h.svc.GetDailyStats(r.Context(), tenantID, targetDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(stats)
}
