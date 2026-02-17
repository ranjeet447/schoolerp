package db

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// AuthUser represents a user for authentication
type AuthUser struct {
	ID       pgtype.UUID
	Email    pgtype.Text
	FullName string
	IsActive pgtype.Bool
}

// AuthIdentity represents a user's authentication identity (renamed to avoid sqlc conflict)
type AuthIdentity struct {
	ID         pgtype.UUID
	UserID     pgtype.UUID
	Provider   string
	Identifier string
	Credential pgtype.Text
}

// UserRoleAssignment represents a user's role assignment
type UserRoleAssignment struct {
	RoleCode string
	TenantID pgtype.UUID
}

// GetUserByEmail retrieves a user by their email address
func (q *Queries) GetUserByEmail(ctx context.Context, email string) (AuthUser, error) {
	const query = `SELECT id, email, full_name, is_active FROM users WHERE email = $1`

	row := q.db.QueryRow(ctx, query, email)
	var user AuthUser
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.IsActive)
	return user, err
}

// GetUserByID retrieves a user by their id.
func (q *Queries) GetUserByID(ctx context.Context, id pgtype.UUID) (AuthUser, error) {
	const query = `SELECT id, email, full_name, is_active FROM users WHERE id = $1`

	row := q.db.QueryRow(ctx, query, id)
	var user AuthUser
	err := row.Scan(&user.ID, &user.Email, &user.FullName, &user.IsActive)
	return user, err
}

// GetUserIdentityParams are the params for GetUserIdentity
type GetUserIdentityParams struct {
	UserID   pgtype.UUID
	Provider string
}

// GetUserIdentity retrieves a user's identity for a specific provider
func (q *Queries) GetUserIdentity(ctx context.Context, arg GetUserIdentityParams) (AuthIdentity, error) {
	const query = `SELECT id, user_id, provider, identifier, credential 
	               FROM user_identities 
	               WHERE user_id = $1 AND provider = $2`

	row := q.db.QueryRow(ctx, query, arg.UserID, arg.Provider)
	var identity AuthIdentity
	err := row.Scan(&identity.ID, &identity.UserID, &identity.Provider,
		&identity.Identifier, &identity.Credential)
	return identity, err
}

// GetUserRoleAssignmentWithPermissionsRow is the return type for GetUserRoleAssignmentWithPermissions
type GetUserRoleAssignmentWithPermissionsRow struct {
	RoleCode    string
	TenantID    pgtype.UUID
	Permissions []string
}

// GetUserRoleAssignmentWithPermissions retrieves a user's primary role and permissions
func (q *Queries) GetUserRoleAssignmentWithPermissions(ctx context.Context, userID pgtype.UUID) (GetUserRoleAssignmentWithPermissionsRow, error) {
	const query = `
		SELECT r.code, ra.tenant_id,
		       COALESCE(array_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '{}') as permissions
		FROM role_assignments ra
		JOIN roles r ON r.id = ra.role_id
		LEFT JOIN role_permissions rp ON rp.role_id = r.id
		LEFT JOIN permissions p ON p.id = rp.permission_id
		WHERE ra.user_id = $1
		GROUP BY r.code, ra.tenant_id
		LIMIT 1
	`

	row := q.db.QueryRow(ctx, query, userID)
	var result GetUserRoleAssignmentWithPermissionsRow
	err := row.Scan(&result.RoleCode, &result.TenantID, &result.Permissions)
	if err == pgx.ErrNoRows {
		return GetUserRoleAssignmentWithPermissionsRow{RoleCode: "guest", Permissions: []string{}}, nil
	}
	return result, err
}

// UpdateUserLastLoginParams are the params for UpdateUserLastLogin
type UpdateUserLastLoginParams struct {
	ID       pgtype.UUID
	Provider string
}

// ListUsersByTenantRow is the return type for ListUsersByTenant
type ListUsersByTenantRow struct {
	ID       pgtype.UUID
	Email    pgtype.Text
	FullName string
	IsActive pgtype.Bool
	RoleCode string
}

// ListUsersByTenant retrieves all users for a tenant with their primary role
func (q *Queries) ListUsersByTenant(ctx context.Context, tenantID pgtype.UUID) ([]ListUsersByTenantRow, error) {
	const query = `
		SELECT u.id, u.email, u.full_name, u.is_active, r.code as role_code
		FROM users u
		JOIN role_assignments ra ON ra.user_id = u.id
		JOIN roles r ON r.id = ra.role_id
		WHERE ra.tenant_id = $1
		ORDER BY u.full_name ASC
	`

	rows, err := q.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []ListUsersByTenantRow
	for rows.Next() {
		var u ListUsersByTenantRow
		err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.IsActive, &u.RoleCode)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// UpdateUserLastLogin updates the last_login timestamp for a user identity
func (q *Queries) UpdateUserLastLogin(ctx context.Context, arg UpdateUserLastLoginParams) error {
	const query = `UPDATE user_identities SET last_login = NOW() WHERE id = $1`
	_, err := q.db.Exec(ctx, query, arg.ID)
	return err
}
