package biometric

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	bioservice "github.com/schoolerp/api/internal/service/biometric"
)

type Handler struct {
	svc *bioservice.BiometricService
}

func NewHandler(svc *bioservice.BiometricService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/biometric", func(r chi.Router) {
		r.Post("/ingest", h.IngestLog)
		r.Get("/devices", h.ListDevices)
		r.Get("/logs", h.ListRecentLogs)
	})
}

func (h *Handler) IngestLog(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	
	var entry bioservice.LogEntry
	if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := h.svc.IngestLog(r.Context(), tenantID, entry)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"id": id, "status": "processed"})
}

func (h *Handler) ListDevices(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	devices, err := h.svc.ListDevices(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(devices)
}

func (h *Handler) ListRecentLogs(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	logs, err := h.svc.ListRecentLogs(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(logs)
}
