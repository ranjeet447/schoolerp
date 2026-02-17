package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const countEmployees = `
SELECT COUNT(*)
FROM employees
WHERE tenant_id = $1
  AND status = 'active'
`

func (q *Queries) CountEmployees(ctx context.Context, tenantID pgtype.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countEmployees, tenantID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

type GetEffectiveTenantLimitParams struct {
	TenantID pgtype.UUID
	QuotaKey string
}

const getEffectiveTenantLimit = `
SELECT COALESCE(
	CASE
		WHEN COALESCE(ts.overrides->'limits'->>$2, '') ~ '^[0-9]+$'
		     AND (
				COALESCE(ts.overrides->'limit_overrides_meta'->$2->>'expires_at', '') = ''
				OR (ts.overrides->'limit_overrides_meta'->$2->>'expires_at')::timestamptz >= NOW()
			 )
		THEN (ts.overrides->'limits'->>$2)::BIGINT
	END,
	CASE
		WHEN COALESCE(pp.limits->>$2, '') ~ '^[0-9]+$'
		THEN (pp.limits->>$2)::BIGINT
	END,
	CASE
		WHEN $2 = 'students' THEN 500::BIGINT
		WHEN $2 = 'staff' THEN 100::BIGINT
		WHEN $2 = 'storage_mb' THEN 10240::BIGINT
		ELSE 0::BIGINT
	END
) AS effective_limit
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
LEFT JOIN platform_plans pp ON pp.id = ts.plan_id
WHERE t.id = $1
LIMIT 1
`

func (q *Queries) GetEffectiveTenantLimit(ctx context.Context, arg GetEffectiveTenantLimitParams) (int64, error) {
	row := q.db.QueryRow(ctx, getEffectiveTenantLimit, arg.TenantID, arg.QuotaKey)
	var limit int64
	err := row.Scan(&limit)
	return limit, err
}
