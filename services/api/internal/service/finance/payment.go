package finance

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"hash"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type PaymentProvider interface {
	CreateOrder(ctx context.Context, amount int64, currency string, receiptID string) (string, error)
	VerifyWebhookSignature(body []byte, signature string, secret string) bool
}

type InternalPaymentEvent struct {
	Provider         string          `json:"provider"`
	ProviderEventID  string          `json:"provider_event_id"`
	OrderID          string          `json:"order_id"`
	Status           string          `json:"status"`
	Amount           int64           `json:"amount"`
	Currency         string          `json:"currency,omitempty"`
	GatewayPaymentID string          `json:"gateway_payment_id,omitempty"`
	EventType        string          `json:"event_type,omitempty"`
	Raw              json.RawMessage `json:"raw,omitempty"`
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
	signature = normalizeWebhookSignature(signature)
	if signature == "" || strings.TrimSpace(secret) == "" {
		return false
	}
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	expected := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
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
	normalized := normalizeWebhookSignature(signature)
	secret = strings.TrimSpace(secret)
	if secret == "" {
		secret = strings.TrimSpace(p.Salt)
	}
	if normalized == "" || secret == "" {
		return false
	}

	// PayU webhook implementations vary by integration/version. Accept a strict set of
	// common signature constructions instead of allowing all events through.
	candidates := []string{
		hmacHex(sha512.New, []byte(secret), body),
		hmacHex(sha256.New, []byte(secret), body),
		plainHashHexSHA512(append(append([]byte{}, body...), []byte(secret)...)),
		plainHashHexSHA512(append(append([]byte{}, []byte(secret)...), body...)),
		plainHashHexSHA256(append(append([]byte{}, body...), []byte(secret)...)),
		plainHashHexSHA256(append(append([]byte{}, []byte(secret)...), body...)),
	}
	for _, candidate := range candidates {
		if hmac.Equal([]byte(candidate), []byte(normalized)) {
			return true
		}
	}
	return false
}

func normalizeWebhookSignature(signature string) string {
	s := strings.TrimSpace(strings.ToLower(signature))
	s = strings.TrimPrefix(s, "sha256=")
	s = strings.TrimPrefix(s, "sha512=")
	s = strings.TrimPrefix(s, "hmac-sha256=")
	s = strings.TrimPrefix(s, "hmac-sha512=")
	return s
}

func hmacHex(hashFn func() hash.Hash, key []byte, body []byte) string {
	h := hmac.New(hashFn, key)
	h.Write(body)
	return hex.EncodeToString(h.Sum(nil))
}

func plainHashHexSHA512(body []byte) string {
	sum := sha512.Sum512(body)
	return hex.EncodeToString(sum[:])
}

func plainHashHexSHA256(body []byte) string {
	sum := sha256.Sum256(body)
	return hex.EncodeToString(sum[:])
}

func NormalizeRazorpayEvent(payload []byte, fallbackEventID string) (InternalPaymentEvent, error) {
	var event struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					ID       string `json:"id"`
					OrderID  string `json:"order_id"`
					Amount   int64  `json:"amount"`
					Currency string `json:"currency"`
					Status   string `json:"status"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}
	if err := json.Unmarshal(payload, &event); err != nil {
		return InternalPaymentEvent{}, err
	}

	status := strings.ToLower(strings.TrimSpace(event.Payload.Payment.Entity.Status))
	switch strings.ToLower(strings.TrimSpace(event.Event)) {
	case "payment.captured", "order.paid":
		status = "paid"
	case "payment.failed":
		status = "failed"
	case "payment.refunded":
		status = "refunded"
	}
	if status == "" {
		status = "unknown"
	}

	providerEventID := strings.TrimSpace(fallbackEventID)
	if providerEventID == "" {
		sum := sha256.Sum256(payload)
		providerEventID = "razorpay-body-" + hex.EncodeToString(sum[:])
	}

	return InternalPaymentEvent{
		Provider:         "razorpay",
		ProviderEventID:  providerEventID,
		OrderID:          strings.TrimSpace(event.Payload.Payment.Entity.OrderID),
		Status:           status,
		Amount:           event.Payload.Payment.Entity.Amount,
		Currency:         strings.TrimSpace(event.Payload.Payment.Entity.Currency),
		GatewayPaymentID: strings.TrimSpace(event.Payload.Payment.Entity.ID),
		EventType:        strings.TrimSpace(event.Event),
		Raw:              json.RawMessage(append([]byte(nil), payload...)),
	}, nil
}

func NormalizePayUEvent(payload []byte, headers map[string]string) (InternalPaymentEvent, error) {
	getHeader := func(keys ...string) string {
		for _, k := range keys {
			if v := strings.TrimSpace(headers[strings.ToLower(strings.TrimSpace(k))]); v != "" {
				return v
			}
		}
		return ""
	}

	type payUNested struct {
		Event          string      `json:"event"`
		Status         string      `json:"status"`
		TxnID          string      `json:"txnid"`
		MihPayID       string      `json:"mihpayid"`
		Amount         interface{} `json:"amount"`
		Currency       string      `json:"currency"`
		OrderID        string      `json:"order_id"`
		MerchantTxnID  string      `json:"merchantTransactionId"`
		PaymentID      string      `json:"payment_id"`
		PaymentIDAlt   string      `json:"paymentId"`
		TxnStatus      string      `json:"transaction_status"`
		Data           struct {
			TxnID         string      `json:"txnid"`
			MihPayID      string      `json:"mihpayid"`
			Amount        interface{} `json:"amount"`
			Status        string      `json:"status"`
			OrderID       string      `json:"order_id"`
			MerchantTxnID string      `json:"merchantTransactionId"`
			PaymentID     string      `json:"payment_id"`
			PaymentIDAlt  string      `json:"paymentId"`
			Currency      string      `json:"currency"`
		} `json:"data"`
	}

	var parsed payUNested
	if err := json.Unmarshal(payload, &parsed); err == nil {
		orderID := firstNonEmptyTrimmed(parsed.TxnID, parsed.Data.TxnID, parsed.OrderID, parsed.Data.OrderID, parsed.MerchantTxnID, parsed.Data.MerchantTxnID)
		statusRaw := firstNonEmptyTrimmed(parsed.Status, parsed.Data.Status, parsed.TxnStatus, parsed.Event)
		status := normalizePayUStatus(statusRaw)
		gatewayPaymentID := firstNonEmptyTrimmed(parsed.MihPayID, parsed.Data.MihPayID, parsed.PaymentID, parsed.Data.PaymentID, parsed.PaymentIDAlt, parsed.Data.PaymentIDAlt)
		eventType := firstNonEmptyTrimmed(parsed.Event, statusRaw)
		currency := firstNonEmptyTrimmed(parsed.Currency, parsed.Data.Currency)
		amount := parseGatewayAmount(firstNonEmptyInterface(parsed.Amount, parsed.Data.Amount))
		providerEventID := firstNonEmptyTrimmed(
			getHeader("x-payu-event-id", "x-event-id", "event-id"),
			composePayUEventID(gatewayPaymentID, orderID, status),
		)
		if providerEventID == "" {
			sum := sha256.Sum256(payload)
			providerEventID = "payu-body-" + hex.EncodeToString(sum[:])
		}
		return InternalPaymentEvent{
			Provider:         "payu",
			ProviderEventID:  providerEventID,
			OrderID:          orderID,
			Status:           status,
			Amount:           amount,
			Currency:         currency,
			GatewayPaymentID: gatewayPaymentID,
			EventType:        eventType,
			Raw:              json.RawMessage(append([]byte(nil), payload...)),
		}, nil
	}

	values, err := url.ParseQuery(string(payload))
	if err != nil {
		return InternalPaymentEvent{}, err
	}
	orderID := strings.TrimSpace(values.Get("txnid"))
	status := normalizePayUStatus(values.Get("status"))
	gatewayPaymentID := firstNonEmptyTrimmed(values.Get("mihpayid"), values.Get("payuMoneyId"))
	eventType := strings.TrimSpace(values.Get("event"))
	amount := parseGatewayAmount(values.Get("amount"))
	providerEventID := firstNonEmptyTrimmed(
		getHeader("x-payu-event-id", "x-event-id", "event-id"),
		composePayUEventID(gatewayPaymentID, orderID, status),
	)
	if providerEventID == "" {
		sum := sha256.Sum256(payload)
		providerEventID = "payu-body-" + hex.EncodeToString(sum[:])
	}
	return InternalPaymentEvent{
		Provider:         "payu",
		ProviderEventID:  providerEventID,
		OrderID:          orderID,
		Status:           status,
		Amount:           amount,
		Currency:         strings.TrimSpace(values.Get("currency")),
		GatewayPaymentID: gatewayPaymentID,
		EventType:        eventType,
		Raw:              json.RawMessage(append([]byte(nil), payload...)),
	}, nil
}

func firstNonEmptyTrimmed(values ...string) string {
	for _, v := range values {
		if t := strings.TrimSpace(v); t != "" {
			return t
		}
	}
	return ""
}

func firstNonEmptyInterface(values ...interface{}) interface{} {
	for _, v := range values {
		switch x := v.(type) {
		case nil:
			continue
		case string:
			if strings.TrimSpace(x) == "" {
				continue
			}
			return x
		default:
			return v
		}
	}
	return nil
}

func composePayUEventID(gatewayPaymentID, orderID, status string) string {
	key := firstNonEmptyTrimmed(gatewayPaymentID, orderID)
	if key == "" {
		return ""
	}
	if strings.TrimSpace(status) == "" {
		return "payu-" + key
	}
	return "payu-" + key + ":" + strings.ToLower(strings.TrimSpace(status))
}

func normalizePayUStatus(status string) string {
	s := strings.ToLower(strings.TrimSpace(status))
	switch s {
	case "success", "captured", "payment_success", "order.paid":
		return "paid"
	case "failed", "failure", "payment_failed":
		return "failed"
	case "refunded", "refund_success":
		return "refunded"
	case "":
		return "unknown"
	default:
		return s
	}
}

func parseGatewayAmount(v interface{}) int64 {
	switch x := v.(type) {
	case nil:
		return 0
	case int64:
		return x
	case int32:
		return int64(x)
	case int:
		return int64(x)
	case float64:
		return int64(x)
	case json.Number:
		if i, err := x.Int64(); err == nil {
			return i
		}
		if f, err := x.Float64(); err == nil {
			return int64(f)
		}
	case string:
		s := strings.TrimSpace(x)
		if s == "" {
			return 0
		}
		if i, err := strconv.ParseInt(s, 10, 64); err == nil {
			return i
		}
		if f, err := strconv.ParseFloat(s, 64); err == nil {
			return int64(f)
		}
	}
	return 0
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

	apiKey := s.decryptSecret(cfg.ApiKey.String)
	apiSecret := s.decryptSecret(cfg.ApiSecret.String)

	switch cfg.Provider {
	case "razorpay":
		return &RazorpayProvider{
			KeyID:     apiKey,
			KeySecret: apiSecret,
		}, nil
	case "payu":
		return &PayUProvider{
			Key:  apiKey,
			Salt: apiSecret,
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

func (s *Service) ProcessPaymentWebhook(ctx context.Context, tenantID, eventID string, body []byte, signature string, secret string, headers map[string]string) (err error) {
	tUUID := toPgUUID(tenantID)
	
	// Pre-normalize headers for identification
	normalizedHeaders := map[string]string{}
	for k, v := range headers {
		normalizedHeaders[strings.ToLower(strings.TrimSpace(k))] = strings.TrimSpace(v)
	}

	providerType := "unknown"
	if _, exists := normalizedHeaders["x-razorpay-signature"]; exists {
		providerType = "razorpay"
	} else if _, exists := normalizedHeaders["x-payu-signature"]; exists {
		providerType = "payu"
	}

	// 0. Log incoming webhook for auditability
	logEntry, logErr := s.q.CreateWebhookLog(ctx, db.CreateWebhookLogParams{
		TenantID: tUUID,
		Provider: providerType,
		EventID:  eventID,
		Payload:  body,
	})

	// Use defer to update the status of the log entry at the end
	defer func() {
		if logErr == nil {
			status := "completed"
			errMsg := ""
			if err != nil {
				status = "failed"
				errMsg = err.Error()
			}
			_, _ = s.q.UpdateWebhookLogStatus(ctx, db.UpdateWebhookLogStatusParams{
				ID:           logEntry.ID,
				TenantID:     tUUID,
				Status:       status,
				ErrorMessage: pgtype.Text{String: errMsg, Valid: errMsg != ""},
				ProcessedAt:  pgtype.Timestamptz{Time: time.Now(), Valid: true},
			})
		}
	}()

	provider, err := s.getTenantPaymentProvider(ctx, tenantID)
	if err != nil {
		return err
	}

	// 1. Verify Signature
	if _, ok := provider.(*RazorpayProvider); ok {
		cfg, err := s.q.GetActiveGatewayConfig(ctx, db.GetActiveGatewayConfigParams{
			TenantID: tUUID,
			Provider: "razorpay",
		})
		if err == nil && cfg.WebhookSecret.Valid {
			secret = cfg.WebhookSecret.String
		}
	}
	if payu, ok := provider.(*PayUProvider); ok && strings.TrimSpace(secret) == "" {
		secret = strings.TrimSpace(payu.Salt)
	}

	if !provider.VerifyWebhookSignature(body, signature, secret) {
		return fmt.Errorf("invalid webhook signature")
	}

	// 2. Normalize Event
	if eventID != "" && normalizedHeaders["x-event-id"] == "" {
		normalizedHeaders["x-event-id"] = strings.TrimSpace(eventID)
	}
	if eventID != "" && normalizedHeaders["x-payu-event-id"] == "" {
		normalizedHeaders["x-payu-event-id"] = strings.TrimSpace(eventID)
	}
	if eventID != "" && normalizedHeaders["x-razorpay-event-id"] == "" {
		normalizedHeaders["x-razorpay-event-id"] = strings.TrimSpace(eventID)
	}

	var normalizedEvent InternalPaymentEvent
	switch provider.(type) {
	case *PayUProvider:
		normalizedEvent, err = NormalizePayUEvent(body, normalizedHeaders)
	default:
		normalizedEvent, err = NormalizeRazorpayEvent(body, eventID)
	}
	if err != nil {
		return err
	}
	if strings.TrimSpace(normalizedEvent.ProviderEventID) == "" {
		return fmt.Errorf("missing provider event id in webhook")
	}

	// 3. Check Idempotency (Event Level)
	processed, err := s.q.CheckPaymentEventProcessed(ctx, db.CheckPaymentEventProcessedParams{
		TenantID:       tUUID,
		GatewayEventID: normalizedEvent.ProviderEventID,
	})
	if err != nil {
		return err
	}
	if processed {
		return nil // Already processed
	}

	// 4. Handle Paid Event
	if normalizedEvent.Status == "paid" {
		// Log the event for idempotency
		_, err = s.q.LogPaymentEvent(ctx, db.LogPaymentEventParams{
			TenantID:       tUUID,
			GatewayEventID: normalizedEvent.ProviderEventID,
			EventType:      firstNonEmptyTrimmed(normalizedEvent.EventType, normalizedEvent.Status),
		})
		if err != nil {
			return err
		}

		orderUUID, err := resolveInternalOrderID(normalizedEvent.OrderID)
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

		// Issue auto receipt when DB transaction support is available.
		if s.db != nil {
			_, err = s.IssueReceipt(ctx, IssueReceiptParams{
				TenantID:       tenantID,
				StudentID:      studentID,
				Amount:         order.Amount,
				Mode:           "online",
				TransactionRef: firstNonEmptyTrimmed(normalizedEvent.GatewayPaymentID, normalizedEvent.ProviderEventID),
				UserID:         "00000000-0000-0000-0000-000000000000", // System
				IP:             "127.0.0.1",
			})
			if err != nil {
				// We don't want to fail processing if it's already issued (idempotency check in IssueReceipt)
				if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "already exists") {
					// Likely already issued by another concurrent process or retry
					fmt.Printf("Receipt already issued for trans: %s\n", normalizedEvent.GatewayPaymentID)
				} else {
					return fmt.Errorf("failed to issue auto-receipt: %w", err)
				}
			}
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
		payload := body
		if len(normalizedEvent.Raw) > 0 {
			payload = normalizedEvent.Raw
		}
		_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
			TenantID:  tUUID,
			EventType: "fee.paid",
			Payload:   payload,
		})
	}

	return nil
}

func (s *Service) decryptSecret(val string) string {
	if !strings.HasPrefix(val, "enc:") {
		return val
	}
	if s.crypto == nil {
		return val
	}
	raw, err := hex.DecodeString(strings.TrimPrefix(val, "enc:"))
	if err != nil {
		return val
	}
	dec, err := s.crypto.Decrypt(raw)
	if err != nil {
		return val
	}
	return string(dec)
}
