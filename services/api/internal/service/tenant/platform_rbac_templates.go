package tenant

import (
	"context"
	"errors"
	"sort"
	"strings"
)

var (
	ErrInvalidRBACRoleCode       = errors.New("invalid platform role code")
	ErrInvalidRBACPermissionCode = errors.New("invalid platform permission code")
)

type PlatformPermissionTemplate struct {
	Code        string `json:"code"`
	Module      string `json:"module"`
	Description string `json:"description"`
}

type PlatformRoleTemplate struct {
	RoleCode        string   `json:"role_code"`
	RoleName        string   `json:"role_name"`
	PermissionCodes []string `json:"permission_codes"`
}

type PlatformRBACMatrix struct {
	Roles       []PlatformRoleTemplate       `json:"roles"`
	Permissions []PlatformPermissionTemplate `json:"permissions"`
}

type UpdatePlatformRolePermissionsParams struct {
	PermissionCodes []string `json:"permission_codes"`
	UpdatedBy       string   `json:"-"`
}

func (s *Service) ListPlatformRBACTemplates(ctx context.Context) (PlatformRBACMatrix, error) {
	codes := platformRoleCodesOrdered()

	const rolesQuery = `
		SELECT DISTINCT ON (r.code)
			r.code,
			r.name
		FROM roles r
		WHERE r.tenant_id IS NULL
		  AND r.code = ANY($1::text[])
		ORDER BY r.code, r.created_at ASC
	`
	roleRows, err := s.db.Query(ctx, rolesQuery, codes)
	if err != nil {
		return PlatformRBACMatrix{}, err
	}
	defer roleRows.Close()

	roleNameByCode := map[string]string{}
	for roleRows.Next() {
		var code string
		var name string
		if err := roleRows.Scan(&code, &name); err != nil {
			return PlatformRBACMatrix{}, err
		}
		roleNameByCode[strings.TrimSpace(code)] = strings.TrimSpace(name)
	}
	if err := roleRows.Err(); err != nil {
		return PlatformRBACMatrix{}, err
	}

	const permsQuery = `
		SELECT code, module, COALESCE(description, '') AS description
		FROM permissions
		WHERE code LIKE 'platform:%'
		ORDER BY code ASC
	`
	permRows, err := s.db.Query(ctx, permsQuery)
	if err != nil {
		return PlatformRBACMatrix{}, err
	}
	defer permRows.Close()

	permissions := make([]PlatformPermissionTemplate, 0)
	for permRows.Next() {
		var row PlatformPermissionTemplate
		if err := permRows.Scan(&row.Code, &row.Module, &row.Description); err != nil {
			return PlatformRBACMatrix{}, err
		}
		permissions = append(permissions, row)
	}
	if err := permRows.Err(); err != nil {
		return PlatformRBACMatrix{}, err
	}

	const matrixQuery = `
		SELECT DISTINCT ON (r.code, p.code)
			r.code,
			p.code
		FROM role_permissions rp
		JOIN roles r ON r.id = rp.role_id
		JOIN permissions p ON p.id = rp.permission_id
		WHERE r.tenant_id IS NULL
		  AND r.code = ANY($1::text[])
		  AND p.code LIKE 'platform:%'
		ORDER BY r.code, p.code
	`
	matrixRows, err := s.db.Query(ctx, matrixQuery, codes)
	if err != nil {
		return PlatformRBACMatrix{}, err
	}
	defer matrixRows.Close()

	permMap := map[string][]string{}
	for matrixRows.Next() {
		var roleCode string
		var permCode string
		if err := matrixRows.Scan(&roleCode, &permCode); err != nil {
			return PlatformRBACMatrix{}, err
		}
		roleCode = strings.TrimSpace(roleCode)
		permCode = strings.TrimSpace(permCode)
		if roleCode == "" || permCode == "" {
			continue
		}
		permMap[roleCode] = append(permMap[roleCode], permCode)
	}
	if err := matrixRows.Err(); err != nil {
		return PlatformRBACMatrix{}, err
	}

	roles := make([]PlatformRoleTemplate, 0, len(codes))
	for _, code := range codes {
		name := strings.TrimSpace(roleNameByCode[code])
		if name == "" {
			if fallback, ok := platformRoleCatalog[code]; ok {
				name = fallback
			} else {
				name = code
			}
		}
		codesForRole := append([]string{}, permMap[code]...)
		sort.Strings(codesForRole)
		roles = append(roles, PlatformRoleTemplate{
			RoleCode:        code,
			RoleName:        name,
			PermissionCodes: codesForRole,
		})
	}

	return PlatformRBACMatrix{
		Roles:       roles,
		Permissions: permissions,
	}, nil
}

func (s *Service) UpdatePlatformRolePermissions(ctx context.Context, roleCode string, params UpdatePlatformRolePermissionsParams) (PlatformRoleTemplate, error) {
	roleCode = strings.ToLower(strings.TrimSpace(roleCode))
	if !isValidPlatformRoleCode(roleCode) {
		return PlatformRoleTemplate{}, ErrInvalidRBACRoleCode
	}

	normalizedCodes := make([]string, 0, len(params.PermissionCodes))
	seen := map[string]struct{}{}
	for _, raw := range params.PermissionCodes {
		code := strings.ToLower(strings.TrimSpace(raw))
		if code == "" {
			continue
		}
		if !strings.HasPrefix(code, "platform:") {
			return PlatformRoleTemplate{}, ErrInvalidRBACPermissionCode
		}
		if _, exists := seen[code]; exists {
			continue
		}
		seen[code] = struct{}{}
		normalizedCodes = append(normalizedCodes, code)
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PlatformRoleTemplate{}, err
	}
	defer tx.Rollback(ctx)

	roleID, err := ensurePlatformRole(ctx, tx, roleCode)
	if err != nil {
		if errors.Is(err, ErrPlatformRoleNotAllowed) {
			return PlatformRoleTemplate{}, ErrInvalidRBACRoleCode
		}
		return PlatformRoleTemplate{}, err
	}

	if len(normalizedCodes) > 0 {
		const checkPerms = `
			SELECT COUNT(*)::INT
			FROM permissions
			WHERE code = ANY($1::text[])
		`
		var count int
		if err := tx.QueryRow(ctx, checkPerms, normalizedCodes).Scan(&count); err != nil {
			return PlatformRoleTemplate{}, err
		}
		if count != len(normalizedCodes) {
			return PlatformRoleTemplate{}, ErrInvalidRBACPermissionCode
		}
	}

	const clearRolePerms = `
		DELETE FROM role_permissions rp
		USING permissions p
		WHERE rp.role_id = $1
		  AND p.id = rp.permission_id
		  AND p.code LIKE 'platform:%'
	`
	if _, err := tx.Exec(ctx, clearRolePerms, roleID); err != nil {
		return PlatformRoleTemplate{}, err
	}

	if len(normalizedCodes) > 0 {
		const assignQuery = `
			INSERT INTO role_permissions (role_id, permission_id)
			SELECT $1, p.id
			FROM permissions p
			WHERE p.code = ANY($2::text[])
			ON CONFLICT DO NOTHING
		`
		if _, err := tx.Exec(ctx, assignQuery, roleID, normalizedCodes); err != nil {
			return PlatformRoleTemplate{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return PlatformRoleTemplate{}, err
	}

	templates, err := s.ListPlatformRBACTemplates(ctx)
	if err != nil {
		return PlatformRoleTemplate{}, err
	}
	for _, role := range templates.Roles {
		if role.RoleCode == roleCode {
			return role, nil
		}
	}
	return PlatformRoleTemplate{}, ErrInvalidRBACRoleCode
}

func platformRoleCodesOrdered() []string {
	return []string{"super_admin", "support_l1", "support_l2", "finance", "ops", "developer"}
}
