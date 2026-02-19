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
