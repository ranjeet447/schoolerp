package academics

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type CalendarService struct {
	db    *pgxpool.Pool
	audit *audit.Logger
}

func NewCalendarService(db *pgxpool.Pool, audit *audit.Logger) *CalendarService {
	return &CalendarService{db: db, audit: audit}
}

type Event struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	EventType      string    `json:"event_type"`
	StartTime      time.Time `json:"start_time"`
	EndTime        time.Time `json:"end_time"`
	IsAllDay       bool      `json:"is_all_day"`
	Location       string    `json:"location"`
	TargetAudience []string  `json:"target_audience"`
	IsActive       bool      `json:"is_active"`
}

func (s *CalendarService) CreateEvent(ctx context.Context, tenantID string, e Event, userID, reqID, ip string) (Event, error) {
	var id string
	query := `
		INSERT INTO school_events (tenant_id, title, description, event_type, start_time, end_time, is_all_day, location, target_audience)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	err := s.db.QueryRow(ctx, query, tenantID, e.Title, e.Description, e.EventType, e.StartTime, e.EndTime, e.IsAllDay, e.Location, e.TargetAudience).Scan(&id)
	if err != nil {
		return Event{}, err
	}
	e.ID = id

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "calendar.event.create",
		ResourceType: "school_event",
		ResourceID:   toPgUUID(id),
		After:        e,
		IPAddress:    ip,
	})

	return e, nil
}

func (s *CalendarService) ListEvents(ctx context.Context, tenantID string, start, end time.Time) ([]Event, error) {
	query := `
		SELECT id, title, description, event_type, start_time, end_time, is_all_day, location, target_audience, is_active
		FROM school_events
		WHERE tenant_id = $1 AND start_time >= $2 AND end_time <= $3 AND is_active = true
		ORDER BY start_time ASC
	`
	rows, err := s.db.Query(ctx, query, tenantID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventType, &e.StartTime, &e.EndTime, &e.IsAllDay, &e.Location, &e.TargetAudience, &e.IsActive)
		if err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}

func (s *CalendarService) UpdateEvent(ctx context.Context, tenantID, id string, e Event, userID, reqID, ip string) (Event, error) {
	query := `
		UPDATE school_events
		SET title = $1, description = $2, event_type = $3, start_time = $4, end_time = $5, is_all_day = $6, location = $7, target_audience = $8, updated_at = NOW()
		WHERE id = $9 AND tenant_id = $10
	`
	_, err := s.db.Exec(ctx, query, e.Title, e.Description, e.EventType, e.StartTime, e.EndTime, e.IsAllDay, e.Location, e.TargetAudience, id, tenantID)
	if err != nil {
		return Event{}, err
	}
	e.ID = id

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "calendar.event.update",
		ResourceType: "school_event",
		ResourceID:   toPgUUID(id),
		After:        e,
		IPAddress:    ip,
	})

	return e, nil
}

func (s *CalendarService) DeleteEvent(ctx context.Context, tenantID, id string, userID, reqID, ip string) error {
	query := `UPDATE school_events SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`
	_, err := s.db.Exec(ctx, query, id, tenantID)
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     toPgUUID(tenantID),
		UserID:       toPgUUID(userID),
		RequestID:    reqID,
		Action:       "calendar.event.delete",
		ResourceType: "school_event",
		ResourceID:   toPgUUID(id),
		IPAddress:    ip,
	})

	return nil
}
