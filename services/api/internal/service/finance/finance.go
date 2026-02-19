package finance

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
)

type Service struct {
	q       db.Querier
	db      *pgxpool.Pool
	audit   *audit.Logger
	policy  *policy.Evaluator
	locks   *locks.Service
	payment PaymentProvider
}

func NewService(q db.Querier, db *pgxpool.Pool, audit *audit.Logger, poly *policy.Evaluator, lks *locks.Service, pay PaymentProvider) *Service {
	return &Service{q: q, db: db, audit: audit, policy: poly, locks: lks, payment: pay}
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
	
	summary, err := s.q.GetStudentFeeSummary(ctx, sUUID)
	if err != nil {
		return nil, err
	}

	// TODO: Calculate and add late fees to summary if overdue
	return summary, nil
}

// Late Fee Rules
type LateFeeRule struct {
	ID        string  `json:"id"`
	FeeHeadID *string `json:"fee_head_id"`
	RuleType  string  `json:"rule_type"`
	Amount    float64 `json:"amount"`
	GraceDays int     `json:"grace_days"`
	IsActive  bool    `json:"is_active"`
}

func (s *Service) CreateLateFeeRule(ctx context.Context, tenantID string, rule LateFeeRule) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO fee_late_rules (tenant_id, fee_head_id, rule_type, amount, grace_days, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (tenant_id, fee_head_id) DO UPDATE
		SET rule_type = EXCLUDED.rule_type, amount = EXCLUDED.amount, grace_days = EXCLUDED.grace_days, is_active = EXCLUDED.is_active
	`, toPgUUID(tenantID), nullUUID(defaultString(rule.FeeHeadID)), rule.RuleType, rule.Amount, rule.GraceDays, rule.IsActive)
	return err
}

func (s *Service) ListLateFeeRules(ctx context.Context, tenantID string) ([]LateFeeRule, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, fee_head_id, rule_type, amount, grace_days, is_active
		FROM fee_late_rules
		WHERE tenant_id = $1
	`, toPgUUID(tenantID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []LateFeeRule
	for rows.Next() {
		var r LateFeeRule
		var headID pgtype.UUID
		if err := rows.Scan(&r.ID, &headID, &r.RuleType, &r.Amount, &r.GraceDays, &r.IsActive); err != nil {
			return nil, err
		}
		if headID.Valid {
			hid := headID.Bytes
			hStr := fmt.Sprintf("%x-%x-%x-%x-%x", hid[0:4], hid[4:6], hid[6:8], hid[8:10], hid[10:16])
			r.FeeHeadID = &hStr
		}
		rules = append(rules, r)
	}
	return rules, nil
}

// Concession Rules
type ConcessionRule struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	DiscountType string  `json:"discount_type"`
	Value        float64 `json:"value"`
	Category     string  `json:"category"`
	Priority     int     `json:"priority"`
	IsActive     bool    `json:"is_active"`
}

func (s *Service) CreateConcessionRule(ctx context.Context, tenantID string, rule ConcessionRule) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO fee_concession_rules (tenant_id, name, discount_type, value, category, priority, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, toPgUUID(tenantID), rule.Name, rule.DiscountType, rule.Value, rule.Category, rule.Priority, rule.IsActive)
	return err
}

func (s *Service) ListConcessionRules(ctx context.Context, tenantID string) ([]ConcessionRule, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, name, discount_type, value, category, priority, is_active
		FROM fee_concession_rules
		WHERE tenant_id = $1
	`, toPgUUID(tenantID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []ConcessionRule
	for rows.Next() {
		var r ConcessionRule
		if err := rows.Scan(&r.ID, &r.Name, &r.DiscountType, &r.Value, &r.Category, &r.Priority, &r.IsActive); err != nil {
			return nil, err
		}
		rules = append(rules, r)
	}
	return rules, nil
}

func (s *Service) ApplyStudentConcession(ctx context.Context, studentID, ruleID, userID string, remarks string) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO student_concessions (student_id, rule_id, approved_by, remarks)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (student_id, rule_id) DO UPDATE SET remarks = EXCLUDED.remarks
	`, toPgUUID(studentID), toPgUUID(ruleID), toPgUUID(userID), remarks)
	return err
}

// Helpers
func toPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}

func nullUUID(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

func defaultString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
