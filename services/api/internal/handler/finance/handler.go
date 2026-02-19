package finance

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

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
		
		// Phase 11 Routes
		r.Get("/structure", h.ListFeeClassConfigs)
		r.Post("/structure", h.UpsertFeeClassConfig)
		r.Get("/gateways", h.GetActiveGatewayConfig)
		r.Post("/gateways", h.UpsertGatewayConfig)
		r.Get("/scholarships", h.ListScholarships)
		r.Post("/scholarships", h.UpsertScholarship)
		r.Get("/optional", h.ListOptionalFeeItems)
		r.Post("/select", h.SelectOptionalFee)
		r.Get("/students/{id}/summary", h.GetFeeSummary)
	})
	r.Route("/rules", func(r chi.Router) {
		r.Get("/late-fees", h.ListLateFeeRules)
		r.Post("/late-fees", h.CreateLateFeeRule)
		r.Get("/concessions", h.ListConcessionRules)
		r.Post("/concessions", h.CreateConcessionRule)
	})
	r.Post("/student-concessions", h.ApplyStudentConcession)
	r.Route("/payments", func(r chi.Router) {
		r.Post("/offline", h.IssueReceipt)
		r.Get("/receipts", h.ListReceiptsByStudent)
		r.Get("/reports/billing", h.GetBillingReport)
		r.Get("/reports/collections", h.GetCollectionReport)
		r.Post("/online", h.CreateOnlineOrder)
		r.Post("/razorpay-webhook", h.HandleWebhook)
		r.Get("/tally-export", h.ExportTally)
		r.Get("/ledger-mappings", h.ListLedgerMappings)
		r.Post("/ledger-mappings", h.UpsertLedgerMapping)
	})
	r.Route("/receipts", func(r chi.Router) {
		r.Get("/series", h.ListReceiptSeries)
		r.Post("/series", h.CreateReceiptSeries)
		r.Post("/{id}/cancel", h.CancelReceipt)
		r.Post("/{id}/refund", h.CreateRefund)
		r.Get("/{id}/pdf", h.GetReceiptPDF)
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
		Items     []struct {
			HeadID string `json:"fee_head_id"`
			Amount int64  `json:"amount"`
		} `json:"items"`
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

	for _, item := range req.Items {
		p.Items = append(p.Items, financeservice.ReceiptItemParam{
			HeadID: item.HeadID,
			Amount: item.Amount,
		})
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

func (h *Handler) UpsertFeeClassConfig(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AYID       string  `json:"academic_year_id"`
		ClassID    string  `json:"class_id"`
		HeadID     string  `json:"fee_head_id"`
		Amount     float64 `json:"amount"`
		DueDate    string  `json:"due_date"`
		IsOptional bool    `json:"is_optional"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	params := financeservice.FeeClassConfigParams{
		TenantID:       middleware.GetTenantID(r.Context()),
		AcademicYearID: req.AYID,
		ClassID:        req.ClassID,
		FeeHeadID:      req.HeadID,
		Amount:         req.Amount,
		IsOptional:     req.IsOptional,
	}

	if req.DueDate != "" {
		t, err := time.Parse("2006-01-02", req.DueDate)
		if err == nil {
			params.DueDate = &t
		}
	}

	cfg, err := h.svc.UpsertFeeClassConfig(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(cfg)
}

func (h *Handler) ListFeeClassConfigs(w http.ResponseWriter, r *http.Request) {
	ayID := r.URL.Query().Get("academic_year_id")
	classID := r.URL.Query().Get("class_id") // Optional
	
	if ayID == "" {
		http.Error(w, "academic_year_id is required", http.StatusBadRequest)
		return
	}

	var cIDPtr *string
	if classID != "" {
		cIDPtr = &classID
	}

	configs, err := h.svc.ListFeeClassConfigs(r.Context(), middleware.GetTenantID(r.Context()), ayID, cIDPtr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(configs)
}

func (h *Handler) UpsertGatewayConfig(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Provider      string          `json:"provider"`
		APIKey        string          `json:"api_key"`
		APISecret     string          `json:"api_secret"`
		WebhookSecret string          `json:"webhook_secret"`
		IsActive      bool            `json:"is_active"`
		Settings      json.RawMessage `json:"settings"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	params := financeservice.GatewayConfigParams{
		TenantID:      middleware.GetTenantID(r.Context()),
		Provider:      req.Provider,
		APIKey:        req.APIKey,
		APISecret:     req.APISecret,
		WebhookSecret: req.WebhookSecret,
		IsActive:      req.IsActive,
		Settings:      req.Settings,
	}

	cfg, err := h.svc.UpsertGatewayConfig(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(cfg)
}

func (h *Handler) GetActiveGatewayConfig(w http.ResponseWriter, r *http.Request) {
	provider := r.URL.Query().Get("provider")
	if provider == "" {
		http.Error(w, "provider is required", http.StatusBadRequest)
		return
	}
	
	cfg, err := h.svc.GetActiveGatewayConfig(r.Context(), middleware.GetTenantID(r.Context()), provider)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(cfg)
}

func (h *Handler) ListOptionalFeeItems(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.ListOptionalFeeItems(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(items)
}

func (h *Handler) SelectOptionalFee(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID string `json:"student_id"`
		ItemID    string `json:"item_id"`
		AYID      string `json:"academic_year_id"`
		Status    string `json:"status"` // 'active', 'inactive'
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	res, err := h.svc.SelectOptionalFee(r.Context(), middleware.GetTenantID(r.Context()), req.StudentID, req.ItemID, req.AYID, req.Status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(res)
}

func (h *Handler) UpsertScholarship(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string  `json:"name"`
		Type        string  `json:"type"`
		Value       float64 `json:"value"`
		Description string  `json:"description"`
		IsActive    bool    `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	params := financeservice.ScholarshipParams{
		TenantID:    middleware.GetTenantID(r.Context()),
		Name:        req.Name,
		Type:        req.Type,
		Value:       req.Value,
		Description: req.Description,
		IsActive:    req.IsActive,
	}

	s, err := h.svc.UpsertScholarship(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(s)
}

func (h *Handler) ListScholarships(w http.ResponseWriter, r *http.Request) {
	activeStr := r.URL.Query().Get("active_only")
	var activeOnly *bool
	if activeStr != "" {
		val := activeStr == "true"
		activeOnly = &val
	}

	list, err := h.svc.ListScholarships(r.Context(), middleware.GetTenantID(r.Context()), activeOnly)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(list)
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

func (h *Handler) ListReceiptsByStudent(w http.ResponseWriter, r *http.Request) {
	studentID := r.URL.Query().Get("student_id")
	if studentID == "" {
		http.Error(w, "student_id is required", http.StatusBadRequest)
		return
	}

	receipts, err := h.svc.ListStudentReceipts(r.Context(), middleware.GetTenantID(r.Context()), studentID)
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

func (h *Handler) ListReceiptSeries(w http.ResponseWriter, r *http.Request) {
	series, err := h.svc.ListReceiptSeries(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(series)
}

func (h *Handler) CreateReceiptSeries(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Prefix  string `json:"prefix"`
		StartNo int32  `json:"start_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	series, err := h.svc.CreateReceiptSeries(r.Context(), middleware.GetTenantID(r.Context()), req.Prefix, req.StartNo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(series)
}

func (h *Handler) CreateRefund(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Amount int64  `json:"amount"`
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	refund, err := h.svc.CreateRefund(r.Context(), middleware.GetTenantID(r.Context()), id, req.Amount, req.Reason)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(refund)
}

func (h *Handler) GetReceiptPDF(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tenantID := middleware.GetTenantID(r.Context())

	pdf, err := h.svc.GetReceiptPDF(r.Context(), tenantID, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=receipt_%s.pdf", id))
	w.Write(pdf)
}

func (h *Handler) UpsertLedgerMapping(w http.ResponseWriter, r *http.Request) {
	var req struct {
		HeadID    string `json:"fee_head_id"`
		TallyName string `json:"tally_ledger_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	mapping, err := h.svc.UpsertLedgerMapping(r.Context(), middleware.GetTenantID(r.Context()), req.HeadID, req.TallyName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(mapping)
}

func (h *Handler) ListLedgerMappings(w http.ResponseWriter, r *http.Request) {
	mappings, err := h.svc.ListLedgerMappings(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(mappings)
}

func (h *Handler) ExportTally(w http.ResponseWriter, r *http.Request) {
	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")

	from, _ := time.Parse("2006-01-02", fromStr)
	to, _ := time.Parse("2006-01-02", toStr)
	if to.IsZero() {
		to = time.Now()
	}

	csvData, err := h.svc.ExportReceiptsToTallyCSV(r.Context(), middleware.GetTenantID(r.Context()), from, to)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=tally_export_%s.csv", time.Now().Format("20060102")))
	w.Write(csvData)
}

func (h *Handler) GetBillingReport(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	fromStr := strings.TrimSpace(r.URL.Query().Get("from"))
	toStr := strings.TrimSpace(r.URL.Query().Get("to"))

	now := time.Now()
	from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	to := now

	if fromStr != "" {
		parsed, err := time.Parse("2006-01-02", fromStr)
		if err != nil {
			http.Error(w, "invalid from date, expected YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		from = parsed
	}

	if toStr != "" {
		parsed, err := time.Parse("2006-01-02", toStr)
		if err != nil {
			http.Error(w, "invalid to date, expected YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		to = parsed
	}

	if to.Before(from) {
		http.Error(w, "to date cannot be before from date", http.StatusBadRequest)
		return
	}

	summary, rows, err := h.svc.GetBillingReport(r.Context(), tenantID, from, to)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"summary": summary,
		"rows":    rows,
	})
}

func (h *Handler) ListLateFeeRules(w http.ResponseWriter, r *http.Request) {
	rules, err := h.svc.ListLateFeeRules(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(rules)
}

func (h *Handler) CreateLateFeeRule(w http.ResponseWriter, r *http.Request) {
	var req financeservice.LateFeeRule
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.svc.CreateLateFeeRule(r.Context(), middleware.GetTenantID(r.Context()), req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) ListConcessionRules(w http.ResponseWriter, r *http.Request) {
	rules, err := h.svc.ListConcessionRules(r.Context(), middleware.GetTenantID(r.Context()))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(rules)
}

func (h *Handler) CreateConcessionRule(w http.ResponseWriter, r *http.Request) {
	var req financeservice.ConcessionRule
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.svc.CreateConcessionRule(r.Context(), middleware.GetTenantID(r.Context()), req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) ApplyStudentConcession(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID string `json:"student_id"`
		RuleID    string `json:"rule_id"`
		Remarks   string `json:"remarks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	err := h.svc.ApplyStudentConcession(r.Context(), req.StudentID, req.RuleID, middleware.GetUserID(r.Context()), req.Remarks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) GetCollectionReport(w http.ResponseWriter, r *http.Request) {
	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")

	from, _ := time.Parse("2006-01-02", fromStr)
	to, _ := time.Parse("2006-01-02", toStr)
	if to.IsZero() {
		to = time.Now()
	}

	report, err := h.svc.GetCollectionReport(r.Context(), middleware.GetTenantID(r.Context()), from, to)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(report)
}
