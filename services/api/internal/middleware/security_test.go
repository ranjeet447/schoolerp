package middleware

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
)

func resetCORSStateForTest() {
	corsConfigOnce = sync.Once{}
	corsAllowedOrigins = nil
	corsWildcardOrigins = nil
}

func TestIsOriginAllowed_ExactOriginNormalized(t *testing.T) {
	t.Setenv("ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://schoolerp-web.vercel.app/")
	resetCORSStateForTest()

	if !isOriginAllowed("https://schoolerp-web.vercel.app") {
		t.Fatalf("expected exact origin to be allowed after normalization")
	}
}

func TestIsOriginAllowed_WildcardOrigin(t *testing.T) {
	t.Setenv("ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://*.vercel.app")
	resetCORSStateForTest()

	if !isOriginAllowed("https://schoolerp-web.vercel.app") {
		t.Fatalf("expected vercel subdomain origin to be allowed by wildcard")
	}

	if isOriginAllowed("https://vercel.app") {
		t.Fatalf("expected wildcard to reject base host")
	}

	if isOriginAllowed("http://schoolerp-web.vercel.app") {
		t.Fatalf("expected wildcard to enforce scheme match")
	}
}

func TestCORSPreflight_AllowedOrigin(t *testing.T) {
	t.Setenv("ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://schoolerp-web.vercel.app")
	resetCORSStateForTest()

	handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodOptions, "/v1/auth/login", nil)
	req.Header.Set("Origin", "https://schoolerp-web.vercel.app")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "content-type")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected preflight 204, got %d", rr.Code)
	}
	if got := rr.Header().Get("Access-Control-Allow-Origin"); got != "https://schoolerp-web.vercel.app" {
		t.Fatalf("unexpected allow-origin header: %q", got)
	}
}

func TestCORSPreflight_DisallowedOrigin(t *testing.T) {
	t.Setenv("ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://schoolerp-web.vercel.app")
	resetCORSStateForTest()

	handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodOptions, "/v1/auth/login", nil)
	req.Header.Set("Origin", "https://evil.example.com")
	req.Header.Set("Access-Control-Request-Method", "POST")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected preflight 403, got %d", rr.Code)
	}
}
