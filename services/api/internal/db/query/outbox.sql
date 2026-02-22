-- name: CreateOutboxEvent :one
INSERT INTO outbox (tenant_id, event_type, payload, process_after)
VALUES (@tenant_id, @event_type, @payload, @process_after)
RETURNING *;

-- name: GetPendingOutboxEvents :many
SELECT * FROM outbox
WHERE (status = 'pending' OR (status = 'failed' AND retry_count < 5))
  AND process_after <= NOW()
ORDER BY process_after ASC, created_at ASC
LIMIT @limit_count;

-- name: UpdateOutboxEventStatus :exec
UPDATE outbox
SET status = $1,
    retry_count = CASE WHEN $1 = 'failed' THEN retry_count + 1 ELSE retry_count END,
    error_message = $2,
    processed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE processed_at END,
    process_after = CASE WHEN $1 = 'failed' THEN NOW() + (POWER(2, retry_count) * INTERVAL '1 minute') ELSE process_after END
WHERE id = $3;

-- name: ListOutboxEvents :many
SELECT * FROM outbox
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $3 OFFSET $2;
