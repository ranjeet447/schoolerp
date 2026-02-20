package kb

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	kbservice "github.com/schoolerp/api/internal/service/kb"
)

type Handler struct {
	svc *kbservice.Service
}

func NewHandler(svc *kbservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterAdminRoutes(r chi.Router) {
	r.Route("/kb", func(r chi.Router) {
		r.Post("/documents", h.CreateDocument)
		r.Get("/documents", h.ListDocuments)
		r.Get("/documents/{id}", h.GetDocument)
		r.Patch("/documents/{id}", h.UpdateDocument)
		r.Delete("/documents/{id}", h.DeleteDocument)
		r.Get("/settings", h.GetSettings)
		r.Patch("/settings", h.UpdateSettings)
	})
}

func (h *Handler) RegisterSearchRoutes(r chi.Router) {
	r.Get("/kb/facets", h.ListFacets)
	r.Post("/kb/search", h.Search)
}

func (h *Handler) CreateDocument(w http.ResponseWriter, r *http.Request) {
	var req kbservice.DocumentUpsertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	doc, err := h.svc.CreateDocument(r.Context(), middleware.GetTenantID(r.Context()), middleware.GetUserID(r.Context()), req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(doc)
}

func (h *Handler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.ParseInt(strings.TrimSpace(r.URL.Query().Get("limit")), 10, 32)
	offset, _ := strconv.ParseInt(strings.TrimSpace(r.URL.Query().Get("offset")), 10, 32)

	docs, err := h.svc.ListDocuments(r.Context(), middleware.GetTenantID(r.Context()), kbservice.DocumentListFilters{
		Status:     strings.TrimSpace(r.URL.Query().Get("status")),
		Visibility: strings.TrimSpace(r.URL.Query().Get("visibility")),
		Category:   strings.TrimSpace(r.URL.Query().Get("category")),
		Search:     strings.TrimSpace(r.URL.Query().Get("q")),
		Limit:      int32(limit),
		Offset:     int32(offset),
	})
	if err != nil {
		h.writeError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(docs)
}

func (h *Handler) GetDocument(w http.ResponseWriter, r *http.Request) {
	doc, err := h.svc.GetDocument(r.Context(), middleware.GetTenantID(r.Context()), chi.URLParam(r, "id"))
	if err != nil {
		h.writeError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(doc)
}

func (h *Handler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	var req kbservice.DocumentPatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	doc, err := h.svc.UpdateDocument(
		r.Context(),
		middleware.GetTenantID(r.Context()),
		chi.URLParam(r, "id"),
		middleware.GetUserID(r.Context()),
		req,
	)
	if err != nil {
		h.writeError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(doc)
}

func (h *Handler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	err := h.svc.DeleteDocument(
		r.Context(),
		middleware.GetTenantID(r.Context()),
		chi.URLParam(r, "id"),
		middleware.GetUserID(r.Context()),
	)
	if err != nil {
		h.writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.svc.GetSettings(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		h.writeError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(settings)
}

func (h *Handler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req kbservice.SettingsPatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	settings, err := h.svc.UpdateSettings(r.Context(), middleware.GetTenantID(r.Context()), req)
	if err != nil {
		h.writeError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(settings)
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	var req kbservice.SearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	resp, err := h.svc.Search(r.Context(), middleware.GetTenantID(r.Context()), kbservice.UserContext{
		UserID: middleware.GetUserID(r.Context()),
		Role:   middleware.GetRole(r.Context()),
	}, req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *Handler) ListFacets(w http.ResponseWriter, r *http.Request) {
	resp, err := h.svc.ListFacets(r.Context(), middleware.GetTenantID(r.Context()), kbservice.UserContext{
		UserID: middleware.GetUserID(r.Context()),
		Role:   middleware.GetRole(r.Context()),
	})
	if err != nil {
		h.writeError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *Handler) writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, kbservice.ErrKBInvalidPayload):
		http.Error(w, err.Error(), http.StatusBadRequest)
	case errors.Is(err, kbservice.ErrKBDisabled):
		http.Error(w, err.Error(), http.StatusForbidden)
	case errors.Is(err, kbservice.ErrKBForbidden):
		http.Error(w, err.Error(), http.StatusForbidden)
	case errors.Is(err, kbservice.ErrKBNotFound):
		http.Error(w, err.Error(), http.StatusNotFound)
	default:
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
