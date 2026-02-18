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
		return c.sendTenantPush(ctx, event.TenantID, title, message)

	case "attendance.absent":
		var payload map[string]interface{}
		_ = json.Unmarshal(event.Payload, &payload)

		studentID := strings.TrimSpace(readString(payload, "student_id"))
		if studentID == "" {
			return nil
		}

		phone, studentName, err := c.resolveGuardianPhone(ctx, event.TenantID, studentID)
		if err != nil {
			return err
		}
		if strings.TrimSpace(phone) == "" {
			log.Printf("[Worker] no guardian phone found for absent event student %s", studentID)
			return nil
		}

		message := "Your child is marked absent today."
		if strings.TrimSpace(studentName) != "" {
			message = fmt.Sprintf("%s is marked absent today.", studentName)
		}
		return c.notif.SendSMS(ctx, phone, message)

	case "fee.paid":
		var payload map[string]interface{}
		_ = json.Unmarshal(event.Payload, &payload)
		contact := strings.TrimSpace(readNestedString(payload, "payload", "payment", "entity", "contact"))
		if contact == "" {
			log.Printf("[Worker] fee.paid event missing contact, skipping delivery for event %s", event.ID)
			return nil
		}
		return c.notif.SendWhatsApp(ctx, contact, "Fee payment received. Thank you!")

	case "notice.published":
		var payload map[string]interface{}
		json.Unmarshal(event.Payload, &payload)
		title, _ := payload["title"].(string)
		return c.sendTenantPush(ctx, event.TenantID, "New Notice: "+strings.TrimSpace(title), "Check the portal for details.")

	case "payslip.generated":
		var payload map[string]interface{}
		_ = json.Unmarshal(event.Payload, &payload)
		if payload == nil {
			payload = map[string]interface{}{}
		}
		payloadBytes, _ := json.Marshal(payload)
		_, err := c.q.CreatePDFJob(ctx, db.CreatePDFJobParams{
			TenantID:     event.TenantID,
			TemplateCode: "payslip",
			Payload:      payloadBytes,
		})
		if err != nil {
			return err
		}
		log.Printf("[Worker] Enqueued payslip PDF job for event: %s", event.ID)
		return nil

	default:
		log.Printf("[Worker] Unknown event type: %s", event.EventType)
	}

	return nil
}

func readString(payload map[string]interface{}, key string) string {
	if payload == nil {
		return ""
	}
	v, _ := payload[key].(string)
	return v
}

func readNestedString(payload map[string]interface{}, keys ...string) string {
	current := any(payload)
	for _, key := range keys {
		object, ok := current.(map[string]interface{})
		if !ok {
			return ""
		}
		current = object[key]
	}
	v, _ := current.(string)
	return v
}

func (c *Consumer) resolveGuardianPhone(ctx context.Context, tenantID pgtype.UUID, studentID string) (string, string, error) {
	studentUUID := pgtype.UUID{}
	if err := studentUUID.Scan(studentID); err != nil {
		return "", "", nil
	}

	studentName := ""
	if student, err := c.q.GetStudent(ctx, db.GetStudentParams{ID: studentUUID, TenantID: tenantID}); err == nil {
		studentName = student.FullName
	}

	guardians, err := c.q.GetStudentGuardians(ctx, studentUUID)
	if err != nil {
		return "", studentName, err
	}

	primaryPhone := ""
	fallbackPhone := ""
	for _, guardian := range guardians {
		phone := strings.TrimSpace(guardian.Phone)
		if phone == "" {
			continue
		}
		if fallbackPhone == "" {
			fallbackPhone = phone
		}
		if guardian.IsPrimary.Valid && guardian.IsPrimary.Bool {
			primaryPhone = phone
			break
		}
	}

	if primaryPhone != "" {
		return primaryPhone, studentName, nil
	}
	return fallbackPhone, studentName, nil
}

func (c *Consumer) sendTenantPush(ctx context.Context, tenantID pgtype.UUID, title, message string) error {
	if strings.TrimSpace(message) == "" {
		return nil
	}

	recipients, err := c.tenantPushRecipients(ctx, tenantID)
	if err != nil {
		return err
	}
	if len(recipients) == 0 {
		log.Printf("[Worker] no push recipients found for tenant %s", tenantID.String())
		return nil
	}

	failed := 0
	for _, recipient := range recipients {
		if sendErr := c.notif.SendPush(ctx, recipient, title, message); sendErr != nil {
			failed++
			log.Printf("[Worker] push send failed to recipient %s: %v", recipient, sendErr)
		}
	}

	if failed == len(recipients) {
		return fmt.Errorf("failed to deliver push to all recipients")
	}

	return nil
}

func (c *Consumer) tenantPushRecipients(ctx context.Context, tenantID pgtype.UUID) ([]string, error) {
	unique := map[string]bool{}

	students, err := c.q.ListStudents(ctx, db.ListStudentsParams{
		TenantID: tenantID,
		Limit:    10000,
		Offset:   0,
	})
	if err != nil {
		return nil, err
	}
	for _, student := range students {
		if !student.ID.Valid {
			continue
		}
		unique[student.ID.String()] = true
	}

	employees, err := c.q.ListEmployees(ctx, db.ListEmployeesParams{
		TenantID: tenantID,
		Limit:    10000,
		Offset:   0,
	})
	if err != nil {
		return nil, err
	}
	for _, employee := range employees {
		if !employee.UserID.Valid {
			continue
		}
		unique[employee.UserID.String()] = true
	}

	out := make([]string, 0, len(unique))
	for id := range unique {
		if strings.TrimSpace(id) != "" {
			out = append(out, id)
		}
	}
	return out, nil
}
