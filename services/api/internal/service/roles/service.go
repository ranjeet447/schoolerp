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

package roles

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

var (
	ErrRoleNotFound      = errors.New("role not found")
	ErrSystemRole        = errors.New("cannot modify system role")
	ErrRoleCodeExists    = errors.New("role code already exists")
	ErrPermissionInvalid = errors.New("one or more permissions are invalid")
)

// Service handles role management operations
type Service struct {
	queries *db.Queries
}

// NewService creates a new role service
func NewService(queries *db.Queries) *Service {
	return &Service{queries: queries}
}

// Role represents a role with its permissions
type Role struct {
	ID          string   `json:"id"`
	TenantID    string   `json:"tenant_id,omitempty"`
	Name        string   `json:"name"`
	Code        string   `json:"code"`
	Description string   `json:"description"`
	IsSystem    bool     `json:"is_system"`
	Permissions []string `json:"permissions"`
}

// Permission represents a permission
type Permission struct {
	ID          int64  `json:"id"`
	Code        string `json:"code"`
	Module      string `json:"module"`
	Description string `json:"description"`
}

// UserRoleInfo represents a user with their role for the management UI
type UserRoleInfo struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	RoleCode string `json:"role_code"`
	IsActive bool   `json:"is_active"`
}

// ListRoles returns all roles for a tenant (including system roles)
func (s *Service) ListRoles(ctx context.Context, tenantID pgtype.UUID) ([]Role, error) {
	dbRoles, err := s.queries.ListRolesByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	roles := make([]Role, len(dbRoles))
	for i, r := range dbRoles {
		roles[i] = Role{
			ID:          r.ID.String(),
			TenantID:    r.TenantID.String(),
			Name:        r.Name,
			Code:        r.Code,
			Description: r.Description.String,
			IsSystem:    r.IsSystem,
			Permissions: r.Permissions,
		}
	}
	return roles, nil
}

// GetRole returns a single role by ID
func (s *Service) GetRole(ctx context.Context, roleID pgtype.UUID) (*Role, error) {
	dbRole, err := s.queries.GetRoleByID(ctx, roleID)
	if err != nil {
		return nil, ErrRoleNotFound
	}

	return &Role{
		ID:          dbRole.ID.String(),
		TenantID:    dbRole.TenantID.String(),
		Name:        dbRole.Name,
		Code:        dbRole.Code,
		Description: dbRole.Description.String,
		IsSystem:    dbRole.IsSystem,
		Permissions: dbRole.Permissions,
	}, nil
}

// CreateRoleParams are the params for creating a role
type CreateRoleParams struct {
	TenantID    pgtype.UUID
	Name        string
	Code        string
	Description string
	Permissions []string
}

// CreateRole creates a new custom role
func (s *Service) CreateRole(ctx context.Context, params CreateRoleParams) (*Role, error) {
	// Create the role
	dbRole, err := s.queries.CreateRole(ctx, db.CreateRoleParams{
		TenantID:    params.TenantID,
		Name:        params.Name,
		Code:        params.Code,
		Description: params.Description,
	})
	if err != nil {
		return nil, err
	}

	// Set permissions if provided
	if len(params.Permissions) > 0 {
		err = s.queries.SetRolePermissions(ctx, db.SetRolePermissionsParams{
			RoleID:          dbRole.ID,
			PermissionCodes: params.Permissions,
		})
		if err != nil {
			return nil, err
		}
	}

	// Fetch the complete role with permissions
	return s.GetRole(ctx, dbRole.ID)
}

// UpdateRoleParams are the params for updating a role
type UpdateRoleParams struct {
	RoleID      pgtype.UUID
	Name        string
	Description string
	Permissions []string
}

// UpdateRole updates an existing custom role
func (s *Service) UpdateRole(ctx context.Context, params UpdateRoleParams) (*Role, error) {
	// Check if role exists and is not a system role
	existing, err := s.queries.GetRoleByID(ctx, params.RoleID)
	if err != nil {
		return nil, ErrRoleNotFound
	}
	if existing.IsSystem {
		return nil, ErrSystemRole
	}

	// Update the role
	err = s.queries.UpdateRole(ctx, db.UpdateRoleParams{
		ID:          params.RoleID,
		Name:        params.Name,
		Description: params.Description,
	})
	if err != nil {
		return nil, err
	}

	// Update permissions
	err = s.queries.SetRolePermissions(ctx, db.SetRolePermissionsParams{
		RoleID:          params.RoleID,
		PermissionCodes: params.Permissions,
	})
	if err != nil {
		return nil, err
	}

	return s.GetRole(ctx, params.RoleID)
}

// DeleteRole deletes a custom role
func (s *Service) DeleteRole(ctx context.Context, roleID pgtype.UUID) error {
	// Check if role exists and is not a system role
	existing, err := s.queries.GetRoleByID(ctx, roleID)
	if err != nil {
		return ErrRoleNotFound
	}
	if existing.IsSystem {
		return ErrSystemRole
	}

	return s.queries.DeleteRole(ctx, roleID)
}

// ListPermissions returns all available permissions
func (s *Service) ListPermissions(ctx context.Context) ([]Permission, error) {
	dbPerms, err := s.queries.ListAllPermissions(ctx)
	if err != nil {
		return nil, err
	}

	perms := make([]Permission, len(dbPerms))
	for i, p := range dbPerms {
		perms[i] = Permission{
			ID:          p.ID,
			Code:        p.Code,
			Module:      p.Module,
			Description: p.Description.String,
		}
	}
	return perms, nil
}

// AssignRoleToUser assigns a role to a user within a tenant
func (s *Service) AssignRoleToUser(ctx context.Context, tenantID, userID, roleID pgtype.UUID) error {
	return s.queries.AssignRoleToUser(ctx, db.AssignRoleToUserParams{
		TenantID:  tenantID,
		UserID:    userID,
		RoleID:    roleID,
		ScopeType: "tenant",
	})
}

// RemoveRoleFromUser removes a role assignment from a user
func (s *Service) RemoveRoleFromUser(ctx context.Context, tenantID, userID, roleID pgtype.UUID) error {
	return s.queries.RemoveRoleFromUser(ctx, tenantID, userID, roleID)
}

// ListUsers returns all users for a tenant with their roles
func (s *Service) ListUsers(ctx context.Context, tenantID pgtype.UUID) ([]UserRoleInfo, error) {
	dbUsers, err := s.queries.ListUsersByTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	users := make([]UserRoleInfo, len(dbUsers))
	for i, u := range dbUsers {
		users[i] = UserRoleInfo{
			ID:       u.ID.String(),
			Email:    u.Email.String,
			FullName: u.FullName,
			RoleCode: u.RoleCode,
			IsActive: u.IsActive.Bool,
		}
	}
	return users, nil
}
