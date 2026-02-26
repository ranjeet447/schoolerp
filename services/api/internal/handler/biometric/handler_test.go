package biometric

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	mw "github.com/schoolerp/api/internal/middleware"
	bioservice "github.com/schoolerp/api/internal/service/biometric"
)

type stubBiometricService struct {
	ingestFn func(ctx context.Context, tenantID string, entry bioservice.LogEntry) (string, error)
}

func (s *stubBiometricService) IngestLog(ctx context.Context, tenantID string, entry bioservice.LogEntry) (string, error) {
	if s.ingestFn != nil {
		return s.ingestFn(ctx, tenantID, entry)
	}
	return "log-1", nil
}

func (s *stubBiometricService) ListDevices(ctx context.Context, tenantID string) ([]bioservice.DeviceStatus, error) {
	return []bioservice.DeviceStatus{}, nil
}

func (s *stubBiometricService) ListRecentLogs(ctx context.Context, tenantID string) ([]bioservice.LogRow, error) {
	return []bioservice.LogRow{}, nil
}

func TestIngestLog_BadJSON(t *testing.T) {
	h := &Handler{svc: &stubBiometricService{}}
	req := httptest.NewRequest(http.MethodPost, "/biometric/ingest", strings.NewReader("{"))
	req = req.WithContext(context.WithValue(req.Context(), mw.TenantIDKey, "tenant-1"))
	rr := httptest.NewRecorder()

	h.IngestLog(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestIngestLog_UsesTenantContext(t *testing.T) {
	var gotTenant string
	var gotEntry bioservice.LogEntry
	h := &Handler{svc: &stubBiometricService{
		ingestFn: func(ctx context.Context, tenantID string, entry bioservice.LogEntry) (string, error) {
			gotTenant = tenantID
			gotEntry = entry
			return "bio-log-123", nil
		},
	}}

	body := `{"device_id":"d1","identifier":"rfid-1","direction":"in","timestamp":"2026-02-26T10:00:00Z"}`
	req := httptest.NewRequest(http.MethodPost, "/biometric/ingest", strings.NewReader(body))
	req = req.WithContext(context.WithValue(req.Context(), mw.TenantIDKey, "tenant-abc"))
	rr := httptest.NewRecorder()

	h.IngestLog(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%q", rr.Code, rr.Body.String())
	}
	if gotTenant != "tenant-abc" {
		t.Fatalf("expected tenant-abc, got %q", gotTenant)
	}
	if gotEntry.DeviceID != "d1" || gotEntry.Identifier != "rfid-1" || gotEntry.Direction != "in" {
		t.Fatalf("unexpected entry: %#v", gotEntry)
	}
	if !gotEntry.Timestamp.Equal(time.Date(2026, 2, 26, 10, 0, 0, 0, time.UTC)) {
		t.Fatalf("unexpected timestamp: %v", gotEntry.Timestamp)
	}
	var payload map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["id"] != "bio-log-123" || payload["status"] != "processed" {
		t.Fatalf("unexpected response payload: %#v", payload)
	}
}
