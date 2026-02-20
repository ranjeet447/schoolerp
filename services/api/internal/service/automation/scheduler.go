package automation

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
)

type Scheduler struct {
	q       db.Querier
	engine  *Engine
	mu      sync.Mutex
	lastRun map[string]time.Time
}

func NewScheduler(q db.Querier, engine *Engine) *Scheduler {
	return &Scheduler{q: q, engine: engine, lastRun: map[string]time.Time{}}
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
	now := time.Now().UTC().Truncate(time.Minute)

	for _, rule := range rules {
		cronExpr := strings.TrimSpace(rule.ScheduleCron.String)
		if cronExpr == "" {
			log.Warn().Str("rule_id", rule.ID.String()).Msg("Skipping time rule without schedule_cron")
			continue
		}

		if !shouldRunNow(cronExpr, now) {
			continue
		}

		ruleID := rule.ID.String()
		if !s.markRunForMinute(ruleID, now) {
			continue
		}

		log.Info().
			Str("rule_id", ruleID).
			Str("rule_name", rule.Name).
			Str("cron", cronExpr).
			Str("run_at", now.Format(time.RFC3339)).
			Msg("Executing scheduled automation rule")

		payload, _ := json.Marshal(map[string]interface{}{
			"trigger":       "scheduler",
			"schedule_cron": cronExpr,
			"fired_at":      now.Format(time.RFC3339),
		})

		if err := s.engine.executeActions(ctx, rule.TenantID.String(), rule.ActionJson, payload); err != nil {
			log.Error().Err(err).Str("rule_id", rule.ID.String()).Msg("Failed to execute scheduled actions")
		}
	}
}

func (s *Scheduler) markRunForMinute(ruleID string, minute time.Time) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if prev, ok := s.lastRun[ruleID]; ok && prev.Equal(minute) {
		return false
	}
	s.lastRun[ruleID] = minute
	return true
}
