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
)

type Adapter interface {
	SendSMS(ctx context.Context, to string, body string) error
	SendWhatsApp(ctx context.Context, to string, body string) error
	SendPush(ctx context.Context, playerID string, title, body string) error
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
