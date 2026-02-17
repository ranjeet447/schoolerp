package tenant

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidPlatformUserID      = errors.New("invalid platform user id")
	ErrPlatformUserNotFound       = errors.New("platform user not found")
	ErrPlatformUserExists         = errors.New("platform user already exists")
	ErrInvalidPlatformUserPayload = errors.New("invalid platform user payload")
	ErrPlatformRoleNotAllowed     = errors.New("platform role is not allowed")
)

var platformRoleCatalog = map[string]string{
	"super_admin": "Super Admin",
	"support_l1":  "Support L1",
	"support_l2":  "Support L2",
	"finance":     "Finance",
	"ops":         "Operations",
	"developer":   "Developer",
}

type PlatformInternalUser struct {
	ID             string     `json:"id"`
	Email          string     `json:"email"`
	FullName       string     `json:"full_name"`
	IsActive       bool       `json:"is_active"`
	RoleCode       string     `json:"role_code"`
	RoleName       string     `json:"role_name"`
	LastLogin      *time.Time `json:"last_login,omitempty"`
	ActiveSessions int64      `json:"active_sessions"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type ListPlatformInternalUsersFilters struct {
	Search   string
	RoleCode string
	IsActive *bool
	Limit    int32
	Offset   int32
}

type CreatePlatformInternalUserParams struct {
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Password string `json:"password"`
	RoleCode string `json:"role_code"`
}

type UpdatePlatformInternalUserParams struct {
	FullName *string `json:"full_name"`
	IsActive *bool   `json:"is_active"`
	RoleCode *string `json:"role_code"`
}

func (s *Service) ListPlatformInternalUsers(ctx context.Context, filters ListPlatformInternalUsersFilters) ([]PlatformInternalUser, error) {
	systemTenantID, err := ensureSystemTenantID(ctx, s.db)
	if err != nil {
		return nil, err
	}

	limit := filters.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	search := strings.TrimSpace(filters.Search)
	roleCode := strings.ToLower(strings.TrimSpace(filters.RoleCode))

	var isActive pgtype.Bool
	if filters.IsActive != nil {
		isActive = pgtype.Bool{Bool: *filters.IsActive, Valid: true}
	}

	const query = `
		SELECT
			u.id::text,
			COALESCE(u.email, '') AS email,
			u.full_name,
			u.is_active,
			r.code,
			r.name,
			(
				SELECT MAX(ui.last_login)
				FROM user_identities ui
				WHERE ui.user_id = u.id
				  AND ui.provider = 'password'
			) AS last_login,
			(
				SELECT COUNT(*)::BIGINT
				FROM sessions se
				WHERE se.user_id = u.id
				  AND se.expires_at > NOW()
			) AS active_sessions,
			u.created_at,
			u.updated_at
		FROM users u
		JOIN LATERAL (
			SELECT ra.role_id
			FROM role_assignments ra
			WHERE ra.user_id = u.id
			  AND ra.tenant_id = $1
			  AND ra.scope_type = 'platform'
			ORDER BY ra.created_at DESC
			LIMIT 1
		) pra ON TRUE
		JOIN roles r ON r.id = pra.role_id
		WHERE ($2::text = '' OR LOWER(u.full_name) LIKE '%' || LOWER($2) || '%' OR LOWER(COALESCE(u.email, '')) LIKE '%' || LOWER($2) || '%')
		  AND ($3::text = '' OR r.code = $3)
		  AND ($4::boolean IS NULL OR u.is_active = $4)
		ORDER BY u.created_at DESC
		LIMIT $5 OFFSET $6
	`

	rows, err := s.db.Query(ctx, query, systemTenantID, search, roleCode, isActive, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]PlatformInternalUser, 0)
	for rows.Next() {
		row, err := scanPlatformInternalUser(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) CreatePlatformInternalUser(ctx context.Context, params CreatePlatformInternalUserParams) (PlatformInternalUser, error) {
	email := strings.ToLower(strings.TrimSpace(params.Email))
	fullName := strings.TrimSpace(params.FullName)
	password := strings.TrimSpace(params.Password)
	roleCode := strings.ToLower(strings.TrimSpace(params.RoleCode))

	if !isValidPlatformRoleCode(roleCode) {
		return PlatformInternalUser{}, ErrPlatformRoleNotAllowed
	}
	if email == "" || !strings.Contains(email, "@") || fullName == "" || password == "" {
		return PlatformInternalUser{}, ErrInvalidPlatformUserPayload
	}

	_, credentialHash, err := s.validatePasswordAgainstPolicy(ctx, "", password)
	if err != nil {
		return PlatformInternalUser{}, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PlatformInternalUser{}, err
	}
	defer tx.Rollback(ctx)

	systemTenantID, err := ensureSystemTenantID(ctx, tx)
	if err != nil {
		return PlatformInternalUser{}, err
	}
	roleID, err := ensurePlatformRole(ctx, tx, roleCode)
	if err != nil {
		return PlatformInternalUser{}, err
	}

	var existingUserID pgtype.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, email).Scan(&existingUserID)
	if err == nil {
		return PlatformInternalUser{}, ErrPlatformUserExists
	}
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return PlatformInternalUser{}, err
	}

	var userID pgtype.UUID
	if err := tx.QueryRow(
		ctx,
		`INSERT INTO users (email, full_name, is_active) VALUES ($1, $2, TRUE) RETURNING id`,
		email,
		fullName,
	).Scan(&userID); err != nil {
		return PlatformInternalUser{}, err
	}

	if _, err := tx.Exec(
		ctx,
		`INSERT INTO user_identities (user_id, provider, identifier, credential) VALUES ($1, 'password', $2, $3)`,
		userID,
		email,
		credentialHash,
	); err != nil {
		return PlatformInternalUser{}, err
	}

	if _, err := tx.Exec(
		ctx,
		`INSERT INTO user_credential_history (user_id, provider, credential_hash, created_at)
		 VALUES ($1, 'password', $2, NOW())
		 ON CONFLICT (user_id, provider, credential_hash) DO NOTHING`,
		userID,
		credentialHash,
	); err != nil {
		var pgErr *pgconn.PgError
		if !errors.As(err, &pgErr) || pgErr.Code != "42P01" {
			return PlatformInternalUser{}, err
		}
	}

	if err := upsertPlatformRoleAssignment(ctx, tx, systemTenantID, userID, roleID); err != nil {
		return PlatformInternalUser{}, err
	}

	created, err := getPlatformInternalUserByID(ctx, tx, systemTenantID, userID)
	if err != nil {
		return PlatformInternalUser{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PlatformInternalUser{}, err
	}
	return created, nil
}

func (s *Service) UpdatePlatformInternalUser(ctx context.Context, userID string, params UpdatePlatformInternalUserParams) (PlatformInternalUser, error) {
	uid, err := parsePlatformUserUUID(userID)
	if err != nil {
		return PlatformInternalUser{}, err
	}

	hasName := params.FullName != nil
	hasActive := params.IsActive != nil
	hasRole := params.RoleCode != nil
	if !hasName && !hasActive && !hasRole {
		return PlatformInternalUser{}, ErrInvalidPlatformUserPayload
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PlatformInternalUser{}, err
	}
	defer tx.Rollback(ctx)

	systemTenantID, err := ensureSystemTenantID(ctx, tx)
	if err != nil {
		return PlatformInternalUser{}, err
	}

	if hasName || hasActive {
		setClauses := make([]string, 0, 2)
		args := []interface{}{}
		index := 1

		if hasName {
			name := strings.TrimSpace(*params.FullName)
			if name == "" {
				return PlatformInternalUser{}, ErrInvalidPlatformUserPayload
			}
			setClauses = append(setClauses, fmt.Sprintf("full_name = $%d", index))
			args = append(args, name)
			index++
		}
		if hasActive {
			setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", index))
			args = append(args, *params.IsActive)
			index++
		}

		args = append(args, uid)
		query := fmt.Sprintf(`UPDATE users SET %s, updated_at = NOW() WHERE id = $%d`, strings.Join(setClauses, ", "), index)
		tag, err := tx.Exec(ctx, query, args...)
		if err != nil {
			return PlatformInternalUser{}, err
		}
		if tag.RowsAffected() == 0 {
			return PlatformInternalUser{}, ErrPlatformUserNotFound
		}
		if hasActive && !*params.IsActive {
			_, _ = tx.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, uid)
		}
	}

	if hasRole {
		roleCode := strings.ToLower(strings.TrimSpace(*params.RoleCode))
		if !isValidPlatformRoleCode(roleCode) {
			return PlatformInternalUser{}, ErrPlatformRoleNotAllowed
		}
		roleID, err := ensurePlatformRole(ctx, tx, roleCode)
		if err != nil {
			return PlatformInternalUser{}, err
		}
		if err := upsertPlatformRoleAssignment(ctx, tx, systemTenantID, uid, roleID); err != nil {
			return PlatformInternalUser{}, err
		}
	}

	updated, err := getPlatformInternalUserByID(ctx, tx, systemTenantID, uid)
	if err != nil {
		return PlatformInternalUser{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PlatformInternalUser{}, err
	}
	return updated, nil
}

func isValidPlatformRoleCode(roleCode string) bool {
	_, ok := platformRoleCatalog[roleCode]
	return ok
}

func parsePlatformUserUUID(raw string) (pgtype.UUID, error) {
	var uid pgtype.UUID
	if err := uid.Scan(strings.TrimSpace(raw)); err != nil || !uid.Valid {
		return pgtype.UUID{}, ErrInvalidPlatformUserID
	}
	return uid, nil
}

func ensureSystemTenantID(ctx context.Context, dbTx interface {
	QueryRow(context.Context, string, ...interface{}) pgx.Row
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
}) (pgtype.UUID, error) {
	const selectSystem = `SELECT id FROM tenants WHERE subdomain = 'system' LIMIT 1`
	var tid pgtype.UUID
	if err := dbTx.QueryRow(ctx, selectSystem).Scan(&tid); err == nil {
		return tid, nil
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return pgtype.UUID{}, err
	}

	const insertSystem = `
		INSERT INTO tenants (name, subdomain, domain, config, is_active)
		VALUES ('Platform Management', 'system', 'system.schoolerp.com', '{"is_system":true}'::jsonb, TRUE)
		RETURNING id
	`
	if err := dbTx.QueryRow(ctx, insertSystem).Scan(&tid); err != nil {
		return pgtype.UUID{}, err
	}
	return tid, nil
}

func ensurePlatformRole(ctx context.Context, dbTx interface {
	QueryRow(context.Context, string, ...interface{}) pgx.Row
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
}, roleCode string) (pgtype.UUID, error) {
	name, ok := platformRoleCatalog[roleCode]
	if !ok {
		return pgtype.UUID{}, ErrPlatformRoleNotAllowed
	}

	var roleID pgtype.UUID
	err := dbTx.QueryRow(
		ctx,
		`SELECT id FROM roles WHERE tenant_id IS NULL AND code = $1 LIMIT 1`,
		roleCode,
	).Scan(&roleID)
	if err == nil {
		return roleID, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return pgtype.UUID{}, err
	}

	err = dbTx.QueryRow(
		ctx,
		`INSERT INTO roles (tenant_id, name, code, description, is_system)
		 VALUES (NULL, $1, $2, $3, TRUE)
		 RETURNING id`,
		name,
		roleCode,
		"platform internal role",
	).Scan(&roleID)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return roleID, nil
}

func upsertPlatformRoleAssignment(ctx context.Context, tx pgx.Tx, systemTenantID pgtype.UUID, userID pgtype.UUID, roleID pgtype.UUID) error {
	updateTag, err := tx.Exec(
		ctx,
		`UPDATE role_assignments
		 SET role_id = $3
		 WHERE tenant_id = $1
		   AND user_id = $2
		   AND scope_type = 'platform'`,
		systemTenantID,
		userID,
		roleID,
	)
	if err != nil {
		return err
	}
	if updateTag.RowsAffected() > 0 {
		return nil
	}

	_, err = tx.Exec(
		ctx,
		`INSERT INTO role_assignments (tenant_id, user_id, role_id, scope_type) VALUES ($1, $2, $3, 'platform')`,
		systemTenantID,
		userID,
		roleID,
	)
	return err
}

func getPlatformInternalUserByID(ctx context.Context, tx pgx.Tx, systemTenantID pgtype.UUID, userID pgtype.UUID) (PlatformInternalUser, error) {
	const query = `
		SELECT
			u.id::text,
			COALESCE(u.email, '') AS email,
			u.full_name,
			u.is_active,
			r.code,
			r.name,
			(
				SELECT MAX(ui.last_login)
				FROM user_identities ui
				WHERE ui.user_id = u.id
				  AND ui.provider = 'password'
			) AS last_login,
			(
				SELECT COUNT(*)::BIGINT
				FROM sessions se
				WHERE se.user_id = u.id
				  AND se.expires_at > NOW()
			) AS active_sessions,
			u.created_at,
			u.updated_at
		FROM users u
		JOIN LATERAL (
			SELECT ra.role_id
			FROM role_assignments ra
			WHERE ra.user_id = u.id
			  AND ra.tenant_id = $1
			  AND ra.scope_type = 'platform'
			ORDER BY ra.created_at DESC
			LIMIT 1
		) pra ON TRUE
		JOIN roles r ON r.id = pra.role_id
		WHERE u.id = $2
	`
	row, err := scanPlatformInternalUser(tx.QueryRow(ctx, query, systemTenantID, userID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformInternalUser{}, ErrPlatformUserNotFound
		}
		return PlatformInternalUser{}, err
	}
	return row, nil
}

type platformInternalUserScanner interface {
	Scan(dest ...interface{}) error
}

func scanPlatformInternalUser(scanner platformInternalUserScanner) (PlatformInternalUser, error) {
	var row PlatformInternalUser
	var lastLogin pgtype.Timestamptz
	if err := scanner.Scan(
		&row.ID,
		&row.Email,
		&row.FullName,
		&row.IsActive,
		&row.RoleCode,
		&row.RoleName,
		&lastLogin,
		&row.ActiveSessions,
		&row.CreatedAt,
		&row.UpdatedAt,
	); err != nil {
		return PlatformInternalUser{}, err
	}
	if lastLogin.Valid {
		v := lastLogin.Time
		row.LastLogin = &v
	}
	return row, nil
}
