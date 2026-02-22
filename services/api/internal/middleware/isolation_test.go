package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTenantIsolation(t *testing.T) {
	// Mock handler that checks for isolated tenant ID
	handler := TenantResolver(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tenantID := GetTenantID(r.Context())
		w.Header().Set("X-Result-Tenant-ID", tenantID)
		w.WriteHeader(http.StatusOK)
	}))

	t.Run("Tenant_A_Isolation", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("X-Tenant-ID", "tenant-a-uuid")
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if got := rr.Header().Get("X-Result-Tenant-ID"); got != "tenant-a-uuid" {
			t.Errorf("isolated context leaked or failed: expected tenant-a-uuid, got %q", got)
		}
	})

	t.Run("Tenant_B_Isolation", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("X-Tenant-ID", "tenant-b-uuid")
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if got := rr.Header().Get("X-Result-Tenant-ID"); got != "tenant-b-uuid" {
			t.Errorf("isolated context leaked or failed: expected tenant-b-uuid, got %q", got)
		}
	})

	t.Run("No_Tenant_Isolation", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
		rr := httptest.NewRecorder()

		handler.ServeHTTP(rr, req)

		if got := rr.Header().Get("X-Result-Tenant-ID"); got != "" {
			t.Errorf("bypass paths should have empty tenant ID, got %q", got)
		}
	})
}

func TestContextSafety(t *testing.T) {
	// Ensure context values aren't accidentally shared across requests
	ctxA := context.WithValue(context.Background(), TenantIDKey, "A")
	ctxB := context.WithValue(context.Background(), TenantIDKey, "B")

	if GetTenantID(ctxA) != "A" || GetTenantID(ctxB) != "B" {
		t.Error("Context value retrieval failed")
	}
}
