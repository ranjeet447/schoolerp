package dashboard

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	dashservice "github.com/schoolerp/api/internal/service/dashboard"
)

type Handler struct {
	svc *dashservice.DashboardService
}

func NewHandler(svc *dashservice.DashboardService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/dashboard", func(r chi.Router) {
		r.Get("/command-status", h.GetDailyCommandStatus)
		r.Get("/strategic-analytics", h.GetStrategicAnalytics)
	})
}

func (h *Handler) GetDailyCommandStatus(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	
	status, err := h.svc.GetDailyCommandStatus(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(status)
}

func (h *Handler) GetStrategicAnalytics(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	
	analytics, err := h.svc.GetStrategicAnalytics(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(analytics)
}
