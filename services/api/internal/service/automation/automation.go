package automation

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type AutomationService struct {
	q db.Querier
}

func NewAutomationService(q db.Querier) *AutomationService {
	return &AutomationService{q: q}
}

type AutomationRule struct {
	ID           string          `json:"id"`
	Name         string          `json:"name"`
	Description  string          `json:"description,omitempty"`
	TriggerType  string          `json:"trigger_type"` // event or time
	TriggerEvent string          `json:"trigger_event"`
	ScheduleCron string          `json:"schedule_cron,omitempty"`
	ConditionJson json.RawMessage `json:"condition_json"`
	ActionJson   json.RawMessage `json:"action_json"`
	IsActive     bool            `json:"is_active"`
}

func (s *AutomationService) CreateRule(ctx context.Context, tenantID string, rule AutomationRule, userID string) (db.AutomationRule, error) {
	tID := toPgUUID(tenantID)
	uID := toPgUUID(userID)

	return s.q.CreateAutomationRule(ctx, db.CreateAutomationRuleParams{
		TenantID:      tID,
		Name:          rule.Name,
		Description:   toPgText(rule.Description),
		TriggerType:   rule.TriggerType,
		TriggerEvent:  rule.TriggerEvent,
		ScheduleCron:  toPgText(rule.ScheduleCron),
		ConditionJson: rule.ConditionJson,
		ActionJson:    rule.ActionJson,
		IsActive:      rule.IsActive,
		CreatedBy:     uID,
	})
}

func (s *AutomationService) ListRules(ctx context.Context, tenantID string) ([]db.AutomationRule, error) {
	tID := toPgUUID(tenantID)
	return s.q.ListAutomationRules(ctx, tID)
}

func (s *AutomationService) UpdateRule(ctx context.Context, tenantID string, id string, rule AutomationRule) (db.AutomationRule, error) {
	tID := toPgUUID(tenantID)
	rID := toPgUUID(id)

	return s.q.UpdateAutomationRule(ctx, db.UpdateAutomationRuleParams{
		ID:            rID,
		TenantID:      tID,
		Name:          rule.Name,
		Description:   toPgText(rule.Description),
		TriggerType:   rule.TriggerType,
		TriggerEvent:  rule.TriggerEvent,
		ScheduleCron:  toPgText(rule.ScheduleCron),
		ConditionJson: rule.ConditionJson,
		ActionJson:    rule.ActionJson,
		IsActive:      rule.IsActive,
	})
}

func (s *AutomationService) DeleteRule(ctx context.Context, tenantID string, id string) error {
	tID := toPgUUID(tenantID)
	rID := toPgUUID(id)

	return s.q.DeleteAutomationRule(ctx, db.DeleteAutomationRuleParams{
		ID:       rID,
		TenantID: tID,
	})
}

func toPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}

func toPgText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: s != ""}
}
