package notification

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// SmsHorizonAdapter implements the Adapter interface for SmsHorizon (Indian provider)
type SmsHorizonAdapter struct {
	user     string
	apiKey   string
	senderID string
	http     *http.Client
}

func NewSmsHorizonAdapter(user, apiKey, senderID string) *SmsHorizonAdapter {
	if senderID == "" {
		senderID = "SCHERP"
	}
	return &SmsHorizonAdapter{
		user:     strings.TrimSpace(user),
		apiKey:   strings.TrimSpace(apiKey),
		senderID: strings.TrimSpace(senderID),
		http: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *SmsHorizonAdapter) SendSMS(ctx context.Context, to string, body string) error {
	if s.user == "" || s.apiKey == "" {
		return fmt.Errorf("smshorizon credentials missing")
	}

	// Clean phone number (remove +91 or leading zeros)
	to = strings.TrimPrefix(to, "+91")
	to = strings.TrimPrefix(to, "0")
	to = strings.TrimSpace(to)

	params := url.Values{}
	params.Add("user", s.user)
	params.Add("apikey", s.apiKey)
	params.Add("mobile", to)
	params.Add("message", body)
	params.Add("senderid", s.senderID)
	params.Add("type", "txt")

	apiURL := "https://smshorizon.co.in/api/sendsms.php?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return err
	}

	resp, err := s.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("smshorizon api failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	// Usually returns a numeric ID if successful
	return nil
}

func (s *SmsHorizonAdapter) SendWhatsApp(ctx context.Context, to string, body string) error {
	// SmsHorizon also provides WhatsApp via a different endpoint, 
	// but for now, we'll remain stubbed or use a generic interface.
	return fmt.Errorf("whatsapp not implemented for smshorizon adapter")
}

func (s *SmsHorizonAdapter) SendPush(ctx context.Context, playerID string, title, body string) error {
	return fmt.Errorf("push not implemented for smshorizon adapter")
}
