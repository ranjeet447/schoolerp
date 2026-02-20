package automation

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
)

type schedulerStore interface {
	ListActiveTimeBasedRules(ctx context.Context) ([]db.AutomationRule, error)
	GetTenantByID(ctx context.Context, id pgtype.UUID) (db.Tenant, error)
	TryMarkAutomationRuleRun(ctx context.Context, arg db.TryMarkAutomationRuleRunParams) (bool, error)
}

type Scheduler struct {
	q               schedulerStore
	engine          *Engine
	nowFn           func() time.Time
	mu              sync.Mutex
	fallbackLastRun map[string]time.Time
}

func NewScheduler(q schedulerStore, engine *Engine) *Scheduler {
	return &Scheduler{
		q:               q,
		engine:          engine,
		nowFn:           time.Now,
		fallbackLastRun: map[string]time.Time{},
	}
}

func (s *Scheduler) Start(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	log.Info().Msg("Automation Scheduler started")

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.tick(ctx)
		}
	}
}

func (s *Scheduler) tick(ctx context.Context) {
	rules, err := s.q.ListActiveTimeBasedRules(ctx)
	if err != nil {
		log.Error().Err(err).Msg("failed to list active time-based rules")
		return
	}
	nowUTC := s.nowFn().UTC().Truncate(time.Minute)
	tenantTZ := make(map[string]*time.Location, len(rules))

	for _, rule := range rules {
		cronExpr := strings.TrimSpace(rule.ScheduleCron.String)
		if cronExpr == "" {
			log.Warn().Str("rule_id", rule.ID.String()).Msg("Skipping time rule without schedule_cron")
			continue
		}

		loc := s.resolveTenantLocation(ctx, rule.TenantID, tenantTZ)
		localNow := nowUTC.In(loc)
		if !shouldRunNow(cronExpr, localNow) {
			continue
		}

		claimed, err := s.q.TryMarkAutomationRuleRun(ctx, db.TryMarkAutomationRuleRunParams{
			RuleID:    rule.ID,
			TenantID:  rule.TenantID,
			RunMinute: pgtype.Timestamptz{Time: nowUTC, Valid: true},
		})
		if err != nil {
			claimed = s.markRunForMinuteFallback(rule.ID.String(), nowUTC)
			if !claimed {
				continue
			}
			log.Warn().
				Err(err).
				Str("rule_id", rule.ID.String()).
				Msg("Failed to claim distributed execution; using in-process fallback dedup")
		}
		if !claimed {
			continue
		}

		log.Info().
			Str("rule_id", rule.ID.String()).
			Str("rule_name", rule.Name).
			Str("cron", cronExpr).
			Str("run_at_utc", nowUTC.Format(time.RFC3339)).
			Str("tenant_local_time", localNow.Format(time.RFC3339)).
			Str("tenant_timezone", loc.String()).
			Msg("Executing scheduled automation rule")

		payload, _ := json.Marshal(map[string]interface{}{
			"trigger":       "scheduler",
			"schedule_cron": cronExpr,
			"fired_at_utc":  nowUTC.Format(time.RFC3339),
			"tenant_time":   localNow.Format(time.RFC3339),
			"timezone":      loc.String(),
		})

		if err := s.engine.executeActions(ctx, rule.TenantID.String(), rule.ActionJson, payload); err != nil {
			log.Error().Err(err).Str("rule_id", rule.ID.String()).Msg("Failed to execute scheduled actions")
		}
	}
}

func (s *Scheduler) resolveTenantLocation(ctx context.Context, tenantID pgtype.UUID, cache map[string]*time.Location) *time.Location {
	cacheKey := tenantID.String()
	if loc, ok := cache[cacheKey]; ok {
		return loc
	}

	tenant, err := s.q.GetTenantByID(ctx, tenantID)
	if err != nil {
		log.Warn().Err(err).Str("tenant_id", cacheKey).Msg("failed to load tenant config; defaulting automation timezone to UTC")
		cache[cacheKey] = time.UTC
		return time.UTC
	}

	tz := extractTenantTimezone(tenant.Config)
	loc, err := time.LoadLocation(tz)
	if err != nil {
		log.Warn().Err(err).Str("tenant_id", cacheKey).Str("timezone", tz).Msg("invalid tenant timezone; defaulting to UTC")
		loc = time.UTC
	}
	cache[cacheKey] = loc
	return loc
}

func extractTenantTimezone(configJSON []byte) string {
	if len(strings.TrimSpace(string(configJSON))) == 0 {
		return "UTC"
	}

	var cfg map[string]interface{}
	if err := json.Unmarshal(configJSON, &cfg); err != nil {
		return "UTC"
	}

	raw, _ := cfg["timezone"]
	if tz, ok := raw.(string); ok && strings.TrimSpace(tz) != "" {
		return strings.TrimSpace(tz)
	}

	// Some tenants can carry nested timezone object/field in custom config shapes.
	if settings, ok := cfg["settings"].(map[string]interface{}); ok {
		if tz, ok := settings["timezone"].(string); ok && strings.TrimSpace(tz) != "" {
			return strings.TrimSpace(tz)
		}
	}

	return "UTC"
}

func (s *Scheduler) markRunForMinuteFallback(ruleID string, minute time.Time) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if prev, ok := s.fallbackLastRun[ruleID]; ok && prev.Equal(minute) {
		return false
	}
	s.fallbackLastRun[ruleID] = minute
	return true
}
