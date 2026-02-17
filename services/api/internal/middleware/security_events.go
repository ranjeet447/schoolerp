package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

type SecurityEvent struct {
	TenantID   string
	UserID     string
	Role       string
	EventType  string
	Severity   string // info, warning, critical
	Method     string
	Path       string
	StatusCode int
	IPAddress  string
	UserAgent  string
	Origin     string
	RequestID  string
	Metadata   map[string]any
}

type SecurityEventRecorder interface {
	Record(ctx context.Context, ev SecurityEvent) error
}

type noopSecurityEventRecorder struct{}

func (noopSecurityEventRecorder) Record(_ context.Context, _ SecurityEvent) error {
	return nil
}

var securityEventRecorder SecurityEventRecorder = noopSecurityEventRecorder{}

func SetSecurityEventRecorder(recorder SecurityEventRecorder) {
	if recorder == nil {
		securityEventRecorder = noopSecurityEventRecorder{}
		return
	}
	securityEventRecorder = recorder
}

func RecordSecurityEvent(ctx context.Context, ev SecurityEvent) {
	if strings.TrimSpace(ev.RequestID) == "" {
		ev.RequestID = GetReqID(ctx)
	}
	if err := securityEventRecorder.Record(ctx, ev); err != nil {
		log.Ctx(ctx).
			Warn().
			Err(err).
			Str("event_type", strings.TrimSpace(ev.EventType)).
			Msg("security event record failed")
	}
}

type DBSecurityEventRecorder struct {
	pool *pgxpool.Pool
}

func NewDBSecurityEventRecorder(pool *pgxpool.Pool) *DBSecurityEventRecorder {
	return &DBSecurityEventRecorder{pool: pool}
}

func (r *DBSecurityEventRecorder) Record(ctx context.Context, ev SecurityEvent) error {
	if r == nil || r.pool == nil {
		return nil
	}

	eventType := strings.TrimSpace(ev.EventType)
	if eventType == "" {
		return errors.New("empty event type")
	}

	severity := strings.ToLower(strings.TrimSpace(ev.Severity))
	switch severity {
	case "":
		severity = "info"
	case "info", "warning", "critical":
	default:
		severity = "info"
	}

	tenantID := strings.TrimSpace(ev.TenantID)
	if tenantID != "" {
		var tid pgtype.UUID
		if err := tid.Scan(tenantID); err != nil || !tid.Valid {
			tenantID = ""
		}
	}

	userID := strings.TrimSpace(ev.UserID)
	if userID != "" {
		var uid pgtype.UUID
		if err := uid.Scan(userID); err != nil || !uid.Valid {
			userID = ""
		}
	}

	metadataJSON := []byte("{}")
	if ev.Metadata != nil {
		if raw, err := json.Marshal(ev.Metadata); err == nil {
			metadataJSON = raw
		}
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO security_events (
			tenant_id,
			user_id,
			role_name,
			event_type,
			severity,
			method,
			path,
			status_code,
			ip_address,
			user_agent,
			origin,
			request_id,
			metadata
		) VALUES (
			NULLIF($1, '')::uuid,
			NULLIF($2, '')::uuid,
			NULLIF($3, ''),
			$4,
			$5,
			NULLIF($6, ''),
			NULLIF($7, ''),
			NULLIF($8, 0),
			NULLIF($9, ''),
			NULLIF($10, ''),
			NULLIF($11, ''),
			NULLIF($12, ''),
			$13
		)
	`,
		tenantID,
		userID,
		strings.TrimSpace(ev.Role),
		eventType,
		severity,
		strings.TrimSpace(ev.Method),
		strings.TrimSpace(ev.Path),
		ev.StatusCode,
		strings.TrimSpace(ev.IPAddress),
		strings.TrimSpace(ev.UserAgent),
		strings.TrimSpace(ev.Origin),
		strings.TrimSpace(ev.RequestID),
		metadataJSON,
	)
	return err
}
