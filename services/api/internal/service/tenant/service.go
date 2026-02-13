package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/service/auth"
)

type Service struct {
	q  *db.Queries
	db *pgxpool.Pool
}

func NewService(q *db.Queries, pool *pgxpool.Pool) *Service {
	return &Service{q: q, db: pool}
}

type TenantConfig struct {
	WhiteLabel bool            `json:"white_label"`
	Branding   BrandingConfig  `json:"branding"`
}

type BrandingConfig struct {
	PrimaryColor string `json:"primary_color,omitempty"`
	NameOverride string `json:"name_override,omitempty"`
	LogoURL      string `json:"logo_url,omitempty"`
}

type PluginMetadata struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"`
	Config      map[string]interface{} `json:"config_schema,omitempty"` // For dynamic form generation
}

var SystemPlugins = []PluginMetadata{
	{
		ID:          "payments_razorpay",
		Name:        "Razorpay Payments",
		Description: "Accept online payments via Razorpay gateway.",
		Category:    "Finance",
		Config: map[string]interface{}{
			"key_id":     "text",
			"key_secret": "password",
		},
	},
	{
		ID:          "notifications_sms",
		Name:        "SMS Gateway",
		Description: "Send automated SMS notifications to parents and staff.",
		Category:    "Communication",
		Config: map[string]interface{}{
			"provider": "text", // e.g. "twilio", "msg91"
			"api_key":  "password",
		},
	},
	{
		ID:          "analytics_google",
		Name:        "Google Analytics",
		Description: "Track website traffic and user engagement.",
		Category:    "Marketing",
		Config: map[string]interface{}{
			"tracking_id": "text",
		},
	},
	{
		ID:          "ai_suite_v1",
		Name:        "AI Suite (Practical AI)",
		Description: "Enable AI Teacher Copilot and Parent Helpdesk.",
		Category:    "AI & Automation",
		Config: map[string]interface{}{
			"enable_teacher_copilot": "boolean",
			"enable_parent_helpdesk": "boolean",
			"monthly_budget_cap":    "number",
		},
	},
}

func (s *Service) GetConfig(ctx context.Context, tenantIDOrSubdomain string) (map[string]interface{}, error) {
	t, err := s.q.GetTenantBySubdomain(ctx, tenantIDOrSubdomain)
	if err != nil {
		return nil, err
	}

	var config map[string]interface{}
	if err := json.Unmarshal(t.Config, &config); err != nil {
		return nil, err
	}
    
    config["name"] = t.Name

	return config, nil
}

func (s *Service) UpdateConfig(ctx context.Context, tenantID string, config map[string]interface{}) error {
	configBytes, err := json.Marshal(config)
	if err != nil {
		return err
	}

	var tid pgtype.UUID
	if err := tid.Scan(tenantID); err != nil {
		return err
	}

	_, err = s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{
		ID:     tid,
		Config: configBytes,
	})
	return err
}

func (s *Service) ListPlugins(ctx context.Context, tenantSubdomain string) ([]map[string]interface{}, error) {
	t, err := s.q.GetTenantBySubdomain(ctx, tenantSubdomain)
	if err != nil {
		return nil, err
	}

	var config map[string]interface{}
	if err := json.Unmarshal(t.Config, &config); err != nil {
		config = make(map[string]interface{})
	}

	pluginsConfig, ok := config["plugins"].(map[string]interface{})
	if !ok {
		pluginsConfig = make(map[string]interface{})
	}

	result := make([]map[string]interface{}, len(SystemPlugins))
	for i, p := range SystemPlugins {
		pluginState, ok := pluginsConfig[p.ID].(map[string]interface{})
		isEnabled := false
		var settings interface{}

		if ok {
			isEnabled, _ = pluginState["enabled"].(bool)
			settings = pluginState["settings"]
		}

		result[i] = map[string]interface{}{
			"metadata": p,
			"enabled":  isEnabled,
			"settings": settings,
		}
	}

	return result, nil
}

func (s *Service) UpdatePluginConfig(ctx context.Context, tenantID string, pluginID string, enabled bool, settings map[string]interface{}) error {
	var tid pgtype.UUID
	if err := tid.Scan(tenantID); err != nil {
		return err
	}

	t, err := s.q.GetTenantByID(ctx, tid)
	if err != nil {
		return err
	}

	var config map[string]interface{}
	if err := json.Unmarshal(t.Config, &config); err != nil {
		config = make(map[string]interface{})
	}

	pluginsConfig, ok := config["plugins"].(map[string]interface{})
	if !ok {
		pluginsConfig = make(map[string]interface{})
	}

	pluginsConfig[pluginID] = map[string]interface{}{
		"enabled":  enabled,
		"settings": settings,
	}

	config["plugins"] = pluginsConfig
	configBytes, err := json.Marshal(config)
	if err != nil {
		return err
	}

	_, err = s.q.UpdateTenantConfig(ctx, db.UpdateTenantConfigParams{
		ID:     tid,
		Config: configBytes,
	})
	return err
}

type OnboardSchoolParams struct {
	Name         string `json:"name"`
	Subdomain    string `json:"subdomain"`
	Domain       string `json:"domain"`
	AdminName    string `json:"admin_name"`
	AdminEmail   string `json:"admin_email"`
	AdminPhone   string `json:"admin_phone"`
	Password     string `json:"password"`
}

var (
	ErrInvalidTenantID = errors.New("invalid tenant id")
	ErrTenantNotFound  = errors.New("tenant not found")
	ErrInvalidBranch   = errors.New("invalid branch payload")
	ErrInvalidBranchID = errors.New("invalid branch id")
	ErrBranchNotFound  = errors.New("branch not found")
	ErrInvalidTenant   = errors.New("invalid tenant payload")
)

type PlatformSummary struct {
	TotalTenants     int64 `json:"total_tenants"`
	ActiveTenants    int64 `json:"active_tenants"`
	TotalBranches    int64 `json:"total_branches"`
	TotalStudents    int64 `json:"total_students"`
	TotalEmployees   int64 `json:"total_employees"`
	TotalReceipts    int64 `json:"total_receipts"`
	TotalCollections int64 `json:"total_collections"`
}

type PlatformTenant struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Subdomain        string    `json:"subdomain"`
	Domain           string    `json:"domain,omitempty"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	LifecycleStatus  string    `json:"lifecycle_status"`
	PlanCode         string    `json:"plan_code,omitempty"`
	Region           string    `json:"region,omitempty"`
	Timezone         string    `json:"timezone,omitempty"`
	Locale           string    `json:"locale,omitempty"`
	AcademicYear     string    `json:"academic_year,omitempty"`
	CnameTarget      string    `json:"cname_target,omitempty"`
	SslStatus        string    `json:"ssl_status,omitempty"`
	BranchCount      int64     `json:"branch_count"`
	StudentCount     int64     `json:"student_count"`
	EmployeeCount    int64     `json:"employee_count"`
	ReceiptCount     int64     `json:"receipt_count"`
	TotalCollections int64     `json:"total_collections"`
}

type PlatformPayment struct {
	ID            string    `json:"id"`
	TenantID      string    `json:"tenant_id"`
	TenantName    string    `json:"tenant_name"`
	ReceiptNumber string    `json:"receipt_number"`
	AmountPaid    int64     `json:"amount_paid"`
	PaymentMode   string    `json:"payment_mode"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type PlatformBranch struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Address   string    `json:"address,omitempty"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateBranchParams struct {
	Name    string `json:"name"`
	Code    string `json:"code"`
	Address string `json:"address"`
}

type UpdateBranchParams struct {
	Name     *string `json:"name"`
	Address  *string `json:"address"`
	IsActive *bool   `json:"is_active"`
}

type UpdateTenantParams struct {
	Name      *string `json:"name"`
	Subdomain *string `json:"subdomain"`
	Domain    *string `json:"domain"`
	IsActive  *bool   `json:"is_active"`
}

func (s *Service) OnboardSchool(ctx context.Context, params OnboardSchoolParams) (string, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	qtx := s.q.WithTx(tx)

	// 1. Create Tenant
	tenantID := uuid.Must(uuid.NewV7())
	var tid pgtype.UUID
	tid.Scan(tenantID.String())

	config := map[string]interface{}{
		"white_label": false,
		"branding": map[string]string{
			"primary_color": "#4f46e5",
		},
	}
	configBytes, _ := json.Marshal(config)

	_, err = qtx.CreateTenant(ctx, db.CreateTenantParams{
		ID:        tid,
		Name:      params.Name,
		Subdomain: params.Subdomain,
		Domain:    pgtype.Text{String: params.Domain, Valid: params.Domain != ""},
		Config:    configBytes,
		IsActive:  pgtype.Bool{Bool: true, Valid: true},
	})
	if err != nil {
		return "", fmt.Errorf("failed to create tenant: %w", err)
	}

	// 2. Create Admin User
	userID := uuid.Must(uuid.NewV7())
	var uid pgtype.UUID
	uid.Scan(userID.String())

	_, err = qtx.CreateUser(ctx, db.CreateUserParams{
		ID:       uid,
		Email:    pgtype.Text{String: params.AdminEmail, Valid: true},
		Phone:    pgtype.Text{String: params.AdminPhone, Valid: params.AdminPhone != ""},
		FullName: params.AdminName,
		IsActive: pgtype.Bool{Bool: true, Valid: true},
	})
	if err != nil {
		return "", fmt.Errorf("failed to create admin user: %w", err)
	}

	// 3. Create Password Identity
	identityID := uuid.Must(uuid.NewV7())
	var iid pgtype.UUID
	iid.Scan(identityID.String())

	_, err = qtx.CreateUserIdentity(ctx, db.CreateUserIdentityParams{
		ID:         iid,
		UserID:     uid,
		Provider:   "password",
		Identifier: params.AdminEmail,
		Credential: pgtype.Text{String: auth.HashPasswordForSeed(params.Password), Valid: true},
	})
	if err != nil {
		return "", fmt.Errorf("failed to create user identity: %w", err)
	}

	// 4. Assign Tenant Admin Role
	// Note: We need the system role ID for 'tenant_admin'
	// For simplicity, we'll look it up by code
	roles, err := qtx.ListRolesByTenant(ctx, tid)
	if err != nil {
		return "", fmt.Errorf("failed to list roles: %w", err)
	}
    
    var adminRoleID pgtype.UUID
    for _, r := range roles {
        if r.Code == "tenant_admin" {
            adminRoleID = r.ID
            break
        }
    }

    if adminRoleID.Valid == false {
        return "", fmt.Errorf("tenant_admin role not found")
    }

	err = qtx.AssignRoleToUser(ctx, db.AssignRoleToUserParams{
		TenantID:  tid,
		UserID:    uid,
		RoleID:    adminRoleID,
		ScopeType: "tenant",
	})
	if err != nil {
		return "", fmt.Errorf("failed to assign role: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}

	return tenantID.String(), nil
}

func (s *Service) GetPlatformSummary(ctx context.Context) (PlatformSummary, error) {
	const query = `
		SELECT
			(SELECT COUNT(*) FROM tenants) AS total_tenants,
			(SELECT COUNT(*) FROM tenants WHERE is_active = TRUE) AS active_tenants,
			(SELECT COUNT(*) FROM branches WHERE is_active = TRUE) AS total_branches,
			(SELECT COUNT(*) FROM students WHERE status = 'active') AS total_students,
			(SELECT COUNT(*) FROM employees WHERE status = 'active') AS total_employees,
			(SELECT COUNT(*) FROM receipts) AS total_receipts,
			COALESCE((SELECT SUM(amount_paid)::BIGINT FROM receipts), 0) AS total_collections
	`

	var summary PlatformSummary
	err := s.db.QueryRow(ctx, query).Scan(
		&summary.TotalTenants,
		&summary.ActiveTenants,
		&summary.TotalBranches,
		&summary.TotalStudents,
		&summary.TotalEmployees,
		&summary.TotalReceipts,
		&summary.TotalCollections,
	)
	return summary, err
}

func (s *Service) ListPlatformTenants(ctx context.Context, filters TenantDirectoryFilters) ([]PlatformTenant, error) {
	baseQuery := `
		SELECT
			t.id::text,
			t.name,
			t.subdomain,
			COALESCE(t.domain, '') AS domain,
			t.is_active,
			t.created_at,
			COALESCE(ts.status, 'trial') AS lifecycle_status,
			COALESCE(pp.code, '') AS plan_code,
			COALESCE(t.config->>'region', '') AS region,
			COALESCE(t.config->>'timezone', '') AS timezone,
			COALESCE(t.config->>'locale', '') AS locale,
			COALESCE(t.config->>'academic_year', '') AS academic_year,
			COALESCE(t.config->>'cname_target', '') AS cname_target,
			COALESCE(t.config->>'ssl_status', '') AS ssl_status,
			COALESCE(b.total_branches, 0) AS branch_count,
			COALESCE(st.total_students, 0) AS student_count,
			COALESCE(e.total_employees, 0) AS employee_count,
			COALESCE(r.total_receipts, 0) AS receipt_count,
			COALESCE(r.total_collections, 0) AS total_collections
		FROM tenants t
		LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
		LEFT JOIN platform_plans pp ON pp.id = ts.plan_id
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS total_branches
			FROM branches b
			WHERE b.tenant_id = t.id
		) b ON TRUE
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS total_students
			FROM students s
			WHERE s.tenant_id = t.id
		) st ON TRUE
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS total_employees
			FROM employees e
			WHERE e.tenant_id = t.id
		) e ON TRUE
			LEFT JOIN LATERAL (
				SELECT COUNT(*) AS total_receipts, COALESCE(SUM(amount_paid)::BIGINT, 0) AS total_collections
				FROM receipts r
				WHERE r.tenant_id = t.id
			) r ON TRUE
		WHERE ($1::bool = TRUE OR t.is_active = TRUE)
		  AND ($2::text = '' OR (
		    t.name ILIKE '%' || $2 || '%'
		    OR t.subdomain ILIKE '%' || $2 || '%'
		    OR COALESCE(t.domain, '') ILIKE '%' || $2 || '%'
		  ))
		  AND ($3::text = '' OR LOWER(COALESCE(ts.status, 'trial')) = LOWER($3))
		  AND (
		    $4::text = ''
		    OR (LOWER($4::text) = 'none' AND COALESCE(pp.code, '') = '')
		    OR LOWER(COALESCE(pp.code, '')) = LOWER($4)
		  )
		  AND ($5::text = '' OR LOWER(COALESCE(t.config->>'region', '')) = LOWER($5))
		  AND ($6::timestamptz IS NULL OR t.created_at >= $6)
		  AND ($7::timestamptz IS NULL OR t.created_at <= $7)
	`

	limit := filters.Limit
	if limit <= 0 || limit > 500 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	sortBy := strings.ToLower(strings.TrimSpace(filters.SortBy))
	sortOrder := strings.ToLower(strings.TrimSpace(filters.SortOrder))
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	sortExpr := "t.created_at"
	switch sortBy {
	case "", "created_at", "created":
		sortExpr = "t.created_at"
	case "name":
		sortExpr = "t.name"
	case "subdomain":
		sortExpr = "t.subdomain"
	}

	query := fmt.Sprintf("%s ORDER BY %s %s LIMIT $8 OFFSET $9", baseQuery, sortExpr, strings.ToUpper(sortOrder))

	rows, err := s.db.Query(ctx, query,
		filters.IncludeInactive,
		strings.TrimSpace(filters.Search),
		strings.TrimSpace(filters.Status),
		strings.TrimSpace(filters.PlanCode),
		strings.TrimSpace(filters.Region),
		filters.CreatedFrom,
		filters.CreatedTo,
		limit,
		offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tenants := make([]PlatformTenant, 0)
	for rows.Next() {
		var row PlatformTenant
		if err := rows.Scan(
			&row.ID,
			&row.Name,
			&row.Subdomain,
			&row.Domain,
			&row.IsActive,
			&row.CreatedAt,
			&row.LifecycleStatus,
			&row.PlanCode,
			&row.Region,
			&row.Timezone,
			&row.Locale,
			&row.AcademicYear,
			&row.CnameTarget,
			&row.SslStatus,
			&row.BranchCount,
			&row.StudentCount,
			&row.EmployeeCount,
			&row.ReceiptCount,
			&row.TotalCollections,
		); err != nil {
			return nil, err
		}
		tenants = append(tenants, row)
	}
	return tenants, rows.Err()
}

func (s *Service) GetPlatformTenant(ctx context.Context, tenantID string) (PlatformTenant, error) {
	const query = `
		SELECT
			t.id::text,
			t.name,
			t.subdomain,
			COALESCE(t.domain, '') AS domain,
			t.is_active,
			t.created_at,
			COALESCE(ts.status, 'trial') AS lifecycle_status,
			COALESCE(pp.code, '') AS plan_code,
			COALESCE(t.config->>'region', '') AS region,
			COALESCE(t.config->>'timezone', '') AS timezone,
			COALESCE(t.config->>'locale', '') AS locale,
			COALESCE(t.config->>'academic_year', '') AS academic_year,
			COALESCE(t.config->>'cname_target', '') AS cname_target,
			COALESCE(t.config->>'ssl_status', '') AS ssl_status,
			COALESCE(b.total_branches, 0) AS branch_count,
			COALESCE(st.total_students, 0) AS student_count,
			COALESCE(e.total_employees, 0) AS employee_count,
			COALESCE(r.total_receipts, 0) AS receipt_count,
			COALESCE(r.total_collections, 0) AS total_collections
		FROM tenants t
		LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
		LEFT JOIN platform_plans pp ON pp.id = ts.plan_id
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS total_branches
			FROM branches b
			WHERE b.tenant_id = t.id
		) b ON TRUE
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS total_students
			FROM students s
			WHERE s.tenant_id = t.id
		) st ON TRUE
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS total_employees
			FROM employees e
			WHERE e.tenant_id = t.id
		) e ON TRUE
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS total_receipts, COALESCE(SUM(amount_paid)::BIGINT, 0) AS total_collections
			FROM receipts r
			WHERE r.tenant_id = t.id
		) r ON TRUE
		WHERE t.id = $1
	`

	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformTenant{}, err
	}

	var row PlatformTenant
	err = s.db.QueryRow(ctx, query, tid).Scan(
		&row.ID,
		&row.Name,
		&row.Subdomain,
		&row.Domain,
		&row.IsActive,
		&row.CreatedAt,
		&row.LifecycleStatus,
		&row.PlanCode,
		&row.Region,
		&row.Timezone,
		&row.Locale,
		&row.AcademicYear,
		&row.CnameTarget,
		&row.SslStatus,
		&row.BranchCount,
		&row.StudentCount,
		&row.EmployeeCount,
		&row.ReceiptCount,
		&row.TotalCollections,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return PlatformTenant{}, ErrTenantNotFound
	}
	return row, err
}

func (s *Service) UpdatePlatformTenant(ctx context.Context, tenantID string, params UpdateTenantParams) (PlatformTenant, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformTenant{}, err
	}

	setClauses := make([]string, 0, 4)
	args := []interface{}{tid}
	argIndex := 2

	if params.Name != nil {
		name := strings.TrimSpace(*params.Name)
		if name == "" {
			return PlatformTenant{}, fmt.Errorf("%w: name is required", ErrInvalidTenant)
		}
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, name)
		argIndex++
	}

	if params.Subdomain != nil {
		subdomain := strings.TrimSpace(*params.Subdomain)
		if subdomain == "" {
			return PlatformTenant{}, fmt.Errorf("%w: subdomain is required", ErrInvalidTenant)
		}
		setClauses = append(setClauses, fmt.Sprintf("subdomain = $%d", argIndex))
		args = append(args, subdomain)
		argIndex++
	}

	if params.Domain != nil {
		domain := strings.TrimSpace(*params.Domain)
		if domain == "" {
			setClauses = append(setClauses, "domain = NULL")
		} else {
			setClauses = append(setClauses, fmt.Sprintf("domain = $%d", argIndex))
			args = append(args, domain)
			argIndex++
		}
	}

	if params.IsActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *params.IsActive)
		argIndex++
	}

	if len(setClauses) == 0 {
		return s.GetPlatformTenant(ctx, tenantID)
	}

	query := fmt.Sprintf("UPDATE tenants SET %s, updated_at = NOW() WHERE id = $1", strings.Join(setClauses, ", "))
	res, err := s.db.Exec(ctx, query, args...)
	if err != nil {
		return PlatformTenant{}, err
	}
	if res.RowsAffected() == 0 {
		return PlatformTenant{}, ErrTenantNotFound
	}

	return s.GetPlatformTenant(ctx, tenantID)
}

func (s *Service) ListTenantBranches(ctx context.Context, tenantID string) ([]PlatformBranch, error) {
	const query = `
		SELECT
			id::text,
			tenant_id::text,
			name,
			code,
			COALESCE(address, '') AS address,
			is_active,
			created_at,
			updated_at
		FROM branches
		WHERE tenant_id = $1
		ORDER BY created_at ASC
	`

	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, query, tid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	branches := make([]PlatformBranch, 0)
	for rows.Next() {
		var row PlatformBranch
		if err := rows.Scan(
			&row.ID,
			&row.TenantID,
			&row.Name,
			&row.Code,
			&row.Address,
			&row.IsActive,
			&row.CreatedAt,
			&row.UpdatedAt,
		); err != nil {
			return nil, err
		}
		branches = append(branches, row)
	}
	return branches, rows.Err()
}

func (s *Service) CreateTenantBranch(ctx context.Context, tenantID string, params CreateBranchParams) (PlatformBranch, error) {
	const query = `
		INSERT INTO branches (tenant_id, name, code, address, is_active)
		VALUES ($1, $2, $3, NULLIF($4, ''), TRUE)
		RETURNING id::text, tenant_id::text, name, code, COALESCE(address, ''), is_active, created_at, updated_at
	`

	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformBranch{}, err
	}

	name := strings.TrimSpace(params.Name)
	code := strings.ToUpper(strings.TrimSpace(params.Code))
	address := strings.TrimSpace(params.Address)
	if name == "" || code == "" {
		return PlatformBranch{}, ErrInvalidBranch
	}

	var row PlatformBranch
	err = s.db.QueryRow(ctx, query, tid, name, code, address).Scan(
		&row.ID,
		&row.TenantID,
		&row.Name,
		&row.Code,
		&row.Address,
		&row.IsActive,
		&row.CreatedAt,
		&row.UpdatedAt,
	)
	return row, err
}

func (s *Service) UpdateTenantBranch(ctx context.Context, tenantID, branchID string, params UpdateBranchParams) (PlatformBranch, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return PlatformBranch{}, err
	}

	var bid pgtype.UUID
	if err := bid.Scan(strings.TrimSpace(branchID)); err != nil || !bid.Valid {
		return PlatformBranch{}, ErrInvalidBranchID
	}

	setClauses := make([]string, 0, 3)
	args := []interface{}{tid, bid}
	argIndex := 3

	if params.Name != nil {
		name := strings.TrimSpace(*params.Name)
		if name == "" {
			return PlatformBranch{}, ErrInvalidBranch
		}
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, name)
		argIndex++
	}

	if params.Address != nil {
		address := strings.TrimSpace(*params.Address)
		setClauses = append(setClauses, fmt.Sprintf("address = NULLIF($%d, '')", argIndex))
		args = append(args, address)
		argIndex++
	}

	if params.IsActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *params.IsActive)
		argIndex++
	}

	if len(setClauses) == 0 {
		return PlatformBranch{}, ErrInvalidBranch
	}

	query := fmt.Sprintf(`
		UPDATE branches
		SET %s, updated_at = NOW()
		WHERE tenant_id = $1 AND id = $2
		RETURNING id::text, tenant_id::text, name, code, COALESCE(address, ''), is_active, created_at, updated_at
	`, strings.Join(setClauses, ", "))

	var row PlatformBranch
	err = s.db.QueryRow(ctx, query, args...).Scan(
		&row.ID,
		&row.TenantID,
		&row.Name,
		&row.Code,
		&row.Address,
		&row.IsActive,
		&row.CreatedAt,
		&row.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return PlatformBranch{}, ErrBranchNotFound
	}
	return row, err
}

func (s *Service) ListPlatformPayments(ctx context.Context, limit int32) ([]PlatformPayment, error) {
	const query = `
		SELECT
			r.id::text,
			r.tenant_id::text,
			t.name,
			r.receipt_number,
			r.amount_paid,
			r.payment_mode,
			COALESCE(r.status, 'posted') AS status,
			r.created_at
		FROM receipts r
		JOIN tenants t ON t.id = r.tenant_id
		ORDER BY r.created_at DESC
		LIMIT $1
	`

	if limit <= 0 || limit > 500 {
		limit = 100
	}

	rows, err := s.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	payments := make([]PlatformPayment, 0)
	for rows.Next() {
		var row PlatformPayment
		if err := rows.Scan(
			&row.ID,
			&row.TenantID,
			&row.TenantName,
			&row.ReceiptNumber,
			&row.AmountPaid,
			&row.PaymentMode,
			&row.Status,
			&row.CreatedAt,
		); err != nil {
			return nil, err
		}
		payments = append(payments, row)
	}
	return payments, rows.Err()
}

func parseTenantUUID(rawTenantID string) (pgtype.UUID, error) {
	var tid pgtype.UUID
	if err := tid.Scan(strings.TrimSpace(rawTenantID)); err != nil || !tid.Valid {
		return pgtype.UUID{}, ErrInvalidTenantID
	}
	return tid, nil
}
