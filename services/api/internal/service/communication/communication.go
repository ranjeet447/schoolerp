package communication

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type Service struct {
	q     db.Querier
	audit *audit.Logger
}

func NewService(q db.Querier, audit *audit.Logger) *Service {
	return &Service{
		q:     q,
		audit: audit,
	}
}

// PTM Management

type CreatePTMEventParams struct {
	TenantID            string
	Title               string
	Description         string
	EventDate           time.Time
	StartTime           time.Time
	EndTime             time.Time
	SlotDurationMinutes int32
	TeacherID           string
}

func (s *Service) CreatePTMEvent(ctx context.Context, p CreatePTMEventParams) (db.PtmEvent, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	uID := pgtype.UUID{}
	uID.Scan(p.TeacherID)

	event, err := s.q.CreatePTMEvent(ctx, db.CreatePTMEventParams{
		TenantID:            tID,
		Title:               p.Title,
		Description:         pgtype.Text{String: p.Description, Valid: p.Description != ""},
		EventDate:           pgtype.Date{Time: p.EventDate, Valid: true},
		StartTime:           pgtype.Time{Microseconds: int64(p.StartTime.Hour()*3600+p.StartTime.Minute()*60) * 1e6, Valid: true},
		EndTime:             pgtype.Time{Microseconds: int64(p.EndTime.Hour()*3600+p.EndTime.Minute()*60) * 1e6, Valid: true},
		SlotDurationMinutes: p.SlotDurationMinutes,
		TeacherID:           uID,
	})
	if err != nil {
		return db.PtmEvent{}, err
	}

	// Generate Slots
	duration := time.Duration(p.SlotDurationMinutes) * time.Minute
	current := p.StartTime
	for current.Before(p.EndTime) && current.Add(duration).Before(p.EndTime.Add(time.Second)) {
		next := current.Add(duration)

		_, _ = s.q.CreatePTMSlot(ctx, db.CreatePTMSlotParams{
			EventID:   event.ID,
			StartTime: pgtype.Time{Microseconds: int64(current.Hour()*3600+current.Minute()*60) * 1e6, Valid: true},
			EndTime:   pgtype.Time{Microseconds: int64(next.Hour()*3600+next.Minute()*60) * 1e6, Valid: true},
			Status:    "available",
		})
		current = next
	}

	return event, nil
}

func (s *Service) ListPTMEvents(ctx context.Context, tenantID string) ([]db.ListPTMEventsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListPTMEvents(ctx, tID)
}

func (s *Service) GetPTMSlots(ctx context.Context, eventID string) ([]db.GetPTMSlotsRow, error) {
	eID := pgtype.UUID{}
	eID.Scan(eventID)
	return s.q.GetPTMSlots(ctx, eID)
}

func (s *Service) BookSlot(ctx context.Context, eventID, slotID, studentID, remarks string) (db.PtmSlot, error) {
	eID := pgtype.UUID{}
	eID.Scan(eventID)
	sID := pgtype.UUID{}
	sID.Scan(slotID)
	stID := pgtype.UUID{}
	stID.Scan(studentID)

	return s.q.BookPTMSlot(ctx, db.BookPTMSlotParams{
		ID:             sID,
		EventID:        eID,
		StudentID:      pgtype.UUID{Bytes: stID.Bytes, Valid: true},
		BookingRemarks: pgtype.Text{String: remarks, Valid: remarks != ""},
	})
}

type PTMSettings struct {
	AutomatedRemindersEnabled bool `json:"automated_reminders_enabled"`
}

func (s *Service) GetPTMSettings(ctx context.Context, tenantID string) (PTMSettings, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	tenant, err := s.q.GetTenantByID(ctx, tID)
	if err != nil {
		return PTMSettings{}, err
	}

	var config map[string]interface{}
	json.Unmarshal(tenant.Config, &config)

	enabled, _ := config["ptm_reminders_enabled"].(bool)
	return PTMSettings{AutomatedRemindersEnabled: enabled}, nil
}

func (s *Service) UpdatePTMSettings(ctx context.Context, tenantID string, enabled bool) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	tenant, err := s.q.GetTenantByID(ctx, tID)
	if err != nil {
		return err
	}

	var config map[string]interface{}
	json.Unmarshal(tenant.Config, &config)
	if config == nil {
		config = make(map[string]interface{})
	}
	config["ptm_reminders_enabled"] = enabled

	configBytes, _ := json.Marshal(config)
	_, err = s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{
		ID:     tID,
		Config: configBytes,
	})
	return err
}

// Moderated Chat

type SendMessageParams struct {
	RoomID   string
	SenderID string
	Message  string
}

func (s *Service) SendMessage(ctx context.Context, tenantID string, p SendMessageParams) (db.ChatMessage, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	rID := pgtype.UUID{}
	rID.Scan(p.RoomID)
	uID := pgtype.UUID{}
	uID.Scan(p.SenderID)

	// 1. Check Moderation Settings
	settings, _ := s.q.GetChatModerationSettings(ctx, tID)
	isModerated := false
	reason := ""

	if settings.IsEnabled.Bool {
		// Quiet Hours Check
		nowTime := time.Now()
		currentMinutes := nowTime.Hour()*60 + nowTime.Minute()

		if settings.QuietHoursStart.Valid && settings.QuietHoursEnd.Valid {
			startMin := int(settings.QuietHoursStart.Microseconds / 1e6 / 60)
			endMin := int(settings.QuietHoursEnd.Microseconds / 1e6 / 60)

			inQuietHours := false
			if startMin < endMin {
				inQuietHours = currentMinutes >= startMin && currentMinutes < endMin
			} else {
				// Wraps around midnight
				inQuietHours = currentMinutes >= startMin || currentMinutes < endMin
			}

			if inQuietHours {
				isModerated = true
				reason = "Sent during quiet hours"
			}
		}

		// Keyword Filter
		if !isModerated {
			for _, kw := range settings.BlockedKeywords {
				if strings.Contains(strings.ToLower(p.Message), strings.ToLower(kw)) {
					isModerated = true
					reason = "Contains blocked keywords"
					break
				}
			}
		}
	}

	return s.q.CreateChatMessage(ctx, db.CreateChatMessageParams{
		RoomID:           rID,
		SenderID:         uID,
		Message:          p.Message,
		IsModerated:      pgtype.Bool{Bool: isModerated, Valid: true},
		ModerationReason: pgtype.Text{String: reason, Valid: reason != ""},
	})
}

func (s *Service) GetChatHistory(ctx context.Context, roomID string, limit, offset int32) ([]db.GetChatHistoryRow, error) {
	rID := pgtype.UUID{}
	rID.Scan(roomID)
	return s.q.GetChatHistory(ctx, db.GetChatHistoryParams{
		RoomID: rID,
		Limit:  limit,
		Offset: offset,
	})
}

func (s *Service) GetChatModerationSettings(ctx context.Context, tenantID string) (db.ChatModerationSetting, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	settings, err := s.q.GetChatModerationSettings(ctx, tID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.ChatModerationSetting{
				TenantID:        tID,
				QuietHoursStart: pgtype.Time{Microseconds: 22 * 60 * 60 * 1e6, Valid: true},
				QuietHoursEnd:   pgtype.Time{Microseconds: 7 * 60 * 60 * 1e6, Valid: true},
				BlockedKeywords: []string{},
				IsEnabled:       pgtype.Bool{Bool: false, Valid: true},
			}, nil
		}
		return db.ChatModerationSetting{}, err
	}

	return settings, nil
}

func parseClockToPgTime(clock string) (pgtype.Time, error) {
	parsed, err := time.Parse("15:04", clock)
	if err != nil {
		return pgtype.Time{}, err
	}
	microseconds := int64(parsed.Hour()*3600+parsed.Minute()*60) * 1e6
	return pgtype.Time{Microseconds: microseconds, Valid: true}, nil
}

func (s *Service) UpsertChatModerationSettings(ctx context.Context, tenantID, quietStart, quietEnd string, blocked []string, enabled bool) (db.ChatModerationSetting, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	start, err := parseClockToPgTime(quietStart)
	if err != nil {
		return db.ChatModerationSetting{}, err
	}
	end, err := parseClockToPgTime(quietEnd)
	if err != nil {
		return db.ChatModerationSetting{}, err
	}

	return s.q.UpsertChatModerationSettings(ctx, db.UpsertChatModerationSettingsParams{
		TenantID:        tID,
		QuietHoursStart: start,
		QuietHoursEnd:   end,
		BlockedKeywords: blocked,
		IsEnabled:       pgtype.Bool{Bool: enabled, Valid: true},
	})
}

func (s *Service) ListChatRooms(ctx context.Context, tenantID, userID string) ([]db.ListStudentChatRoomsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	return s.q.ListStudentChatRooms(ctx, db.ListStudentChatRoomsParams{
		UserID:   uID,
		TenantID: tID,
	})
}

func (s *Service) ListMessagingEvents(ctx context.Context, tenantID, eventTypeFilter, statusFilter string, limit, offset int32) ([]db.Outbox, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	events, err := s.q.ListOutboxEvents(ctx, db.ListOutboxEventsParams{
		TenantID: tID,
		Offset:   offset,
		Limit:    limit,
	})
	if err != nil {
		return nil, err
	}

	if eventTypeFilter == "" && statusFilter == "" {
		return events, nil
	}

	normalizedEventType := strings.ToLower(strings.TrimSpace(eventTypeFilter))
	normalizedStatus := strings.ToLower(strings.TrimSpace(statusFilter))
	filtered := make([]db.Outbox, 0, len(events))

	for _, event := range events {
		if normalizedEventType != "" && !strings.Contains(strings.ToLower(event.EventType), normalizedEventType) {
			continue
		}
		if normalizedStatus != "" {
			status := strings.ToLower(strings.TrimSpace(event.Status))
			if status != normalizedStatus {
				continue
			}
		}
		filtered = append(filtered, event)
	}

	return filtered, nil
}

func (s *Service) ProcessPTMReminders(ctx context.Context) error {
	slots, err := s.q.GetPTMSlotsStartingSoon(ctx)
	if err != nil {
		return err
	}

	for _, slot := range slots {
		payload, _ := json.Marshal(map[string]interface{}{
			"slot_id":      slot.ID,
			"event_title":  slot.EventTitle,
			"student_name": slot.StudentName,
			"student_id":   slot.StudentID,
			"start_time":   slot.StartTime,
		})

		_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
			TenantID:  slot.TenantID,
			EventType: "communication.ptm.reminder",
			Payload:   payload,
		})
	}

	return nil
}
