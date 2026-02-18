package auth

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/foundation/security"
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
	r.Post("/auth/forgot-password", h.ForgotPassword)
	r.Post("/auth/mfa/setup", h.SetupMFA)
	r.Post("/auth/mfa/enable", h.EnableMFA)
	r.Post("/auth/mfa/validate", h.ValidateMFA)
	r.Get("/auth/legal/docs", h.ListLegalDocs)
	r.Post("/auth/legal/accept", h.AcceptLegalDocs)
}

// ... Login ...

// MFA Handlers

func (h *Handler) SetupMFA(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	accountLabel, err := h.svc.GetMFAAccountLabel(r.Context(), userID)
	if err != nil {
		http.Error(w, "Unable to resolve user account", http.StatusInternalServerError)
		return
	}

	config, err := h.svc.MFA.GenerateSecret(r.Context(), userID, accountLabel)
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
	Code    string            `json:"code,omitempty"`
	Message string            `json:"message,omitempty"`
	Data    *auth.LoginResult `json:"data,omitempty"`
	Meta    interface{}       `json:"meta,omitempty"`
}

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req forgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Email) == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	if err := h.svc.InitiatePasswordReset(r.Context(), req.Email, clientIPForAuth(r), r.UserAgent()); err != nil {
		http.Error(w, "Failed to process request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "If an account exists, a reset link has been sent",
	})
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
		code := ""
		var meta interface{}

		var legalErr *auth.LegalAcceptanceRequiredError
		if errors.As(err, &legalErr) {
			statusCode = http.StatusForbidden
			eventType = "auth.legal_acceptance_required"
			severity = "info"
			code = "legal_acceptance_required"
			meta = map[string]interface{}{
				"requirements":  legalErr.Requirements,
				"preauth_token": legalErr.PreauthToken,
			}
		}
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
			Code:    code,
			Message: err.Error(),
			Meta:    meta,
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

func (h *Handler) ListLegalDocs(w http.ResponseWriter, r *http.Request) {
	docs, err := h.svc.ListCurrentLegalDocs(r.Context())
	if err != nil {
		http.Error(w, "Failed to load legal docs", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    docs,
	})
}

type acceptLegalDocsRequest struct {
	Accept []auth.LegalAcceptanceInput `json:"accept"`
}

func (h *Handler) AcceptLegalDocs(w http.ResponseWriter, r *http.Request) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimSpace(authHeader[7:])
	userID, err := parseLegalPreauthToken(tokenString)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req acceptLegalDocsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.svc.AcceptLegalDocs(r.Context(), userID, req.Accept, clientIPForAuth(r), r.UserAgent()); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := h.svc.IssueTokenForUser(r.Context(), userID)
	if err != nil {
		statusCode := http.StatusUnauthorized
		if errors.Is(err, auth.ErrSessionStoreUnavailable) {
			statusCode = http.StatusServiceUnavailable
		} else if errors.Is(err, auth.ErrAccessBlocked) || errors.Is(err, auth.ErrPasswordExpired) || errors.Is(err, auth.ErrMFARequired) {
			statusCode = http.StatusForbidden
		}

		var legalErr *auth.LegalAcceptanceRequiredError
		if errors.As(err, &legalErr) {
			statusCode = http.StatusForbidden
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(statusCode)
			_ = json.NewEncoder(w).Encode(loginResponse{
				Success: false,
				Code:    "legal_acceptance_required",
				Message: err.Error(),
				Meta: map[string]interface{}{
					"requirements": legalErr.Requirements,
				},
			})
			return
		}

		http.Error(w, err.Error(), statusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(loginResponse{
		Success: true,
		Data:    result,
	})
}

func parseLegalPreauthToken(tokenString string) (string, error) {
	secrets, configured := security.ResolveJWTSecrets()
	if !configured || len(secrets) == 0 {
		return "", errors.New("server authentication is not configured")
	}

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
		return "", errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid token")
	}

	purpose, _ := claims["purpose"].(string)
	if strings.TrimSpace(purpose) != "legal_accept" {
		return "", errors.New("invalid token")
	}

	sub, _ := claims["sub"].(string)
	sub = strings.TrimSpace(sub)
	if sub == "" {
		return "", errors.New("invalid token")
	}
	return sub, nil
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
