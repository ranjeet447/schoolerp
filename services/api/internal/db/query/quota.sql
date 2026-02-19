-- Quota & Limits

-- name: CountEmployees :one
SELECT COUNT(*)
FROM employees
WHERE tenant_id = $1
  AND status = 'active';

-- name: GetEffectiveTenantLimit :one
SELECT COALESCE(
	CASE
		WHEN COALESCE(ts.overrides->'limits'->>@quota_key, '') ~ '^[0-9]+$'
		     AND (
				COALESCE(ts.overrides->'limit_overrides_meta'->@quota_key->>'expires_at', '') = ''
				OR (ts.overrides->'limit_overrides_meta'->@quota_key->>'expires_at')::timestamptz >= NOW()
			 )
		THEN (ts.overrides->'limits'->>@quota_key)::BIGINT
	END,
	CASE
		WHEN COALESCE(pp.limits->>@quota_key, '') ~ '^[0-9]+$'
		THEN (pp.limits->>@quota_key)::BIGINT
	END,
	CASE
		WHEN @quota_key = 'students' THEN 500::BIGINT
		WHEN @quota_key = 'staff' THEN 100::BIGINT
		WHEN @quota_key = 'storage_mb' THEN 10240::BIGINT
		ELSE 0::BIGINT
	END
)::BIGINT AS effective_limit
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
LEFT JOIN platform_plans pp ON pp.id = ts.plan_id
WHERE t.id = @tenant_id
LIMIT 1;

-- name: GetTenantStorageUsage :one
SELECT COALESCE(SUM(COALESCE(size, 0)), 0)::BIGINT
FROM files
WHERE tenant_id = $1;
