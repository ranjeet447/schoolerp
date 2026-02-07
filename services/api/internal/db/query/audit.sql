-- name: CreateAuditLog :one
INSERT INTO audit_logs (
    tenant_id, user_id, request_id, action, 
    resource_type, resource_id, before_state, after_state, 
    reason_code, ip_address
) VALUES (
    $1, $2, $3, $4, 
    $5, $6, $7, $8, 
    $9, $10
) RETURNING *;
