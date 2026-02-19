package academics

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
)

func (h *Handler) RegisterHolidayRoutes(r chi.Router) {
	r.Route("/holidays", func(r chi.Router) {
		r.Get("/", h.ListHolidays)
		r.Post("/", h.CreateHoliday)
		r.Delete("/{id}", h.DeleteHoliday)
	})
}

func (h *Handler) ListHolidays(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")

	holidays, err := h.svc.ListHolidays(ctx, tenantID, start, end)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(holidays)
}

func (h *Handler) CreateHoliday(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	var req struct {
		Name string `json:"name"`
		Date string `json:"date"`
		Type string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	holiday, err := h.svc.CreateHoliday(ctx, tenantID, req.Name, req.Date, req.Type)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(holiday)
}

func (h *Handler) DeleteHoliday(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteHoliday(ctx, tenantID, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
