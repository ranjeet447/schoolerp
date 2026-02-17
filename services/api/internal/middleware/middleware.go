package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/foundation/security"
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
			reqID = uuid.Must(uuid.NewV7()).String()
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
	secrets, secretConfigured := security.ResolveJWTSecrets()

	var sessionPool *pgxpool.Pool
	if dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL")); dbURL != "" {
		if cfg, err := pgxpool.ParseConfig(dbURL); err == nil {
			if pool, err := pgxpool.NewWithConfig(context.Background(), cfg); err == nil {
				sessionPool = pool
			}
		}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Skip auth for public paths
		if r.URL.Path == "/healthz" || strings.HasPrefix(r.URL.Path, "/v1/auth") {
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("Authorization")
		isProtectedPath := strings.HasPrefix(r.URL.Path, "/v1/admin") ||
			strings.HasPrefix(r.URL.Path, "/v1/teacher") ||
			strings.HasPrefix(r.URL.Path, "/v1/parent")

		if !secretConfigured {
			if isProtectedPath || authHeader != "" {
				http.Error(w, "Server authentication is not configured", http.StatusInternalServerError)
				return
			}
			next.ServeHTTP(w, r)
			return
		}

		// 2. Extract Bearer Token
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			// Strict auth for protected routes
			if isProtectedPath {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
			return
		}

		tokenString := authHeader[7:]

		// 3. Parse and Validate
		var token *jwt.Token
		var err error
		for _, secret := range secrets {
			token, err = jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if token.Method != jwt.SigningMethodHS256 {
					return nil, errors.New("unexpected signing method")
				}
				return []byte(secret), nil
			})
			if err == nil && token != nil && token.Valid {
				break
			}
		}

		if err != nil || token == nil || !token.Valid {
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

			if sessionPool != nil {
				subject, _ := claims["sub"].(string)
				jti, _ := claims["jti"].(string)
				subject = strings.TrimSpace(subject)
				jti = strings.TrimSpace(jti)
				if subject == "" || jti == "" {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}

				var uid pgtype.UUID
				if err := uid.Scan(subject); err != nil || !uid.Valid {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}

				hash := sha256.Sum256([]byte(jti))
				tokenHash := hex.EncodeToString(hash[:])

				var exists bool
				err := sessionPool.QueryRow(
					r.Context(),
					`SELECT EXISTS(SELECT 1 FROM sessions WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW())`,
					uid,
					tokenHash,
				).Scan(&exists)
				if err != nil || !exists {
					http.Error(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
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

		// Handle complex Accept-Language headers (e.g., "en-US,en;q=0.9,hi;q=0.8")
		if lang != "" {
			parts := strings.Split(lang, ",")
			for _, part := range parts {
				tag := strings.TrimSpace(strings.Split(part, ";")[0])
				if strings.HasPrefix(tag, "hi") {
					locale = "hi"
					break
				}
				if strings.HasPrefix(tag, "en") {
					locale = "en"
					break
				}
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
				RecordSecurityEvent(r.Context(), SecurityEvent{
					TenantID:   tenantID,
					UserID:     GetUserID(r.Context()),
					Role:       role,
					EventType:  "access.ip_check_failed",
					Severity:   "critical",
					Method:     r.Method,
					Path:       r.URL.Path,
					StatusCode: http.StatusForbidden,
					IPAddress:  ip,
					UserAgent:  r.UserAgent(),
					Origin:     r.Header.Get("Origin"),
					Metadata: map[string]any{
						"tenant_ref": tenantID,
					},
				})
				http.Error(w, "Forbidden (IP Check Failed)", http.StatusForbidden)
				return
			}

			if !allowed {
				RecordSecurityEvent(r.Context(), SecurityEvent{
					TenantID:   tenantID,
					UserID:     GetUserID(r.Context()),
					Role:       role,
					EventType:  "access.ip_denied",
					Severity:   "warning",
					Method:     r.Method,
					Path:       r.URL.Path,
					StatusCode: http.StatusForbidden,
					IPAddress:  ip,
					UserAgent:  r.UserAgent(),
					Origin:     r.Header.Get("Origin"),
					Metadata: map[string]any{
						"tenant_ref": tenantID,
					},
				})
				http.Error(w, "Forbidden: IP Not Allowed", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
