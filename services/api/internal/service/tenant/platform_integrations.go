package tenant

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrInvalidWebhookID = errors.New("invalid webhook id")
	ErrWebhookNotFound  = errors.New("webhook not found")
	ErrInvalidWebhook   = errors.New("invalid webhook payload")
)

type PlatformWebhookRecord struct {
	ID        uuid.UUID          `json:"id"`
	TenantID  *uuid.UUID         `json:"tenant_id"`
	Name      string             `json:"name"`
	TargetURL string             `json:"target_url"`
	Events    []string           `json:"events"`
	IsActive  bool               `json:"is_active"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
	UpdatedAt pgtype.Timestamptz `json:"updated_at"`
}

type IntegrationLogRecord struct {
	ID              uuid.UUID          `json:"id"`
	WebhookID       *uuid.UUID         `json:"webhook_id"`
	TenantID        *uuid.UUID         `json:"tenant_id"`
	EventType       string             `json:"event_type"`
	Status          string             `json:"status"`
	HTTPStatus      int                `json:"http_status"`
	RequestPayload  json.RawMessage    `json:"request_payload"`
	ResponsePayload json.RawMessage    `json:"response_payload"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
}

type CreatePlatformWebhookParams struct {
	TenantID  *string
	Name      string
	TargetURL string
	Secret    string
	Events    []string
	IsActive  bool
	CreatedBy string
}

type UpdatePlatformWebhookParams struct {
	Name      *string
	TargetURL *string
	Secret    *string
	Events    []string
	IsActive  *bool
}

type TenantAddonRecord struct {
	Metadata map[string]interface{} `json:"metadata"`
	Enabled  bool                   `json:"enabled"`
	Settings map[string]interface{} `json:"settings"`
}

func (s *Service) ListPlatformWebhooks(ctx context.Context, tenantID *string) ([]PlatformWebhookRecord, error) {
	var query string
	var args []interface{}

	if tenantID != nil && *tenantID != "" {
		tid, err := parseTenantUUID(*tenantID)
		if err != nil {
			return nil, err
		}
		query = `SELECT id, tenant_id, name, target_url, events, is_active, created_at, updated_at 
		         FROM platform_webhooks WHERE tenant_id = $1 ORDER BY created_at DESC`
		args = append(args, tid)
	} else {
		query = `SELECT id, tenant_id, name, target_url, events, is_active, created_at, updated_at 
		         FROM platform_webhooks ORDER BY created_at DESC`
	}

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var webhooks []PlatformWebhookRecord
	for rows.Next() {
		var w PlatformWebhookRecord
		if err := rows.Scan(&w.ID, &w.TenantID, &w.Name, &w.TargetURL, &w.Events, &w.IsActive, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, err
		}
		webhooks = append(webhooks, w)
	}
	return webhooks, nil
}

func (s *Service) CreatePlatformWebhook(ctx context.Context, params CreatePlatformWebhookParams) (PlatformWebhookRecord, error) {
	name := strings.TrimSpace(params.Name)
	targetURL := strings.TrimSpace(params.TargetURL)
	secret := strings.TrimSpace(params.Secret)
	events := sanitizeWebhookEvents(params.Events)

	if name == "" || targetURL == "" || secret == "" {
		return PlatformWebhookRecord{}, fmt.Errorf("%w: name, target_url and secret are required", ErrInvalidWebhook)
	}
	if len(events) == 0 {
		return PlatformWebhookRecord{}, fmt.Errorf("%w: at least one event is required", ErrInvalidWebhook)
	}

	secretHash := hashSecret(secret)

	var tenantUUID *pgtype.UUID
	if params.TenantID != nil && strings.TrimSpace(*params.TenantID) != "" {
		tid, err := parseTenantUUID(strings.TrimSpace(*params.TenantID))
		if err != nil {
			return PlatformWebhookRecord{}, err
		}
		tenantUUID = &tid
	}

	var createdByUUID pgtype.UUID
	if strings.TrimSpace(params.CreatedBy) != "" {
		if err := createdByUUID.Scan(strings.TrimSpace(params.CreatedBy)); err != nil || !createdByUUID.Valid {
			createdByUUID = pgtype.UUID{}
		}
	}

	const query = `
		INSERT INTO platform_webhooks (
			tenant_id, name, target_url, secret_hash, events, is_active, created_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, tenant_id, name, target_url, events, is_active, created_at, updated_at
	`

	var row PlatformWebhookRecord
	err := s.db.QueryRow(
		ctx,
		query,
		tenantUUID,
		name,
		targetURL,
		secretHash,
		events,
		params.IsActive,
		createdByUUID,
	).Scan(
		&row.ID,
		&row.TenantID,
		&row.Name,
		&row.TargetURL,
		&row.Events,
		&row.IsActive,
		&row.CreatedAt,
		&row.UpdatedAt,
	)
	return row, err
}

func (s *Service) UpdatePlatformWebhook(ctx context.Context, webhookID string, params UpdatePlatformWebhookParams) (PlatformWebhookRecord, error) {
	wid, err := uuid.Parse(strings.TrimSpace(webhookID))
	if err != nil {
		return PlatformWebhookRecord{}, ErrInvalidWebhookID
	}

	setClauses := make([]string, 0, 6)
	args := make([]interface{}, 0, 8)
	argPos := 1

	if params.Name != nil {
		name := strings.TrimSpace(*params.Name)
		if name == "" {
			return PlatformWebhookRecord{}, fmt.Errorf("%w: name cannot be empty", ErrInvalidWebhook)
		}
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argPos))
		args = append(args, name)
		argPos++
	}

	if params.TargetURL != nil {
		targetURL := strings.TrimSpace(*params.TargetURL)
		if targetURL == "" {
			return PlatformWebhookRecord{}, fmt.Errorf("%w: target_url cannot be empty", ErrInvalidWebhook)
		}
		setClauses = append(setClauses, fmt.Sprintf("target_url = $%d", argPos))
		args = append(args, targetURL)
		argPos++
	}

	if params.Secret != nil {
		secret := strings.TrimSpace(*params.Secret)
		if secret == "" {
			return PlatformWebhookRecord{}, fmt.Errorf("%w: secret cannot be empty", ErrInvalidWebhook)
		}
		setClauses = append(setClauses, fmt.Sprintf("secret_hash = $%d", argPos))
		args = append(args, hashSecret(secret))
		argPos++
	}

	if params.Events != nil {
		events := sanitizeWebhookEvents(params.Events)
		if len(events) == 0 {
			return PlatformWebhookRecord{}, fmt.Errorf("%w: events cannot be empty", ErrInvalidWebhook)
		}
		setClauses = append(setClauses, fmt.Sprintf("events = $%d", argPos))
		args = append(args, events)
		argPos++
	}

	if params.IsActive != nil {
		setClauses = append(setClauses, fmt.Sprintf("is_active = $%d", argPos))
		args = append(args, *params.IsActive)
		argPos++
	}

	if len(setClauses) == 0 {
		return s.GetPlatformWebhookByID(ctx, wid)
	}

	setClauses = append(setClauses, "updated_at = NOW()")
	args = append(args, wid)

	query := fmt.Sprintf(`
		UPDATE platform_webhooks
		SET %s
		WHERE id = $%d
		RETURNING id, tenant_id, name, target_url, events, is_active, created_at, updated_at
	`, strings.Join(setClauses, ", "), argPos)

	var row PlatformWebhookRecord
	if err := s.db.QueryRow(ctx, query, args...).Scan(
		&row.ID,
		&row.TenantID,
		&row.Name,
		&row.TargetURL,
		&row.Events,
		&row.IsActive,
		&row.CreatedAt,
		&row.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformWebhookRecord{}, ErrWebhookNotFound
		}
		return PlatformWebhookRecord{}, err
	}

	return row, nil
}

func (s *Service) GetPlatformWebhookByID(ctx context.Context, webhookID uuid.UUID) (PlatformWebhookRecord, error) {
	const query = `
		SELECT id, tenant_id, name, target_url, events, is_active, created_at, updated_at
		FROM platform_webhooks
		WHERE id = $1
	`
	var row PlatformWebhookRecord
	if err := s.db.QueryRow(ctx, query, webhookID).Scan(
		&row.ID,
		&row.TenantID,
		&row.Name,
		&row.TargetURL,
		&row.Events,
		&row.IsActive,
		&row.CreatedAt,
		&row.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PlatformWebhookRecord{}, ErrWebhookNotFound
		}
		return PlatformWebhookRecord{}, err
	}
	return row, nil
}

func (s *Service) ListTenantAddons(ctx context.Context, tenantID string) ([]TenantAddonRecord, error) {
	plugins, err := s.ListPlugins(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	out := make([]TenantAddonRecord, 0, len(plugins))
	for _, item := range plugins {
		record := TenantAddonRecord{
			Metadata: map[string]interface{}{},
			Enabled:  false,
			Settings: map[string]interface{}{},
		}

		if metadata, ok := item["metadata"].(map[string]interface{}); ok {
			record.Metadata = metadata
		}
		if enabled, ok := item["enabled"].(bool); ok {
			record.Enabled = enabled
		}
		if settings, ok := item["settings"].(map[string]interface{}); ok && settings != nil {
			record.Settings = settings
		}
		out = append(out, record)
	}
	return out, nil
}

func (s *Service) UpdateTenantAddon(ctx context.Context, tenantID, addonID string, enabled bool, settings map[string]interface{}) error {
	if strings.TrimSpace(addonID) == "" {
		return fmt.Errorf("%w: addon id is required", ErrInvalidWebhook)
	}
	return s.UpdatePluginConfig(ctx, tenantID, strings.TrimSpace(addonID), enabled, settings)
}

func hashSecret(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

func sanitizeWebhookEvents(events []string) []string {
	seen := make(map[string]struct{}, len(events))
	clean := make([]string, 0, len(events))
	for _, e := range events {
		event := strings.ToLower(strings.TrimSpace(e))
		if event == "" {
			continue
		}
		if _, exists := seen[event]; exists {
			continue
		}
		seen[event] = struct{}{}
		clean = append(clean, event)
	}
	return clean
}

func (s *Service) ListIntegrationLogs(ctx context.Context, limit int, offset int) ([]IntegrationLogRecord, error) {
	const query = `
		SELECT id, webhook_id, tenant_id, event_type, status, http_status, request_payload, response_payload, created_at
		FROM integration_logs
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := s.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []IntegrationLogRecord
	for rows.Next() {
		var l IntegrationLogRecord
		if err := rows.Scan(&l.ID, &l.WebhookID, &l.TenantID, &l.EventType, &l.Status, &l.HTTPStatus, &l.RequestPayload, &l.ResponsePayload, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func (s *Service) GetIntegrationHealth(ctx context.Context) (map[string]interface{}, error) {
	const query = `
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE status = 'delivered') as success,
			COUNT(*) FILTER (WHERE status = 'failed') as failure,
			AVG(http_status) FILTER (WHERE http_status > 0) as avg_status
		FROM integration_logs
		WHERE created_at > NOW() - INTERVAL '24 hours'
	`
	var total, success, failure int64
	var avgStatus *float64
	err := s.db.QueryRow(ctx, query).Scan(&total, &success, &failure, &avgStatus)
	if err != nil {
		return nil, err
	}

	healthy := true
	if total > 10 && float64(failure)/float64(total) > 0.1 {
		healthy = false
	}

	return map[string]interface{}{
		"total_last_24h":   total,
		"success_last_24h": success,
		"failure_last_24h": failure,
		"is_healthy":       healthy,
	}, nil
}
