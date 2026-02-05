package middleware

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
)

type contextKey string

const (
	TenantIDKey contextKey = "tenant_id"
	UserIDKey   contextKey = "user_id"
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

// GetLocale returns the locale from the context
func GetLocale(ctx context.Context) string {
	if val, ok := ctx.Value(LocaleKey).(string); ok {
		return val
	}
	return "en"
}

// RequestIDPropagation ensures the X-Request-ID is sent back in the response header
func RequestIDPropagation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := middleware.GetReqID(r.Context())
		if reqID == "" {
			reqID = uuid.New().String()
		}
		w.Header().Set("X-Request-ID", reqID)
		next.ServeHTTP(w, r)
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

// AuthResolver is a placeholder for JWT parsing
func AuthResolver(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Stub: in real app, parse Authorization header
		// For Release 1 development, we might set a default if missing
		userID := "user-1" // stub
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
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
