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
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/security"
	"github.com/schoolerp/api/internal/foundation/sessionstore"
)

var (
	ErrInvalidCredentials      = errors.New("invalid email or password")
	ErrUserNotFound            = errors.New("user not found")
	ErrUserInactive            = errors.New("user account is inactive")
	ErrMFARequired             = errors.New("mfa is required for this account")
	ErrSessionStoreUnavailable = errors.New("session store unavailable")
	ErrAccessBlocked           = errors.New("access blocked")
	ErrPasswordExpired         = errors.New("password expired; contact administrator")
)

const authStoreTimeout = 5 * time.Second

type Service struct {
	queries      *db.Queries
	sessionStore *sessionstore.Store
	MFA          *MFAService
	IPGuard      *IPGuard
}

func NewService(queries *db.Queries, store *sessionstore.Store) *Service {
	return &Service{
		queries:      queries,
		sessionStore: store,
		MFA:          NewMFAService(queries),
		IPGuard:      NewIPGuard(queries),
	}
}

func (s *Service) GetMFAAccountLabel(ctx context.Context, userID string) (string, error) {
	uID := pgtype.UUID{}
	if err := uID.Scan(userID); err != nil {
		return "", err
	}

	user, err := s.queries.GetUserByID(ctx, uID)
	if err != nil {
		return "", err
	}

	if strings.TrimSpace(user.Email.String) != "" {
		return strings.TrimSpace(user.Email.String), nil
	}
	if strings.TrimSpace(user.FullName) != "" {
		return strings.TrimSpace(user.FullName), nil
	}

	return "SchoolERP User", nil
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

// UserProfile represents a unified user profile across different roles
type UserProfile struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	AvatarURL string `json:"avatar_url"`
	Role      string `json:"role"`
	TenantID  string `json:"tenant_id"`

	EmployeeDetails *db.Employee `json:"employee_details,omitempty"`
	GuardianDetails *db.Guardian `json:"guardian_details,omitempty"`
}

// UpdateProfileRequest contains fields that can be updated by the user
type UpdateProfileRequest struct {
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	AvatarURL string `json:"avatar_url"`
}

// Login authenticates a user via email/password and returns a JWT
func (s *Service) Login(ctx context.Context, email, password string) (*LoginResult, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	logger := log.Ctx(ctx).With().Str("auth_email", maskEmail(normalizedEmail)).Logger()
	isStoreUnavailableErr := func(err error) bool {
		return errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled)
	}

	// 1. Find user by email
	userLookupCtx, cancelUserLookup := context.WithTimeout(ctx, authStoreTimeout)
	user, err := s.queries.GetUserByEmail(userLookupCtx, normalizedEmail)
	cancelUserLookup()
	if err != nil {
		if isStoreUnavailableErr(err) {
			logger.Error().Err(err).Msg("auth login failed: user lookup store unavailable")
			return nil, ErrSessionStoreUnavailable
		}
		logger.Warn().Err(err).Msg("auth login failed: user lookup")
		return nil, ErrInvalidCredentials
	}

	if !user.IsActive.Bool {
		logger.Warn().Str("user_id", user.ID.String()).Msg("auth login failed: user inactive")
		return nil, ErrUserInactive
	}

	// 2. Verify password from user_identities table
	identityLookupCtx, cancelIdentityLookup := context.WithTimeout(ctx, authStoreTimeout)
	identity, err := s.queries.GetUserIdentity(identityLookupCtx, db.GetUserIdentityParams{
		UserID:   user.ID,
		Provider: "password",
	})
	cancelIdentityLookup()
	if err != nil {
		if isStoreUnavailableErr(err) {
			logger.Error().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: identity lookup store unavailable")
			return nil, ErrSessionStoreUnavailable
		}
		logger.Warn().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: password identity lookup")
		return nil, ErrInvalidCredentials
	}

	// Compare hashed password
	hashedInput := hashPassword(password)
	if identity.Credential.String != hashedInput {
		logger.Warn().Str("user_id", user.ID.String()).Msg("auth login failed: password mismatch")
		return nil, ErrInvalidCredentials
	}

	if err := s.enforcePasswordExpiry(ctx, user.ID.String(), identity.ID); err != nil {
		return nil, err
	}

	// 3. Get role and permissions for this user
	roleAssignment, err := s.queries.GetUserRoleAssignmentWithPermissions(ctx, user.ID)
	if err != nil {
		if isStoreUnavailableErr(err) {
			logger.Error().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: role lookup store unavailable")
			return nil, ErrSessionStoreUnavailable
		}
		logger.Warn().Err(err).Str("user_id", user.ID.String()).Msg("auth login fallback: role assignment missing")
		// User has no role assigned - still allow login but with no role
		roleAssignment = db.GetUserRoleAssignmentWithPermissionsRow{
			RoleCode:    "user",
			Permissions: []string{},
		}
	}

	blocked, err := s.queries.IsPlatformSecurityBlocked(ctx, user.ID, roleAssignment.TenantID)
	if err != nil {
		if isStoreUnavailableErr(err) {
			logger.Error().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: security block lookup store unavailable")
			return nil, ErrSessionStoreUnavailable
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "42P01" {
			logger.Warn().Str("user_id", user.ID.String()).Msg("auth login warning: security blocks table missing")
		} else {
			logger.Warn().Err(err).Str("user_id", user.ID.String()).Msg("auth login warning: unable to evaluate security blocks")
		}
	} else if blocked {
		logger.Warn().Str("user_id", user.ID.String()).Msg("auth login blocked: access blocked")
		return nil, ErrAccessBlocked
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

	missingLegal, err := s.missingLegalAcceptances(ctx, user.ID)
	if err != nil {
		logger.Warn().Err(err).Str("user_id", user.ID.String()).Msg("auth login warning: unable to evaluate legal acceptance")
	} else if len(missingLegal) > 0 {
		preauth, err := s.mintLegalPreauthToken(user.ID.String())
		if err != nil {
			logger.Error().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: unable to mint legal preauth token")
			return nil, err
		}
		logger.Info().Str("user_id", user.ID.String()).Msg("auth login blocked: legal acceptance required")
		return nil, &LegalAcceptanceRequiredError{
			Requirements: missingLegal,
			PreauthToken: preauth,
		}
	}

	return s.mintLoginResult(ctx, user, identity, roleAssignment)
}

// IssueTokenForUser generates a full auth token for an already-authenticated user (e.g. after pre-auth flows).
func (s *Service) IssueTokenForUser(ctx context.Context, userID string) (*LoginResult, error) {
	var uid pgtype.UUID
	if err := uid.Scan(strings.TrimSpace(userID)); err != nil || !uid.Valid {
		return nil, ErrUserNotFound
	}

	user, err := s.queries.GetUserByID(ctx, uid)
	if err != nil {
		return nil, ErrUserNotFound
	}
	if !user.IsActive.Bool {
		return nil, ErrUserInactive
	}

	identity, err := s.queries.GetUserIdentity(ctx, db.GetUserIdentityParams{
		UserID:   user.ID,
		Provider: "password",
	})
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := s.enforcePasswordExpiry(ctx, user.ID.String(), identity.ID); err != nil {
		return nil, err
	}

	roleAssignment, err := s.queries.GetUserRoleAssignmentWithPermissions(ctx, user.ID)
	if err != nil {
		roleAssignment = db.GetUserRoleAssignmentWithPermissionsRow{
			RoleCode:    "user",
			Permissions: []string{},
		}
	}

	blocked, err := s.queries.IsPlatformSecurityBlocked(ctx, user.ID, roleAssignment.TenantID)
	if err == nil && blocked {
		return nil, ErrAccessBlocked
	}

	if isInternalPlatformRole(roleAssignment.RoleCode) {
		enforceMFA, err := s.isInternalMFAEnforced(ctx)
		if err == nil && enforceMFA {
			secret, err := s.queries.GetMFASecret(ctx, user.ID)
			if err != nil || !secret.Enabled.Bool {
				return nil, ErrMFARequired
			}
		}
	}

	missingLegal, err := s.missingLegalAcceptances(ctx, user.ID)
	if err == nil && len(missingLegal) > 0 {
		return nil, &LegalAcceptanceRequiredError{Requirements: missingLegal}
	}

	return s.mintLoginResult(ctx, user, identity, roleAssignment)
}

func (s *Service) InitiatePasswordReset(ctx context.Context, email, ipAddress, userAgent string) error {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	if normalizedEmail == "" {
		return errors.New("email is required")
	}

	user, err := s.queries.GetUserByEmail(ctx, normalizedEmail)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}

	roleAssignment, err := s.queries.GetUserRoleAssignmentWithPermissions(ctx, user.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"user_id":      user.ID,
		"tenant_id":    roleAssignment.TenantID,
		"email":        normalizedEmail,
		"ip_address":   ipAddress,
		"user_agent":   userAgent,
		"requested_at": time.Now().UTC().Format(time.RFC3339),
	})

	_, _ = s.queries.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
		TenantID:  roleAssignment.TenantID,
		EventType: "auth.password_reset.requested",
		Payload:   payload,
	})

	return nil
}

func (s *Service) mintLoginResult(ctx context.Context, user db.AuthUser, identity db.AuthIdentity, roleAssignment db.GetUserRoleAssignmentWithPermissionsRow) (*LoginResult, error) {
	logger := log.Ctx(ctx)

	// 4. Generate JWT token
	expiresAt := time.Now().Add(24 * time.Hour) // 24 hour token validity
	tokenJTI := uuid.Must(uuid.NewV7()).String()
	tokenHash := hashPassword(tokenJTI)

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

	sessionCreateCtx, cancelSessionCreate := context.WithTimeout(ctx, authStoreTimeout)
	err = s.queries.CreateSessionRecord(sessionCreateCtx, user.ID, tokenHash, expiresAt)
	cancelSessionCreate()
	if err != nil {
		logger.Error().Err(err).Str("user_id", user.ID.String()).Msg("auth login failed: unable to create session record")
		return nil, ErrSessionStoreUnavailable
	}
	if s.sessionStore != nil && s.sessionStore.Enabled() {
		if cacheErr := s.sessionStore.SetSession(ctx, user.ID.String(), tokenHash, expiresAt); cacheErr != nil {
			logger.Warn().Err(cacheErr).Str("user_id", user.ID.String()).Msg("auth login warning: unable to cache session")
		}
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

// GetConsolidatedProfile retrieves basic user info and role-specific details
func (s *Service) GetConsolidatedProfile(ctx context.Context, userID string) (*UserProfile, error) {
	var uid pgtype.UUID
	if err := uid.Scan(strings.TrimSpace(userID)); err != nil || !uid.Valid {
		return nil, ErrUserNotFound
	}

	user, err := s.queries.GetUserByID(ctx, uid)
	if err != nil {
		return nil, err
	}

	roleAssignment, err := s.queries.GetUserRoleAssignmentWithPermissions(ctx, uid)
	if err != nil {
		// Fallback for users with no explicit roles
		roleAssignment = db.GetUserRoleAssignmentWithPermissionsRow{
			RoleCode: "user",
			TenantID: pgtype.UUID{},
		}
	}

	profile := &UserProfile{
		UserID:   user.ID.String(),
		Email:    user.Email.String,
		FullName: user.FullName,
		Role:     roleAssignment.RoleCode,
		TenantID: roleAssignment.TenantID.String(),
	}

	// Fetch role-specific details
	switch strings.ToLower(roleAssignment.RoleCode) {
	case "tenant_admin", "teacher", "finance", "ops", "support_l1", "support_l2":
		emp, err := s.queries.GetEmployeeByUserID(ctx, db.GetEmployeeByUserIDParams{
			UserID:   uid,
			TenantID: roleAssignment.TenantID,
		})
		if err == nil {
			profile.EmployeeDetails = &emp
			if emp.Phone.Valid {
				profile.Phone = emp.Phone.String
			}
		}
	case "parent":
		g, err := s.queries.GetGuardianByUserID(ctx, uid)
		if err == nil {
			profile.GuardianDetails = &g
			profile.Phone = g.Phone
		}
	}

	return profile, nil
}

// UpdateProfile updates basic user information and role-specific details
func (s *Service) UpdateProfile(ctx context.Context, userID string, req UpdateProfileRequest) error {
	var uid pgtype.UUID
	if err := uid.Scan(strings.TrimSpace(userID)); err != nil || !uid.Valid {
		return ErrUserNotFound
	}

	// 1. Update users table if FullName is provided
	if req.FullName != "" {
		if err := s.queries.UpdateUserFullName(ctx, uid, req.FullName); err != nil {
			return err
		}
	}

	// 2. Update avatar if provided
	if req.AvatarURL != "" {
		if err := s.queries.UpdateUserAvatar(ctx, uid, req.AvatarURL); err != nil {
			return err
		}
	}

	// 3. Determine role to update specific tables
	roleAssignment, err := s.queries.GetUserRoleAssignmentWithPermissions(ctx, uid)
	if err != nil {
		return nil // Non-critical for background updates
	}

	switch strings.ToLower(roleAssignment.RoleCode) {
	case "tenant_admin", "teacher", "finance", "ops", "support_l1", "support_l2":
		emp, err := s.queries.GetEmployeeByUserID(ctx, db.GetEmployeeByUserIDParams{
			UserID:   uid,
			TenantID: roleAssignment.TenantID,
		})
		if err == nil {
			updateParams := db.UpdateEmployeeParams{
				ID:                emp.ID,
				TenantID:          emp.TenantID,
				FullName:          emp.FullName,
				Email:             emp.Email,
				Phone:             emp.Phone,
				Department:        emp.Department,
				Designation:       emp.Designation,
				SalaryStructureID: emp.SalaryStructureID,
				BankDetails:       emp.BankDetails,
				Status:            emp.Status,
			}
			if req.FullName != "" {
				updateParams.FullName = req.FullName
			}
			if req.Phone != "" {
				updateParams.Phone = pgtype.Text{String: req.Phone, Valid: true}
			}
			_, _ = s.queries.UpdateEmployee(ctx, updateParams)
		}
	case "parent":
		if req.Phone != "" || req.Address != "" {
			_ = s.queries.UpdateGuardianProfile(ctx, uid, req.Phone, req.Address)
		}
	}

	return nil
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

type passwordPolicy struct {
	MinLength    int
	HistoryCount int
	MaxAgeDays   int
}

func defaultPasswordPolicy() passwordPolicy {
	return passwordPolicy{
		MinLength:    8,
		HistoryCount: 0,
		MaxAgeDays:   0,
	}
}

func (s *Service) resolvePasswordPolicy(ctx context.Context) (passwordPolicy, error) {
	raw, err := s.queries.GetPlatformSettingValue(ctx, "security.password_policy")
	if err != nil {
		return passwordPolicy{}, err
	}
	if len(raw) == 0 {
		return defaultPasswordPolicy(), nil
	}

	out := defaultPasswordPolicy()
	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return out, nil
	}
	if v, ok := payload["min_length"].(float64); ok {
		out.MinLength = int(v)
	}
	if v, ok := payload["history_count"].(float64); ok {
		out.HistoryCount = int(v)
	}
	if v, ok := payload["max_age_days"].(float64); ok {
		out.MaxAgeDays = int(v)
	}

	if out.MinLength < 8 {
		out.MinLength = 8
	}
	if out.HistoryCount < 0 {
		out.HistoryCount = 0
	}
	if out.MaxAgeDays < 0 {
		out.MaxAgeDays = 0
	}

	return out, nil
}

func (s *Service) enforcePasswordExpiry(ctx context.Context, userID string, identityID pgtype.UUID) error {
	policy, err := s.resolvePasswordPolicy(ctx)
	if err != nil {
		log.Ctx(ctx).Warn().Err(err).Str("user_id", userID).Msg("auth login warning: unable to load password policy")
		return nil
	}
	if policy.MaxAgeDays <= 0 {
		return nil
	}

	ts, err := s.queries.GetIdentityCredentialUpdatedAt(ctx, identityID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "42703" {
			// Missing migration/column; don't block login in mixed environments.
			log.Ctx(ctx).Warn().Str("user_id", userID).Msg("auth login warning: credential_updated_at column not available")
			return nil
		}
		log.Ctx(ctx).Warn().Err(err).Str("user_id", userID).Msg("auth login warning: unable to evaluate password expiry")
		return nil
	}

	if !ts.Valid {
		return nil
	}

	maxAge := time.Duration(policy.MaxAgeDays) * 24 * time.Hour
	if time.Now().After(ts.Time.Add(maxAge)) {
		log.Ctx(ctx).Warn().Str("user_id", userID).Msg("auth login blocked: password expired")
		return ErrPasswordExpired
	}
	return nil
}

type LegalDocRequirement struct {
	DocKey      string     `json:"doc_key"`
	Title       string     `json:"title"`
	Version     string     `json:"version"`
	ContentURL  string     `json:"content_url"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
}

type LegalAcceptanceRequiredError struct {
	Requirements []LegalDocRequirement `json:"requirements"`
	PreauthToken string                `json:"preauth_token,omitempty"`
}

func (e *LegalAcceptanceRequiredError) Error() string {
	return "legal acceptance required"
}

func (s *Service) mintLegalPreauthToken(userID string) (string, error) {
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return "", errors.New("invalid user id")
	}

	jwtSecrets, ok := security.ResolveJWTSecrets()
	if !ok || len(jwtSecrets) == 0 {
		return "", errors.New("server authentication is not configured")
	}

	now := time.Now().UTC()
	claims := jwt.MapClaims{
		"sub":     userID,
		"purpose": "legal_accept",
		"iat":     now.Unix(),
		"exp":     now.Add(10 * time.Minute).Unix(),
		"jti":     uuid.Must(uuid.NewV7()).String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecrets[0]))
}

func (s *Service) currentLegalRequirements(ctx context.Context) ([]LegalDocRequirement, error) {
	latest, err := s.queries.ListLatestActiveLegalDocVersions(ctx)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "42P01" {
			// Migration not applied yet. Fail open.
			return nil, nil
		}
		return nil, err
	}
	if len(latest) == 0 {
		return nil, nil
	}

	out := make([]LegalDocRequirement, 0, len(latest))
	for _, row := range latest {
		if !row.RequiresAcceptance {
			continue
		}
		req := LegalDocRequirement{
			DocKey:     strings.ToLower(strings.TrimSpace(row.DocKey)),
			Title:      strings.TrimSpace(row.Title),
			Version:    strings.TrimSpace(row.Version),
			ContentURL: strings.TrimSpace(row.ContentURL),
		}
		if row.PublishedAt.Valid {
			v := row.PublishedAt.Time
			req.PublishedAt = &v
		}
		out = append(out, req)
	}
	return out, nil
}

func (s *Service) missingLegalAcceptances(ctx context.Context, userID pgtype.UUID) ([]LegalDocRequirement, error) {
	requirements, err := s.currentLegalRequirements(ctx)
	if err != nil || len(requirements) == 0 {
		return nil, err
	}

	acceptances, err := s.queries.ListUserLegalAcceptances(ctx, userID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "42P01" {
			// Migration not applied yet. Fail open.
			return nil, nil
		}
		return nil, err
	}

	accepted := make(map[string]map[string]struct{})
	for _, a := range acceptances {
		key := strings.ToLower(strings.TrimSpace(a.DocKey))
		ver := strings.TrimSpace(a.Version)
		if key == "" || ver == "" {
			continue
		}
		m, ok := accepted[key]
		if !ok {
			m = make(map[string]struct{})
			accepted[key] = m
		}
		m[ver] = struct{}{}
	}

	missing := make([]LegalDocRequirement, 0)
	for _, req := range requirements {
		m, ok := accepted[req.DocKey]
		if !ok {
			missing = append(missing, req)
			continue
		}
		if _, ok := m[req.Version]; !ok {
			missing = append(missing, req)
		}
	}
	return missing, nil
}

type LegalAcceptanceInput struct {
	DocKey  string `json:"doc_key"`
	Version string `json:"version"`
}

func (s *Service) ListCurrentLegalDocs(ctx context.Context) ([]LegalDocRequirement, error) {
	return s.currentLegalRequirements(ctx)
}

func (s *Service) AcceptLegalDocs(ctx context.Context, userID string, accept []LegalAcceptanceInput, ipAddress string, userAgent string) error {
	var uid pgtype.UUID
	if err := uid.Scan(strings.TrimSpace(userID)); err != nil || !uid.Valid {
		return ErrUserNotFound
	}

	requirements, err := s.currentLegalRequirements(ctx)
	if err != nil {
		return err
	}
	if len(requirements) == 0 {
		return nil
	}

	requested := make(map[string]string)
	for _, item := range accept {
		key := strings.ToLower(strings.TrimSpace(item.DocKey))
		ver := strings.TrimSpace(item.Version)
		if key == "" || ver == "" {
			continue
		}
		requested[key] = ver
	}

	for _, req := range requirements {
		ver, ok := requested[req.DocKey]
		if !ok || strings.TrimSpace(ver) != req.Version {
			return errors.New("missing required legal acceptance")
		}
	}

	for _, req := range requirements {
		if err := s.queries.CreateUserLegalAcceptance(ctx, db.CreateUserLegalAcceptanceParams{
			UserID:    uid,
			DocKey:    req.DocKey,
			Version:   req.Version,
			IPAddress: strings.TrimSpace(ipAddress),
			UserAgent: strings.TrimSpace(userAgent),
			Metadata: map[string]interface{}{
				"source": "in_app",
			},
		}); err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "42P01" {
				// Migration not applied; enforcement is disabled in that environment.
				return nil
			}
			return err
		}
	}

	return nil
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
