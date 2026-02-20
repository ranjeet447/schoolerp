package db

import (
	"context"
	"strings"
)

// ResolveActiveTenantByIdentifier resolves an active tenant from:
// - UUID string (id::text)
// - subdomain
// - full custom domain
func (q *Queries) ResolveActiveTenantByIdentifier(ctx context.Context, identifier string) (Tenant, error) {
	const query = `
		SELECT id, name, subdomain, domain, logo_url, board_type, config, is_active, created_at, updated_at
		FROM tenants
		WHERE is_active = TRUE
		  AND (
		    id::text = $1
		    OR LOWER(subdomain) = LOWER($1)
		    OR LOWER(COALESCE(domain, '')) = LOWER($1)
		  )
		ORDER BY
		  CASE
		    WHEN id::text = $1 THEN 0
		    WHEN LOWER(COALESCE(domain, '')) = LOWER($1) THEN 1
		    WHEN LOWER(subdomain) = LOWER($1) THEN 2
		    ELSE 3
		  END
		LIMIT 1
	`

	id := strings.TrimSpace(identifier)
	row := q.db.QueryRow(ctx, query, id)
	var t Tenant
	err := row.Scan(
		&t.ID,
		&t.Name,
		&t.Subdomain,
		&t.Domain,
		&t.LogoUrl,
		&t.BoardType,
		&t.Config,
		&t.IsActive,
		&t.CreatedAt,
		&t.UpdatedAt,
	)
	return t, err
}

// ResolveActiveTenantByHost resolves an active tenant from request host.
// Matching priority:
// 1) exact custom domain
// 2) exact subdomain
// 3) left-most host label as subdomain fallback
func (q *Queries) ResolveActiveTenantByHost(ctx context.Context, host string) (Tenant, error) {
	const query = `
		SELECT id, name, subdomain, domain, logo_url, board_type, config, is_active, created_at, updated_at
		FROM tenants
		WHERE is_active = TRUE
		  AND (
		    LOWER(COALESCE(domain, '')) = LOWER($1)
		    OR LOWER(subdomain) = LOWER($1)
		    OR LOWER(subdomain) = LOWER($2)
		  )
		ORDER BY
		  CASE
		    WHEN LOWER(COALESCE(domain, '')) = LOWER($1) THEN 0
		    WHEN LOWER(subdomain) = LOWER($1) THEN 1
		    WHEN LOWER(subdomain) = LOWER($2) THEN 2
		    ELSE 3
		  END
		LIMIT 1
	`

	normalizedHost := strings.TrimSpace(strings.ToLower(host))
	leftMost := normalizedHost
	if idx := strings.IndexByte(normalizedHost, '.'); idx > 0 {
		leftMost = normalizedHost[:idx]
	}

	row := q.db.QueryRow(ctx, query, normalizedHost, leftMost)
	var t Tenant
	err := row.Scan(
		&t.ID,
		&t.Name,
		&t.Subdomain,
		&t.Domain,
		&t.LogoUrl,
		&t.BoardType,
		&t.Config,
		&t.IsActive,
		&t.CreatedAt,
		&t.UpdatedAt,
	)
	return t, err
}
