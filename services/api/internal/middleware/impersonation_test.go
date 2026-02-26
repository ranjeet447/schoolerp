package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func signedTestJWT(t *testing.T, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, err := token.SignedString([]byte("test-secret"))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return s
}

func TestAuthResolver_ImpersonationBlocksPlatformAPI(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	t.Setenv("ENV", "test")
	sharedSessionPool = nil
	sharedSessionStore = nil

	nextCalled := false
	handler := AuthResolver(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/v1/admin/platform/settings", nil)
	req.Header.Set("Authorization", "Bearer "+signedTestJWT(t, jwt.MapClaims{
		"sub":          "user-123",
		"role":         "platform_support",
		"impersonated": true,
	}))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if nextCalled {
		t.Fatal("expected request to be blocked before reaching next handler")
	}
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "Impersonation accounts cannot access platform") {
		t.Fatalf("unexpected body: %q", rr.Body.String())
	}
}

func TestAuthResolver_ImpersonationDoesNotTriggerTenantPathBlock(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	t.Setenv("ENV", "test")
	sharedSessionPool = nil
	sharedSessionStore = nil

	handler := AuthResolver(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/v1/admin/students", nil)
	req.Header.Set("Authorization", "Bearer "+signedTestJWT(t, jwt.MapClaims{
		"sub":          "user-123",
		"role":         "admin",
		"impersonated": true,
	}))
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	// AuthResolver should continue past impersonation path gate and then fail normal auth/session validation.
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 (session/jti validation), got %d", rr.Code)
	}
}
