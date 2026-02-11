package finance

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type mockFinanceQuerier struct {
	db.Querier
	outboxCreated bool
}

func (m *mockFinanceQuerier) CreatePaymentOrder(ctx context.Context, arg db.CreatePaymentOrderParams) (db.PaymentOrder, error) {
	return db.PaymentOrder{ID: pgtype.UUID{Bytes: [16]byte{1}, Valid: true}}, nil
}

func (m *mockFinanceQuerier) CreateOutboxEvent(ctx context.Context, arg db.CreateOutboxEventParams) (db.Outbox, error) {
	m.outboxCreated = true
	return db.Outbox{}, nil
}

func TestVerifyWebhookSignature(t *testing.T) {
	provider := &RazorpayProvider{}
	secret := "test_secret"
	body := []byte(`{"event":"order.paid"}`)
	
	// Generate valid signature
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	sig := hex.EncodeToString(h.Sum(nil))
	
	if !provider.VerifyWebhookSignature(body, sig, secret) {
		t.Errorf("Signature verification failed for valid signature")
	}
	
	if provider.VerifyWebhookSignature(body, "invalid", secret) {
		t.Errorf("Signature verification succeeded for invalid signature")
	}
}

func TestProcessPaymentWebhook(t *testing.T) {
	mock := &mockFinanceQuerier{}
	svc := &Service{q: mock}
	
	body := []byte(`{
		"event": "order.paid",
		"payload": {
			"order": {
				"entity": {
					"id": "order_123",
					"status": "paid"
				}
			}
		}
	}`)
	
	err := svc.ProcessPaymentWebhook(context.Background(), "fcc75681-6967-4638-867c-9ef1c990fc7e", body, "ignored_for_now")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	
	if !mock.outboxCreated {
		t.Errorf("Expected outbox event to be created for paid order")
	}
}
