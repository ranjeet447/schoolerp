package sis

import (
	"encoding/json"
	"net/http"

	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/sis"
)

type generateTCReq struct {
	StudentID string `json:"student_id"`
	Reason    string `json:"reason"`
	Conduct   string `json:"conduct"`
	Remarks   string `json:"remarks"`
}

func (h *CertificateHandler) GenerateTC(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	var req generateTCReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.StudentID == "" {
		http.Error(w, "student_id is required", http.StatusBadRequest)
		return
	}

	cert, err := h.svc.GenerateTC(ctx, sis.GenerateTCParams{
		TenantID:  tenantID,
		StudentID: req.StudentID,
		Reason:    req.Reason,
		Conduct:   req.Conduct,
		Remarks:   req.Remarks,
		UserID:    middleware.GetUserID(ctx),
		IP:        r.RemoteAddr,
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cert)
}
