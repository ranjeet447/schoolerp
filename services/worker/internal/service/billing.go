package service

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	cryptorand "crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInsufficientCredits = errors.New("INSUFFICIENT_CREDITS")
	ErrRateNotConfigured   = errors.New("RATE_NOT_CONFIGURED")
	ErrAddonRequired       = errors.New("ADDON_REQUIRED")
)

type BillingService struct {
	db   *pgxpool.Pool
	key  []byte
	http *http.Client
}

func NewBillingService(db *pgxpool.Pool) *BillingService {
	return &BillingService{
		db:   db,
		key:  workerEncryptionKey(),
		http: &http.Client{Timeout: 15 * time.Second},
	}
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

	if strings.TrimSpace(ref) == "" {
		return errors.New("reference_id is required for wallet debits")
	}

	var uid pgtype.UUID
	if userID != nil {
		uid.Scan(*userID)
	}

	metaJSON, _ := json.Marshal(metadata)

	return pgx.BeginFunc(ctx, s.db, func(tx pgx.Tx) error {
		// First, check if this reference_id has already been processed to avoid double billing
		var exists bool
		err := tx.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1 FROM wallet_ledger
				WHERE reference_id = $1 AND wallet_id IN (SELECT id FROM wallets WHERE tenant_id = $2)
			)
		`, ref, tid).Scan(&exists)
		if err == nil && exists {
			return nil // Already processed
		}

		// 1. Lock wallet and check balance
		var walletID pgtype.UUID
		var currentBalance int64
		err = tx.QueryRow(ctx, `
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
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				return nil // Idempotent success (already processed)
			}
			return err
		}
		return nil
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

func (s *BillingService) GetCreditBalance(ctx context.Context, tenantID, walletType string) (int64, error) {
	tid := pgtype.UUID{}
	if err := tid.Scan(tenantID); err != nil {
		return 0, err
	}
	var balance int64
	err := s.db.QueryRow(ctx, `
		SELECT balance FROM tenant_credit_wallets WHERE tenant_id = $1 AND wallet_type = $2
	`, tid, walletType).Scan(&balance)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	return balance, err
}

func (s *BillingService) DebitUsageCredits(ctx context.Context, tenantID, walletType string, amount int64, ref string, metadata map[string]interface{}) error {
	return s.applyCreditLedger(ctx, tenantID, walletType, -amount, "message_send", ref, metadata)
}

func (s *BillingService) CreditUsageCredits(ctx context.Context, tenantID, walletType string, amount int64, ref string, metadata map[string]interface{}) error {
	return s.applyCreditLedger(ctx, tenantID, walletType, amount, "message_refund", ref, metadata)
}

func (s *BillingService) applyCreditLedger(ctx context.Context, tenantID, walletType string, amount int64, source, ref string, metadata map[string]interface{}) error {
	tid := pgtype.UUID{}
	if err := tid.Scan(tenantID); err != nil {
		return err
	}
	if strings.TrimSpace(ref) == "" {
		return errors.New("reference_id is required for tenant credit ledger")
	}
	metaJSON, _ := json.Marshal(metadata)
	return pgx.BeginFunc(ctx, s.db, func(tx pgx.Tx) error {
		var exists bool
		err := tx.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1 FROM tenant_credit_ledger
				WHERE tenant_id = $1 AND wallet_type = $2 AND reference_id = $3
			)
		`, tid, walletType, ref).Scan(&exists)
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
		var balance int64
		if err := tx.QueryRow(ctx, `
			SELECT balance FROM tenant_credit_wallets WHERE tenant_id = $1 AND wallet_type = $2 FOR UPDATE
		`, tid, walletType).Scan(&balance); err != nil {
			return err
		}
		if amount < 0 && balance < -amount {
			return ErrInsufficientCredits
		}
		_, err = tx.Exec(ctx, `
			UPDATE tenant_credit_wallets SET balance = balance + $3, updated_at = NOW()
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
			INSERT INTO tenant_credit_ledger (tenant_id, wallet_type, entry_type, amount, source, reference_id, metadata)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, tid, walletType, entryType, amount, source, ref, metaJSON)
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				return nil
			}
			return err
		}
		return nil
	})
}

func (s *BillingService) ApplyMonthlyIncludedCredits(ctx context.Context, yyyymm string) error {
	if strings.TrimSpace(yyyymm) == "" {
		yyyymm = time.Now().Format("2006-01")
	}
	rows, err := s.db.Query(ctx, `
		SELECT t.id::text, pa.code, COALESCE(pa.included_credits, '{}'::jsonb)
		FROM tenants t
		JOIN tenant_addons ta ON ta.tenant_id = t.id
		JOIN platform_addons pa ON pa.id = ta.addon_id
		WHERE ta.status = 'active'
		  AND COALESCE(pa.status, 'active') = 'active'
		  AND (ta.end_at IS NULL OR ta.end_at > NOW())
	`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var tenantID, addonCode string
		var creditsRaw []byte
		if err := rows.Scan(&tenantID, &addonCode, &creditsRaw); err != nil {
			continue
		}
		credits := map[string]int64{}
		_ = json.Unmarshal(creditsRaw, &credits)
		for walletType, amount := range credits {
			if amount <= 0 {
				continue
			}
			ref := fmt.Sprintf("monthly_allowance:%s:%s:%s:%s", yyyymm, tenantID, walletType, addonCode)
			_ = s.applyCreditLedger(ctx, tenantID, walletType, amount, "included_allowance", ref, map[string]interface{}{"addon_code": addonCode, "period": yyyymm})
		}
	}
	return rows.Err()
}

func (s *BillingService) RefreshExpiringIntegrationTokens(ctx context.Context) error {
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
		var refreshToken *string
		if err := rows.Scan(&tid, &provider, &refreshToken); err != nil {
			continue
		}
		refresh := ""
		if refreshToken != nil {
			refresh = s.decryptMaybe(*refreshToken)
		}
		if strings.TrimSpace(refresh) == "" {
			_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status = 'needs_reauth', last_error = 'missing refresh token', updated_at = NOW() WHERE tenant_id = $1 AND provider = $2`, tid, provider)
			continue
		}
		if strings.TrimSpace(os.Getenv("INTEGRATIONS_MOCK_OAUTH")) == "1" || strings.HasPrefix(refresh, "refresh_"+provider+"_mock-") {
			_, err := s.db.Exec(ctx, `
				UPDATE tenant_integrations
				SET expiry_at = NOW() + INTERVAL '55 minutes',
				    last_sync_at = NOW(),
				    last_error = '',
				    updated_at = NOW()
				WHERE tenant_id = $1 AND provider = $2
			`, tid, provider)
			if err != nil {
				_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status = 'needs_reauth', last_error = $3, updated_at = NOW() WHERE tenant_id = $1 AND provider = $2`, tid, provider, err.Error())
			}
			continue
		}
		token, rerr := s.refreshProviderToken(ctx, provider, refresh)
		if rerr != nil {
			_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status = 'needs_reauth', last_error = $3, updated_at = NOW() WHERE tenant_id = $1 AND provider = $2`, tid, provider, rerr.Error())
			continue
		}
		expiryAt := pgtype.Timestamptz{}
		if token.ExpiresAt != nil {
			expiryAt = pgtype.Timestamptz{Time: *token.ExpiresAt, Valid: true}
		}
		_, err = s.db.Exec(ctx, `
			UPDATE tenant_integrations
			SET access_token = $3,
			    refresh_token = $4,
			    token_type = $5,
			    expiry_at = $6,
			    last_sync_at = NOW(),
			    last_error = '',
			    updated_at = NOW()
			WHERE tenant_id = $1 AND provider = $2
		`, tid, provider, s.encryptMaybe(token.AccessToken), s.encryptMaybe(token.RefreshToken), token.TokenType, expiryAt)
		if err != nil {
			_, _ = s.db.Exec(ctx, `UPDATE tenant_integrations SET status = 'needs_reauth', last_error = $3, updated_at = NOW() WHERE tenant_id = $1 AND provider = $2`, tid, provider, err.Error())
		}
	}
	return rows.Err()
}

type refreshedToken struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiresAt    *time.Time
}

func (s *BillingService) refreshProviderToken(ctx context.Context, provider, refreshToken string) (refreshedToken, error) {
	clientID, clientSecret, tokenURL, scopes := workerProviderOAuthConfig(provider)
	if clientID == "" || clientSecret == "" || tokenURL == "" {
		return refreshedToken{}, errors.New("provider oauth credentials not configured")
	}
	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("grant_type", "refresh_token")
	form.Set("refresh_token", refreshToken)
	if scopes != "" && provider == "microsoft_365" {
		form.Set("scope", scopes)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return refreshedToken{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.http.Do(req)
	if err != nil {
		return refreshedToken{}, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return refreshedToken{}, fmt.Errorf("oauth refresh failed: %s", string(body))
	}
	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		TokenType    string `json:"token_type"`
		ExpiresIn    int64  `json:"expires_in"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return refreshedToken{}, err
	}
	if strings.TrimSpace(tokenResp.AccessToken) == "" {
		return refreshedToken{}, errors.New("empty access_token from oauth refresh")
	}
	out := refreshedToken{
		AccessToken:  tokenResp.AccessToken,
		RefreshToken: tokenResp.RefreshToken,
		TokenType:    tokenResp.TokenType,
	}
	if out.RefreshToken == "" {
		out.RefreshToken = refreshToken
	}
	if out.TokenType == "" {
		out.TokenType = "Bearer"
	}
	if tokenResp.ExpiresIn > 0 {
		t := time.Now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second)
		out.ExpiresAt = &t
	}
	return out, nil
}

func workerProviderOAuthConfig(provider string) (clientID, clientSecret, tokenURL, scopes string) {
	switch strings.ToLower(strings.TrimSpace(provider)) {
	case "google_workspace", "google":
		return strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_CLIENT_ID")),
			strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET")),
			"https://oauth2.googleapis.com/token",
			"https://www.googleapis.com/auth/calendar openid email profile"
	case "microsoft_365", "microsoft", "office365":
		tenantID := strings.TrimSpace(os.Getenv("MICROSOFT_OAUTH_TENANT_ID"))
		if tenantID == "" {
			tenantID = "common"
		}
		return strings.TrimSpace(os.Getenv("MICROSOFT_OAUTH_CLIENT_ID")),
			strings.TrimSpace(os.Getenv("MICROSOFT_OAUTH_CLIENT_SECRET")),
			"https://login.microsoftonline.com/" + tenantID + "/oauth2/v2.0/token",
			"offline_access openid email profile https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read"
	default:
		return "", "", "", ""
	}
}

func workerEncryptionKey() []byte {
	key := strings.TrimSpace(os.Getenv("TENANT_ENCRYPTION_KEY"))
	if len(key) != 32 {
		jwtSecret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
		if len(jwtSecret) >= 32 {
			key = jwtSecret[:32]
		}
	}
	if len(key) != 32 {
		return nil
	}
	return []byte(key)
}

func (s *BillingService) encryptMaybe(v string) string {
	if strings.TrimSpace(v) == "" || len(s.key) != 32 {
		return v
	}
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return v
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return v
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(cryptorand.Reader, nonce); err != nil {
		return v
	}
	ct := gcm.Seal(nonce, nonce, []byte(v), nil)
	return "enc:" + hex.EncodeToString(ct)
}

func (s *BillingService) decryptMaybe(v string) string {
	if !strings.HasPrefix(v, "enc:") || len(s.key) != 32 {
		return v
	}
	raw, err := hex.DecodeString(strings.TrimPrefix(v, "enc:"))
	if err != nil {
		return v
	}
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return v
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return v
	}
	n := gcm.NonceSize()
	if len(raw) < n {
		return v
	}
	dec, err := gcm.Open(nil, raw[:n], raw[n:], nil)
	if err != nil {
		return v
	}
	return string(dec)
}
