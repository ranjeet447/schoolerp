package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/worker/internal/db"
)

// Msg91Adapter implements the Adapter interface for MSG91 with per-tenant usage logging
type Msg91Adapter struct {
	q            db.Querier
	tenantID     string
	authKey      string
	senderID     string
	rate         float64
	whatsappRate float64
	http         *http.Client
}

func NewMsg91Adapter(q db.Querier, tenantID, authKey, senderID string, rate, whatsappRate float64) *Msg91Adapter {
	if rate == 0 {
		rate = 0.25 // Default fallback of 25 paise
	}
	if whatsappRate == 0 {
		whatsappRate = 0.80 // Default fallback of 80 paise
	}
	if senderID == "" {
		senderID = "SCHERP"
	}
	return &Msg91Adapter{
		q:            q,
		tenantID:     tenantID,
		authKey:      strings.TrimSpace(authKey),
		senderID:     strings.TrimSpace(senderID),
		rate:         rate,
		whatsappRate: whatsappRate,
		http: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (m *Msg91Adapter) SendSMS(ctx context.Context, to string, body string) error {
	if m.authKey == "" {
		return fmt.Errorf("msg91 auth key missing")
	}

	// Clean phone number
	to = strings.TrimPrefix(to, "+")
	to = strings.TrimSpace(to)

	// Calculate message count (1 per 160 characters approx for plain text)
	msgCount := int32(math.Ceil(float64(len(body)) / 160.0))
	if msgCount < 1 {
		msgCount = 1
	}

	cost := float64(msgCount) * m.rate

	// MSG91 API V5 JSON payload
	payload := map[string]interface{}{
		"sender": m.senderID,
		"route":  "4", // Transactional route
		"country": "91", // Default to India if not in number
		"sms": []map[string]interface{}{
			{
				"message": body,
				"to":      []string{to},
			},
		},
	}
	
	payloadBytes, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.msg91.com/api/v2/sendsms", bytes.NewReader(payloadBytes))
	if err != nil {
		return err
	}
	req.Header.Set("authkey", m.authKey)
	req.Header.Set("Content-Type", "application/json")

	var errMsg string
	var status = "sent"

	resp, err := m.http.Do(req)
	if err != nil {
		status = "failed"
		errMsg = err.Error()
	} else {
		defer resp.Body.Close()
		respBody, _ := io.ReadAll(resp.Body)
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			status = "failed"
			errMsg = fmt.Sprintf("msg91 failed with status %d: %s", resp.StatusCode, string(respBody))
		}
	}

	// Log usage for billing
	var tUUID pgtype.UUID
	tUUID.Scan(m.tenantID)
	
	pgCost := pgtype.Numeric{}
	pgCost.Scan(fmt.Sprintf("%f", cost))

	_, logErr := m.q.LogSmsUsage(ctx, db.LogSmsUsageParams{
		TenantID:       tUUID,
		Provider:       "msg91",
		Recipient:      to,
		MessageContent: pgtype.Text{String: body, Valid: true},
		MessageCount:   msgCount,
		Cost:           pgCost,
		Status:         pgtype.Text{String: status, Valid: true},
		ErrorMessage:   pgtype.Text{String: errMsg, Valid: errMsg != ""},
	})
	
	if logErr != nil {
		log.Printf("[ERR] Failed to log SMS usage for tenant %s: %v", m.tenantID, logErr)
	}

	if status == "failed" {
		return fmt.Errorf("sms sending failed: %s", errMsg)
	}

	return nil
}

func (m *Msg91Adapter) SendWhatsApp(ctx context.Context, to string, body string) error {
	if m.authKey == "" {
		return fmt.Errorf("msg91 auth key missing")
	}

	// Clean phone number
	to = strings.TrimPrefix(to, "+")
	to = strings.TrimSpace(to)

	// WhatsApp cost is generally per conversation, but we'll log it per message.
	cost := 0.80

	payload := map[string]interface{}{
		"integrated-number": m.senderID,
		"content_type":      "text",
		"payload": map[string]interface{}{
			"to":   to,
			"type": "text",
			"text": map[string]string{
				"body": body,
			},
		},
	}

	payloadBytes, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", bytes.NewReader(payloadBytes))
	if err != nil {
		return err
	}
	req.Header.Set("authkey", m.authKey)
	req.Header.Set("Content-Type", "application/json")

	var errMsg string
	var status = "sent"

	resp, err := m.http.Do(req)
	if err != nil {
		status = "failed"
		errMsg = err.Error()
	} else {
		defer resp.Body.Close()
		respBody, _ := io.ReadAll(resp.Body)
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			status = "failed"
			errMsg = fmt.Sprintf("msg91 whatsapp failed %d: %s", resp.StatusCode, string(respBody))
		}
	}

	var tUUID pgtype.UUID
	tUUID.Scan(m.tenantID)
	
	pgCost := pgtype.Numeric{}
	pgCost.Scan(fmt.Sprintf("%f", cost))

	_, logErr := m.q.LogSmsUsage(ctx, db.LogSmsUsageParams{
		TenantID:       tUUID,
		Provider:       "msg91_wa",
		Recipient:      to,
		MessageContent: pgtype.Text{String: body, Valid: true},
		MessageCount:   1,
		Cost:           pgCost,
		Status:         pgtype.Text{String: status, Valid: true},
		ErrorMessage:   pgtype.Text{String: errMsg, Valid: errMsg != ""},
	})
	
	if logErr != nil {
		log.Printf("[ERR] Failed to log WA usage for tenant %s: %v", m.tenantID, logErr)
	}

	if status == "failed" {
		return fmt.Errorf("whatsapp sending failed: %s", errMsg)
	}

	return nil
}

func (m *Msg91Adapter) SendPush(ctx context.Context, playerID string, title, body string) error {
	return fmt.Errorf("push not implemented for msg91 adapter")
}
