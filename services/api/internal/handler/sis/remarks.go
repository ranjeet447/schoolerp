package sis

import (
	"context"
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

func (h *Handler) ListMyChildRemarks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)
	childID := chi.URLParam(r, "id")

	allowed, err := h.parentOwnsChild(ctx, tenantID, userID, childID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !allowed {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(childID)

	remarks, err := h.svc.ListStudentRemarks(ctx, db.ListStudentRemarksParams{
		TenantID:  tUUID,
		StudentID: sUUID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(remarks)
}

func (h *Handler) AcknowledgeMyChildRemark(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)
	remarkIDStr := chi.URLParam(r, "id")

	canAck, err := h.parentCanAccessRemark(ctx, tenantID, userID, remarkIDStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !canAck {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)
	rmkUUID := pgtype.UUID{}
	rmkUUID.Scan(remarkIDStr)

	remark, err := h.svc.AcknowledgeStudentRemark(ctx, db.AcknowledgeStudentRemarkParams{
		TenantID:    tUUID,
		ID:          rmkUUID,
		AckByUserID: uUUID,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(remark)
}

func (h *Handler) parentOwnsChild(ctx context.Context, tenantID, userID, childID string) (bool, error) {
	children, err := h.svc.ListChildrenByParent(ctx, tenantID, userID)
	if err != nil {
		return false, err
	}
	return childrenContainStudentID(children, childID), nil
}

func (h *Handler) parentCanAccessRemark(ctx context.Context, tenantID, userID, remarkID string) (bool, error) {
	children, err := h.svc.ListChildrenByParent(ctx, tenantID, userID)
	if err != nil {
		return false, err
	}

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	for _, child := range children {
		if !child.ID.Valid {
			continue
		}
		remarks, err := h.svc.ListStudentRemarks(ctx, db.ListStudentRemarksParams{
			TenantID:  tUUID,
			StudentID: child.ID,
		})
		if err != nil {
			return false, err
		}
		if remarksContainID(remarks, remarkID) {
			return true, nil
		}
	}

	return false, nil
}

func childrenContainStudentID(children []db.GetChildrenByParentUserRow, childID string) bool {
	target := pgtype.UUID{}
	if err := target.Scan(childID); err != nil || !target.Valid {
		return false
	}
	for _, child := range children {
		if child.ID.Valid && child.ID.Bytes == target.Bytes {
			return true
		}
	}
	return false
}

func remarksContainID(remarks []db.ListStudentRemarksRow, remarkID string) bool {
	target := pgtype.UUID{}
	if err := target.Scan(remarkID); err != nil || !target.Valid {
		return false
	}
	for _, remark := range remarks {
		if remark.ID.Valid && remark.ID.Bytes == target.Bytes {
			return true
		}
	}
	return false
}
