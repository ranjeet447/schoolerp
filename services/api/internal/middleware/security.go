package middleware

import (
	"net/url"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	corsConfigOnce       sync.Once
	corsAllowedOrigins   map[string]struct{}
)

func initCORSConfig() {
	corsAllowedOrigins = make(map[string]struct{})

	configured := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if configured != "" {
		for _, origin := range strings.Split(configured, ",") {
			o := strings.TrimSpace(origin)
			if o == "" {
				continue
			}
			corsAllowedOrigins[o] = struct{}{}
		}
		return
	}

	// Safe local defaults for development environments.
	if strings.EqualFold(os.Getenv("ENV"), "production") {
		return
	}

	localOrigins := []string{
		"http://localhost:3000",
		"http://localhost:3001",
		"http://localhost:5173",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:3001",
		"http://127.0.0.1:5173",
	}
	for _, origin := range localOrigins {
		corsAllowedOrigins[origin] = struct{}{}
	}
}

func isOriginAllowed(origin string) bool {
	corsConfigOnce.Do(initCORSConfig)
	if origin == "" {
		return false
	}

	parsed, err := url.Parse(origin)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return false
	}
	normalizedOrigin := parsed.Scheme + "://" + parsed.Host
	_, ok := corsAllowedOrigins[normalizedOrigin]
	return ok
}

// CORS provides Cross-Origin Resource Sharing middleware
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowedOrigin := origin != "" && isOriginAllowed(origin)

		w.Header().Add("Vary", "Origin")

		if allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Tenant-ID")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == "OPTIONS" {
			if origin != "" && !allowedOrigin {
				http.Error(w, "origin not allowed", http.StatusForbidden)
				return
			}
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
