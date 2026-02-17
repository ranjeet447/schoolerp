package middleware

import (
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	corsConfigOnce      sync.Once
	corsAllowedOrigins  map[string]struct{}
	corsWildcardOrigins []wildcardOrigin
)

type wildcardOrigin struct {
	scheme     string
	hostSuffix string
}

func normalizeOrigin(rawOrigin string) (string, bool) {
	parsed, err := url.Parse(strings.TrimSpace(rawOrigin))
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", false
	}
	return strings.ToLower(parsed.Scheme) + "://" + strings.ToLower(parsed.Host), true
}

func addAllowedOrigin(rawOrigin string) {
	origin := strings.TrimSpace(rawOrigin)
	if origin == "" {
		return
	}

	// Wildcard syntax: https://*.example.com
	if strings.Contains(origin, "://*.") {
		parts := strings.SplitN(origin, "://*.", 2)
		if len(parts) == 2 {
			scheme := strings.ToLower(strings.TrimSpace(parts[0]))
			hostSuffix := strings.ToLower(strings.TrimSpace(parts[1]))
			if scheme != "" && hostSuffix != "" {
				corsWildcardOrigins = append(corsWildcardOrigins, wildcardOrigin{
					scheme:     scheme,
					hostSuffix: "." + hostSuffix,
				})
				return
			}
		}
	}

	normalized, ok := normalizeOrigin(origin)
	if !ok {
		return
	}
	corsAllowedOrigins[normalized] = struct{}{}
}

func initCORSConfig() {
	corsAllowedOrigins = make(map[string]struct{})
	corsWildcardOrigins = nil

	configured := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if configured == "" {
		configured = strings.TrimSpace(os.Getenv("FRONTEND_URL"))
	}
	for _, origin := range strings.Split(configured, ",") {
		addAllowedOrigin(origin)
	}

	if len(corsAllowedOrigins) > 0 || len(corsWildcardOrigins) > 0 {
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
		addAllowedOrigin(origin)
	}
}

func isOriginAllowed(origin string) bool {
	corsConfigOnce.Do(initCORSConfig)
	normalizedOrigin, ok := normalizeOrigin(origin)
	if !ok {
		return false
	}

	if _, exists := corsAllowedOrigins[normalizedOrigin]; exists {
		return true
	}

	parsed, err := url.Parse(normalizedOrigin)
	if err != nil {
		return false
	}

	host := strings.ToLower(parsed.Host)
	scheme := strings.ToLower(parsed.Scheme)
	for _, wildcard := range corsWildcardOrigins {
		if scheme != wildcard.scheme {
			continue
		}
		baseHost := strings.TrimPrefix(wildcard.hostSuffix, ".")
		if host != baseHost && strings.HasSuffix(host, wildcard.hostSuffix) {
			return true
		}
	}

	return false
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
				RecordSecurityEvent(r.Context(), SecurityEvent{
					EventType:  "cors.origin_denied",
					Severity:   "info",
					Method:     r.Method,
					Path:       r.URL.Path,
					StatusCode: http.StatusForbidden,
					IPAddress:  clientIPForSecurity(r),
					UserAgent:  r.UserAgent(),
					Origin:     origin,
					Metadata: map[string]any{
						"host": r.Host,
					},
				})
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
			ip := clientIPForSecurity(r)
			authLimiter.mu.Lock()
			authLimiter.counts[ip]++
			count := authLimiter.counts[ip]
			authLimiter.mu.Unlock()

			if count > 20 { // 20 req/min limit
				if count == 21 {
					RecordSecurityEvent(r.Context(), SecurityEvent{
						EventType:  "auth.rate_limited",
						Severity:   "warning",
						Method:     r.Method,
						Path:       r.URL.Path,
						StatusCode: http.StatusTooManyRequests,
						IPAddress:  ip,
						UserAgent:  r.UserAgent(),
						Origin:     r.Header.Get("Origin"),
						Metadata: map[string]any{
							"limit_per_minute": 20,
						},
					})
				}
				http.Error(w, "Too many requests", http.StatusTooManyRequests)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func clientIPForSecurity(r *http.Request) string {
	ip := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if ip != "" {
		if idx := strings.Index(ip, ","); idx != -1 {
			ip = ip[:idx]
		}
		ip = strings.TrimSpace(ip)
	}
	if ip == "" {
		ip = strings.TrimSpace(r.RemoteAddr)
	}

	host, _, err := net.SplitHostPort(ip)
	if err == nil {
		return strings.TrimSpace(host)
	}
	return ip
}
