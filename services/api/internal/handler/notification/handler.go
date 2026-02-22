package notification

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	notifsvc "github.com/schoolerp/api/internal/service/notification"
)

type Handler struct {
	svc *notifsvc.Service
}

func NewHandler(svc *notifsvc.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/notifications/logs", h.ListLogs)
	r.Get("/notifications/stats", h.GetStats)

	// Templates
	r.Post("/notifications/templates", h.CreateTemplate)
	r.Get("/notifications/templates", h.ListTemplates)
	r.Get("/notifications/templates/{id}", h.GetTemplate)
	r.Put("/notifications/templates/{id}", h.UpdateTemplate)
	r.Delete("/notifications/templates/{id}", h.DeleteTemplate)

	// Gateways
	r.Get("/notifications/gateways", h.ListGatewayConfigs)
	r.Get("/notifications/gateways/active", h.GetActiveGatewayConfig)
	r.Post("/notifications/gateways", h.UpdateGatewayConfig)
}

func (h *Handler) ListLogs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit == 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(q.Get("offset"))

	params := notifsvc.ListLogsParams{
		TenantID:  middleware.GetTenantID(r.Context()),
		Status:    q.Get("status"),
		EventType: q.Get("type"),
		Limit:     int32(limit),
		Offset:    int32(offset),
	}

	if from := q.Get("from"); from != "" {
		params.From, _ = time.Parse(time.RFC3339, from)
	}
	if to := q.Get("to"); to != "" {
		params.To, _ = time.Parse(time.RFC3339, to)
	}

	logs, err := h.svc.ListFilteredLogs(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	
	// Default to last 24h for "today" stats
	since := time.Now().Add(-24 * time.Hour)
	
	usage, _ := h.svc.GetUsageStats(r.Context(), tenantID, since)
	outbox, _ := h.svc.GetOutboxStats(r.Context(), tenantID, since)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"usage":  usage,
		"outbox": outbox,
	})
}

func (h *Handler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	var req notifsvc.CreateTemplateParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	req.TenantID = middleware.GetTenantID(r.Context())

	template, err := h.svc.CreateTemplate(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(template)
}

func (h *Handler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	templates, err := h.svc.ListTemplates(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

func (h *Handler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tenantID := middleware.GetTenantID(r.Context())

	template, err := h.svc.GetTemplate(r.Context(), tenantID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

type updateTemplateReq struct {
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func (h *Handler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tenantID := middleware.GetTenantID(r.Context())

	var req updateTemplateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	template, err := h.svc.UpdateTemplate(r.Context(), tenantID, id, req.Subject, req.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

func (h *Handler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tenantID := middleware.GetTenantID(r.Context())

	if err := h.svc.DeleteTemplate(r.Context(), tenantID, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListGatewayConfigs(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	configs, err := h.svc.ListGatewayConfigs(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(configs)
}

func (h *Handler) GetActiveGatewayConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	config, err := h.svc.GetActiveGatewayConfig(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

type updateGatewayReq struct {
	Provider  string          `json:"provider"`
	ApiKey    string          `json:"api_key"`
	ApiSecret string          `json:"api_secret"`
	SenderID  string          `json:"sender_id"`
	IsActive  bool            `json:"is_active"`
	Settings  json.RawMessage `json:"settings"`
}

func (h *Handler) UpdateGatewayConfig(w http.ResponseWriter, r *http.Request) {
	var req updateGatewayReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	tenantID := middleware.GetTenantID(r.Context())
	config, err := h.svc.CreateOrUpdateGatewayConfig(r.Context(), tenantID, req.Provider, req.ApiKey, req.ApiSecret, req.SenderID, req.IsActive, []byte(req.Settings))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}
