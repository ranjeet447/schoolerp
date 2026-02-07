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

// role_queries.go - Custom queries for role management

package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

// RoleWithPermissions represents a role with its associated permissions
type RoleWithPermissions struct {
	ID          pgtype.UUID
	TenantID    pgtype.UUID
	Name        string
	Code        string
	Description pgtype.Text
	IsSystem    bool
	Permissions []string
}

// PermissionInfo represents a permission
type PermissionInfo struct {
	ID          int64
	Code        string
	Module      string
	Description pgtype.Text
}

// ListRolesByTenant retrieves all roles for a tenant (including system roles)
func (q *Queries) ListRolesByTenant(ctx context.Context, tenantID pgtype.UUID) ([]RoleWithPermissions, error) {
	const query = `
		SELECT r.id, r.tenant_id, r.name, r.code, r.description, r.is_system,
		       COALESCE(array_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '{}') as permissions
		FROM roles r
		LEFT JOIN role_permissions rp ON rp.role_id = r.id
		LEFT JOIN permissions p ON p.id = rp.permission_id
		WHERE r.tenant_id IS NULL OR r.tenant_id = $1
		GROUP BY r.id, r.tenant_id, r.name, r.code, r.description, r.is_system
		ORDER BY r.is_system DESC, r.name ASC
	`

	rows, err := q.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []RoleWithPermissions
	for rows.Next() {
		var role RoleWithPermissions
		err := rows.Scan(&role.ID, &role.TenantID, &role.Name, &role.Code,
			&role.Description, &role.IsSystem, &role.Permissions)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, nil
}

// GetRoleByID retrieves a single role by ID
func (q *Queries) GetRoleByID(ctx context.Context, roleID pgtype.UUID) (RoleWithPermissions, error) {
	const query = `
		SELECT r.id, r.tenant_id, r.name, r.code, r.description, r.is_system,
		       COALESCE(array_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '{}') as permissions
		FROM roles r
		LEFT JOIN role_permissions rp ON rp.role_id = r.id
		LEFT JOIN permissions p ON p.id = rp.permission_id
		WHERE r.id = $1
		GROUP BY r.id, r.tenant_id, r.name, r.code, r.description, r.is_system
	`

	row := q.db.QueryRow(ctx, query, roleID)
	var role RoleWithPermissions
	err := row.Scan(&role.ID, &role.TenantID, &role.Name, &role.Code,
		&role.Description, &role.IsSystem, &role.Permissions)
	return role, err
}

// CreateRoleParams are the params for CreateRole
type CreateRoleParams struct {
	TenantID    pgtype.UUID
	Name        string
	Code        string
	Description string
}

// CreateRole creates a new custom role for a tenant
func (q *Queries) CreateRole(ctx context.Context, arg CreateRoleParams) (RoleWithPermissions, error) {
	const query = `
		INSERT INTO roles (tenant_id, name, code, description, is_system)
		VALUES ($1, $2, $3, $4, FALSE)
		RETURNING id, tenant_id, name, code, description, is_system
	`

	row := q.db.QueryRow(ctx, query, arg.TenantID, arg.Name, arg.Code, arg.Description)
	var role RoleWithPermissions
	err := row.Scan(&role.ID, &role.TenantID, &role.Name, &role.Code,
		&role.Description, &role.IsSystem)
	role.Permissions = []string{}
	return role, err
}

// UpdateRoleParams are the params for UpdateRole
type UpdateRoleParams struct {
	ID          pgtype.UUID
	Name        string
	Description string
}

// UpdateRole updates an existing custom role (not system roles)
func (q *Queries) UpdateRole(ctx context.Context, arg UpdateRoleParams) error {
	const query = `
		UPDATE roles SET name = $2, description = $3, updated_at = NOW()
		WHERE id = $1 AND is_system = FALSE
	`
	_, err := q.db.Exec(ctx, query, arg.ID, arg.Name, arg.Description)
	return err
}

// DeleteRole deletes a custom role (not system roles)
func (q *Queries) DeleteRole(ctx context.Context, roleID pgtype.UUID) error {
	const query = `DELETE FROM roles WHERE id = $1 AND is_system = FALSE`
	_, err := q.db.Exec(ctx, query, roleID)
	return err
}

// SetRolePermissionsParams are the params for SetRolePermissions
type SetRolePermissionsParams struct {
	RoleID          pgtype.UUID
	PermissionCodes []string
}

// SetRolePermissions replaces all permissions for a role
func (q *Queries) SetRolePermissions(ctx context.Context, arg SetRolePermissionsParams) error {
	// First, delete existing permissions
	_, err := q.db.Exec(ctx, `DELETE FROM role_permissions WHERE role_id = $1`, arg.RoleID)
	if err != nil {
		return err
	}

	// If no permissions, we're done
	if len(arg.PermissionCodes) == 0 {
		return nil
	}

	// Insert new permissions
	const insertQuery = `
		INSERT INTO role_permissions (role_id, permission_id)
		SELECT $1, id FROM permissions WHERE code = ANY($2)
	`
	_, err = q.db.Exec(ctx, insertQuery, arg.RoleID, arg.PermissionCodes)
	return err
}

// ListAllPermissions retrieves all available permissions
func (q *Queries) ListAllPermissions(ctx context.Context) ([]PermissionInfo, error) {
	const query = `SELECT id, code, module, description FROM permissions ORDER BY module, code`

	rows, err := q.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var perms []PermissionInfo
	for rows.Next() {
		var p PermissionInfo
		if err := rows.Scan(&p.ID, &p.Code, &p.Module, &p.Description); err != nil {
			return nil, err
		}
		perms = append(perms, p)
	}
	return perms, nil
}

// AssignRoleToUserParams are the params for AssignRoleToUser
type AssignRoleToUserParams struct {
	TenantID  pgtype.UUID
	UserID    pgtype.UUID
	RoleID    pgtype.UUID
	ScopeType string
}

// AssignRoleToUser assigns a role to a user
func (q *Queries) AssignRoleToUser(ctx context.Context, arg AssignRoleToUserParams) error {
	const query = `
		INSERT INTO role_assignments (tenant_id, user_id, role_id, scope_type)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING
	`
	_, err := q.db.Exec(ctx, query, arg.TenantID, arg.UserID, arg.RoleID, arg.ScopeType)
	return err
}

// RemoveRoleFromUser removes a role assignment from a user
func (q *Queries) RemoveRoleFromUser(ctx context.Context, tenantID, userID, roleID pgtype.UUID) error {
	const query = `DELETE FROM role_assignments WHERE tenant_id = $1 AND user_id = $2 AND role_id = $3`
	_, err := q.db.Exec(ctx, query, tenantID, userID, roleID)
	return err
}
