package finance

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
	"github.com/schoolerp/api/internal/foundation/security"
)

type mockFinanceQuerier struct {
	db.Querier
	outboxCreated   bool
	gatewayConfig   db.PaymentGatewayConfig
	processedEvents map[string]bool
	loggedEvents    map[string]bool
	webhookLogs     map[string]db.WebhookLog
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
	if m.loggedEvents == nil {
		m.loggedEvents = make(map[string]bool)
	}
	m.loggedEvents[arg.GatewayEventID] = true
	return db.PaymentEvent{}, nil
}

func (m *mockFinanceQuerier) CheckPaymentEventProcessed(ctx context.Context, arg db.CheckPaymentEventProcessedParams) (bool, error) {
	if m.processedEvents != nil && m.processedEvents[arg.GatewayEventID] {
		return true, nil
	}
	if m.loggedEvents != nil && m.loggedEvents[arg.GatewayEventID] {
		return true, nil
	}
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

func (m *mockFinanceQuerier) GetActiveGatewayConfig(ctx context.Context, arg db.GetActiveGatewayConfigParams) (db.PaymentGatewayConfig, error) {
	return m.gatewayConfig, nil
}

func (m *mockFinanceQuerier) GetTenantActiveGateway(ctx context.Context, tenantID pgtype.UUID) (db.PaymentGatewayConfig, error) {
	return m.gatewayConfig, nil
}

func (m *mockFinanceQuerier) CreateWebhookLog(ctx context.Context, arg db.CreateWebhookLogParams) (db.WebhookLog, error) {
	if m.webhookLogs == nil {
		m.webhookLogs = map[string]db.WebhookLog{}
	}
	id := pgtype.UUID{Bytes: [16]byte{9}, Valid: true}
	entry := db.WebhookLog{
		ID:       id,
		TenantID: arg.TenantID,
		Provider: arg.Provider,
		EventID:  arg.EventID,
		Payload:  arg.Payload,
		Status:   "received",
	}
	m.webhookLogs[arg.EventID] = entry
	return entry, nil
}

func (m *mockFinanceQuerier) UpdateWebhookLogStatus(ctx context.Context, arg db.UpdateWebhookLogStatusParams) (db.WebhookLog, error) {
	entry := db.WebhookLog{
		ID:           arg.ID,
		TenantID:     arg.TenantID,
		Status:       arg.Status,
		ErrorMessage: arg.ErrorMessage,
		ProcessedAt:  arg.ProcessedAt,
	}
	return entry, nil
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

func TestVerifyPayUWebhookSignature(t *testing.T) {
	provider := &PayUProvider{}
	secret := "payu_salt"
	body := []byte(`{"event":"payment_success","mihpayid":"123"}`)

	h := hmac.New(sha512.New, []byte(secret))
	h.Write(body)
	sig := "sha512=" + hex.EncodeToString(h.Sum(nil))

	if !provider.VerifyWebhookSignature(body, sig, secret) {
		t.Fatalf("expected PayU signature verification to pass")
	}
	if provider.VerifyWebhookSignature(body, sig, "wrong") {
		t.Fatalf("expected PayU signature verification to fail with wrong secret")
	}
}

func TestProcessPaymentWebhook(t *testing.T) {
	mock := &mockFinanceQuerier{
		gatewayConfig: db.PaymentGatewayConfig{
			Provider: "razorpay",
		},
	}
	provider := &RazorpayProvider{}

	auditLogger := audit.NewLogger(mock)
	policyEval := policy.NewEvaluator(mock)
	locksSvc := locks.NewService(mock)

	svc := NewService(mock, nil, auditLogger, policyEval, locksSvc, provider, nil)

	secret := "test_secret"
	body := []byte(`{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123","order_id":"order_00000000-0000-0000-0000-000000000001","amount":1000}}}}`)

	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	sig := hex.EncodeToString(h.Sum(nil))

	err := svc.ProcessPaymentWebhook(context.Background(), "fcc75681-6967-4638-867c-9ef1c990fc7e", "evt_123", body, sig, secret, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !mock.outboxCreated {
		t.Errorf("Expected outbox event to be created for paid order")
	}
}

func TestNormalizePayUEvent(t *testing.T) {
	payload := []byte(`{
		"event": "payment_success",
		"txnid": "txn_123",
		"mihpayid": "mih_456",
		"amount": 1000.50,
		"status": "success",
		"order_id": "order_789"
	}`)

	headers := map[string]string{
		"x-payu-event-id": "evt_abc",
	}

	event, err := NormalizePayUEvent(payload, headers)
	if err != nil {
		t.Fatalf("NormalizePayUEvent failed: %v", err)
	}

	if event.Provider != "payu" {
		t.Errorf("Expected provider payu, got %s", event.Provider)
	}
	if event.ProviderEventID != "evt_abc" {
		t.Errorf("Expected ProviderEventID evt_abc, got %s", event.ProviderEventID)
	}
	if event.OrderID != "txn_123" {
		t.Errorf("Expected OrderID txn_123 (from txnid), got %s", event.OrderID)
	}
	if event.Status != "paid" {
		t.Errorf("Expected status paid, got %s", event.Status)
	}
	if event.Amount != 1000 {
		t.Errorf("Expected amount 1000, got %d", event.Amount)
	}
}

func TestProcessPayUPaymentWebhookIdempotency(t *testing.T) {
	mock := &mockFinanceQuerier{
		gatewayConfig: db.PaymentGatewayConfig{
			Provider: "payu",
		},
	}
	provider := &PayUProvider{Salt: "test_salt"}

	auditLogger := audit.NewLogger(mock)
	policyEval := policy.NewEvaluator(mock)
	locksSvc := locks.NewService(mock)

	svc := NewService(mock, nil, auditLogger, policyEval, locksSvc, nil, nil)
	svc.payment = provider // Fallback in getTenantPaymentProvider

	orderID := "00000000-0000-0000-0000-000000000001"
	body := []byte(`{"event":"payment_success","txnid":"` + orderID + `","mihpayid":"mih_456","status":"success"}`)

	// Create signature
	h := hmac.New(sha512.New, []byte("test_salt"))
	h.Write(body)
	sig := "sha512=" + hex.EncodeToString(h.Sum(nil))

	ctx := context.Background()
	tenantID := "fcc75681-6967-4638-867c-9ef1c990fc7e"

	// Reset mock
	mock.outboxCreated = false

	// First call
	err := svc.ProcessPaymentWebhook(ctx, tenantID, "evt_123", body, sig, "test_salt", nil)
	if err != nil {
		t.Fatalf("First call failed: %v", err)
	}
	if !mock.outboxCreated {
		t.Errorf("Expected outbox event on first call")
	}

	// Second call - should skip outbox/receipt/ledger
	mock.outboxCreated = false
	err = svc.ProcessPaymentWebhook(ctx, tenantID, "evt_123", body, sig, "test_salt", nil)
	if err != nil {
		t.Fatalf("Second call failed: %v", err)
	}

	if mock.outboxCreated {
		t.Errorf("Expected NO outbox event on second call (duplicate event)")
	}
}

func TestEncryptionDecryption(t *testing.T) {
	key := []byte("01234567890123456789012345678901") // 32 bytes
	crypto, _ := security.NewCrypto(key)

	mock := &mockFinanceQuerier{}
	svc := &Service{q: mock, crypto: crypto}

	secret := "my-very-secret-key"
	enc, err := crypto.Encrypt([]byte(secret))
	if err != nil {
		t.Fatalf("encryption failed: %v", err)
	}

	val := "enc:" + hex.EncodeToString(enc)
	dec := svc.decryptSecret(val)

	if dec != secret {
		t.Errorf("Decryption failed. Expected %s, got %s", secret, dec)
	}

	// Test non-encrypted value
	if svc.decryptSecret("plain") != "plain" {
		t.Errorf("Should return original value for non-encrypted input")
	}
}

func TestRequireOnlinePaymentsAddonForProvider(t *testing.T) {
	ctx := context.Background()
	tenantID := "fcc75681-6967-4638-867c-9ef1c990fc7e"

	t.Run("allows payments_pro", func(t *testing.T) {
		var seen []string
		err := requireOnlinePaymentsAddonWithChecker(ctx, tenantID, "razorpay", func(_ context.Context, _ string, addonCode string) (bool, error) {
			seen = append(seen, addonCode)
			return addonCode == "payments_pro", nil
		})
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
		if len(seen) == 0 || seen[0] != "payments_pro" {
			t.Fatalf("expected payments_pro check first, got %v", seen)
		}
	})

	t.Run("allows provider-specific addon", func(t *testing.T) {
		err := requireOnlinePaymentsAddonWithChecker(ctx, tenantID, "payu", func(_ context.Context, _ string, addonCode string) (bool, error) {
			return addonCode == "payments_payu", nil
		})
		if err != nil {
			t.Fatalf("expected nil error, got %v", err)
		}
	})

	t.Run("requires addon when none active", func(t *testing.T) {
		err := requireOnlinePaymentsAddonWithChecker(ctx, tenantID, "razorpay", func(_ context.Context, _ string, _ string) (bool, error) {
			return false, nil
		})
		if !errors.Is(err, ErrPaymentsAddonRequired) {
			t.Fatalf("expected ErrPaymentsAddonRequired, got %v", err)
		}
	})

	t.Run("propagates checker errors", func(t *testing.T) {
		wantErr := errors.New("db down")
		err := requireOnlinePaymentsAddonWithChecker(ctx, tenantID, "razorpay", func(_ context.Context, _ string, _ string) (bool, error) {
			return false, wantErr
		})
		if !errors.Is(err, wantErr) {
			t.Fatalf("expected %v, got %v", wantErr, err)
		}
	})
}

func TestGetTenantPaymentProvider(t *testing.T) {
	key := []byte("01234567890123456789012345678901")
	crypto, _ := security.NewCrypto(key)

	secret := "razor_secret_secret"
	encSecret, _ := crypto.Encrypt([]byte(secret))

	mock := &mockFinanceQuerier{
		gatewayConfig: db.PaymentGatewayConfig{
			Provider:  "razorpay",
			ApiKey:    pgtype.Text{String: "rzp_test_key", Valid: true},
			ApiSecret: pgtype.Text{String: "enc:" + hex.EncodeToString(encSecret), Valid: true},
		},
	}

	svc := &Service{q: mock, crypto: crypto}

	provider, err := svc.getTenantPaymentProvider(context.Background(), "fcc75681-6967-4638-867c-9ef1c990fc7e")
	if err != nil {
		t.Fatalf("failed to get provider: %v", err)
	}

	rzp, ok := provider.(*RazorpayProvider)
	if !ok {
		t.Fatalf("expected RazorpayProvider")
	}

	if rzp.KeySecret != secret {
		t.Errorf("Decryption in provider resolution failed. Expected %s, got %s", secret, rzp.KeySecret)
	}
}

func TestGetGatewayPublicConfigDecryptsAPIKey(t *testing.T) {
	key := []byte("01234567890123456789012345678901")
	crypto, _ := security.NewCrypto(key)

	publicKey := "rzp_test_public_key"
	encKey, _ := crypto.Encrypt([]byte(publicKey))

	mock := &mockFinanceQuerier{
		gatewayConfig: db.PaymentGatewayConfig{
			Provider: "razorpay",
			ApiKey:   pgtype.Text{String: "enc:" + hex.EncodeToString(encKey), Valid: true},
		},
	}
	svc := &Service{q: mock, crypto: crypto}

	cfg, err := svc.GetGatewayPublicConfig(context.Background(), "fcc75681-6967-4638-867c-9ef1c990fc7e", "razorpay")
	if err != nil {
		t.Fatalf("GetGatewayPublicConfig failed: %v", err)
	}
	if got := cfg.ApiKey.String; got != publicKey {
		t.Fatalf("expected decrypted public api key %q, got %q", publicKey, got)
	}
}

func TestResolveWebhookTenantFromCandidatesRazorpay(t *testing.T) {
	body := []byte(`{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123"}}}}`)
	secret := "rzp_whsec_123"
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	sig := hex.EncodeToString(h.Sum(nil))

	tenantID, resolvedSecret, ok := resolveWebhookTenantFromCandidates("razorpay", body, sig, []gatewayWebhookCandidate{
		{TenantID: "tenant-a", Provider: "razorpay", WebhookSecret: "wrong"},
		{TenantID: "tenant-b", Provider: "razorpay", WebhookSecret: secret},
	})
	if !ok {
		t.Fatalf("expected to resolve tenant")
	}
	if tenantID != "tenant-b" {
		t.Fatalf("expected tenant-b, got %s", tenantID)
	}
	if resolvedSecret != secret {
		t.Fatalf("expected resolved secret to match")
	}
}

func TestResolveWebhookTenantFromCandidatesRejectsInvalidSignature(t *testing.T) {
	body := []byte(`{"event":"payment.captured"}`)
	if tenantID, _, ok := resolveWebhookTenantFromCandidates("razorpay", body, "bad", []gatewayWebhookCandidate{
		{TenantID: "tenant-a", Provider: "razorpay", WebhookSecret: "secret"},
	}); ok || tenantID != "" {
		t.Fatalf("expected resolution failure for invalid signature")
	}
}
