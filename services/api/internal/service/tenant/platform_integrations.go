package tenant

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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

func (s *Service) ListPlatformWebhooks(ctx context.Context, tenantID *string) ([]PlatformWebhookRecord, error) {
	var query string
	var args []interface{}

	if tenantID != nil && *tenantID != "" {
		tid, _ := parseTenantUUID(*tenantID)
		query = `SELECT id, tenant_id, name, target_url, events, is_active, created_at, updated_at 
		         FROM platform_webhooks WHERE tenant_id = $1 ORDER BY created_at DESC`
		args = append(args, tid)
	} else {
		query = `SELECT id, tenant_id, name, target_url, events, is_active, created_at, updated_at 
		         FROM platform_webhooks WHERE tenant_id IS NULL ORDER BY created_at DESC`
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
