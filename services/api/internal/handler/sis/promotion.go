package sis

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	sisservice "github.com/schoolerp/api/internal/service/sis"
)

type PromotionHandler struct {
	svc *sisservice.PromotionService
}

func NewPromotionHandler(svc *sisservice.PromotionService) *PromotionHandler {
	return &PromotionHandler{svc: svc}
}

func (h *PromotionHandler) RegisterRoutes(r chi.Router) {
	r.Route("/promotions", func(r chi.Router) {
		r.Post("/rules", h.CreateRule)
		r.Post("/apply", h.Promote)
	})
}

func (h *PromotionHandler) CreateRule(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Priority int32   `json:"priority"`
		MinAgg   float64 `json:"min_aggregate"`
		MinSub   float64 `json:"min_subject"`
		MinAtt   float64 `json:"min_attendance"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	rule, err := h.svc.CreateRule(r.Context(), middleware.GetTenantID(r.Context()), req.Priority, req.MinAgg, req.MinSub, req.MinAtt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(rule)
}

func (h *PromotionHandler) Promote(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID     string  `json:"student_id"`
		FromAYID      string  `json:"from_academic_year_id"`
		ToAYID        string  `json:"to_academic_year_id"`
		FromSectionID *string `json:"from_section_id"`
		ToSectionID   *string `json:"to_section_id"`
		Status        string  `json:"status"`
		Remarks       string  `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	err := h.svc.PromoteStudent(r.Context(), sisservice.PromotionParams{
		TenantID:      middleware.GetTenantID(r.Context()),
		StudentID:     req.StudentID,
		FromAYID:      req.FromAYID,
		ToAYID:        req.ToAYID,
		FromSectionID: req.FromSectionID,
		ToSectionID:   req.ToSectionID,
		PromotedBy:    middleware.GetUserID(r.Context()),
		Status:        req.Status,
		Remarks:       req.Remarks,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
