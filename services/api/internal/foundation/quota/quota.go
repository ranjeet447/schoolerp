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

package quota

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
)

type Service struct {
	q db.Querier
}

func NewService(q db.Querier) *Service {
	return &Service{q: q}
}

type QuotaType string

const (
	QuotaStudents QuotaType = "students"
)

func (s *Service) CheckQuota(ctx context.Context, tenantID string, qType QuotaType) error {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	switch qType {
	case QuotaStudents:
		current, err := s.q.CountStudents(ctx, tUUID)
		if err != nil {
			return err
		}

		// Stub: Resolve limit from tenant config or plan
		// For Release 1, let's assume a hard limit of 500 for everyone for now
		limit := int64(500)
		
		if current >= limit {
			return fmt.Errorf("student quota exceeded (limit: %d)", limit)
		}
	}

	return nil
}
