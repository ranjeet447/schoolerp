package service

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
)

type rtFunc func(*http.Request) (*http.Response, error)

func (f rtFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestWorkerEncryptionKeyAndEncryptDecrypt(t *testing.T) {
	t.Setenv("TENANT_ENCRYPTION_KEY", "01234567890123456789012345678901")
	svc := NewBillingService(nil)
	if len(svc.key) != 32 {
		t.Fatalf("expected 32-byte key, got %d", len(svc.key))
	}
	enc := svc.encryptMaybe("refresh_token_secret")
	if enc == "refresh_token_secret" {
		t.Fatalf("expected encrypted value")
	}
	dec := svc.decryptMaybe(enc)
	if dec != "refresh_token_secret" {
		t.Fatalf("decryptMaybe = %q", dec)
	}
}

func TestWorkerProviderOAuthConfig(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "gid")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "gsecret")
	clientID, clientSecret, tokenURL, _ := workerProviderOAuthConfig("google_workspace")
	if clientID != "gid" || clientSecret != "gsecret" {
		t.Fatalf("unexpected google oauth config values")
	}
	if tokenURL == "" {
		t.Fatalf("expected tokenURL")
	}
}

func TestRefreshProviderTokenGoogle(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "gid")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "gsecret")
	svc := &BillingService{
		http: &http.Client{Transport: rtFunc(func(r *http.Request) (*http.Response, error) {
			if r.Method != http.MethodPost || !strings.Contains(r.URL.Host, "oauth2.googleapis.com") {
				t.Fatalf("unexpected request %s %s", r.Method, r.URL.String())
			}
			raw, _ := io.ReadAll(r.Body)
			body := string(raw)
			if !strings.Contains(body, "grant_type=refresh_token") || !strings.Contains(body, "refresh_token=refresh123") {
				t.Fatalf("unexpected form body: %s", body)
			}
			return &http.Response{
				StatusCode: 200,
				Header:     make(http.Header),
				Body:       io.NopCloser(strings.NewReader(`{"access_token":"ga2","refresh_token":"gr2","token_type":"Bearer","expires_in":3600}`)),
			}, nil
		})},
	}
	out, err := svc.refreshProviderToken(context.Background(), "google_workspace", "refresh123")
	if err != nil {
		t.Fatalf("refreshProviderToken failed: %v", err)
	}
	if out.AccessToken != "ga2" || out.RefreshToken != "gr2" || out.TokenType != "Bearer" || out.ExpiresAt == nil {
		t.Fatalf("unexpected token result: %#v", out)
	}
}
