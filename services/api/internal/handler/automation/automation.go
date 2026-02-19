package automation

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/automation"
)

type AutomationHandler struct {
	svc *automation.AutomationService
}

func NewAutomationHandler(svc *automation.AutomationService) *AutomationHandler {
	return &AutomationHandler{svc: svc}
}

func (h *AutomationHandler) RegisterRoutes(r chi.Router) {
	r.Route("/admin/automation", func(r chi.Router) {
		r.Get("/rules", h.ListRules)
		r.Post("/rules", h.CreateRule)
		r.Put("/rules/{id}", h.UpdateRule)
		r.Delete("/rules/{id}", h.DeleteRule)
	})
}

func (h *AutomationHandler) CreateRule(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)

	var rule automation.AutomationRule
	if err := json.NewDecoder(r.Body).Decode(&rule); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := h.svc.CreateRule(ctx, tenantID, rule, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (h *AutomationHandler) ListRules(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	rules, err := h.svc.ListRules(ctx, tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rules)
}

func (h *AutomationHandler) UpdateRule(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	id := chi.URLParam(r, "id")

	var rule automation.AutomationRule
	if err := json.NewDecoder(r.Body).Decode(&rule); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := h.svc.UpdateRule(ctx, tenantID, id, rule)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func (h *AutomationHandler) DeleteRule(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	id := chi.URLParam(r, "id")

	err := h.svc.DeleteRule(ctx, tenantID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
