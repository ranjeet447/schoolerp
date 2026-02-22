package notification

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Service struct {
	q db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{q: q}
}

func (s *Service) ListLogs(ctx context.Context, tenantID string, limit, offset int32) ([]db.Outbox, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.ListOutboxEvents(ctx, db.ListOutboxEventsParams{
		TenantID: tUUID,
		Limit:    limit,
		Offset:   offset,
	})
}

type ListLogsParams struct {
	TenantID  string
	Status    string
	EventType string
	From      time.Time
	To        time.Time
	Limit     int32
	Offset    int32
}

func (s *Service) ListFilteredLogs(ctx context.Context, p ListLogsParams) ([]db.Outbox, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)

	from := pgtype.Timestamptz{Time: p.From, Valid: !p.From.IsZero()}
	to := pgtype.Timestamptz{Time: p.To, Valid: !p.To.IsZero()}

	return s.q.ListOutboxEventsWithFilters(ctx, db.ListOutboxEventsWithFiltersParams{
		TenantID:  tID,
		Status:    p.Status,
		EventType: p.EventType,
		FromDate:  from,
		ToDate:    to,
		LimitVal:  p.Limit,
		OffsetVal: p.Offset,
	})
}

// Template Management

type CreateTemplateParams struct {
	TenantID string
	Code     string
	Channel  string // email, sms, whatsapp, push
	Locale   string
	Subject  string
	Body     string
}

func (s *Service) CreateTemplate(ctx context.Context, p CreateTemplateParams) (db.NotificationTemplate, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)

	return s.q.CreateNotificationTemplate(ctx, db.CreateNotificationTemplateParams{
		TenantID: tID,
		Code:     p.Code,
		Channel:  p.Channel,
		Locale:   p.Locale,
		Subject:  pgtype.Text{String: p.Subject, Valid: p.Subject != ""},
		Body:     p.Body,
	})
}

func (s *Service) GetTemplate(ctx context.Context, tenantID, id string) (db.NotificationTemplate, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	uID := pgtype.UUID{}
	uID.Scan(id)

	return s.q.GetNotificationTemplate(ctx, db.GetNotificationTemplateParams{
		ID:       uID,
		TenantID: tID,
	})
}

func (s *Service) ListTemplates(ctx context.Context, tenantID string) ([]db.NotificationTemplate, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.ListNotificationTemplates(ctx, tID)
}

func (s *Service) UpdateTemplate(ctx context.Context, tenantID, id string, subject, body string) (db.NotificationTemplate, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	uID := pgtype.UUID{}
	uID.Scan(id)

	return s.q.UpdateNotificationTemplate(ctx, db.UpdateNotificationTemplateParams{
		ID:       uID,
		TenantID: tID,
		Subject:  pgtype.Text{String: subject, Valid: subject != ""},
		Body:     body,
	})
}

func (s *Service) DeleteTemplate(ctx context.Context, tenantID, id string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	uID := pgtype.UUID{}
	uID.Scan(id)

	return s.q.DeleteNotificationTemplate(ctx, db.DeleteNotificationTemplateParams{
		ID:       uID,
		TenantID: tID,
	})
}
func (s *Service) ResolveTemplate(ctx context.Context, tenantID, code, channel, locale string) (db.NotificationTemplate, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.ResolveNotificationTemplate(ctx, db.ResolveNotificationTemplateParams{
		TenantID: tID,
		Code:     code,
		Channel:  channel,
		Locale:   locale,
	})
}

// Gateway Configuration Management

func (s *Service) CreateOrUpdateGatewayConfig(ctx context.Context, tenantID, provider, apiKey, apiSecret, senderID string, isActive bool, settings []byte) (db.NotificationGatewayConfig, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.CreateNotificationGatewayConfig(ctx, db.CreateNotificationGatewayConfigParams{
		TenantID: tID,
		Provider: provider,
		ApiKey:   pgtype.Text{String: apiKey, Valid: apiKey != ""},
		ApiSecret: pgtype.Text{String: apiSecret, Valid: apiSecret != ""},
		SenderID: pgtype.Text{String: senderID, Valid: senderID != ""},
		IsActive: pgtype.Bool{Bool: isActive, Valid: true},
		Settings: settings,
	})
}

func (s *Service) ListGatewayConfigs(ctx context.Context, tenantID string) ([]db.NotificationGatewayConfig, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.ListNotificationGatewayConfigs(ctx, tID)
}

func (s *Service) GetActiveGatewayConfig(ctx context.Context, tenantID string) (db.NotificationGatewayConfig, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.GetTenantActiveNotificationGateway(ctx, tID)
}

func (s *Service) GetUsageStats(ctx context.Context, tenantID string, since time.Time) (db.GetSmsUsageStatsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.GetSmsUsageStats(ctx, db.GetSmsUsageStatsParams{
		TenantID:  tID,
		CreatedAt: pgtype.Timestamptz{Time: since, Valid: !since.IsZero()},
	})
}

func (s *Service) GetOutboxStats(ctx context.Context, tenantID string, since time.Time) (db.GetOutboxStatusStatsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.GetOutboxStatusStats(ctx, db.GetOutboxStatusStatsParams{
		TenantID:  tID,
		CreatedAt: pgtype.Timestamptz{Time: since, Valid: !since.IsZero()},
	})
}
