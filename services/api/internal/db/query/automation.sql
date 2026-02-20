-- name: CreateAutomationRule :one
INSERT INTO automation_rules (
    tenant_id, name, description, trigger_type, trigger_event, schedule_cron, condition_json, action_json, is_active, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: GetAutomationRule :one
SELECT * FROM automation_rules WHERE id = $1 AND tenant_id = $2;

-- name: ListAutomationRules :many
SELECT * FROM automation_rules 
WHERE tenant_id = $1 
ORDER BY created_at DESC;

-- name: ListActiveAutomationRulesByEvent :many
SELECT * FROM automation_rules 
WHERE tenant_id = $1 AND trigger_event = $2 AND is_active = true;

-- name: UpdateAutomationRule :one
UPDATE automation_rules 
SET name = $3,
    description = $4,
    trigger_type = $5,
    trigger_event = $6,
    schedule_cron = $7,
    condition_json = $8,
    action_json = $9,
    is_active = $10,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: ListActiveTimeBasedRules :many
SELECT * FROM automation_rules
WHERE trigger_type = 'time' AND is_active = true;

-- name: DeleteAutomationRule :exec
DELETE FROM automation_rules WHERE id = $1 AND tenant_id = $2;
