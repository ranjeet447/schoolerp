package approvals

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/approvals"
	"github.com/schoolerp/api/internal/middleware"
)

type Handler struct {
	svc *approvals.Service
	q   db.Querier
}

func NewHandler(svc *approvals.Service, q db.Querier) *Handler {
	return &Handler{svc: svc, q: q}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/approvals", func(r chi.Router) {
		r.Get("/", h.ListApprovals)
		r.Post("/{id}/{action}", h.ProcessApproval)
	})
}

type ApprovalResponse struct {
	ID            string  `json:"id"`
	RequestType   string  `json:"request_type"`
	RequesterName string  `json:"requester_name"`
	StudentName   string  `json:"student_name"`
	Amount        float64 `json:"amount,omitempty"`
	Reason        string  `json:"reason"`
	Status        string  `json:"status"`
	CreatedAt     string  `json:"created_at"`
}

func (h *Handler) ListApprovals(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := middleware.GetTenantID(ctx)
	status := r.URL.Query().Get("status")
	
	limitStr := r.URL.Query().Get("limit")
	limit := 100
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	var requests []db.ApprovalRequest
	var err error

	if status == "pending" {
		requests, err = h.svc.ListPending(ctx, tenantID)
	} else {
		requests, err = h.svc.ListProcessed(ctx, tenantID, int32(limit), 0)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Enrich with names
	var responses []ApprovalResponse
	for _, req := range requests {
		// Mocked names for now unless we do a complex JOIN
		// We'll extract basic info from payload if available
		var payload map[string]interface{}
		json.Unmarshal(req.Payload, &payload)

		reason := req.Reason.String
		if reason == "" {
			if r, ok := payload["reason"].(string); ok {
				reason = r
			} else {
				reason = "No reason provided"
			}
		}

		studentName := "System Request"
		if sn, ok := payload["student_name"].(string); ok {
			studentName = sn
		} else if req.Module == "hrms" {
			studentName = "Staff Payroll Adjustment"
		} else if req.Module == "attendance" {
			studentName = "Attendance Correction"
		}

		amount := 0.0
		if amt, ok := payload["amount"].(float64); ok {
			amount = amt
		}

		resp := ApprovalResponse{
			ID:            req.ID.String(),
			RequestType:   req.Action,
			RequesterName: "Staff User", // Would lookup via req.RequesterID in a real query
			StudentName:   studentName,
			Amount:        amount,
			Reason:        reason,
			Status:        req.Status.String,
			CreatedAt:     req.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
		}
		responses = append(responses, resp)
	}

	if responses == nil {
		responses = []ApprovalResponse{}
	}

	json.NewEncoder(w).Encode(responses)
}

func (h *Handler) ProcessApproval(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")
	action := chi.URLParam(r, "action") // "approve" or "reject"

	var req struct {
		Remark string `json:"remark"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	status := "approved"
	if action == "reject" {
		status = "rejected"
	}

	processed, err := h.svc.ProcessRequest(ctx, id, status, req.Remark)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(processed)
}
