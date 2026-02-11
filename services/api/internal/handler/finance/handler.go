// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package finance

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	financeservice "github.com/schoolerp/api/internal/service/finance"
)

type Handler struct {
	svc *financeservice.Service
}

func NewHandler(svc *financeservice.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/fees", func(r chi.Router) {
		r.Post("/heads", h.CreateFeeHead)
		r.Get("/heads", h.ListFeeHeads)
		r.Post("/plans", h.CreateFeePlan)
		r.Post("/assign", h.AssignPlan)
	})
	r.Route("/payments", func(r chi.Router) {
		r.Post("/offline", h.IssueReceipt)
		r.Post("/online", h.CreateOnlineOrder)
		r.Post("/razorpay-webhook", h.HandleWebhook)
	})
	r.Route("/receipts", func(r chi.Router) {
		r.Post("/{id}/cancel", h.CancelReceipt)
	})
}

func (h *Handler) RegisterParentRoutes(r chi.Router) {
	r.Get("/children/{id}/fees/summary", h.GetFeeSummary)
	r.Get("/children/{id}/fees/receipts", h.ListReceipts)
}

func (h *Handler) CreateFeeHead(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	head, err := h.svc.CreateFeeHead(r.Context(), middleware.GetTenantID(r.Context()), req.Name, req.Type)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(head)
}

func (h *Handler) ListFeeHeads(w http.ResponseWriter, r *http.Request) {
	heads, err := h.svc.ListFeeHeads(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(heads)
}

func (h *Handler) CreateFeePlan(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		AYID  string `json:"academic_year_id"`
		Total int64  `json:"total_amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	plan, err := h.svc.CreateFeePlan(r.Context(), middleware.GetTenantID(r.Context()), req.Name, req.AYID, req.Total)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(plan)
}

func (h *Handler) AssignPlan(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID string `json:"student_id"`
		PlanID    string `json:"plan_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.svc.AssignPlanToStudent(r.Context(), req.StudentID, req.PlanID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) IssueReceipt(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID string `json:"student_id"`
		Amount    int64  `json:"amount"`
		Mode      string `json:"mode"`
		Ref       string `json:"transaction_ref"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	p := financeservice.IssueReceiptParams{
		TenantID:       middleware.GetTenantID(r.Context()),
		StudentID:      req.StudentID,
		Amount:         req.Amount,
		Mode:           req.Mode,
		TransactionRef: req.Ref,
		UserID:         middleware.GetUserID(r.Context()),
		RequestID:      middleware.GetReqID(r.Context()),
		IP:             r.RemoteAddr,
	}

	receipt, err := h.svc.IssueReceipt(r.Context(), p)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(receipt)
}

func (h *Handler) CancelReceipt(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	receipt, err := h.svc.CancelReceipt(r.Context(), 
		middleware.GetTenantID(r.Context()), 
		id, 
		middleware.GetUserID(r.Context()), 
		req.Reason, 
		middleware.GetReqID(r.Context()), 
		r.RemoteAddr,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(receipt)
}

func (h *Handler) GetFeeSummary(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	summary, err := h.svc.GetStudentFeeSummary(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(summary)
}

func (h *Handler) ListReceipts(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	receipts, err := h.svc.ListStudentReceipts(r.Context(), middleware.GetTenantID(r.Context()), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(receipts)
}

func (h *Handler) CreateOnlineOrder(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID string `json:"student_id"`
		Amount    int64  `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	order, err := h.svc.CreateOnlineOrder(r.Context(), middleware.GetTenantID(r.Context()), req.StudentID, req.Amount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(order)
}

func (h *Handler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	// 1. Get Signature & Event ID
	signature := r.Header.Get("X-Razorpay-Signature")
	eventID := r.Header.Get("X-Razorpay-Event-Id")
	
	// 2. Read Body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "could not read body", http.StatusInternalServerError)
		return
	}

	// 3. Process Webhook (idempotent)
	secret := os.Getenv("RAZORPAY_WEBHOOK_SECRET")
	err = h.svc.ProcessPaymentWebhook(r.Context(), middleware.GetTenantID(r.Context()), eventID, body, signature, secret)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}
