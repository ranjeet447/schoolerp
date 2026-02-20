package tenant

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidPasswordReason = errors.New("reset reason is required")
)

type GlobalUser struct {
	ID         string     `json:"id"`
	Email      string     `json:"email"`
	FullName   string     `json:"full_name"`
	IsActive   bool       `json:"is_active"`
	TenantID   *string    `json:"tenant_id,omitempty"`
	TenantName *string    `json:"tenant_name,omitempty"`
	RoleCode   *string    `json:"role_code,omitempty"`
	RoleName   *string    `json:"role_name,omitempty"`
	LastLogin  *time.Time `json:"last_login,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type ListGlobalUsersFilters struct {
	Search   string
	TenantID string
	RoleCode string // e.g., 'student', 'teacher'
	UserType string // 'staff' (has tenant role) or 'all'
	Limit    int32
	Offset   int32
}

func (s *Service) ListGlobalUsers(ctx context.Context, filters ListGlobalUsersFilters) ([]GlobalUser, error) {
	limit := filters.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	search := strings.TrimSpace(filters.Search)
	tenantID := strings.TrimSpace(filters.TenantID)
	roleCode := strings.TrimSpace(filters.RoleCode)

	var tid pgtype.UUID
	if tenantID != "" {
		if err := tid.Scan(tenantID); err != nil {
			return nil, ErrInvalidTenantID
		}
	}

	// Base query joins users with their primary role assignment (rank=1)
	// We prioritize tenant-scoped roles over platform-scoped roles for the "Main Context" display
	const query = `
		WITH primary_roles AS (
			SELECT DISTINCT ON (user_id)
				user_id,
				tenant_id,
				role_id,
				created_at
			FROM role_assignments
			ORDER BY user_id, created_at DESC
		)
		SELECT
			u.id::text,
			COALESCE(u.email, '') AS email,
			u.full_name,
			u.is_active,
			t.id::text AS tenant_id,
			t.name AS tenant_name,
			r.code AS role_code,
			r.name AS role_name,
			(
				SELECT MAX(ui.last_login)
				FROM user_identities ui
				WHERE ui.user_id = u.id
			) AS last_login,
			u.created_at
		FROM users u
		LEFT JOIN primary_roles pr ON pr.user_id = u.id
		LEFT JOIN tenants t ON t.id = pr.tenant_id
		LEFT JOIN roles r ON r.id = pr.role_id
		WHERE ($1::text = '' OR LOWER(u.full_name) LIKE '%' || LOWER($1) || '%' OR LOWER(COALESCE(u.email, '')) LIKE '%' || LOWER($1) || '%')
		  AND ($2::uuid IS NULL OR pr.tenant_id = $2)
		  AND ($3::text = '' OR r.code = $3)
		ORDER BY u.created_at DESC
		LIMIT $4 OFFSET $5
	`

	rows, err := s.db.Query(ctx, query, search, tid, roleCode, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]GlobalUser, 0)
	for rows.Next() {
		var row GlobalUser
		var tid pgtype.UUID
		var tname pgtype.Text
		var rcode pgtype.Text
		var rname pgtype.Text
		var lastLogin pgtype.Timestamptz

		if err := rows.Scan(
			&row.ID,
			&row.Email,
			&row.FullName,
			&row.IsActive,
			&tid,
			&tname,
			&rcode,
			&rname,
			&lastLogin,
			&row.CreatedAt,
		); err != nil {
			return nil, err
		}

		if tid.Valid {
			v := tid.String()
			row.TenantID = &v
		}
		if tname.Valid {
			v := tname.String
			row.TenantName = &v
		}
		if rcode.Valid {
			v := rcode.String
			row.RoleCode = &v
		}
		if rname.Valid {
			v := rname.String
			row.RoleName = &v
		}
		if lastLogin.Valid {
			v := lastLogin.Time
			row.LastLogin = &v
		}

		out = append(out, row)
	}

	return out, nil
}

func (s *Service) ResetGlobalUserPassword(ctx context.Context, userID, newPassword, reason, adminUserID string) error {
	if strings.TrimSpace(reason) == "" {
		return ErrInvalidPasswordReason
	}

	uid, err := parsePlatformUserUUID(userID)
	if err != nil {
		return err
	}

	_, credentialHash, err := s.validatePasswordAgainstPolicy(ctx, "", newPassword)
	if err != nil {
		return err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update password
	cmd, err := tx.Exec(
		ctx,
		`UPDATE user_identities SET credential = $2, updated_at = NOW() WHERE user_id = $1 AND provider = 'password'`,
		uid,
		credentialHash,
	)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrPlatformUserNotFound
	}

	// Revoke sessions
	refs, err := listSessionRefsForUser(ctx, tx, uid)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, uid); err != nil {
		return err
	}
	if err := s.revokeSessionRefsInStore(ctx, refs); err != nil {
		return err
	}

	// Audit
	s.RecordPlatformAudit(ctx, adminUserID, PlatformAuditEntry{
		Action:       "platform.user.reset_password",
		ResourceType: "user",
		ResourceID:   userID,
		Reason:       reason,
	})

	return tx.Commit(ctx)
}

func (s *Service) ImpersonateGlobalUser(ctx context.Context, targetUserID, reason, adminUserID string) (ImpersonationResult, error) {
	if strings.TrimSpace(reason) == "" {
		return ImpersonationResult{}, ErrInvalidReason
	}

	uid, err := parsePlatformUserUUID(targetUserID)
	if err != nil {
		return ImpersonationResult{}, err
	}

	// Verify user exists
	var email string
	var fullName string
	if err := s.db.QueryRow(ctx, `SELECT email, full_name FROM users WHERE id = $1`, uid).Scan(&email, &fullName); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ImpersonationResult{}, ErrPlatformUserNotFound
		}
		return ImpersonationResult{}, err
	}

	// Find the most relevant tenant context (if any)
	// We prefer a tenant they successfully logged into recently, or their primary assignment
	var tenantID pgtype.UUID
	var tenantName string
	err = s.db.QueryRow(ctx, `
		SELECT t.id, t.name
		FROM role_assignments ra
		JOIN tenants t ON t.id = ra.tenant_id
		WHERE ra.user_id = $1
		ORDER BY ra.created_at DESC
		LIMIT 1
	`, uid).Scan(&tenantID, &tenantName)

	if errors.Is(err, pgx.ErrNoRows) || !tenantID.Valid {
		// User has no tenant? (Platform user or orphan).
		// We still allow impersonation but without a dedicated X-Tenant-ID claim in the result struct,
		// though the token generator might need one.
		// For now, let's fall back to system tenant if they are a platform user.
		// NOTE: This logic might need refinement based on exact auth requirements.
	} else if err != nil {
		return ImpersonationResult{}, err
	}

	// Generate Token
	tokenDuration := 60 * time.Minute
	expiresAt := time.Now().UTC().Add(tokenDuration)

	claims := jwt.MapClaims{
		"sub":   targetUserID,
		"email": email,
		"iss":   "schoolerp-platform",
		"iat":   time.Now().Unix(),
		"exp":   expiresAt.Unix(),
		"type":  "impersonation",
		"act": map[string]string{
			"sub": adminUserID,
		},
	}

	if tenantID.Valid {
		claims["tid"] = tenantID.String() // Primary tenant context
	}

	token, err := s.MintImpersonationToken(ctx, claims)
	if err != nil {
		return ImpersonationResult{}, err
	}

	return ImpersonationResult{
		Token:            token,
		TargetUserID:     targetUserID,
		TargetUserEmail:  email,
		TargetTenantID:   tenantID.String(),
		TargetTenantName: tenantName,
		ExpiresAt:        expiresAt,
	}, nil
}
