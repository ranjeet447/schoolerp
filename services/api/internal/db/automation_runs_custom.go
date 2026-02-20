package db

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const tryMarkAutomationRuleRun = `
INSERT INTO automation_rule_runs (rule_id, tenant_id, run_minute)
VALUES ($1, $2, $3)
ON CONFLICT (rule_id, run_minute) DO NOTHING
RETURNING id
`

type TryMarkAutomationRuleRunParams struct {
	RuleID    pgtype.UUID        `json:"rule_id"`
	TenantID  pgtype.UUID        `json:"tenant_id"`
	RunMinute pgtype.Timestamptz `json:"run_minute"`
}

func (q *Queries) TryMarkAutomationRuleRun(ctx context.Context, arg TryMarkAutomationRuleRunParams) (bool, error) {
	var marker pgtype.UUID
	err := q.db.QueryRow(ctx, tryMarkAutomationRuleRun, arg.RuleID, arg.TenantID, arg.RunMinute).Scan(&marker)
	if err == pgx.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}
