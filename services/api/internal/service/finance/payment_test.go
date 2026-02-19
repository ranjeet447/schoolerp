package finance

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
)

type mockFinanceQuerier struct {
	db.Querier
	outboxCreated bool
}

func (m *mockFinanceQuerier) CreatePaymentOrder(ctx context.Context, arg db.CreatePaymentOrderParams) (db.PaymentOrder, error) {
	return db.PaymentOrder{
		ID:          pgtype.UUID{Bytes: [16]byte{1}, Valid: true},
		TenantID:    arg.TenantID,
		StudentID:   arg.StudentID,
		Amount:      arg.Amount,
		ExternalRef: arg.ExternalRef,
		Status:      pgtype.Text{String: "pending", Valid: true},
	}, nil
}

func (m *mockFinanceQuerier) UpdatePaymentOrderStatus(ctx context.Context, arg db.UpdatePaymentOrderStatusParams) (db.PaymentOrder, error) {
	return db.PaymentOrder{
		ID:          arg.ID,
		TenantID:    arg.TenantID,
		StudentID:   pgtype.UUID{Bytes: [16]byte{2}, Valid: true},
		Amount:      1000,
		ExternalRef: arg.ExternalRef,
		Status:      arg.Status,
	}, nil
}

func (m *mockFinanceQuerier) GetPaymentOrder(ctx context.Context, arg db.GetPaymentOrderParams) (db.PaymentOrder, error) {
	return db.PaymentOrder{
		ID:          arg.ID,
		TenantID:    arg.TenantID,
		StudentID:   pgtype.UUID{Bytes: [16]byte{3}, Valid: true},
		Amount:      1000,
		Mode:        "online",
		Status:      pgtype.Text{String: "pending", Valid: true},
		ExternalRef: pgtype.Text{String: "order_00000000-0000-0000-0000-000000000001", Valid: true},
	}, nil
}

func (m *mockFinanceQuerier) LogPaymentEvent(ctx context.Context, arg db.LogPaymentEventParams) (db.PaymentEvent, error) {
	return db.PaymentEvent{}, nil
}

func (m *mockFinanceQuerier) CheckPaymentEventProcessed(ctx context.Context, arg db.CheckPaymentEventProcessedParams) (bool, error) {
	return false, nil
}

func (m *mockFinanceQuerier) GetActiveSeries(ctx context.Context, tenantID pgtype.UUID) (db.ReceiptSeries, error) {
	return db.ReceiptSeries{ID: pgtype.UUID{Bytes: [16]byte{1}, Valid: true}}, nil
}

func (m *mockFinanceQuerier) GetNextReceiptNumber(ctx context.Context, arg db.GetNextReceiptNumberParams) (any, error) {
	return "REC-001", nil
}

func (m *mockFinanceQuerier) CreateReceipt(ctx context.Context, arg db.CreateReceiptParams) (db.Receipt, error) {
	return db.Receipt{}, nil
}

func (m *mockFinanceQuerier) CreateAuditLog(ctx context.Context, arg db.CreateAuditLogParams) (db.AuditLog, error) {
	return db.AuditLog{}, nil
}

func (m *mockFinanceQuerier) CreateOutboxEvent(ctx context.Context, arg db.CreateOutboxEventParams) (db.Outbox, error) {
	m.outboxCreated = true
	return db.Outbox{}, nil
}

func TestVerifyWebhookSignature(t *testing.T) {
	provider := &RazorpayProvider{}
	secret := "test_secret"
	body := []byte(`{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123","amount":1000}}}}`)
	
	// Generate valid signature
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	sig := hex.EncodeToString(h.Sum(nil))
	
	if !provider.VerifyWebhookSignature(body, sig, secret) {
		t.Errorf("Signature verification failed for valid signature")
	}
}

func TestProcessPaymentWebhook(t *testing.T) {
	mock := &mockFinanceQuerier{}
	provider := &RazorpayProvider{}
	
	auditLogger := audit.NewLogger(mock)
	policyEval := policy.NewEvaluator(mock)
	locksSvc := locks.NewService(mock)

	svc := NewService(mock, nil, auditLogger, policyEval, locksSvc, provider)
	
	secret := "test_secret"
	body := []byte(`{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123","order_id":"order_00000000-0000-0000-0000-000000000001","amount":1000}}}}`)
	
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	sig := hex.EncodeToString(h.Sum(nil))

	err := svc.ProcessPaymentWebhook(context.Background(), "fcc75681-6967-4638-867c-9ef1c990fc7e", "evt_123", body, sig, secret)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	
	if !mock.outboxCreated {
		t.Errorf("Expected outbox event to be created for paid order")
	}
}

