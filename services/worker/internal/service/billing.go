package service

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInsufficientCredits = errors.New("INSUFFICIENT_CREDITS")
	ErrRateNotConfigured   = errors.New("RATE_NOT_CONFIGURED")
	ErrAddonRequired       = errors.New("ADDON_REQUIRED")
)

type BillingService struct {
	db *pgxpool.Pool
}

func NewBillingService(db *pgxpool.Pool) *BillingService {
	return &BillingService{db: db}
}

func (s *BillingService) HasAddon(ctx context.Context, tenantID string, addonCode string) (bool, error) {
	tid := pgtype.UUID{}
	if err := tid.Scan(tenantID); err != nil {
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
	err := s.db.QueryRow(ctx, query, tid, addonCode).Scan(&active)
	return active, err
}

func (s *BillingService) GetWalletBalance(ctx context.Context, tenantID string) (int64, error) {
	tid := pgtype.UUID{}
	if err := tid.Scan(tenantID); err != nil {
		return 0, err
	}

	const query = `SELECT balance_paise FROM wallets WHERE tenant_id = $1`
	var balance int64
	err := s.db.QueryRow(ctx, query, tid).Scan(&balance)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	return balance, err
}

func (s *BillingService) DebitWallet(ctx context.Context, tenantID string, amount int64, userID *string, debitType string, desc string, ref string, metadata map[string]interface{}) error {
	tid := pgtype.UUID{}
	if err := tid.Scan(tenantID); err != nil {
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

func (s *BillingService) GetEffectiveRate(ctx context.Context, tenantID string, featureCode string) (int64, error) {
	tid := pgtype.UUID{}
	if err := tid.Scan(tenantID); err != nil {
		return 0, err
	}

	const query = `
		SELECT cost_per_unit FROM rate_cards
		WHERE (tenant_id = $1 OR tenant_id IS NULL) AND feature_code = $2 AND is_active = TRUE
		ORDER BY tenant_id NULLS LAST, effective_from DESC
		LIMIT 1
	`
	var cost int64
	err := s.db.QueryRow(ctx, query, tid, featureCode).Scan(&cost)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrRateNotConfigured
	}
	return cost, err
}
