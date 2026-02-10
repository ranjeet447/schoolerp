// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package notices

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
)

type Service struct {
	q     db.Querier
	audit *audit.Logger
}

func NewService(q db.Querier, audit *audit.Logger) *Service {
	return &Service{q: q, audit: audit}
}

type CreateNoticeParams struct {
	TenantID  string
	Title     string
	Body      string
	Scope     map[string]any
	CreatedBy string
	RequestID string
	IP        string
}

func (s *Service) CreateNotice(ctx context.Context, p CreateNoticeParams) (db.Notice, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(p.TenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(p.CreatedBy)

	scopeJSON, err := json.Marshal(p.Scope)
	if err != nil {
		return db.Notice{}, err
	}

	notice, err := s.q.CreateNotice(ctx, db.CreateNoticeParams{
		TenantID:  tUUID,
		Title:     p.Title,
		Body:      p.Body,
		Scope:     scopeJSON,
		CreatedBy: uUUID,
	})
	if err != nil {
		return db.Notice{}, err
	}

	s.audit.Log(ctx, audit.Entry{
		TenantID:     tUUID,
		UserID:       uUUID,
		RequestID:    p.RequestID,
		Action:       "create_notice",
		ResourceType: "notice",
		ResourceID:   notice.ID,
		IPAddress:    p.IP,
	})

	// 5. Outbox Event for Notifications
	payload, _ := json.Marshal(map[string]interface{}{
		"notice_id": notice.ID,
		"title":     notice.Title,
		"scope":     p.Scope,
		"created_by": p.CreatedBy,
	})
	_, _ = s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
		TenantID:  tUUID,
		EventType: "notice.published",
		Payload:   payload,
	})

	return notice, nil
}

func (s *Service) ListNotices(ctx context.Context, tenantID string) ([]db.ListNoticesRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListNotices(ctx, tUUID)
}

func (s *Service) AcknowledgeNotice(ctx context.Context, noticeID, userID string) error {
	nUUID := pgtype.UUID{}
	nUUID.Scan(noticeID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	_, err := s.q.AcknowledgeNotice(ctx, db.AcknowledgeNoticeParams{
		NoticeID: nUUID,
		UserID:   uUUID,
	})
	return err
}

func (s *Service) ListNoticesForParent(ctx context.Context, tenantID, userID string) ([]db.ListNoticesForParentRow, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	return s.q.ListNoticesForParent(ctx, db.ListNoticesForParentParams{
		TenantID: tUUID,
		UserID:   uUUID,
	})
}
