package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/worker/internal/db"
	"github.com/schoolerp/worker/internal/notification"
)

type Consumer struct {
	q     db.Querier
	notif notification.Adapter
	limit int32
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
			c.processHomeworkReminders(ctx)
		}
	}
}

func (c *Consumer) processHomeworkReminders(ctx context.Context) {
	// 1. Find homework due in ~4 hours
	hws, err := c.q.GetHomeworkDueSoon(ctx)
	if err != nil {
		log.Printf("[Worker] error fetching due soon homework: %v", err)
		return
	}

	for _, hw := range hws {
		// 2. Find students who haven't submitted
		students, err := c.q.GetStudentsMissingSubmissionForHomework(ctx, hw.ID)
		if err != nil {
			log.Printf("[Worker] error fetching missing submissions for homework %s: %v", hw.ID, err)
			continue
		}

		for _, st := range students {
			// 3. Send notification
			// In a real app, we'd resolve parent contact and use a template
			msg := fmt.Sprintf("Reminder: '%s' is due in less than 4 hours. Please submit your work.", hw.Title)
			err = c.notif.SendPush(ctx, st.StudentID.String(), "Homework Reminder", msg)
			if err != nil {
				log.Printf("[Worker] error sending reminder to student %s: %v", st.StudentID, err)
			}
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
	case "platform.broadcast":
		var payload map[string]interface{}
		_ = json.Unmarshal(event.Payload, &payload)
		title, _ := payload["title"].(string)
		message, _ := payload["message"].(string)
		title = strings.TrimSpace(title)
		message = strings.TrimSpace(message)
		if title == "" {
			title = "Broadcast"
		}
		if message == "" {
			return nil
		}
		// Placeholder: broadcast delivery should fan out to tenant users via the notification adapter.
		return c.notif.SendPush(ctx, "all_users", title, message)

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

	case "payslip.generated":
		var payload map[string]interface{}
		json.Unmarshal(event.Payload, &payload)
		log.Printf("[Worker] Generating PDF for payslip: %v", payload["payslip_id"])
		// Stub: Generate PDF logic
		return nil

	default:
		log.Printf("[Worker] Unknown event type: %s", event.EventType)
	}

	return nil
}
