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
SET status = @status,
    retry_count = CASE WHEN @status = 'failed' THEN retry_count + 1 ELSE retry_count END,
    error_message = @error_message,
    processed_at = CASE WHEN @status = 'completed' THEN NOW() ELSE processed_at END
WHERE id = @id;

-- name: ListOutboxEvents :many
SELECT * FROM outbox
WHERE tenant_id = @tenant_id
ORDER BY created_at DESC
LIMIT @limit_count OFFSET @offset_count;

