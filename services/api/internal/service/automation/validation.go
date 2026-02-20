package automation

import (
	"bytes"
	"encoding/json"
	"errors"
	"strings"
)

func normalizeAndValidateRule(rule AutomationRule) (AutomationRule, error) {
	rule.Name = strings.TrimSpace(rule.Name)
	rule.Description = strings.TrimSpace(rule.Description)
	rule.TriggerType = strings.ToLower(strings.TrimSpace(rule.TriggerType))
	rule.TriggerEvent = strings.TrimSpace(rule.TriggerEvent)
	rule.ScheduleCron = strings.TrimSpace(rule.ScheduleCron)

	if rule.Name == "" {
		return AutomationRule{}, errors.New("name is required")
	}
	if rule.TriggerType == "" {
		rule.TriggerType = "event"
	}
	if rule.TriggerType != "event" && rule.TriggerType != "time" {
		return AutomationRule{}, errors.New("trigger_type must be one of: event, time")
	}

	if rule.TriggerType == "event" && rule.TriggerEvent == "" {
		return AutomationRule{}, errors.New("trigger_event is required for event trigger type")
	}
	if rule.TriggerType == "time" {
		if rule.TriggerEvent == "" {
			rule.TriggerEvent = "time.schedule"
		}
		if rule.ScheduleCron == "" {
			return AutomationRule{}, errors.New("schedule_cron is required for time trigger type")
		}
		if !isValidCronExpression(rule.ScheduleCron) {
			return AutomationRule{}, errors.New("schedule_cron must be a valid 5-field cron expression")
		}
	}

	if len(bytes.TrimSpace(rule.ActionJson)) == 0 {
		return AutomationRule{}, errors.New("action_json is required")
	}
	var actionTmp any
	if err := json.Unmarshal(rule.ActionJson, &actionTmp); err != nil {
		return AutomationRule{}, errors.New("action_json must be valid JSON")
	}

	if len(bytes.TrimSpace(rule.ConditionJson)) == 0 {
		rule.ConditionJson = json.RawMessage(`{}`)
	} else {
		var condTmp any
		if err := json.Unmarshal(rule.ConditionJson, &condTmp); err != nil {
			return AutomationRule{}, errors.New("condition_json must be valid JSON")
		}
	}

	return rule, nil
}
