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
		WITH primary_role AS (
			SELECT
				ra.role_id,
				ra.tenant_id,
				r.code
			FROM role_assignments ra
			JOIN roles r ON r.id = ra.role_id
			WHERE ra.user_id = $1
			ORDER BY
				CASE WHEN lower(ra.scope_type) = 'platform' THEN 0 ELSE 1 END,
				CASE lower(r.code)
					WHEN 'super_admin' THEN 0
					WHEN 'support_l2' THEN 1
					WHEN 'support_l1' THEN 2
					WHEN 'finance' THEN 3
					WHEN 'ops' THEN 4
					WHEN 'developer' THEN 5
					WHEN 'tenant_admin' THEN 10
					WHEN 'teacher' THEN 20
					WHEN 'parent' THEN 30
					WHEN 'student' THEN 40
					ELSE 100
				END,
				ra.created_at DESC
			LIMIT 1
		)
		SELECT
			pr.code,
			pr.tenant_id,
			COALESCE(array_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '{}') as permissions
		FROM primary_role pr
		LEFT JOIN role_permissions rp ON rp.role_id = pr.role_id
		LEFT JOIN permissions p ON p.id = rp.permission_id
		GROUP BY pr.code, pr.tenant_id
	`

	row := q.db.QueryRow(ctx, query, userID)
	var result GetUserRoleAssignmentWithPermissionsRow
	err := row.Scan(&result.RoleCode, &result.TenantID, &result.Permissions)
	if err == pgx.ErrNoRows {
		// Fallback: Check if user is a guardian
		const guardianQuery = `SELECT tenant_id FROM guardians WHERE user_id = $1 LIMIT 1`
		var tenantID pgtype.UUID
		if gErr := q.db.QueryRow(ctx, guardianQuery, userID).Scan(&tenantID); gErr == nil {
			return GetUserRoleAssignmentWithPermissionsRow{
				RoleCode:    "parent",
				TenantID:    tenantID,
				Permissions: []string{},
			}, nil
		}
		return GetUserRoleAssignmentWithPermissionsRow{RoleCode: "guest", Permissions: []string{}}, nil
	}
	return result, err
}

// UpdateUserLastLoginParams are the params for UpdateUserLastLogin
type UpdateUserLastLoginParams struct {
	ID       pgtype.UUID
	Provider string
}

// UpdateUserPassword updates a user's password credential for a specific provider (usually 'local')
func (q *Queries) UpdateUserPassword(ctx context.Context, userID pgtype.UUID, provider string, credential string) error {
	const query = `UPDATE user_identities SET credential = $1, updated_at = NOW() WHERE user_id = $2 AND provider = $3`
	_, err := q.db.Exec(ctx, query, credential, userID, provider)
	return err
}

// CreatePasswordResetTokenParams are the params for CreatePasswordResetToken
type CreatePasswordResetTokenParams struct {
	ID        pgtype.UUID
	UserID    pgtype.UUID
	Token     string
	ExpiresAt pgtype.Timestamp
}

// CreatePasswordResetToken creates a new password reset token
func (q *Queries) CreatePasswordResetToken(ctx context.Context, arg CreatePasswordResetTokenParams) error {
	const query = `INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)`
	_, err := q.db.Exec(ctx, query, arg.ID, arg.UserID, arg.Token, arg.ExpiresAt)
	return err
}

// GetPasswordResetToken retrieves an unused password reset token by its value
func (q *Queries) GetPasswordResetToken(ctx context.Context, token string) (pgtype.UUID, pgtype.Timestamp, error) {
	const query = `SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1 AND used_at IS NULL`
	var userID pgtype.UUID
	var expiresAt pgtype.Timestamp
	err := q.db.QueryRow(ctx, query, token).Scan(&userID, &expiresAt)
	return userID, expiresAt, err
}

// MarkPasswordResetTokenUsed marks a password reset token as used
func (q *Queries) MarkPasswordResetTokenUsed(ctx context.Context, token string) error {
	const query = `UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`
	_, err := q.db.Exec(ctx, query, token)
	return err
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

// UserRoleAssignmentScope represents a scope for a role assignment
type UserRoleAssignmentScope struct {
	ScopeType string
	ScopeID   pgtype.UUID
}

// ListUserRoleAssignmentsByScope retrieves all scope assignments for a user and role
func (q *Queries) ListUserRoleAssignmentsByScope(ctx context.Context, userID, tenantID pgtype.UUID, roleCode string) ([]UserRoleAssignmentScope, error) {
	const query = `
		SELECT scope_type, scope_id
		FROM role_assignments ra
		JOIN roles r ON r.id = ra.role_id
		WHERE ra.user_id = $1 AND ra.tenant_id = $2 AND r.code = $3
	`

	rows, err := q.db.Query(ctx, query, userID, tenantID, roleCode)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scopes []UserRoleAssignmentScope
	for rows.Next() {
		var s UserRoleAssignmentScope
		if err := rows.Scan(&s.ScopeType, &s.ScopeID); err != nil {
			return nil, err
		}
		scopes = append(scopes, s)
	}
	return scopes, nil
}

// GetGuardianByUserID retrieves a guardian by their user id
func (q *Queries) GetGuardianByUserID(ctx context.Context, userID pgtype.UUID) (Guardian, error) {
	const query = `SELECT id, tenant_id, full_name, phone, email, address, created_at, user_id, preferred_language FROM guardians WHERE user_id = $1`
	row := q.db.QueryRow(ctx, query, userID)
	var i Guardian
	err := row.Scan(
		&i.ID, &i.TenantID, &i.FullName, &i.Phone, &i.Email, &i.Address, &i.CreatedAt, &i.UserID, &i.PreferredLanguage,
	)
	return i, err
}

// UpdateUserFullName updates the full name of a user
func (q *Queries) UpdateUserFullName(ctx context.Context, id pgtype.UUID, fullName string) error {
	const query = `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2`
	_, err := q.db.Exec(ctx, query, fullName, id)
	return err
}

// UpdateGuardianProfile updates basic contact info for a guardian
func (q *Queries) UpdateGuardianProfile(ctx context.Context, userID pgtype.UUID, phone, address string) error {
	const query = `UPDATE guardians SET phone = $1, address = $2 WHERE user_id = $3`
	_, err := q.db.Exec(ctx, query, phone, address, userID)
	return err
}

// UpdateUserAvatar updates the avatar URL for a user
func (q *Queries) UpdateUserAvatar(ctx context.Context, id pgtype.UUID, avatarURL string) error {
	const query = `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`
	_, err := q.db.Exec(ctx, query, avatarURL, id)
	return err
}
