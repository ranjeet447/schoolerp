package tenant

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
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

func (s *Service) OnboardSchool(ctx context.Context, params OnboardSchoolParams) (string, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	qtx := s.q.WithTx(tx)

	// 1. Create Tenant
	tenantID := uuid.New()
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
	userID := uuid.New()
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
	identityID := uuid.New()
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
