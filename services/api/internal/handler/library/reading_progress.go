package library

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/middleware"
)

func (h *Handler) RegisterReadingProgressRoutes(r chi.Router) {
	r.Route("/library/reading-progress", func(r chi.Router) {
		r.Get("/recent", h.GetRecentReadingLogs)
		r.Get("/{studentId}", h.GetReadingLogs)
		r.Post("/", h.UpsertReadingLog)
		r.Post("/update", h.UpdateReadingProgress)
		r.Get("/velocity/{studentId}/{bookId}", h.GetReadingVelocity)
	})
}

func (h *Handler) GetRecentReadingLogs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	logs, err := h.svc.ListRecentReadingLogs(ctx, tenantID, 20)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *Handler) GetReadingLogs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	studentID := chi.URLParam(r, "studentId")

	logs, err := h.svc.GetStudentReadingLogs(ctx, tenantID, studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *Handler) UpsertReadingLog(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	var req struct {
		StudentID   string `json:"student_id"`
		BookID      string `json:"book_id"`
		Status      string `json:"status"`
		CurrentPage int    `json:"current_page"`
		TotalPages  int    `json:"total_pages"`
		Rating      *int   `json:"rating"`
		Notes       string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(req.StudentID)
	bID := pgtype.UUID{}
	bID.Scan(req.BookID)

	params := db.UpsertReadingLogParams{
		TenantID:    tID,
		StudentID:   sID,
		BookID:      bID,
		Status:      req.Status,
		CurrentPage: pgtype.Int4{Int32: int32(req.CurrentPage), Valid: true},
		TotalPages:  pgtype.Int4{Int32: int32(req.TotalPages), Valid: true},
		Notes:       pgtype.Text{String: req.Notes, Valid: req.Notes != ""},
	}
	if req.Rating != nil {
		params.Rating = pgtype.Int4{Int32: int32(*req.Rating), Valid: true}
	}

	log, err := h.svc.UpsertReadingLog(ctx, params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(log)
}

func (h *Handler) UpdateReadingProgress(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	var req struct {
		StudentID  string `json:"student_id"`
		BookID     string `json:"book_id"`
		PagesRead  int    `json:"pages_read"`
		TotalPages int    `json:"total_pages"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	progress, err := h.svc.UpdateReadingProgress(ctx, tenantID, req.StudentID, req.BookID, req.PagesRead, req.TotalPages)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(progress)
}

func (h *Handler) GetReadingVelocity(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	studentID := chi.URLParam(r, "studentId")
	bookID := chi.URLParam(r, "bookId")

	velocity, err := h.svc.GetReadingVelocity(ctx, studentID, bookID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(velocity)
}
