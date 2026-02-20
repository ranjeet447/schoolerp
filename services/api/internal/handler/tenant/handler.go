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
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/foundation/security"
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
	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:tenant.read"))
		r.Get("/plans", h.ListPlatformPlans)
		r.Get("/signup-requests", h.ListSignupRequests)
		r.Get("/incidents", h.ListPlatformIncidents)
		r.Get("/incidents/{incident_id}", h.GetPlatformIncident)
		r.Get("/tenants", h.ListPlatformTenants)
		r.Get("/tenants/{tenant_id}", h.GetPlatformTenant)
		r.Get("/tenants/{tenant_id}/billing-controls", h.GetTenantBillingControls)
		r.Get("/tenants/{tenant_id}/branches", h.ListTenantBranches)
		r.Get("/tenants/{tenant_id}/exports", h.ListTenantDataExports)
		r.Get("/tenants/{tenant_id}/exports/{export_id}/download", h.DownloadTenantDataExport)
		r.Get("/tenants/{tenant_id}/deletion-requests", h.ListTenantDeletionRequests)
		r.Get("/legal/docs", h.ListPlatformLegalDocs)
		r.Get("/support/tickets", h.ListPlatformSupportTickets)
		r.Get("/support/tickets/{ticket_id}/notes", h.ListPlatformSupportTicketNotes)
		r.Get("/support/sla/policy", h.GetPlatformSupportSLAPolicy)
		r.Get("/support/sla/overview", h.GetPlatformSupportSLAOverview)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:tenant.write"))
		r.Post("/plans", h.CreatePlatformPlan)
		r.Patch("/plans/{plan_id}", h.UpdatePlatformPlan)
		r.Post("/plans/{plan_id}/clone", h.ClonePlatformPlan)
		r.Post("/feature-rollouts", h.RolloutFeatureFlag)
		r.Post("/signup-requests/{signup_id}/review", h.ReviewSignupRequest)
		r.Post("/incidents", h.CreatePlatformIncident)
		r.Patch("/incidents/{incident_id}", h.UpdatePlatformIncident)
		r.Post("/incidents/{incident_id}/events", h.CreatePlatformIncidentEvent)
		r.Post("/incidents/{incident_id}/limit-overrides", h.ApplyIncidentLimitOverride)
		r.Post("/incidents/{incident_id}/broadcasts", h.CreatePlatformIncidentBroadcast)
		r.Post("/incidents/{incident_id}/billing-freeze", h.ApplyIncidentBillingFreeze)
		r.Patch("/tenants/{tenant_id}", h.UpdatePlatformTenant)
		r.Post("/tenants/{tenant_id}/lifecycle", h.UpdateTenantLifecycle)
		r.Post("/tenants/{tenant_id}/trial", h.ManageTenantTrialLifecycle)
		r.Post("/tenants/{tenant_id}/billing-freeze", h.ManageTenantBillingFreeze)
		r.Post("/tenants/{tenant_id}/dunning-rules", h.UpdateTenantDunningRules)
		r.Post("/tenants/{tenant_id}/billing-lock", h.ManageTenantBillingLock)
		r.Post("/tenants/{tenant_id}/defaults", h.UpdateTenantDefaults)
		r.Post("/tenants/{tenant_id}/plan", h.AssignTenantPlan)
		r.Post("/tenants/{tenant_id}/plan-change", h.ChangeTenantPlan)
		r.Post("/tenants/{tenant_id}/limit-overrides", h.UpsertTenantLimitOverride)
		r.Post("/tenants/{tenant_id}/branding", h.UpdateTenantBranding)
		r.Post("/tenants/{tenant_id}/domain", h.UpdateTenantDomainMapping)
		r.Post("/tenants/{tenant_id}/domain/verify", h.VerifyTenantDomainMapping)
		r.Post("/tenants/{tenant_id}/domain/ssl", h.ProvisionTenantDomainSSL)
		r.Post("/tenants/{tenant_id}/reset-admin-password", h.ResetTenantAdminPassword)
		r.Post("/tenants/{tenant_id}/force-logout", h.ForceLogoutTenantUsers)
		r.Post("/tenants/{tenant_id}/impersonate", h.ImpersonateTenantAdmin)
		r.Post("/tenants/{tenant_id}/impersonation-exit", h.LogImpersonationExit)
		r.Post("/tenants/{tenant_id}/branches", h.CreateTenantBranch)
		r.Patch("/tenants/{tenant_id}/branches/{branch_id}", h.UpdateTenantBranch)
		r.Post("/tenants/{tenant_id}/exports", h.CreateTenantDataExport)
		r.Post("/tenants/{tenant_id}/deletion-requests", h.CreateTenantDeletionRequest)
		r.Post("/tenants/{tenant_id}/deletion-requests/{request_id}/review", h.ReviewTenantDeletionRequest)
		r.Post("/tenants/{tenant_id}/deletion-requests/{request_id}/execute", h.ExecuteTenantDeletionRequest)
		r.Post("/legal/docs", h.CreatePlatformLegalDocVersion)
		r.Post("/support/tickets", h.CreatePlatformSupportTicket)
		r.Patch("/support/tickets/{ticket_id}", h.UpdatePlatformSupportTicket)
		r.Post("/support/tickets/{ticket_id}/notes", h.CreatePlatformSupportTicketNote)
		r.Post("/support/sla/policy", h.UpdatePlatformSupportSLAPolicy)
		r.Post("/support/sla/escalations/run", h.RunPlatformSupportSLAEscalations)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:user.read"))
		r.Get("/internal-users", h.ListPlatformInternalUsers)
		r.Get("/internal-users/{user_id}/sessions", h.ListPlatformInternalUserSessions)

		// Global User Management
		r.Get("/users", h.ListGlobalUsers)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:user.write"))
		r.Post("/internal-users", h.CreatePlatformInternalUser)
		r.Patch("/internal-users/{user_id}", h.UpdatePlatformInternalUser)
		//		r.Post("/internal-users/{user_id}/rotate-credentials", h.RotatePlatformInternalUserCredentials)
		r.Post("/internal-users/{user_id}/revoke-sessions", h.RevokePlatformInternalUserSessions)

		// Global User Management Actions
		r.Post("/users/{user_id}/impersonate", h.ImpersonateGlobalUser)
		r.Post("/users/{user_id}/reset-password", h.ResetGlobalUserPassword)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:settings.write"))
		r.Get("/rbac/templates", h.ListPlatformRBACTemplates)
		r.Post("/rbac/templates/{role_code}/permissions", h.UpdatePlatformRolePermissions)
		r.Get("/access/policies", h.GetPlatformSecurityPolicy)
		r.Post("/access/policies/mfa", h.UpdatePlatformMFAPolicy)
		r.Get("/access/break-glass/policy", h.GetPlatformBreakGlassPolicy)
		r.Post("/access/break-glass/policy", h.UpdatePlatformBreakGlassPolicy)
		r.Get("/security/retention-policy", h.GetPlatformDataRetentionPolicy)
		r.Post("/security/retention-policy", h.UpdatePlatformDataRetentionPolicy)
		r.Get("/security/password-policy", h.GetPlatformPasswordPolicy)
		r.Post("/security/password-policy", h.UpdatePlatformPasswordPolicy)
		r.Get("/settings/notifications", h.GetPlatformNotificationSettings)
		r.Post("/settings/notifications", h.UpdatePlatformNotificationSettings)
		r.Get("/settings/notification-templates", h.ListNotificationTemplates)
		r.Get("/settings/document-templates", h.ListDocumentTemplates)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:ops.manage"))
		r.Get("/access/ip-allowlist", h.ListPlatformIPAllowlist)
		r.Post("/access/ip-allowlist", h.CreatePlatformIPAllowlist)
		r.Delete("/access/ip-allowlist/{allowlist_id}", h.DeletePlatformIPAllowlist)
		r.Post("/access/break-glass/activate", h.ActivateBreakGlass)
		r.Get("/access/break-glass/events", h.ListBreakGlassEvents)
		r.Get("/monitoring/health", h.GetPlatformHealth)
		r.Get("/monitoring/queue", h.GetQueueHealth)
		r.Get("/integrations/webhooks", h.ListPlatformWebhooks)
		r.Get("/integrations/logs", h.ListIntegrationLogs)
		r.Get("/integrations/health", h.GetIntegrationHealth)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:audit.read"))
		r.Get("/security/audit-logs/export", h.ExportPlatformAuditLogs)
		r.Get("/security/audit-logs", h.ListPlatformAuditLogs)
		r.Get("/security/events", h.ListPlatformSecurityEvents)
		r.Get("/security/blocks", h.ListPlatformSecurityBlocks)
		r.Post("/security/blocks", h.CreatePlatformSecurityBlock)
		r.Post("/security/blocks/{block_id}/release", h.ReleasePlatformSecurityBlock)
		r.Get("/security/secrets/status", h.GetPlatformSecretsStatus)
		r.Get("/security/secret-rotations", h.ListPlatformSecretRotationRequests)
		r.Post("/security/secret-rotations", h.CreatePlatformSecretRotationRequest)
		r.Post("/security/secret-rotations/{rotation_id}/review", h.ReviewPlatformSecretRotationRequest)
		r.Post("/security/secret-rotations/{rotation_id}/execute", h.ExecutePlatformSecretRotationRequest)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:billing.read"))
		r.Get("/billing/overview", h.GetPlatformBillingOverview)
		r.Get("/billing/config", h.GetPlatformBillingConfig)
		r.Get("/invoices", h.ListPlatformInvoices)
		r.Get("/invoices/{invoice_id}/export", h.ExportPlatformInvoice)
		r.Get("/invoice-adjustments", h.ListPlatformInvoiceAdjustments)
		r.Get("/payments", h.ListPlatformPayments)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:billing.write"))
		r.Post("/billing/config", h.UpdatePlatformBillingConfig)
		r.Post("/invoices", h.CreatePlatformInvoice)
		r.Post("/invoices/{invoice_id}/resend", h.ResendPlatformInvoice)
		r.Post("/invoices/{invoice_id}/mark-paid", h.MarkPlatformInvoicePaid)
		r.Post("/invoices/{invoice_id}/refunds", h.CreatePlatformInvoiceRefund)
		r.Post("/invoices/{invoice_id}/credit-notes", h.CreatePlatformCreditNote)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:marketing.write"))
		r.Get("/marketing/announcements", h.ListAnnouncements)
		r.Post("/marketing/announcements", h.CreateAnnouncement)
		r.Get("/marketing/changelogs", h.ListChangelogs)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.PermissionGuard("platform:analytics.read"))
		r.Get("/analytics/metrics", h.GetPlatformAnalytics)
	})
}

func (h *Handler) GetConfig(w http.ResponseWriter, r *http.Request) {
	tenantID := strings.TrimSpace(middleware.GetTenantID(r.Context()))
	if tenantID == "" {
		tenantID = strings.TrimSpace(r.Header.Get("X-Tenant-ID"))
	}
	if tenantID == "" {
		http.Error(w, "tenant context missing", http.StatusBadRequest)
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
		switch {
		case errors.Is(err, tenant.ErrPasswordPolicyViolation):
			http.Error(w, "Password does not meet the platform password policy", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPasswordReuseNotAllowed):
			http.Error(w, "Password reuse is not allowed by policy", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrWhiteLabelRequired):
			http.Error(w, "Custom domains can be configured only after white-label add-on is enabled.", http.StatusForbidden)
		case errors.Is(err, tenant.ErrInvalidTenant):
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, "Failed to onboard school", http.StatusInternalServerError)
		}
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
		log.Ctx(r.Context()).
			Error().
			Err(err).
			Str("path", r.URL.Path).
			Str("query", r.URL.RawQuery).
			Msg("platform tenants list failed")
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
		ResourceID:   updated.ID,
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListTenantDataExports(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")

	limit := int32(50)
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

	rows, err := h.service.ListTenantDataExportRequests(r.Context(), tenantID, limit, offset)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to load tenant exports", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreateTenantDataExport(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreateTenantDataExportParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.RequestedBy = actorID

	created, err := h.service.CreateTenantDataExportRequest(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrExportReasonRequired):
			http.Error(w, "Export reason is required", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrExportAlreadyInProgress):
			http.Error(w, "An export is already in progress for this tenant", http.StatusConflict)
		case errors.Is(err, tenant.ErrExportHardExcludedTable):
			http.Error(w, "Export request includes restricted table(s)", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create tenant export request", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.security.tenant_export.request",
		ResourceType: "tenant_export",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(req.Reason),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) DownloadTenantDataExport(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	exportID := chi.URLParam(r, "export_id")
	actorID := middleware.GetUserID(r.Context())

	exportReq, _, err := h.service.GetTenantDataExportRequest(r.Context(), tenantID, exportID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidExportID):
			http.Error(w, "Invalid export id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrExportNotFound):
			http.Error(w, "Export request not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to load export request", http.StatusInternalServerError)
		}
		return
	}

	startedAt := time.Now().UTC()
	_ = h.service.UpdateTenantDataExportStatus(r.Context(), exportID, "running", map[string]any{
		"started_at": startedAt.Format(time.RFC3339),
		"error":      "",
	})

	filename := fmt.Sprintf("tenant_export_%s_%s.zip", strings.TrimSpace(tenantID), strings.TrimSpace(exportID))
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.WriteHeader(http.StatusOK)

	counts, totalRows, streamErr := h.service.StreamTenantDataExportZipNDJSON(r.Context(), tenantID, exportReq, w)
	if streamErr != nil {
		_ = h.service.UpdateTenantDataExportStatus(r.Context(), exportID, "failed", map[string]any{
			"completed_at": time.Now().UTC().Format(time.RFC3339),
			"error":        streamErr.Error(),
		})
		return
	}

	_ = h.service.UpdateTenantDataExportStatus(r.Context(), exportID, "completed", map[string]any{
		"completed_at": time.Now().UTC().Format(time.RFC3339),
		"tables":       counts,
		"total_rows":   totalRows,
	})

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.security.tenant_export.download",
		ResourceType: "tenant_export",
		ResourceID:   strings.TrimSpace(exportID),
		Reason:       strings.TrimSpace(exportReq.Payload.Reason),
		After: map[string]any{
			"status":     "completed",
			"total_rows": totalRows,
		},
	})
}

func (h *Handler) ListTenantDeletionRequests(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")

	limit := int32(50)
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

	rows, err := h.service.ListTenantDeletionRequests(r.Context(), tenantID, limit, offset)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to load tenant deletion requests", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreateTenantDeletionRequest(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreateTenantDeletionRequestParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.RequestedBy = actorID

	created, err := h.service.CreateTenantDeletionRequest(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrDeletionReasonRequired):
			http.Error(w, "Deletion reason is required", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrDeletionAlreadyInProgress):
			http.Error(w, "A deletion request already exists for this tenant", http.StatusConflict)
		default:
			http.Error(w, "Failed to create tenant deletion request", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.security.tenant_deletion.request",
		ResourceType: "tenant_deletion",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(req.Reason),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) ReviewTenantDeletionRequest(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	requestID := chi.URLParam(r, "request_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.ReviewTenantDeletionRequestParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.ReviewedBy = actorID

	updated, err := h.service.ReviewTenantDeletionRequest(r.Context(), tenantID, requestID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidDeletionRequestID):
			http.Error(w, "Invalid deletion request id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrDeletionRequestNotFound):
			http.Error(w, "Deletion request not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrDeletionInvalidDecision):
			http.Error(w, "Invalid review decision (use approve|reject)", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrDeletionNotPending):
			http.Error(w, "Deletion request is not pending", http.StatusConflict)
		case errors.Is(err, tenant.ErrDeletionSelfApproval):
			http.Error(w, "Cannot approve your own deletion request", http.StatusForbidden)
		default:
			http.Error(w, "Failed to review tenant deletion request", http.StatusInternalServerError)
		}
		return
	}

	action := "platform.security.tenant_deletion.review"
	if strings.EqualFold(strings.TrimSpace(req.Decision), "approve") {
		action = "platform.security.tenant_deletion.approve"
	}
	if strings.EqualFold(strings.TrimSpace(req.Decision), "reject") {
		action = "platform.security.tenant_deletion.reject"
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       action,
		ResourceType: "tenant_deletion",
		ResourceID:   strings.TrimSpace(requestID),
		Reason:       strings.TrimSpace(req.Notes),
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ExecuteTenantDeletionRequest(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	requestID := chi.URLParam(r, "request_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.ExecuteTenantDeletionParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.ExecutedBy = actorID

	if err := h.service.ExecuteTenantDeletion(r.Context(), tenantID, requestID, req); err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidDeletionRequestID):
			http.Error(w, "Invalid deletion request id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrDeletionRequestNotFound):
			http.Error(w, "Deletion request not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrDeletionConfirmationRequired):
			http.Error(w, "Deletion confirmation is required", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrDeletionInvalidConfirmation):
			http.Error(w, "Deletion confirmation did not match", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrDeletionNotApproved):
			http.Error(w, "Deletion request is not approved", http.StatusConflict)
		case errors.Is(err, tenant.ErrDeletionCooldownActive):
			http.Error(w, "Deletion request is still in cooldown", http.StatusConflict)
		case errors.Is(err, tenant.ErrDeletionAlreadyExecuted):
			http.Error(w, "Deletion request is already executed", http.StatusConflict)
		default:
			http.Error(w, "Failed to execute tenant deletion request", http.StatusInternalServerError)
		}
		return
	}

	updated, _ := h.service.GetTenantDeletionRequest(r.Context(), tenantID, requestID)
	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.security.tenant_deletion.execute",
		ResourceType: "tenant_deletion",
		ResourceID:   strings.TrimSpace(requestID),
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
		case errors.Is(err, tenant.ErrPasswordPolicyViolation):
			http.Error(w, "Password does not meet the platform password policy", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPasswordReuseNotAllowed):
			http.Error(w, "Password reuse is not allowed by policy", http.StatusBadRequest)
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

func (h *Handler) ListPlatformSecurityBlocks(w http.ResponseWriter, r *http.Request) {
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

	rows, err := h.service.ListPlatformSecurityBlocks(r.Context(), tenant.PlatformSecurityBlockFilters{
		TargetType: strings.TrimSpace(firstNonEmpty(qp.Get("target_type"), qp.Get("type"))),
		TenantID:   strings.TrimSpace(qp.Get("tenant_id")),
		UserID:     strings.TrimSpace(qp.Get("user_id")),
		Status:     strings.TrimSpace(qp.Get("status")),
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "invalid tenant_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "invalid user_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidSecurityBlockPayload):
			http.Error(w, "invalid payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to load security blocks", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformSecurityBlock(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreatePlatformSecurityBlockParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.CreatePlatformSecurityBlock(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "invalid tenant_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "invalid user_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidSecurityBlockPayload):
			http.Error(w, "Invalid security block payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create security block", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.block.create",
		ResourceType: "platform_security_block",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(created.TargetType),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) ReleasePlatformSecurityBlock(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	blockID := chi.URLParam(r, "block_id")

	var req struct {
		Notes string `json:"notes"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	updated, err := h.service.ReleasePlatformSecurityBlock(r.Context(), blockID, actorID, req.Notes)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSecurityBlockID):
			http.Error(w, "invalid block id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSecurityBlockNotFound):
			http.Error(w, "block not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to release security block", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.block.release",
		ResourceType: "platform_security_block",
		ResourceID:   updated.ID,
		Reason:       strings.TrimSpace(updated.TargetType),
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
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

func (h *Handler) GetPlatformPasswordPolicy(w http.ResponseWriter, r *http.Request) {
	policy, err := h.service.GetPlatformPasswordPolicy(r.Context())
	if err != nil {
		http.Error(w, "Failed to load password policy", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(policy)
}

func (h *Handler) UpdatePlatformPasswordPolicy(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	var req tenant.UpdatePlatformPasswordPolicyParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	updated, err := h.service.UpdatePlatformPasswordPolicy(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPasswordPolicy):
			http.Error(w, "Invalid password policy", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update password policy", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.password_policy.update",
		ResourceType: "platform_security_policy",
		ResourceID:   "security.password_policy",
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListPlatformLegalDocs(w http.ResponseWriter, r *http.Request) {
	qp := r.URL.Query()

	limit := int32(200)
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

	rows, err := h.service.ListPlatformLegalDocVersions(r.Context(), tenant.PlatformLegalDocFilters{
		DocKey:          strings.TrimSpace(firstNonEmpty(qp.Get("doc_key"), qp.Get("key"))),
		IncludeInactive: qp.Get("include_inactive") == "true",
		Limit:           limit,
		Offset:          offset,
	})
	if err != nil {
		http.Error(w, "Failed to load legal docs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformLegalDocVersion(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreatePlatformLegalDocVersionParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.CreatePlatformLegalDocVersion(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidLegalDocPayload):
			http.Error(w, "Invalid legal doc payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrLegalDocVersionExists):
			http.Error(w, "Legal doc version already exists", http.StatusConflict)
		default:
			http.Error(w, "Failed to create legal doc version", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.legal.doc_version.create",
		ResourceType: "legal_doc_version",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(created.DocKey),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) ListPlatformSupportTickets(w http.ResponseWriter, r *http.Request) {
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

	rows, err := h.service.ListPlatformSupportTickets(r.Context(), tenant.PlatformSupportTicketFilters{
		Search:     strings.TrimSpace(firstNonEmpty(qp.Get("q"), qp.Get("search"))),
		TenantID:   strings.TrimSpace(qp.Get("tenant_id")),
		Status:     strings.TrimSpace(qp.Get("status")),
		Priority:   strings.TrimSpace(qp.Get("priority")),
		AssignedTo: strings.TrimSpace(qp.Get("assigned_to")),
		Tag:        strings.TrimSpace(qp.Get("tag")),
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "invalid tenant_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "invalid assigned_to", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to load support tickets", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformSupportTicket(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreatePlatformSupportTicketParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.CreatePlatformSupportTicket(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSupportTicketPayload):
			http.Error(w, "Invalid ticket payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "invalid tenant_id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformUserID):
			http.Error(w, "invalid assigned_to", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create support ticket", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.support.ticket.create",
		ResourceType: "support_ticket",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(created.Priority),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) UpdatePlatformSupportTicket(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	ticketID := chi.URLParam(r, "ticket_id")

	var req tenant.UpdatePlatformSupportTicketParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.service.UpdatePlatformSupportTicket(r.Context(), ticketID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSupportTicketID):
			http.Error(w, "invalid ticket id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidSupportTicketPayload):
			http.Error(w, "Invalid ticket payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSupportTicketNotFound):
			http.Error(w, "ticket not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to update support ticket", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.support.ticket.update",
		ResourceType: "support_ticket",
		ResourceID:   updated.ID,
		Reason:       strings.TrimSpace(updated.Status),
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ListPlatformSupportTicketNotes(w http.ResponseWriter, r *http.Request) {
	ticketID := chi.URLParam(r, "ticket_id")

	rows, err := h.service.ListPlatformSupportTicketNotes(r.Context(), ticketID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSupportTicketID):
			http.Error(w, "invalid ticket id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSupportTicketNotFound):
			http.Error(w, "ticket not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to load ticket notes", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformSupportTicketNote(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	ticketID := chi.URLParam(r, "ticket_id")

	var req tenant.CreatePlatformSupportTicketNoteParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.CreatePlatformSupportTicketNote(r.Context(), ticketID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSupportTicketID):
			http.Error(w, "invalid ticket id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidSupportTicketNotePayload):
			http.Error(w, "Invalid note payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSupportTicketNotFound):
			http.Error(w, "ticket not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to create ticket note", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.support.ticket_note.create",
		ResourceType: "support_ticket_note",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(created.NoteType),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) ListPlatformIncidents(w http.ResponseWriter, r *http.Request) {
	qp := r.URL.Query()

	limit := int32(50)
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

	rows, err := h.service.ListPlatformIncidents(r.Context(), tenant.PlatformIncidentFilters{
		Search:   strings.TrimSpace(firstNonEmpty(qp.Get("q"), qp.Get("search"))),
		Status:   strings.TrimSpace(qp.Get("status")),
		Severity: strings.TrimSpace(qp.Get("severity")),
		Scope:    strings.TrimSpace(qp.Get("scope")),
		TenantID: strings.TrimSpace(qp.Get("tenant_id")),
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "invalid tenant_id", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to load incidents", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformIncident(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreatePlatformIncidentParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.CreatePlatformIncident(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentPayload):
			http.Error(w, "Invalid incident payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create incident", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.incident.create",
		ResourceType: "platform_incident",
		ResourceID:   created.Incident.ID,
		Reason:       strings.TrimSpace(created.Incident.Severity),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) GetPlatformIncident(w http.ResponseWriter, r *http.Request) {
	incidentID := chi.URLParam(r, "incident_id")

	detail, err := h.service.GetPlatformIncidentDetail(r.Context(), incidentID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentID):
			http.Error(w, "invalid incident id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformIncidentNotFound):
			http.Error(w, "incident not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to load incident", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(detail)
}

func (h *Handler) UpdatePlatformIncident(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	incidentID := chi.URLParam(r, "incident_id")

	var req tenant.UpdatePlatformIncidentParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	before, after, err := h.service.UpdatePlatformIncident(r.Context(), incidentID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentID):
			http.Error(w, "invalid incident id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentPayload):
			http.Error(w, "Invalid incident payload", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformIncidentNotFound):
			http.Error(w, "incident not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to update incident", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.incident.update",
		ResourceType: "platform_incident",
		ResourceID:   after.Incident.ID,
		Reason:       strings.TrimSpace(after.Incident.Status),
		Before:       before,
		After:        after,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(after)
}

func (h *Handler) CreatePlatformIncidentEvent(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	incidentID := chi.URLParam(r, "incident_id")

	var req tenant.CreatePlatformIncidentEventParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.CreatePlatformIncidentEvent(r.Context(), incidentID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentID):
			http.Error(w, "invalid incident id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformIncidentNotFound):
			http.Error(w, "incident not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentEventPayload):
			http.Error(w, "Invalid incident event payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create incident event", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.incident.event.create",
		ResourceType: "platform_incident_event",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(created.EventType),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) ApplyIncidentLimitOverride(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	incidentID := chi.URLParam(r, "incident_id")

	var req tenant.IncidentLimitOverrideParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	result, err := h.service.ApplyIncidentLimitOverride(r.Context(), incidentID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentID):
			http.Error(w, "invalid incident id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformIncidentNotFound):
			http.Error(w, "incident not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrInvalidLimitOverride), errors.Is(err, tenant.ErrInvalidReason):
			http.Error(w, "Invalid limit override payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to apply limit override", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.incident.limit_override.apply",
		ResourceType: "platform_incident",
		ResourceID:   result.IncidentID,
		Reason:       strings.TrimSpace(req.Reason),
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) CreatePlatformIncidentBroadcast(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	incidentID := chi.URLParam(r, "incident_id")

	var req tenant.CreatePlatformIncidentBroadcastParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.CreatedBy = actorID

	created, err := h.service.CreatePlatformIncidentBroadcast(r.Context(), incidentID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentID):
			http.Error(w, "invalid incident id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformIncidentNotFound):
			http.Error(w, "incident not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrInvalidPlatformBroadcastPayload):
			http.Error(w, "Invalid broadcast payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to create broadcast", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.incident.broadcast.create",
		ResourceType: "platform_broadcast",
		ResourceID:   created.ID,
		Reason:       strings.Join(created.Channels, ","),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) ApplyIncidentBillingFreeze(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	incidentID := chi.URLParam(r, "incident_id")

	var req tenant.IncidentBillingFreezeParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	result, err := h.service.ApplyIncidentBillingFreeze(r.Context(), incidentID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidPlatformIncidentID):
			http.Error(w, "invalid incident id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPlatformIncidentNotFound):
			http.Error(w, "incident not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrInvalidBillingFreeze), errors.Is(err, tenant.ErrInvalidReason):
			http.Error(w, "Invalid billing freeze payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to apply billing freeze", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.incident.billing_freeze.apply",
		ResourceType: "platform_incident",
		ResourceID:   result.IncidentID,
		Reason:       strings.TrimSpace(req.Reason),
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) GetPlatformSupportSLAPolicy(w http.ResponseWriter, r *http.Request) {
	policy, err := h.service.GetPlatformSupportSLAPolicy(r.Context())
	if err != nil {
		http.Error(w, "Failed to load SLA policy", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(policy)
}

func (h *Handler) UpdatePlatformSupportSLAPolicy(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())

	before, _ := h.service.GetPlatformSupportSLAPolicy(r.Context())

	var req tenant.UpdatePlatformSupportSLAPolicyParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	updated, err := h.service.UpdatePlatformSupportSLAPolicy(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSupportSLAPolicy):
			http.Error(w, "Invalid SLA policy", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update SLA policy", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.support.sla_policy.update",
		ResourceType: "platform_setting",
		Reason:       "support.sla_policy",
		Before:       before,
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) GetPlatformSupportSLAOverview(w http.ResponseWriter, r *http.Request) {
	overview, err := h.service.GetPlatformSupportSLAOverview(r.Context())
	if err != nil {
		http.Error(w, "Failed to load SLA overview", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(overview)
}

func (h *Handler) RunPlatformSupportSLAEscalations(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())

	result, err := h.service.RunPlatformSupportSLAEscalations(r.Context())
	if err != nil {
		http.Error(w, "Failed to run SLA escalations", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.support.sla.escalations.run",
		ResourceType: "support_sla",
		Reason:       strings.TrimSpace(result.Tag),
		After:        result,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func (h *Handler) GetPlatformSecretsStatus(w http.ResponseWriter, r *http.Request) {
	jwtSecrets, jwtConfigured := security.ResolveJWTSecrets()

	parseEnvList := func(listKey, legacyKey string) []string {
		rawList := strings.TrimSpace(os.Getenv(listKey))
		out := make([]string, 0, 3)
		if rawList != "" {
			for _, part := range strings.Split(rawList, ",") {
				v := strings.TrimSpace(part)
				if v != "" {
					out = append(out, v)
				}
			}
			return out
		}
		if legacy := strings.TrimSpace(os.Getenv(legacyKey)); legacy != "" {
			out = append(out, legacy)
		}
		return out
	}

	dataKeys := parseEnvList("DATA_ENCRYPTION_KEYS", "DATA_ENCRYPTION_KEY")

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"jwt": map[string]any{
			"configured": jwtConfigured,
			"env_var":    "JWT_SECRETS",
			"count":      len(jwtSecrets),
		},
		"data_encryption": map[string]any{
			"configured": len(dataKeys) > 0,
			"env_var":    "DATA_ENCRYPTION_KEYS",
			"count":      len(dataKeys),
		},
	})
}

func (h *Handler) ListPlatformSecretRotationRequests(w http.ResponseWriter, r *http.Request) {
	limit := int32(50)
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

	rows, err := h.service.ListPlatformSecretRotationRequests(r.Context(), tenant.ListPlatformSecretRotationRequestsFilters{
		SecretName: strings.TrimSpace(r.URL.Query().Get("secret_name")),
		Status:     strings.TrimSpace(r.URL.Query().Get("status")),
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		http.Error(w, "Failed to load secret rotation requests", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) CreatePlatformSecretRotationRequest(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())

	var req tenant.CreatePlatformSecretRotationRequestParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.RequestedBy = actorID

	created, err := h.service.CreatePlatformSecretRotationRequest(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrSecretRotationInvalidSecretName):
			http.Error(w, "Invalid secret name (use jwt|data_encryption)", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSecretRotationReasonRequired):
			http.Error(w, "Rotation reason is required", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSecretRotationAlreadyInProgress):
			http.Error(w, "A rotation request already exists for this secret", http.StatusConflict)
		default:
			http.Error(w, "Failed to create secret rotation request", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.secret_rotation.request",
		ResourceType: "secret_rotation",
		ResourceID:   created.ID,
		Reason:       strings.TrimSpace(req.Reason),
		After:        created,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) ReviewPlatformSecretRotationRequest(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	requestID := chi.URLParam(r, "rotation_id")

	var req tenant.ReviewPlatformSecretRotationRequestParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.ReviewedBy = actorID

	updated, err := h.service.ReviewPlatformSecretRotationRequest(r.Context(), requestID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSecretRotationRequestID):
			http.Error(w, "Invalid rotation request id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSecretRotationRequestNotFound):
			http.Error(w, "Rotation request not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrSecretRotationInvalidDecision):
			http.Error(w, "Invalid decision (use approve|reject)", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSecretRotationNotPending):
			http.Error(w, "Rotation request is not pending", http.StatusConflict)
		case errors.Is(err, tenant.ErrSecretRotationSelfApproval):
			http.Error(w, "Cannot approve your own rotation request", http.StatusForbidden)
		default:
			http.Error(w, "Failed to review secret rotation request", http.StatusInternalServerError)
		}
		return
	}

	action := "platform.security.secret_rotation.review"
	if strings.EqualFold(strings.TrimSpace(req.Decision), "approve") {
		action = "platform.security.secret_rotation.approve"
	}
	if strings.EqualFold(strings.TrimSpace(req.Decision), "reject") {
		action = "platform.security.secret_rotation.reject"
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       action,
		ResourceType: "secret_rotation",
		ResourceID:   strings.TrimSpace(requestID),
		Reason:       strings.TrimSpace(req.Notes),
		After:        updated,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ExecutePlatformSecretRotationRequest(w http.ResponseWriter, r *http.Request) {
	actorID := middleware.GetUserID(r.Context())
	requestID := chi.URLParam(r, "rotation_id")

	var req tenant.ExecutePlatformSecretRotationRequestParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.ExecutedBy = actorID

	result, err := h.service.ExecutePlatformSecretRotation(r.Context(), requestID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidSecretRotationRequestID):
			http.Error(w, "Invalid rotation request id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSecretRotationRequestNotFound):
			http.Error(w, "Rotation request not found", http.StatusNotFound)
		case errors.Is(err, tenant.ErrSecretRotationConfirmationNeeded):
			http.Error(w, "Rotation confirmation is required", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSecretRotationInvalidConfirmation):
			http.Error(w, "Rotation confirmation did not match", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrSecretRotationNotApproved):
			http.Error(w, "Rotation request is not approved", http.StatusConflict)
		case errors.Is(err, tenant.ErrSecretRotationAlreadyExecuted):
			http.Error(w, "Rotation request is already executed", http.StatusConflict)
		default:
			http.Error(w, "Failed to execute secret rotation request", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		Action:       "platform.security.secret_rotation.execute",
		ResourceType: "secret_rotation",
		ResourceID:   strings.TrimSpace(requestID),
		After:        result.Request,
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
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

func (h *Handler) ManageTenantBillingFreeze(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req tenant.TenantBillingFreezeParams
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	req.UpdatedBy = actorID

	result, err := h.service.ManageTenantBillingFreeze(r.Context(), tenantID, req)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrInvalidBillingFreeze), errors.Is(err, tenant.ErrInvalidReason):
			http.Error(w, "Invalid billing freeze payload", http.StatusBadRequest)
		default:
			http.Error(w, "Failed to update billing freeze", http.StatusInternalServerError)
		}
		return
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.billing.freeze.manage",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		Reason:       strings.TrimSpace(req.Reason),
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
		case errors.Is(err, tenant.ErrInvalidReason):
			http.Error(w, "Reason is required", http.StatusBadRequest)
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
		Reason:       strings.TrimSpace(req.Reason),
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
		if errors.Is(err, tenant.ErrWhiteLabelRequired) {
			http.Error(w, "White-label add-on is required before assigning a custom domain.", http.StatusForbidden)
			return
		}
		if errors.Is(err, tenant.ErrInvalidTenant) {
			http.Error(w, err.Error(), http.StatusBadRequest)
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

func (h *Handler) VerifyTenantDomainMapping(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	updated, err := h.service.VerifyTenantDomainMapping(r.Context(), tenantID)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		case errors.Is(err, tenant.ErrDomainVerificationFail):
			http.Error(w, "DNS verification failed. Check CNAME/A and TXT records.", http.StatusConflict)
			return
		default:
			http.Error(w, "Failed to verify domain mapping", http.StatusInternalServerError)
			return
		}
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.domain.verify",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After: map[string]any{
			"domain":       updated.Domain,
			"ssl_status":   updated.SslStatus,
			"verified":     updated.DomainVerified,
			"verify_state": updated.DomainVerificationStatus,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ProvisionTenantDomainSSL(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	actorID := middleware.GetUserID(r.Context())

	var req struct {
		ForceRenew bool `json:"force_renew"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	updated, err := h.service.ProvisionTenantDomainSSL(r.Context(), tenantID, req.ForceRenew)
	if err != nil {
		switch {
		case errors.Is(err, tenant.ErrInvalidTenantID):
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		case errors.Is(err, tenant.ErrDomainNotVerified):
			http.Error(w, "Domain must be verified before SSL provisioning.", http.StatusConflict)
			return
		case errors.Is(err, tenant.ErrSSLProviderMissing):
			http.Error(w, "SSL provider is not configured for automation.", http.StatusNotImplemented)
			return
		default:
			http.Error(w, "Failed to provision SSL", http.StatusInternalServerError)
			return
		}
	}

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.domain.ssl.provision",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		After: map[string]any{
			"domain":     updated.Domain,
			"ssl_status": updated.SslStatus,
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
			http.Error(w, "New password is required", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPasswordPolicyViolation):
			http.Error(w, "Password does not meet the platform password policy", http.StatusBadRequest)
		case errors.Is(err, tenant.ErrPasswordReuseNotAllowed):
			http.Error(w, "Password reuse is not allowed by policy", http.StatusBadRequest)
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

	actorID := middleware.GetUserID(r.Context())
	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.security.impersonate",
		ResourceType: "tenant_admin",
		ResourceID:   tenantID,
		Reason:       req.Reason,
	})

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

	h.service.RecordPlatformAudit(r.Context(), actorID, tenant.PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.security.impersonate.exit",
		ResourceType: "tenant_admin",
		ResourceID:   tenantID,
		Reason:       req.Reason,
		After:        req,
	})

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

	h.service.RecordPlatformAudit(r.Context(), req.ReviewedBy, tenant.PlatformAuditEntry{
		Action:       "platform.signup.review",
		ResourceType: "signup_request",
		ResourceID:   signupID,
		Reason:       req.ReviewNotes,
		After: map[string]any{
			"status": req.Status,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}

func (h *Handler) GetPlatformNotificationSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.service.GetPlatformNotificationSettings(r.Context())
	if err != nil {
		http.Error(w, "Failed to load notification settings", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(settings)
}

func (h *Handler) UpdatePlatformNotificationSettings(w http.ResponseWriter, r *http.Request) {
	var settings tenant.PlatformNotificationSettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	updatedBy := middleware.GetUserID(r.Context())
	if err := h.service.UpdatePlatformNotificationSettings(r.Context(), settings, updatedBy); err != nil {
		http.Error(w, "Failed to update notification settings", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), updatedBy, tenant.PlatformAuditEntry{
		Action:       "platform.settings.notifications_update",
		ResourceType: "platform_settings",
		ResourceID:   "global_notifications",
		After:        settings,
	})
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *Handler) ListNotificationTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.service.ListNotificationTemplates(r.Context())
	if err != nil {
		http.Error(w, "Failed to load notification templates", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(templates)
}

func (h *Handler) ListDocumentTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.service.ListDocumentTemplates(r.Context())
	if err != nil {
		http.Error(w, "Failed to load document templates", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(templates)
}

func (h *Handler) GetPlatformHealth(w http.ResponseWriter, r *http.Request) {
	health, err := h.service.GetPlatformHealth(r.Context())
	if err != nil {
		http.Error(w, "Failed to load platform health", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(health)
}

func (h *Handler) GetQueueHealth(w http.ResponseWriter, r *http.Request) {
	health, err := h.service.GetQueueHealth(r.Context())
	if err != nil {
		http.Error(w, "Failed to load queue health", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(health)
}

func (h *Handler) ListPlatformWebhooks(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	var tidPtr *string
	if tenantID != "" {
		tidPtr = &tenantID
	}
	webhooks, err := h.service.ListPlatformWebhooks(r.Context(), tidPtr)
	if err != nil {
		http.Error(w, "Failed to load webhooks", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(webhooks)
}

func (h *Handler) ListIntegrationLogs(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	logs, err := h.service.ListIntegrationLogs(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to load integration logs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(logs)
}

func (h *Handler) GetIntegrationHealth(w http.ResponseWriter, r *http.Request) {
	health, err := h.service.GetIntegrationHealth(r.Context())
	if err != nil {
		http.Error(w, "Failed to load integration health", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(health)
}

func (h *Handler) ListAnnouncements(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.ListAnnouncements(r.Context())
	if err != nil {
		http.Error(w, "Failed to load announcements", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)
}

func (h *Handler) CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	var a tenant.PlatformAnnouncement
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	creatorID := middleware.GetUserID(r.Context())
	id, err := h.service.CreateAnnouncement(r.Context(), a, creatorID)
	if err != nil {
		http.Error(w, "Failed to create announcement", http.StatusInternalServerError)
		return
	}

	h.service.RecordPlatformAudit(r.Context(), creatorID, tenant.PlatformAuditEntry{
		Action:       "platform.marketing.announcement_create",
		ResourceType: "announcement",
		ResourceID:   id.String(),
		After:        a,
	})
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"id": id.String()})
}

func (h *Handler) ListChangelogs(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.ListChangelogs(r.Context())
	if err != nil {
		http.Error(w, "Failed to load changelogs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)
}

func (h *Handler) GetPlatformAnalytics(w http.ResponseWriter, r *http.Request) {
	metric := r.URL.Query().Get("metric")
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	if days <= 0 {
		days = 30
	}
	analytics, err := h.service.GetPlatformAnalytics(r.Context(), metric, days)
	if err != nil {
		http.Error(w, "Failed to load analytics", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(analytics)
}
