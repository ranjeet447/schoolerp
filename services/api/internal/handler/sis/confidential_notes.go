package sis

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/sis"
)

type ConfidentialNotesHandler struct {
	svc *sis.ConfidentialNotesService
}

func NewConfidentialNotesHandler(svc *sis.ConfidentialNotesService) *ConfidentialNotesHandler {
	return &ConfidentialNotesHandler{svc: svc}
}

func (h *ConfidentialNotesHandler) RegisterRoutes(r chi.Router) {
	r.Route("/students/{id}/confidential-notes", func(r chi.Router) {
		r.Get("/", h.List)
		r.Post("/", h.Add)
		r.Delete("/{noteId}", h.Delete)
	})
}

func (h *ConfidentialNotesHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	studentID := chi.URLParam(r, "id")

	notes, err := h.svc.ListNotes(ctx, tenantID, studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

func (h *ConfidentialNotesHandler) Add(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)
	studentID := chi.URLParam(r, "id")

	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	note, err := h.svc.AddNote(ctx, tenantID, studentID, userID, req.Content)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(note)
}

func (h *ConfidentialNotesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	id := chi.URLParam(r, "noteId")

	if err := h.svc.DeleteNote(ctx, tenantID, id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
