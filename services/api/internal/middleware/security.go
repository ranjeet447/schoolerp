package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"
)

// CORS provides Cross-Origin Resource Sharing middleware
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		
		// In production, validate against allowed domains
		// For Release 1, we support multi-tenant subdomains
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Tenant-ID")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Simple in-memory rate limiter
type limiter struct {
	counts map[string]int
	mu     sync.Mutex
}

var authLimiter = &limiter{
	counts: make(map[string]int),
}

func init() {
	go func() {
		for {
			time.Sleep(1 * time.Minute)
			authLimiter.mu.Lock()
			authLimiter.counts = make(map[string]int)
			authLimiter.mu.Unlock()
		}
	}()
}

// RateLimit restricts the number of requests to sensitive paths
func RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/v1/auth") {
			ip := r.RemoteAddr
			authLimiter.mu.Lock()
			authLimiter.counts[ip]++
			count := authLimiter.counts[ip]
			authLimiter.mu.Unlock()

			if count > 20 { // 20 req/min limit
				http.Error(w, "Too many requests", http.StatusTooManyRequests)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
