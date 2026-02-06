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

package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Logger struct {
	q db.Querier
}

func NewLogger(q db.Querier) *Logger {
	return &Logger{q: q}
}

type Entry struct {
	TenantID     pgtype.UUID
	UserID       pgtype.UUID
	RequestID    string
	Action       string
	ResourceType string
	ResourceID   pgtype.UUID
	Before       any
	After        any
	ReasonCode   string
	IPAddress    string
}

func (l *Logger) Log(ctx context.Context, entry Entry) error {
	var beforeJSON, afterJSON []byte
	var err error

	if entry.Before != nil {
		beforeJSON, err = json.Marshal(entry.Before)
		if err != nil {
			slog.WarnContext(ctx, "failed to marshal audit before state", "err", err)
		}
	}
	if entry.After != nil {
		afterJSON, err = json.Marshal(entry.After)
		if err != nil {
			slog.WarnContext(ctx, "failed to marshal audit after state", "err", err)
		}
	}

	arg := db.CreateAuditLogParams{
		TenantID:     entry.TenantID,
		UserID:       entry.UserID,
		RequestID:    pgtype.Text{String: entry.RequestID, Valid: entry.RequestID != ""},
		Action:       entry.Action,
		ResourceType: entry.ResourceType,
		ResourceID:   entry.ResourceID,
		BeforeState:  beforeJSON,
		AfterState:   afterJSON,
		ReasonCode:   pgtype.Text{String: entry.ReasonCode, Valid: entry.ReasonCode != ""},
		IpAddress:    pgtype.Text{String: entry.IPAddress, Valid: entry.IPAddress != ""},
	}

	_, err = l.q.CreateAuditLog(ctx, arg)
	if err != nil {
		slog.ErrorContext(ctx, "failed to write audit log", "err", err)
		return fmt.Errorf("audit write failed: %w", err)
	}

	return nil
}
