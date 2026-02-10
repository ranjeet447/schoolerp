package worker

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/worker/internal/db"
	"github.com/schoolerp/worker/internal/notification"
)

type Consumer struct {
	q       db.Querier
	notif   notification.Adapter
	limit   int32
}

func NewConsumer(q db.Querier, notif notification.Adapter) *Consumer {
	return &Consumer{
		q:     q,
		notif: notif,
		limit: 10,
	}
}

func (c *Consumer) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			c.processEvents(ctx)
		}
	}
}

func (c *Consumer) processEvents(ctx context.Context) {
	events, err := c.q.GetPendingOutboxEvents(ctx, c.limit)
	if err != nil {
		log.Printf("[Worker] Error fetching events: %v", err)
		return
	}

	for _, event := range events {
		err := c.handleEvent(ctx, event)
		status := "completed"
		errMsg := ""
		if err != nil {
			log.Printf("[Worker] Error handling event %s: %v", event.ID, err)
			status = "failed"
			errMsg = err.Error()
		}

		err = c.q.UpdateOutboxEventStatus(ctx, db.UpdateOutboxEventStatusParams{
			ID:           event.ID,
			Status:       status,
			ErrorMessage: pgtype.Text{String: errMsg, Valid: errMsg != ""},
		})
		if err != nil {
			log.Printf("[Worker] Error updating event status %s: %v", event.ID, err)
		}
	}
}

func (c *Consumer) handleEvent(ctx context.Context, event db.Outbox) error {
	log.Printf("[Worker] Processing event: %s (%s)", event.ID, event.EventType)

	switch event.EventType {
	case "attendance.absent":
		var payload map[string]interface{}
		json.Unmarshal(event.Payload, &payload)
		// Stub: Resolve student name and parent contact
		return c.notif.SendSMS(ctx, "+91XXXXXXXXXX", "Your child is absent today.")

	case "fee.paid":
		return c.notif.SendWhatsApp(ctx, "+91XXXXXXXXXX", "Fee payment received. Thank you!")

	case "notice.published":
		var payload map[string]interface{}
		json.Unmarshal(event.Payload, &payload)
		title, _ := payload["title"].(string)
		return c.notif.SendPush(ctx, "all_users", "New Notice: "+title, "Check the portal for details.")

	default:
		log.Printf("[Worker] Unknown event type: %s", event.EventType)
	}

	return nil
}
