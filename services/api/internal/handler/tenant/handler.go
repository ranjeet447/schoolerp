package tenant

import (
	"encoding/json"
	"errors"
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
	r.Get("/signup-requests", h.ListSignupRequests)
	r.Post("/signup-requests/{signup_id}/review", h.ReviewSignupRequest)
	r.Get("/tenants", h.ListPlatformTenants)
	r.Get("/tenants/{tenant_id}", h.GetPlatformTenant)
	r.Patch("/tenants/{tenant_id}", h.UpdatePlatformTenant)
	r.Post("/tenants/{tenant_id}/lifecycle", h.UpdateTenantLifecycle)
	r.Post("/tenants/{tenant_id}/defaults", h.UpdateTenantDefaults)
	r.Post("/tenants/{tenant_id}/plan", h.AssignTenantPlan)
	r.Post("/tenants/{tenant_id}/branding", h.UpdateTenantBranding)
	r.Post("/tenants/{tenant_id}/domain", h.UpdateTenantDomainMapping)
	r.Post("/tenants/{tenant_id}/reset-admin-password", h.ResetTenantAdminPassword)
	r.Post("/tenants/{tenant_id}/force-logout", h.ForceLogoutTenantUsers)
	r.Post("/tenants/{tenant_id}/impersonate", h.ImpersonateTenantAdmin)
	r.Get("/tenants/{tenant_id}/branches", h.ListTenantBranches)
	r.Post("/tenants/{tenant_id}/branches", h.CreateTenantBranch)
	r.Patch("/tenants/{tenant_id}/branches/{branch_id}", h.UpdateTenantBranch)
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(created)
}

func (h *Handler) UpdateTenantBranch(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	branchID := chi.URLParam(r, "branch_id")

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

func (h *Handler) UpdateTenantLifecycle(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")

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

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}

func (h *Handler) UpdateTenantDefaults(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
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
		case errors.Is(err, tenant.ErrPlanNotFound):
			http.Error(w, "Plan not found", http.StatusNotFound)
		default:
			http.Error(w, "Failed to assign plan", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}

func (h *Handler) UpdateTenantBranding(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")

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

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) UpdateTenantDomainMapping(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
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

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *Handler) ResetTenantAdminPassword(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
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

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":       "ok",
		"updated_rows": updatedRows,
	})
}

func (h *Handler) ForceLogoutTenantUsers(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	revoked, err := h.service.ForceLogoutTenantUsers(r.Context(), tenantID)
	if err != nil {
		if errors.Is(err, tenant.ErrInvalidTenantID) {
			http.Error(w, "Invalid tenant id", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to force logout tenant users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":         "ok",
		"revoked_count":  revoked,
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
