package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/security"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserInactive       = errors.New("user account is inactive")
	ErrMFARequired        = errors.New("mfa is required for this account")
)

type Service struct {
	queries *db.Queries
	MFA     *MFAService
	IPGuard *IPGuard
}

func NewService(queries *db.Queries) *Service {
	return &Service{
		queries: queries,
		MFA:     NewMFAService(queries),
		IPGuard: NewIPGuard(queries),
	}
}

// LoginResult contains the JWT token and user info after successful auth
type LoginResult struct {
	Token       string    `json:"token"`
	UserID      string    `json:"user_id"`
	Email       string    `json:"email"`
	FullName    string    `json:"full_name"`
	Role        string    `json:"role"`
	TenantID    string    `json:"tenant_id"`
	Permissions []string  `json:"permissions"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// Login authenticates a user via email/password and returns a JWT
func (s *Service) Login(ctx context.Context, email, password string) (*LoginResult, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	logger := log.Ctx(ctx).With().Str("auth_email", maskEmail(normalizedEmail)).Logger()

	// 1. Find user by email
	user, err := s.queries.GetUserByEmail(ctx, normalizedEmail)
	if err != nil {
		logger.Warn().Err(err).Msg("auth login failed: user lookup")
		return nil, ErrInvalidCredentials
	}

	if !user.IsActive.Bool {
		logger.Warn().Str("user_id", user.ID.String()).Msg("auth login failed: user inactive")
		return nil, ErrUserInactive
	}

	// 2. Verify password from user_identities table
	identity, err := s.queries.GetUserIdentity(ctx, db.GetUserIdentityParams{
		UserID:   user.ID,
		Provider: "password",
	})
	if err != nil {
		logger.Warn().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: password identity lookup")
		return nil, ErrInvalidCredentials
	}

	// Compare hashed password
	hashedInput := hashPassword(password)
	if identity.Credential.String != hashedInput {
		logger.Warn().Str("user_id", user.ID.String()).Msg("auth login failed: password mismatch")
		return nil, ErrInvalidCredentials
	}

	// 3. Get role and permissions for this user
	roleAssignment, err := s.queries.GetUserRoleAssignmentWithPermissions(ctx, user.ID)
	if err != nil {
		logger.Warn().Err(err).Str("user_id", user.ID.String()).Msg("auth login fallback: role assignment missing")
		// User has no role assigned - still allow login but with no role
		roleAssignment = db.GetUserRoleAssignmentWithPermissionsRow{
			RoleCode:    "user",
			Permissions: []string{},
		}
	}

	if isInternalPlatformRole(roleAssignment.RoleCode) {
		enforceMFA, err := s.isInternalMFAEnforced(ctx)
		if err != nil {
			logger.Warn().Err(err).Msg("auth login warning: unable to evaluate internal MFA policy")
		}
		if enforceMFA {
			secret, err := s.queries.GetMFASecret(ctx, user.ID)
			if err != nil || !secret.Enabled.Bool {
				logger.Warn().Str("user_id", user.ID.String()).Msg("auth login blocked: internal MFA policy enforcement")
				return nil, ErrMFARequired
			}
		}
	}

	// 4. Generate JWT token
	expiresAt := time.Now().Add(24 * time.Hour) // 24 hour token validity
	tokenJTI := uuid.Must(uuid.NewV7()).String()

	jwtSecrets, ok := security.ResolveJWTSecrets()
	if !ok || len(jwtSecrets) == 0 {
		logger.Error().Str("user_id", user.ID.String()).Msg("auth login failed: JWT secrets not configured in production")
		return nil, errors.New("server authentication is not configured")
	}
	jwtSecret := jwtSecrets[0]

	claims := jwt.MapClaims{
		"sub":         user.ID.String(),
		"email":       user.Email.String,
		"name":        user.FullName,
		"role":        roleAssignment.RoleCode,
		"tenant_id":   roleAssignment.TenantID.String(),
		"permissions": roleAssignment.Permissions,
		"iat":         time.Now().Unix(),
		"exp":         expiresAt.Unix(),
		"jti":         tokenJTI,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		logger.Error().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: token signing error")
		return nil, err
	}

	// 5. Update last login timestamp
	if err := s.queries.UpdateUserLastLogin(ctx, db.UpdateUserLastLoginParams{
		ID:       identity.ID,
		Provider: "password",
	}); err != nil {
		logger.Warn().Err(err).Str("user_id", user.ID.String()).Msg("auth login warning: unable to update last_login")
	}

	if err := s.queries.CreateSessionRecord(ctx, user.ID, hashPassword(tokenJTI), expiresAt); err != nil {
		logger.Error().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: unable to create session record")
		return nil, errors.New("session store unavailable")
	}

	logger.Info().
		Str("user_id", user.ID.String()).
		Str("role", roleAssignment.RoleCode).
		Str("tenant_id", roleAssignment.TenantID.String()).
		Msg("auth login success")

	return &LoginResult{
		Token:       tokenString,
		UserID:      user.ID.String(),
		Email:       user.Email.String,
		FullName:    user.FullName,
		Role:        roleAssignment.RoleCode,
		TenantID:    roleAssignment.TenantID.String(),
		Permissions: roleAssignment.Permissions,
		ExpiresAt:   expiresAt,
	}, nil
}

// hashPassword creates a SHA256 hash of the password
// In production, use bcrypt or argon2 instead
func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// HashPasswordForSeed is exported for use in seed scripts
func HashPasswordForSeed(password string) string {
	return hashPassword(password)
}

func maskEmail(email string) string {
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

func isInternalPlatformRole(roleCode string) bool {
	switch strings.ToLower(strings.TrimSpace(roleCode)) {
	case "super_admin", "support_l1", "support_l2", "finance", "ops", "developer":
		return true
	default:
		return false
	}
}

func (s *Service) isInternalMFAEnforced(ctx context.Context) (bool, error) {
	raw, err := s.queries.GetPlatformSettingValue(ctx, "security.internal_mfa_policy")
	if err != nil {
		return false, err
	}
	if len(raw) == 0 {
		return false, nil
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return false, nil
	}

	value, ok := payload["enforce_for_internal_users"].(bool)
	if !ok {
		return false, nil
	}
	return value, nil
}
