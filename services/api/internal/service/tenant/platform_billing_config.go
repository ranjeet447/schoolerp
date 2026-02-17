package tenant

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
)

type PlatformBillingConfig struct {
	GatewaySettings map[string]interface{} `json:"gateway_settings"`
	TaxRules        map[string]interface{} `json:"tax_rules"`
	InvoiceTemplate map[string]interface{} `json:"invoice_template"`
}

type UpdatePlatformBillingConfigParams struct {
	GatewaySettings map[string]interface{} `json:"gateway_settings"`
	TaxRules        map[string]interface{} `json:"tax_rules"`
	InvoiceTemplate map[string]interface{} `json:"invoice_template"`
	UpdatedBy       string                 `json:"-"`
}

func (s *Service) GetPlatformBillingConfig(ctx context.Context) (PlatformBillingConfig, error) {
	out := PlatformBillingConfig{
		GatewaySettings: map[string]interface{}{},
		TaxRules:        map[string]interface{}{},
		InvoiceTemplate: map[string]interface{}{},
	}

	const query = `
		SELECT key, value
		FROM platform_settings
		WHERE key = ANY($1::text[])
	`
	keys := []string{
		"billing.gateway_settings",
		"billing.tax_rules",
		"billing.invoice_template",
	}

	rows, err := s.db.Query(ctx, query, keys)
	if err != nil {
		return PlatformBillingConfig{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var key string
		var value []byte
		if err := rows.Scan(&key, &value); err != nil {
			return PlatformBillingConfig{}, err
		}
		switch key {
		case "billing.gateway_settings":
			_ = json.Unmarshal(value, &out.GatewaySettings)
		case "billing.tax_rules":
			_ = json.Unmarshal(value, &out.TaxRules)
		case "billing.invoice_template":
			_ = json.Unmarshal(value, &out.InvoiceTemplate)
		}
	}
	if err := rows.Err(); err != nil {
		return PlatformBillingConfig{}, err
	}

	return out, nil
}

func (s *Service) UpdatePlatformBillingConfig(ctx context.Context, params UpdatePlatformBillingConfigParams) (PlatformBillingConfig, error) {
	var updatedBy pgtype.UUID
	_ = updatedBy.Scan(strings.TrimSpace(params.UpdatedBy))

	const upsert = `
		INSERT INTO platform_settings (key, value, updated_by, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (key)
		DO UPDATE SET
			value = EXCLUDED.value,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
	`

	write := func(key string, value map[string]interface{}) error {
		if value == nil {
			value = map[string]interface{}{}
		}
		raw, err := json.Marshal(value)
		if err != nil {
			return err
		}
		_, err = s.db.Exec(ctx, upsert, key, raw, updatedBy)
		return err
	}

	if err := write("billing.gateway_settings", params.GatewaySettings); err != nil {
		return PlatformBillingConfig{}, err
	}
	if err := write("billing.tax_rules", params.TaxRules); err != nil {
		return PlatformBillingConfig{}, err
	}
	if err := write("billing.invoice_template", params.InvoiceTemplate); err != nil {
		return PlatformBillingConfig{}, err
	}

	return s.GetPlatformBillingConfig(ctx)
}
