package safety

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	safetyservice "github.com/schoolerp/api/internal/service/safety"
)

type Handler struct {
	svc *safetyservice.Service
}

func NewHandler(svc *safetyservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/safety", func(r chi.Router) {
		r.Post("/incidents", h.CreateIncident)
		r.Get("/incidents", h.ListIncidents)
		r.Post("/visitors/check-in", h.VisitorCheckIn)
		r.Post("/visitors/check-out/{id}", h.VisitorCheckOut)
		r.Get("/visitors/logs", h.ListVisitorLogs)
		r.Post("/broadcasts", h.SendBroadcast)
		r.Get("/broadcasts", h.ListBroadcasts)
		r.Get("/pickups/{student_id}", h.ListPickupAuths)
		r.Post("/pickups", h.CreatePickupAuth)
	})
}

func (h *Handler) CreateIncident(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	reporterID := middleware.GetUserID(r.Context())

	var req struct {
		StudentID        string    `json:"student_id"`
		IncidentDate     time.Time `json:"incident_date"`
		Category         string    `json:"category"`
		Title            string    `json:"title"`
		Description      string    `json:"description"`
		ActionTaken      string    `json:"action_taken"`
		ParentVisibility bool      `json:"parent_visibility"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.StudentID) == "" || strings.TrimSpace(req.Category) == "" || strings.TrimSpace(req.Title) == "" {
		http.Error(w, "student_id, category, and title are required", http.StatusBadRequest)
		return
	}

	incident, err := h.svc.CreateIncident(r.Context(), safetyservice.CreateIncidentParams{
		TenantID:         tenantID,
		StudentID:        req.StudentID,
		ReporterID:       reporterID,
		IncidentDate:     req.IncidentDate,
		Category:         req.Category,
		Title:            req.Title,
		Description:      req.Description,
		ActionTaken:      req.ActionTaken,
		ParentVisibility: req.ParentVisibility,
	})
	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "required") || strings.Contains(errMsg, "invalid") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(incident)
}

func (h *Handler) ListIncidents(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 { limit = 50 }

	incidents, err := h.svc.ListIncidents(r.Context(), tenantID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incidents)
}

func (h *Handler) VisitorCheckIn(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req safetyservice.VisitorCheckInParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.FullName) == "" || strings.TrimSpace(req.Phone) == "" || strings.TrimSpace(req.Purpose) == "" {
		http.Error(w, "full_name, phone, and purpose are required", http.StatusBadRequest)
		return
	}
	req.TenantID = tenantID

	log, err := h.svc.VisitorCheckIn(r.Context(), req)
	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "required") || strings.Contains(errMsg, "invalid") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(log)
}

func (h *Handler) VisitorCheckOut(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	logID := chi.URLParam(r, "id")

	var req struct {
		Remarks string `json:"remarks"`
	}
	if r.Body != nil {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err.Error() != "EOF" {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
	}

	log, err := h.svc.VisitorCheckOut(r.Context(), tenantID, logID, req.Remarks)
	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "invalid") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if strings.Contains(errMsg, "no rows") || strings.Contains(errMsg, "not found") {
			http.Error(w, "visitor log not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(log)
}

func (h *Handler) ListVisitorLogs(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 { limit = 50 }

	logs, err := h.svc.ListVisitorLogs(r.Context(), tenantID, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *Handler) CreatePickupAuth(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req safetyservice.CreatePickupAuthParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.StudentID) == "" || strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Phone) == "" {
		http.Error(w, "student_id, name, and phone are required", http.StatusBadRequest)
		return
	}
	req.TenantID = tenantID

	auth, err := h.svc.CreatePickupAuth(r.Context(), req)
	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "required") || strings.Contains(errMsg, "invalid") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(auth)
}

func (h *Handler) ListPickupAuths(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	studentID := chi.URLParam(r, "student_id")

	auths, err := h.svc.ListPickupAuths(r.Context(), tenantID, studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(auths)
}

func (h *Handler) SendBroadcast(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req struct {
		Message     string   `json:"message"`
		Channel     string   `json:"channel"`
		TargetRoles []string `json:"target_roles"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Message) == "" {
		http.Error(w, "message is required", http.StatusBadRequest)
		return
	}
	if len(req.TargetRoles) == 0 {
		http.Error(w, "target_roles is required", http.StatusBadRequest)
		return
	}

	broadcast, err := h.svc.SendBroadcast(r.Context(), safetyservice.SendBroadcastParams{
		TenantID:    tenantID,
		CreatorID:   userID,
		Message:     req.Message,
		Channel:     req.Channel,
		TargetRoles: req.TargetRoles,
	})
	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "required") || strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "channel") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(broadcast)
}

func (h *Handler) ListBroadcasts(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 {
		limit = 50
	}

	broadcasts, err := h.svc.ListBroadcasts(r.Context(), tenantID, int32(limit), int32(offset))
	if err != nil {
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "invalid") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(broadcasts)
}
