package main

import "testing"

func TestWebhookLogRetentionDays(t *testing.T) {
	t.Setenv("WEBHOOK_LOG_RETENTION_DAYS", "")
	if got := webhookLogRetentionDays(); got != 90 {
		t.Fatalf("expected default 90, got %d", got)
	}

	t.Setenv("WEBHOOK_LOG_RETENTION_DAYS", "30")
	if got := webhookLogRetentionDays(); got != 30 {
		t.Fatalf("expected 30, got %d", got)
	}

	t.Setenv("WEBHOOK_LOG_RETENTION_DAYS", "not-a-number")
	if got := webhookLogRetentionDays(); got != 90 {
		t.Fatalf("expected fallback 90, got %d", got)
	}

	t.Setenv("WEBHOOK_LOG_RETENTION_DAYS", "0")
	if got := webhookLogRetentionDays(); got != 0 {
		t.Fatalf("expected 0, got %d", got)
	}
}
