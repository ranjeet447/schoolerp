-- name: CreateAIQueryLog :one
INSERT INTO ai_query_logs (
    tenant_id, user_id, provider, model, tokens_used, cost, metadata
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetTenantAIUsage :many
SELECT 
    model,
    SUM(tokens_used) as total_tokens,
    SUM(cost) as total_cost,
    COUNT(*) as total_queries
FROM ai_query_logs
WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3
GROUP BY model;

-- name: ListAIQueryLogs :many
SELECT * FROM ai_query_logs
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetAIChatSession :one
SELECT * FROM ai_chat_sessions
WHERE tenant_id = $1 AND external_id = $2;

-- name: UpsertAIChatSession :one
INSERT INTO ai_chat_sessions (
    tenant_id, external_id, messages, metadata, expires_at
) VALUES (
    $1, $2, $3, $4, $5
)
ON CONFLICT (tenant_id, external_id) DO UPDATE
SET messages = $3,
    metadata = $4,
    expires_at = $5,
    updated_at = NOW()
RETURNING *;

-- name: DeleteExpiredAIChatSessions :exec
DELETE FROM ai_chat_sessions WHERE expires_at < NOW();
