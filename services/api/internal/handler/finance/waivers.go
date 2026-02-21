package finance

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/middleware"
)

type WaiverRequest struct {
	StudentID     string  `json:"student_id"`
	FeePlanItemID *string `json:"fee_plan_item_id,omitempty"`
	AmountWaived  int64   `json:"amount_waived"`
	Reason        string  `json:"reason"`
}

func (h *Handler) CreateLateWaiver(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)

	var req WaiverRequest
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

	var planItemID pgtype.UUID
	if req.FeePlanItemID != nil {
		planItemID.Scan(*req.FeePlanItemID)
	}

	arg := db.CreateFeeLateWaiverParams{
		TenantID:      tUUID,
		StudentID:     sUUID,
		FeePlanItemID: planItemID,
		AmountWaived:  req.AmountWaived,
		Reason:        req.Reason,
		RequestedBy:   uUUID,
	}

	waiver, err := h.svc.CreateFeeLateWaiver(ctx, arg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(waiver)
}

type UpdateWaiverStatusRequest struct {
	Status string `json:"status"`
}

func (h *Handler) UpdateLateWaiverStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	userID := middleware.GetUserID(ctx)
	idStr := chi.URLParam(r, "id")

	var req UpdateWaiverStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request payload", http.StatusBadRequest)
		return
	}

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)
	wUUID := pgtype.UUID{}
	wUUID.Scan(idStr)

	arg := db.UpdateFeeLateWaiverStatusParams{
		TenantID:  tUUID,
		ID:        wUUID,
		Status:    pgtype.Text{String: req.Status, Valid: true},
		DecidedBy: uUUID,
	}

	waiver, err := h.svc.UpdateFeeLateWaiverStatus(ctx, arg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(waiver)
}

func (h *Handler) ListLateWaivers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	
	statusFilter := r.URL.Query().Get("status")
	var status string
	if statusFilter != "" {
		status = statusFilter
	}

	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	arg := db.ListFeeLateWaiversParams{
		TenantID: tUUID,
		Status:   status,
	}

	waivers, err := h.svc.ListFeeLateWaivers(ctx, arg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(waivers)
}
