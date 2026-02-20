package outbox

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/service/automation"
)

type Processor struct {
	q      db.Querier
	engine *automation.Engine
}

func NewProcessor(q db.Querier, engine *automation.Engine) *Processor {
	return &Processor{q: q, engine: engine}
}

func (p *Processor) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.process(ctx)
		}
	}
}

func (p *Processor) process(ctx context.Context) {
	events, err := p.q.GetPendingOutboxEvents(ctx, 50)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch pending outbox events")
		return
	}

	for _, event := range events {
		err := p.handleEvent(ctx, event)

		status := "completed"
		errorMsg := ""
		if err != nil {
			status = "failed"
			errorMsg = err.Error()
			log.Error().Err(err).Interface("event_id", event.ID).Msg("failed to handle outbox event")
		}

		_ = p.q.UpdateOutboxEventStatus(ctx, db.UpdateOutboxEventStatusParams{
			ID:           event.ID,
			Status:       status,
			ErrorMessage: pgtype.Text{String: errorMsg, Valid: errorMsg != ""},
		})
	}
}

func (p *Processor) handleEvent(ctx context.Context, event db.Outbox) error {
	// Trigger Automation Engine
	if p.engine != nil {
		if err := p.engine.HandleEvent(ctx, event.TenantID.String(), event.EventType, event.Payload); err != nil {
			log.Error().Err(err).Str("event_type", event.EventType).Msg("automation engine execution failed")
		}
	}

	switch event.EventType {
	case "safety.discipline.incident_alert":
		return p.handleDisciplineAlert(ctx, event)
	case "academics.homework.reminder":
		return p.handleHomeworkReminder(ctx, event)
	case "notice.published":
		return p.handleNoticePublished(ctx, event)
	case "automation.notification.dispatch":
		return p.handleAutomationNotification(ctx, event)
	default:
		log.Warn().Str("event_type", event.EventType).Msg("unhandled outbox event type")
		return nil
	}
}

func (p *Processor) handleDisciplineAlert(ctx context.Context, event db.Outbox) error {
	// Logic to send high-severity alerts (SMS/Email)
	log.Info().Interface("payload", string(event.Payload)).Msg("Sending discipline alert...")
	return nil
}

func (p *Processor) handleHomeworkReminder(ctx context.Context, event db.Outbox) error {
	// Logic to send homework reminders to students/parents
	log.Info().Interface("payload", string(event.Payload)).Msg("Sending homework reminder...")
	return nil
}

func (p *Processor) handleNoticePublished(ctx context.Context, event db.Outbox) error {
	// Logic to send notice notifications
	log.Info().Interface("payload", string(event.Payload)).Msg("Sending notice notification...")
	return nil
}

func (p *Processor) handleAutomationNotification(ctx context.Context, event db.Outbox) error {
	// Placeholder dispatch path while channel providers are finalized.
	// Keeping this explicit avoids silently dropping automation notification events.
	log.Info().Interface("payload", string(event.Payload)).Msg("Processing automation notification dispatch event")
	return nil
}
