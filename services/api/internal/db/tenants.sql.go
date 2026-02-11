package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type UpdateTenantConfigParams struct {
	ID     pgtype.UUID `json:"id"`
	Config []byte      `json:"config"`
}

const getTenantBySubdomain = `-- name: GetTenantBySubdomain :one
SELECT id, name, subdomain, domain, logo_url, config, is_active, created_at, updated_at FROM tenants
WHERE subdomain = $1 LIMIT 1
`

func (q *Queries) GetTenantBySubdomain(ctx context.Context, subdomain string) (Tenant, error) {
	row := q.db.QueryRow(ctx, getTenantBySubdomain, subdomain)
	var i Tenant
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Subdomain,
		&i.Domain,
		&i.LogoUrl,
		&i.Config,
		&i.IsActive,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getTenantByID = `-- name: GetTenantByID :one
SELECT id, name, subdomain, domain, logo_url, config, is_active, created_at, updated_at FROM tenants
WHERE id = $1 LIMIT 1
`

func (q *Queries) GetTenantByID(ctx context.Context, id pgtype.UUID) (Tenant, error) {
	row := q.db.QueryRow(ctx, getTenantByID, id)
	var i Tenant
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Subdomain,
		&i.Domain,
		&i.LogoUrl,
		&i.Config,
		&i.IsActive,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateTenantConfig = `-- name: UpdateTenantConfig :one
UPDATE tenants
SET config = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, name, subdomain, domain, logo_url, config, is_active, created_at, updated_at
`

func (q *Queries) UpdateTenantConfig(ctx context.Context, arg UpdateTenantConfigParams) (Tenant, error) {
	row := q.db.QueryRow(ctx, updateTenantConfig, arg.ID, arg.Config)
	var i Tenant
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.Subdomain,
		&i.Domain,
		&i.LogoUrl,
		&i.Config,
		&i.IsActive,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
