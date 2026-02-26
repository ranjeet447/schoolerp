package finance

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	mwm "github.com/schoolerp/api/internal/middleware"
)

func TestPaymentWebhookLimiterKey(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/v1/payments/webhook/razorpay", nil)
	req.Header.Set("X-Forwarded-For", "203.0.113.10, 10.0.0.1")
	req.RemoteAddr = "127.0.0.1:1234"

	if got := paymentWebhookLimiterKey("razorpay", req); got != "razorpay|203.0.113.10" {
		t.Fatalf("unexpected limiter key: %q", got)
	}

	req2 := httptest.NewRequest(http.MethodPost, "/v1/payments/webhook/payu", nil)
	req2.RemoteAddr = "198.51.100.22:4567"
	if got := paymentWebhookLimiterKey("payu", req2); got != "payu|198.51.100.22" {
		t.Fatalf("unexpected fallback limiter key: %q", got)
	}
}

func TestPaymentWebhookLimiterBehavior(t *testing.T) {
	limiter := mwm.RateLimitByKey("test_payments_webhook_limiter_"+time.Now().Format("150405.000000000"), 1, time.Minute, func(r *http.Request) string {
		return paymentWebhookLimiterKey(r.Header.Get("X-Provider"), r)
	})
	handler := limiter(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	makeReq := func(provider, xff string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodPost, "/v1/payments/webhook/"+provider, nil)
		req.Header.Set("X-Provider", provider)
		if xff != "" {
			req.Header.Set("X-Forwarded-For", xff)
		}
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		return rr
	}

	if rr := makeReq("razorpay", "203.0.113.11"); rr.Code != http.StatusNoContent {
		t.Fatalf("first request should pass, got %d", rr.Code)
	}
	if rr := makeReq("razorpay", "203.0.113.11"); rr.Code != http.StatusTooManyRequests {
		t.Fatalf("second request same provider/ip should rate-limit, got %d", rr.Code)
	}
	if rr := makeReq("payu", "203.0.113.11"); rr.Code != http.StatusNoContent {
		t.Fatalf("different provider should not share bucket, got %d", rr.Code)
	}
	if rr := makeReq("razorpay", "203.0.113.12"); rr.Code != http.StatusNoContent {
		t.Fatalf("different IP should not share bucket, got %d", rr.Code)
	}
}
