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
	q                    db.Querier
	notif                notification.Adapter
	limit                int32
	lastFeeReminderRunAt time.Time
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
			c.processFeeReminders(ctx)
			c.processPTMReminders(ctx)
		}
	}
}

func (c *Consumer) processFeeReminders(ctx context.Context) {
	now := time.Now()
	// Only run once a day (at roughly the same time or whenever the worker is up)
	if c.lastFeeReminderRunAt.Year() == now.Year() && c.lastFeeReminderRunAt.YearDay() == now.YearDay() {
		return
	}

	log.Printf("[Worker] Starting daily fee reminder scan")
	configs, err := c.q.GetActiveReminderConfigs(ctx)
	if err != nil {
		log.Printf("[Worker] error fetching active reminder configs: %v", err)
		return
	}

	// For simplicity, we assume one academic year for now or fetch active ones
	// In a real app, you'd iterate per tenant's active academic year

	for _, cfg := range configs {
		// Fetch target students for this specific config
		// We'll use the target date as today
		targetDate := pgtype.Date{Time: now, Valid: true}
		
		// Note: The query GetStudentsForFeeReminder needs academic_year_id.
		// We'll need a way to resolve the active AY for the tenant.
		ay, err := c.getActiveAcademicYear(ctx, cfg.TenantID)
		if err != nil {
			log.Printf("[Worker] error resolving AY for tenant %s: %v", cfg.TenantID, err)
			continue
		}

		targets, err := c.q.GetStudentsForFeeReminder(ctx, db.GetStudentsForFeeReminderParams{
			TenantID:         cfg.TenantID,
			AcademicYearID:   ay.ID,
			TargetDueDate:    targetDate,
			ReminderConfigID: cfg.ID,
		})
		if err != nil {
			log.Printf("[Worker] error fetching targets for config %s: %v", cfg.ID, err)
			continue
		}

		for _, target := range targets {
			expected, _ := target.ExpectedAmount.Float64Value()
			pendingAmount := expected.Float64 - float64(target.PaidAmount)
			studentName := target.StudentName
			dueDate := target.DueDate.Time.Format("02 Jan 2006")
			feeHeadName := target.FeeHeadName

			msg, err := c.resolveFeeReminderMessage(ctx, cfg.TenantID, target.StudentID, studentName, pendingAmount, feeHeadName, dueDate)
			if err != nil {
				log.Printf("[Worker] error resolving fee reminder message: %v", err)
				msg = fmt.Sprintf("Dear Parent, a payment of %.2f is pending for %s (Student: %s). Due date: %s. Please pay earliest.", 
					pendingAmount, feeHeadName, studentName, dueDate)
			}
			
			payload, _ := json.Marshal(map[string]interface{}{
				"student_id": target.StudentID,
				"title":      "Fee Reminder",
				"message":    msg,
			})

			_, err = c.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
				TenantID:     cfg.TenantID,
				EventType:    "fee.reminder",
				Payload:      payload,
				ProcessAfter: pgtype.Timestamptz{Time: now, Valid: true},
			})
			if err != nil {
				log.Printf("[Worker] error creating outbox event for reminder: %v", err)
				continue
			}

			// Log the reminder to avoid duplicates
			_, err = c.q.LogFeeReminder(ctx, db.LogFeeReminderParams{
				TenantID:         cfg.TenantID,
				StudentID:        target.StudentID,
				FeeHeadID:        target.FeeHeadID,
				ReminderConfigID: cfg.ID,
			})
			if err != nil {
				log.Printf("[Worker] error logging fee reminder: %v", err)
			}
		}
	}

	c.lastFeeReminderRunAt = now
	log.Printf("[Worker] Daily fee reminder scan completed")
}

func (c *Consumer) getActiveAcademicYear(ctx context.Context, tenantID pgtype.UUID) (db.AcademicYear, error) {
	// Simple helper to find active AY
	ays, err := c.q.ListAcademicYears(ctx, tenantID)
	if err != nil {
		return db.AcademicYear{}, err
	}
	for _, ay := range ays {
		if ay.IsActive.Bool {
			return ay, nil
		}
	}
	return db.AcademicYear{}, fmt.Errorf("no active academic year found")
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

		message, err := c.resolveAbsentMessage(ctx, event.TenantID, studentID, studentName, phone)
		if err != nil {
			return err
		}
		if message == "" {
			return nil
		}

		// Use tenant-specific adapter
		notif := c.notif
		if ta, ok := c.notif.(notification.TenantAwareAdapter); ok {
			notif = ta.WithTenant(event.TenantID.String())
		}
		return notif.SendSMS(ctx, phone, message)

	case "fee.paid":
		var payload map[string]interface{}
		_ = json.Unmarshal(event.Payload, &payload)
		contact := strings.TrimSpace(readNestedString(payload, "payload", "payment", "entity", "contact"))
		if contact == "" {
			log.Printf("[Worker] fee.paid event missing contact, skipping delivery for event %s", event.ID)
			return nil
		}

		notif := c.notif
		if ta, ok := c.notif.(notification.TenantAwareAdapter); ok {
			notif = ta.WithTenant(event.TenantID.String())
		}
		return notif.SendWhatsApp(ctx, contact, "Fee payment received. Thank you!")

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
func (c *Consumer) processPTMReminders(ctx context.Context) {
	now := time.Now()
	
	// Look for slots starting in 24 hours (+/- 1 hour window)
	startWindow := now.Add(23 * time.Hour)
	endWindow := now.Add(25 * time.Hour)
	
	slots, err := c.q.GetPTMSlotsForReminders(ctx, db.GetPTMSlotsForRemindersParams{
		StartWindow:  pgtype.Timestamptz{Time: startWindow, Valid: true},
		EndWindow:    pgtype.Timestamptz{Time: endWindow, Valid: true},
		ReminderType: "24h",
	})
	if err != nil {
		log.Printf("[Worker] error fetching ptm slots for reminders: %v", err)
		return
	}
	
	for _, slot := range slots {
		// Check if PTM reminders are enabled for this tenant
		tenant, err := c.q.GetTenantByID(ctx, slot.TenantID)
		if err != nil {
			log.Printf("[Worker] error fetching tenant %s: %v", slot.TenantID, err)
			continue
		}
		
		var config map[string]interface{}
		json.Unmarshal(tenant.Config, &config)
		if enabled, ok := config["ptm_reminders_enabled"].(bool); !ok || !enabled {
			continue
		}

		msg := fmt.Sprintf("Reminder: Dear Parent, you have a Parent-Teacher Meeting tomorrow (%s) at %s for %s. We look forward to seeing you.", 
			slot.EventDate.Time.Format("02 Jan"), 
			formatPGTime(slot.StartTime),
			slot.StudentName)
			
		err = c.notif.SendSMS(ctx, slot.GuardianPhone, msg)
		if err != nil {
			log.Printf("[Worker] error sending PTM reminder to %s: %v", slot.GuardianPhone, err)
			continue
		}
		
		// Log to avoid duplicate
		_, err = c.q.LogPTMReminder(ctx, db.LogPTMReminderParams{
			TenantID:     slot.TenantID,
			SlotID:       slot.SlotID,
			StudentID:    slot.StudentID,
			ReminderType: "24h",
		})
		if err != nil {
			log.Printf("[Worker] error logging PTM reminder: %v", err)
		}
	}
}

func formatPGTime(t pgtype.Time) string {
	if !t.Valid {
		return ""
	}
	usec := t.Microseconds
	h := usec / 3600000000
	m := (usec / 60000000) % 60
	return fmt.Sprintf("%02d:%02d", h, m)
}

func (c *Consumer) resolveAbsentMessage(ctx context.Context, tenantID pgtype.UUID, studentID, studentName, phone string) (string, error) {
	// 1. Resolve guardian's locale
	locale := "en"
	studentUUID := pgtype.UUID{}
	studentUUID.Scan(studentID)

	guardians, err := c.q.GetStudentGuardians(ctx, studentUUID)
	if err == nil {
		for _, g := range guardians {
			if strings.TrimSpace(g.Phone) == phone && g.PreferredLanguage.Valid {
				locale = g.PreferredLanguage.String
				break
			}
		}
	}

	// 2. Resolve template
	tmpl, err := c.q.ResolveNotificationTemplate(ctx, db.ResolveNotificationTemplateParams{
		TenantID: tenantID,
		Code:     "attendance.absent",
		Channel:  "sms",
		Locale:   locale,
	})

	if err != nil {
		// Fallback to basic English if template not found
		if strings.TrimSpace(studentName) != "" {
			return fmt.Sprintf("%s is marked absent today.", studentName), nil
		}
		return "Your child is marked absent today.", nil
	}

	// 3. Simple variable replacement
	body := tmpl.Body
	body = strings.ReplaceAll(body, "{{student_name}}", studentName)
	return body, nil
}

func (c *Consumer) resolveFeeReminderMessage(ctx context.Context, tenantID pgtype.UUID, studentID pgtype.UUID, studentName string, amount float64, feeHead string, dueDate string) (string, error) {
	// 1. Resolve guardian's locale
	locale := "en"
	guardians, err := c.q.GetStudentGuardians(ctx, studentID)
	if err == nil {
		for _, g := range guardians {
			if g.IsPrimary.Valid && g.IsPrimary.Bool && g.PreferredLanguage.Valid {
				locale = g.PreferredLanguage.String
				break
			}
		}
	}

	// 2. Resolve template
	tmpl, err := c.q.ResolveNotificationTemplate(ctx, db.ResolveNotificationTemplateParams{
		TenantID: tenantID,
		Code:     "fee.reminder",
		Channel:  "sms",
		Locale:   locale,
	})

	if err != nil {
		return fmt.Sprintf("Dear Parent, a payment of %.2f is pending for %s (Student: %s). Due date: %s. Please pay earliest.", 
			amount, feeHead, studentName, dueDate), nil
	}

	// 3. Variable replacement
	body := tmpl.Body
	body = strings.ReplaceAll(body, "{{student_name}}", studentName)
	body = strings.ReplaceAll(body, "{{amount}}", fmt.Sprintf("%.2f", amount))
	body = strings.ReplaceAll(body, "{{fee_head}}", feeHead)
	body = strings.ReplaceAll(body, "{{due_date}}", dueDate)
	return body, nil
}
