package safety

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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
	Severity         string
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
		Severity:         pgtype.Text{String: p.Severity, Valid: p.Severity != ""},
		ParentVisibility: pgtype.Bool{Bool: p.ParentVisibility, Valid: true},
	})
	if err != nil {
		return db.DisciplineIncident{}, err
	}

	// Trigger alert for high severity
	if p.Severity == "high" || p.Severity == "critical" {
		payload, _ := json.Marshal(map[string]interface{}{
			"incident_id": incident.ID,
			"student_id":  incident.StudentID,
			"severity":    incident.Severity.String,
			"title":       incident.Title,
			"category":    incident.Category,
		})
		_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
			TenantID:  tID,
			EventType: "safety.discipline.incident_alert",
			Payload:   payload,
		})
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

func (s *Service) UpdateDisciplineIncident(ctx context.Context, id, tenantID, action, status, severity string, parentVis bool) (db.DisciplineIncident, error) {
	uID := pgtype.UUID{}
	uID.Scan(id)
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.UpdateDisciplineIncident(ctx, db.UpdateDisciplineIncidentParams{
		ID:               uID,
		TenantID:         tID,
		ActionTaken:      pgtype.Text{String: action, Valid: action != ""},
		Status:           status,
		Severity:         pgtype.Text{String: severity, Valid: severity != ""},
		ParentVisibility: pgtype.Bool{Bool: parentVis, Valid: true},
	})
}

// Visitor Management

type VisitorCheckInParams struct {
	TenantID        string `json:"tenant_id"`
	FullName        string `json:"full_name"`
	Phone           string `json:"phone"`
	Email           string `json:"email"`
	IDType          string `json:"id_type"`
	IDNumber        string `json:"id_number"`
	Purpose         string `json:"purpose"`
	ContactPersonID string `json:"contact_person_id"`
	BadgeNumber     string `json:"badge_number"`
	PhotoURL        string `json:"photo_url"`
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

	// Encrypt ID Number if provided
	encryptedID := p.IDNumber
	if p.IDNumber != "" {
		var encErr error
		encryptedID, encErr = encrypt([]byte(p.IDNumber))
		if encErr != nil {
			return db.VisitorLog{}, fmt.Errorf("encryption failed: %w", encErr)
		}
	}

	// 1. Get or Create/Update Visitor
	visitor, err := s.q.GetVisitorByPhone(ctx, db.GetVisitorByPhoneParams{
		TenantID: tID,
		Phone:    p.Phone,
	})
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return db.VisitorLog{}, fmt.Errorf("failed to lookup visitor: %w", err)
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
	} else {
		// Update existing visitor profile with latest info if provided
		_, err = s.q.UpdateVisitor(ctx, db.UpdateVisitorParams{
			ID:       visitor.ID,
			TenantID: tID,
			FullName: p.FullName,
			Email:    pgtype.Text{String: p.Email, Valid: p.Email != ""},
			IDType:   pgtype.Text{String: p.IDType, Valid: p.IDType != ""},
			IDNumber: pgtype.Text{String: encryptedID, Valid: encryptedID != ""},
			PhotoUrl: pgtype.Text{String: p.PhotoURL, Valid: p.PhotoURL != ""},
		})
		if err != nil {
			return db.VisitorLog{}, fmt.Errorf("failed to update visitor profile: %w", err)
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
		EntryPhotoUrl:   pgtype.Text{String: p.PhotoURL, Valid: p.PhotoURL != ""},
	})
	if err != nil {
		return db.VisitorLog{}, err
	}

	return log, nil
}

func (s *Service) GeneratePickupCode(ctx context.Context, tenantID, studentID, authID, codeType string) (db.PickupVerificationCode, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)
	
	var aID pgtype.UUID
	if authID != "" {
		aID.Scan(authID)
	}

	var codeValue string
	if codeType == "otp" {
		codeValue = generateOTP(6)
	} else {
		// For QR, generate a secure random token
		token := make([]byte, 16)
		_, _ = io.ReadFull(rand.Reader, token)
		codeValue = base64.URLEncoding.EncodeToString(token)
	}

	return s.q.CreatePickupVerificationCode(ctx, db.CreatePickupVerificationCodeParams{
		TenantID:  tID,
		StudentID: sID,
		AuthID:    aID,
		CodeType:  codeType,
		CodeValue: codeValue,
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(30 * time.Minute), Valid: true},
	})
}

func (s *Service) VerifyPickupCode(ctx context.Context, tenantID, codeValue, notes string) (db.PickupEvent, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	code, err := s.q.GetActivePickupCode(ctx, db.GetActivePickupCodeParams{
		TenantID:  tID,
		CodeValue: codeValue,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.PickupEvent{}, errors.New("invalid or expired verification code")
		}
		return db.PickupEvent{}, err
	}

	// 1. Mark code as used
	if err := s.q.UsePickupCode(ctx, db.UsePickupCodeParams{
		ID:       code.ID,
		TenantID: tID,
	}); err != nil {
		return db.PickupEvent{}, err
	}

	// 2. Create pickup event
	var authPersonName, authPersonRelationship string
	if code.AuthID.Valid {
		auth, err := s.q.GetPickupAuthorization(ctx, db.GetPickupAuthorizationParams{
			ID:       code.AuthID,
			TenantID: tID,
		})
		if err == nil {
			authPersonName = auth.Name
			authPersonRelationship = auth.Relationship
		}
	}

	event, err := s.q.CreatePickupEvent(ctx, db.CreatePickupEventParams{
		TenantID:       tID,
		StudentID:      code.StudentID,
		AuthID:         code.AuthID,
		PickedUpByName: pgtype.Text{String: authPersonName, Valid: authPersonName != ""},
		Relationship:   pgtype.Text{String: authPersonRelationship, Valid: authPersonRelationship != ""},
		Notes:          pgtype.Text{String: notes, Valid: notes != ""},
	})
	if err != nil {
		return db.PickupEvent{}, err
	}

	// 3. Trigger outbox event for notification to other parents
	payload, _ := json.Marshal(map[string]interface{}{
		"event_id":     event.ID,
		"student_id":   event.StudentID,
		"picked_up_at": event.PickupAt.Time,
		"authorized":   code.AuthID.Valid,
	})
	_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
		TenantID:  tID,
		EventType: "safety.pickup.verified",
		Payload:   payload,
	})

	return event, nil
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

func (s *Service) CreateConfidentialNote(ctx context.Context, tenantID, studentID, authorID, content string) (db.StudentConfidentialNote, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)
	aID := pgtype.UUID{}
	aID.Scan(authorID)

	encrypted, err := encrypt([]byte(content))
	if err != nil {
		return db.StudentConfidentialNote{}, fmt.Errorf("failed to encrypt note: %w", err)
	}

	return s.q.CreateConfidentialNote(ctx, db.CreateConfidentialNoteParams{
		TenantID:         tID,
		StudentID:        sID,
		CreatedBy:        aID,
		EncryptedContent: encrypted,
	})
}

func (s *Service) ListConfidentialNotes(ctx context.Context, tenantID, studentID string) ([]db.StudentConfidentialNote, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)

	rows, err := s.q.ListConfidentialNotes(ctx, db.ListConfidentialNotesParams{
		StudentID: sID,
		TenantID:  tID,
	})
	if err != nil {
		return nil, err
	}

	for i := range rows {
		decrypted, err := decrypt(rows[i].EncryptedContent)
		if err == nil {
			rows[i].EncryptedContent = string(decrypted)
		} else {
			rows[i].EncryptedContent = "[DECRYPTION FAILED]"
		}
	}

	return rows, nil
}

func (s *Service) DeleteConfidentialNote(ctx context.Context, tenantID, id string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	nID := pgtype.UUID{}
	nID.Scan(id)
	return s.q.DeleteConfidentialNote(ctx, db.DeleteConfidentialNoteParams{
		ID:       nID,
		TenantID: tID,
	})
}

func (s *Service) CreateGatePass(ctx context.Context, tenantID, studentID, requestedBy, reason string) (db.GatePass, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)
	rID := pgtype.UUID{}
	rID.Scan(requestedBy)

	// In a real scenario, we might generate a QR payload here
	qrPayload := fmt.Sprintf("GP-%s-%d", studentID, time.Now().Unix())

	return s.q.CreateGatePass(ctx, db.CreateGatePassParams{
		TenantID:    tID,
		StudentID:   sID,
		Reason:      reason,
		RequestedBy: rID,
		QrCode:      pgtype.Text{String: qrPayload, Valid: true},
		ValidFrom:   pgtype.Timestamptz{Time: time.Now(), Valid: true},
		ValidUntil:  pgtype.Timestamptz{Time: time.Now().Add(4 * time.Hour), Valid: true},
	})
}

func (s *Service) ApproveGatePass(ctx context.Context, tenantID, id, approvedBy string) (db.GatePass, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	gID := pgtype.UUID{}
	gID.Scan(id)
	aID := pgtype.UUID{}
	aID.Scan(approvedBy)

	qrPayload := fmt.Sprintf("GP-APPROVED-%s", id)

	return s.q.ApproveGatePass(ctx, db.ApproveGatePassParams{
		ID:         gID,
		TenantID:   tID,
		ApprovedBy: aID,
		QrCode:     pgtype.Text{String: qrPayload, Valid: true},
	})
}

func (s *Service) UseGatePass(ctx context.Context, tenantID, id string) (db.GatePass, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	gID := pgtype.UUID{}
	gID.Scan(id)

	return s.q.UseGatePass(ctx, db.UseGatePassParams{
		ID:       gID,
		TenantID: tID,
	})
}

func (s *Service) ListGatePasses(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListGatePassesRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.ListGatePasses(ctx, db.ListGatePassesParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *Service) ListGatePassesForStudent(ctx context.Context, tenantID, studentID string) ([]db.ListGatePassesForStudentRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)

	return s.q.ListGatePassesForStudent(ctx, db.ListGatePassesForStudentParams{
		StudentID: sID,
		TenantID:  tID,
	})
}

// Pickup Events

type CreatePickupEventParams struct {
	TenantID        string
	StudentID       string
	AuthID          string
	PickedUpByName  string
	Relationship    string
	PhotoURL        string
	Notes           string
}

func (s *Service) CreatePickupEvent(ctx context.Context, p CreatePickupEventParams) (db.PickupEvent, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	sID := pgtype.UUID{}
	sID.Scan(p.StudentID)
	
	var aID pgtype.UUID
	if p.AuthID != "" {
		aID.Scan(p.AuthID)
	}

	event, err := s.q.CreatePickupEvent(ctx, db.CreatePickupEventParams{
		TenantID:        tID,
		StudentID:       sID,
		AuthID:          aID,
		PickedUpByName:  pgtype.Text{String: p.PickedUpByName, Valid: p.PickedUpByName != ""},
		Relationship:    pgtype.Text{String: p.Relationship, Valid: p.Relationship != ""},
		PhotoUrl:        pgtype.Text{String: p.PhotoURL, Valid: p.PhotoURL != ""},
		Notes:           pgtype.Text{String: p.Notes, Valid: p.Notes != ""},
	})
	if err != nil {
		return db.PickupEvent{}, err
	}

	return event, nil
}

func (s *Service) ListPickupEvents(ctx context.Context, tenantID, studentID string) ([]db.ListPickupEventsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)

	return s.q.ListPickupEvents(ctx, db.ListPickupEventsParams{
		StudentID: sID,
		TenantID:  tID,
	})
}

func (s *Service) ListActivePickupCodesForStudent(ctx context.Context, tenantID, studentID string) ([]db.PickupVerificationCode, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	sID := pgtype.UUID{}
	sID.Scan(studentID)

	return s.q.ListActivePickupCodesForStudent(ctx, db.ListActivePickupCodesForStudentParams{
		StudentID: sID,
		TenantID:  tID,
	})
}

