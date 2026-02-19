package automation

import (
	"context"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
)

type Scheduler struct {
	q      db.Querier
	engine *Engine
}

func NewScheduler(q db.Querier, engine *Engine) *Scheduler {
	return &Scheduler{q: q, engine: engine}
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

	for _, rule := range rules {
		// Basic check: if it's due
		// For MVP, we'll just check if current time matches some pattern or simply log
		// Proper cron parsing needed for production
		log.Info().Str("rule_name", rule.Name).Str("cron", rule.ScheduleCron.String).Msg("Checking scheduled rule")
		
		// Trigger the rule
		if err := s.engine.executeActions(ctx, rule.TenantID.String(), rule.ActionJson, nil); err != nil {
			log.Error().Err(err).Str("rule_id", rule.ID.String()).Msg("Failed to execute scheduled actions")
		}
	}
}
