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

package locks

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

func (s *Service) Lock(ctx context.Context, tenantID, module string, resourceID *string, userID string, reason string) (db.Lock, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	
	uUUID := pgtype.UUID{}
	uUUID.Scan(userID)

	var resUUID pgtype.UUID
	if resourceID != nil {
		resUUID.Scan(*resourceID)
	}

	arg := db.CreateLockParams{
		TenantID:   tUUID,
		Module:     module,
		ResourceID: resUUID,
		LockedBy:   uUUID,
		Reason:     pgtype.Text{String: reason, Valid: reason != ""},
	}

	return s.q.CreateLock(ctx, arg)
}

func (s *Service) IsLocked(ctx context.Context, tenantID, module string, resourceID *string) (bool, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	var resUUID pgtype.UUID
	if resourceID != nil {
		resUUID.Scan(*resourceID)
	}

	arg := db.CheckLockParams{
		TenantID:   tUUID,
		Module:     module,
		ResourceID: resUUID,
	}

	return s.q.CheckLock(ctx, arg)
}

func (s *Service) Unlock(ctx context.Context, tenantID, module string, resourceID *string) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	var resUUID pgtype.UUID
	if resourceID != nil {
		resUUID.Scan(*resourceID)
	}

	return s.q.DeleteLock(ctx, db.DeleteLockParams{
		TenantID:   tUUID,
		Module:     module,
		ResourceID: resUUID,
	})
}
