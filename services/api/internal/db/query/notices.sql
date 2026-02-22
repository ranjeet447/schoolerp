-- name: CreateNotice :one
INSERT INTO notices (tenant_id, title, body, scope, attachments, publish_at, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetNotice :one
SELECT * FROM notices
WHERE id = $1 AND tenant_id = $2;

-- name: ListNotices :many
SELECT n.*, u.full_name as author_name
FROM notices n
LEFT JOIN users u ON n.created_by = u.id
WHERE n.tenant_id = $1
ORDER BY n.publish_at DESC, n.created_at DESC;

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

-- name: GetNoticeAckStats :one
SELECT 
    COUNT(DISTINCT sg.guardian_id) as total_audience,
    COUNT(DISTINCT na.user_id) as acknowledged_count,
    (COUNT(DISTINCT sg.guardian_id) - COUNT(DISTINCT na.user_id)) as pending_count
FROM notices n
JOIN students s ON s.tenant_id = n.tenant_id AND s.status = 'active'
JOIN student_guardians sg ON sg.student_id = s.id AND sg.is_primary = TRUE
JOIN guardians g ON g.id = sg.guardian_id
LEFT JOIN notice_acks na ON na.notice_id = n.id AND na.user_id = g.user_id
WHERE n.id = $1 AND n.tenant_id = $2;

-- name: ListNoticeAcksWithStatus :many
SELECT 
    g.id as guardian_id,
    g.full_name as guardian_name,
    g.user_id as user_id,
    s.full_name as student_name,
    s.admission_number,
    na.ack_at IS NOT NULL as is_acknowledged,
    na.ack_at
FROM notices n
JOIN students s ON s.tenant_id = n.tenant_id AND s.status = 'active'
JOIN student_guardians sg ON sg.student_id = s.id AND sg.is_primary = TRUE
JOIN guardians g ON g.id = sg.guardian_id
LEFT JOIN notice_acks na ON na.notice_id = n.id AND na.user_id = g.user_id
WHERE n.id = $1 AND n.tenant_id = $2
ORDER BY is_acknowledged DESC, g.full_name ASC;

-- name: ListNoticesForParent :many
-- Fetch notices that are published (publish_at <= NOW())
SELECT n.*, na.ack_at
FROM notices n
LEFT JOIN notice_acks na ON n.id = na.notice_id AND na.user_id = $2
WHERE n.tenant_id = $1 AND n.publish_at <= NOW()
ORDER BY n.publish_at DESC;

-- name: DeleteNotice :exec
DELETE FROM notices
WHERE id = $1 AND tenant_id = $2;
