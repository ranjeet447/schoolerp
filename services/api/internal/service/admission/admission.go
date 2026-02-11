package admission

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	sisservice "github.com/schoolerp/api/internal/service/sis"
)

type AdmissionService struct {
	q       db.Querier
	audit   *audit.Logger
	student *sisservice.StudentService
}

func NewAdmissionService(q db.Querier, audit *audit.Logger, student *sisservice.StudentService) *AdmissionService {
	return &AdmissionService{
		q:       q,
		audit:   audit,
		student: student,
	}
}

// Public Enquiries

type CreateEnquiryParams struct {
	TenantID        string
	ParentName      string
	Email           string
	Phone           string
	StudentName     string
	GradeInterested string
	AcademicYear    string
	Source          string
	Notes           string
	IPAddress       string
}

func (s *AdmissionService) SubmitEnquiry(ctx context.Context, p CreateEnquiryParams) (db.AdmissionEnquiry, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)

	enquiry, err := s.q.CreateEnquiry(ctx, db.CreateEnquiryParams{
		TenantID:        tID,
		ParentName:      p.ParentName,
		Email:           pgtype.Text{String: p.Email, Valid: p.Email != ""},
		Phone:           p.Phone,
		StudentName:     p.StudentName,
		GradeInterested: p.GradeInterested,
		AcademicYear:    p.AcademicYear,
		Source:          pgtype.Text{String: p.Source, Valid: p.Source != ""},
		Status:          "open",
		Notes:           pgtype.Text{String: p.Notes, Valid: p.Notes != ""},
	})
	if err != nil {
		return db.AdmissionEnquiry{}, fmt.Errorf("failed to submit enquiry: %w", err)
	}

	// Audit (Public action, no UserID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		Action:       "PUBLIC_ENQUIRY",
		ResourceType: "admission_enquiry",
		ResourceID:   enquiry.ID,
		After:        map[string]interface{}{"parent": p.ParentName, "grade": p.GradeInterested},
		IPAddress:    p.IPAddress,
	})

	return enquiry, nil
}

// Admin Operations

func (s *AdmissionService) ListEnquiries(ctx context.Context, tenantID string, limit, offset int32) ([]db.AdmissionEnquiry, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListEnquiries(ctx, db.ListEnquiriesParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *AdmissionService) UpdateEnquiryStatus(ctx context.Context, tenantID, id, status, userID, ip string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(id)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	err := s.q.UpdateEnquiryStatus(ctx, db.UpdateEnquiryStatusParams{
		ID:       eID,
		TenantID: tID,
		Status:   status,
	})
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "UPDATE_ENQUIRY_STATUS",
		ResourceType: "admission_enquiry",
		ResourceID:   eID,
		After:        map[string]interface{}{"status": status},
		IPAddress:    ip,
	})

	return nil
}

// Applications

func (s *AdmissionService) CreateApplication(ctx context.Context, tenantID, enquiryID string, data map[string]interface{}, userID, ip string) (db.AdmissionApplication, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(enquiryID)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	// Auto-generate App Number (Simple timestamp based for MVP)
	appNum := fmt.Sprintf("APP-%d", time.Now().Unix())

	jsonBytes, _ := json.Marshal(data)

	app, err := s.q.CreateApplication(ctx, db.CreateApplicationParams{
		TenantID:          tID,
		EnquiryID:         eID,
		ApplicationNumber: appNum,
		Status:            "draft",
		FormData:          jsonBytes,
		Documents:         []byte("[]"),
	})
	if err != nil {
		return db.AdmissionApplication{}, fmt.Errorf("failed to create application: %w", err)
	}
	
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "CREATE_APPLICATION",
		ResourceType: "admission_application",
		ResourceID:   app.ID,
		IPAddress:    ip,
	})

	return app, nil
}

func (s *AdmissionService) ListApplications(ctx context.Context, tenantID string, limit, offset int32) ([]db.ListApplicationsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListApplications(ctx, db.ListApplicationsParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *AdmissionService) RecordFeePayment(ctx context.Context, tenantID, appID string, amount int64, ref, userID, ip string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(appID)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	err := s.q.UpdateApplicationFee(ctx, db.UpdateApplicationFeeParams{
		ID:                   aID,
		TenantID:             tID,
		ProcessingFeeAmount:  pgtype.Int8{Int64: amount, Valid: true},
		ProcessingFeeStatus:  pgtype.Text{String: "paid", Valid: true},
		PaymentReference:     pgtype.Text{String: ref, Valid: true},
	})
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "RECORD_ADMISSION_FEE",
		ResourceType: "admission_application",
		ResourceID:   aID,
		After:        map[string]interface{}{"amount": amount, "ref": ref},
		IPAddress:    ip,
	})

	return nil
}
func (s *AdmissionService) UpdateApplicationStatus(ctx context.Context, tenantID, id, status, userID, ip string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(id)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	err := s.q.UpdateApplicationStatus(ctx, db.UpdateApplicationStatusParams{
		ID:       aID,
		TenantID: tID,
		Status:   status,
	})
	if err != nil {
		return err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tID,
		UserID:       uID,
		Action:       "UPDATE_APPLICATION_STATUS",
		ResourceType: "admission_application",
		ResourceID:   aID,
		After:        map[string]interface{}{"status": status},
		IPAddress:    ip,
	})

	return nil
}

func (s *AdmissionService) GetApplication(ctx context.Context, tenantID, id string) (db.AdmissionApplication, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(id)

	return s.q.GetApplication(ctx, db.GetApplicationParams{
		ID:       aID,
		TenantID: tID,
	})
}

func (s *AdmissionService) AcceptApplication(ctx context.Context, tenantID, id, classID, sectionID, userID, ip string) error {
	app, err := s.GetApplication(ctx, tenantID, id)
	if err != nil {
		return err
	}

	if app.Status == "accepted" {
		return fmt.Errorf("application already accepted")
	}

	// 1. Create Student record in SIS
	// Extract details from application (assuming basic fields for now)
	var formData map[string]interface{}
	json.Unmarshal(app.FormData, &formData)

	studentName, _ := formData["student_name"].(string)
	if studentName == "" {
		// Fallback to enquiry student name if present
		// enquiry, _ := s.q.GetEnquiry(ctx, app.EnquiryID)
		// studentName = enquiry.StudentName
	}

	_, err = s.student.CreateStudent(ctx, sisservice.CreateStudentParams{
		TenantID:        tenantID,
		AdmissionNumber: app.ApplicationNumber, // Use app number as initial admission number
		FullName:        studentName,
		SectionID:       sectionID,
		Status:          "active",
		UserID:          userID,
		IP:              ip,
	})
	if err != nil {
		return fmt.Errorf("failed to create student: %w", err)
	}

	// 2. Update Application Status
	return s.UpdateApplicationStatus(ctx, tenantID, id, "accepted", userID, ip)
}

