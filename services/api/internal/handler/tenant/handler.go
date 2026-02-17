package tenant

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/tenant"
)

type Handler struct {
	service *tenant.Service
}

func NewHandler(service *tenant.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterPlatformRoutes(r chi.Router) {
	r.Get("/summary", h.GetPlatformSummary)
	r.Get("/plans", h.ListPlatformPlans)
	r.Post("/plans", h.CreatePlatformPlan)
	r.Patch("/plans/{plan_id}", h.UpdatePlatformPlan)
	r.Post("/plans/{plan_id}/clone", h.ClonePlatformPlan)
	r.Post("/feature-rollouts", h.RolloutFeatureFlag)
	r.Get("/signup-requests", h.ListSignupRequests)
	r.Post("/signup-requests/{signup_id}/review", h.ReviewSignupRequest)
	r.Get("/tenants", h.ListPlatformTenants)
	r.Get("/tenants/{tenant_id}", h.GetPlatformTenant)
	r.Patch("/tenants/{tenant_id}", h.UpdatePlatformTenant)
	r.Post("/tenants/{tenant_id}/lifecycle", h.UpdateTenantLifecycle)
	r.Post("/tenants/{tenant_id}/trial", h.ManageTenantTrialLifecycle)
	r.Get("/tenants/{tenant_id}/billing-controls", h.GetTenantBillingControls)
	r.Post("/tenants/{tenant_id}/dunning-rules", h.UpdateTenantDunningRules)
	r.Post("/tenants/{tenant_id}/billing-lock", h.ManageTenantBillingLock)
	r.Post("/tenants/{tenant_id}/defaults", h.UpdateTenantDefaults)
	r.Post("/tenants/{tenant_id}/plan", h.AssignTenantPlan)
	r.Post("/tenants/{tenant_id}/plan-change", h.ChangeTenantPlan)
	r.Post("/tenants/{tenant_id}/limit-overrides", h.UpsertTenantLimitOverride)
	r.Post("/tenants/{tenant_id}/branding", h.UpdateTenantBranding)
	r.Post("/tenants/{tenant_id}/domain", h.UpdateTenantDomainMapping)
	r.Post("/tenants/{tenant_id}/reset-admin-password", h.ResetTenantAdminPassword)
	r.Post("/tenants/{tenant_id}/force-logout", h.ForceLogoutTenantUsers)
	r.Post("/tenants/{tenant_id}/impersonate", h.ImpersonateTenantAdmin)
	r.Post("/tenants/{tenant_id}/impersonation-exit", h.LogImpersonationExit)
	r.Get("/tenants/{tenant_id}/branches", h.ListTenantBranches)
	r.Post("/tenants/{tenant_id}/branches", h.CreateTenantBranch)
	r.Patch("/tenants/{tenant_id}/branches/{branch_id}", h.UpdateTenantBranch)
	r.Get("/internal-users", h.ListPlatformInternalUsers)
	r.Post("/internal-users", h.CreatePlatformInternalUser)
	r.Patch("/internal-users/{user_id}", h.UpdatePlatformInternalUser)
	r.Get("/internal-users/{user_id}/sessions", h.ListPlatformInternalUserSessions)
	r.Post("/internal-users/{user_id}/sessions/revoke", h.RevokePlatformInternalUserSessions)
	r.Post("/internal-users/{user_id}/tokens/rotate", h.RotatePlatformInternalUserTokens)
	r.Get("/rbac/templates", h.ListPlatformRBACTemplates)
	r.Post("/rbac/templates/{role_code}/permissions", h.UpdatePlatformRolePermissions)
	r.Get("/access/ip-allowlist", h.ListPlatformIPAllowlist)
	r.Post("/access/ip-allowlist", h.CreatePlatformIPAllowlist)
	r.Delete("/access/ip-allowlist/{allowlist_id}", h.DeletePlatformIPAllowlist)
	r.Get("/access/policies", h.GetPlatformSecurityPolicy)
	r.Post("/access/policies/mfa", h.UpdatePlatformMFAPolicy)
	r.Get("/access/break-glass/policy", h.GetPlatformBreakGlassPolicy)
	r.Post("/access/break-glass/policy", h.UpdatePlatformBreakGlassPolicy)
	r.Post("/access/break-glass/activate", h.ActivateBreakGlass)
	r.Get("/access/break-glass/events", h.ListBreakGlassEvents)
	r.Get("/security/audit-logs/export", h.ExportPlatformAuditLogs)
	r.Get("/security/audit-logs", h.ListPlatformAuditLogs)
	r.Get("/security/events", h.ListPlatformSecurityEvents)
	r.Get("/security/retention-policy", h.GetPlatformDataRetentionPolicy)
	r.Post("/security/retention-policy", h.UpdatePlatformDataRetentionPolicy)
	r.Get("/billing/overview", h.GetPlatformBillingOverview)
	r.Get("/billing/config", h.GetPlatformBillingConfig)
	r.Post("/billing/config", h.UpdatePlatformBillingConfig)
	r.Get("/invoices", h.ListPlatformInvoices)
	r.Post("/invoices", h.CreatePlatformInvoice)
	r.Post("/invoices/{invoice_id}/resend", h.ResendPlatformInvoice)
	r.Post("/invoices/{invoice_id}/mark-paid", h.MarkPlatformInvoicePaid)
	r.Post("/invoices/{invoice_id}/refunds", h.CreatePlatformInvoiceRefund)
	r.Post("/invoices/{invoice_id}/credit-notes", h.CreatePlatformCreditNote)
	r.Get("/invoices/{invoice_id}/export", h.ExportPlatformInvoice)
	r.Get("/invoice-adjustments", h.ListPlatformInvoiceAdjustments)
	r.Get("/payments", h.ListPlatformPayments)
}

func (h *Handler) GetConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		http.Error(w, "X-Tenant-ID header required", http.StatusBadRequest)
		return
	}

	config, err := h.service.GetConfig(r.Context(), tenantID)
	if err != nil {
		http.Error(w, "Tenant not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"config": config,
	})
}

func (h *Handler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		http.Error(w, "tenant context missing", http.StatusBadRequest)
		return
	}

	var req struct {
		Config map[string]interface{} `json:"config"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateConfig(r.Context(), tenantID, req.Config); err != nil {
		http.Error(w, "Failed to update tenant config", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *Handler) ListPlugins(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		http.Error(w, "tenant context missing", http.StatusBadRequest)
		return
	}

	plugins, err := h.service.ListPlugins(r.Context(), tenantID)
	if err != nil {
		http.Error(w, "Failed to list plugins", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"plugins": plugins,
	})
}

func (h *Handler) UpdatePluginConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	if tenantID == "" {
		http.Error(w, "tenant context missing", http.StatusBadRequest)
		return
	}

	pluginID := chi.URLParam(r, "id")
	if pluginID == "" {
		http.Error(w, "Plugin ID required", http.StatusBadRequest)
		return
	}

	var req struct {
		Enabled  bool                   `json:"enabled"`
		Settings map[string]interface{} `json:"settings"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdatePluginConfig(r.Context(), tenantID, pluginID, req.Enabled, req.Settings); err != nil {
		http.Error(w, "Failed to update plugin config", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *Handler) OnboardSchool(w http.ResponseWriter, r *http.Request) {
	var params tenant.OnboardSchoolParams
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic Validation
	if params.Name == "" || params.Subdomain == "" || params.AdminEmail == "" || params.Password == "" {
		http.Error(w, "Missing required onboarding fields", http.StatusBadRequest)
		return
	}

	tenantID, err := h.service.OnboardSchool(r.Context(), params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "created",
		"tenant_id": tenantID,
	})
}

func (h *Handler) GetPlatformSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.service.GetPlatformSummary(r.Context())
	if err != nil {
		http.Error(w, "Failed to load platform summary", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(summary)
}

func (h *Handler) ListPlatformPlans(w http.ResponseWriter, r *http.Request) {
	qp := r.URL.Query()
	rows, err := h.service.ListPlatformPlans(r.Context(), tenant.PlatformPlanFilters{
		IncludeInactive: qp.Get("include_inactive") == "true",
		Search:          firstNonEmpty(qp.Get("q"), qp.Get("search")),
	})
	if err != nil {
		http.Error(w, "Failed to load platform plans", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformPlan(w http.ResponseWriter, r *http.Request) {
	var req tenant.CreatePlatformPlanParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = middleware.GetUserID(r.Context())

	created, err := h.service.CreatePlatformPlan(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlanCode):
			http.Error(w, "Invalid plan code", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrCriticalModuleLocked):
			http.Error(w, "Critical compliance module cannot be disabled", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlanPayload):
			http.Error(w, "Invalid plan payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlanCodeExists):
			http.Error(w, "Plan code already exists", http.StatusConflict)
		default:
			http.Error(w, "Failed to create platform plan", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), req.CreatedBy, tenant.PlatformAuditEntry{
		Action:       "platform.plan.create",
		ResourceType: "platform_plan",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(created.Code),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) UpdatePlatformPlan(w http.ResponseWriter, r *http.Request) {
	planID := chi.URLParam(r, "plan_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.UpdatePlatformPlanParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdatePlatformPlan(r.Context(), planID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlanID):
			http.Error(w, "Invalid plan id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlanCode):
			http.Error(w, "Invalid plan code", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrCriticalModuleLocked):
			http.Error(w, "Critical compliance module cannot be disabled", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlanPayload):
			http.Error(w, "Invalid plan payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlanNotFound):
			http.Error(w, "Plan not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrPlanCodeExists):
			http.Error(w, "Plan code already exists", http.StatusConflict)
		default:
			http.Error(w, "Failed to update platform plan", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.plan.update",
		ResourceType: "platform_plan",
		ResourceID:   updated.ID,
		Reason:       strings.TrimSpace(updated.Code),
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ClonePlatformPlan(w http.ResponseWriter, r *http.Request) {
	planID := chi.URLParam(r, "plan_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.ClonePlatformPlanParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.ClonePlatformPlan(r.Context(), planID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlanID):
			http.Error(w, "Invalid plan id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlanCode):
			http.Error(w, "Invalid plan code", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlanNotFound):
			http.Error(w, "Plan not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrPlanCodeExists):
			http.Error(w, "Plan code already exists", http.StatusConflict)
		default:
			http.Error(w, "Failed to clone platform plan", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.plan.clone",
		ResourceType: "platform_plan",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(created.Code),
		After: map[string]any{
			"source_plan_id": planID,
			"cloned_plan":    created,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) RolloutFeatureFlag(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())

	var req tenant.FeatureRolloutParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	result, err := h.service.RolloutFeatureFlag(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidRollout):
			http.Error(w, "Invalid feature rollout payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to execute feature rollout", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.feature_flag.rollout",
		ResourceType: "platform_feature_flag",
		ResourceID:   strings.TrimSpace(result.FlagKey),
		Reason:       strings.TrimSpace(result.FlagKey),
		After: map[string]any{
			"enabled":       result.Enabled,
			"percentage":    result.Percentage,
			"total_matched": result.TotalMatched,
			"applied_count": result.AppliedCount,
			"tenant_ids":    result.TenantIDs,
			"dry_run":       result.DryRun,
			"filters": map[string]any{
				"plan_code": strings.TrimSpace(req.PlanCode),
				"region":    strings.TrimSpace(req.Region),
				"status":    strings.TrimSpace(req.Status),
			},
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) ListPlatformTenants(w http.ResponseWriter, r *http.Request) {
	qp := r.URL.Query()
	includeInactive := qp.Get("include_inactive") == "true"

	var createdFrom *time.Time
	if raw := qp.Get("created_from"); raw != "" {
		parsed, err := parseDateOrRFC3339(raw, false)
		if err != nil {
			http.Error(w, "invalid created_from", http.StatusBadRequest)
			return
		}
		createdFrom = &parsed
	}

	var createdTo *time.Time
	if raw := qp.Get("created_to"); raw != "" {
		parsed, err := parseDateOrRFC3339(raw, true)
		if err != nil {
			http.Error(w, "invalid created_to", http.StatusBadRequest)
			return
		}
		createdTo = &parsed
	}

	limit := int32(50)
	if raw := qp.Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}
	offset := int32(0)
	if raw := qp.Get("offset"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			offset = int32(parsed)
		}
	}

	tenants, err := h.service.ListPlatformTenantsWithFilters(r.Context(), tenant.TenantDirectoryFilters{
		IncludeInactive: includeInactive,
		Search:          firstNonEmpty(qp.Get("q"), qp.Get("search")),
		PlanCode:        firstNonEmpty(qp.Get("plan_code"), qp.Get("plan")),
		Status:          qp.Get("status"),
		Region:          qp.Get("region"),
		CreatedFrom:     createdFrom,
		CreatedTo:       createdTo,
		Limit:           limit,
		Offset:          offset,
		SortBy:          qp.Get("sort"),
		SortOrder:       qp.Get("order"),
	})
	if err != nil {
		http.Error(w, "Failed to load tenants", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(tenants)
}

func parseDateOrRFC3339(raw string, endOfDay bool) (time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return time.Time{}, errors.New("empty")
	}

	// 1) Full timestamp
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		return t, nil
	}

	// 2) Date only
	d, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return time.Time{}, err
	}
	if endOfDay {
		return d.Add(24*time.Hour - time.Nanosecond), nil
	}
	return d, nil
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		v = strings.TrimSpace(v)
		if v != "" {
			return v
		}
	}
	return ""
}

func (h *Handler) GetPlatformTenant(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	tenantRow, err := h.service.GetPlatformTenant(r.Context(), tenantID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrTenantNotFound):
			http.Error(w, "Tenant not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to load tenant", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(tenantRow)
}

func (h *Handler) UpdatePlatformTenant(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.UpdateTenantParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdatePlatformTenant(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidTenant):
			http.Error(w, "Invalid tenant payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrTenantNotFound):
			http.Error(w, "Tenant not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to update tenant", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.update",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListTenantBranches(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	branches, err := h.service.ListTenantBranches(r.Context(), tenantID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to load branches", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(branches)
}

func (h *Handler) CreateTenantBranch(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreateBranchParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	created, err := h.service.CreateTenantBranch(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidBranch):
			http.Error(w, "Invalid branch payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create branch", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.branch.create",
		ResourceType: "branch",
		ResourceID:   created.ID,
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) UpdateTenantBranch(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	branchID := chi.URLParam(r, "branch_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.UpdateBranchParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdateTenantBranch(r.Context(), tenantID, branchID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidBranchID):
			http.Error(w, "Invalid branch id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidBranch):
			http.Error(w, "Invalid branch payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrBranchNotFound):
			http.Error(w, "Branch not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to update branch", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.branch.update",
		ResourceType: "branch",
		ResourceID:   branchID,
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListPlatformInternalUsers(w http.ResponseWriter, r *http.Request) {
	limit := int32(100)
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}
	offset := int32(0)
	if raw := r.URL.Query().Get("offset"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			offset = int32(parsed)
		}
	}

	var isActive *bool
	if raw := strings.TrimSpace(r.URL.Query().Get("is_active")); raw != "" {
		v := strings.EqualFold(raw, "true")
		isActive = &v
	}

	rows, err := h.service.ListPlatformInternalUsers(r.Context(), tenant.ListPlatformInternalUsersFilters{
		Search:   firstNonEmpty(r.URL.Query().Get("q"), r.URL.Query().Get("search")),
		RoleCode: r.URL.Query().Get("role_code"),
		IsActive: isActive,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		http.Error(w, "Failed to load platform users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformInternalUser(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	var req tenant.CreatePlatformInternalUserParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	created, err := h.service.CreatePlatformInternalUser(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformUserPayload):
			http.Error(w, "Invalid platform user payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformRoleNotAllowed):
			http.Error(w, "Invalid platform role", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformUserExists):
			http.Error(w, "Platform user already exists", http.StatusConflict)
		default:
			http.Error(w, "Failed to create platform user", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.user.create",
		ResourceType: "platform_user",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(created.RoleCode),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) UpdatePlatformInternalUser(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	userID := chi.URLParam(r, "user_id")

	var req tenant.UpdatePlatformInternalUserParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdatePlatformInternalUser(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "Invalid platform user id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformUserPayload):
			http.Error(w, "Invalid platform user payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformRoleNotAllowed):
			http.Error(w, "Invalid platform role", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformUserNotFound):
			http.Error(w, "Platform user not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to update platform user", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.user.update",
		ResourceType: "platform_user",
		ResourceID:   updated.ID,
		Reason:       strings.TrimSpace(updated.RoleCode),
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListPlatformInternalUserSessions(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "user_id")
	limit := int32(200)
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}

	rows, err := h.service.ListPlatformInternalUserSessions(r.Context(), userID, limit)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "Invalid platform user id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformUserNotFound):
			http.Error(w, "Platform user not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to load user sessions", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) RevokePlatformInternalUserSessions(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	userID := chi.URLParam(r, "user_id")

	var req struct {
		SessionID string `json:"session_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	revoked, err := h.service.RevokePlatformInternalUserSessions(r.Context(), userID, req.SessionID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "Invalid platform user id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidSessionID):
			http.Error(w, "Invalid session id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformUserNotFound):
			http.Error(w, "Platform user not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to revoke sessions", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.user.sessions.revoke",
		ResourceType: "platform_user",
		ResourceID:   strings.TrimSpace(userID),
		After: map[string]any{
			"session_id":   strings.TrimSpace(req.SessionID),
			"revoked_rows": revoked,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":       "ok",
		"revoked_rows": revoked,
	})
}

func (h *Handler) RotatePlatformInternalUserTokens(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	userID := chi.URLParam(r, "user_id")

	revoked, err := h.service.RotatePlatformInternalUserTokens(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "Invalid platform user id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformUserNotFound):
			http.Error(w, "Platform user not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to rotate user tokens", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.user.tokens.rotate",
		ResourceType: "platform_user",
		ResourceID:   strings.TrimSpace(userID),
		After: map[string]any{
			"revoked_rows": revoked,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":       "ok",
		"revoked_rows": revoked,
	})
}

func (h *Handler) ListPlatformRBACTemplates(w http.ResponseWriter, r *http.Request) {
	matrix, err := h.service.ListPlatformRBACTemplates(r.Context())
	if err != nil {
		http.Error(w, "Failed to load RBAC templates", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(matrix)
}

func (h *Handler) UpdatePlatformRolePermissions(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	roleCode := chi.URLParam(r, "role_code")

	var req tenant.UpdatePlatformRolePermissionsParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	updated, err := h.service.UpdatePlatformRolePermissions(r.Context(), roleCode, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidRBACRoleCode):
			http.Error(w, "Invalid role code", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidRBACPermissionCode):
			http.Error(w, "Invalid permission codes", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update role permissions", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.rbac.role_permissions.update",
		ResourceType: "platform_role",
		ResourceID:   strings.TrimSpace(roleCode),
		Reason:       strings.TrimSpace(roleCode),
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListPlatformIPAllowlist(w http.ResponseWriter, r *http.Request) {
	rows, err := h.service.ListPlatformIPAllowlist(r.Context(), r.URL.Query().Get("role_name"))
	if err != nil {
		http.Error(w, "Failed to load IP allowlist", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformIPAllowlist(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	var req tenant.CreatePlatformIPAllowlistParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.CreatePlatformIPAllowlist(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrPlatformRoleNotAllowed):
			http.Error(w, "Invalid role name", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidCIDRBlock):
			http.Error(w, "Invalid CIDR block", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create IP allowlist entry", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.ip_allowlist.create",
		ResourceType: "platform_ip_allowlist",
		ResourceID:   created.ID,
		Reason:       created.RoleName,
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) DeletePlatformIPAllowlist(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	allowlistID := chi.URLParam(r, "allowlist_id")

	if err := h.service.DeletePlatformIPAllowlist(r.Context(), allowlistID); err != nil {
		if errors.Is(err, tenant.ErrInvalidAllowlistID) {
			http.Error(w, "Invalid allowlist id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to delete allowlist entry", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.ip_allowlist.delete",
		ResourceType: "platform_ip_allowlist",
		ResourceID:   strings.TrimSpace(allowlistID),
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "deleted"})
}

func (h *Handler) GetPlatformSecurityPolicy(w http.ResponseWriter, r *http.Request) {
	policy, err := h.service.GetPlatformSecurityPolicy(r.Context())
	if err != nil {
		http.Error(w, "Failed to load security policy", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(policy)
}

func (h *Handler) UpdatePlatformMFAPolicy(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	var req tenant.UpdatePlatformMFAPolicyParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	updated, err := h.service.UpdatePlatformMFAPolicy(r.Context(), req)
	if err != nil {
		http.Error(w, "Failed to update MFA policy", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.mfa_policy.update",
		ResourceType: "platform_security_policy",
		ResourceID:   "security.internal_mfa_policy",
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) GetPlatformBreakGlassPolicy(w http.ResponseWriter, r *http.Request) {
	policy, err := h.service.GetPlatformBreakGlassPolicy(r.Context())
	if err != nil {
		http.Error(w, "Failed to load break-glass policy", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(policy)
}

func (h *Handler) UpdatePlatformBreakGlassPolicy(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	var req tenant.UpdatePlatformBreakGlassPolicyParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	updated, err := h.service.UpdatePlatformBreakGlassPolicy(r.Context(), req)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidBreakGlassDuration) {
			http.Error(w, "Invalid break-glass policy", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to update break-glass policy", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.break_glass.policy.update",
		ResourceType: "platform_security_policy",
		ResourceID:   "security.break_glass_policy",
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ActivateBreakGlass(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	var req tenant.BreakGlassActivationParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.ActorUserID = actorID

	result, err := h.service.ActivateBreakGlass(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidBreakGlassReason):
			http.Error(w, "Break-glass reason is required", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidBreakGlassDuration):
			http.Error(w, "Invalid break-glass duration", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrBreakGlassTicketRequired):
			http.Error(w, "Ticket reference is required by break-glass policy", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrBreakGlassDisabled):
			http.Error(w, "Break-glass policy is disabled", http.StatusForbidden)
		case errors.Is(err, tenant.ErrBreakGlassCooldown):
			http.Error(w, "Break-glass request is in cooldown", http.StatusTooManyRequests)
		default:
			http.Error(w, "Failed to activate break-glass access", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.break_glass.activate",
		ResourceType: "platform_break_glass",
		ResourceID:   result.ApprovalID,
		Reason:       strings.TrimSpace(result.Reason),
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) ListBreakGlassEvents(w http.ResponseWriter, r *http.Request) {
	limit := int32(100)
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}
	offset := int32(0)
	if raw := strings.TrimSpace(r.URL.Query().Get("offset")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			offset = int32(parsed)
		}
	}

	rows, err := h.service.ListBreakGlassEvents(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to load break-glass events", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) ListPlatformAuditLogs(w http.ResponseWriter, r *http.Request) {
	qp := r.URL.Query()

	limit := int32(100)
	if raw := strings.TrimSpace(qp.Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}
	offset := int32(0)
	if raw := strings.TrimSpace(qp.Get("offset")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			offset = int32(parsed)
		}
	}

	var createdFrom *time.Time
	if raw := strings.TrimSpace(qp.Get("created_from")); raw != "" {
		parsed, err := parseDateOrRFC3339(raw, false)
		if err != nil {
			http.Error(w, "invalid created_from", http.StatusBadRequest)
			return
		}
		createdFrom = &parsed
	}

	var createdTo *time.Time
	if raw := strings.TrimSpace(qp.Get("created_to")); raw != "" {
		parsed, err := parseDateOrRFC3339(raw, true)
		if err != nil {
			http.Error(w, "invalid created_to", http.StatusBadRequest)
			return
		}
		createdTo = &parsed
	}

	rows, err := h.service.ListPlatformAuditLogs(r.Context(), tenant.PlatformAuditLogFilters{
		TenantID:    strings.TrimSpace(qp.Get("tenant_id")),
		UserID:      strings.TrimSpace(qp.Get("user_id")),
		Action:      strings.TrimSpace(qp.Get("action")),
		CreatedFrom: createdFrom,
		CreatedTo:   createdTo,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "invalid tenant_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "invalid user_id", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to load audit logs", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) ExportPlatformAuditLogs(w http.ResponseWriter, r *http.Request) {
	qp := r.URL.Query()

	format := strings.ToLower(strings.TrimSpace(qp.Get("format")))
	if format == "" {
		format = "csv"
	}
	if format != "csv" && format != "json" {
		http.Error(w, "invalid format, expected csv or json", http.StatusBadRequest)
		return
	}

	limit := int32(1000)
	if raw := strings.TrimSpace(qp.Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}
	offset := int32(0)
	if raw := strings.TrimSpace(qp.Get("offset")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			offset = int32(parsed)
		}
	}

	var createdFrom *time.Time
	if raw := strings.TrimSpace(qp.Get("created_from")); raw != "" {
		parsed, err := parseDateOrRFC3339(raw, false)
		if err != nil {
			http.Error(w, "invalid created_from", http.StatusBadRequest)
			return
		}
		createdFrom = &parsed
	}

	var createdTo *time.Time
	if raw := strings.TrimSpace(qp.Get("created_to")); raw != "" {
		parsed, err := parseDateOrRFC3339(raw, true)
		if err != nil {
			http.Error(w, "invalid created_to", http.StatusBadRequest)
			return
		}
		createdTo = &parsed
	}

	rows, err := h.service.ListPlatformAuditLogs(r.Context(), tenant.PlatformAuditLogFilters{
		TenantID:    strings.TrimSpace(qp.Get("tenant_id")),
		UserID:      strings.TrimSpace(qp.Get("user_id")),
		Action:      strings.TrimSpace(qp.Get("action")),
		CreatedFrom: createdFrom,
		CreatedTo:   createdTo,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "invalid tenant_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "invalid user_id", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to export audit logs", http.StatusInternalServerError)
		}
		return
	}

	masked := make([]tenant.PlatformAuditLogRow, 0, len(rows))
	for _, row := range rows {
		masked = append(masked, maskPlatformAuditLogRow(row))
	}

	filename := fmt.Sprintf("platform_audit_logs_%s.%s", time.Now().UTC().Format("20060102_150405"), format)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))

	if format == "json" {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(masked)
		return
	}

	var out bytes.Buffer
	writer := csv.NewWriter(&out)
	_ = writer.Write([]string{
		"id",
		"created_at",
		"tenant_id",
		"tenant_name",
		"user_id",
		"user_name",
		"user_email_masked",
		"action",
		"resource_type",
		"resource_id",
		"reason_code",
		"request_id",
		"ip_address_masked",
	})
	for _, row := range masked {
		_ = writer.Write([]string{
			strconv.FormatInt(row.ID, 10),
			row.CreatedAt.UTC().Format(time.RFC3339),
			row.TenantID,
			row.TenantName,
			row.UserID,
			row.UserName,
			row.UserEmail,
			row.Action,
			row.ResourceType,
			row.ResourceID,
			row.ReasonCode,
			row.RequestID,
			row.IPAddress,
		})
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		http.Error(w, "Failed to encode CSV", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	_, _ = w.Write(out.Bytes())
}

func maskPlatformAuditLogRow(row tenant.PlatformAuditLogRow) tenant.PlatformAuditLogRow {
	row.UserEmail = maskAuditEmail(row.UserEmail)
	row.IPAddress = maskAuditIPAddress(row.IPAddress)
	return row
}

func maskAuditEmail(raw string) string {
	email := strings.TrimSpace(raw)
	if email == "" {
		return ""
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}

	local := parts[0]
	domain := parts[1]
	if len(local) <= 1 {
		return "*@" + domain
	}
	if len(local) == 2 {
		return local[:1] + "*@" + domain
	}
	return local[:1] + strings.Repeat("*", len(local)-2) + local[len(local)-1:] + "@" + domain
}

func maskAuditIPAddress(raw string) string {
	ipRaw := strings.TrimSpace(raw)
	if ipRaw == "" {
		return ""
	}

	parsed := net.ParseIP(ipRaw)
	if parsed == nil {
		return "***"
	}

	if v4 := parsed.To4(); v4 != nil {
		return fmt.Sprintf("%d.%d.%d.x", v4[0], v4[1], v4[2])
	}

	segments := strings.Split(parsed.String(), ":")
	if len(segments) >= 2 {
		return segments[0] + ":" + segments[1] + ":****:****"
	}
	return "****"
}

func (h *Handler) ListPlatformSecurityEvents(w http.ResponseWriter, r *http.Request) {
	qp := r.URL.Query()

	limit := int32(100)
	if raw := strings.TrimSpace(qp.Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}
	offset := int32(0)
	if raw := strings.TrimSpace(qp.Get("offset")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			offset = int32(parsed)
		}
	}

	var createdFrom *time.Time
	if raw := strings.TrimSpace(qp.Get("created_from")); raw != "" {
		parsed, err := parseDateOrRFC3339(raw, false)
		if err != nil {
			http.Error(w, "invalid created_from", http.StatusBadRequest)
			return
		}
		createdFrom = &parsed
	}

	var createdTo *time.Time
	if raw := strings.TrimSpace(qp.Get("created_to")); raw != "" {
		parsed, err := parseDateOrRFC3339(raw, true)
		if err != nil {
			http.Error(w, "invalid created_to", http.StatusBadRequest)
			return
		}
		createdTo = &parsed
	}

	rows, err := h.service.ListPlatformSecurityEvents(r.Context(), tenant.PlatformSecurityEventFilters{
		TenantID:    strings.TrimSpace(qp.Get("tenant_id")),
		UserID:      strings.TrimSpace(qp.Get("user_id")),
		EventType:   strings.TrimSpace(firstNonEmpty(qp.Get("event_type"), qp.Get("type"))),
		Severity:    strings.TrimSpace(qp.Get("severity")),
		CreatedFrom: createdFrom,
		CreatedTo:   createdTo,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "invalid tenant_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "invalid user_id", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to load security events", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) GetPlatformDataRetentionPolicy(w http.ResponseWriter, r *http.Request) {
	policy, err := h.service.GetPlatformDataRetentionPolicy(r.Context())
	if err != nil {
		http.Error(w, "Failed to load data retention policy", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(policy)
}

func (h *Handler) UpdatePlatformDataRetentionPolicy(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	var req tenant.UpdatePlatformDataRetentionPolicyParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	updated, err := h.service.UpdatePlatformDataRetentionPolicy(r.Context(), req)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidRetentionPolicy) {
			http.Error(w, "Invalid retention policy", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to update data retention policy", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.retention_policy.update",
		ResourceType: "platform_security_policy",
		ResourceID:   "security.data_retention_policy",
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListPlatformPayments(w http.ResponseWriter, r *http.Request) {
	limit := int32(100)
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		if parsed, err := strconv.Atoi(rawLimit); err == nil {
			limit = int32(parsed)
		}
	}

	payments, err := h.service.ListPlatformPayments(r.Context(), limit)
	if err != nil {
		http.Error(w, "Failed to load platform payments", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(payments)
}

func (h *Handler) GetPlatformBillingOverview(w http.ResponseWriter, r *http.Request) {
	overview, err := h.service.GetPlatformBillingOverview(r.Context())
	if err != nil {
		http.Error(w, "Failed to load billing overview", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(overview)
}

func (h *Handler) GetPlatformBillingConfig(w http.ResponseWriter, r *http.Request) {
	config, err := h.service.GetPlatformBillingConfig(r.Context())
	if err != nil {
		http.Error(w, "Failed to load billing config", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(config)
}

func (h *Handler) UpdatePlatformBillingConfig(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	var req tenant.UpdatePlatformBillingConfigParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	updated, err := h.service.UpdatePlatformBillingConfig(r.Context(), req)
	if err != nil {
		http.Error(w, "Failed to update billing config", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.billing.config.update",
		ResourceType: "platform_billing_config",
		ResourceID:   "billing_config",
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListPlatformInvoices(w http.ResponseWriter, r *http.Request) {
	limit := int32(100)
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}
	offset := int32(0)
	if raw := r.URL.Query().Get("offset"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			offset = int32(parsed)
		}
	}

	rows, err := h.service.ListPlatformInvoices(r.Context(), tenant.ListPlatformInvoicesFilters{
		TenantID: r.URL.Query().Get("tenant_id"),
		Status:   r.URL.Query().Get("status"),
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		http.Error(w, "Failed to load platform invoices", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformInvoice(w http.ResponseWriter, r *http.Request) {
	var req tenant.CreatePlatformInvoiceParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = middleware.GetUserID(r.Context())

	created, err := h.service.CreatePlatformInvoice(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidInvoicePayload):
			http.Error(w, "Invalid invoice payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create platform invoice", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), req.CreatedBy, tenant.PlatformAuditEntry{
		TenantID:     created.TenantID,
		Action:       "platform.invoice.create",
		ResourceType: "platform_invoice",
		ResourceID:   created.ID,
		Reason:       created.InvoiceNumber,
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) ResendPlatformInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")
	actorID := middleware.GetUserID(r.Context())

	row, err := h.service.ResendPlatformInvoice(r.Context(), invoiceID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidInvoiceID):
			http.Error(w, "Invalid invoice id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvoiceNotFound):
			http.Error(w, "Invoice not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to resend invoice", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     row.TenantID,
		Action:       "platform.invoice.resend",
		ResourceType: "platform_invoice",
		ResourceID:   row.ID,
		Reason:       row.InvoiceNumber,
		After:        row,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(row)
}

func (h *Handler) MarkPlatformInvoicePaid(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.MarkPlatformInvoicePaidParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	row, err := h.service.MarkPlatformInvoicePaid(r.Context(), invoiceID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidInvoiceID):
			http.Error(w, "Invalid invoice id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidInvoicePayload):
			http.Error(w, "Invalid invoice payment payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvoiceNotFound):
			http.Error(w, "Invoice not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to mark invoice paid", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     row.TenantID,
		Action:       "platform.invoice.mark_paid",
		ResourceType: "platform_invoice",
		ResourceID:   row.ID,
		Reason:       strings.TrimSpace(req.PaymentMode),
		After: map[string]any{
			"invoice": row,
			"payment": req,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(row)
}

func (h *Handler) ExportPlatformInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")
	row, err := h.service.ExportPlatformInvoice(r.Context(), invoiceID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidInvoiceID):
			http.Error(w, "Invalid invoice id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvoiceNotFound):
			http.Error(w, "Invoice not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to export invoice", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"invoice":   row,
		"exported":  true,
		"format":    "json",
		"timestamp": time.Now().UTC(),
	})
}

func (h *Handler) ListPlatformInvoiceAdjustments(w http.ResponseWriter, r *http.Request) {
	limit := int32(100)
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = int32(parsed)
		}
	}
	offset := int32(0)
	if raw := r.URL.Query().Get("offset"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			offset = int32(parsed)
		}
	}

	rows, err := h.service.ListPlatformInvoiceAdjustments(r.Context(), tenant.ListPlatformInvoiceAdjustmentsFilters{
		InvoiceID:      r.URL.Query().Get("invoice_id"),
		TenantID:       r.URL.Query().Get("tenant_id"),
		AdjustmentType: r.URL.Query().Get("adjustment_type"),
		Status:         r.URL.Query().Get("status"),
		Limit:          limit,
		Offset:         offset,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidInvoiceID):
			http.Error(w, "Invalid invoice id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to load invoice adjustments", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformInvoiceRefund(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreatePlatformInvoiceRefundParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	result, err := h.service.CreatePlatformInvoiceRefund(r.Context(), invoiceID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidInvoiceID):
			http.Error(w, "Invalid invoice id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidAdjustmentPayload):
			http.Error(w, "Invalid refund payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvoiceNotFound):
			http.Error(w, "Invoice not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to create refund", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     result.Invoice.TenantID,
		Action:       "platform.invoice.refund.create",
		ResourceType: "platform_invoice",
		ResourceID:   result.Invoice.ID,
		Reason:       strings.TrimSpace(req.Reason),
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) CreatePlatformCreditNote(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreatePlatformCreditNoteParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	result, err := h.service.CreatePlatformCreditNote(r.Context(), invoiceID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidInvoiceID):
			http.Error(w, "Invalid invoice id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidAdjustmentPayload):
			http.Error(w, "Invalid credit note payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvoiceNotFound):
			http.Error(w, "Invoice not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to create credit note", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     result.Invoice.TenantID,
		Action:       "platform.invoice.credit_note.create",
		ResourceType: "platform_invoice",
		ResourceID:   result.Invoice.ID,
		Reason:       strings.TrimSpace(req.Reason),
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) UpdateTenantLifecycle(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.TenantLifecycleParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = middleware.GetUserID(r.Context())

	if err := h.service.UpsertTenantLifecycle(r.Context(), tenantID, req); err != nil {
		if errors.Is(err, tenant.ErrInvalidLifecycleStatus) {
			http.Error(w, "Invalid lifecycle status", http.StatusBadRequest)
			return
		}
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to update lifecycle", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.lifecycle.update",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		Reason:       strings.TrimSpace(req.Status),
		After: map[string]any{
			"status": strings.TrimSpace(req.Status),
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}

func (h *Handler) ManageTenantTrialLifecycle(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.TenantTrialLifecycleParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	result, err := h.service.ManageTenantTrialLifecycle(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidTrialAction):
			http.Error(w, "Invalid trial action", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to manage tenant trial lifecycle", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.trial.lifecycle",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		Reason:       strings.TrimSpace(req.Action),
		After: map[string]any{
			"action":           strings.TrimSpace(req.Action),
			"days":             req.Days,
			"renew_after_days": req.RenewAfterDays,
			"result":           result,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) GetTenantBillingControls(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	controls, err := h.service.GetTenantBillingControls(r.Context(), tenantID)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to load billing controls", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(controls)
}

func (h *Handler) UpdateTenantDunningRules(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.TenantDunningRulesParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	result, err := h.service.UpdateTenantDunningRules(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidDunningRules):
			http.Error(w, "Invalid dunning rules payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update dunning rules", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.billing.dunning_rules.update",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) ManageTenantBillingLock(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.TenantBillingLockParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	result, err := h.service.ManageTenantBillingLock(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidBillingLock):
			http.Error(w, "Invalid billing lock action", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update billing lock controls", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.billing.lock.manage",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		Reason:       strings.TrimSpace(req.Action),
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) UpdateTenantDefaults(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())
	var req tenant.TenantDefaultsParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateTenantDefaults(r.Context(), tenantID, req); err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to update tenant defaults", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.defaults.update",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After:        req,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}

func (h *Handler) AssignTenantPlan(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	var req tenant.AssignPlanParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = middleware.GetUserID(r.Context())

	if err := h.service.AssignPlanToTenant(r.Context(), tenantID, req); err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlanCode):
			http.Error(w, "Invalid plan code", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrCriticalModuleLocked):
			http.Error(w, "Critical compliance module cannot be disabled", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlanNotFound):
			http.Error(w, "Plan not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to assign plan", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), req.UpdatedBy, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.plan.assign",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		Reason:       strings.TrimSpace(req.PlanCode),
		After: map[string]any{
			"plan_code":     strings.TrimSpace(req.PlanCode),
			"limits":        req.Limits,
			"modules":       req.Modules,
			"feature_flags": req.Flags,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}

func (h *Handler) ChangeTenantPlan(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	var req tenant.TenantPlanChangeParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = middleware.GetUserID(r.Context())

	result, err := h.service.ChangeTenantPlan(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlanCode):
			http.Error(w, "Invalid plan code", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlanNotFound):
			http.Error(w, "Plan not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrInvalidProrationPolicy):
			http.Error(w, "Invalid proration policy", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to change tenant plan", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), req.UpdatedBy, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.plan.change",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		Reason:       strings.TrimSpace(req.ProrationPolicy),
		After: map[string]any{
			"reason": req.Reason,
			"result": result,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) UpsertTenantLimitOverride(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	var req tenant.TenantLimitOverrideParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = middleware.GetUserID(r.Context())

	result, err := h.service.UpsertTenantLimitOverride(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidLimitOverride):
			http.Error(w, "Invalid limit override payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update tenant limit override", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), req.UpdatedBy, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.limit_override.upsert",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		Reason:       strings.TrimSpace(result.LimitKey),
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) UpdateTenantBranding(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.TenantBrandingParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdateTenantBranding(r.Context(), tenantID, req)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to update tenant branding", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.branding.update",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) UpdateTenantDomainMapping(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())
	var req tenant.DomainMappingParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdateTenantDomainMapping(r.Context(), tenantID, req)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to update domain mapping", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.domain.update",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After: map[string]any{
			"domain":       strings.TrimSpace(req.Domain),
			"cname_target": strings.TrimSpace(req.CnameTarget),
			"ssl_status":   strings.TrimSpace(req.SslStatus),
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ResetTenantAdminPassword(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())
	var req struct {
		NewPassword string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updatedRows, err := h.service.ResetTenantAdminPassword(r.Context(), tenantID, req.NewPassword)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrWeakPassword):
			http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to reset tenant admin password", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.admin_password.reset",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After: map[string]any{
			"updated_rows": updatedRows,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":       "ok",
		"updated_rows": updatedRows,
	})
}

func (h *Handler) ForceLogoutTenantUsers(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())
	revoked, err := h.service.ForceLogoutTenantUsers(r.Context(), tenantID)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to force logout tenant users", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.force_logout",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After: map[string]any{
			"revoked_count": revoked,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":        "ok",
		"revoked_count": revoked,
	})
}

func (h *Handler) ImpersonateTenantAdmin(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	var req tenant.ImpersonationParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	result, err := h.service.CreateImpersonationToken(
		r.Context(),
		tenantID,
		req.Reason,
		req.DurationMinutes,
		middleware.GetUserID(r.Context()),
	)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidReason):
			http.Error(w, "Impersonation reason is required", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrImpersonationTarget):
			http.Error(w, "No tenant admin available for impersonation", http.StatusNotFound)
		default:
			http.Error(w, "Failed to create impersonation token", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) LogImpersonationExit(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.ImpersonationExitParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.LogImpersonationExit(r.Context(), tenantID, actorID, req); err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to log impersonation exit", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}

func (h *Handler) ListSignupRequests(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	limit := int32(100)
	if rawLimit := r.URL.Query().Get("limit"); rawLimit != "" {
		if parsed, err := strconv.Atoi(rawLimit); err == nil {
			limit = int32(parsed)
		}
	}

	rows, err := h.service.ListSignupRequests(r.Context(), status, limit)
	if err != nil {
		http.Error(w, "Failed to load signup requests", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) ReviewSignupRequest(w http.ResponseWriter, r *http.Request) {
	signupID := chi.URLParam(r, "signup_id")
	var req tenant.ReviewSignupRequestParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.ReviewedBy = middleware.GetUserID(r.Context())

	if err := h.service.ReviewSignupRequest(r.Context(), signupID, req); err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSignupStatus):
			http.Error(w, "Invalid signup review status", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSignupRequestNotFound):
			http.Error(w, "Signup request not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to review signup request", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}
