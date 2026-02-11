package tenant

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Service struct {
	q db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{q: q}
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
