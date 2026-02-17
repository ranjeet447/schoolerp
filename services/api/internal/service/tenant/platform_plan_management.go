package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
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
