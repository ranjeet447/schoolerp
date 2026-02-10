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

package finance

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
)

type Service struct {
	q      db.Querier
	audit  *audit.Logger
	policy *policy.Evaluator
	locks  *locks.Service
}

func NewService(q db.Querier, audit *audit.Logger, poly *policy.Evaluator, lks *locks.Service) *Service {
	return &Service{q: q, audit: audit, policy: poly, locks: lks}
}

func (s *Service) CreateFeeHead(ctx context.Context, tenantID, name, headType string) (db.FeeHead, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	return s.q.CreateFeeHead(ctx, db.CreateFeeHeadParams{
		TenantID: tUUID,
		Name:     name,
		Type:     pgtype.Text{String: headType, Valid: headType != ""},
	})
}

func (s *Service) ListFeeHeads(ctx context.Context, tenantID string) ([]db.FeeHead, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)
	return s.q.ListFeeHeads(ctx, tUUID)
}

func (s *Service) CreateFeePlan(ctx context.Context, tenantID, name, ayID string, total int64) (db.FeePlan, error) {
	tUUID := pgtype.UUID{}
	tUUID.Scan(tenantID)

	ayUUID := pgtype.UUID{}
	ayUUID.Scan(ayID)

	return s.q.CreateFeePlan(ctx, db.CreateFeePlanParams{
		TenantID:       tUUID,
		Name:           name,
		AcademicYearID: ayUUID,
		TotalAmount:    pgtype.Int8{Int64: total, Valid: true},
	})
}

func (s *Service) CreateFeePlanItem(ctx context.Context, planID, headID string, amount int64) (db.FeePlanItem, error) {
	pUUID := pgtype.UUID{}
	pUUID.Scan(planID)

	hUUID := pgtype.UUID{}
	hUUID.Scan(headID)

	return s.q.CreateFeePlanItem(ctx, db.CreateFeePlanItemParams{
		PlanID: pUUID,
		HeadID: hUUID,
		Amount: amount,
	})
}

func (s *Service) AssignPlanToStudent(ctx context.Context, studentID, planID string) error {
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	pUUID := pgtype.UUID{}
	pUUID.Scan(planID)

	_, err := s.q.AssignPlanToStudent(ctx, db.AssignPlanToStudentParams{
		StudentID: sUUID,
		PlanID:    pUUID,
	})
	return err
}

func (s *Service) GetStudentFeeSummary(ctx context.Context, studentID string) ([]db.GetStudentFeeSummaryRow, error) {
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)
	return s.q.GetStudentFeeSummary(ctx, sUUID)
}
