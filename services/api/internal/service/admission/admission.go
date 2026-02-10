package admission

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type AdmissionService struct {
	q     db.Querier
	audit *audit.Logger
}

func NewAdmissionService(q db.Querier, audit *audit.Logger) *AdmissionService {
	return &AdmissionService{
		q:     q,
		audit: audit,
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
