package auth

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/middleware"
	"github.com/schoolerp/api/internal/service/auth"
)

type Handler struct {
	svc *auth.Service
}

func NewHandler(svc *auth.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/auth/login", h.Login)
	r.Post("/auth/mfa/setup", h.SetupMFA)
	r.Post("/auth/mfa/enable", h.EnableMFA)
	r.Post("/auth/mfa/validate", h.ValidateMFA)
}

// ... Login ...

// MFA Handlers

func (h *Handler) SetupMFA(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// We need email for AccountName in TOTP
	// Ideally we fetch user from DB or claims.
	// For now, let's pass a placeholder or fetch it.
	// Simplest: "SchoolERP User"

	config, err := h.svc.MFA.GenerateSecret(r.Context(), userID, "SchoolERP User")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"secret":  config.Secret,
		"qr_code": config.QRCode, // Client can display this
	})
}

type enableMFARequest struct {
	Code string `json:"code"`
}

func (h *Handler) EnableMFA(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req enableMFARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err := h.svc.MFA.EnableMFA(r.Context(), userID, req.Code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": true}`))
}

type validateMFARequest struct {
	Code string `json:"code"`
	// If validating during login, maybe we don't have userID in context yet?
	// But usually MFA is step 2. We might have a temporary token or session.
	// For now, assume userID is in context (e.g. "pre-auth" token or similar).
}

func (h *Handler) ValidateMFA(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req validateMFARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	valid, err := h.svc.MFA.ValidateMFA(r.Context(), userID, req.Code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !valid {
		http.Error(w, "Invalid code", http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"valid": true}`))
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	Success bool              `json:"success"`
	Message string            `json:"message,omitempty"`
	Data    *auth.LoginResult `json:"data,omitempty"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	logger := log.Ctx(r.Context())

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Warn().Err(err).Msg("auth login failed: invalid request body")
		middleware.RecordSecurityEvent(r.Context(), middleware.SecurityEvent{
			EventType:  "auth.login.invalid_body",
			Severity:   "info",
			Method:     r.Method,
			Path:       r.URL.Path,
			StatusCode: http.StatusBadRequest,
			IPAddress:  clientIPForAuth(r),
			UserAgent:  r.UserAgent(),
			Origin:     r.Header.Get("Origin"),
		})
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(loginResponse{
			Success: false,
			Message: "Invalid request body",
		})
		return
	}

	if req.Email == "" || req.Password == "" {
		logger.Warn().
			Str("auth_email", maskLoginEmail(req.Email)).
			Msg("auth login failed: missing email/password")
		middleware.RecordSecurityEvent(r.Context(), middleware.SecurityEvent{
			EventType:  "auth.login.invalid_request",
			Severity:   "info",
			Method:     r.Method,
			Path:       r.URL.Path,
			StatusCode: http.StatusBadRequest,
			IPAddress:  clientIPForAuth(r),
			UserAgent:  r.UserAgent(),
			Origin:     r.Header.Get("Origin"),
			Metadata: map[string]any{
				"email_masked": maskLoginEmail(req.Email),
			},
		})
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(loginResponse{
			Success: false,
			Message: "Email and password are required",
		})
		return
	}

	logger.Info().
		Str("auth_email", maskLoginEmail(req.Email)).
		Str("tenant_header", r.Header.Get("X-Tenant-ID")).
		Str("origin", r.Header.Get("Origin")).
		Msg("auth login attempt")

	result, err := h.svc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		logger.Warn().
			Err(err).
			Str("auth_email", maskLoginEmail(req.Email)).
			Msg("auth login failed")
		statusCode := http.StatusUnauthorized
		eventType := "auth.login_failed"
		severity := "warning"
		if errors.Is(err, auth.ErrMFARequired) {
			statusCode = http.StatusForbidden
			eventType = "auth.mfa_required"
			severity = "info"
		}
		if errors.Is(err, auth.ErrAccessBlocked) {
			statusCode = http.StatusForbidden
			eventType = "auth.access_blocked"
			severity = "warning"
		}
		if errors.Is(err, auth.ErrPasswordExpired) {
			statusCode = http.StatusForbidden
			eventType = "auth.password_expired"
			severity = "info"
		}
		if errors.Is(err, auth.ErrSessionStoreUnavailable) {
			statusCode = http.StatusServiceUnavailable
			eventType = "auth.session_store_unavailable"
			severity = "critical"
		}
		middleware.RecordSecurityEvent(r.Context(), middleware.SecurityEvent{
			EventType:  eventType,
			Severity:   severity,
			Method:     r.Method,
			Path:       r.URL.Path,
			StatusCode: statusCode,
			IPAddress:  clientIPForAuth(r),
			UserAgent:  r.UserAgent(),
			Origin:     r.Header.Get("Origin"),
			Metadata: map[string]any{
				"email_masked":  maskLoginEmail(req.Email),
				"tenant_header": strings.TrimSpace(r.Header.Get("X-Tenant-ID")),
				"error":         err.Error(),
			},
		})
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(loginResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	logger.Info().
		Str("auth_email", maskLoginEmail(req.Email)).
		Str("user_id", result.UserID).
		Str("role", result.Role).
		Str("tenant_id", result.TenantID).
		Msg("auth login completed")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(loginResponse{
		Success: true,
		Data:    result,
	})
}

func clientIPForAuth(r *http.Request) string {
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

func maskLoginEmail(email string) string {
	e := strings.ToLower(strings.TrimSpace(email))
	parts := strings.SplitN(e, "@", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "***"
	}

	local := parts[0]
	if len(local) == 1 {
		return local + "***@" + parts[1]
	}
	if len(local) == 2 {
		return local[:1] + "***@" + parts[1]
	}
	return local[:1] + "***" + local[len(local)-1:] + "@" + parts[1]
}
