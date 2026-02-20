package automation

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
)

type engineStore interface {
	ListActiveAutomationRulesByEvent(ctx context.Context, arg db.ListActiveAutomationRulesByEventParams) ([]db.AutomationRule, error)
	CreateOutboxEvent(ctx context.Context, arg db.CreateOutboxEventParams) (db.Outbox, error)
}

type Engine struct {
	q        engineStore
	webhooks *WebhookService
}

func NewEngine(q engineStore, webhooks *WebhookService) *Engine {
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
	ok, err := evaluateRuleCondition(condition, payload)
	if err != nil {
		log.Warn().Err(err).Msg("failed to evaluate automation condition")
		return false
	}
	return ok
}

func (e *Engine) executeActions(ctx context.Context, tenantID string, actionJson json.RawMessage, payload json.RawMessage) error {
	var actions []automationAction

	if err := json.Unmarshal(actionJson, &actions); err != nil {
		// Fallback for single action
		var single automationAction
		if err := json.Unmarshal(actionJson, &single); err == nil {
			actions = []automationAction{single}
		} else {
			return fmt.Errorf("invalid action_json format: %w", err)
		}
	}

	for _, action := range actions {
		switch strings.ToLower(strings.TrimSpace(action.Type)) {
		case "send_notification":
			if err := e.queueNotificationAction(ctx, tenantID, action.Config, payload); err != nil {
				log.Error().Err(err).Msg("Failed to queue send_notification action")
			}
		case "emit_event", "enqueue_event", "outbox_event":
			if err := e.queueOutboxEventAction(ctx, tenantID, action.Config, payload); err != nil {
				log.Error().Err(err).Msg("Failed to queue outbox event action")
			}
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

type automationAction struct {
	Type   string          `json:"type"`
	Config json.RawMessage `json:"config"`
}

type notificationActionConfig struct {
	EventType    string                 `json:"event_type"`
	Channel      string                 `json:"channel"`
	Channels     []string               `json:"channels"`
	Recipients   []string               `json:"recipients"`
	TemplateCode string                 `json:"template_code"`
	Locale       string                 `json:"locale"`
	Subject      string                 `json:"subject"`
	Body         string                 `json:"body"`
	Data         map[string]interface{} `json:"data"`
}

type outboxEventActionConfig struct {
	EventType           string                 `json:"event_type"`
	Payload             map[string]interface{} `json:"payload"`
	MergeTriggerPayload bool                   `json:"merge_trigger_payload"`
	ProcessAfterSeconds int                    `json:"process_after_seconds"`
}

func (e *Engine) queueNotificationAction(ctx context.Context, tenantID string, configJSON json.RawMessage, payload json.RawMessage) error {
	var cfg notificationActionConfig
	if len(strings.TrimSpace(string(configJSON))) > 0 {
		if err := json.Unmarshal(configJSON, &cfg); err != nil {
			return fmt.Errorf("invalid send_notification config: %w", err)
		}
	}

	eventType := strings.TrimSpace(cfg.EventType)
	if eventType == "" {
		eventType = "automation.notification.dispatch"
	}

	channels := make([]string, 0, len(cfg.Channels)+1)
	for _, c := range cfg.Channels {
		trimmed := strings.TrimSpace(c)
		if trimmed != "" {
			channels = append(channels, trimmed)
		}
	}
	if ch := strings.TrimSpace(cfg.Channel); ch != "" {
		channels = append(channels, ch)
	}

	outboxPayload, err := json.Marshal(map[string]interface{}{
		"source":        "automation",
		"channels":      channels,
		"recipients":    cfg.Recipients,
		"template_code": strings.TrimSpace(cfg.TemplateCode),
		"locale":        strings.TrimSpace(cfg.Locale),
		"subject":       strings.TrimSpace(cfg.Subject),
		"body":          cfg.Body,
		"data":          cfg.Data,
		"event_payload": json.RawMessage(payload),
		"triggered_at":  time.Now().UTC().Format(time.RFC3339),
	})
	if err != nil {
		return fmt.Errorf("failed to marshal notification payload: %w", err)
	}

	_, err = e.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
		TenantID:     toPgUUID(tenantID),
		EventType:    eventType,
		Payload:      outboxPayload,
		ProcessAfter: pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	})
	if err != nil {
		return fmt.Errorf("failed to queue notification outbox event: %w", err)
	}

	log.Info().Str("event_type", eventType).Msg("Queued automation notification event")
	return nil
}

func (e *Engine) queueOutboxEventAction(ctx context.Context, tenantID string, configJSON json.RawMessage, triggerPayload json.RawMessage) error {
	var cfg outboxEventActionConfig
	if len(strings.TrimSpace(string(configJSON))) > 0 {
		if err := json.Unmarshal(configJSON, &cfg); err != nil {
			return fmt.Errorf("invalid outbox event config: %w", err)
		}
	}

	eventType := strings.TrimSpace(cfg.EventType)
	if eventType == "" {
		return fmt.Errorf("event_type is required for outbox event action")
	}

	mergedPayload := map[string]interface{}{}
	if cfg.MergeTriggerPayload {
		var triggerMap map[string]interface{}
		if len(strings.TrimSpace(string(triggerPayload))) > 0 {
			if err := json.Unmarshal(triggerPayload, &triggerMap); err == nil {
				for k, v := range triggerMap {
					mergedPayload[k] = v
				}
			}
		}
	}
	for k, v := range cfg.Payload {
		mergedPayload[k] = v
	}
	if len(mergedPayload) == 0 {
		mergedPayload["source"] = "automation"
		mergedPayload["triggered_at"] = time.Now().UTC().Format(time.RFC3339)
	}

	body, err := json.Marshal(mergedPayload)
	if err != nil {
		return fmt.Errorf("failed to marshal outbox event payload: %w", err)
	}

	runAt := time.Now().UTC()
	if cfg.ProcessAfterSeconds > 0 {
		runAt = runAt.Add(time.Duration(cfg.ProcessAfterSeconds) * time.Second)
	}

	_, err = e.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
		TenantID:     toPgUUID(tenantID),
		EventType:    eventType,
		Payload:      body,
		ProcessAfter: pgtype.Timestamptz{Time: runAt, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("failed to queue outbox event action: %w", err)
	}
	return nil
}
