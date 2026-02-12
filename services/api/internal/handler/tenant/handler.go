package tenant

import (
	"errors"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
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
	r.Get("/tenants", h.ListPlatformTenants)
	r.Get("/tenants/{tenant_id}", h.GetPlatformTenant)
	r.Patch("/tenants/{tenant_id}", h.UpdatePlatformTenant)
	r.Get("/tenants/{tenant_id}/branches", h.ListTenantBranches)
	r.Post("/tenants/{tenant_id}/branches", h.CreateTenantBranch)
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
	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		http.Error(w, "X-Tenant-ID header required", http.StatusBadRequest)
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
	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		http.Error(w, "X-Tenant-ID header required", http.StatusBadRequest)
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
	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		http.Error(w, "X-Tenant-ID header required", http.StatusBadRequest)
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
	includeInactive := r.URL.Query().Get("include_inactive") == "true"
	tenants, err := h.service.ListPlatformTenants(r.Context(), includeInactive)
	if err != nil {
		http.Error(w, "Failed to load tenants", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(tenants)
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
