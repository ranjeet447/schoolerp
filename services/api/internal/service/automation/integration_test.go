package automation

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type automationIntegrationStore struct {
	mu         sync.Mutex
	eventRules []db.AutomationRule
	timeRules  []db.AutomationRule
	tenants    map[string]db.Tenant
	claimed    map[string]struct{}
	outbox     []db.CreateOutboxEventParams
}

func newAutomationIntegrationStore() *automationIntegrationStore {
	return &automationIntegrationStore{
		tenants: make(map[string]db.Tenant),
		claimed: make(map[string]struct{}),
		outbox:  make([]db.CreateOutboxEventParams, 0, 8),
	}
}

func (s *automationIntegrationStore) ListActiveAutomationRulesByEvent(ctx context.Context, arg db.ListActiveAutomationRulesByEventParams) ([]db.AutomationRule, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	out := make([]db.AutomationRule, 0, len(s.eventRules))
	for _, rule := range s.eventRules {
		if rule.TenantID == arg.TenantID && rule.TriggerEvent == arg.TriggerEvent && rule.IsActive {
			out = append(out, rule)
		}
	}
	return out, nil
}

func (s *automationIntegrationStore) ListActiveTimeBasedRules(ctx context.Context) ([]db.AutomationRule, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	out := make([]db.AutomationRule, 0, len(s.timeRules))
	for _, rule := range s.timeRules {
		if rule.IsActive {
			out = append(out, rule)
		}
	}
	return out, nil
}

func (s *automationIntegrationStore) GetTenantByID(ctx context.Context, id pgtype.UUID) (db.Tenant, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if tenant, ok := s.tenants[id.String()]; ok {
		return tenant, nil
	}
	return db.Tenant{}, fmt.Errorf("tenant not found: %s", id.String())
}

func (s *automationIntegrationStore) TryMarkAutomationRuleRun(ctx context.Context, arg db.TryMarkAutomationRuleRunParams) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	key := arg.RuleID.String() + "|" + arg.RunMinute.Time.UTC().Format(time.RFC3339)
	if _, exists := s.claimed[key]; exists {
		return false, nil
	}
	s.claimed[key] = struct{}{}
	return true, nil
}

func (s *automationIntegrationStore) CreateOutboxEvent(ctx context.Context, arg db.CreateOutboxEventParams) (db.Outbox, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.outbox = append(s.outbox, arg)
	return db.Outbox{
		TenantID:     arg.TenantID,
		EventType:    arg.EventType,
		Payload:      arg.Payload,
		ProcessAfter: arg.ProcessAfter,
	}, nil
}

func (s *automationIntegrationStore) outboxEvents() []db.CreateOutboxEventParams {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]db.CreateOutboxEventParams, len(s.outbox))
	copy(out, s.outbox)
	return out
}

func mustUUID(t *testing.T, raw string) pgtype.UUID {
	t.Helper()
	var u pgtype.UUID
	if err := u.Scan(raw); err != nil {
		t.Fatalf("invalid UUID %q: %v", raw, err)
	}
	return u
}

func TestEngineHandleEvent_QueuesNotificationAndEmitEvent(t *testing.T) {
	store := newAutomationIntegrationStore()
	tenantID := mustUUID(t, "11111111-1111-1111-1111-111111111111")
	ruleID := mustUUID(t, "22222222-2222-2222-2222-222222222222")

	store.eventRules = []db.AutomationRule{
		{
			ID:            ruleID,
			TenantID:      tenantID,
			Name:          "High severity automation",
			TriggerEvent:  "safety.incident.created",
			ConditionJson: []byte(`{"field":"severity","op":"eq","value":"high"}`),
			ActionJson: []byte(`[
				{"type":"send_notification","config":{"channel":"email"}},
				{"type":"emit_event","config":{"event_type":"automation.custom.alert","payload":{"source":"rule"},"merge_trigger_payload":true}}
			]`),
			IsActive: true,
		},
	}

	engine := NewEngine(store, NewWebhookService())
	err := engine.HandleEvent(context.Background(), tenantID.String(), "safety.incident.created", []byte(`{"severity":"high","incident_id":"INC-1"}`))
	if err != nil {
		t.Fatalf("HandleEvent returned error: %v", err)
	}

	events := store.outboxEvents()
	if len(events) != 2 {
		t.Fatalf("expected 2 outbox events, got %d", len(events))
	}

	foundNotification := false
	foundCustom := false
	for _, event := range events {
		switch event.EventType {
		case "automation.notification.dispatch":
			foundNotification = true
		case "automation.custom.alert":
			foundCustom = true
			var payload map[string]interface{}
			if err := json.Unmarshal(event.Payload, &payload); err != nil {
				t.Fatalf("failed to decode custom payload: %v", err)
			}
			if payload["incident_id"] != "INC-1" {
				t.Fatalf("expected merged incident_id in custom payload")
			}
		}
	}
	if !foundNotification {
		t.Fatalf("expected automation.notification.dispatch outbox event")
	}
	if !foundCustom {
		t.Fatalf("expected automation.custom.alert outbox event")
	}
}

func TestScheduler_TenantTimezoneAndDistributedDedup(t *testing.T) {
	store := newAutomationIntegrationStore()
	tenantID := mustUUID(t, "33333333-3333-3333-3333-333333333333")
	ruleID := mustUUID(t, "44444444-4444-4444-4444-444444444444")

	store.tenants[tenantID.String()] = db.Tenant{
		ID:     tenantID,
		Config: []byte(`{"timezone":"Asia/Kolkata"}`),
	}
	store.timeRules = []db.AutomationRule{
		{
			ID:           ruleID,
			TenantID:     tenantID,
			Name:         "Daily IST run",
			TriggerType:  "time",
			TriggerEvent: "time.schedule",
			ScheduleCron: pgtype.Text{String: "30 9 * * fri", Valid: true},
			ActionJson: []byte(`[
				{"type":"emit_event","config":{"event_type":"automation.scheduler.fired","payload":{"rule":"daily-ist"}}}
			]`),
			IsActive: true,
		},
	}

	engine := NewEngine(store, NewWebhookService())
	schedulerA := NewScheduler(store, engine)
	schedulerB := NewScheduler(store, engine)

	nowUTC := time.Date(2026, time.February, 20, 4, 0, 0, 0, time.UTC) // 09:30 Friday in Asia/Kolkata.
	schedulerA.nowFn = func() time.Time { return nowUTC }
	schedulerB.nowFn = func() time.Time { return nowUTC }

	schedulerA.tick(context.Background())
	schedulerB.tick(context.Background())

	events := store.outboxEvents()
	if len(events) != 1 {
		t.Fatalf("expected exactly one outbox event due to distributed dedup, got %d", len(events))
	}
	if events[0].EventType != "automation.scheduler.fired" {
		t.Fatalf("expected automation.scheduler.fired event, got %s", events[0].EventType)
	}
}
