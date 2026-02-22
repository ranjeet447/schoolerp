-- name: CreateNotificationTemplate :one
INSERT INTO notification_templates (
    tenant_id, code, channel, locale, subject, body
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetNotificationTemplate :one
SELECT * FROM notification_templates
WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL);

-- name: ListNotificationTemplates :many
SELECT * FROM notification_templates
WHERE (tenant_id = $1 OR tenant_id IS NULL)
ORDER BY code ASC, channel ASC;

-- name: UpdateNotificationTemplate :one
UPDATE notification_templates
SET 
    subject = $3,
    body = $4,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: DeleteNotificationTemplate :exec
DELETE FROM notification_templates
WHERE id = $1 AND tenant_id = $2;

-- name: ResolveNotificationTemplate :one
SELECT * FROM notification_templates
WHERE (tenant_id = $1 OR tenant_id IS NULL)
AND code = $2
AND channel = $3
ORDER BY (CASE WHEN locale = $4 THEN 0 WHEN locale = 'en' THEN 1 ELSE 2 END) ASC
LIMIT 1;

-- name: CreateNotificationGatewayConfig :one
INSERT INTO notification_gateway_configs (
    tenant_id, provider, api_key, api_secret, sender_id, is_active, settings
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) ON CONFLICT (tenant_id, provider) DO UPDATE SET
    api_key = EXCLUDED.api_key,
    api_secret = EXCLUDED.api_secret,
    sender_id = EXCLUDED.sender_id,
    is_active = EXCLUDED.is_active,
    settings = EXCLUDED.settings,
    updated_at = NOW()
RETURNING *;

-- name: GetTenantActiveNotificationGateway :one
SELECT * FROM notification_gateway_configs
WHERE tenant_id = $1 AND is_active = true
LIMIT 1;

-- name: ListNotificationGatewayConfigs :many
SELECT * FROM notification_gateway_configs
WHERE tenant_id = $1
ORDER BY provider;

-- name: LogSmsUsage :one
INSERT INTO sms_usage_logs (
    tenant_id, provider, recipient, message_content, message_count, cost, status, external_id, error_message
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: GetSmsBillingSummary :many
SELECT 
    provider,
    SUM(message_count)::bigint as total_messages,
    SUM(cost)::numeric as total_cost
FROM sms_usage_logs
WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3
GROUP BY provider;

-- name: ListSmsUsageLogsWithFilters :many
SELECT * FROM sms_usage_logs
WHERE tenant_id = @tenant_id
  AND (provider = @provider OR @provider = '')
  AND (status = @status OR @status = '')
  AND (created_at >= @from_date OR @from_date IS NULL)
  AND (created_at <= @to_date OR @to_date IS NULL)
ORDER BY created_at DESC
LIMIT @limit_val OFFSET @offset_val;

-- name: GetSmsUsageStats :one
SELECT 
    COUNT(*)::bigint as total_count,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)::bigint as delivered_count,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::bigint as failed_count,
    COALESCE(SUM(cost), 0)::numeric as total_cost
FROM sms_usage_logs
WHERE tenant_id = @tenant_id AND created_at >= @since;

-- name: GetOutboxStatusStats :one
SELECT 
    COUNT(*)::bigint as total_count,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::bigint as completed_count,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::bigint as failed_count,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::bigint as pending_count
FROM outbox
WHERE tenant_id = @tenant_id AND created_at >= @since;
