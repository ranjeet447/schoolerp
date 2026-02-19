package sis

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/sis"
)

type IDCardHandler struct {
	svc *sis.IDCardService
}

func NewIDCardHandler(svc *sis.IDCardService) *IDCardHandler {
	return &IDCardHandler{svc: svc}
}

func (h *IDCardHandler) RegisterRoutes(r chi.Router) {
	r.Route("/id-cards", func(r chi.Router) {
		r.Get("/templates", h.ListTemplates)
		r.Post("/templates", h.CreateTemplate)
		r.Delete("/templates/{id}", h.DeleteTemplate)
	})
}

func (h *IDCardHandler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	var t sis.IDCardTemplate
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	template, err := h.svc.CreateTemplate(r.Context(), tenantID, t, userID, reqID, ip)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(template)
}

func (h *IDCardHandler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	templates, err := h.svc.ListTemplates(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

func (h *IDCardHandler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id := chi.URLParam(r, "id")
	userID := middleware.GetUserID(r.Context())
	reqID := middleware.GetReqID(r.Context())
	ip := r.RemoteAddr

	if err := h.svc.DeleteTemplate(r.Context(), tenantID, id, userID, reqID, ip); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
