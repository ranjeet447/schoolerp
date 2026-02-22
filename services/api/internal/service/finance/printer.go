package finance

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jung-kurt/gofpdf"
)

func (s *Service) GetReceiptPDF(ctx context.Context, tenantID, receiptID string) ([]byte, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	rUUID := pgtype.UUID{}
	rUUID.Scan(receiptID)

	var data struct {
		ReceiptNo   string
		Amount      int64
		Mode        string
		Ref         string
		Date        time.Time
		StudentName string
		AdmnNo      string
		ClassName   string
		SectionName string
		TenantName  string
		TenantAddr  string
		TenantPhone string
	}

	err := s.db.QueryRow(ctx, `
		SELECT 
			r.receipt_number, r.amount_paid, r.payment_mode, COALESCE(r.transaction_ref, ''), r.created_at,
			st.full_name, st.admission_number, c.name, sec.name,
			t.name, COALESCE(t.address, ''), COALESCE(t.phone, '')
		FROM receipts r
		JOIN students st ON r.student_id = st.id
		JOIN sections sec ON st.section_id = sec.id
		JOIN classes c ON sec.class_id = c.id
		JOIN tenants t ON r.tenant_id = t.id
		WHERE r.id = $1 AND r.tenant_id = $2
	`, rUUID, tUUID).Scan(
		&data.ReceiptNo, &data.Amount, &data.Mode, &data.Ref, &data.Date,
		&data.StudentName, &data.AdmnNo, &data.ClassName, &data.SectionName,
		&data.TenantName, &data.TenantAddr, &data.TenantPhone,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch receipt details: %w", err)
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Colors
	primaryColor := struct{ r, g, b int }{30, 41, 59} // Slate 800

	// Header
	pdf.SetFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
	pdf.Rect(0, 0, 210, 40, "F")
	
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 20)
	pdf.CellFormat(0, 15, data.TenantName, "", 1, "C", false, 0, "")
	
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 5, data.TenantAddr, "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 5, "Phone: "+data.TenantPhone, "", 1, "C", false, 0, "")

	pdf.Ln(15)
	
	// Receipt Title
	pdf.SetTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "FEE RECEIPT", "", 1, "C", false, 0, "")
	pdf.Ln(5)

	// Content Grid
	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(241, 245, 249) // Slate 100
	
	// Row 1: Receipt Info
	pdf.CellFormat(95, 10, "Receipt No: "+data.ReceiptNo, "1", 0, "L", true, 0, "")
	pdf.CellFormat(95, 10, "Date: "+data.Date.Format("02 Jan 2006"), "1", 1, "L", true, 0, "")
	
	// Row 2: Student Info
	pdf.CellFormat(95, 10, "Student Name: "+data.StudentName, "1", 0, "L", false, 0, "")
	pdf.CellFormat(95, 10, "Adm No: "+data.AdmnNo, "1", 1, "L", false, 0, "")
	
	// Row 3: Class Info
	pdf.CellFormat(95, 10, "Class: "+data.ClassName+" "+data.SectionName, "1", 0, "L", false, 0, "")
	pdf.CellFormat(95, 10, "Payment Mode: "+data.Mode, "1", 1, "L", false, 0, "")

	pdf.Ln(10)

	// Summary Table
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(150, 10, "Description", "1", 0, "C", true, 0, "")
	pdf.CellFormat(40, 10, "Amount", "1", 1, "C", true, 0, "")
	
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(150, 12, "School Fee Payment", "1", 0, "L", false, 0, "")
	pdf.CellFormat(40, 12, fmt.Sprintf("%.2f", float64(data.Amount)/100.0), "1", 1, "R", false, 0, "")
	
	// Total Row
	pdf.SetFont("Arial", "B", 11)
	pdf.CellFormat(150, 12, "TOTAL AMOUNT PAID", "1", 0, "R", true, 0, "")
	pdf.CellFormat(40, 12, fmt.Sprintf("%.2f", float64(data.Amount)/100.0), "1", 1, "R", true, 0, "")

	pdf.Ln(10)
	
	// Transaction Ref
	if data.Ref != "" {
		pdf.SetFont("Arial", "I", 9)
		pdf.CellFormat(0, 5, "Transaction Ref: "+data.Ref, "", 1, "L", false, 0, "")
	}

	pdf.Ln(20)
	
	// Footer Notice
	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(100, 100, 100)
	pdf.CellFormat(0, 5, "This is a computer generated receipt and does not require a physical signature.", "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 5, "Thank you for the payment.", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	err = pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (s *Service) GetFeeDayBookPDF(ctx context.Context, tenantID string, from, to time.Time) ([]byte, error) {
	data, err := s.GetFeeDayBookData(ctx, tenantID, from, to)
	if err != nil {
		return nil, err
	}

	pdf := gofpdf.New("L", "mm", "A4", "") // Landscape for more columns
	pdf.AddPage()

	// Header
	pdf.SetFillColor(30, 41, 59)
	pdf.Rect(0, 0, 297, 30, "F")
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "FEE DAY BOOK", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 5, fmt.Sprintf("Period: %s to %s", from.Format("02 Jan 2006"), to.Format("02 Jan 2006")), "", 1, "C", false, 0, "")
	pdf.Ln(10)

	// Table Header
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFillColor(241, 245, 249)
	pdf.SetFont("Arial", "B", 9)
	
	cols := []struct {
		name  string
		width float64
	}{
		{"Date", 25},
		{"Receipt #", 30},
		{"Student Name", 50},
		{"Class", 30},
		{"Fee Head", 50},
		{"Mode", 25},
		{"Amount", 30},
	}

	for _, c := range cols {
		pdf.CellFormat(c.width, 8, c.name, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Data Rows
	pdf.SetFont("Arial", "", 8)
	var total int64
	for i, r := range data {
		fill := i%2 != 0
		pdf.CellFormat(25, 7, r.CreatedAt.Time.Format("02-01-2006"), "1", 0, "L", fill, 0, "")
		pdf.CellFormat(30, 7, r.ReceiptNumber, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(50, 7, r.StudentName, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(30, 7, r.ClassName+" "+r.SectionName, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(50, 7, r.FeeHeadName, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(25, 7, r.PaymentMode, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(30, 7, fmt.Sprintf("%.2f", float64(r.ItemAmount)/100.0), "1", 1, "R", fill, 0, "")
		total += r.ItemAmount
	}

	// Total Row
	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(241, 245, 249)
	pdf.CellFormat(210, 8, "TOTAL", "1", 0, "R", true, 0, "")
	pdf.CellFormat(30, 8, fmt.Sprintf("%.2f", float64(total)/100.0), "1", 1, "R", true, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (s *Service) GetDefaultersPDF(ctx context.Context, tenantID string) ([]byte, error) {
	data, err := s.GetDefaultersData(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	pdf := gofpdf.New("P", "mm", "A4", "") 
	pdf.AddPage()

	// Header
	pdf.SetFillColor(30, 41, 59)
	pdf.Rect(0, 0, 210, 30, "F")
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "FEE DEFAULTERS", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(0, 5, fmt.Sprintf("As of Date: %s", time.Now().Format("02 Jan 2006")), "", 1, "C", false, 0, "")
	pdf.Ln(10)

	// Table Header
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFillColor(241, 245, 249)
	pdf.SetFont("Arial", "B", 9)
	
	cols := []struct {
		name  string
		width float64
	}{
		{"Student Name", 50},
		{"Class", 30},
		{"Fee Head", 40},
		{"Due Date", 25},
		{"Due Amt", 20},
		{"Balance", 25},
	}

	for _, c := range cols {
		pdf.CellFormat(c.width, 8, c.name, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Data Rows
	pdf.SetFont("Arial", "", 8)
	var totalDue, totalBalance int64
	for i, r := range data {
		fill := i%2 != 0
		pdf.CellFormat(50, 7, r.FullName, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(30, 7, r.ClassName+" "+r.SectionName, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(40, 7, r.FeeHeadName, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(25, 7, r.DueDate.Time.Format("02-01-2006"), "1", 0, "C", fill, 0, "")
		pdf.CellFormat(20, 7, fmt.Sprintf("%.2f", float64(r.DueAmount)/100.0), "1", 0, "R", fill, 0, "")
		pdf.CellFormat(25, 7, fmt.Sprintf("%.2f", float64(r.BalanceAmount)/100.0), "1", 1, "R", fill, 0, "")
		totalDue += r.DueAmount
		totalBalance += r.BalanceAmount
	}

	// Total Row
	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(241, 245, 249)
	pdf.CellFormat(145, 8, "TOTAL OUTSTANDING", "1", 0, "R", true, 0, "")
	pdf.CellFormat(20, 8, fmt.Sprintf("%.2f", float64(totalDue)/100.0), "1", 0, "R", true, 0, "")
	pdf.CellFormat(25, 8, fmt.Sprintf("%.2f", float64(totalBalance)/100.0), "1", 1, "R", true, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
