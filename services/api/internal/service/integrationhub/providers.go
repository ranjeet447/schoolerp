package integrationhub

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type providerRuntimeConfig struct {
	Provider     string
	ClientID     string
	ClientSecret string
	RedirectURI  string
	TenantHint   string // microsoft tenant id / "common"
	Scopes       []string
	AuthURL      string
	TokenURL     string
	UserInfoURL  string
}

type oauthTokenResult struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiryAt     *time.Time
	Scopes       []string
	AccountEmail string
	AccountName  string
}

func (s *Service) providerConfig(provider string) providerRuntimeConfig {
	switch normalizeProvider(provider) {
	case "google_workspace":
		return providerRuntimeConfig{
			Provider:     "google_workspace",
			ClientID:     strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_CLIENT_ID")),
			ClientSecret: strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET")),
			RedirectURI:  strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_REDIRECT_URI")),
			Scopes: []string{
				"https://www.googleapis.com/auth/calendar",
				"openid",
				"email",
				"profile",
			},
			AuthURL:     "https://accounts.google.com/o/oauth2/v2/auth",
			TokenURL:    "https://oauth2.googleapis.com/token",
			UserInfoURL: "https://www.googleapis.com/oauth2/v2/userinfo",
		}
	case "microsoft_365":
		tenantHint := strings.TrimSpace(os.Getenv("MICROSOFT_OAUTH_TENANT_ID"))
		if tenantHint == "" {
			tenantHint = "common"
		}
		return providerRuntimeConfig{
			Provider:     "microsoft_365",
			ClientID:     strings.TrimSpace(os.Getenv("MICROSOFT_OAUTH_CLIENT_ID")),
			ClientSecret: strings.TrimSpace(os.Getenv("MICROSOFT_OAUTH_CLIENT_SECRET")),
			RedirectURI:  strings.TrimSpace(os.Getenv("MICROSOFT_OAUTH_REDIRECT_URI")),
			TenantHint:   tenantHint,
			Scopes: []string{
				"offline_access",
				"openid",
				"email",
				"profile",
				"https://graph.microsoft.com/Calendars.ReadWrite",
				"https://graph.microsoft.com/User.Read",
			},
			AuthURL:     "https://login.microsoftonline.com/" + tenantHint + "/oauth2/v2.0/authorize",
			TokenURL:    "https://login.microsoftonline.com/" + tenantHint + "/oauth2/v2.0/token",
			UserInfoURL: "https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName",
		}
	default:
		return providerRuntimeConfig{}
	}
}

func (c providerRuntimeConfig) configured() bool {
	return c.Provider != "" && c.ClientID != "" && c.ClientSecret != ""
}

func (s *Service) useMockOAuth() bool {
	return strings.TrimSpace(os.Getenv("INTEGRATIONS_MOCK_OAUTH")) == "1"
}

func (s *Service) publicOAuthCallbackURL(baseURL, provider string) string {
	return strings.TrimRight(baseURL, "/") + "/v1/integrations/oauth/" + normalizeProvider(provider) + "/callback"
}

func (s *Service) buildAuthURL(cfg providerRuntimeConfig, state, callbackURL string) string {
	q := url.Values{}
	q.Set("client_id", cfg.ClientID)
	q.Set("redirect_uri", callbackURL)
	q.Set("response_type", "code")
	q.Set("state", state)
	q.Set("scope", strings.Join(cfg.Scopes, " "))
	switch cfg.Provider {
	case "google_workspace":
		q.Set("access_type", "offline")
		q.Set("prompt", "consent")
		q.Set("include_granted_scopes", "true")
	case "microsoft_365":
		q.Set("response_mode", "query")
	}
	return cfg.AuthURL + "?" + q.Encode()
}

func (s *Service) exchangeOAuthCode(ctx context.Context, provider, code, callbackURL string) (oauthTokenResult, error) {
	cfg := s.providerConfig(provider)
	if !cfg.configured() {
		return oauthTokenResult{}, fmt.Errorf("provider oauth credentials not configured")
	}
	form := url.Values{}
	form.Set("client_id", cfg.ClientID)
	form.Set("client_secret", cfg.ClientSecret)
	form.Set("grant_type", "authorization_code")
	form.Set("code", code)
	form.Set("redirect_uri", callbackURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.TokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return oauthTokenResult{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.http.Do(req)
	if err != nil {
		return oauthTokenResult{}, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return oauthTokenResult{}, fmt.Errorf("oauth token exchange failed: %s", truncateForErr(string(body)))
	}

	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		TokenType    string `json:"token_type"`
		ExpiresIn    int64  `json:"expires_in"`
		Scope        string `json:"scope"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return oauthTokenResult{}, err
	}
	if strings.TrimSpace(tokenResp.AccessToken) == "" {
		return oauthTokenResult{}, fmt.Errorf("oauth token exchange returned empty access token")
	}
	out := oauthTokenResult{
		AccessToken:  tokenResp.AccessToken,
		RefreshToken: tokenResp.RefreshToken,
		TokenType:    stringOr(tokenResp.TokenType, "Bearer"),
		Scopes:       strings.Fields(tokenResp.Scope),
	}
	if tokenResp.ExpiresIn > 0 {
		t := s.now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second)
		out.ExpiryAt = &t
	}
	if out.Scopes == nil {
		out.Scopes = cfg.Scopes
	}
	email, name := s.fetchUserProfile(ctx, cfg, out.AccessToken)
	out.AccountEmail = email
	out.AccountName = name
	return out, nil
}

func (s *Service) refreshOAuthToken(ctx context.Context, provider, refreshToken string) (oauthTokenResult, error) {
	cfg := s.providerConfig(provider)
	if !cfg.configured() {
		return oauthTokenResult{}, fmt.Errorf("provider oauth credentials not configured")
	}
	form := url.Values{}
	form.Set("client_id", cfg.ClientID)
	form.Set("client_secret", cfg.ClientSecret)
	form.Set("grant_type", "refresh_token")
	form.Set("refresh_token", refreshToken)
	switch cfg.Provider {
	case "microsoft_365":
		form.Set("scope", strings.Join(cfg.Scopes, " "))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.TokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return oauthTokenResult{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.http.Do(req)
	if err != nil {
		return oauthTokenResult{}, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return oauthTokenResult{}, fmt.Errorf("oauth refresh failed: %s", truncateForErr(string(body)))
	}
	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		TokenType    string `json:"token_type"`
		ExpiresIn    int64  `json:"expires_in"`
		Scope        string `json:"scope"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return oauthTokenResult{}, err
	}
	if strings.TrimSpace(tokenResp.AccessToken) == "" {
		return oauthTokenResult{}, fmt.Errorf("oauth refresh returned empty access token")
	}
	out := oauthTokenResult{
		AccessToken:  tokenResp.AccessToken,
		RefreshToken: stringOr(tokenResp.RefreshToken, refreshToken),
		TokenType:    stringOr(tokenResp.TokenType, "Bearer"),
		Scopes:       strings.Fields(tokenResp.Scope),
	}
	if tokenResp.ExpiresIn > 0 {
		t := s.now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second)
		out.ExpiryAt = &t
	}
	if out.Scopes == nil {
		out.Scopes = cfg.Scopes
	}
	return out, nil
}

func (s *Service) fetchUserProfile(ctx context.Context, cfg providerRuntimeConfig, accessToken string) (email, name string) {
	if cfg.UserInfoURL == "" {
		return "", ""
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, cfg.UserInfoURL, nil)
	if err != nil {
		return "", ""
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := s.http.Do(req)
	if err != nil {
		return "", ""
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", ""
	}
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	switch cfg.Provider {
	case "google_workspace":
		var r struct {
			Email string `json:"email"`
			Name  string `json:"name"`
		}
		if json.Unmarshal(body, &r) == nil {
			return r.Email, r.Name
		}
	case "microsoft_365":
		var r struct {
			DisplayName       string `json:"displayName"`
			Mail              string `json:"mail"`
			UserPrincipalName string `json:"userPrincipalName"`
		}
		if json.Unmarshal(body, &r) == nil {
			email := r.Mail
			if email == "" {
				email = r.UserPrincipalName
			}
			return email, r.DisplayName
		}
	}
	return "", ""
}

func (s *Service) createProviderMeeting(ctx context.Context, provider, accessToken string, p LiveClassScheduleParams) (meetingURL, externalEventID string, metadata map[string]interface{}, err error) {
	switch provider {
	case "google_workspace":
		return s.createGoogleMeeting(ctx, accessToken, p)
	case "microsoft_365":
		return s.createMicrosoftMeeting(ctx, accessToken, p)
	default:
		return "", "", nil, fmt.Errorf("unsupported live-class provider")
	}
}

func (s *Service) createGoogleMeeting(ctx context.Context, accessToken string, p LiveClassScheduleParams) (string, string, map[string]interface{}, error) {
	body := map[string]interface{}{
		"summary":     p.Title,
		"description": p.Description,
		"start": map[string]interface{}{
			"dateTime": p.StartsAt.UTC().Format(time.RFC3339),
			"timeZone": "UTC",
		},
		"end": map[string]interface{}{
			"dateTime": p.EndsAt.UTC().Format(time.RFC3339),
			"timeZone": "UTC",
		},
		"conferenceData": map[string]interface{}{
			"createRequest": map[string]interface{}{
				"requestId": "schoolerp-" + uuidishRef(),
				"conferenceSolutionKey": map[string]interface{}{
					"type": "hangoutsMeet",
				},
			},
		},
	}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", bytes.NewReader(raw))
	if err != nil {
		return "", "", nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.http.Do(req)
	if err != nil {
		return "", "", nil, err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", nil, fmt.Errorf("google event create failed: %s", truncateForErr(string(respBody)))
	}
	var out struct {
		ID             string `json:"id"`
		HangoutLink    string `json:"hangoutLink"`
		ConferenceData struct {
			EntryPoints []struct {
				EntryPointType string `json:"entryPointType"`
				URI            string `json:"uri"`
			} `json:"entryPoints"`
		} `json:"conferenceData"`
		HTMLLink string `json:"htmlLink"`
	}
	if err := json.Unmarshal(respBody, &out); err != nil {
		return "", "", nil, err
	}
	link := strings.TrimSpace(out.HangoutLink)
	if link == "" {
		for _, ep := range out.ConferenceData.EntryPoints {
			if ep.EntryPointType == "video" && ep.URI != "" {
				link = ep.URI
				break
			}
		}
	}
	if link == "" {
		link = out.HTMLLink
	}
	return link, out.ID, map[string]interface{}{"created_via": "google_calendar_api"}, nil
}

func (s *Service) createMicrosoftMeeting(ctx context.Context, accessToken string, p LiveClassScheduleParams) (string, string, map[string]interface{}, error) {
	body := map[string]interface{}{
		"subject": p.Title,
		"body": map[string]interface{}{
			"contentType": "text",
			"content":     p.Description,
		},
		"start": map[string]interface{}{
			"dateTime": p.StartsAt.UTC().Format("2006-01-02T15:04:05"),
			"timeZone": "UTC",
		},
		"end": map[string]interface{}{
			"dateTime": p.EndsAt.UTC().Format("2006-01-02T15:04:05"),
			"timeZone": "UTC",
		},
		"isOnlineMeeting":       true,
		"onlineMeetingProvider": "teamsForBusiness",
	}
	raw, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://graph.microsoft.com/v1.0/me/events", bytes.NewReader(raw))
	if err != nil {
		return "", "", nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.http.Do(req)
	if err != nil {
		return "", "", nil, err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", nil, fmt.Errorf("microsoft event create failed: %s", truncateForErr(string(respBody)))
	}
	var out struct {
		ID            string `json:"id"`
		WebLink       string `json:"webLink"`
		OnlineMeeting struct {
			JoinURL string `json:"joinUrl"`
		} `json:"onlineMeeting"`
	}
	if err := json.Unmarshal(respBody, &out); err != nil {
		return "", "", nil, err
	}
	link := strings.TrimSpace(out.OnlineMeeting.JoinURL)
	if link == "" {
		link = out.WebLink
	}
	return link, out.ID, map[string]interface{}{"created_via": "microsoft_graph_api"}, nil
}

func uuidishRef() string {
	return strings.ReplaceAll(strings.ToLower(time.Now().UTC().Format("20060102t150405.000000000")), ".", "")
}

func truncateForErr(s string) string {
	s = strings.TrimSpace(s)
	if len(s) > 240 {
		return s[:240]
	}
	return s
}
