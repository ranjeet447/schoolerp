package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/worker/internal/db"
)

type Adapter interface {
	SendSMS(ctx context.Context, to string, body string) error
	SendWhatsApp(ctx context.Context, to string, body string) error
	SendPush(ctx context.Context, playerID string, title, body string) error
}

// TenantAwareAdapter is an extension for multi-tenant environments
type TenantAwareAdapter interface {
	Adapter
	WithTenant(tenantID string) Adapter
}

type MultiTenantAdapter struct {
	q        db.Querier
	fallback Adapter
}

func NewMultiTenantAdapter(q db.Querier, fallback Adapter) *MultiTenantAdapter {
	return &MultiTenantAdapter{q: q, fallback: fallback}
}

func (m *MultiTenantAdapter) WithTenant(tenantID string) Adapter {
	return &tenantSpecificAdapter{
		tenantID: tenantID,
		parent:   m,
	}
}

// Default implementation (no tenant context) - uses fallback
func (m *MultiTenantAdapter) SendSMS(ctx context.Context, to string, body string) error {
	return m.fallback.SendSMS(ctx, to, body)
}

func (m *MultiTenantAdapter) SendWhatsApp(ctx context.Context, to string, body string) error {
	return m.fallback.SendWhatsApp(ctx, to, body)
}

func (m *MultiTenantAdapter) SendPush(ctx context.Context, playerID string, title, body string) error {
	return m.fallback.SendPush(ctx, playerID, title, body)
}

type tenantSpecificAdapter struct {
	tenantID string
	parent   *MultiTenantAdapter
}

func (t *tenantSpecificAdapter) resolve(ctx context.Context) Adapter {
	var tUUID pgtype.UUID
	tUUID.Scan(t.tenantID)

	cfg, err := t.parent.q.GetTenantActiveNotificationGateway(ctx, tUUID)
	if err != nil {
		return t.parent.fallback
	}

	switch cfg.Provider {
	case "smshorizon":
		return NewSmsHorizonAdapter(cfg.ApiKey.String, cfg.ApiSecret.String, cfg.SenderID.String)
	case "msg91":
		var rate float64
		var waRate float64
		if cfg.Settings != nil {
			var s struct {
				Rate   float64 `json:"rate_per_sms"`
				WaRate float64 `json:"whatsapp_rate"`
			}
			_ = json.Unmarshal(cfg.Settings, &s)
			rate = s.Rate
			waRate = s.WaRate
		}
		return NewMsg91Adapter(t.parent.q, t.tenantID, cfg.ApiKey.String, cfg.SenderID.String, rate, waRate)
	// Add more providers here
	default:
		return t.parent.fallback
	}
}

func (t *tenantSpecificAdapter) SendSMS(ctx context.Context, to string, body string) error {
	return t.resolve(ctx).SendSMS(ctx, to, body)
}

func (t *tenantSpecificAdapter) SendWhatsApp(ctx context.Context, to string, body string) error {
	return t.resolve(ctx).SendWhatsApp(ctx, to, body)
}

func (t *tenantSpecificAdapter) SendPush(ctx context.Context, playerID string, title, body string) error {
	// Push is usually not per-tenant-gateway, might be global OneSignal/Firebase
	return t.parent.fallback.SendPush(ctx, playerID, title, body)
}


type StubAdapter struct{}

func (s *StubAdapter) SendSMS(ctx context.Context, to string, body string) error {
	log.Printf("[Notification] [SMS] To: %s, Body: %s", to, body)
	return nil
}

func (s *StubAdapter) SendWhatsApp(ctx context.Context, to string, body string) error {
	log.Printf("[Notification] [WhatsApp] To: %s, Body: %s", to, body)
	return nil
}

func (s *StubAdapter) SendPush(ctx context.Context, playerID string, title, body string) error {
	log.Printf("[Notification] [Push] To: %s, Title: %s, Body: %s", playerID, title, body)
	return nil
}

type WebhookAdapter struct {
	url        string
	bearerToken string
	http       *http.Client
}

func NewWebhookAdapter(url, bearerToken string) *WebhookAdapter {
	return &WebhookAdapter{
		url:         strings.TrimSpace(url),
		bearerToken: strings.TrimSpace(bearerToken),
		http: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (w *WebhookAdapter) SendSMS(ctx context.Context, to string, body string) error {
	return w.send(ctx, map[string]interface{}{
		"channel": "sms",
		"to":      to,
		"body":    body,
	})
}

func (w *WebhookAdapter) SendWhatsApp(ctx context.Context, to string, body string) error {
	return w.send(ctx, map[string]interface{}{
		"channel": "whatsapp",
		"to":      to,
		"body":    body,
	})
}

func (w *WebhookAdapter) SendPush(ctx context.Context, playerID string, title, body string) error {
	return w.send(ctx, map[string]interface{}{
		"channel": "push",
		"to":      playerID,
		"title":   title,
		"body":    body,
	})
}

func (w *WebhookAdapter) send(ctx context.Context, payload map[string]interface{}) error {
	if strings.TrimSpace(w.url) == "" {
		return fmt.Errorf("notification webhook url is empty")
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, w.url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if w.bearerToken != "" {
		req.Header.Set("Authorization", "Bearer "+w.bearerToken)
	}

	resp, err := w.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("notification webhook failed with status %d", resp.StatusCode)
	}

	return nil
}
