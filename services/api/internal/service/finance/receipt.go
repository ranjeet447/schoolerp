// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
