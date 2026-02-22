package sis

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jung-kurt/gofpdf"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/service/files"
)

type CertificateService struct {
	q        db.Querier
	audit    *audit.Logger
	fileService *files.FileService
}

func NewCertificateService(q db.Querier, audit *audit.Logger, fileService *files.FileService) *CertificateService {
	return &CertificateService{q: q, audit: audit, fileService: fileService}
}

type GenerateBonafideParams struct {
	TenantID string
	StudentID string
	Reason   string
	UserID   string
	IP       string
}

func (s *CertificateService) GenerateBonafide(ctx context.Context, p GenerateBonafideParams) (db.Certificate, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(p.StudentID)

	// 1. Fetch Student and Tenant Data
	student, err := s.q.GetStudent(ctx, db.GetStudentParams{
		TenantID: tUUID,
		ID:       sUUID,
	})
	if err != nil {
		return db.Certificate{}, fmt.Errorf("failed to fetch student: %w", err)
	}

	tenant, err := s.q.GetTenantByID(ctx, tUUID)
	if err != nil {
		return db.Certificate{}, fmt.Errorf("failed to fetch tenant: %w", err)
	}

	// For class and section info, we might need a richer query, but for now we format it if available
	// In a real scenario we'd query the currently assigned class. We'll leave it simple.
	
	// 2. Generate Certificate Number
	certNum := fmt.Sprintf("BON-%s-%04d", time.Now().Format("0601"), time.Now().Unix()%10000)

	// 3. Generate PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 24)
	pdf.CellFormat(0, 20, tenant.Name, "", 1, "C", false, 0, "")

	if tenant.Domain.Valid {
		pdf.SetFont("Arial", "", 12)
		pdf.CellFormat(0, 10, tenant.Domain.String, "", 1, "C", false, 0, "")
	}

	pdf.Ln(20)

	// Title
	pdf.SetFont("Arial", "B", 18)
	pdf.SetTextColor(30, 41, 59)
	pdf.CellFormat(0, 10, "BONAFIDE CERTIFICATE", "", 1, "C", false, 0, "")
	pdf.SetLineWidth(0.5)
	pdf.Line(65, pdf.GetY(), 145, pdf.GetY()) // Underline title
	pdf.Ln(15)

	// Date and Cert No
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(95, 10, "Ref No: "+certNum, "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 10, "Date: "+time.Now().Format("02 Jan 2006"), "", 1, "R", false, 0, "")
	pdf.Ln(15)

	// Body text
	pdf.SetFont("Arial", "", 14)
	pdf.SetLineWidth(0.2)
	text := fmt.Sprintf(
		"This is to certify that %s (Admission No. %s) is a bonafide student of our institution.",
		student.FullName, student.AdmissionNumber,
	)
	
	if p.Reason != "" {
		text += fmt.Sprintf(" This certificate is being issued for the purpose of %s.", p.Reason)
	}

	pdf.MultiCell(0, 8, text, "", "J", false)
	pdf.Ln(30)

	// Footer / Signature
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(95, 10, "Date:", "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 10, "Principal Signature", "", 1, "R", false, 0, "")

	var buf bytes.Buffer
	err = pdf.Output(&buf)
	if err != nil {
		return db.Certificate{}, fmt.Errorf("failed to generate pdf: %w", err)
	}

	// 4. Upload to Filestore
	file, err := s.fileService.Upload(ctx, files.UploadParams{
		TenantID:    p.TenantID,
		Name:        fmt.Sprintf("bonafide_%s.pdf", student.AdmissionNumber),
		MimeType:    "application/pdf",
		UploadedBy:  p.UserID,
		Content:     bytes.NewReader(buf.Bytes()),
		ContentSize: int64(buf.Len()),
	})
	if err != nil {
		return db.Certificate{}, fmt.Errorf("failed to upload certificate: %w", err)
	}

	// 5. Save to database
	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	cert, err := s.q.CreateCertificate(ctx, db.CreateCertificateParams{
		TenantID:          tUUID,
		StudentID:         sUUID,
		CertificateType:   "bonafide",
		CertificateNumber: certNum,
		IssuanceDate:      pgtype.Date{Time: time.Now(), Valid: true},
		IssuedBy:          uUUID,
		Reason:            pgtype.Text{String: p.Reason, Valid: p.Reason != ""},
		FileID:            pgtype.UUID{Bytes: file.ID.Bytes, Valid: true},
	})
	if err != nil {
		return db.Certificate{}, fmt.Errorf("failed to save certificate record: %w", err)
	}

	// 6. Audit Log
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		Action:       "certificate.issue_bonafide",
		ResourceType: "certificate",
		ResourceID:   cert.ID,
		After:        cert,
		IPAddress:    p.IP,
	})

	return cert, nil
}

func (s *CertificateService) ListCertificatesByTenant(ctx context.Context, tenantID string) ([]db.ListCertificatesByTenantRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListCertificatesByTenant(ctx, tUUID)
}

func (s *CertificateService) ListCertificatesByStudent(ctx context.Context, tenantID, studentID string) ([]db.Certificate, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	return s.q.ListCertificatesByStudent(ctx, db.ListCertificatesByStudentParams{
		TenantID:  tUUID,
		StudentID: sUUID,
	})
}
