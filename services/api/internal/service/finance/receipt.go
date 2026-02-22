package finance

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/policy"
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
	Items          []ReceiptItemParam
}

type ReceiptItemParam struct {
	HeadID string
	Amount int64
}

func (s *Service) IssueReceipt(ctx context.Context, p IssueReceiptParams) (db.Receipt, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	sUUID := pgtype.UUID{}
	sUUID.Scan(p.StudentID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.UserID)

	// Start Transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return db.Receipt{}, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// 1. Get Active Series
	series, err := qtx.GetActiveSeries(ctx, tUUID)
	if err != nil {
		return db.Receipt{}, fmt.Errorf("no active receipt series found: %w", err)
	}

	// 2. Get Next Number
	receiptNo, err := qtx.GetNextReceiptNumber(ctx, db.GetNextReceiptNumberParams{
		ID:       series.ID,
		TenantID: tUUID,
	})
	if err != nil {
		return db.Receipt{}, fmt.Errorf("failed to generate receipt number: %w", err)
	}

	// 3. Create Receipt
	receipt, err := qtx.CreateReceipt(ctx, db.CreateReceiptParams{
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

	// 3.5 Create Receipt Items
	if len(p.Items) == 0 {
		// Auto-allocate against oldest dues (FIFO)
		dues, err := qtx.GetStudentFeeSummary(ctx, sUUID)
		if err != nil {
			return db.Receipt{}, fmt.Errorf("failed to fetch dues for auto-allocation: %w", err)
		}

		remaining := p.Amount
		for _, d := range dues {
			if remaining <= 0 {
				break
			}
			itemDue := d.Amount - d.PaidAmount
			if itemDue <= 0 {
				continue
			}

			allocate := itemDue
			if remaining < itemDue {
				allocate = remaining
			}

			_, err := qtx.CreateReceiptItem(ctx, db.CreateReceiptItemParams{
				ReceiptID: receipt.ID,
				FeeHeadID: d.HeadID,
				Amount:    allocate,
			})
			if err != nil {
				return db.Receipt{}, fmt.Errorf("failed to create auto-allocated receipt item: %w", err)
			}
			remaining -= allocate
		}

		// If there's still money left after all known dues are covered,
		// we could either return an error or put it in a "suspense" head.
		// For now, we'll just allow it - it might be an overpayment.
	} else {
		// Manual itemization
		for _, item := range p.Items {
			hUUID := pgtype.UUID{}
			hUUID.Scan(item.HeadID)

			_, err := qtx.CreateReceiptItem(ctx, db.CreateReceiptItemParams{
				ReceiptID: receipt.ID,
				FeeHeadID: hUUID,
				Amount:    item.Amount,
			})
			if err != nil {
				return db.Receipt{}, fmt.Errorf("failed to create receipt item: %w", err)
			}
		}
	}

	// Commit Transaction
	if err := tx.Commit(ctx); err != nil {
		return db.Receipt{}, fmt.Errorf("failed to commit transaction: %w", err)
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
	// 0. Policy Check
	decision, err := s.policy.Evaluate(ctx, policy.Context{
		TenantID: tenantID,
		Module:   "finance",
		Action:   "cancel_receipt",
		Role:     "accountant", // In real implementation, pass actual role
	})
	if err != nil {
		return db.Receipt{}, err
	}
	if !decision.Allowed {
		return db.Receipt{}, fmt.Errorf("action denied: %s", decision.DenialReason)
	}

	// 1. Acquire Lock
	lockResource := fmt.Sprintf("receipt:%s", receiptID)
	_, err = s.locks.Lock(ctx, tenantID, "finance", &lockResource, userID, "Cancelling Receipt")
	if err != nil {
		return db.Receipt{}, fmt.Errorf("could not acquire lock: %w", err)
	}
	defer s.locks.Unlock(ctx, tenantID, "finance", &lockResource)

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
func (s *Service) CreateRefund(ctx context.Context, tenantID, receiptID string, amount int64, reason string) (db.FeeRefund, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	rUUID := pgtype.UUID{}
	rUUID.Scan(receiptID)

	return s.q.CreateRefund(ctx, db.CreateRefundParams{
		TenantID:  tUUID,
		ReceiptID: rUUID,
		Amount:    amount,
		Reason:    pgtype.Text{String: reason, Valid: true},
	})
}

func (s *Service) CreateReceiptSeries(ctx context.Context, tenantID, prefix string, startNo int32) (db.ReceiptSeries, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.CreateReceiptSeries(ctx, db.CreateReceiptSeriesParams{
		TenantID:      tUUID,
		Prefix:        prefix,
		CurrentNumber: pgtype.Int4{Int32: startNo, Valid: true},
		IsActive:      pgtype.Bool{Bool: true, Valid: true},
	})
}

func (s *Service) ListReceiptSeries(ctx context.Context, tenantID string) ([]db.ReceiptSeries, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListReceiptSeries(ctx, tUUID)
}
