-- name: GetTenantBySubdomain :one
SELECT * FROM tenants
WHERE subdomain = $1 LIMIT 1;

-- name: GetTenantByID :one
SELECT * FROM tenants
WHERE id = $1 LIMIT 1;

-- name: UpdateTenantConfig :one
UPDATE tenants
SET config = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: CreateTenant :one
INSERT INTO tenants (id, name, subdomain, domain, config, is_active)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
