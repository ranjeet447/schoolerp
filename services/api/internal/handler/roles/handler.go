package roles

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/roles"
)

type Handler struct {
	svc *roles.Service
}

func NewHandler(svc *roles.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/roles", h.List)
	r.Post("/roles", h.Create)
	r.Get("/roles/{id}", h.Get)
	r.Put("/roles/{id}", h.Update)
	r.Delete("/roles/{id}", h.Delete)
	r.Get("/permissions", h.ListPermissions)
	r.Get("/roles/users", h.ListUsers)
	r.Post("/roles/assign", h.AssignRole)
}

// List returns all roles for the current tenant
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := parseUUID(tenantIDStr)
	if err != nil {
		http.Error(w, "invalid tenant id", http.StatusBadRequest)
		return
	}

	roles, err := h.svc.ListRoles(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roles)
}


// Get returns a single role by ID
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	roleID, err := parseUUID(idStr)
	if err != nil {
		http.Error(w, "invalid role id", http.StatusBadRequest)
		return
	}

	role, err := h.svc.GetRole(r.Context(), roleID)
	if err != nil {
		if err == roles.ErrRoleNotFound {
			http.Error(w, "role not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(role)
}

type createRoleRequest struct {
	Name        string   `json:"name"`
	Code        string   `json:"code"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// Create creates a new custom role
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := parseUUID(tenantIDStr)
	if err != nil {
		http.Error(w, "invalid tenant id", http.StatusBadRequest)
		return
	}

	var req createRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Code == "" {
		http.Error(w, "name and code are required", http.StatusBadRequest)
		return
	}

	role, err := h.svc.CreateRole(r.Context(), roles.CreateRoleParams{
		TenantID:    tenantID,
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Permissions: req.Permissions,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(role)
}


type updateRoleRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

// Update updates an existing custom role
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	roleID, err := parseUUID(idStr)
	if err != nil {
		http.Error(w, "invalid role id", http.StatusBadRequest)
		return
	}

	var req updateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	role, err := h.svc.UpdateRole(r.Context(), roles.UpdateRoleParams{
		RoleID:      roleID,
		Name:        req.Name,
		Description: req.Description,
		Permissions: req.Permissions,
	})
	if err != nil {
		if err == roles.ErrRoleNotFound {
			http.Error(w, "role not found", http.StatusNotFound)
			return
		}
		if err == roles.ErrSystemRole {
			http.Error(w, "cannot modify system role", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(role)
}

// Delete deletes a custom role
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	roleID, err := parseUUID(idStr)
	if err != nil {
		http.Error(w, "invalid role id", http.StatusBadRequest)
		return
	}

	err = h.svc.DeleteRole(r.Context(), roleID)
	if err != nil {
		if err == roles.ErrRoleNotFound {
			http.Error(w, "role not found", http.StatusNotFound)
			return
		}
		if err == roles.ErrSystemRole {
			http.Error(w, "cannot delete system role", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListPermissions returns all available permissions
func (h *Handler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	perms, err := h.svc.ListPermissions(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(perms)
}

// ListUsers returns all users with their roles
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := parseUUID(tenantIDStr)
	if err != nil {
		http.Error(w, "invalid tenant id", http.StatusBadRequest)
		return
	}

	users, err := h.svc.ListUsers(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

type assignRoleRequest struct {
	UserID string `json:"user_id"`
	RoleID string `json:"role_id"`
}

// AssignRole assigns a role to a user
func (h *Handler) AssignRole(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := parseUUID(tenantIDStr)
	if err != nil {
		http.Error(w, "invalid tenant id", http.StatusBadRequest)
		return
	}

	var req assignRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	userUUID, err := parseUUID(req.UserID)
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	roleUUID, err := parseUUID(req.RoleID)
	if err != nil {
		http.Error(w, "invalid role id", http.StatusBadRequest)
		return
	}

	err = h.svc.AssignRoleToUser(r.Context(), tenantID, userUUID, roleUUID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": true}`))
}

func parseUUID(s string) (pgtype.UUID, error) {
	u, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return pgtype.UUID{Bytes: u, Valid: true}, nil
}
