package sis

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/middleware"
)

type RemarkRequest struct {
	StudentID   string `json:"student_id"`
	Category    string `json:"category"`
	RemarkText  string `json:"remark_text"`
	RequiresAck bool   `json:"requires_ack"`
}

func (h *Handler) CreateRemark(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)

	var req RemarkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request payload", http.StatusBadRequest)
		return
	}

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(req.StudentID)

	arg := db.CreateStudentRemarkParams{
		TenantID:    tUUID,
		StudentID:   sUUID,
		PostedBy:    uUUID,
		Category:    req.Category,
		RemarkText:  req.RemarkText,
		RequiresAck: pgtype.Bool{Bool: req.RequiresAck, Valid: true},
	}

	remark, err := h.svc.CreateStudentRemark(ctx, arg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(remark)
}

func (h *Handler) ListRemarks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	studentIDStr := chi.URLParam(r, "studentID")

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentIDStr)

	arg := db.ListStudentRemarksParams{
		TenantID:  tUUID,
		StudentID: sUUID,
	}

	remarks, err := h.svc.ListStudentRemarks(ctx, arg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(remarks)
}

func (h *Handler) AcknowledgeRemark(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)
	idStr := chi.URLParam(r, "id")

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)
	rmkUUID := pgtype.UUID{}
	rmkUUID.Scan(idStr)

	arg := db.AcknowledgeStudentRemarkParams{
		TenantID:     tUUID,
		ID:           rmkUUID,
		AckByUserID:  uUUID,
	}

	remark, err := h.svc.AcknowledgeStudentRemark(ctx, arg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(remark)
}
