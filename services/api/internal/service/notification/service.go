package notification

import (
	"context"

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
		TenantID:    tUUID,
		LimitCount:  limit,
		OffsetCount: offset,
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
