package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const createAutomationRule = `-- name: CreateAutomationRule :one
INSERT INTO automation_rules (
    tenant_id, name, description, trigger_type, trigger_event, schedule_cron, condition_json, action_json, is_active, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING id, tenant_id, name, description, trigger_event, condition_json, action_json, is_active, created_at, updated_at, created_by, trigger_type, schedule_cron
`

type CreateAutomationRuleParams struct {
	TenantID      pgtype.UUID `json:"tenant_id"`
	Name          string      `json:"name"`
	Description   pgtype.Text `json:"description"`
	TriggerType   string      `json:"trigger_type"`
	TriggerEvent  string      `json:"trigger_event"`
	ScheduleCron  pgtype.Text `json:"schedule_cron"`
	ConditionJson []byte      `json:"condition_json"`
	ActionJson    []byte      `json:"action_json"`
	IsActive      bool        `json:"is_active"`
	CreatedBy     pgtype.UUID `json:"created_by"`
}

func (q *Queries) CreateAutomationRule(ctx context.Context, arg CreateAutomationRuleParams) (AutomationRule, error) {
	row := q.db.QueryRow(ctx, createAutomationRule,
		arg.TenantID,
		arg.Name,
		arg.Description,
		arg.TriggerType,
		arg.TriggerEvent,
		arg.ScheduleCron,
		arg.ConditionJson,
		arg.ActionJson,
		arg.IsActive,
		arg.CreatedBy,
	)

	var i AutomationRule
	err := row.Scan(
		&i.ID,
		&i.TenantID,
		&i.Name,
		&i.Description,
		&i.TriggerEvent,
		&i.ConditionJson,
		&i.ActionJson,
		&i.IsActive,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.CreatedBy,
		&i.TriggerType,
		&i.ScheduleCron,
	)
	return i, err
}
