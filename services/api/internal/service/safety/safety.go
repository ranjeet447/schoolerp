package safety

import (
	"context"
	"fmt"
	"time"

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
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	sID := pgtype.UUID{}
	sID.Scan(p.StudentID)
	rID := pgtype.UUID{}
	rID.Scan(p.ReporterID)

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
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)

	// 1. Get or Create Visitor
	visitor, err := s.q.GetVisitorByPhone(ctx, db.GetVisitorByPhoneParams{
		TenantID: tID,
		Phone:    p.Phone,
	})
	if err != nil {
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
		cpID.Scan(p.ContactPersonID)
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
	tID.Scan(tenantID)
	lID := pgtype.UUID{}
	lID.Scan(logID)

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
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	sID := pgtype.UUID{}
	sID.Scan(p.StudentID)

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
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)

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
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	cID := pgtype.UUID{}
	cID.Scan(p.CreatorID)

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
	// s.q.CreateOutboxEvent(...) // TODO: Integrate with outbox

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
