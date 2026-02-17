package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/security"
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
	ErrInvalidLimitOverride   = errors.New("invalid tenant limit override")
	ErrCriticalModuleLocked   = errors.New("critical module cannot be disabled")
	ErrInvalidTrialAction     = errors.New("invalid trial action")
	ErrInvalidProrationPolicy = errors.New("invalid proration policy")
	ErrInvalidDunningRules    = errors.New("invalid dunning rules")
	ErrInvalidBillingLock     = errors.New("invalid billing lock action")
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

type TenantPlanChangeParams struct {
	PlanCode        string `json:"plan_code"`
	ProrationPolicy string `json:"proration_policy"`
	EffectiveAt     string `json:"effective_at"`
	Reason          string `json:"reason"`
	UpdatedBy       string `json:"-"`
}

type TenantPlanChangeResult struct {
	FromPlanCode       string     `json:"from_plan_code,omitempty"`
	ToPlanCode         string     `json:"to_plan_code"`
	ProrationPolicy    string     `json:"proration_policy"`
	EffectiveAt        *time.Time `json:"effective_at,omitempty"`
	SubscriptionStatus string     `json:"subscription_status"`
}

type TenantLimitOverrideParams struct {
	LimitKey   string `json:"limit_key"`
	LimitValue int64  `json:"limit_value"`
	ExpiresAt  string `json:"expires_at"`
	UpdatedBy  string `json:"-"`
}

type TenantLimitOverrideResult struct {
	LimitKey   string `json:"limit_key"`
	LimitValue int64  `json:"limit_value"`
	ExpiresAt  string `json:"expires_at,omitempty"`
}

type TenantTrialLifecycleParams struct {
	Action         string `json:"action"`
	Days           int    `json:"days"`
	RenewAfterDays int    `json:"renew_after_days"`
	UpdatedBy      string `json:"-"`
}

type TenantTrialLifecycleResult struct {
	Status        string     `json:"status"`
	TrialStartsAt *time.Time `json:"trial_starts_at,omitempty"`
	TrialEndsAt   *time.Time `json:"trial_ends_at,omitempty"`
	RenewsAt      *time.Time `json:"renews_at,omitempty"`
}

type TenantBillingControls struct {
	SubscriptionStatus string                 `json:"subscription_status"`
	DunningRules       map[string]interface{} `json:"dunning_rules"`
	GracePeriodEndsAt  *time.Time             `json:"grace_period_ends_at,omitempty"`
	BillingLocked      bool                   `json:"billing_locked"`
	LockReason         string                 `json:"lock_reason,omitempty"`
	UpdatedAt          *time.Time             `json:"updated_at,omitempty"`
}

type TenantDunningRulesParams struct {
	RetryCadenceDays []int    `json:"retry_cadence_days"`
	Channels         []string `json:"channels"`
	MaxRetries       int      `json:"max_retries"`
	GracePeriodDays  int      `json:"grace_period_days"`
	LockOnFailure    bool     `json:"lock_on_failure"`
	UpdatedBy        string   `json:"-"`
}

type TenantBillingLockParams struct {
	Action          string `json:"action"`
	GracePeriodDays int    `json:"grace_period_days"`
	Reason          string `json:"reason"`
	UpdatedBy       string `json:"-"`
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
	if err := ensureCriticalModulesEnabled(params.Modules); err != nil {
		return err
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

func (s *Service) ChangeTenantPlan(ctx context.Context, tenantID string, params TenantPlanChangeParams) (TenantPlanChangeResult, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantPlanChangeResult{}, err
	}

	targetPlanCode := strings.TrimSpace(strings.ToLower(params.PlanCode))
	if targetPlanCode == "" {
		return TenantPlanChangeResult{}, ErrInvalidPlanCode
	}

	prorationPolicy := strings.TrimSpace(strings.ToLower(params.ProrationPolicy))
	if prorationPolicy == "" {
		prorationPolicy = "prorated"
	}
	switch prorationPolicy {
	case "none", "immediate", "next_cycle", "prorated":
	default:
		return TenantPlanChangeResult{}, ErrInvalidProrationPolicy
	}

	var effectiveAt time.Time
	hasEffectiveAt := false
	if raw := strings.TrimSpace(params.EffectiveAt); raw != "" {
		parsed, err := time.Parse(time.RFC3339, raw)
		if err != nil {
			return TenantPlanChangeResult{}, ErrInvalidProrationPolicy
		}
		effectiveAt = parsed
		hasEffectiveAt = true
	}
	if !hasEffectiveAt {
		effectiveAt = time.Now().UTC()
	}

	var targetPlanID pgtype.UUID
	if err := s.db.QueryRow(ctx, `SELECT id FROM platform_plans WHERE code = $1 LIMIT 1`, targetPlanCode).Scan(&targetPlanID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return TenantPlanChangeResult{}, ErrPlanNotFound
		}
		return TenantPlanChangeResult{}, err
	}

	var fromPlanCode string
	_ = s.db.QueryRow(ctx, `
		SELECT COALESCE(pp.code, '')
		FROM tenant_subscriptions ts
		LEFT JOIN platform_plans pp ON pp.id = ts.plan_id
		WHERE ts.tenant_id = $1
		LIMIT 1
	`, tid).Scan(&fromPlanCode)

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO tenant_subscriptions (
			tenant_id,
			plan_id,
			status,
			overrides,
			updated_by,
			updated_at
		)
		VALUES (
			$1,
			$2,
			'active',
			jsonb_build_object(
				'last_plan_change',
				jsonb_build_object(
					'from_plan_code', $3::text,
					'to_plan_code', $4::text,
					'proration_policy', $5::text,
					'effective_at', $6::text,
					'reason', $7::text,
					'changed_at', NOW()::text
				)
			),
			$8,
			NOW()
		)
		ON CONFLICT (tenant_id)
		DO UPDATE SET
			plan_id = EXCLUDED.plan_id,
			status = 'active',
			overrides = jsonb_set(
				COALESCE(tenant_subscriptions.overrides, '{}'::jsonb),
				'{last_plan_change}',
				jsonb_build_object(
					'from_plan_code', $3::text,
					'to_plan_code', $4::text,
					'proration_policy', $5::text,
					'effective_at', $6::text,
					'reason', $7::text,
					'changed_at', NOW()::text
				),
				TRUE
			),
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
		RETURNING status
	`

	var status string
	if err := s.db.QueryRow(
		ctx,
		upsert,
		tid,
		targetPlanID,
		fromPlanCode,
		targetPlanCode,
		prorationPolicy,
		effectiveAt.Format(time.RFC3339),
		strings.TrimSpace(params.Reason),
		updatedBy,
	).Scan(&status); err != nil {
		return TenantPlanChangeResult{}, err
	}

	return TenantPlanChangeResult{
		FromPlanCode:       strings.TrimSpace(fromPlanCode),
		ToPlanCode:         targetPlanCode,
		ProrationPolicy:    prorationPolicy,
		EffectiveAt:        &effectiveAt,
		SubscriptionStatus: status,
	}, nil
}

func (s *Service) UpsertTenantLimitOverride(ctx context.Context, tenantID string, params TenantLimitOverrideParams) (TenantLimitOverrideResult, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantLimitOverrideResult{}, err
	}

	limitKey := strings.TrimSpace(strings.ToLower(params.LimitKey))
	if limitKey == "" {
		return TenantLimitOverrideResult{}, ErrInvalidLimitOverride
	}
	if params.LimitValue < 0 {
		return TenantLimitOverrideResult{}, ErrInvalidLimitOverride
	}

	expiresAt := strings.TrimSpace(params.ExpiresAt)
	if expiresAt != "" {
		if _, err := time.Parse(time.RFC3339, expiresAt); err != nil {
			return TenantLimitOverrideResult{}, ErrInvalidLimitOverride
		}
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO tenant_subscriptions (tenant_id, status, overrides, updated_by)
		VALUES (
			$1,
			'active',
			jsonb_build_object(
				'limits', jsonb_build_object($2::text, to_jsonb($3::bigint)),
				'limit_overrides_meta',
				CASE
					WHEN $4::text = '' THEN jsonb_build_object($2::text, 'null'::jsonb)
					ELSE jsonb_build_object($2::text, jsonb_build_object('expires_at', $4::text))
				END
			),
			$5
		)
		ON CONFLICT (tenant_id)
		DO UPDATE SET
			overrides = jsonb_set(
				jsonb_set(
					COALESCE(tenant_subscriptions.overrides, '{}'::jsonb),
					ARRAY['limits', $2::text],
					to_jsonb($3::bigint),
					TRUE
				),
				ARRAY['limit_overrides_meta', $2::text],
				CASE
					WHEN $4::text = '' THEN 'null'::jsonb
					ELSE jsonb_build_object('expires_at', $4::text)
				END,
				TRUE
			),
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	if _, err := s.db.Exec(ctx, upsert, tid, limitKey, params.LimitValue, expiresAt, updatedBy); err != nil {
		return TenantLimitOverrideResult{}, err
	}

	return TenantLimitOverrideResult{
		LimitKey:   limitKey,
		LimitValue: params.LimitValue,
		ExpiresAt:  expiresAt,
	}, nil
}

func (s *Service) ManageTenantTrialLifecycle(ctx context.Context, tenantID string, params TenantTrialLifecycleParams) (TenantTrialLifecycleResult, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantTrialLifecycleResult{}, err
	}

	action := strings.ToLower(strings.TrimSpace(params.Action))
	days := params.Days
	if days <= 0 {
		days = 14
	}
	renewAfterDays := params.RenewAfterDays
	if renewAfterDays <= 0 {
		renewAfterDays = 30
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	now := time.Now().UTC()
	var trialStartsAt pgtype.Timestamptz
	var trialEndsAt pgtype.Timestamptz
	var renewsAt pgtype.Timestamptz
	status := ""

	switch action {
	case "start":
		status = "trial"
		trialStartsAt = pgtype.Timestamptz{Time: now, Valid: true}
		trialEndsAt = pgtype.Timestamptz{Time: now.Add(time.Duration(days) * 24 * time.Hour), Valid: true}
		renewsAt = pgtype.Timestamptz{}
	case "extend":
		status = "trial"
		var currentTrialEnds pgtype.Timestamptz
		_ = s.db.QueryRow(ctx, `SELECT trial_ends_at FROM tenant_subscriptions WHERE tenant_id = $1`, tid).Scan(&currentTrialEnds)
		base := now
		if currentTrialEnds.Valid && currentTrialEnds.Time.After(now) {
			base = currentTrialEnds.Time
		}
		trialEndsAt = pgtype.Timestamptz{Time: base.Add(time.Duration(days) * 24 * time.Hour), Valid: true}
	case "convert_paid":
		status = "active"
		trialEndsAt = pgtype.Timestamptz{Time: now, Valid: true}
		renewsAt = pgtype.Timestamptz{Time: now.Add(time.Duration(renewAfterDays) * 24 * time.Hour), Valid: true}
	default:
		return TenantTrialLifecycleResult{}, ErrInvalidTrialAction
	}

	const upsert = `
		INSERT INTO tenant_subscriptions (
			tenant_id,
			status,
			trial_starts_at,
			trial_ends_at,
			renews_at,
			updated_by
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			$5,
			$6
		)
		ON CONFLICT (tenant_id)
		DO UPDATE SET
			status = EXCLUDED.status,
			trial_starts_at = COALESCE(EXCLUDED.trial_starts_at, tenant_subscriptions.trial_starts_at),
			trial_ends_at = COALESCE(EXCLUDED.trial_ends_at, tenant_subscriptions.trial_ends_at),
			renews_at = COALESCE(EXCLUDED.renews_at, tenant_subscriptions.renews_at),
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
		RETURNING status, trial_starts_at, trial_ends_at, renews_at
	`

	var out TenantTrialLifecycleResult
	var outTrialStarts pgtype.Timestamptz
	var outTrialEnds pgtype.Timestamptz
	var outRenews pgtype.Timestamptz

	if err := s.db.QueryRow(ctx, upsert, tid, status, trialStartsAt, trialEndsAt, renewsAt, updatedBy).Scan(
		&out.Status,
		&outTrialStarts,
		&outTrialEnds,
		&outRenews,
	); err != nil {
		return TenantTrialLifecycleResult{}, err
	}

	if outTrialStarts.Valid {
		v := outTrialStarts.Time
		out.TrialStartsAt = &v
	}
	if outTrialEnds.Valid {
		v := outTrialEnds.Time
		out.TrialEndsAt = &v
	}
	if outRenews.Valid {
		v := outRenews.Time
		out.RenewsAt = &v
	}

	return out, nil
}

func (s *Service) GetTenantBillingControls(ctx context.Context, tenantID string) (TenantBillingControls, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantBillingControls{}, err
	}

	const query = `
		SELECT
			COALESCE(ts.status, '') AS status,
			COALESCE(ts.dunning_rules, '{}'::jsonb) AS dunning_rules,
			ts.grace_period_ends_at,
			COALESCE(ts.overrides, '{}'::jsonb) AS overrides,
			ts.updated_at
		FROM tenant_subscriptions ts
		WHERE ts.tenant_id = $1
		LIMIT 1
	`

	var status string
	var dunningJSON []byte
	var graceEnds pgtype.Timestamptz
	var overridesJSON []byte
	var updatedAt pgtype.Timestamptz

	err = s.db.QueryRow(ctx, query, tid).Scan(&status, &dunningJSON, &graceEnds, &overridesJSON, &updatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return TenantBillingControls{
				SubscriptionStatus: "unknown",
				DunningRules:       map[string]interface{}{},
			}, nil
		}
		return TenantBillingControls{}, err
	}

	out := TenantBillingControls{
		SubscriptionStatus: strings.TrimSpace(status),
		DunningRules:       map[string]interface{}{},
	}
	if len(dunningJSON) > 0 {
		_ = json.Unmarshal(dunningJSON, &out.DunningRules)
	}
	if graceEnds.Valid {
		v := graceEnds.Time
		out.GracePeriodEndsAt = &v
	}
	if updatedAt.Valid {
		v := updatedAt.Time
		out.UpdatedAt = &v
	}

	overrides := map[string]interface{}{}
	if len(overridesJSON) > 0 {
		_ = json.Unmarshal(overridesJSON, &overrides)
	}
	if lockRaw, ok := overrides["billing_lock"].(map[string]interface{}); ok {
		if locked, ok := lockRaw["locked"].(bool); ok {
			out.BillingLocked = locked
		}
		if reason, ok := lockRaw["reason"].(string); ok {
			out.LockReason = strings.TrimSpace(reason)
		}
	}

	return out, nil
}

func (s *Service) UpdateTenantDunningRules(ctx context.Context, tenantID string, params TenantDunningRulesParams) (TenantBillingControls, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantBillingControls{}, err
	}

	cadence := make([]int, 0, len(params.RetryCadenceDays))
	for _, day := range params.RetryCadenceDays {
		if day <= 0 || day > 90 {
			return TenantBillingControls{}, ErrInvalidDunningRules
		}
		cadence = append(cadence, day)
	}
	if len(cadence) == 0 {
		cadence = []int{3, 7, 14}
	}

	channels := make([]string, 0, len(params.Channels))
	for _, channel := range params.Channels {
		c := strings.ToLower(strings.TrimSpace(channel))
		switch c {
		case "email", "sms", "whatsapp":
			channels = append(channels, c)
		case "":
		default:
			return TenantBillingControls{}, ErrInvalidDunningRules
		}
	}
	if len(channels) == 0 {
		channels = []string{"email"}
	}

	maxRetries := params.MaxRetries
	if maxRetries <= 0 {
		maxRetries = len(cadence)
	}
	if maxRetries <= 0 || maxRetries > 20 {
		return TenantBillingControls{}, ErrInvalidDunningRules
	}

	graceDays := params.GracePeriodDays
	if graceDays < 0 || graceDays > 180 {
		return TenantBillingControls{}, ErrInvalidDunningRules
	}
	if graceDays == 0 {
		graceDays = 7
	}

	dunningRules := map[string]interface{}{
		"retry_cadence_days": cadence,
		"channels":           channels,
		"max_retries":        maxRetries,
		"grace_period_days":  graceDays,
		"lock_on_failure":    params.LockOnFailure,
		"updated_at":         time.Now().UTC().Format(time.RFC3339),
	}
	dunningJSON, err := json.Marshal(dunningRules)
	if err != nil {
		return TenantBillingControls{}, err
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO tenant_subscriptions (tenant_id, status, dunning_rules, updated_by)
		VALUES ($1, 'trial', $2, $3)
		ON CONFLICT (tenant_id)
		DO UPDATE SET
			dunning_rules = EXCLUDED.dunning_rules,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`
	if _, err := s.db.Exec(ctx, upsert, tid, dunningJSON, updatedBy); err != nil {
		return TenantBillingControls{}, err
	}

	return s.GetTenantBillingControls(ctx, tenantID)
}

func (s *Service) ManageTenantBillingLock(ctx context.Context, tenantID string, params TenantBillingLockParams) (TenantBillingControls, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return TenantBillingControls{}, err
	}

	action := strings.ToLower(strings.TrimSpace(params.Action))
	switch action {
	case "start_grace", "lock", "unlock":
	default:
		return TenantBillingControls{}, ErrInvalidBillingLock
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))
	reason := strings.TrimSpace(params.Reason)
	now := time.Now().UTC()

	buildLockState := func(locked bool, graceEnds *time.Time) ([]byte, error) {
		lockState := map[string]interface{}{
			"locked":     locked,
			"reason":     reason,
			"updated_at": now.Format(time.RFC3339),
		}
		if locked {
			lockState["locked_at"] = now.Format(time.RFC3339)
		} else {
			lockState["unlocked_at"] = now.Format(time.RFC3339)
		}
		if graceEnds != nil {
			lockState["grace_period_ends_at"] = graceEnds.Format(time.RFC3339)
		}
		return json.Marshal(lockState)
	}

	switch action {
	case "start_grace":
		graceDays := params.GracePeriodDays
		if graceDays <= 0 {
			graceDays = 7
		}
		if graceDays > 180 {
			return TenantBillingControls{}, ErrInvalidBillingLock
		}
		graceEnds := now.Add(time.Duration(graceDays) * 24 * time.Hour)
		lockJSON, err := buildLockState(false, &graceEnds)
		if err != nil {
			return TenantBillingControls{}, err
		}

		const upsertGrace = `
			INSERT INTO tenant_subscriptions (
				tenant_id,
				status,
				grace_period_ends_at,
				overrides,
				updated_by
			)
			VALUES (
				$1,
				'active',
				$2,
				jsonb_build_object('billing_lock', $3::jsonb),
				$4
			)
			ON CONFLICT (tenant_id)
			DO UPDATE SET
				grace_period_ends_at = EXCLUDED.grace_period_ends_at,
				overrides = jsonb_set(
					COALESCE(tenant_subscriptions.overrides, '{}'::jsonb),
					'{billing_lock}',
					$3::jsonb,
					TRUE
				),
				updated_by = EXCLUDED.updated_by,
				updated_at = NOW()
		`
		if _, err := s.db.Exec(ctx, upsertGrace, tid, pgtype.Timestamptz{Time: graceEnds, Valid: true}, lockJSON, updatedBy); err != nil {
			return TenantBillingControls{}, err
		}
		_, _ = s.db.Exec(ctx, `UPDATE tenants SET is_active = TRUE, updated_at = NOW() WHERE id = $1`, tid)

	case "lock":
		var graceEnds pgtype.Timestamptz
		var graceEndsPtr *time.Time
		if params.GracePeriodDays > 0 {
			parsed := now.Add(time.Duration(params.GracePeriodDays) * 24 * time.Hour)
			graceEnds = pgtype.Timestamptz{Time: parsed, Valid: true}
			graceEndsPtr = &parsed
		}
		lockJSON, err := buildLockState(true, graceEndsPtr)
		if err != nil {
			return TenantBillingControls{}, err
		}

		const upsertLock = `
			INSERT INTO tenant_subscriptions (
				tenant_id,
				status,
				grace_period_ends_at,
				overrides,
				updated_by
			)
			VALUES (
				$1,
				'suspended',
				$2,
				jsonb_build_object('billing_lock', $3::jsonb),
				$4
			)
			ON CONFLICT (tenant_id)
			DO UPDATE SET
				status = 'suspended',
				grace_period_ends_at = COALESCE(EXCLUDED.grace_period_ends_at, tenant_subscriptions.grace_period_ends_at),
				overrides = jsonb_set(
					COALESCE(tenant_subscriptions.overrides, '{}'::jsonb),
					'{billing_lock}',
					$3::jsonb,
					TRUE
				),
				updated_by = EXCLUDED.updated_by,
				updated_at = NOW()
		`
		if _, err := s.db.Exec(ctx, upsertLock, tid, graceEnds, lockJSON, updatedBy); err != nil {
			return TenantBillingControls{}, err
		}
		_, _ = s.db.Exec(ctx, `UPDATE tenants SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, tid)

	case "unlock":
		lockJSON, err := buildLockState(false, nil)
		if err != nil {
			return TenantBillingControls{}, err
		}

		const upsertUnlock = `
			INSERT INTO tenant_subscriptions (
				tenant_id,
				status,
				grace_period_ends_at,
				overrides,
				updated_by
			)
			VALUES (
				$1,
				'active',
				NULL,
				jsonb_build_object('billing_lock', $2::jsonb),
				$3
			)
			ON CONFLICT (tenant_id)
			DO UPDATE SET
				status = 'active',
				grace_period_ends_at = NULL,
				overrides = jsonb_set(
					COALESCE(tenant_subscriptions.overrides, '{}'::jsonb),
					'{billing_lock}',
					$2::jsonb,
					TRUE
				),
				updated_by = EXCLUDED.updated_by,
				updated_at = NOW()
		`
		if _, err := s.db.Exec(ctx, upsertUnlock, tid, lockJSON, updatedBy); err != nil {
			return TenantBillingControls{}, err
		}
		_, _ = s.db.Exec(ctx, `UPDATE tenants SET is_active = TRUE, updated_at = NOW() WHERE id = $1`, tid)
	}

	return s.GetTenantBillingControls(ctx, tenantID)
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
	newPassword = strings.TrimSpace(newPassword)
	if newPassword == "" {
		return 0, ErrWeakPassword
	}
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return 0, err
	}

	const selectAdmins = `
		SELECT DISTINCT ra.user_id
		FROM role_assignments ra
		JOIN roles r ON r.id = ra.role_id
		WHERE ra.tenant_id = $1
		  AND r.code = 'tenant_admin'
	`
	adminRows, err := s.db.Query(ctx, selectAdmins, tid)
	if err != nil {
		return 0, err
	}
	defer adminRows.Close()

	adminUserIDs := make([]pgtype.UUID, 0, 2)
	for adminRows.Next() {
		var uid pgtype.UUID
		if err := adminRows.Scan(&uid); err != nil {
			return 0, err
		}
		adminUserIDs = append(adminUserIDs, uid)
	}
	if err := adminRows.Err(); err != nil {
		return 0, err
	}

	var credentialHash string
	for _, uid := range adminUserIDs {
		_, hash, err := s.validatePasswordAgainstPolicy(ctx, uid.String(), newPassword)
		if err != nil {
			return 0, err
		}
		credentialHash = hash
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

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
	tag, err := tx.Exec(ctx, query, tid, credentialHash)
	if err != nil {
		return 0, err
	}

	// Best-effort: also track credential age when migrations are applied.
	if _, err := tx.Exec(ctx, `
		UPDATE user_identities ui
		SET credential_updated_at = NOW()
		WHERE ui.provider = 'password'
		  AND ui.user_id IN (
			SELECT ra.user_id
			FROM role_assignments ra
			JOIN roles r ON r.id = ra.role_id
			WHERE ra.tenant_id = $1
			  AND r.code = 'tenant_admin'
		  )
	`, tid); err != nil {
		var pgErr *pgconn.PgError
		if !errors.As(err, &pgErr) || pgErr.Code != "42703" {
			return 0, err
		}
	}

	for _, uid := range adminUserIDs {
		if _, err := tx.Exec(ctx, `
			INSERT INTO user_credential_history (user_id, provider, credential_hash, created_at)
			VALUES ($1, 'password', $2, NOW())
			ON CONFLICT (user_id, provider, credential_hash) DO NOTHING
		`, uid, credentialHash); err != nil {
			var pgErr *pgconn.PgError
			if !errors.As(err, &pgErr) || pgErr.Code != "42P01" {
				return 0, err
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
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

	jwtSecrets, ok := security.ResolveJWTSecrets()
	if !ok || len(jwtSecrets) == 0 {
		return ImpersonationResult{}, errors.New("JWT secrets are not configured")
	}
	jwtSecret := jwtSecrets[0]

	// Session-backed auth requires a token ID and a persisted session record, otherwise
	// the middleware will reject the token with 401.
	tokenJTI := uuid.Must(uuid.NewV7()).String()

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
		"jti":                  tokenJTI,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return ImpersonationResult{}, err
	}

	var targetUserUUID pgtype.UUID
	if err := targetUserUUID.Scan(strings.TrimSpace(result.TargetUserID)); err != nil || !targetUserUUID.Valid {
		return ImpersonationResult{}, errors.New("invalid impersonation target user id")
	}
	if err := s.q.CreateSessionRecord(ctx, targetUserUUID, auth.HashPasswordForSeed(tokenJTI), expiresAt); err != nil {
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
