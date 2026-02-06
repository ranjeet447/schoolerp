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
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-jwt/jwt/v5"
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
			// For Release 1 development, we allow fallback for non-sensitive paths if needed, 
			// but for Absolute Zero we'll be strict on /admin and /teacher
			if strings.HasPrefix(r.URL.Path, "/v1/admin") || strings.HasPrefix(r.URL.Path, "/v1/teacher") {
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
			userID, _ := claims["sub"].(string)
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		http.Error(w, "Unauthorized", http.StatusUnauthorized)
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
