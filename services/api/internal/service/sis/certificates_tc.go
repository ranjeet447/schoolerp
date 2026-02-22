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

type GenerateTCParams struct {
	TenantID string
	StudentID string
	Reason   string
	Conduct  string
	Remarks  string
	UserID   string
	IP       string
}

func (s *CertificateService) GenerateTC(ctx context.Context, p GenerateTCParams) (db.Certificate, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(p.StudentID)

	// 1. Fetch Data
	student, err := s.q.GetStudent(ctx, db.GetStudentParams{TenantID: tUUID, ID: sUUID})
	if err != nil {
		return db.Certificate{}, fmt.Errorf("failed to fetch student: %w", err)
	}

	tenant, err := s.q.GetTenantByID(ctx, tUUID)
	if err != nil {
		return db.Certificate{}, fmt.Errorf("failed to fetch tenant: %w", err)
	}

	certNum := fmt.Sprintf("TC-%s-%04d", time.Now().Format("0601"), time.Now().Unix()%10000)

	// 2. Build PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 22)
	pdf.CellFormat(0, 15, tenant.Name, "", 1, "C", false, 0, "")
	if tenant.Domain.Valid {
		pdf.SetFont("Arial", "", 10)
		pdf.CellFormat(0, 5, tenant.Domain.String, "", 1, "C", false, 0, "")
	}
	pdf.Ln(10)

	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "TRANSFER CERTIFICATE", "", 1, "C", false, 0, "")
	pdf.SetLineWidth(0.5)
	pdf.Line(70, pdf.GetY(), 140, pdf.GetY())
	pdf.Ln(15)

	// details map
	details := []struct {
		Label string
		Value string
	}{
		{"Certificate No:", certNum},
		{"Admission No:", student.AdmissionNumber},
		{"Name of Student:", student.FullName},
		{"Date of Birth:", student.DateOfBirth.Time.Format("02 Jan 2006")},
		{"Reason for leaving:", p.Reason},
		{"General Conduct:", p.Conduct},
		{"Date of Issue:", time.Now().Format("02 Jan 2006")},
		{"Remarks:", p.Remarks},
	}

	pdf.SetFont("Arial", "", 12)
	pdf.SetLineWidth(0.2)
	
	for _, d := range details {
		pdf.CellFormat(50, 10, d.Label, "", 0, "L", false, 0, "")
		pdf.SetFont("Arial", "B", 12)
		pdf.CellFormat(0, 10, d.Value, "", 1, "L", false, 0, "")
		pdf.SetFont("Arial", "", 12)
		pdf.Ln(2)
	}

	pdf.Ln(30)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(60, 10, "Prepared By", "", 0, "C", false, 0, "")
	pdf.CellFormat(60, 10, "Checked By", "", 0, "C", false, 0, "")
	pdf.CellFormat(60, 10, "Principal", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return db.Certificate{}, err
	}

	// 3. Upload & Save
	file, err := s.fileService.Upload(ctx, files.UploadParams{
		TenantID:    p.TenantID,
		Name:        fmt.Sprintf("tc_%s.pdf", student.AdmissionNumber),
		MimeType:    "application/pdf",
		UploadedBy:  p.UserID,
		Content:     bytes.NewReader(buf.Bytes()),
		ContentSize: int64(buf.Len()),
	})
	if err != nil {
		return db.Certificate{}, err
	}

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	cert, err := s.q.CreateCertificate(ctx, db.CreateCertificateParams{
		TenantID:          tUUID,
		StudentID:         sUUID,
		CertificateType:   "tc",
		CertificateNumber: certNum,
		IssuanceDate:      pgtype.Date{Time: time.Now(), Valid: true},
		IssuedBy:          uUUID,
		Reason:            pgtype.Text{String: p.Reason, Valid: p.Reason != ""},
		FileID:            pgtype.UUID{Bytes: file.ID.Bytes, Valid: true},
	})
	if err != nil {
		return db.Certificate{}, err
	}

	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		Action:       "certificate.issue_tc",
		ResourceType: "certificate",
		ResourceID:   cert.ID,
		After:        cert,
		IPAddress:    p.IP,
	})

	return cert, nil
}
