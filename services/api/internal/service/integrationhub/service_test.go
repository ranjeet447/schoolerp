package integrationhub

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/schoolerp/api/internal/foundation/security"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestNormalizeProvider(t *testing.T) {
	cases := map[string]string{
		"google":             "google_workspace",
		" google_workspace ": "google_workspace",
		"microsoft":          "microsoft_365",
		"office365":          "microsoft_365",
		"unknown":            "",
		"":                   "",
	}
	for in, want := range cases {
		if got := normalizeProvider(in); got != want {
			t.Fatalf("normalizeProvider(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestGenerateMeetingURL(t *testing.T) {
	g := generateMeetingURL("google_workspace")
	if !strings.HasPrefix(g, "https://meet.google.com/") {
		t.Fatalf("expected google meet URL, got %q", g)
	}
	m := generateMeetingURL("microsoft_365")
	if !strings.HasPrefix(m, "https://teams.microsoft.com/l/meetup-join/") {
		t.Fatalf("expected teams URL, got %q", m)
	}
	if got := generateMeetingURL("unsupported"); got != "" {
		t.Fatalf("expected empty URL for unsupported provider, got %q", got)
	}
}

func TestEncryptDecryptMaybe(t *testing.T) {
	key := []byte("01234567890123456789012345678901")
	crypto, err := security.NewCrypto(key)
	if err != nil {
		t.Fatalf("NewCrypto failed: %v", err)
	}
	svc := &Service{crypto: crypto}
	plain := "refresh_token_secret"
	enc := svc.encryptMaybe(plain)
	if !strings.HasPrefix(enc, "enc:") {
		t.Fatalf("expected encrypted token with enc: prefix, got %q", enc)
	}
	if enc == plain {
		t.Fatalf("expected encrypted value to differ from plaintext")
	}
	dec := svc.decryptMaybe(enc)
	if dec != plain {
		t.Fatalf("decryptMaybe returned %q, want %q", dec, plain)
	}
}

func TestCreditMapAndHelpers(t *testing.T) {
	got := creditMap(map[string]interface{}{
		"sms_credits":      float64(2000),
		"whatsapp_credits": int64(500),
		"skip":             "bad",
	})
	if got["sms_credits"] != 2000 || got["whatsapp_credits"] != 500 {
		t.Fatalf("unexpected creditMap output: %#v", got)
	}
	if _, ok := got["skip"]; ok {
		t.Fatalf("creditMap should ignore non-numeric values: %#v", got)
	}
}

func TestErrorAsPg(t *testing.T) {
	pgErr := &pgconn.PgError{Code: "23505", Message: "duplicate key value violates unique constraint"}
	wrapped := fmt.Errorf("insert failed: %w", pgErr)
	var target *pgconn.PgError
	if !errorAsPg(wrapped, &target) {
		t.Fatalf("expected errorAsPg to detect wrapped PgError")
	}
	if target == nil || target.Code != "23505" {
		t.Fatalf("unexpected target: %#v", target)
	}
	if errorAsPg(errors.New("plain error"), &target) {
		t.Fatalf("did not expect plain error to match PgError")
	}
}

func TestPublicOAuthCallbackURLAndDefaultAPIBaseURL(t *testing.T) {
	t.Setenv("PUBLIC_API_BASE_URL", "https://api.schoolerp.example")
	if got := defaultAPIBaseURL(); got != "https://api.schoolerp.example" {
		t.Fatalf("defaultAPIBaseURL() = %q", got)
	}
	svc := &Service{}
	if got := svc.publicOAuthCallbackURL("https://api.schoolerp.example", "google"); got != "https://api.schoolerp.example/v1/integrations/oauth/google_workspace/callback" {
		t.Fatalf("unexpected callback url: %q", got)
	}
}

func TestBuildAuthURLGoogle(t *testing.T) {
	svc := &Service{}
	cfg := providerRuntimeConfig{
		Provider:     "google_workspace",
		ClientID:     "gid",
		ClientSecret: "gsecret",
		Scopes:       []string{"scope1", "scope2"},
		AuthURL:      "https://accounts.google.com/o/oauth2/v2/auth",
	}
	raw := svc.buildAuthURL(cfg, "state123", "https://api.example/v1/integrations/oauth/google_workspace/callback")
	u, err := url.Parse(raw)
	if err != nil {
		t.Fatalf("Parse auth url: %v", err)
	}
	q := u.Query()
	if q.Get("client_id") != "gid" || q.Get("state") != "state123" {
		t.Fatalf("unexpected query: %v", q)
	}
	if q.Get("redirect_uri") == "" || q.Get("scope") != "scope1 scope2" {
		t.Fatalf("missing redirect/scope: %v", q)
	}
}

func TestProviderConfigConfigured(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "gid")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "gsecret")
	svc := &Service{}
	cfg := svc.providerConfig("google_workspace")
	if !cfg.configured() {
		t.Fatalf("expected google provider config to be configured")
	}
	if cfg.TokenURL == "" || cfg.AuthURL == "" {
		t.Fatalf("expected google token/auth URLs to be set")
	}
}

func TestExchangeOAuthCodeGoogleAndProfile(t *testing.T) {
	t.Setenv("GOOGLE_OAUTH_CLIENT_ID", "gid")
	t.Setenv("GOOGLE_OAUTH_CLIENT_SECRET", "gsecret")
	svc := &Service{
		http: &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
			switch {
			case strings.Contains(r.URL.Host, "oauth2.googleapis.com"):
				body := `{"access_token":"ga","refresh_token":"gr","token_type":"Bearer","expires_in":3600,"scope":"s1 s2"}`
				return &http.Response{StatusCode: 200, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(body))}, nil
			case strings.Contains(r.URL.Host, "www.googleapis.com"):
				if got := r.Header.Get("Authorization"); got != "Bearer ga" {
					t.Fatalf("unexpected auth header: %q", got)
				}
				body := `{"email":"admin@school.edu","name":"School Admin"}`
				return &http.Response{StatusCode: 200, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(body))}, nil
			default:
				t.Fatalf("unexpected request URL: %s", r.URL.String())
				return nil, nil
			}
		})},
		now: func() time.Time { return time.Date(2026, 2, 25, 10, 0, 0, 0, time.UTC) },
	}
	res, err := svc.exchangeOAuthCode(context.Background(), "google_workspace", "authcode", "https://api.example/v1/integrations/oauth/google_workspace/callback")
	if err != nil {
		t.Fatalf("exchangeOAuthCode failed: %v", err)
	}
	if res.AccessToken != "ga" || res.RefreshToken != "gr" {
		t.Fatalf("unexpected tokens: %#v", res)
	}
	if res.AccountEmail != "admin@school.edu" || res.AccountName != "School Admin" {
		t.Fatalf("unexpected profile: %#v", res)
	}
}

func TestCreateProviderMeetingPayloads(t *testing.T) {
	tests := []struct {
		name         string
		provider     string
		wantHost     string
		wantPathPart string
		responseBody string
		assertBody   func(*testing.T, string)
	}{
		{
			name:         "google",
			provider:     "google_workspace",
			wantHost:     "www.googleapis.com",
			wantPathPart: "/calendar/v3/calendars/primary/events",
			responseBody: `{"id":"evt_google_1","hangoutLink":"https://meet.google.com/abc-defg-hij"}`,
			assertBody: func(t *testing.T, body string) {
				if !strings.Contains(body, `"conferenceData"`) || !strings.Contains(body, `"hangoutsMeet"`) {
					t.Fatalf("google payload missing meet fields: %s", body)
				}
			},
		},
		{
			name:         "microsoft",
			provider:     "microsoft_365",
			wantHost:     "graph.microsoft.com",
			wantPathPart: "/v1.0/me/events",
			responseBody: `{"id":"evt_ms_1","onlineMeeting":{"joinUrl":"https://teams.microsoft.com/l/meetup-join/mock"}}`,
			assertBody: func(t *testing.T, body string) {
				if !strings.Contains(body, `"isOnlineMeeting":true`) || !strings.Contains(body, `"teamsForBusiness"`) {
					t.Fatalf("microsoft payload missing online meeting fields: %s", body)
				}
			},
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			seen := false
			svc := &Service{
				http: &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
					seen = true
					if r.URL.Host != tc.wantHost || !strings.Contains(r.URL.Path, tc.wantPathPart) {
						t.Fatalf("unexpected provider request URL: %s", r.URL.String())
					}
					raw, _ := io.ReadAll(r.Body)
					tc.assertBody(t, string(raw))
					return &http.Response{StatusCode: 200, Header: make(http.Header), Body: io.NopCloser(strings.NewReader(tc.responseBody))}, nil
				})},
			}
			url, eventID, meta, err := svc.createProviderMeeting(context.Background(), tc.provider, "access_token", LiveClassScheduleParams{
				Title:       "Math",
				Description: "Description",
				StartsAt:    time.Date(2026, 2, 25, 12, 0, 0, 0, time.UTC),
				EndsAt:      time.Date(2026, 2, 25, 12, 30, 0, 0, time.UTC),
			})
			if err != nil {
				t.Fatalf("createProviderMeeting failed: %v", err)
			}
			if !seen || url == "" || eventID == "" || meta["created_via"] == nil {
				t.Fatalf("unexpected meeting result: url=%q eventID=%q meta=%v", url, eventID, meta)
			}
		})
	}
}
