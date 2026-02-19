package tenant

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/tenant"
)

func (h *Handler) ListGlobalUsers(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	filters := tenant.ListGlobalUsersFilters{
		Search:   r.URL.Query().Get("search"),
		TenantID: r.URL.Query().Get("tenant_id"),
		RoleCode: r.URL.Query().Get("role_code"),
		Limit:    int32(limit),
		Offset:   int32(offset),
	}

	users, err := h.service.ListGlobalUsers(r.Context(), filters)
	if err != nil {
		http.Error(w, "Failed to list global users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *Handler) ImpersonateGlobalUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "user_id")
	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	adminUserID := middleware.GetUserID(r.Context())
	result, err := h.service.ImpersonateGlobalUser(r.Context(), userID, req.Reason, adminUserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *Handler) ResetGlobalUserPassword(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "user_id")
	var req struct {
		NewPassword string `json:"new_password"`
		Reason      string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	adminUserID := middleware.GetUserID(r.Context())
	if err := h.service.ResetGlobalUserPassword(r.Context(), userID, req.NewPassword, req.Reason, adminUserID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}
