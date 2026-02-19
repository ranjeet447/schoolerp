package finance

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

// Advanced Fee Configurations

type FeeClassConfigParams struct {
	TenantID       string    `json:"tenant_id"`
	AcademicYearID string    `json:"academic_year_id"`
	ClassID        string    `json:"class_id"`
	FeeHeadID      string    `json:"fee_head_id"`
	Amount         float64   `json:"amount"`
	DueDate        *time.Time `json:"due_date"`
	IsOptional     bool      `json:"is_optional"`
}

func (s *Service) UpsertFeeClassConfig(ctx context.Context, p FeeClassConfigParams) (db.FeeClassConfiguration, error) {
	tID := toPgUUID(p.TenantID)
	ayID := toPgUUID(p.AcademicYearID)
	cID := toPgUUID(p.ClassID)
	fhID := toPgUUID(p.FeeHeadID)
	
	var dDate pgtype.Date
	if p.DueDate != nil {
		dDate = pgtype.Date{Time: *p.DueDate, Valid: true}
	}

	return s.q.UpsertFeeClassConfig(ctx, db.UpsertFeeClassConfigParams{
		TenantID:       tID,
		AcademicYearID: ayID,
		ClassID:        cID,
		FeeHeadID:      fhID,
		Amount:         floatToNumeric(p.Amount),
		DueDate:        dDate,
		IsOptional:     pgtype.Bool{Bool: p.IsOptional, Valid: true},
	})
}

// Helper to convert float to numeric if needed, but sqlc might generate string or special type for Numeric.
// Checking generated code: usually pgtype.Numeric.
// I'll need a helper for float->Numeric if I want to be precise, ensuring proper scaling.
// For now, I'll rely on a simple conversion if possible, or assume input is string. 
// Wait, UpsertFeeClassConfigParams generated from SQL:
/*
   Amount pgtype.Numeric
*/
// I'll leave a TODO comment and fix the Numeric conversion.

func (s *Service) ListFeeClassConfigs(ctx context.Context, tenantID, ayID string, classID *string) ([]db.ListFeeClassConfigsRow, error) {
	tID := toPgUUID(tenantID)
	ayIDPg := toPgUUID(ayID)
	var cID pgtype.UUID
	if classID != nil {
		cID = toPgUUID(*classID)
	}

	return s.q.ListFeeClassConfigs(ctx, db.ListFeeClassConfigsParams{
		TenantID:       tID,
		AcademicYearID: ayIDPg,
		ClassID:        cID,
	})
}

// Scholarships

type ScholarshipParams struct {
	TenantID    string  `json:"tenant_id"`
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Value       float64 `json:"value"`
	Description string  `json:"description"`
	IsActive    bool    `json:"is_active"`
}

func (s *Service) UpsertScholarship(ctx context.Context, p ScholarshipParams) (db.FeeDiscountsScholarship, error) {
	tID := toPgUUID(p.TenantID)

	return s.q.UpsertScholarship(ctx, db.UpsertScholarshipParams{
		TenantID:    tID,
		Name:        p.Name,
		Type:        p.Type,
		Value:       floatToNumeric(p.Value),
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
		IsActive:    pgtype.Bool{Bool: p.IsActive, Valid: true},
	})
}

func (s *Service) ListScholarships(ctx context.Context, tenantID string, isActive *bool) ([]db.FeeDiscountsScholarship, error) {
	tID := toPgUUID(tenantID)
	var active bool
	if isActive != nil {
		active = *isActive
	}

	return s.q.ListScholarships(ctx, db.ListScholarshipsParams{
		TenantID: tID,
		IsActive: active,
	})
}

func (s *Service) AssignScholarship(ctx context.Context, tenantID, studentID, scholarshipID, ayID, approverID string) (db.StudentScholarship, error) {
	return s.q.AssignScholarship(ctx, db.AssignScholarshipParams{
		TenantID:       toPgUUID(tenantID),
		StudentID:      toPgUUID(studentID),
		ScholarshipID:  toPgUUID(scholarshipID),
		AcademicYearID: toPgUUID(ayID),
		ApprovedBy:     toPgUUID(approverID),
	})
}

// Gateways

type GatewayConfigParams struct {
	TenantID      string `json:"tenant_id"`
	Provider      string `json:"provider"`
	APIKey        string `json:"api_key"`
	APISecret     string `json:"api_secret"`
	WebhookSecret string `json:"webhook_secret"`
	IsActive      bool   `json:"is_active"`
	Settings      []byte `json:"settings"`
}

func (s *Service) UpsertGatewayConfig(ctx context.Context, p GatewayConfigParams) (db.PaymentGatewayConfig, error) {
	return s.q.UpsertGatewayConfig(ctx, db.UpsertGatewayConfigParams{
		TenantID:      toPgUUID(p.TenantID),
		Provider:      p.Provider,
		ApiKey:        pgtype.Text{String: p.APIKey, Valid: p.APIKey != ""},
		ApiSecret:     pgtype.Text{String: p.APISecret, Valid: p.APISecret != ""},
		WebhookSecret: pgtype.Text{String: p.WebhookSecret, Valid: p.WebhookSecret != ""},
		IsActive:      pgtype.Bool{Bool: p.IsActive, Valid: true},
		Settings:      p.Settings,
	})
}

func (s *Service) GetActiveGatewayConfig(ctx context.Context, tenantID, provider string) (db.PaymentGatewayConfig, error) {
	return s.q.GetActiveGatewayConfig(ctx, db.GetActiveGatewayConfigParams{
		TenantID: toPgUUID(tenantID),
		Provider: provider,
	})
}

// Optional Fees

func (s *Service) ListOptionalFeeItems(ctx context.Context, tenantID string) ([]db.OptionalFeeItem, error) {
	return s.q.ListOptionalFeeItems(ctx, toPgUUID(tenantID))
}

func (s *Service) SelectOptionalFee(ctx context.Context, tenantID, studentID, itemID, ayID, status string) (db.StudentOptionalFee, error) {
	tID := toPgUUID(tenantID)
	sID := toPgUUID(studentID)
	iID := toPgUUID(itemID) // item_id
	ayIDPg := toPgUUID(ayID)

	return s.q.UpsertStudentOptionalFee(ctx, db.UpsertStudentOptionalFeeParams{
		TenantID:       tID,
		StudentID:      sID,
		ItemID:         iID,
		AcademicYearID: ayIDPg,
		Status:         status,
	})
}

// Helpers

func floatToNumeric(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	n.Scan(fmt.Sprintf("%.2f", f))
	return n
}
