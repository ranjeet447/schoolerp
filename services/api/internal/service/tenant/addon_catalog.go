package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

type tenantAddonEntitlement struct {
	Status    string
	ExpiresAt *time.Time
}

func defaultPlatformAddonCatalog() []PluginMetadata {
	out := make([]PluginMetadata, 0, len(SystemPlugins))
	for _, p := range SystemPlugins {
		cp := p
		if cp.BillingPeriod == "" {
			cp.BillingPeriod = "monthly"
		}
		if !cp.IsActive {
			cp.IsActive = true
		}
		if cp.Config == nil {
			cp.Config = map[string]interface{}{}
		}
		out = append(out, cp)
	}
	return out
}

func isUndefinedTableError(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "42P01"
}

func (s *Service) ensurePlatformAddonCatalogSeed(ctx context.Context) error {
	const insert = `
		INSERT INTO platform_addons (code, name, description, price_paise, billing_period, category, config_schema, is_active, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
		ON CONFLICT (code)
		DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			category = EXCLUDED.category,
			config_schema = EXCLUDED.config_schema,
			is_active = EXCLUDED.is_active,
			updated_at = NOW()
	`

	for _, addon := range defaultPlatformAddonCatalog() {
		rawSchema, err := json.Marshal(addon.Config)
		if err != nil {
			return err
		}
		if _, err := s.db.Exec(
			ctx,
			insert,
			strings.TrimSpace(addon.ID),
			addon.Name,
			addon.Description,
			addon.PricePaise,
			strings.TrimSpace(addon.BillingPeriod),
			addon.Category,
			rawSchema,
			addon.IsActive,
		); err != nil {
			if isUndefinedTableError(err) {
				return err
			}
			return fmt.Errorf("seed platform addons: %w", err)
		}
	}
	return nil
}

func (s *Service) listPlatformAddonCatalog(ctx context.Context) ([]PluginMetadata, error) {
	// Best effort seed keeps existing installs working without manual seed scripts.
	if err := s.ensurePlatformAddonCatalogSeed(ctx); err != nil && !isUndefinedTableError(err) {
		return nil, err
	}

	const query = `
		SELECT code, name, COALESCE(description, ''), COALESCE(category, 'General'),
		       COALESCE(config_schema, '{}'::jsonb), COALESCE(price_paise, 0),
		       COALESCE(billing_period, 'monthly'), COALESCE(is_active, TRUE)
		FROM platform_addons
		ORDER BY category, name
	`
	rows, err := s.db.Query(ctx, query)
	if err != nil {
		if isUndefinedTableError(err) {
			return defaultPlatformAddonCatalog(), nil
		}
		return nil, err
	}
	defer rows.Close()

	out := make([]PluginMetadata, 0)
	for rows.Next() {
		var code, name, desc, category, billingPeriod string
		var schemaRaw []byte
		var pricePaise int64
		var isActive bool
		if err := rows.Scan(&code, &name, &desc, &category, &schemaRaw, &pricePaise, &billingPeriod, &isActive); err != nil {
			return nil, err
		}
		var schema map[string]interface{}
		_ = json.Unmarshal(schemaRaw, &schema)
		if schema == nil {
			schema = map[string]interface{}{}
		}
		out = append(out, PluginMetadata{
			ID:            code,
			Name:          name,
			Description:   desc,
			Category:      category,
			Config:        schema,
			PricePaise:    pricePaise,
			BillingPeriod: billingPeriod,
			IsActive:      isActive,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(out) == 0 {
		return defaultPlatformAddonCatalog(), nil
	}
	return out, nil
}

func (s *Service) getPlatformAddonMetadata(ctx context.Context, addonID string) (PluginMetadata, bool) {
	id := strings.TrimSpace(addonID)
	if id == "" {
		return PluginMetadata{}, false
	}
	catalog, err := s.listPlatformAddonCatalog(ctx)
	if err == nil {
		for _, item := range catalog {
			if item.ID == id {
				return item, true
			}
		}
	}
	for _, item := range SystemPlugins {
		if item.ID == id {
			return item, true
		}
	}
	return PluginMetadata{}, false
}

func (s *Service) listTenantAddonEntitlementsByCode(ctx context.Context, tenantID string) (map[string]tenantAddonEntitlement, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return nil, err
	}

	const query = `
		SELECT pa.code, ta.status, ta.expires_at
		FROM tenant_addons ta
		JOIN platform_addons pa ON pa.id = ta.addon_id
		WHERE ta.tenant_id = $1
	`
	rows, err := s.db.Query(ctx, query, tid)
	if err != nil {
		if isUndefinedTableError(err) {
			return map[string]tenantAddonEntitlement{}, nil
		}
		return nil, err
	}
	defer rows.Close()

	out := make(map[string]tenantAddonEntitlement)
	for rows.Next() {
		var code, status string
		var expires pgtype.Timestamptz
		if err := rows.Scan(&code, &status, &expires); err != nil {
			return nil, err
		}
		var expiresAt *time.Time
		if expires.Valid {
			t := expires.Time
			expiresAt = &t
		}
		out[strings.TrimSpace(code)] = tenantAddonEntitlement{
			Status:    status,
			ExpiresAt: expiresAt,
		}
	}
	return out, rows.Err()
}

func (s *Service) hasActiveTenantAddonEntitlement(ctx context.Context, tenantID, addonCode string) (bool, error) {
	entitlements, err := s.listTenantAddonEntitlementsByCode(ctx, tenantID)
	if err != nil {
		return false, err
	}
	row, ok := entitlements[strings.TrimSpace(addonCode)]
	if !ok {
		return false, nil
	}
	if !strings.EqualFold(row.Status, "active") {
		return false, nil
	}
	if row.ExpiresAt != nil && row.ExpiresAt.Before(time.Now()) {
		return false, nil
	}
	return true, nil
}

func (s *Service) setTenantAddonEntitlement(ctx context.Context, tenantID, addonCode string, enabled bool, settings map[string]interface{}) error {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return err
	}
	addonCode = strings.TrimSpace(addonCode)
	if addonCode == "" {
		return ErrAddonRequestAddonRequired
	}
	if settings == nil {
		settings = map[string]interface{}{}
	}
	rawSettings, err := json.Marshal(settings)
	if err != nil {
		return err
	}

	if err := s.ensurePlatformAddonCatalogSeed(ctx); err != nil && !isUndefinedTableError(err) {
		return err
	}

	status := "suspended"
	if enabled {
		status = "active"
	}

	const upsert = `
		INSERT INTO tenant_addons (tenant_id, addon_id, status, settings, activated_at, updated_at)
		SELECT $1, pa.id, $3, $4, NOW(), NOW()
		FROM platform_addons pa
		WHERE pa.code = $2
		ON CONFLICT (tenant_id, addon_id)
		DO UPDATE SET
			status = EXCLUDED.status,
			settings = EXCLUDED.settings,
			updated_at = NOW(),
			activated_at = CASE WHEN EXCLUDED.status = 'active' THEN NOW() ELSE tenant_addons.activated_at END
	`
	tag, err := s.db.Exec(ctx, upsert, tid, addonCode, status, rawSettings)
	if err != nil {
		if isUndefinedTableError(err) {
			return nil // Legacy deployments can still use plugin config fallback.
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrAddonRequestAddonUnknown
	}
	return nil
}

func (s *Service) pluginCurrentlyEnabled(config map[string]interface{}, pluginID string) bool {
	pluginsConfig, ok := config["plugins"].(map[string]interface{})
	if !ok {
		return false
	}
	raw, ok := pluginsConfig[pluginID].(map[string]interface{})
	if !ok {
		return false
	}
	enabled, _ := raw["enabled"].(bool)
	return enabled
}

func (s *Service) tenantHasLegacyPluginEnabled(ctx context.Context, tenantID, pluginID string) (bool, error) {
	var tid pgtype.UUID
	if err := tid.Scan(tenantID); err != nil {
		return false, err
	}
	row, err := s.q.GetTenantByID(ctx, tid)
	if err != nil {
		return false, err
	}
	var config map[string]interface{}
	if err := json.Unmarshal(row.Config, &config); err != nil {
		return false, nil
	}
	return s.pluginCurrentlyEnabled(config, pluginID), nil
}
