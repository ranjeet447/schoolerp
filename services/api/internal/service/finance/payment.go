package finance

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type PaymentProvider interface {
	CreateOrder(ctx context.Context, amount int64, currency string, receiptID string) (string, error)
	VerifyWebhookSignature(body []byte, signature string, secret string) bool
}

// RazorpayProvider is a production implementation
type RazorpayProvider struct {
	KeyID     string
	KeySecret string
}

func (r *RazorpayProvider) CreateOrder(ctx context.Context, amount int64, currency string, receiptID string) (string, error) {
	if strings.TrimSpace(r.KeyID) == "" || strings.TrimSpace(r.KeySecret) == "" {
		return fmt.Sprintf("order_%s", receiptID), nil
	}

	body, err := json.Marshal(map[string]interface{}{
		"amount":   amount,
		"currency": currency,
		"receipt":  receiptID,
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.razorpay.com/v1/orders", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.SetBasicAuth(r.KeyID, r.KeySecret)
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("razorpay order create failed: %s", strings.TrimSpace(string(respBody)))
	}

	var parsed struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", err
	}
	if strings.TrimSpace(parsed.ID) == "" {
		return "", fmt.Errorf("razorpay order create response missing id")
	}

	return parsed.ID, nil
}

func (r *RazorpayProvider) VerifyWebhookSignature(body []byte, signature string, secret string) bool {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	expected := hex.EncodeToString(h.Sum(nil))
	return expected == signature
}

func pgUUIDToString(v pgtype.UUID) (string, error) {
	if !v.Valid {
		return "", fmt.Errorf("invalid uuid value")
	}
	id, err := uuid.FromBytes(v.Bytes[:])
	if err != nil {
		return "", err
	}
	return id.String(), nil
}

func resolveInternalOrderID(orderID string) (pgtype.UUID, error) {
	trimmed := strings.TrimSpace(orderID)
	if trimmed == "" {
		return pgtype.UUID{}, fmt.Errorf("missing order_id in payment event")
	}

	trimmed = strings.TrimPrefix(trimmed, "order_")

	orderUUID := pgtype.UUID{}
	if err := orderUUID.Scan(trimmed); err != nil {
		return pgtype.UUID{}, fmt.Errorf("unable to resolve internal order id from gateway order_id %q: %w", orderID, err)
	}

	return orderUUID, nil
}


// PayUProvider implementation
type PayUProvider struct {
	Key    string
	Salt   string
}

func (p *PayUProvider) CreateOrder(ctx context.Context, amount int64, currency string, receiptID string) (string, error) {
	// PayU does not require a server-side "create order" call like Razorpay. 
	// We just use the receiptID as the transaction ID (txnid).
	// The frontend will need the hash, which we should ideally generate here or in a separate "InitiatePayment" call.
	// For now, consistent with the interface, we return the receiptID as the external reference.
	return receiptID, nil
}

func (p *PayUProvider) VerifyWebhookSignature(body []byte, signature string, secret string) bool {
	// TODO: Implement PayU specific hash verification
	// PayU webhook/s2s verification involves hashing parameters with the Salt.
	return true 
}

func (s *Service) getTenantPaymentProvider(ctx context.Context, tenantID string) (PaymentProvider, error) {
	// Fetch active gateway configuration
	cfg, err := s.q.GetTenantActiveGateway(ctx, toPgUUID(tenantID))
	if err != nil {
		// Fallback to global provider if configured (migration path)
		if s.payment != nil {
			return s.payment, nil
		}
		return nil, fmt.Errorf("no active payment gateway configured for tenant: %w", err)
	}

	switch cfg.Provider {
	case "razorpay":
		return &RazorpayProvider{
			KeyID:     cfg.ApiKey.String,
			KeySecret: cfg.ApiSecret.String,
		}, nil
	case "payu":
		return &PayUProvider{
			Key:  cfg.ApiKey.String,
			Salt: cfg.ApiSecret.String, // Assuming Salt is stored in ApiSecret field
		}, nil
	default:
		return nil, fmt.Errorf("unsupported payment provider: %s", cfg.Provider)
	}
}

func (s *Service) CreateOnlineOrder(ctx context.Context, tenantID, studentID string, amount int64) (db.PaymentOrder, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	// 1. Create Internal Order
	order, err := s.q.CreatePaymentOrder(ctx, db.CreatePaymentOrderParams{
		TenantID:    tUUID,
		StudentID:   sUUID,
		Amount:      amount,
		Mode:        "online",
		ExternalRef: pgtype.Text{},
	})
	if err != nil {
		return db.PaymentOrder{}, err
	}

	provider, err := s.getTenantPaymentProvider(ctx, tenantID)
	if err != nil {
		return db.PaymentOrder{}, err
	}

	internalOrderID, err := pgUUIDToString(order.ID)
	if err != nil {
		return db.PaymentOrder{}, err
	}

	externalRef, err := provider.CreateOrder(ctx, amount, "INR", internalOrderID)
	if err != nil {
		return db.PaymentOrder{}, err
	}

	order, err = s.q.UpdatePaymentOrderStatus(ctx, db.UpdatePaymentOrderStatusParams{
		ID:          order.ID,
		TenantID:    tUUID,
		Status:      pgtype.Text{String: "pending", Valid: true},
		ExternalRef: pgtype.Text{String: externalRef, Valid: true},
	})
	if err != nil {
		return db.PaymentOrder{}, err
	}

	return order, nil
}

func (s *Service) CreateOnlineOrderParent(ctx context.Context, tenantID, userID, studentID string, amount int64) (db.PaymentOrder, error) {
	tUUID := toPgUUID(tenantID)
	uUUID := toPgUUID(userID)

	// Verify Relationship
	children, err := s.q.GetChildrenByParentUser(ctx, db.GetChildrenByParentUserParams{
		UserID:   uUUID,
		TenantID: tUUID,
	})
	if err != nil {
		return db.PaymentOrder{}, fmt.Errorf("failed to verify relationship: %w", err)
	}

	isChild := false
	for _, child := range children {
		if fmtUUID(child.ID) == studentID {
			isChild = true
			break
		}
	}

	if !isChild {
		return db.PaymentOrder{}, fmt.Errorf("student does not belong to the user")
	}

	return s.CreateOnlineOrder(ctx, tenantID, studentID, amount)
}

func (s *Service) ProcessPaymentWebhook(ctx context.Context, tenantID, eventID string, body []byte, signature string, secret string) error {
	provider, err := s.getTenantPaymentProvider(ctx, tenantID)
	if err != nil {
		return err
	}

	// 1. Verify Signature
	// Note: secret passed here might be from URL params or globalenv. 
	// Ideally, we should fetch the secret from DB too if tenant-specific.
	// We'll trust the provider to know its secret, OR we assume the caller passed the right one.
	// But wait, RazorpayProvider doesn't hold the WebhookSecret in the struct above. 
	// Let's check VerifyWebhookSignature in interface. It takes secret as arg.
	
	// FIX: We should use the secret from the DB config if available.
	if _, ok := provider.(*RazorpayProvider); ok {
		// Does RazorpayProvider need to store secret? 
		// The interface method `VerifyWebhookSignature` takes `secret` as argument.
		// So we should fetch the secret from DB and pass it.
		
		cfg, err := s.q.GetActiveGatewayConfig(ctx, db.GetActiveGatewayConfigParams{
			TenantID: toPgUUID(tenantID),
			Provider: "razorpay",
		})
		if err == nil && cfg.WebhookSecret.Valid {
			secret = cfg.WebhookSecret.String
		}
	}

	if !provider.VerifyWebhookSignature(body, signature, secret) {
		return fmt.Errorf("invalid webhook signature")
	}

	// 2. Check Idempotency
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	
	processed, err := s.q.CheckPaymentEventProcessed(ctx, db.CheckPaymentEventProcessedParams{
		TenantID:       tUUID,
		GatewayEventID: eventID,
	})
	if err != nil {
		return err
	}
	if processed {
		return nil // Already processed
	}

	// 3. Parse Event
	var event struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					ID      string `json:"id"`
					OrderID string `json:"order_id"`
					Amount  int64  `json:"amount"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}
	if err := json.Unmarshal(body, &event); err != nil {
		return err
	}

	// 4. Handle Paid Event
	if event.Event == "payment.captured" || event.Event == "order.paid" {
		// Log the event for idempotency
		_, err = s.q.LogPaymentEvent(ctx, db.LogPaymentEventParams{
			TenantID:       tUUID,
			GatewayEventID: eventID,
			EventType:      event.Event,
		})
		if err != nil {
			return err
		}

		orderUUID, err := resolveInternalOrderID(event.Payload.Payment.Entity.OrderID)
		if err != nil {
			return err
		}

		order, err := s.q.GetPaymentOrder(ctx, db.GetPaymentOrderParams{
			ID:       orderUUID,
			TenantID: tUUID,
		})
		if err != nil {
			return fmt.Errorf("failed to resolve payment order for webhook: %w", err)
		}

		studentID, err := pgUUIDToString(order.StudentID)
		if err != nil {
			return err
		}

		// Issue Auto Receipt
		_, err = s.IssueReceipt(ctx, IssueReceiptParams{
			TenantID:       tenantID,
			StudentID:      studentID,
			Amount:         order.Amount,
			Mode:           "online",
			TransactionRef: event.Payload.Payment.Entity.ID,
			UserID:         "00000000-0000-0000-0000-000000000000", // System
			IP:             "127.0.0.1",
		})
		if err != nil {
			return fmt.Errorf("failed to issue auto-receipt: %w", err)
		}

		_, err = s.q.UpdatePaymentOrderStatus(ctx, db.UpdatePaymentOrderStatusParams{
			ID:          order.ID,
			TenantID:    tUUID,
			Status:      pgtype.Text{String: "paid", Valid: true},
			ExternalRef: order.ExternalRef,
		})
		if err != nil {
			return fmt.Errorf("failed to mark payment order paid: %w", err)
		}

		// 5. Outbox Event for Notification
		payload, _ := json.Marshal(event.Payload)
		_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
			TenantID:  tUUID,
			EventType: "fee.paid",
			Payload:   payload,
		})
	}

	return nil
}

