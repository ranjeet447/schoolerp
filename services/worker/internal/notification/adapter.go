package notification

import (
	"context"
	"log"
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
