package sis

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/sis"
)

type CertificateHandler struct {
	svc *sis.CertificateService
}

func NewCertificateHandler(svc *sis.CertificateService) *CertificateHandler {
	return &CertificateHandler{svc: svc}
}

func (h *CertificateHandler) RegisterRoutes(r chi.Router) {
	r.Post("/certificates/bonafide", h.GenerateBonafide)
	r.Post("/certificates/tc", h.GenerateTC)
	r.Get("/certificates", h.List)
	r.Get("/students/{id}/certificates", h.ListByStudent)
}

func (h *CertificateHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	certs, err := h.svc.ListCertificatesByTenant(ctx, tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if certs == nil {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(certs)
}

func (h *CertificateHandler) ListByStudent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	studentID := chi.URLParam(r, "id")

	certs, err := h.svc.ListCertificatesByStudent(ctx, tenantID, studentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if certs == nil {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(certs)
}

type generateBonafideReq struct {
	StudentID string `json:"student_id"`
	Reason    string `json:"reason"`
}

func (h *CertificateHandler) GenerateBonafide(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)

	var req generateBonafideReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.StudentID == "" {
		http.Error(w, "student_id is required", http.StatusBadRequest)
		return
	}

	cert, err := h.svc.GenerateBonafide(ctx, sis.GenerateBonafideParams{
		TenantID:  tenantID,
		StudentID: req.StudentID,
		Reason:    req.Reason,
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
