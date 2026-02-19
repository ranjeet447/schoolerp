package academics

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/academics"
)

type CalendarHandler struct {
	svc *academics.CalendarService
}

func NewCalendarHandler(svc *academics.CalendarService) *CalendarHandler {
	return &CalendarHandler{svc: svc}
}

func (h *CalendarHandler) RegisterRoutes(r chi.Router) {
	r.Route("/calendar", func(r chi.Router) {
		r.Get("/events", h.ListEvents)
		r.Post("/events", h.CreateEvent)
		r.Put("/events/{id}", h.UpdateEvent)
		r.Delete("/events/{id}", h.DeleteEvent)
	})
}

func (h *CalendarHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	var e academics.Event
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := h.svc.CreateEvent(r.Context(), tenantID, e, userID, reqID, ip)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}

func (h *CalendarHandler) ListEvents(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")

	start, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		// Default to current month if missing
		now := time.Now()
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	}
	end, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		end = start.AddDate(0, 1, 0)
	}

	events, err := h.svc.ListEvents(r.Context(), tenantID, start, end)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

func (h *CalendarHandler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	var e academics.Event
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := h.svc.UpdateEvent(r.Context(), tenantID, id, e, userID, reqID, ip)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}

func (h *CalendarHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	if err := h.svc.DeleteEvent(r.Context(), tenantID, id, userID, reqID, ip); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
