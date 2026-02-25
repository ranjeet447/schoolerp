package integrationhub

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/security"
	tenantsvc "github.com/schoolerp/api/internal/service/tenant"
)

type Service struct {
	db     *pgxpool.Pool
	q      db.Querier
	crypto *security.Crypto
	audit  *audit.Logger
	tenant *tenantsvc.Service
	http   *http.Client
	now    func() time.Time
}

func NewService(dbpool *pgxpool.Pool, q db.Querier, crypto *security.Crypto, auditLogger *audit.Logger, tenantSvc *tenantsvc.Service) *Service {
	return &Service{
		db:     dbpool,
		q:      q,
		crypto: crypto,
		audit:  auditLogger,
		tenant: tenantSvc,
		http:   &http.Client{Timeout: 15 * time.Second},
		now:    time.Now,
	}
}

type BillingAddonRow struct {
	Code                string                 `json:"code"`
	Name                string                 `json:"name"`
	Description         string                 `json:"description"`
	MonthlyPricePaise   int64                  `json:"monthly_price_paise"`
	Status              string                 `json:"status"`
	RequiresApproval    bool                   `json:"requires_approval"`
	FeaturesUnlocked    []string               `json:"features_unlocked"`
	IntegrationUnlocked string                 `json:"integration_unlocked,omitempty"`
	IncludedCredits     map[string]int64       `json:"included_credits,omitempty"`
	TenantStatus        string                 `json:"tenant_status,omitempty"`
	StartAt             *time.Time             `json:"start_at,omitempty"`
	EndAt               *time.Time             `json:"end_at,omitempty"`
	RenewAt             *time.Time             `json:"renew_at,omitempty"`
	BillingSource       string                 `json:"billing_source,omitempty"`
	Metadata            map[string]interface{} `json:"metadata,omitempty"`
	Enabled             bool                   `json:"enabled"`
	Entitled            bool                   `json:"entitled"`
	CatalogActive       bool                   `json:"catalog_active"`
}

type PlatformAddonCatalogRow struct {
	Code                string                 `json:"code"`
	Name                string                 `json:"name"`
	Description         string                 `json:"description"`
	MonthlyPricePaise   int64                  `json:"monthly_price_paise"`
	BillingPeriod       string                 `json:"billing_period"`
	Category            string                 `json:"category"`
	Status              string                 `json:"status"`
	RequiresApproval    bool                   `json:"requires_approval"`
	FeaturesUnlocked    []string               `json:"features_unlocked"`
	IntegrationUnlocked string                 `json:"integration_unlocked,omitempty"`
	IncludedCredits     map[string]int64       `json:"included_credits,omitempty"`
	ConfigSchema        map[string]interface{} `json:"config_schema,omitempty"`
	IsActive            bool                   `json:"is_active"`
	UpdatedAt           *time.Time             `json:"updated_at,omitempty"`
}

type UpsertPlatformAddonParams struct {
	Code                string                 `json:"code"`
	Name                string                 `json:"name"`
	Description         string                 `json:"description"`
	MonthlyPricePaise   int64                  `json:"monthly_price_paise"`
	BillingPeriod       string                 `json:"billing_period"`
	Category            string                 `json:"category"`
	Status              string                 `json:"status"`
	RequiresApproval    bool                   `json:"requires_approval"`
	FeaturesUnlocked    []string               `json:"features_unlocked"`
	IntegrationUnlocked string                 `json:"integration_unlocked"`
	IncludedCredits     map[string]int64       `json:"included_credits"`
	ConfigSchema        map[string]interface{} `json:"config_schema"`
	IsActive            *bool                  `json:"is_active,omitempty"`
}

func (s *Service) ListPlatformAddonCatalog(ctx context.Context) ([]PlatformAddonCatalogRow, error) {
	if s.db == nil {
		return nil, fmt.Errorf("db unavailable")
	}
	rows, err := s.db.Query(ctx, `
		SELECT code, COALESCE(name,''), COALESCE(description,''), COALESCE(price_paise,0),
		       COALESCE(billing_period,'monthly'), COALESCE(category,'General'),
		       COALESCE(status,'active'), COALESCE(requires_approval,false),
		       COALESCE(features_unlocked,'[]'::jsonb), COALESCE(integration_unlocked,''),
		       COALESCE(included_credits,'{}'::jsonb), COALESCE(config_schema,'{}'::jsonb),
		       COALESCE(is_active,true), updated_at
		FROM platform_addons
		ORDER BY category, name, code
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []PlatformAddonCatalogRow{}
	for rows.Next() {
		var row PlatformAddonCatalogRow
		var featuresRaw, creditsRaw, configRaw []byte
		var updated pgtype.Timestamptz
		if err := rows.Scan(
			&row.Code, &row.Name, &row.Description, &row.MonthlyPricePaise,
			&row.BillingPeriod, &row.Category, &row.Status, &row.RequiresApproval,
			&featuresRaw, &row.IntegrationUnlocked, &creditsRaw, &configRaw, &row.IsActive, &updated,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(featuresRaw, &row.FeaturesUnlocked)
		_ = json.Unmarshal(creditsRaw, &row.IncludedCredits)
		_ = json.Unmarshal(configRaw, &row.ConfigSchema)
		if row.FeaturesUnlocked == nil {
			row.FeaturesUnlocked = []string{}
		}
		if row.IncludedCredits == nil {
			row.IncludedCredits = map[string]int64{}
		}
		if row.ConfigSchema == nil {
			row.ConfigSchema = map[string]interface{}{}
		}
		if updated.Valid {
			t := updated.Time
			row.UpdatedAt = &t
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) UpsertPlatformAddonCatalog(ctx context.Context, p UpsertPlatformAddonParams, actorUserID string) (PlatformAddonCatalogRow, error) {
	if s.db == nil {
		return PlatformAddonCatalogRow{}, fmt.Errorf("db unavailable")
	}
	p.Code = strings.TrimSpace(p.Code)
	p.Name = strings.TrimSpace(p.Name)
	if p.Code == "" || p.Name == "" {
		return PlatformAddonCatalogRow{}, fmt.Errorf("code and name are required")
	}
	if p.BillingPeriod == "" {
		p.BillingPeriod = "monthly"
	}
	if p.Category == "" {
		p.Category = "General"
	}
	switch p.Status {
	case "", "active":
		p.Status = "active"
	case "inactive", "hidden":
	default:
		return PlatformAddonCatalogRow{}, fmt.Errorf("invalid status")
	}
	if p.FeaturesUnlocked == nil {
		p.FeaturesUnlocked = []string{}
	}
	if p.IncludedCredits == nil {
		p.IncludedCredits = map[string]int64{}
	}
	if p.ConfigSchema == nil {
		p.ConfigSchema = map[string]interface{}{}
	}
	featuresRaw, _ := json.Marshal(p.FeaturesUnlocked)
	creditsRaw, _ := json.Marshal(p.IncludedCredits)
	configRaw, _ := json.Marshal(p.ConfigSchema)
	isActive := p.Status == "active"
	if p.IsActive != nil {
		isActive = *p.IsActive
	}
	_, err := s.db.Exec(ctx, `
		INSERT INTO platform_addons (
			code, name, description, price_paise, billing_period, category, config_schema,
			is_active, status, requires_approval, features_unlocked, integration_unlocked, included_credits, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
		ON CONFLICT (code) DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			price_paise = EXCLUDED.price_paise,
			billing_period = EXCLUDED.billing_period,
			category = EXCLUDED.category,
			config_schema = EXCLUDED.config_schema,
			is_active = EXCLUDED.is_active,
			status = EXCLUDED.status,
			requires_approval = EXCLUDED.requires_approval,
			features_unlocked = EXCLUDED.features_unlocked,
			integration_unlocked = EXCLUDED.integration_unlocked,
			included_credits = EXCLUDED.included_credits,
			updated_at = NOW()
	`, p.Code, p.Name, p.Description, p.MonthlyPricePaise, p.BillingPeriod, p.Category, configRaw, isActive, p.Status, p.RequiresApproval, featuresRaw, p.IntegrationUnlocked, creditsRaw)
	if err != nil {
		return PlatformAddonCatalogRow{}, err
	}
	s.auditTenantAction(ctx, "", actorUserID, "platform.addon_catalog.upsert", "platform_addon", map[string]interface{}{"code": p.Code}, p)
	rows, err := s.ListPlatformAddonCatalog(ctx)
	if err != nil {
		return PlatformAddonCatalogRow{}, err
	}
	for _, row := range rows {
		if row.Code == p.Code {
			return row, nil
		}
	}
	return PlatformAddonCatalogRow{}, fmt.Errorf("addon not found after upsert")
}

func (s *Service) ListBillingAddons(ctx context.Context, tenantID string) ([]BillingAddonRow, error) {
	rows, err := s.tenant.ListPlugins(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	type tenantAddonState struct {
		Status        string
		StartAt       *time.Time
		EndAt         *time.Time
		RenewAt       *time.Time
		BillingSource string
		Metadata      map[string]interface{}
	}
	stateByCode := map[string]tenantAddonState{}

	tid := pgtype.UUID{}
	_ = tid.Scan(tenantID)
	if s.db != nil {
		r, qerr := s.db.Query(ctx, `
			SELECT pa.code, ta.status, ta.start_at, ta.end_at, ta.renew_at, COALESCE(ta.billing_source, ''), COALESCE(ta.metadata, '{}'::jsonb)
			FROM platform_addons pa
			LEFT JOIN tenant_addons ta ON ta.addon_id = pa.id AND ta.tenant_id = $1
		`, tid)
		if qerr == nil {
			defer r.Close()
			for r.Next() {
				var code string
				var status, billingSource pgtype.Text
				var startAt, endAt, renewAt pgtype.Timestamptz
				var metaRaw []byte
				if err := r.Scan(&code, &status, &startAt, &endAt, &renewAt, &billingSource, &metaRaw); err != nil {
					continue
				}
				meta := map[string]interface{}{}
				_ = json.Unmarshal(metaRaw, &meta)
				st := tenantAddonState{Metadata: meta}
				if status.Valid {
					st.Status = status.String
				}
				if billingSource.Valid {
					st.BillingSource = billingSource.String
				}
				if startAt.Valid {
					t := startAt.Time
					st.StartAt = &t
				}
				if endAt.Valid {
					t := endAt.Time
					st.EndAt = &t
				}
				if renewAt.Valid {
					t := renewAt.Time
					st.RenewAt = &t
				}
				stateByCode[code] = st
			}
		}
	}

	out := make([]BillingAddonRow, 0, len(rows))
	for _, row := range rows {
		metaMap, _ := row["metadata"].(map[string]interface{})
		code, _ := metaMap["id"].(string)
		name, _ := metaMap["name"].(string)
		desc, _ := metaMap["description"].(string)
		price, _ := asInt64(metaMap["price_paise"])
		statusStr := stringOr(metaMap["status"], "active")
		requiresApproval, _ := metaMap["requires_approval"].(bool)
		features := stringSlice(metaMap["features_unlocked"])
		integrationUnlocked := stringOr(metaMap["integration_unlocked"], "")
		includedCredits := creditMap(metaMap["included_credits"])
		enabled, _ := row["enabled"].(bool)
		entitled, _ := row["entitled"].(bool)
		catalogActive, _ := row["catalog_active"].(bool)

		item := BillingAddonRow{
			Code:                code,
			Name:                name,
			Description:         desc,
			MonthlyPricePaise:   price,
			Status:              statusStr,
			RequiresApproval:    requiresApproval,
			FeaturesUnlocked:    features,
			IntegrationUnlocked: integrationUnlocked,
			IncludedCredits:     includedCredits,
			Enabled:             enabled,
			Entitled:            entitled,
			CatalogActive:       catalogActive,
		}
		if st, ok := stateByCode[code]; ok {
			item.TenantStatus = st.Status
			item.StartAt = st.StartAt
			item.EndAt = st.EndAt
			item.RenewAt = st.RenewAt
			item.BillingSource = st.BillingSource
			item.Metadata = st.Metadata
		}
		out = append(out, item)
	}
	return out, nil
}

func (s *Service) ActivateAddon(ctx context.Context, tenantID, addonCode, actorUserID, reason string) (map[string]interface{}, error) {
	if s.db == nil {
		return nil, fmt.Errorf("db unavailable")
	}
	var requiresApproval bool
	var catalogStatus string
	err := s.db.QueryRow(ctx, `
		SELECT COALESCE(requires_approval, FALSE), COALESCE(status, 'active')
		FROM platform_addons WHERE code = $1
	`, strings.TrimSpace(addonCode)).Scan(&requiresApproval, &catalogStatus)
	if err != nil {
		return nil, err
	}
	if catalogStatus != "active" {
		return nil, fmt.Errorf("addon is not available for activation")
	}
	if requiresApproval {
		row, err := s.tenant.CreateTenantAddonActivationRequest(ctx, tenantID, tenantsvc.CreateTenantAddonActivationRequestParams{
			AddonID:     addonCode,
			Reason:      reason,
			RequestedBy: actorUserID,
		})
		if err != nil {
			return nil, err
		}
		s.auditTenantAction(ctx, tenantID, actorUserID, "tenant.addon.request_activation", "addon", map[string]interface{}{"addon_code": addonCode, "reason": reason}, map[string]interface{}{"mode": "request"})
		return map[string]interface{}{"mode": "request", "request": row}, nil
	}

	if err := s.tenant.UpdateTenantAddon(ctx, tenantID, addonCode, true, map[string]interface{}{}); err != nil {
		return nil, err
	}
	tid, _ := parseUUID(tenantID)
	_, _ = s.db.Exec(ctx, `
		UPDATE tenant_addons ta
		SET status = 'active',
		    start_at = COALESCE(start_at, NOW()),
		    renew_at = COALESCE(renew_at, NOW() + INTERVAL '1 month'),
		    billing_source = COALESCE(NULLIF(billing_source, ''), 'manual'),
		    updated_at = NOW()
		FROM platform_addons pa
		WHERE ta.tenant_id = $1 AND pa.id = ta.addon_id AND pa.code = $2
	`, tid, addonCode)
	s.auditTenantAction(ctx, tenantID, actorUserID, "tenant.addon.activate", "addon", map[string]interface{}{"addon_code": addonCode}, map[string]interface{}{"status": "active"})
	return map[string]interface{}{"mode": "self_serve", "status": "active"}, nil
}

func (s *Service) CancelAddon(ctx context.Context, tenantID, addonCode string) error {
	if err := s.tenant.UpdateTenantAddon(ctx, tenantID, addonCode, false, map[string]interface{}{}); err != nil {
		return err
	}
	if s.db != nil {
		tid, _ := parseUUID(tenantID)
		_, _ = s.db.Exec(ctx, `
			UPDATE tenant_addons ta
			SET status = 'cancelled', end_at = NOW(), updated_at = NOW()
			FROM platform_addons pa
			WHERE ta.tenant_id = $1 AND pa.id = ta.addon_id AND pa.code = $2
		`, tid, addonCode)
	}
	s.auditTenantAction(ctx, tenantID, "", "tenant.addon.cancel", "addon", map[string]interface{}{"addon_code": addonCode}, map[string]interface{}{"status": "cancelled"})
	return nil
}

type CreditBalanceRow struct {
	WalletType           string `json:"wallet_type"`
	Balance              int64  `json:"balance"`
	IncludedGrantedMonth int64  `json:"included_granted_month"`
	TopupsMonth          int64  `json:"topups_month"`
	UsedMonth            int64  `json:"used_month"`
}

func (s *Service) ListCreditBalances(ctx context.Context, tenantID string) ([]CreditBalanceRow, error) {
	if s.db == nil {
		return nil, fmt.Errorf("db unavailable")
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return nil, err
	}
	const q = `
		WITH wallets AS (
			SELECT wallet_type, balance FROM tenant_credit_wallets WHERE tenant_id = $1
		), ledger AS (
			SELECT wallet_type,
			       SUM(CASE WHEN source = 'included_allowance' THEN amount ELSE 0 END) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS included_granted_month,
			       SUM(CASE WHEN source IN ('topup', 'support_adjustment') AND amount > 0 THEN amount ELSE 0 END) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS topups_month,
			       SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS used_month
			FROM tenant_credit_ledger
			WHERE tenant_id = $1
			GROUP BY wallet_type
		)
		SELECT COALESCE(w.wallet_type, l.wallet_type) AS wallet_type,
		       COALESCE(w.balance, 0) AS balance,
		       COALESCE(l.included_granted_month, 0) AS included_granted_month,
		       COALESCE(l.topups_month, 0) AS topups_month,
		       COALESCE(l.used_month, 0) AS used_month
		FROM wallets w
		FULL OUTER JOIN ledger l ON l.wallet_type = w.wallet_type
		ORDER BY 1
	`
	rows, err := s.db.Query(ctx, q, tid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []CreditBalanceRow{}
	for rows.Next() {
		var r CreditBalanceRow
		if err := rows.Scan(&r.WalletType, &r.Balance, &r.IncludedGrantedMonth, &r.TopupsMonth, &r.UsedMonth); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

type CreditLedgerEntry struct {
	ID          string                 `json:"id"`
	WalletType  string                 `json:"wallet_type"`
	EntryType   string                 `json:"entry_type"`
	Amount      int64                  `json:"amount"`
	Source      string                 `json:"source"`
	ReferenceID string                 `json:"reference_id"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedAt   time.Time              `json:"created_at"`
}

func (s *Service) ListCreditLedger(ctx context.Context, tenantID, walletType string, limit, offset int32) ([]CreditLedgerEntry, error) {
	if limit <= 0 {
		limit = 50
	}
	if s.db == nil {
		return nil, fmt.Errorf("db unavailable")
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return nil, err
	}
	rows, err := s.db.Query(ctx, `
		SELECT id, wallet_type, entry_type, amount, source, reference_id, metadata, created_at
		FROM tenant_credit_ledger
		WHERE tenant_id = $1 AND ($2 = '' OR wallet_type = $2)
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`, tid, strings.TrimSpace(walletType), limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []CreditLedgerEntry{}
	for rows.Next() {
		var id uuid.UUID
		var e CreditLedgerEntry
		var metaRaw []byte
		if err := rows.Scan(&id, &e.WalletType, &e.EntryType, &e.Amount, &e.Source, &e.ReferenceID, &metaRaw, &e.CreatedAt); err != nil {
			return nil, err
		}
		e.ID = id.String()
		_ = json.Unmarshal(metaRaw, &e.Metadata)
		if e.Metadata == nil {
			e.Metadata = map[string]interface{}{}
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (s *Service) CreditAdjustment(ctx context.Context, tenantID, walletType string, amount int64, source, referenceID string, metadata map[string]interface{}, createdBy *string) error {
	if err := s.applyCreditLedger(ctx, tenantID, walletType, amount, source, referenceID, metadata, createdBy); err != nil {
		return err
	}
	actor := ""
	if createdBy != nil {
		actor = *createdBy
	}
	s.auditTenantAction(ctx, tenantID, actor, "platform.credits.adjust", "credit_wallet", map[string]interface{}{
		"wallet_type":  walletType,
		"amount":       amount,
		"source":       source,
		"reference_id": referenceID,
	}, map[string]interface{}{"status": "applied"})
	return nil
}

func (s *Service) RequireCredits(ctx context.Context, tenantID, walletType string, amount int64, referenceID string, source string, metadata map[string]interface{}) error {
	if amount <= 0 {
		return nil
	}
	return s.applyCreditLedger(ctx, tenantID, walletType, -amount, source, referenceID, metadata, nil)
}

func (s *Service) TopupCreditsRequest(ctx context.Context, tenantID, walletType string, amount int64, actorUserID string) (map[string]interface{}, error) {
	if s.db == nil {
		return nil, fmt.Errorf("db unavailable")
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return nil, err
	}
	uid, err := parseUUID(actorUserID)
	if err != nil {
		return nil, err
	}
	payload, _ := json.Marshal(map[string]interface{}{
		"wallet_type": walletType,
		"amount":      amount,
		"mode":        "platform_invoice",
	})
	var id uuid.UUID
	err = s.db.QueryRow(ctx, `
		INSERT INTO platform_action_approvals (action_type, target_tenant_id, payload, requested_by, status, reason)
		VALUES ('tenant_credit_topup', $1, $2, $3, 'pending', 'tenant requested credit topup')
		RETURNING id
	`, tid, payload, uid).Scan(&id)
	if err != nil {
		return nil, err
	}
	res := map[string]interface{}{"request_id": id.String(), "status": "pending"}
	s.auditTenantAction(ctx, tenantID, actorUserID, "tenant.credits.topup_request", "credit_wallet", map[string]interface{}{
		"wallet_type": walletType,
		"amount":      amount,
	}, res)
	return res, nil
}

func (s *Service) applyCreditLedger(ctx context.Context, tenantID, walletType string, amount int64, source, referenceID string, metadata map[string]interface{}, createdBy *string) error {
	if s.db == nil {
		return fmt.Errorf("db unavailable")
	}
	if strings.TrimSpace(referenceID) == "" {
		return fmt.Errorf("reference_id is required")
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return err
	}
	var uid interface{}
	if createdBy != nil && strings.TrimSpace(*createdBy) != "" {
		if v, err := parseUUID(*createdBy); err == nil {
			uid = v
		}
	}
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	metaRaw, _ := json.Marshal(metadata)

	return pgx.BeginFunc(ctx, s.db, func(tx pgx.Tx) error {
		var exists bool
		err := tx.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1 FROM tenant_credit_ledger
				WHERE tenant_id = $1 AND wallet_type = $2 AND reference_id = $3
			)
		`, tid, walletType, referenceID).Scan(&exists)
		if err == nil && exists {
			return nil
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO tenant_credit_wallets (tenant_id, wallet_type, balance)
			VALUES ($1, $2, 0)
			ON CONFLICT (tenant_id, wallet_type) DO NOTHING
		`, tid, walletType)
		if err != nil {
			return err
		}

		var current int64
		err = tx.QueryRow(ctx, `
			SELECT balance FROM tenant_credit_wallets
			WHERE tenant_id = $1 AND wallet_type = $2
			FOR UPDATE
		`, tid, walletType).Scan(&current)
		if err != nil {
			return err
		}
		if amount < 0 && current < -amount {
			return fmt.Errorf("INSUFFICIENT_CREDITS")
		}
		_, err = tx.Exec(ctx, `
			UPDATE tenant_credit_wallets
			SET balance = balance + $3, updated_at = NOW()
			WHERE tenant_id = $1 AND wallet_type = $2
		`, tid, walletType, amount)
		if err != nil {
			return err
		}
		entryType := "credit"
		if amount < 0 {
			entryType = "debit"
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO tenant_credit_ledger (tenant_id, wallet_type, entry_type, amount, source, reference_id, metadata, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, tid, walletType, entryType, amount, source, referenceID, metaRaw, uid)
		if err != nil {
			var pgErr *pgconn.PgError
			if ok := errorAsPg(err, &pgErr); ok && pgErr.Code == "23505" {
				return nil
			}
			return err
		}
		return nil
	})
}

type TenantIntegrationRow struct {
	Provider     string     `json:"provider"`
	Status       string     `json:"status"`
	AccountEmail string     `json:"account_email,omitempty"`
	AccountName  string     `json:"account_name,omitempty"`
	Scopes       []string   `json:"scopes,omitempty"`
	ExpiryAt     *time.Time `json:"expiry_at,omitempty"`
	LastError    string     `json:"last_error,omitempty"`
	Connected    bool       `json:"connected"`
	AddonCode    string     `json:"addon_code"`
	AddonActive  bool       `json:"addon_active"`
	Features     []string   `json:"features"`
}

func (s *Service) ListTenantIntegrations(ctx context.Context, tenantID string) ([]TenantIntegrationRow, error) {
	defs := []struct {
		Provider  string
		AddonCode string
		Features  []string
	}{
		{"google_workspace", "live_classes_google", []string{"calendar", "meet", "live_classes"}},
		{"microsoft_365", "live_classes_microsoft", []string{"graph_calendar", "teams_meetings", "live_classes"}},
	}
	state := map[string]TenantIntegrationRow{}
	for _, d := range defs {
		active, _ := s.tenant.HasAddon(ctx, tenantID, d.AddonCode)
		state[d.Provider] = TenantIntegrationRow{
			Provider:    d.Provider,
			Status:      "not_connected",
			Connected:   false,
			AddonCode:   d.AddonCode,
			AddonActive: active,
			Features:    d.Features,
		}
	}
	if s.db == nil {
		out := make([]TenantIntegrationRow, 0, len(defs))
		for _, d := range defs {
			out = append(out, state[d.Provider])
		}
		return out, nil
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return nil, err
	}
	rows, err := s.db.Query(ctx, `
		SELECT provider, status, COALESCE(account_email,''), COALESCE(account_name,''), scopes, expiry_at, COALESCE(last_error,'')
		FROM tenant_integrations
		WHERE tenant_id = $1
	`, tid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var provider, status, email, name, lastErr string
		var scopes []string
		var expiry pgtype.Timestamptz
		if err := rows.Scan(&provider, &status, &email, &name, &scopes, &expiry, &lastErr); err != nil {
			return nil, err
		}
		item := state[provider]
		item.Status = status
		item.Connected = status == "connected"
		item.AccountEmail = email
		item.AccountName = name
		item.Scopes = scopes
		if expiry.Valid {
			t := expiry.Time
			item.ExpiryAt = &t
		}
		item.LastError = lastErr
		state[provider] = item
	}
	out := make([]TenantIntegrationRow, 0, len(defs))
	for _, d := range defs {
		out = append(out, state[d.Provider])
	}
	return out, nil
}

func (s *Service) StartOAuthConnect(ctx context.Context, tenantID, provider string, actorUserID string, baseURL string) (map[string]string, error) {
	provider = normalizeProvider(provider)
	if provider == "" {
		return nil, fmt.Errorf("unsupported provider")
	}
	state, err := randomToken(24)
	if err != nil {
		return nil, err
	}
	if err := s.upsertTenantIntegrationOAuthState(ctx, tenantID, provider, actorUserID, state); err != nil {
		return nil, err
	}
	callbackURL := s.publicOAuthCallbackURL(baseURL, provider)
	cfg := s.providerConfig(provider)
	if strings.TrimSpace(cfg.RedirectURI) != "" {
		callbackURL = cfg.RedirectURI
	}
	authURL := callbackURL + "?mock_oauth=1&state=" + state + "&code=mock-" + provider
	mode := "mock"
	if !s.useMockOAuth() && cfg.configured() {
		authURL = s.buildAuthURL(cfg, state, callbackURL)
		mode = "oauth"
	}
	res := map[string]string{
		"provider":     provider,
		"auth_url":     authURL,
		"callback_url": callbackURL,
		"state":        state,
		"mode":         mode,
	}
	s.auditTenantAction(ctx, tenantID, actorUserID, "tenant.integration.oauth_start", "integration", map[string]interface{}{"provider": provider}, map[string]interface{}{"callback_url": callbackURL})
	return res, nil
}

func (s *Service) CompleteOAuthConnect(ctx context.Context, tenantID, provider, actorUserID, state, code string) error {
	return s.completeOAuthConnectResolved(ctx, tenantID, provider, actorUserID, state, code)
}

func (s *Service) CompleteOAuthConnectByState(ctx context.Context, provider, state, code string) (tenantID string, err error) {
	provider = normalizeProvider(provider)
	if provider == "" {
		return "", fmt.Errorf("unsupported provider")
	}
	if s.db == nil {
		return "", fmt.Errorf("db unavailable")
	}
	if strings.TrimSpace(state) == "" || strings.TrimSpace(code) == "" {
		return "", fmt.Errorf("state and code are required")
	}
	var tid pgtype.UUID
	err = s.db.QueryRow(ctx, `
		SELECT tenant_id
		FROM tenant_integrations
		WHERE provider = $1 AND COALESCE(metadata->>'oauth_state', '') = $2
		ORDER BY updated_at DESC
		LIMIT 1
	`, provider, state).Scan(&tid)
	if err != nil {
		return "", err
	}
	tenantID, err = pgUUIDToString(tid)
	if err != nil {
		return "", err
	}
	return tenantID, s.completeOAuthConnectResolved(ctx, tenantID, provider, "", state, code)
}

func (s *Service) completeOAuthConnectResolved(ctx context.Context, tenantID, provider, actorUserID, state, code string) error {
	provider = normalizeProvider(provider)
	if provider == "" {
		return fmt.Errorf("unsupported provider")
	}
	if strings.TrimSpace(state) == "" || strings.TrimSpace(code) == "" {
		return fmt.Errorf("state and code are required")
	}
	if s.db == nil {
		return fmt.Errorf("db unavailable")
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return err
	}
	var metadataRaw []byte
	err = s.db.QueryRow(ctx, `SELECT COALESCE(metadata, '{}'::jsonb) FROM tenant_integrations WHERE tenant_id = $1 AND provider = $2`, tid, provider).Scan(&metadataRaw)
	if err != nil {
		return err
	}
	var metadata map[string]interface{}
	_ = json.Unmarshal(metadataRaw, &metadata)
	if metadata == nil {
		metadata = map[string]interface{}{}
	}
	if stringOr(metadata["oauth_state"], "") != state {
		return fmt.Errorf("invalid oauth state")
	}
	if issuedAtRaw := stringOr(metadata["oauth_state_issued_at"], ""); issuedAtRaw != "" {
		if issuedAt, parseErr := time.Parse(time.RFC3339, issuedAtRaw); parseErr == nil {
			if s.now().After(issuedAt.Add(15 * time.Minute)) {
				return fmt.Errorf("oauth state expired")
			}
		}
	}

	callbackURL := s.publicOAuthCallbackURL(defaultAPIBaseURL(), provider)
	if cfg := s.providerConfig(provider); strings.TrimSpace(cfg.RedirectURI) != "" {
		callbackURL = cfg.RedirectURI
	}
	tokenRes := oauthTokenResult{}
	isMock := s.useMockOAuth() || strings.HasPrefix(strings.TrimSpace(code), "mock-") || !s.providerConfig(provider).configured()
	if isMock {
		tokenRes = oauthTokenResult{
			AccessToken:  "access_" + provider + "_" + strings.TrimSpace(code),
			RefreshToken: "refresh_" + provider + "_" + strings.TrimSpace(code),
			TokenType:    "Bearer",
		}
		if provider == "google_workspace" {
			tokenRes.Scopes = []string{"https://www.googleapis.com/auth/calendar", "openid", "email"}
		} else {
			tokenRes.Scopes = []string{"https://graph.microsoft.com/Calendars.ReadWrite", "offline_access", "openid", "email"}
		}
		tokenRes.AccountEmail = provider + "@tenant.example"
		tokenRes.AccountName = strings.Title(strings.ReplaceAll(provider, "_", " "))
		exp := s.now().Add(55 * time.Minute)
		tokenRes.ExpiryAt = &exp
	} else {
		exchanged, err := s.exchangeOAuthCode(ctx, provider, code, callbackURL)
		if err != nil {
			return err
		}
		tokenRes = exchanged
	}
	accessToken := s.encryptMaybe(tokenRes.AccessToken)
	refreshToken := s.encryptMaybe(tokenRes.RefreshToken)
	scopes := tokenRes.Scopes
	expiryAt := pgtype.Timestamptz{}
	if tokenRes.ExpiryAt != nil {
		expiryAt = pgtype.Timestamptz{Time: *tokenRes.ExpiryAt, Valid: true}
	}
	var uid pgtype.UUID
	_ = uid.Scan(actorUserID)
	metadata["oauth_state"] = ""
	metadata["oauth_state_issued_at"] = ""
	if isMock {
		metadata["connected_via"] = "mock_oauth"
	} else {
		metadata["connected_via"] = "oauth"
	}
	metadata["last_auth_code_fingerprint"] = shortFingerprint(code)
	metadataJSON, _ := json.Marshal(metadata)
	_, err = s.db.Exec(ctx, `
		UPDATE tenant_integrations
		SET status = 'connected',
		    account_email = $3,
		    account_name = $4,
		    scopes = $5,
		    access_token = $6,
		    refresh_token = $7,
		    token_type = 'Bearer',
		    expiry_at = $8,
		    last_sync_at = NOW(),
		    metadata = $9,
		    updated_by = $10,
		    updated_at = NOW(),
		    last_error = ''
		WHERE tenant_id = $1 AND provider = $2
	`, tid, provider, stringOr(tokenRes.AccountEmail, provider+"@tenant.example"), stringOr(tokenRes.AccountName, strings.Title(strings.ReplaceAll(provider, "_", " "))), scopes, accessToken, refreshToken, expiryAt, metadataJSON, uid)
	if err == nil {
		s.auditTenantAction(ctx, tenantID, actorUserID, "tenant.integration.connect", "integration", map[string]interface{}{"provider": provider}, map[string]interface{}{"status": "connected"})
	}
	return err
}

func (s *Service) DisconnectIntegration(ctx context.Context, tenantID, provider, actorUserID string) error {
	provider = normalizeProvider(provider)
	if provider == "" || s.db == nil {
		return fmt.Errorf("unsupported provider")
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return err
	}
	var uid pgtype.UUID
	_ = uid.Scan(actorUserID)
	_, err = s.db.Exec(ctx, `
		UPDATE tenant_integrations
		SET status = 'disconnected',
		    access_token = NULL,
		    refresh_token = NULL,
		    expiry_at = NULL,
		    last_error = '',
		    updated_by = $3,
		    updated_at = NOW()
		WHERE tenant_id = $1 AND provider = $2
	`, tid, provider, uid)
	if err == nil {
		s.auditTenantAction(ctx, tenantID, actorUserID, "tenant.integration.disconnect", "integration", map[string]interface{}{"provider": provider}, map[string]interface{}{"status": "disconnected"})
	}
	return err
}

type LiveClassScheduleParams struct {
	TenantID    string
	TeacherID   string
	Title       string
	Description string
	ClassID     string
	SectionID   string
	StartsAt    time.Time
	EndsAt      time.Time
	Provider    string
}

type LiveClassEventRow struct {
	ID              string                 `json:"id"`
	Provider        string                 `json:"provider"`
	Title           string                 `json:"title"`
	Description     string                 `json:"description,omitempty"`
	StartsAt        time.Time              `json:"starts_at"`
	EndsAt          time.Time              `json:"ends_at"`
	MeetingURL      string                 `json:"meeting_url"`
	Status          string                 `json:"status"`
	ExternalEventID string                 `json:"external_event_id,omitempty"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
}

func (s *Service) ScheduleLiveClass(ctx context.Context, p LiveClassScheduleParams) (LiveClassEventRow, error) {
	if s.db == nil {
		return LiveClassEventRow{}, fmt.Errorf("db unavailable")
	}
	provider, addonCode, err := s.resolveConnectedLiveProvider(ctx, p.TenantID, p.Provider)
	if err != nil {
		return LiveClassEventRow{}, err
	}
	active, err := s.tenant.HasAddon(ctx, p.TenantID, addonCode)
	if err != nil {
		return LiveClassEventRow{}, err
	}
	if !active {
		return LiveClassEventRow{}, fmt.Errorf("UPGRADE_REQUIRED: %s", addonCode)
	}
	if p.StartsAt.IsZero() || p.EndsAt.IsZero() || !p.EndsAt.After(p.StartsAt) {
		return LiveClassEventRow{}, fmt.Errorf("invalid schedule window")
	}
	tenantUUID, err := parseUUID(p.TenantID)
	if err != nil {
		return LiveClassEventRow{}, err
	}
	teacherUUID, err := parseUUID(p.TeacherID)
	if err != nil {
		return LiveClassEventRow{}, err
	}
	classUUID, _ := parseUUIDNullable(p.ClassID)
	sectionUUID, _ := parseUUIDNullable(p.SectionID)
	var accessEnc, refreshEnc, status string
	var expiry pgtype.Timestamptz
	var metaStateRaw []byte
	if err := s.db.QueryRow(ctx, `
		SELECT COALESCE(status,'not_connected'), COALESCE(access_token,''), COALESCE(refresh_token,''), expiry_at, COALESCE(metadata,'{}'::jsonb)
		FROM tenant_integrations
		WHERE tenant_id = $1 AND provider = $2
	`, tenantUUID, provider).Scan(&status, &accessEnc, &refreshEnc, &expiry, &metaStateRaw); err != nil {
		return LiveClassEventRow{}, err
	}
	if status != "connected" {
		return LiveClassEventRow{}, fmt.Errorf("integration not connected: %s", provider)
	}
	integrationMeta := map[string]interface{}{}
	_ = json.Unmarshal(metaStateRaw, &integrationMeta)
	accessToken := s.decryptMaybe(accessEnc)
	refreshToken := s.decryptMaybe(refreshEnc)
	meetingURL := ""
	externalEventID := ""
	meta := map[string]interface{}{}
	useMockMeeting := stringOr(integrationMeta["connected_via"], "") == "mock_oauth" || strings.TrimSpace(accessToken) == ""
	if !useMockMeeting && expiry.Valid && expiry.Time.Before(s.now().Add(30*time.Second)) && strings.TrimSpace(refreshToken) != "" {
		if refreshed, err := s.refreshOAuthToken(ctx, provider, refreshToken); err == nil {
			accessToken = refreshed.AccessToken
			if refreshed.RefreshToken != "" {
				refreshToken = refreshed.RefreshToken
			}
			newExpiry := pgtype.Timestamptz{}
			if refreshed.ExpiryAt != nil {
				newExpiry = pgtype.Timestamptz{Time: *refreshed.ExpiryAt, Valid: true}
			}
			_, _ = s.db.Exec(ctx, `
				UPDATE tenant_integrations
				SET access_token = $3, refresh_token = $4, expiry_at = $5, updated_at = NOW(), last_sync_at = NOW(), last_error = ''
				WHERE tenant_id = $1 AND provider = $2
			`, tenantUUID, provider, s.encryptMaybe(accessToken), s.encryptMaybe(refreshToken), newExpiry)
		} else {
			_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status='needs_reauth', last_error=$3, updated_at=NOW() WHERE tenant_id=$1 AND provider=$2`, tenantUUID, provider, err.Error())
			return LiveClassEventRow{}, fmt.Errorf("integration requires reauthorization")
		}
	}
	if !useMockMeeting {
		meetingURL, externalEventID, meta, err = s.createProviderMeeting(ctx, provider, accessToken, p)
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "invalid_grant") || strings.Contains(strings.ToLower(err.Error()), "unauthorized") {
				_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status='needs_reauth', last_error=$3, updated_at=NOW() WHERE tenant_id=$1 AND provider=$2`, tenantUUID, provider, err.Error())
				return LiveClassEventRow{}, fmt.Errorf("integration requires reauthorization")
			}
			return LiveClassEventRow{}, err
		}
	} else {
		meetingURL = generateMeetingURL(provider)
		externalEventID = provider + "_" + uuid.NewString()
		meta = map[string]interface{}{"created_via": "mock_calendar_api"}
	}
	metaRaw, _ := json.Marshal(meta)
	var row LiveClassEventRow
	var id uuid.UUID
	var desc pgtype.Text
	err = s.db.QueryRow(ctx, `
		INSERT INTO live_class_events (
			tenant_id, provider, teacher_user_id, class_id, section_id, title, description,
			starts_at, ends_at, meeting_url, external_event_id, status, metadata
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'scheduled',$12)
		RETURNING id, provider, title, COALESCE(description,''), starts_at, ends_at, COALESCE(meeting_url,''), status, COALESCE(external_event_id,''), metadata
	`, tenantUUID, provider, teacherUUID, classUUID, sectionUUID, p.Title, nullableText(p.Description), p.StartsAt, p.EndsAt, meetingURL, externalEventID, metaRaw).
		Scan(&id, &row.Provider, &row.Title, &desc, &row.StartsAt, &row.EndsAt, &row.MeetingURL, &row.Status, &row.ExternalEventID, &metaRaw)
	if err != nil {
		return LiveClassEventRow{}, err
	}
	row.ID = id.String()
	row.Description = desc.String
	_ = json.Unmarshal(metaRaw, &row.Metadata)
	s.auditTenantAction(ctx, p.TenantID, p.TeacherID, "teacher.live_class.schedule", "live_class_event", map[string]interface{}{
		"provider": provider,
		"title":    p.Title,
	}, map[string]interface{}{
		"event_id":          row.ID,
		"external_event_id": row.ExternalEventID,
		"meeting_url":       row.MeetingURL,
	})
	return row, nil
}

func (s *Service) ListLiveClasses(ctx context.Context, tenantID string, limit int32) ([]LiveClassEventRow, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if s.db == nil {
		return nil, fmt.Errorf("db unavailable")
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return nil, err
	}
	rows, err := s.db.Query(ctx, `
		SELECT id, provider, title, COALESCE(description,''), starts_at, ends_at, COALESCE(meeting_url,''), status, COALESCE(external_event_id,''), metadata
		FROM live_class_events
		WHERE tenant_id = $1
		ORDER BY starts_at DESC
		LIMIT $2
	`, tid, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []LiveClassEventRow{}
	for rows.Next() {
		var id uuid.UUID
		var row LiveClassEventRow
		var desc pgtype.Text
		var metaRaw []byte
		if err := rows.Scan(&id, &row.Provider, &row.Title, &desc, &row.StartsAt, &row.EndsAt, &row.MeetingURL, &row.Status, &row.ExternalEventID, &metaRaw); err != nil {
			return nil, err
		}
		row.ID = id.String()
		row.Description = desc.String
		_ = json.Unmarshal(metaRaw, &row.Metadata)
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Service) RefreshExpiredIntegrationTokens(ctx context.Context) error {
	if s.db == nil {
		return nil
	}
	rows, err := s.db.Query(ctx, `
		SELECT tenant_id, provider, refresh_token
		FROM tenant_integrations
		WHERE status = 'connected'
		  AND refresh_token IS NOT NULL
		  AND (expiry_at IS NULL OR expiry_at <= NOW() + INTERVAL '10 minutes')
	`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var tid pgtype.UUID
		var provider string
		var refreshEnc *string
		if err := rows.Scan(&tid, &provider, &refreshEnc); err != nil {
			continue
		}
		tenantID, err := pgUUIDToString(tid)
		if err != nil {
			continue
		}
		refreshToken := ""
		if refreshEnc != nil {
			refreshToken = s.decryptMaybe(*refreshEnc)
		}
		if strings.TrimSpace(refreshToken) == "" {
			_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status = 'needs_reauth', last_error = 'missing refresh token', updated_at = NOW() WHERE tenant_id = $1 AND provider = $2`, tid, provider)
			continue
		}
		cfg := s.providerConfig(provider)
		if s.useMockOAuth() || !cfg.configured() || strings.HasPrefix(refreshToken, "refresh_"+provider+"_mock-") {
			newAccess := s.encryptMaybe("refreshed_" + provider + "_" + shortFingerprint(refreshToken))
			_, err = s.db.Exec(ctx, `
				UPDATE tenant_integrations
				SET access_token = $3, expiry_at = NOW() + INTERVAL '55 minutes', last_sync_at = NOW(), updated_at = NOW(), last_error = ''
				WHERE tenant_id = $1 AND provider = $2
			`, tid, provider, newAccess)
		} else {
			refreshed, rerr := s.refreshOAuthToken(ctx, provider, refreshToken)
			if rerr != nil {
				_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status = 'needs_reauth', last_error = $3, updated_at = NOW() WHERE tenant_id = $1 AND provider = $2`, tid, provider, rerr.Error())
				continue
			}
			expiryAt := pgtype.Timestamptz{}
			if refreshed.ExpiryAt != nil {
				expiryAt = pgtype.Timestamptz{Time: *refreshed.ExpiryAt, Valid: true}
			}
			_, err = s.db.Exec(ctx, `
				UPDATE tenant_integrations
				SET access_token = $3,
				    refresh_token = $4,
				    token_type = $5,
				    expiry_at = $6,
				    last_sync_at = NOW(),
				    updated_at = NOW(),
				    last_error = ''
				WHERE tenant_id = $1 AND provider = $2
			`, tid, provider, s.encryptMaybe(refreshed.AccessToken), s.encryptMaybe(refreshed.RefreshToken), stringOr(refreshed.TokenType, "Bearer"), expiryAt)
		}
		if err != nil {
			_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status = 'needs_reauth', last_error = $3, updated_at = NOW() WHERE tenant_id = $1 AND provider = $2`, tid, provider, err.Error())
		}
		_ = tenantID // reserved for future structured logging
	}
	return nil
}

func (s *Service) ApplyMonthlyIncludedCredits(ctx context.Context, yyyymm string) error {
	if s.db == nil {
		return nil
	}
	if strings.TrimSpace(yyyymm) == "" {
		yyyymm = time.Now().Format("2006-01")
	}
	rows, err := s.db.Query(ctx, `
		SELECT ta.tenant_id, pa.code, COALESCE(pa.included_credits, '{}'::jsonb)
		FROM tenant_addons ta
		JOIN platform_addons pa ON pa.id = ta.addon_id
		WHERE ta.status = 'active' AND COALESCE(pa.status, 'active') = 'active'
		  AND (ta.end_at IS NULL OR ta.end_at > NOW())
	`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var tid pgtype.UUID
		var addonCode string
		var creditsRaw []byte
		if err := rows.Scan(&tid, &addonCode, &creditsRaw); err != nil {
			continue
		}
		tenantID, err := pgUUIDToString(tid)
		if err != nil {
			continue
		}
		credits := map[string]int64{}
		_ = json.Unmarshal(creditsRaw, &credits)
		for walletType, amount := range credits {
			if amount <= 0 {
				continue
			}
			ref := fmt.Sprintf("monthly_allowance:%s:%s:%s:%s", yyyymm, tenantID, walletType, addonCode)
			_ = s.applyCreditLedger(ctx, tenantID, walletType, amount, "included_allowance", ref, map[string]interface{}{"addon_code": addonCode, "period": yyyymm}, nil)
		}
	}
	return nil
}

func (s *Service) upsertTenantIntegrationOAuthState(ctx context.Context, tenantID, provider, actorUserID, state string) error {
	if s.db == nil {
		return fmt.Errorf("db unavailable")
	}
	tid, err := parseUUID(tenantID)
	if err != nil {
		return err
	}
	var uid pgtype.UUID
	_ = uid.Scan(actorUserID)
	metadataRaw, _ := json.Marshal(map[string]interface{}{
		"oauth_state":           state,
		"oauth_state_issued_at": s.now().UTC().Format(time.RFC3339),
	})
	_, err = s.db.Exec(ctx, `
		INSERT INTO tenant_integrations (tenant_id, provider, status, metadata, created_by, updated_by)
		VALUES ($1, $2, 'not_connected', $3, $4, $4)
		ON CONFLICT (tenant_id, provider)
		DO UPDATE SET metadata = tenant_integrations.metadata || EXCLUDED.metadata, updated_by = EXCLUDED.updated_by, updated_at = NOW()
	`, tid, provider, metadataRaw, uid)
	return err
}

func (s *Service) resolveConnectedLiveProvider(ctx context.Context, tenantID, preferred string) (provider string, addonCode string, err error) {
	p := normalizeProvider(preferred)
	if p != "" {
		statuses, err := s.ListTenantIntegrations(ctx, tenantID)
		if err != nil {
			return "", "", err
		}
		for _, item := range statuses {
			if item.Provider == p && item.Connected {
				return item.Provider, item.AddonCode, nil
			}
		}
		return "", "", fmt.Errorf("integration not connected: %s", p)
	}
	statuses, err := s.ListTenantIntegrations(ctx, tenantID)
	if err != nil {
		return "", "", err
	}
	for _, item := range statuses {
		if item.Connected {
			return item.Provider, item.AddonCode, nil
		}
	}
	return "", "", fmt.Errorf("no live class integration connected")
}

func (s *Service) encryptMaybe(value string) string {
	if strings.TrimSpace(value) == "" || s.crypto == nil {
		return value
	}
	enc, err := s.crypto.Encrypt([]byte(value))
	if err != nil {
		return value
	}
	return "enc:" + hex.EncodeToString(enc)
}

func (s *Service) decryptMaybe(value string) string {
	if !strings.HasPrefix(value, "enc:") || s.crypto == nil {
		return value
	}
	raw, err := hex.DecodeString(strings.TrimPrefix(value, "enc:"))
	if err != nil {
		return value
	}
	dec, err := s.crypto.Decrypt(raw)
	if err != nil {
		return value
	}
	return string(dec)
}

func normalizeProvider(provider string) string {
	p := strings.ToLower(strings.TrimSpace(provider))
	switch p {
	case "google", "google_workspace":
		return "google_workspace"
	case "microsoft", "microsoft_365", "office365":
		return "microsoft_365"
	default:
		return ""
	}
}

func randomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func shortFingerprint(v string) string {
	sum := uuid.NewSHA1(uuid.NameSpaceURL, []byte(v))
	return strings.ReplaceAll(sum.String()[:8], "-", "")
}

func generateMeetingURL(provider string) string {
	switch provider {
	case "google_workspace":
		return "https://meet.google.com/" + strings.ToLower(strings.ReplaceAll(uuid.NewString()[:12], "-", ""))
	case "microsoft_365":
		return "https://teams.microsoft.com/l/meetup-join/" + uuid.NewString()
	default:
		return ""
	}
}

func asInt64(v interface{}) (int64, bool) {
	switch t := v.(type) {
	case int64:
		return t, true
	case int:
		return int64(t), true
	case float64:
		return int64(t), true
	default:
		return 0, false
	}
}

func stringOr(v interface{}, fallback string) string {
	if s, ok := v.(string); ok && strings.TrimSpace(s) != "" {
		return s
	}
	return fallback
}

func stringSlice(v interface{}) []string {
	switch t := v.(type) {
	case []string:
		return t
	case []interface{}:
		out := make([]string, 0, len(t))
		for _, x := range t {
			if s, ok := x.(string); ok {
				out = append(out, s)
			}
		}
		return out
	default:
		return nil
	}
}

func creditMap(v interface{}) map[string]int64 {
	out := map[string]int64{}
	switch t := v.(type) {
	case map[string]int64:
		return t
	case map[string]interface{}:
		for k, x := range t {
			if n, ok := asInt64(x); ok {
				out[k] = n
			}
		}
	}
	return out
}

func parseUUID(value string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(strings.TrimSpace(value)); err != nil || !id.Valid {
		if err == nil {
			err = fmt.Errorf("invalid uuid")
		}
		return pgtype.UUID{}, err
	}
	return id, nil
}

func parseUUIDNullable(value string) (pgtype.UUID, error) {
	if strings.TrimSpace(value) == "" {
		return pgtype.UUID{}, nil
	}
	return parseUUID(value)
}

func nullableText(v string) pgtype.Text {
	return pgtype.Text{String: strings.TrimSpace(v), Valid: strings.TrimSpace(v) != ""}
}

func errorAsPg(err error, target **pgconn.PgError) bool {
	if err == nil || target == nil {
		return false
	}
	return errors.As(err, target)
}

func pgUUIDToString(v pgtype.UUID) (string, error) {
	if !v.Valid {
		return "", fmt.Errorf("invalid uuid")
	}
	id, err := uuid.FromBytes(v.Bytes[:])
	if err != nil {
		return "", err
	}
	return id.String(), nil
}

func (s *Service) auditTenantAction(ctx context.Context, tenantID, userID, action, resourceType string, before, after interface{}) {
	if s.audit == nil {
		return
	}
	tid, _ := parseUUID(tenantID)
	uid, _ := parseUUIDNullable(userID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tid,
		UserID:       uid,
		Action:       action,
		ResourceType: resourceType,
		Before:       before,
		After:        after,
	})
}

func defaultAPIBaseURL() string {
	base := strings.TrimSpace(os.Getenv("PUBLIC_API_BASE_URL"))
	if base == "" {
		base = strings.TrimSpace(os.Getenv("API_BASE_URL"))
	}
	if base == "" {
		base = "http://localhost:8080"
	}
	return strings.TrimRight(base, "/")
}
