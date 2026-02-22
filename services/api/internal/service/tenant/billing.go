package tenant

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInsufficientCredits = errors.New("INSUFFICIENT_CREDITS")
	ErrRateNotConfigured   = errors.New("RATE_NOT_CONFIGURED")
	ErrAddonRequired       = errors.New("ADDON_REQUIRED")
)

// --- Entitlements ---

func (s *Service) HasAddon(ctx context.Context, tenantID string, addonCode string) (bool, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return false, err
	}

	const query = `
		SELECT EXISTS (
			SELECT 1 FROM tenant_addons ta
			JOIN platform_addons pa ON ta.addon_id = pa.id
			WHERE ta.tenant_id = $1 AND pa.code = $2 AND ta.status = 'active'
			AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
		)
	`
	var active bool
	err = s.db.QueryRow(ctx, query, tid, addonCode).Scan(&active)
	return active, err
}

func (s *Service) ListActiveAddons(ctx context.Context, tenantID string) ([]map[string]interface{}, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return nil, err
	}

	const query = `
		SELECT pa.code, pa.name, ta.status, ta.settings, ta.expires_at
		FROM tenant_addons ta
		JOIN platform_addons pa ON ta.addon_id = pa.id
		WHERE ta.tenant_id = $1 AND ta.status = 'active'
		AND (ta.expires_at IS NULL OR ta.expires_at > NOW())
	`
	rows, err := s.db.Query(ctx, query, tid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var addons []map[string]interface{}
	for rows.Next() {
		var code, name, status string
		var settings []byte
		var expiresAt pgtype.Timestamptz
		if err := rows.Scan(&code, &name, &status, &settings, &expiresAt); err != nil {
			return nil, err
		}

		var settingsMap map[string]interface{}
		json.Unmarshal(settings, &settingsMap)

		addons = append(addons, map[string]interface{}{
			"code":       code,
			"name":       name,
			"status":     status,
			"settings":   settingsMap,
			"expires_at": expiresAt.Time,
		})
	}
	return addons, nil
}

// --- Wallet & Ledger ---

func (s *Service) GetWalletBalance(ctx context.Context, tenantID string) (int64, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return 0, err
	}

	const query = `SELECT balance_paise FROM wallets WHERE tenant_id = $1`
	var balance int64
	err = s.db.QueryRow(ctx, query, tid).Scan(&balance)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	return balance, err
}

func (s *Service) CreditWallet(ctx context.Context, tenantID string, amount int64, userID *string, creditType string, desc string, ref string, metadata map[string]interface{}) error {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return err
	}

	var uid pgtype.UUID
	if userID != nil {
		uid.Scan(*userID)
	}

	metaJSON, _ := json.Marshal(metadata)

	return pgx.BeginFunc(ctx, s.db, func(tx pgx.Tx) error {
		// 1. Get or Create Wallet
		var walletID pgtype.UUID
		err := tx.QueryRow(ctx, `
			INSERT INTO wallets (tenant_id, balance_paise)
			VALUES ($1, $2)
			ON CONFLICT (tenant_id) DO UPDATE SET balance_paise = wallets.balance_paise + $2, updated_at = NOW()
			RETURNING id
		`, tid, amount).Scan(&walletID)
		if err != nil {
			return err
		}

		// 2. Write Ledger
		_, err = tx.Exec(ctx, `
			INSERT INTO wallet_ledger (wallet_id, amount_paise, type, description, reference_id, user_id, metadata)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, walletID, amount, creditType, desc, ref, uid, metaJSON)
		return err
	})
}

func (s *Service) DebitWallet(ctx context.Context, tenantID string, amount int64, userID *string, debitType string, desc string, ref string, metadata map[string]interface{}) error {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return err
	}

	var uid pgtype.UUID
	if userID != nil {
		uid.Scan(*userID)
	}

	metaJSON, _ := json.Marshal(metadata)

	return pgx.BeginFunc(ctx, s.db, func(tx pgx.Tx) error {
		// 1. Lock wallet and check balance
		var walletID pgtype.UUID
		var currentBalance int64
		err := tx.QueryRow(ctx, `
			SELECT id, balance_paise FROM wallets WHERE tenant_id = $1 FOR UPDATE
		`, tid).Scan(&walletID, &currentBalance)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrInsufficientCredits
			}
			return err
		}

		if currentBalance < amount {
			return ErrInsufficientCredits
		}

		// 2. Update Balance
		_, err = tx.Exec(ctx, `
			UPDATE wallets SET balance_paise = balance_paise - $1, updated_at = NOW() WHERE id = $2
		`, amount, walletID)
		if err != nil {
			return err
		}

		// 3. Write Ledger
		_, err = tx.Exec(ctx, `
			INSERT INTO wallet_ledger (wallet_id, amount_paise, type, description, reference_id, user_id, metadata)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, walletID, -amount, debitType, desc, ref, uid, metaJSON)
		return err
	})
}

// --- Metering ---

func (s *Service) GetEffectiveRate(ctx context.Context, tenantID string, featureCode string) (int64, error) {
	tid, err := parseTenantUUID(tenantID)
	if err != nil {
		return 0, err
	}

	const query = `
		SELECT cost_per_unit FROM rate_cards
		WHERE (tenant_id = $1 OR tenant_id IS NULL) AND feature_code = $2 AND is_active = TRUE
		ORDER BY tenant_id NULLS LAST, effective_from DESC
		LIMIT 1
	`
	var cost int64
	err = s.db.QueryRow(ctx, query, tid, featureCode).Scan(&cost)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrRateNotConfigured
	}
	return cost, err
}
