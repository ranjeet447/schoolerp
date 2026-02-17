package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidPlanID      = errors.New("invalid plan id")
	ErrInvalidPlanPayload = errors.New("invalid plan payload")
	ErrPlanCodeExists     = errors.New("plan code already exists")
	ErrInvalidRollout     = errors.New("invalid feature rollout payload")
)

type PlatformPlanFilters struct {
	IncludeInactive bool
	Search          string
}

type PlatformPlan struct {
	ID           string                 `json:"id"`
	Code         string                 `json:"code"`
	Name         string                 `json:"name"`
	Description  string                 `json:"description,omitempty"`
	PriceMonthly int64                  `json:"price_monthly"`
	PriceYearly  int64                  `json:"price_yearly"`
	Modules      map[string]interface{} `json:"modules"`
	Limits       map[string]interface{} `json:"limits"`
	FeatureFlags map[string]interface{} `json:"feature_flags"`
	IsActive     bool                   `json:"is_active"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

type CreatePlatformPlanParams struct {
	Code         string                 `json:"code"`
	Name         string                 `json:"name"`
	Description  string                 `json:"description"`
	PriceMonthly int64                  `json:"price_monthly"`
	PriceYearly  int64                  `json:"price_yearly"`
	Modules      map[string]interface{} `json:"modules"`
	Limits       map[string]interface{} `json:"limits"`
	FeatureFlags map[string]interface{} `json:"feature_flags"`
	IsActive     *bool                  `json:"is_active"`
	CreatedBy    string                 `json:"-"`
}

type UpdatePlatformPlanParams struct {
	Code         *string                `json:"code"`
	Name         *string                `json:"name"`
	Description  *string                `json:"description"`
	PriceMonthly *int64                 `json:"price_monthly"`
	PriceYearly  *int64                 `json:"price_yearly"`
	Modules      map[string]interface{} `json:"modules"`
	Limits       map[string]interface{} `json:"limits"`
	FeatureFlags map[string]interface{} `json:"feature_flags"`
	IsActive     *bool                  `json:"is_active"`
}

type ClonePlatformPlanParams struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
	CreatedBy   string `json:"-"`
}

type FeatureRolloutParams struct {
	FlagKey    string   `json:"flag_key"`
	Enabled    bool     `json:"enabled"`
	Percentage int      `json:"percentage"`
	PlanCode   string   `json:"plan_code"`
	Region     string   `json:"region"`
	Status     string   `json:"status"`
	TenantIDs  []string `json:"tenant_ids"`
	DryRun     bool     `json:"dry_run"`
	UpdatedBy  string   `json:"-"`
}

type FeatureRolloutResult struct {
	FlagKey      string   `json:"flag_key"`
	Enabled      bool     `json:"enabled"`
	Percentage   int      `json:"percentage"`
	TotalMatched int64    `json:"total_matched"`
	AppliedCount int64    `json:"applied_count"`
	TenantIDs    []string `json:"tenant_ids"`
	DryRun       bool     `json:"dry_run"`
}

func (s *Service) ListPlatformPlans(ctx context.Context, filters PlatformPlanFilters) ([]PlatformPlan, error) {
	const query = `
		SELECT
			id::text,
			code,
			name,
			COALESCE(description, '') AS description,
			price_monthly,
			price_yearly,
			modules,
			limits,
			feature_flags,
			is_active,
			created_at,
			updated_at
		FROM platform_plans
		WHERE ($1::bool = TRUE OR is_active = TRUE)
		  AND (
		    $2::text = ''
		    OR code ILIKE '%' || $2 || '%'
		    OR name ILIKE '%' || $2 || '%'
		  )
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(ctx, query, filters.IncludeInactive, strings.TrimSpace(filters.Search))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	plans := make([]PlatformPlan, 0)
	for rows.Next() {
		row, err := scanPlatformPlan(rows)
		if err != nil {
			return nil, err
		}
		plans = append(plans, row)
	}
	return plans, rows.Err()
}

func (s *Service) CreatePlatformPlan(ctx context.Context, params CreatePlatformPlanParams) (PlatformPlan, error) {
	code := normalizePlanCode(params.Code)
	if code == "" {
		return PlatformPlan{}, ErrInvalidPlanCode
	}

	name := strings.TrimSpace(params.Name)
	if name == "" {
		return PlatformPlan{}, fmt.Errorf("%w: name is required", ErrInvalidPlanPayload)
	}
	if params.PriceMonthly < 0 || params.PriceYearly < 0 {
		return PlatformPlan{}, fmt.Errorf("%w: price cannot be negative", ErrInvalidPlanPayload)
	}
	if err := ensureCriticalModulesEnabled(params.Modules); err != nil {
		return PlatformPlan{}, err
	}

	modulesJSON, err := marshalJSONMap(params.Modules)
	if err != nil {
		return PlatformPlan{}, err
	}
	limitsJSON, err := marshalJSONMap(params.Limits)
	if err != nil {
		return PlatformPlan{}, err
	}
	flagsJSON, err := marshalJSONMap(params.FeatureFlags)
	if err != nil {
		return PlatformPlan{}, err
	}

	isActive := true
	if params.IsActive != nil {
		isActive = *params.IsActive
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	const query = `
		INSERT INTO platform_plans (
			code, name, description, price_monthly, price_yearly, modules, limits, feature_flags, is_active, created_by
		)
		VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, $10)
		RETURNING
			id::text,
			code,
			name,
			COALESCE(description, '') AS description,
			price_monthly,
			price_yearly,
			modules,
			limits,
			feature_flags,
			is_active,
			created_at,
			updated_at
	`

	row, err := scanPlatformPlan(s.db.QueryRow(
		ctx,
		query,
		code,
		name,
		strings.TrimSpace(params.Description),
		params.PriceMonthly,
		params.PriceYearly,
		modulesJSON,
		limitsJSON,
		flagsJSON,
		isActive,
		createdBy,
	))
	if err != nil {
		if isUniqueViolation(err) {
			return PlatformPlan{}, ErrPlanCodeExists
		}
		return PlatformPlan{}, err
	}
	return row, nil
}

func (s *Service) UpdatePlatformPlan(ctx context.Context, planID string, params UpdatePlatformPlanParams) (PlatformPlan, error) {
	pid, err := parsePlanUUID(planID)
	if err != nil {
		return PlatformPlan{}, err
	}

	setClauses := make([]string, 0, 8)
	args := []interface{}{pid}
	argIndex := 2

	if params.Code != nil {
		code := normalizePlanCode(*params.Code)
		if code == "" {
			return PlatformPlan{}, ErrInvalidPlanCode
		}
		setClauses = append(setClauses, fmt.Sprintf("code = $%d", argIndex))
		args = append(args, code)
		argIndex++
	}

	if params.Name != nil {
		name := strings.TrimSpace(*params.Name)
		if name == "" {
			return PlatformPlan{}, fmt.Errorf("%w: name is required", ErrInvalidPlanPayload)
		}
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, name)
		argIndex++
	}

	if params.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = NULLIF($%d, '')", argIndex))
		args = append(args, strings.TrimSpace(*params.Description))
		argIndex++
	}

	if params.PriceMonthly != nil {
		if *params.PriceMonthly < 0 {
			return PlatformPlan{}, fmt.Errorf("%w: price_monthly cannot be negative", ErrInvalidPlanPayload)
		}
		setClauses = append(setClauses, fmt.Sprintf("price_monthly = $%d", argIndex))
		args = append(args, *params.PriceMonthly)
		argIndex++
	}

	if params.PriceYearly != nil {
		if *params.PriceYearly < 0 {
			return PlatformPlan{}, fmt.Errorf("%w: price_yearly cannot be negative", ErrInvalidPlanPayload)
		}
		setClauses = append(setClauses, fmt.Sprintf("price_yearly = $%d", argIndex))
		args = append(args, *params.PriceYearly)
		argIndex++
	}

	if params.Modules != nil {
		if err := ensureCriticalModulesEnabled(params.Modules); err != nil {
			return PlatformPlan{}, err
		}
		modulesJSON, err := marshalJSONMap(params.Modules)
		if err != nil {
			return PlatformPlan{}, err
		}
		setClauses = append(setClauses, fmt.Sprintf("modules = $%d", argIndex))
		args = append(args, modulesJSON)
		argIndex++
	}

	if params.Limits != nil {
		limitsJSON, err := marshalJSONMap(params.Limits)
		if err != nil {
			return PlatformPlan{}, err
		}
		setClauses = append(setClauses, fmt.Sprintf("limits = $%d", argIndex))
		args = append(args, limitsJSON)
		argIndex++
	}

	if params.FeatureFlags != nil {
		flagsJSON, err := marshalJSONMap(params.FeatureFlags)
		if err != nil {
			return PlatformPlan{}, err
		}
		setClauses = append(setClauses, fmt.Sprintf("feature_flags = $%d", argIndex))
		args = append(args, flagsJSON)
		argIndex++
	}

	if params.IsActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *params.IsActive)
		argIndex++
	}

	if len(setClauses) == 0 {
		return s.getPlatformPlan(ctx, pid)
	}

	query := fmt.Sprintf(`
		UPDATE platform_plans
		SET %s, updated_at = NOW()
		WHERE id = $1
		RETURNING
			id::text,
			code,
			name,
			COALESCE(description, '') AS description,
			price_monthly,
			price_yearly,
			modules,
			limits,
			feature_flags,
			is_active,
			created_at,
			updated_at
	`, strings.Join(setClauses, ", "))

	row, err := scanPlatformPlan(s.db.QueryRow(ctx, query, args...))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformPlan{}, ErrPlanNotFound
		}
		if isUniqueViolation(err) {
			return PlatformPlan{}, ErrPlanCodeExists
		}
		return PlatformPlan{}, err
	}
	return row, nil
}

func (s *Service) ClonePlatformPlan(ctx context.Context, sourcePlanID string, params ClonePlatformPlanParams) (PlatformPlan, error) {
	sourcePlanUUID, err := parsePlanUUID(sourcePlanID)
	if err != nil {
		return PlatformPlan{}, err
	}

	source, err := s.getPlatformPlan(ctx, sourcePlanUUID)
	if err != nil {
		return PlatformPlan{}, err
	}

	code := normalizePlanCode(params.Code)
	if code == "" {
		return PlatformPlan{}, ErrInvalidPlanCode
	}

	name := strings.TrimSpace(params.Name)
	if name == "" {
		name = strings.TrimSpace(source.Name) + " Copy"
	}
	description := strings.TrimSpace(params.Description)
	if description == "" {
		description = source.Description
	}

	isActive := source.IsActive
	if params.IsActive != nil {
		isActive = *params.IsActive
	}

	modulesJSON, err := marshalJSONMap(source.Modules)
	if err != nil {
		return PlatformPlan{}, err
	}
	limitsJSON, err := marshalJSONMap(source.Limits)
	if err != nil {
		return PlatformPlan{}, err
	}
	flagsJSON, err := marshalJSONMap(source.FeatureFlags)
	if err != nil {
		return PlatformPlan{}, err
	}

	var createdBy pgtype.UUID
	_ = createdBy.Scan(strings.TrimSpace(params.CreatedBy))

	const query = `
		INSERT INTO platform_plans (
			code, name, description, price_monthly, price_yearly, modules, limits, feature_flags, is_active, created_by
		)
		VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6, $7, $8, $9, $10)
		RETURNING
			id::text,
			code,
			name,
			COALESCE(description, '') AS description,
			price_monthly,
			price_yearly,
			modules,
			limits,
			feature_flags,
			is_active,
			created_at,
			updated_at
	`

	row, err := scanPlatformPlan(s.db.QueryRow(
		ctx,
		query,
		code,
		name,
		description,
		source.PriceMonthly,
		source.PriceYearly,
		modulesJSON,
		limitsJSON,
		flagsJSON,
		isActive,
		createdBy,
	))
	if err != nil {
		if isUniqueViolation(err) {
			return PlatformPlan{}, ErrPlanCodeExists
		}
		return PlatformPlan{}, err
	}
	return row, nil
}

func (s *Service) RolloutFeatureFlag(ctx context.Context, params FeatureRolloutParams) (FeatureRolloutResult, error) {
	flagKey := strings.TrimSpace(params.FlagKey)
	if flagKey == "" {
		return FeatureRolloutResult{}, fmt.Errorf("%w: flag_key is required", ErrInvalidRollout)
	}
	if params.Percentage <= 0 || params.Percentage > 100 {
		return FeatureRolloutResult{}, fmt.Errorf("%w: percentage must be between 1 and 100", ErrInvalidRollout)
	}

	status := strings.ToLower(strings.TrimSpace(params.Status))
	if status != "" {
		switch status {
		case "trial", "active", "suspended", "closed":
		default:
			return FeatureRolloutResult{}, fmt.Errorf("%w: invalid status", ErrInvalidRollout)
		}
	}

	tenantIDs := make([]string, 0, len(params.TenantIDs))
	seen := map[string]bool{}
	for _, raw := range params.TenantIDs {
		id := strings.TrimSpace(raw)
		if id == "" || seen[id] {
			continue
		}
		seen[id] = true
		tenantIDs = append(tenantIDs, id)
	}

	const query = `
		SELECT t.id::text
		FROM tenants t
		LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
		LEFT JOIN platform_plans pp ON pp.id = ts.plan_id
		WHERE
			($1::text = '' OR LOWER(COALESCE(pp.code, '')) = LOWER($1))
			AND ($2::text = '' OR LOWER(COALESCE(t.config->>'region', '')) = LOWER($2))
			AND ($3::text = '' OR LOWER(COALESCE(ts.status, 'trial')) = LOWER($3))
			AND (COALESCE(array_length($4::text[], 1), 0) = 0 OR t.id::text = ANY($4::text[]))
		ORDER BY t.created_at ASC
	`
	rows, err := s.db.Query(
		ctx,
		query,
		strings.TrimSpace(params.PlanCode),
		strings.TrimSpace(params.Region),
		status,
		tenantIDs,
	)
	if err != nil {
		return FeatureRolloutResult{}, err
	}
	defer rows.Close()

	matchedTenantIDs := make([]string, 0)
	for rows.Next() {
		var tenantID string
		if err := rows.Scan(&tenantID); err != nil {
			return FeatureRolloutResult{}, err
		}
		matchedTenantIDs = append(matchedTenantIDs, tenantID)
	}
	if err := rows.Err(); err != nil {
		return FeatureRolloutResult{}, err
	}

	result := FeatureRolloutResult{
		FlagKey:      flagKey,
		Enabled:      params.Enabled,
		Percentage:   params.Percentage,
		TotalMatched: int64(len(matchedTenantIDs)),
		DryRun:       params.DryRun,
	}
	if len(matchedTenantIDs) == 0 {
		return result, nil
	}

	applyCount := int(math.Ceil(float64(len(matchedTenantIDs)) * float64(params.Percentage) / 100.0))
	if applyCount < 1 {
		applyCount = 1
	}
	if applyCount > len(matchedTenantIDs) {
		applyCount = len(matchedTenantIDs)
	}

	selectedTenantIDs := matchedTenantIDs[:applyCount]
	result.AppliedCount = int64(len(selectedTenantIDs))
	result.TenantIDs = selectedTenantIDs

	if params.DryRun {
		return result, nil
	}

	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO tenant_subscriptions (tenant_id, status, overrides, updated_by)
		VALUES (
			$1,
			'trial',
			jsonb_build_object('feature_flags', jsonb_build_object($2::text, to_jsonb($3::boolean))),
			$4
		)
		ON CONFLICT (tenant_id)
		DO UPDATE SET
			overrides = jsonb_set(
				COALESCE(tenant_subscriptions.overrides, '{}'::jsonb),
				ARRAY['feature_flags', $2::text],
				to_jsonb($3::boolean),
				TRUE
			),
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`

	for _, tenantID := range selectedTenantIDs {
		tid, err := parseTenantUUID(tenantID)
		if err != nil {
			return FeatureRolloutResult{}, err
		}
		if _, err := s.db.Exec(ctx, upsert, tid, flagKey, params.Enabled, updatedBy); err != nil {
			return FeatureRolloutResult{}, err
		}
	}

	return result, nil
}

func (s *Service) getPlatformPlan(ctx context.Context, planID pgtype.UUID) (PlatformPlan, error) {
	const query = `
		SELECT
			id::text,
			code,
			name,
			COALESCE(description, '') AS description,
			price_monthly,
			price_yearly,
			modules,
			limits,
			feature_flags,
			is_active,
			created_at,
			updated_at
		FROM platform_plans
		WHERE id = $1
	`

	row, err := scanPlatformPlan(s.db.QueryRow(ctx, query, planID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformPlan{}, ErrPlanNotFound
		}
		return PlatformPlan{}, err
	}
	return row, nil
}

type planRowScanner interface {
	Scan(dest ...interface{}) error
}

func scanPlatformPlan(scanner planRowScanner) (PlatformPlan, error) {
	var row PlatformPlan
	var modulesJSON []byte
	var limitsJSON []byte
	var featureFlagsJSON []byte

	if err := scanner.Scan(
		&row.ID,
		&row.Code,
		&row.Name,
		&row.Description,
		&row.PriceMonthly,
		&row.PriceYearly,
		&modulesJSON,
		&limitsJSON,
		&featureFlagsJSON,
		&row.IsActive,
		&row.CreatedAt,
		&row.UpdatedAt,
	); err != nil {
		return PlatformPlan{}, err
	}

	row.Modules = map[string]interface{}{}
	row.Limits = map[string]interface{}{}
	row.FeatureFlags = map[string]interface{}{}

	if len(modulesJSON) > 0 {
		if err := json.Unmarshal(modulesJSON, &row.Modules); err != nil {
			return PlatformPlan{}, err
		}
	}
	if len(limitsJSON) > 0 {
		if err := json.Unmarshal(limitsJSON, &row.Limits); err != nil {
			return PlatformPlan{}, err
		}
	}
	if len(featureFlagsJSON) > 0 {
		if err := json.Unmarshal(featureFlagsJSON, &row.FeatureFlags); err != nil {
			return PlatformPlan{}, err
		}
	}

	return row, nil
}

func parsePlanUUID(raw string) (pgtype.UUID, error) {
	var pid pgtype.UUID
	if err := pid.Scan(strings.TrimSpace(raw)); err != nil || !pid.Valid {
		return pgtype.UUID{}, ErrInvalidPlanID
	}
	return pid, nil
}

func normalizePlanCode(raw string) string {
	return strings.ToLower(strings.TrimSpace(raw))
}

func marshalJSONMap(value map[string]interface{}) ([]byte, error) {
	if value == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(value)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
