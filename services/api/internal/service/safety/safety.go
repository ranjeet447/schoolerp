package safety

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
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

// Discipline Management

type CreateIncidentParams struct {
	TenantID         string
	StudentID        string
	ReporterID       string
	IncidentDate     time.Time
	Category         string
	Title            string
	Description      string
	ActionTaken      string
	ParentVisibility bool
}

func (s *Service) CreateIncident(ctx context.Context, p CreateIncidentParams) (db.DisciplineIncident, error) {
	if strings.TrimSpace(p.StudentID) == "" {
		return db.DisciplineIncident{}, errors.New("student_id is required")
	}
	if strings.TrimSpace(p.Category) == "" {
		return db.DisciplineIncident{}, errors.New("category is required")
	}
	if strings.TrimSpace(p.Title) == "" {
		return db.DisciplineIncident{}, errors.New("title is required")
	}
	if p.IncidentDate.IsZero() {
		p.IncidentDate = time.Now()
	}

	tID := pgtype.UUID{}
	if err := tID.Scan(p.TenantID); err != nil {
		return db.DisciplineIncident{}, errors.New("invalid tenant_id")
	}
	sID := pgtype.UUID{}
	if err := sID.Scan(p.StudentID); err != nil {
		return db.DisciplineIncident{}, errors.New("invalid student_id")
	}
	rID := pgtype.UUID{}
	if err := rID.Scan(p.ReporterID); err != nil {
		return db.DisciplineIncident{}, errors.New("invalid reporter_id")
	}

	incident, err := s.q.CreateDisciplineIncident(ctx, db.CreateDisciplineIncidentParams{
		TenantID:         tID,
		StudentID:        sID,
		ReporterID:       rID,
		IncidentDate:     pgtype.Timestamptz{Time: p.IncidentDate, Valid: !p.IncidentDate.IsZero()},
		Category:         p.Category,
		Title:            p.Title,
		Description:      pgtype.Text{String: p.Description, Valid: p.Description != ""},
		ActionTaken:      pgtype.Text{String: p.ActionTaken, Valid: p.ActionTaken != ""},
		Status:           "reported",
		ParentVisibility: pgtype.Bool{Bool: p.ParentVisibility, Valid: true},
	})
	if err != nil {
		return db.DisciplineIncident{}, err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       rID,
		Action:       "discipline.create",
		ResourceType: "discipline_incident",
		ResourceID:   incident.ID,
		After:        incident,
	})

	return incident, nil
}

func (s *Service) ListIncidents(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListDisciplineIncidentsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListDisciplineIncidents(ctx, db.ListDisciplineIncidentsParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

// Visitor Management

type VisitorCheckInParams struct {
	TenantID        string
	FullName        string
	Phone           string
	Email           string
	IDType          string
	IDNumber        string
	Purpose         string
	ContactPersonID string
	BadgeNumber     string
	PhotoURL        string
}

func (s *Service) VisitorCheckIn(ctx context.Context, p VisitorCheckInParams) (db.VisitorLog, error) {
	if strings.TrimSpace(p.FullName) == "" {
		return db.VisitorLog{}, errors.New("full_name is required")
	}
	if strings.TrimSpace(p.Phone) == "" {
		return db.VisitorLog{}, errors.New("phone is required")
	}
	if strings.TrimSpace(p.Purpose) == "" {
		return db.VisitorLog{}, errors.New("purpose is required")
	}

	tID := pgtype.UUID{}
	if err := tID.Scan(p.TenantID); err != nil {
		return db.VisitorLog{}, errors.New("invalid tenant_id")
	}

	// 1. Get or Create Visitor
	visitor, err := s.q.GetVisitorByPhone(ctx, db.GetVisitorByPhoneParams{
		TenantID: tID,
		Phone:    p.Phone,
	})
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return db.VisitorLog{}, fmt.Errorf("failed to lookup visitor: %w", err)
		}

		// Encrypt ID Number
		encryptedID := p.IDNumber
		if p.IDNumber != "" {
			var encErr error
			encryptedID, encErr = encrypt([]byte(p.IDNumber))
			if encErr != nil {
				return db.VisitorLog{}, fmt.Errorf("encryption failed: %w", encErr)
			}
		}

		visitor, err = s.q.CreateVisitor(ctx, db.CreateVisitorParams{
			TenantID: tID,
			FullName: p.FullName,
			Phone:    p.Phone,
			Email:    pgtype.Text{String: p.Email, Valid: p.Email != ""},
			IDType:   pgtype.Text{String: p.IDType, Valid: p.IDType != ""},
			IDNumber: pgtype.Text{String: encryptedID, Valid: encryptedID != ""},
			PhotoUrl: pgtype.Text{String: p.PhotoURL, Valid: p.PhotoURL != ""},
		})
		if err != nil {
			return db.VisitorLog{}, fmt.Errorf("failed to create visitor: %w", err)
		}
	}

	// 2. Create Visitor Log
	cpID := pgtype.UUID{}
	if p.ContactPersonID != "" {
		if err := cpID.Scan(p.ContactPersonID); err != nil {
			return db.VisitorLog{}, errors.New("invalid contact_person_id")
		}
	}

	log, err := s.q.CreateVisitorLog(ctx, db.CreateVisitorLogParams{
		TenantID:        tID,
		VisitorID:       visitor.ID,
		Purpose:         p.Purpose,
		ContactPersonID: cpID,
		BadgeNumber:     pgtype.Text{String: p.BadgeNumber, Valid: p.BadgeNumber != ""},
	})
	if err != nil {
		return db.VisitorLog{}, err
	}

	return log, nil
}

func (s *Service) VisitorCheckOut(ctx context.Context, tenantID, logID, remarks string) (db.VisitorLog, error) {
	tID := pgtype.UUID{}
	if err := tID.Scan(tenantID); err != nil {
		return db.VisitorLog{}, errors.New("invalid tenant_id")
	}
	lID := pgtype.UUID{}
	if err := lID.Scan(logID); err != nil {
		return db.VisitorLog{}, errors.New("invalid log_id")
	}

	return s.q.CheckOutVisitor(ctx, db.CheckOutVisitorParams{
		ID:       lID,
		TenantID: tID,
		Remarks:  pgtype.Text{String: remarks, Valid: remarks != ""},
	})
}

func (s *Service) ListVisitorLogs(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListVisitorLogsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListVisitorLogs(ctx, db.ListVisitorLogsParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

// Pickup Authorizations

type CreatePickupAuthParams struct {
	TenantID     string
	StudentID    string
	Name         string
	Relationship string
	Phone        string
	PhotoURL     string
}

func (s *Service) CreatePickupAuth(ctx context.Context, p CreatePickupAuthParams) (db.PickupAuthorization, error) {
	if strings.TrimSpace(p.StudentID) == "" {
		return db.PickupAuthorization{}, errors.New("student_id is required")
	}
	if strings.TrimSpace(p.Name) == "" {
		return db.PickupAuthorization{}, errors.New("name is required")
	}
	if strings.TrimSpace(p.Relationship) == "" {
		return db.PickupAuthorization{}, errors.New("relationship is required")
	}
	if strings.TrimSpace(p.Phone) == "" {
		return db.PickupAuthorization{}, errors.New("phone is required")
	}

	tID := pgtype.UUID{}
	if err := tID.Scan(p.TenantID); err != nil {
		return db.PickupAuthorization{}, errors.New("invalid tenant_id")
	}
	sID := pgtype.UUID{}
	if err := sID.Scan(p.StudentID); err != nil {
		return db.PickupAuthorization{}, errors.New("invalid student_id")
	}

	return s.q.CreatePickupAuthorization(ctx, db.CreatePickupAuthorizationParams{
		TenantID:     tID,
		StudentID:    sID,
		Name:         p.Name,
		Relationship: p.Relationship,
		Phone:        p.Phone,
		PhotoUrl:     pgtype.Text{String: p.PhotoURL, Valid: p.PhotoURL != ""},
	})
}

func (s *Service) ListPickupAuths(ctx context.Context, tenantID, studentID string) ([]db.PickupAuthorization, error) {
	tID := pgtype.UUID{}
	if err := tID.Scan(tenantID); err != nil {
		return nil, errors.New("invalid tenant_id")
	}
	sID := pgtype.UUID{}
	if err := sID.Scan(studentID); err != nil {
		return nil, errors.New("invalid student_id")
	}

	return s.q.ListPickupAuthorizations(ctx, db.ListPickupAuthorizationsParams{
		TenantID:  tID,
		StudentID: sID,
	})
}

// Emergency Broadcasts

type SendBroadcastParams struct {
	TenantID    string
	CreatorID   string
	Message     string
	Channel     string
	TargetRoles []string
}

func (s *Service) SendBroadcast(ctx context.Context, p SendBroadcastParams) (db.EmergencyBroadcast, error) {
	if strings.TrimSpace(p.Message) == "" {
		return db.EmergencyBroadcast{}, errors.New("message is required")
	}
	switch p.Channel {
	case "sms", "email", "push", "whatsapp", "in_app":
	default:
		return db.EmergencyBroadcast{}, errors.New("channel must be one of: sms, email, push, whatsapp, in_app")
	}
	if len(p.TargetRoles) == 0 {
		return db.EmergencyBroadcast{}, errors.New("target_roles is required")
	}

	tID := pgtype.UUID{}
	if err := tID.Scan(p.TenantID); err != nil {
		return db.EmergencyBroadcast{}, errors.New("invalid tenant_id")
	}
	cID := pgtype.UUID{}
	if err := cID.Scan(p.CreatorID); err != nil {
		return db.EmergencyBroadcast{}, errors.New("invalid creator_id")
	}

	broadcast, err := s.q.CreateEmergencyBroadcast(ctx, db.CreateEmergencyBroadcastParams{
		TenantID:    tID,
		CreatedBy:   cID,
		Message:     p.Message,
		Channel:     p.Channel,
		TargetRoles: p.TargetRoles,
		Status:      "pending",
	})
	if err != nil {
		return db.EmergencyBroadcast{}, err
	}

	// Produce Outbox Events for delivery
	payload, _ := json.Marshal(map[string]interface{}{
		"broadcast_id": broadcast.ID,
		"message":      broadcast.Message,
		"channel":      broadcast.Channel,
		"target_roles": broadcast.TargetRoles,
		"created_by":   broadcast.CreatedBy,
	})
	_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
		TenantID:  tID,
		EventType: "safety.broadcast.created",
		Payload:   payload,
	})

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       cID,
		Action:       "safety.broadcast_sent",
		ResourceType: "emergency_broadcast",
		ResourceID:   broadcast.ID,
		After:        broadcast,
	})

	return broadcast, nil
}

func (s *Service) ListBroadcasts(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListEmergencyBroadcastsRow, error) {
	tID := pgtype.UUID{}
	if err := tID.Scan(tenantID); err != nil {
		return nil, errors.New("invalid tenant_id")
	}
	return s.q.ListEmergencyBroadcasts(ctx, db.ListEmergencyBroadcastsParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}
