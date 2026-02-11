// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package middleware

import (
	"context"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/rs/zerolog/log"
)

type contextKey string

const (
	TenantIDKey contextKey = "tenant_id"
	UserIDKey   contextKey = "user_id"
	RoleKey     contextKey = "role"
	LocaleKey   contextKey = "locale"
)

// GetReqID returns the request ID from the context
func GetReqID(ctx context.Context) string {
	return middleware.GetReqID(ctx)
}

// GetTenantID returns the tenant ID from the context
func GetTenantID(ctx context.Context) string {
	if val, ok := ctx.Value(TenantIDKey).(string); ok {
		return val
	}
	return ""
}

// GetUserID returns the user ID from the context
func GetUserID(ctx context.Context) string {
	if val, ok := ctx.Value(UserIDKey).(string); ok {
		return val
	}
	return ""
}

// GetRole returns the user role from the context
func GetRole(ctx context.Context) string {
	if val, ok := ctx.Value(RoleKey).(string); ok {
		return val
	}
	return ""
}

// GetLocale returns the locale from the context
func GetLocale(ctx context.Context) string {
	if val, ok := ctx.Value(LocaleKey).(string); ok {
		return val
	}
	return "en"
}

// RequestIDPropagation ensures the X-Request-ID is sent back in the response header
// and injected into the zerolog context.
func RequestIDPropagation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := middleware.GetReqID(r.Context())
		if reqID == "" {
			reqID = uuid.New().String()
		}
		
		// Set on response header
		w.Header().Set("X-Request-ID", reqID)
		
		// Set on logger context
		logger := log.With().Str("request_id", reqID).Logger()
		ctx := logger.WithContext(r.Context())
		
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

var (
	httpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total number of HTTP requests.",
	}, []string{"method", "path", "status"})

	httpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "http_request_duration_seconds",
		Help:    "Duration of HTTP requests.",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "path"})
)

// Metrics tracking middleware
func Metrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)
		
		duration := time.Since(start).Seconds()
		path := r.URL.Path
		// Normalize path if needed (static routes only for now)
		
		status := strconv.Itoa(ww.Status())
		httpRequestsTotal.WithLabelValues(r.Method, path, status).Inc()
		httpRequestDuration.WithLabelValues(r.Method, path).Observe(duration)
	})
}


// TenantResolver extracts the tenant ID from the X-Tenant-ID header
func TenantResolver(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tenantID := r.Header.Get("X-Tenant-ID")
		// In production, we would also check the subdomain or domain mapping
		ctx := context.WithValue(r.Context(), TenantIDKey, tenantID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// AuthResolver validates JWT tokens from the Authorization header
func AuthResolver(next http.Handler) http.Handler {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-very-secret-key-123" // Fallback for dev only
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Skip auth for public paths
		if r.URL.Path == "/healthz" || strings.HasPrefix(r.URL.Path, "/v1/auth") {
			next.ServeHTTP(w, r)
			return
		}

		// 2. Extract Bearer Token
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			// Strict auth for protected routes
			if strings.HasPrefix(r.URL.Path, "/v1/admin") || 
			   strings.HasPrefix(r.URL.Path, "/v1/teacher") || 
			   strings.HasPrefix(r.URL.Path, "/v1/parent") {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
			return
		}

		tokenString := authHeader[7:]

		// 3. Parse and Validate
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// 4. Extract Claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			ctx := r.Context()
			
			if userID, ok := claims["sub"].(string); ok {
				ctx = context.WithValue(ctx, UserIDKey, userID)
			}
			if role, ok := claims["role"].(string); ok {
				ctx = context.WithValue(ctx, RoleKey, role)
			}
			if tenantID, ok := claims["tenant_id"].(string); ok {
				ctx = context.WithValue(ctx, TenantIDKey, tenantID)
			}
			
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	})
}

// RoleGuard enforces that the authenticated user has one of the allowed roles
func RoleGuard(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole := GetRole(r.Context())
			
			// If no role found (unauthenticated or public), deny
			if userRole == "" {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			
			// Check if userRole is in allowedRoles
			for _, role := range allowedRoles {
				if role == userRole {
					next.ServeHTTP(w, r)
					return
				}
			}
			
			// Provide slightly more detail for debugging, but generically 403
			http.Error(w, "Forbidden: Insufficient Permissions", http.StatusForbidden)
		})
	}
}

// LocaleResolver extracts the locale from the Accept-Language header
func LocaleResolver(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		locale := "en"
		lang := r.Header.Get("Accept-Language")
		
		// Very simple prefix matching for demo/Release 1
		if len(lang) >= 2 {
			prefix := lang[:2]
			if prefix == "hi" {
				locale = "hi"
			}
		}
		
		ctx := context.WithValue(r.Context(), LocaleKey, locale)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// IPChecker interface to avoid cyclic import or tight coupling with auth service
type IPChecker interface {
	CheckIPAccess(ctx context.Context, tenantID, roleName, ipStr string) (bool, error)
}

// IPGuard enforces IP allowlists
func IPGuard(checker IPChecker) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tenantID := GetTenantID(r.Context())
			role := GetRole(r.Context())
			
			// If no tenant (e.g. system admin or public?), maybe skip?
			// If no role, skip? 
			// Usually IP allowlists are for specific scenarios.
			// Let's assume if tenant AND role are present, we check.
			if tenantID == "" || role == "" {
				next.ServeHTTP(w, r)
				return
			}
			
			// Extract IP
			// Attempt to use X-Forwarded-For or RemoteAddr
			ip := r.Header.Get("X-Forwarded-For")
			if ip != "" {
				// XFF can be comma separated list, take first
				if idx := strings.Index(ip, ","); idx != -1 {
					ip = ip[:idx]
				}
			} else {
				ip = r.RemoteAddr
			}
			
			// Remove port if present
			host, _, err := net.SplitHostPort(ip)
			if err == nil {
				ip = host
			}

			allowed, err := checker.CheckIPAccess(r.Context(), tenantID, role, ip)
			if err != nil {
				// Log error? 
				// For security, fail open or closed? 
				// Fail closed usually.
				http.Error(w, "Forbidden (IP Check Failed)", http.StatusForbidden)
				return
			}
			
			if !allowed {
				http.Error(w, "Forbidden: IP Not Allowed", http.StatusForbidden)
				return
			}
			
			next.ServeHTTP(w, r)
		})
	}
}
