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
