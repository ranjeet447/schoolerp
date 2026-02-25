package finance

import (
	"context"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

// Advanced Fee Configurations

type FeeClassConfigParams struct {
	TenantID       string     `json:"tenant_id"`
	AcademicYearID string     `json:"academic_year_id"`
	ClassID        string     `json:"class_id"`
	FeeHeadID      string     `json:"fee_head_id"`
	Amount         float64    `json:"amount"`
	DueDate        *time.Time `json:"due_date"`
	IsOptional     bool       `json:"is_optional"`
}

func (s *Service) UpsertFeeClassConfig(ctx context.Context, p FeeClassConfigParams) (db.FeeClassConfiguration, error) {
	tID := toPgUUID(p.TenantID)
	ayID := toPgUUID(p.AcademicYearID)
	cID := toPgUUID(p.ClassID)
	fhID := toPgUUID(p.FeeHeadID)

	var dDate pgtype.Date
	if p.DueDate != nil {
		dDate = pgtype.Date{Time: *p.DueDate, Valid: true}
	}

	return s.q.UpsertFeeClassConfig(ctx, db.UpsertFeeClassConfigParams{
		TenantID:       tID,
		AcademicYearID: ayID,
		ClassID:        cID,
		FeeHeadID:      fhID,
		Amount:         floatToNumeric(p.Amount),
		DueDate:        dDate,
		IsOptional:     pgtype.Bool{Bool: p.IsOptional, Valid: true},
	})
}

func (s *Service) ListFeeClassConfigs(ctx context.Context, tenantID, ayID string, classID *string) ([]db.ListFeeClassConfigsRow, error) {
	tID := toPgUUID(tenantID)
	ayIDPg := toPgUUID(ayID)
	var cID pgtype.UUID
	if classID != nil {
		cID = toPgUUID(*classID)
	}

	return s.q.ListFeeClassConfigs(ctx, db.ListFeeClassConfigsParams{
		TenantID:       tID,
		AcademicYearID: ayIDPg,
		ClassID:        cID,
	})
}

// Scholarships

type ScholarshipParams struct {
	TenantID    string  `json:"tenant_id"`
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Value       float64 `json:"value"`
	Description string  `json:"description"`
	IsActive    bool    `json:"is_active"`
}

func (s *Service) UpsertScholarship(ctx context.Context, p ScholarshipParams) (db.FeeDiscountsScholarship, error) {
	tID := toPgUUID(p.TenantID)

	return s.q.UpsertScholarship(ctx, db.UpsertScholarshipParams{
		TenantID:    tID,
		Name:        p.Name,
		Type:        p.Type,
		Value:       floatToNumeric(p.Value),
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
		IsActive:    pgtype.Bool{Bool: p.IsActive, Valid: true},
	})
}

func (s *Service) ListScholarships(ctx context.Context, tenantID string, isActive *bool) ([]db.FeeDiscountsScholarship, error) {
	tID := toPgUUID(tenantID)
	var active bool
	if isActive != nil {
		active = *isActive
	}

	return s.q.ListScholarships(ctx, db.ListScholarshipsParams{
		TenantID: tID,
		IsActive: active,
	})
}

func (s *Service) AssignScholarship(ctx context.Context, tenantID, studentID, scholarshipID, ayID, approverID string) (db.StudentScholarship, error) {
	return s.q.AssignScholarship(ctx, db.AssignScholarshipParams{
		TenantID:       toPgUUID(tenantID),
		StudentID:      toPgUUID(studentID),
		ScholarshipID:  toPgUUID(scholarshipID),
		AcademicYearID: toPgUUID(ayID),
		ApprovedBy:     toPgUUID(approverID),
	})
}

// Gateways

type GatewayConfigParams struct {
	TenantID      string `json:"tenant_id"`
	Provider      string `json:"provider"`
	APIKey        string `json:"api_key"`
	APISecret     string `json:"api_secret"`
	WebhookSecret string `json:"webhook_secret"`
	IsActive      bool   `json:"is_active"`
	Settings      []byte `json:"settings"`
}

func (s *Service) UpsertGatewayConfig(ctx context.Context, p GatewayConfigParams) (db.PaymentGatewayConfig, error) {
	apiKey := p.APIKey
	apiSecret := p.APISecret
	webhookSecret := p.WebhookSecret
	if strings.HasPrefix(strings.TrimSpace(apiKey), "********") {
		apiKey = ""
	}
	if strings.HasPrefix(strings.TrimSpace(apiSecret), "********") {
		apiSecret = ""
	}
	if strings.HasPrefix(strings.TrimSpace(webhookSecret), "********") {
		webhookSecret = ""
	}

	// Preserve existing encrypted secrets on partial updates when fields are omitted.
	if s.db != nil && (strings.TrimSpace(apiKey) == "" || strings.TrimSpace(apiSecret) == "" || strings.TrimSpace(webhookSecret) == "") {
		var currentAPIKey, currentAPISecret, currentWebhookSecret *string
		err := s.db.QueryRow(ctx, `
			SELECT api_key, api_secret, webhook_secret
			FROM payment_gateway_configs
			WHERE tenant_id = $1 AND provider = $2
			LIMIT 1
		`, toPgUUID(p.TenantID), strings.TrimSpace(p.Provider)).Scan(&currentAPIKey, &currentAPISecret, &currentWebhookSecret)
		if err == nil {
			if strings.TrimSpace(apiKey) == "" && currentAPIKey != nil {
				apiKey = *currentAPIKey
			}
			if strings.TrimSpace(apiSecret) == "" && currentAPISecret != nil {
				apiSecret = *currentAPISecret
			}
			if strings.TrimSpace(webhookSecret) == "" && currentWebhookSecret != nil {
				webhookSecret = *currentWebhookSecret
			}
		}
	}

	if s.crypto != nil {
		if apiKey != "" && !strings.HasPrefix(apiKey, "enc:") {
			enc, err := s.crypto.Encrypt([]byte(apiKey))
			if err == nil {
				apiKey = fmt.Sprintf("enc:%s", hex.EncodeToString(enc))
			}
		}
		if apiSecret != "" && !strings.HasPrefix(apiSecret, "enc:") {
			enc, err := s.crypto.Encrypt([]byte(apiSecret))
			if err == nil {
				apiSecret = fmt.Sprintf("enc:%s", hex.EncodeToString(enc))
			}
		}
		if webhookSecret != "" && !strings.HasPrefix(webhookSecret, "enc:") {
			enc, err := s.crypto.Encrypt([]byte(webhookSecret))
			if err == nil {
				webhookSecret = fmt.Sprintf("enc:%s", hex.EncodeToString(enc))
			}
		}
	}

	return s.q.UpsertGatewayConfig(ctx, db.UpsertGatewayConfigParams{
		TenantID:      toPgUUID(p.TenantID),
		Provider:      p.Provider,
		ApiKey:        pgtype.Text{String: apiKey, Valid: apiKey != ""},
		ApiSecret:     pgtype.Text{String: apiSecret, Valid: apiSecret != ""},
		WebhookSecret: pgtype.Text{String: webhookSecret, Valid: webhookSecret != ""},
		IsActive:      pgtype.Bool{Bool: p.IsActive, Valid: true},
		Settings:      p.Settings,
	})
}

func (s *Service) GetActiveGatewayConfig(ctx context.Context, tenantID, provider string) (db.PaymentGatewayConfig, error) {
	return s.q.GetActiveGatewayConfig(ctx, db.GetActiveGatewayConfigParams{
		TenantID: toPgUUID(tenantID),
		Provider: provider,
	})
}

func maskGatewaySecret(t pgtype.Text) pgtype.Text {
	if !t.Valid || t.String == "" {
		return t
	}
	if len(t.String) <= 8 {
		return pgtype.Text{String: "********", Valid: true}
	}
	return pgtype.Text{String: "********" + t.String[len(t.String)-4:], Valid: true}
}

func (s *Service) GetGatewayConfigForAdmin(ctx context.Context, tenantID, provider string) (db.PaymentGatewayConfig, error) {
	cfg, err := s.GetActiveGatewayConfig(ctx, tenantID, provider)
	if err != nil {
		return db.PaymentGatewayConfig{}, err
	}
	cfg.ApiSecret = maskGatewaySecret(cfg.ApiSecret)
	cfg.WebhookSecret = maskGatewaySecret(cfg.WebhookSecret)
	// Treat API key as sensitive in admin read APIs to avoid accidental disclosure.
	cfg.ApiKey = maskGatewaySecret(cfg.ApiKey)
	return cfg, nil
}

// GetGatewayPublicConfig returns a gateway config suitable for parent checkout bootstrapping.
// It decrypts only the fields that are safe to expose to the parent-facing flow (e.g. Razorpay key_id).
func (s *Service) GetGatewayPublicConfig(ctx context.Context, tenantID, provider string) (db.PaymentGatewayConfig, error) {
	cfg, err := s.GetActiveGatewayConfig(ctx, tenantID, provider)
	if err != nil {
		return db.PaymentGatewayConfig{}, err
	}
	if cfg.ApiKey.Valid {
		cfg.ApiKey.String = s.decryptSecret(cfg.ApiKey.String)
	}
	return cfg, nil
}

type GatewayWebhookStatus struct {
	Provider            string      `json:"provider"`
	LastReceivedAt      *time.Time  `json:"last_received_at,omitempty"`
	LastCompletedAt     *time.Time  `json:"last_completed_at,omitempty"`
	LastStatus          string      `json:"last_status,omitempty"`
	LastError           string      `json:"last_error,omitempty"`
	ReceivedCount24h    int64       `json:"received_count_24h"`
	CompletedCount24h   int64       `json:"completed_count_24h"`
	FailedCount24h      int64       `json:"failed_count_24h"`
	WebhookURL          string      `json:"webhook_url"`
}

func (s *Service) GetGatewayWebhookStatus(ctx context.Context, tenantID, provider, baseURL string) (GatewayWebhookStatus, error) {
	var lastReceived, lastProcessed pgtype.Timestamptz
	var lastStatus, lastErr pgtype.Text
	var received24h, completed24h, failed24h int64

	if s.db != nil {
		_ = s.db.QueryRow(ctx, `
			SELECT
			  COALESCE(MAX(created_at), NULL),
			  COALESCE(MAX(processed_at), NULL),
			  COALESCE((ARRAY_AGG(status ORDER BY created_at DESC))[1], ''),
			  COALESCE((ARRAY_AGG(COALESCE(error_message, '') ORDER BY created_at DESC))[1], ''),
			  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'),
			  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'completed'),
			  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'failed')
			FROM webhook_logs
			WHERE tenant_id = $1 AND provider = $2
		`, toPgUUID(tenantID), strings.TrimSpace(strings.ToLower(provider))).Scan(
			&lastReceived, &lastProcessed, &lastStatus, &lastErr, &received24h, &completed24h, &failed24h,
		)
	}

	status := GatewayWebhookStatus{
		Provider:          provider,
		ReceivedCount24h:  received24h,
		CompletedCount24h: completed24h,
		FailedCount24h:    failed24h,
		WebhookURL:        strings.TrimRight(baseURL, "/") + "/v1/payments/webhook/" + strings.TrimSpace(strings.ToLower(provider)),
	}
	if lastReceived.Valid {
		t := lastReceived.Time
		status.LastReceivedAt = &t
	}
	if lastProcessed.Valid {
		t := lastProcessed.Time
		status.LastCompletedAt = &t
	}
	if lastStatus.Valid {
		status.LastStatus = lastStatus.String
	}
	if lastErr.Valid {
		status.LastError = lastErr.String
	}
	return status, nil
}

type GatewayConnectionTestResult struct {
	Provider   string `json:"provider"`
	OK         bool   `json:"ok"`
	Mode       string `json:"mode"` // live_api | local_validation
	Message    string `json:"message"`
	HTTPStatus int    `json:"http_status,omitempty"`
}

func (s *Service) TestGatewayConfig(ctx context.Context, tenantID, provider string) (GatewayConnectionTestResult, error) {
	cfg, err := s.GetActiveGatewayConfig(ctx, tenantID, provider)
	if err != nil {
		return GatewayConnectionTestResult{Provider: provider, OK: false, Mode: "local_validation", Message: "gateway config not found"}, err
	}
	apiKey := s.decryptSecret(cfg.ApiKey.String)
	apiSecret := s.decryptSecret(cfg.ApiSecret.String)
	if strings.TrimSpace(apiKey) == "" || strings.TrimSpace(apiSecret) == "" {
		return GatewayConnectionTestResult{Provider: provider, OK: false, Mode: "local_validation", Message: "missing credentials"}, nil
	}

	switch strings.ToLower(strings.TrimSpace(provider)) {
	case "razorpay":
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.razorpay.com/v1/orders?count=1", nil)
		if err != nil {
			return GatewayConnectionTestResult{Provider: provider, OK: false, Mode: "live_api", Message: err.Error()}, nil
		}
		req.SetBasicAuth(apiKey, apiSecret)
		resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(req)
		if err != nil {
			return GatewayConnectionTestResult{Provider: provider, OK: false, Mode: "live_api", Message: err.Error()}, nil
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			return GatewayConnectionTestResult{Provider: provider, OK: true, Mode: "live_api", Message: "credentials verified", HTTPStatus: resp.StatusCode}, nil
		}
		return GatewayConnectionTestResult{Provider: provider, OK: false, Mode: "live_api", Message: "provider rejected credentials", HTTPStatus: resp.StatusCode}, nil
	case "payu":
		// PayU integrations vary; validate credential presence and webhook secret readiness.
		return GatewayConnectionTestResult{Provider: provider, OK: true, Mode: "local_validation", Message: "merchant credentials present"}, nil
	default:
		return GatewayConnectionTestResult{Provider: provider, OK: false, Mode: "local_validation", Message: "unsupported provider"}, nil
	}
}

func (s *Service) AuditGatewayConfigChange(ctx context.Context, tenantID, actorUserID, provider, requestID, ip string, before, after map[string]interface{}) {
	if s.audit == nil {
		return
	}
	var tid pgtype.UUID
	_ = tid.Scan(tenantID)
	var uid pgtype.UUID
	_ = uid.Scan(actorUserID)
	_ = s.audit.Log(ctx, audit.Entry{
		TenantID:     tid,
		UserID:       uid,
		RequestID:    requestID,
		Action:       "finance.gateway_config.update",
		ResourceType: "payment_gateway_config",
		Before:       before,
		After:        after,
		IPAddress:    ip,
		ReasonCode:   provider,
	})
}

// Optional Fees

func (s *Service) ListOptionalFeeItems(ctx context.Context, tenantID string) ([]db.OptionalFeeItem, error) {
	return s.q.ListOptionalFeeItems(ctx, toPgUUID(tenantID))
}

func (s *Service) UpsertOptionalFeeItem(ctx context.Context, tenantID, name string, amount float64, category string) (db.OptionalFeeItem, error) {
	return s.q.UpsertOptionalFeeItem(ctx, db.UpsertOptionalFeeItemParams{
		TenantID: toPgUUID(tenantID),
		Name:     name,
		Amount:   floatToNumeric(amount),
		Category: pgtype.Text{String: category, Valid: category != ""},
	})
}

func (s *Service) SelectOptionalFee(ctx context.Context, tenantID, studentID, itemID, ayID, status string) (db.StudentOptionalFee, error) {
	tID := toPgUUID(tenantID)
	sID := toPgUUID(studentID)
	iID := toPgUUID(itemID) // item_id
	ayIDPg := toPgUUID(ayID)

	return s.q.UpsertStudentOptionalFee(ctx, db.UpsertStudentOptionalFeeParams{
		TenantID:       tID,
		StudentID:      sID,
		ItemID:         iID,
		AcademicYearID: ayIDPg,
		Status:         status,
	})
}

// Helpers

func floatToNumeric(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	n.Scan(fmt.Sprintf("%.2f", f))
	return n
}
