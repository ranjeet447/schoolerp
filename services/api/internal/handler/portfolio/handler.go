package portfolio

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	portfolioservice "github.com/schoolerp/api/internal/service/portfolio"
)

type Handler struct {
	svc *portfolioservice.Service
}

func NewHandler(svc *portfolioservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/portfolio", func(r chi.Router) {
		r.Get("/groups", h.ListGroups)
		r.Post("/groups", h.CreateGroup)
		r.Get("/groups/{id}/members", h.ListGroupMembers)
		r.Post("/groups/{id}/members", h.AddGroupMember)
		r.Get("/groups/{id}/analytics", h.GetGroupAnalytics)
	})
}

func (h *Handler) ListGroups(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	groups, err := h.svc.ListSchoolGroups(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

func (h *Handler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	group, err := h.svc.CreateSchoolGroup(r.Context(), portfolioservice.CreateGroupParams{
		Name:        req.Name,
		Description: req.Description,
		OwnerUserID: userID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(group)
}

func (h *Handler) ListGroupMembers(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")

	members, err := h.svc.ListGroupMembers(r.Context(), groupID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(members)
}

func (h *Handler) AddGroupMember(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")

	var req struct {
		TenantID string `json:"tenant_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.AddGroupMember(r.Context(), groupID, req.TenantID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "added"})
}

func (h *Handler) GetGroupAnalytics(w http.ResponseWriter, r *http.Request) {
	groupID := chi.URLParam(r, "id")

	analytics, err := h.svc.GetGroupAnalytics(r.Context(), groupID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analytics)
}
