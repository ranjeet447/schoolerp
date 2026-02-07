package finance

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type IssueReceiptParams struct {
	TenantID       string
	StudentID      string
	Amount         int64
	Mode           string
	TransactionRef string
	UserID         string
	RequestID      string
	IP             string
}

func (s *Service) IssueReceipt(ctx context.Context, p IssueReceiptParams) (db.Receipt, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(p.StudentID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	// 1. Get Active Series
	series, err := s.q.GetActiveSeries(ctx, tUUID)
	if err != nil {
		return db.Receipt{}, fmt.Errorf("no active receipt series found: %w", err)
	}

	// 2. Get Next Number
	receiptNo, err := s.q.GetNextReceiptNumber(ctx, db.GetNextReceiptNumberParams{
		ID:       series.ID,
		TenantID: tUUID,
	})
	if err != nil {
		return db.Receipt{}, fmt.Errorf("failed to generate receipt number: %w", err)
	}

	// 3. Create Receipt
	receipt, err := s.q.CreateReceipt(ctx, db.CreateReceiptParams{
		TenantID:       tUUID,
		ReceiptNumber:  receiptNo.(string),
		StudentID:      sUUID,
		AmountPaid:     p.Amount,
		PaymentMode:    p.Mode,
		SeriesID:       pgtype.UUID{Bytes: series.ID.Bytes, Valid: true},
		CreatedBy:      uUUID,
		TransactionRef: pgtype.Text{String: p.TransactionRef, Valid: p.TransactionRef != ""},
	})
	if err != nil {
		return db.Receipt{}, err
	}

	// 4. Audit Log
	s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "issue_receipt",
		ResourceType: "receipt",
		ResourceID:   receipt.ID,
		IPAddress:    p.IP,
	})

	return receipt, nil
}

func (s *Service) CancelReceipt(ctx context.Context, tenantID, receiptID, userID, reason string, requestID, ip string) (db.Receipt, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	rUUID := pgtype.UUID{}
	rUUID.Scan(receiptID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	receipt, err := s.q.CancelReceipt(ctx, db.CancelReceiptParams{
		ID:                 rUUID,
		TenantID:           tUUID,
		CancelledBy:        uUUID,
		CancellationReason: pgtype.Text{String: reason, Valid: true},
	})
	if err != nil {
		return db.Receipt{}, err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    requestID,
		Action:       "cancel_receipt",
		ResourceType: "receipt",
		ResourceID:   receipt.ID,
		IPAddress:    ip,
	})

	return receipt, nil
}

func (s *Service) ListStudentReceipts(ctx context.Context, tenantID, studentID string) ([]db.Receipt, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	return s.q.ListStudentReceipts(ctx, db.ListStudentReceiptsParams{
		StudentID: sUUID,
		TenantID:  tUUID,
	})
}
