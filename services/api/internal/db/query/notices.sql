-- name: CreateNotice :one
INSERT INTO notices (tenant_id, title, body, scope, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetNotice :one
SELECT * FROM notices
WHERE id = $1 AND tenant_id = $2;

-- name: ListNotices :many
SELECT n.*, u.full_name as author_name
FROM notices n
LEFT JOIN users u ON n.created_by = u.id
WHERE n.tenant_id = $1
ORDER BY n.created_at DESC;

-- name: AcknowledgeNotice :one
INSERT INTO notice_acks (notice_id, user_id)
VALUES ($1, $2)
ON CONFLICT (notice_id, user_id) DO UPDATE SET ack_at = NOW()
RETURNING *;

-- name: GetNoticeAcks :many
SELECT na.*, u.full_name as user_name
FROM notice_acks na
JOIN users u ON na.user_id = u.id
WHERE na.notice_id = $1;

-- name: ListNoticesForParent :many
-- This is a bit simplified, in real prod you'd filter by scope.
-- For now, we fetch all notices for the tenant.
SELECT n.*, na.ack_at
FROM notices n
LEFT JOIN notice_acks na ON n.id = na.notice_id AND na.user_id = $2
WHERE n.tenant_id = $1
ORDER BY n.created_at DESC;

-- name: DeleteNotice :exec
DELETE FROM notices
WHERE id = $1 AND tenant_id = $2;
