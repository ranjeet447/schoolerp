package finance

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/locks"
	"github.com/schoolerp/api/internal/foundation/policy"
	"github.com/schoolerp/api/internal/foundation/security"
)

type Service struct {
	q       db.Querier
	db      *pgxpool.Pool
	audit   *audit.Logger
	policy  *policy.Evaluator
	locks   *locks.Service
	payment PaymentProvider
	crypto  *security.Crypto
}

func NewService(q db.Querier, db *pgxpool.Pool, audit *audit.Logger, poly *policy.Evaluator, lks *locks.Service, pay PaymentProvider, crypto *security.Crypto) *Service {
	return &Service{q: q, db: db, audit: audit, policy: poly, locks: lks, payment: pay, crypto: crypto}
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

func (s *Service) GetStudentFeeSummary(ctx context.Context, tenantID, studentID string) ([]db.GetStudentFeeSummaryRow, error) {
	sUUID := pgtype.UUID{}
	sUUID.Scan(studentID)

	summary, err := s.q.GetStudentFeeSummary(ctx, sUUID)
	if err != nil {
		return nil, err
	}

	// Late fees are folded into `Amount` so existing clients continue to compute
	// balance as `amount - paid_amount` without schema changes.
	if s.db != nil {
		if rules, err := s.ListLateFeeRules(ctx, tenantID); err == nil && len(rules) > 0 {
			summary = applyLateFeeRulesToSummary(summary, rules, time.Now())
		}
	}
	return summary, nil
}

func applyLateFeeRulesToSummary(summary []db.GetStudentFeeSummaryRow, rules []LateFeeRule, now time.Time) []db.GetStudentFeeSummaryRow {
	if len(summary) == 0 || len(rules) == 0 {
		return summary
	}

	active := make([]LateFeeRule, 0, len(rules))
	for _, r := range rules {
		if r.IsActive {
			active = append(active, r)
		}
	}
	if len(active) == 0 {
		return summary
	}

	for i := range summary {
		row := &summary[i]
		if !row.DueDate.Valid {
			continue
		}
		if row.Amount <= row.PaidAmount {
			continue
		}
		headID, _ := pgUUIDToString(row.HeadID)
		rule := chooseLateFeeRule(active, headID)
		if rule == nil {
			continue
		}

		due := time.Date(row.DueDate.Time.Year(), row.DueDate.Time.Month(), row.DueDate.Time.Day(), 0, 0, 0, 0, now.Location())
		daysPastDue := int(now.Sub(due).Hours() / 24)
		effectiveDays := daysPastDue - maxInt(0, rule.GraceDays)
		if effectiveDays <= 0 {
			continue
		}

		var lateFee int64
		switch rule.RuleType {
		case "daily":
			lateFee = int64(math.Round(rule.Amount * float64(effectiveDays)))
		case "fixed":
			lateFee = int64(math.Round(rule.Amount))
		default:
			continue
		}
		if lateFee <= 0 {
			continue
		}
		row.Amount += lateFee
	}

	return summary
}

func chooseLateFeeRule(rules []LateFeeRule, headID string) *LateFeeRule {
	var global *LateFeeRule
	for i := range rules {
		r := &rules[i]
		if r.FeeHeadID != nil && *r.FeeHeadID == headID {
			return r
		}
		if r.FeeHeadID == nil && global == nil {
			global = r
		}
	}
	return global
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
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
			hStr, convErr := pgUUIDToString(headID)
			if convErr == nil {
				r.FeeHeadID = &hStr
			}
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

func (s *Service) GetDailyFinancialSummary(ctx context.Context, tenantID string, targetDate string) ([]db.GetDailyFinancialSummaryRow, error) {
	tUUID := toPgUUID(tenantID)

	var date pgtype.Date
	if targetDate == "" {
		date = pgtype.Date{Time: time.Now(), Valid: true}
	} else if err := date.Scan(targetDate); err != nil {
		return nil, fmt.Errorf("invalid date format: %w", err)
	}

	return s.q.GetDailyFinancialSummary(ctx, db.GetDailyFinancialSummaryParams{
		TenantID:   tUUID,
		TargetDate: date,
	})
}

func (s *Service) GetFeeDayBookData(ctx context.Context, tenantID string, from, to time.Time) ([]db.GetFeeDayBookRow, error) {
	tUUID := toPgUUID(tenantID)

	var fromTs, toTs pgtype.Timestamptz
	fromTs.Scan(from)
	toTs.Scan(to)

	return s.q.GetFeeDayBook(ctx, db.GetFeeDayBookParams{
		TenantID:    tUUID,
		CreatedAt:   fromTs,
		CreatedAt_2: toTs,
	})
}

func (s *Service) GetDefaultersData(ctx context.Context, tenantID string) ([]db.GetDefaultersRow, error) {
	tUUID := toPgUUID(tenantID)
	return s.q.GetDefaulters(ctx, tUUID)
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

func fmtUUID(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
