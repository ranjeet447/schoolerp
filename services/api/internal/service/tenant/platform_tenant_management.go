package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/service/auth"
)

var (
	ErrInvalidLifecycleStatus = errors.New("invalid lifecycle status")
	ErrInvalidPlanCode        = errors.New("invalid plan code")
	ErrPlanNotFound           = errors.New("plan not found")
	ErrImpersonationTarget    = errors.New("tenant admin account not found")
	ErrWeakPassword           = errors.New("password must be at least 8 characters")
	ErrInvalidReason          = errors.New("reason is required")
	ErrInvalidSignupStatus    = errors.New("invalid signup review status")
	ErrSignupRequestNotFound  = errors.New("signup request not found")
)

type TenantDirectoryFilters struct {
	IncludeInactive bool
	Search          string
	PlanCode        string
	Status          string
	Region          string
	CreatedFrom     *time.Time
	CreatedTo       *time.Time
	Limit           int32
	Offset          int32
	SortBy          string
	SortOrder       string
}

type TenantLifecycleParams struct {
	Status    string `json:"status"`
	UpdatedBy string `json:"-"`
}

type TenantDefaultsParams struct {
	Timezone     string `json:"timezone"`
	Locale       string `json:"locale"`
	AcademicYear string `json:"academic_year"`
	Region       string `json:"region"`
}

type DomainMappingParams struct {
	Domain      string `json:"domain"`
	CnameTarget string `json:"cname_target"`
	SslStatus   string `json:"ssl_status"`
}

type TenantBrandingParams struct {
	WhiteLabel *bool `json:"white_label"`
	Branding   struct {
		PrimaryColor *string `json:"primary_color"`
		NameOverride *string `json:"name_override"`
		LogoURL      *string `json:"logo_url"`
	} `json:"branding"`
}

type AssignPlanParams struct {
	PlanCode  string                 `json:"plan_code"`
	Limits    map[string]interface{} `json:"limits"`
	Modules   map[string]interface{} `json:"modules"`
	Flags     map[string]interface{} `json:"feature_flags"`
	UpdatedBy string                 `json:"-"`
}

type ImpersonationParams struct {
	Reason          string `json:"reason"`
	DurationMinutes int    `json:"duration_minutes"`
}

type ImpersonationResult struct {
	Token            string    `json:"token"`
	TargetUserID     string    `json:"target_user_id"`
	TargetUserEmail  string    `json:"target_user_email"`
	TargetTenantID   string    `json:"target_tenant_id"`
	TargetTenantName string    `json:"target_tenant_name"`
	ExpiresAt        time.Time `json:"expires_at"`
}

type PlatformSignupRequest struct {
	ID                string    `json:"id"`
	SchoolName        string    `json:"school_name"`
	ContactName       string    `json:"contact_name,omitempty"`
	ContactEmail      string    `json:"contact_email"`
	Phone             string    `json:"phone,omitempty"`
	City              string    `json:"city,omitempty"`
	Country           string    `json:"country,omitempty"`
	StudentCountRange string    `json:"student_count_range,omitempty"`
	Status            string    `json:"status"`
	ReviewNotes       string    `json:"review_notes,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	ReviewedAt        time.Time `json:"reviewed_at,omitempty"`
	ReviewedBy        string    `json:"reviewed_by,omitempty"`
}

type ReviewSignupRequestParams struct {
	Status      string `json:"status"`
	ReviewNotes string `json:"review_notes"`
	ReviewedBy  string `json:"-"`
}

type PlatformAuditEntry struct {
	TenantID     string
	Action       string
	ResourceType string
	ResourceID   string
	Reason       string
	Before       any
	After        any
}

type ImpersonationExitParams struct {
	Reason             string `json:"reason"`
	ImpersonationNotes string `json:"impersonation_notes"`
	TargetUserID       string `json:"target_user_id"`
	TargetUserEmail    string `json:"target_user_email"`
	StartedAt          string `json:"started_at"`
}

func (s *Service) logPlatformAudit(
	ctx context.Context,
	tenantID pgtype.UUID,
	userID string,
	action string,
	resourceType string,
	resourceID string,
	reason string,
	before any,
	after any,
) {
	var actorID pgtype.UUID
	_ = actorID.Scan(strings.TrimSpace(userID))

	var targetID pgtype.UUID
	_ = targetID.Scan(strings.TrimSpace(resourceID))

	var beforeJSON []byte
	if before != nil {
		if raw, err := json.Marshal(before); err == nil {
			beforeJSON = raw
		}
	}
	var afterJSON []byte
	if after != nil {
		if raw, err := json.Marshal(after); err == nil {
			afterJSON = raw
		}
	}

	_, _ = s.q.CreateAuditLog(ctx, db.CreateAuditLogParams{
		TenantID:     tenantID,
		UserID:       actorID,
		RequestID:    pgtype.Text{},
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   targetID,
		BeforeState:  beforeJSON,
		AfterState:   afterJSON,
		ReasonCode:   pgtype.Text{String: strings.TrimSpace(reason), Valid: strings.TrimSpace(reason) != ""},
		IpAddress:    pgtype.Text{},
	})
}

func (s *Service) RecordPlatformAudit(ctx context.Context, actorUserID string, entry PlatformAuditEntry) {
	var tid pgtype.UUID
	_ = tid.Scan(strings.TrimSpace(entry.TenantID))

	resourceID := strings.TrimSpace(entry.ResourceID)
	if resourceID == "" {
		resourceID = strings.TrimSpace(entry.TenantID)
	}

	s.logPlatformAudit(
		ctx,
		tid,
		actorUserID,
		strings.TrimSpace(entry.Action),
		strings.TrimSpace(entry.ResourceType),
		resourceID,
		strings.TrimSpace(entry.Reason),
		entry.Before,
		entry.After,
	)
}

func (s *Service) LogImpersonationExit(ctx context.Context, tenantID, actorUserID string, params ImpersonationExitParams) error {
	if _, err := parseTenantUUID(tenantID); err != nil {
		return err
	}

	startedAt := strings.TrimSpace(params.StartedAt)
	durationMinutes := int64(0)
	if startedAt != "" {
		if started, err := time.Parse(time.RFC3339, startedAt); err == nil {
			durationMinutes = int64(time.Since(started).Minutes())
			if durationMinutes < 0 {
				durationMinutes = 0
			}
		}
	}

	s.RecordPlatformAudit(ctx, actorUserID, PlatformAuditEntry{
		TenantID:     tenantID,
		Action:       "platform.tenant.impersonation.exit",
		ResourceType: "tenant",
		ResourceID:   tenantID,
		Reason:       strings.TrimSpace(params.Reason),
		Before: map[string]any{
			"target_user_id":    strings.TrimSpace(params.TargetUserID),
			"target_user_email": strings.TrimSpace(params.TargetUserEmail),
			"started_at":        startedAt,
		},
		After: map[string]any{
			"ended_at":              time.Now().UTC(),
			"duration_minutes":      durationMinutes,
			"impersonation_context": strings.TrimSpace(params.ImpersonationNotes),
		},
	})

	return nil
}

func (s *Service) ListPlatformTenantsWithFilters(ctx context.Context, filters TenantDirectoryFilters) ([]PlatformTenant, error) {
	return s.ListPlatformTenants(ctx, filters)
}

func (s *Service) UpsertTenantLifecycle(ctx context.Context, tenantID string, params TenantLifecycleParams) error {
	status := strings.ToLower(strings.TrimSpace(params.Status))
	switch status {
	case "trial", "active", "suspended", "closed":
	default:
		return ErrInvalidLifecycleStatus
	}

	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return err
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsertSub = `
		INSERT INTO tenant_subscriptions (tenant_id, status, updated_by)
		VALUES ($1, $2, $3)
		ON CONFLICT (tenant_id)
		DO UPDATE SET
			status = EXCLUDED.status,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	if _, err := s.db.Exec(ctx, upsertSub, tid, status, updatedBy); err != nil {
		return err
	}

	isActive := status == "trial" || status == "active"
	_, err = s.db.Exec(ctx, `UPDATE tenants SET is_active = $2, updated_at = NOW() WHERE id = $1`, tid, isActive)
	return err
}

func (s *Service) AssignPlanToTenant(ctx context.Context, tenantID string, params AssignPlanParams) error {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return err
	}

	planCode := strings.TrimSpace(strings.ToLower(params.PlanCode))
	if planCode == "" {
		return ErrInvalidPlanCode
	}

	var planID pgtype.UUID
	if err := s.db.QueryRow(ctx, `SELECT id FROM platform_plans WHERE code = $1 LIMIT 1`, planCode).Scan(&planID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrPlanNotFound
		}
		return err
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	overrides := map[string]interface{}{
		"limits":        params.Limits,
		"modules":       params.Modules,
		"feature_flags": params.Flags,
	}
	overridesJSON, err := json.Marshal(overrides)
	if err != nil {
		return err
	}

	const upsertSub = `
		INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, overrides, updated_by)
		VALUES ($1, $2, 'active', $3, $4)
		ON CONFLICT (tenant_id)
		DO UPDATE SET
			plan_id = EXCLUDED.plan_id,
			overrides = EXCLUDED.overrides,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	_, err = s.db.Exec(ctx, upsertSub, tid, planID, overridesJSON, updatedBy)
	return err
}

func (s *Service) UpdateTenantDefaults(ctx context.Context, tenantID string, params TenantDefaultsParams) error {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return err
	}

	t, err := s.q.GetTenantByID(ctx, tid)
	if err != nil {
		return err
	}

	config := map[string]interface{}{}
	if len(t.Config) > 0 {
		_ = json.Unmarshal(t.Config, &config)
	}

	if strings.TrimSpace(params.Timezone) != "" {
		config["timezone"] = strings.TrimSpace(params.Timezone)
	}
	if strings.TrimSpace(params.Locale) != "" {
		config["locale"] = strings.TrimSpace(params.Locale)
	}
	if strings.TrimSpace(params.AcademicYear) != "" {
		config["academic_year"] = strings.TrimSpace(params.AcademicYear)
	}
	if strings.TrimSpace(params.Region) != "" {
		config["region"] = strings.TrimSpace(params.Region)
	}

	configJSON, err := json.Marshal(config)
	if err != nil {
		return err
	}

	_, err = s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{ID: tid, Config: configJSON})
	return err
}

func (s *Service) UpdateTenantDomainMapping(ctx context.Context, tenantID string, params DomainMappingParams) (PlatformTenant, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformTenant{}, err
	}

	t, err := s.q.GetTenantByID(ctx, tid)
	if err != nil {
		return PlatformTenant{}, err
	}

	config := map[string]interface{}{}
	if len(t.Config) > 0 {
		_ = json.Unmarshal(t.Config, &config)
	}
	if strings.TrimSpace(params.CnameTarget) != "" {
		config["cname_target"] = strings.TrimSpace(params.CnameTarget)
	}
	if strings.TrimSpace(params.SslStatus) != "" {
		config["ssl_status"] = strings.TrimSpace(params.SslStatus)
	}
	configJSON, err := json.Marshal(config)
	if err != nil {
		return PlatformTenant{}, err
	}

	_, err = s.db.Exec(
		ctx,
		`UPDATE tenants SET domain = NULLIF($2, ''), config = $3, updated_at = NOW() WHERE id = $1`,
		tid,
		strings.TrimSpace(params.Domain),
		configJSON,
	)
	if err != nil {
		return PlatformTenant{}, err
	}

	return s.GetPlatformTenant(ctx, tenantID)
}

func (s *Service) UpdateTenantBranding(ctx context.Context, tenantID string, params TenantBrandingParams) (PlatformTenant, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformTenant{}, err
	}

	t, err := s.q.GetTenantByID(ctx, tid)
	if err != nil {
		return PlatformTenant{}, err
	}

	config := map[string]interface{}{}
	if len(t.Config) > 0 {
		_ = json.Unmarshal(t.Config, &config)
	}

	if params.WhiteLabel != nil {
		config["white_label"] = *params.WhiteLabel
	}

	branding := map[string]interface{}{}
	if existing, ok := config["branding"].(map[string]interface{}); ok {
		branding = existing
	}

	if params.Branding.PrimaryColor != nil {
		branding["primary_color"] = strings.TrimSpace(*params.Branding.PrimaryColor)
	}
	if params.Branding.NameOverride != nil {
		branding["name_override"] = strings.TrimSpace(*params.Branding.NameOverride)
	}
	if params.Branding.LogoURL != nil {
		branding["logo_url"] = strings.TrimSpace(*params.Branding.LogoURL)
	}

	config["branding"] = branding

	configJSON, err := json.Marshal(config)
	if err != nil {
		return PlatformTenant{}, err
	}

	if _, err := s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{ID: tid, Config: configJSON}); err != nil {
		return PlatformTenant{}, err
	}

	return s.GetPlatformTenant(ctx, tenantID)
}

func (s *Service) ResetTenantAdminPassword(ctx context.Context, tenantID, newPassword string) (int64, error) {
	if len(strings.TrimSpace(newPassword)) < 8 {
		return 0, ErrWeakPassword
	}
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return 0, err
	}

	const query = `
		UPDATE user_identities ui
		SET credential = $2
		WHERE ui.provider = 'password'
		  AND ui.user_id IN (
			SELECT ra.user_id
			FROM role_assignments ra
			JOIN roles r ON r.id = ra.role_id
			WHERE ra.tenant_id = $1
			  AND r.code = 'tenant_admin'
		  )
	`
	tag, err := s.db.Exec(ctx, query, tid, auth.HashPasswordForSeed(strings.TrimSpace(newPassword)))
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (s *Service) ForceLogoutTenantUsers(ctx context.Context, tenantID string) (int64, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return 0, err
	}

	const query = `
		DELETE FROM sessions
		WHERE user_id IN (
			SELECT DISTINCT user_id
			FROM role_assignments
			WHERE tenant_id = $1
		)
	`
	tag, err := s.db.Exec(ctx, query, tid)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (s *Service) CreateImpersonationToken(ctx context.Context, tenantID, reason string, durationMinutes int, impersonatorUserID string) (ImpersonationResult, error) {
	if strings.TrimSpace(reason) == "" {
		return ImpersonationResult{}, ErrInvalidReason
	}
	if durationMinutes <= 0 || durationMinutes > 60 {
		durationMinutes = 30
	}

	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return ImpersonationResult{}, err
	}

	const query = `
		SELECT
			u.id::text,
			COALESCE(u.email, '') AS email,
			t.id::text,
			t.name
		FROM role_assignments ra
		JOIN roles r ON r.id = ra.role_id
		JOIN users u ON u.id = ra.user_id
		JOIN tenants t ON t.id = ra.tenant_id
		WHERE ra.tenant_id = $1
		  AND r.code = 'tenant_admin'
		  AND u.is_active = TRUE
		ORDER BY ra.created_at ASC
		LIMIT 1
	`

	var result ImpersonationResult
	if err := s.db.QueryRow(ctx, query, tid).Scan(
		&result.TargetUserID,
		&result.TargetUserEmail,
		&result.TargetTenantID,
		&result.TargetTenantName,
	); err != nil {
		return ImpersonationResult{}, ErrImpersonationTarget
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return ImpersonationResult{}, errors.New("JWT_SECRET is not configured")
	}

	expiresAt := time.Now().Add(time.Duration(durationMinutes) * time.Minute)
	claims := jwt.MapClaims{
		"sub":                  result.TargetUserID,
		"role":                 "tenant_admin",
		"tenant_id":            result.TargetTenantID,
		"email":                result.TargetUserEmail,
		"impersonated":         true,
		"impersonated_by":      impersonatorUserID,
		"impersonation_reason": strings.TrimSpace(reason),
		"iat":                  time.Now().Unix(),
		"exp":                  expiresAt.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return ImpersonationResult{}, err
	}

	result.Token = tokenString
	result.ExpiresAt = expiresAt

	s.logPlatformAudit(
		ctx,
		tid,
		impersonatorUserID,
		"platform.tenant.impersonate",
		"tenant",
		tenantID,
		strings.TrimSpace(reason),
		nil,
		map[string]any{
			"target_user_id":       result.TargetUserID,
			"target_user_email":    result.TargetUserEmail,
			"duration_minutes":     durationMinutes,
			"impersonation_expiry": expiresAt,
		},
	)

	return result, nil
}

func (s *Service) ListSignupRequests(ctx context.Context, status string, limit int32) ([]PlatformSignupRequest, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	const query = `
		SELECT
			id::text,
			school_name,
			COALESCE(contact_name, '') AS contact_name,
			contact_email,
			COALESCE(phone, '') AS phone,
			COALESCE(city, '') AS city,
			COALESCE(country, '') AS country,
			COALESCE(student_count_range, '') AS student_count_range,
			status,
			COALESCE(review_notes, '') AS review_notes,
			created_at,
			COALESCE(reviewed_at, created_at) AS reviewed_at,
			COALESCE(reviewed_by::text, '') AS reviewed_by
		FROM tenant_signup_requests
		WHERE ($1::text = '' OR status = $1)
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := s.db.Query(ctx, query, strings.TrimSpace(status), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]PlatformSignupRequest, 0)
	for rows.Next() {
		var row PlatformSignupRequest
		if err := rows.Scan(
			&row.ID,
			&row.SchoolName,
			&row.ContactName,
			&row.ContactEmail,
			&row.Phone,
			&row.City,
			&row.Country,
			&row.StudentCountRange,
			&row.Status,
			&row.ReviewNotes,
			&row.CreatedAt,
			&row.ReviewedAt,
			&row.ReviewedBy,
		); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, rows.Err()
}

func (s *Service) ReviewSignupRequest(ctx context.Context, signupID string, params ReviewSignupRequestParams) error {
	status := strings.ToLower(strings.TrimSpace(params.Status))
	if status != "approved" && status != "rejected" {
		return ErrInvalidSignupStatus
	}

	const lookup = `
		SELECT status, COALESCE(review_notes, '')
		FROM tenant_signup_requests
		WHERE id = $1
	`
	var beforeStatus string
	var beforeNotes string
	if err := s.db.QueryRow(ctx, lookup, signupID).Scan(&beforeStatus, &beforeNotes); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrSignupRequestNotFound
		}
		return err
	}

	var reviewer pgtype.UUID
	_ = reviewer.Scan(strings.TrimSpace(params.ReviewedBy))

	const query = `
		UPDATE tenant_signup_requests
		SET
			status = $2,
			review_notes = $3,
			reviewed_by = $4,
			reviewed_at = NOW()
		WHERE id = $1
	`
	tag, err := s.db.Exec(ctx, query, signupID, status, strings.TrimSpace(params.ReviewNotes), reviewer)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrSignupRequestNotFound
	}

	s.logPlatformAudit(
		ctx,
		pgtype.UUID{},
		params.ReviewedBy,
		"platform.signup.review",
		"tenant_signup_request",
		signupID,
		status,
		map[string]any{
			"status":       beforeStatus,
			"review_notes": beforeNotes,
		},
		map[string]any{
			"status":       status,
			"review_notes": strings.TrimSpace(params.ReviewNotes),
		},
	)

	return nil
}
