package automation

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
)

type Engine struct {
	q          db.Querier
	webhooks   *WebhookService
}

func NewEngine(q db.Querier, webhooks *WebhookService) *Engine {
	return &Engine{q: q, webhooks: webhooks}
}

func (e *Engine) HandleEvent(ctx context.Context, tenantID string, eventType string, payload json.RawMessage) error {
	tID := toPgUUID(tenantID)
	rules, err := e.q.ListActiveAutomationRulesByEvent(ctx, db.ListActiveAutomationRulesByEventParams{
		TenantID:     tID,
		TriggerEvent: eventType,
	})
	if err != nil {
		return fmt.Errorf("failed to list active rules: %w", err)
	}

	for _, rule := range rules {
		log.Info().Str("rule_id", rule.ID.String()).Str("rule_name", rule.Name).Msg("Evaluating automation rule")
		
		if e.matchCondition(rule.ConditionJson, payload) {
			if err := e.executeActions(ctx, rule.TenantID.String(), rule.ActionJson, payload); err != nil {
				log.Error().Err(err).Str("rule_id", rule.ID.String()).Msg("Failed to execute actions")
			}
		}
	}

	return nil
}

func (e *Engine) matchCondition(condition json.RawMessage, payload json.RawMessage) bool {
	// Simple matching for now: if condition is empty or {}, match everything.
	if len(condition) == 0 || string(condition) == "{}" {
		return true
	}
	// TODO: Implement more complex condition matching (e.g., "priority == 'high'")
	return true
}

func (e *Engine) executeActions(ctx context.Context, tenantID string, actionJson json.RawMessage, payload json.RawMessage) error {
	var actions []struct {
		Type   string          `json:"type"`
		Config json.RawMessage `json:"config"`
	}

	if err := json.Unmarshal(actionJson, &actions); err != nil {
		// Fallback for single action
		var single struct {
			Type   string          `json:"type"`
			Config json.RawMessage `json:"config"`
		}
		if err := json.Unmarshal(actionJson, &single); err == nil {
			actions = []struct {
				Type   string          `json:"type"`
				Config json.RawMessage `json:"config"`
			}{single}
		} else {
			return fmt.Errorf("invalid action_json format: %w", err)
		}
	}

	for _, action := range actions {
		switch action.Type {
		case "send_notification":
			log.Info().Msg("Executing action: send_notification")
			// Integration with NotificationService needed
		case "webhook":
			log.Info().Msg("Executing action: webhook")
			var cfg struct {
				URL string `json:"url"`
			}
			if err := json.Unmarshal(action.Config, &cfg); err == nil && cfg.URL != "" {
				if err := e.webhooks.Trigger(ctx, cfg.URL, payload); err != nil {
					log.Error().Err(err).Str("url", cfg.URL).Msg("Webhook execution failed")
				}
			}
		default:
			log.Warn().Str("action_type", action.Type).Msg("Unknown action type")
		}
	}

	return nil
}
