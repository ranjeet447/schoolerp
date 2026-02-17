package hrms

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/approvals"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/quota"
)

type Service struct {
	q         db.Querier
	audit     *audit.Logger
	approvals *approvals.Service
	quota     *quota.Service
}

func NewService(q db.Querier, audit *audit.Logger, approvals *approvals.Service, quotaSvc *quota.Service) *Service {
	return &Service{q: q, audit: audit, approvals: approvals, quota: quotaSvc}
}

// ==================== Employees ====================

type CreateEmployeeParams struct {
	TenantID          string
	EmployeeCode      string
	FullName          string
	Email             string
	Phone             string
	Department        string
	Designation       string
	JoinDate          string
	SalaryStructureID string
	BankDetails       []byte // JSON
}

func (s *Service) CreateEmployee(ctx context.Context, p CreateEmployeeParams) (db.Employee, error) {
	if s.quota != nil {
		if err := s.quota.CheckQuota(ctx, p.TenantID, quota.QuotaStaff); err != nil {
			return db.Employee{}, err
		}
	}

	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	ssID := pgtype.UUID{}
	if p.SalaryStructureID != "" {
		ssID.Scan(p.SalaryStructureID)
	}

	// 1. Encrypt Bank Details
	var encryptedBank string
	if len(p.BankDetails) > 0 {
		var err error
		encryptedBank, err = encrypt(p.BankDetails)
		if err != nil {
			return db.Employee{}, fmt.Errorf("encryption failed: %w", err)
		}
	}

	return s.q.CreateEmployee(ctx, db.CreateEmployeeParams{
		TenantID:          tID,
		EmployeeCode:      p.EmployeeCode,
		FullName:          p.FullName,
		Email:             pgtype.Text{String: p.Email, Valid: p.Email != ""},
		Phone:             pgtype.Text{String: p.Phone, Valid: p.Phone != ""},
		Department:        pgtype.Text{String: p.Department, Valid: p.Department != ""},
		Designation:       pgtype.Text{String: p.Designation, Valid: p.Designation != ""},
		SalaryStructureID: ssID,
		BankDetails:       []byte(encryptedBank),
		Status:            "active",
	})
}

func (s *Service) ListEmployees(ctx context.Context, tenantID string, limit, offset int32) ([]db.Employee, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListEmployees(ctx, db.ListEmployeesParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

// ==================== Salary Structures ====================

type CreateSalaryStructureParams struct {
	TenantID        string
	Name            string
	Basic           float64
	HRA             float64
	DA              float64
	OtherAllowances []byte // JSON
	Deductions      []byte // JSON
}

func (s *Service) CreateSalaryStructure(ctx context.Context, p CreateSalaryStructureParams) (db.SalaryStructure, error) {
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)

	basic := pgtype.Numeric{}
	basic.Scan(fmt.Sprintf("%.2f", p.Basic))
	hra := pgtype.Numeric{}
	hra.Scan(fmt.Sprintf("%.2f", p.HRA))
	da := pgtype.Numeric{}
	da.Scan(fmt.Sprintf("%.2f", p.DA))

	return s.q.CreateSalaryStructure(ctx, db.CreateSalaryStructureParams{
		TenantID:        tID,
		Name:            p.Name,
		Basic:           basic,
		Hra:             hra,
		Da:              da,
		OtherAllowances: p.OtherAllowances,
		Deductions:      p.Deductions,
	})
}

func (s *Service) ListSalaryStructures(ctx context.Context, tenantID string) ([]db.SalaryStructure, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListSalaryStructures(ctx, tID)
}

// ==================== Payroll ====================

func (s *Service) CreatePayrollRun(ctx context.Context, tenantID string, month, year int32, userID string) (db.PayrollRun, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	return s.q.CreatePayrollRun(ctx, db.CreatePayrollRunParams{
		TenantID: tID,
		Month:    int32(month),
		Year:     int32(year),
		Status:   "pending",
		RunBy:    uID,
	})
}

func (s *Service) ListPayrollRuns(ctx context.Context, tenantID string, limit, offset int32) ([]db.PayrollRun, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListPayrollRuns(ctx, db.ListPayrollRunsParams{
		TenantID: tID,
		Limit:    limit,
		Offset:   offset,
	})
}

// RunPayroll generates payslips for all active employees
func (s *Service) RunPayroll(ctx context.Context, tenantID, payrollRunID string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	prID := pgtype.UUID{}
	prID.Scan(payrollRunID)

	// 1. Verify payroll run
	_, err := s.q.GetPayrollRun(ctx, db.GetPayrollRunParams{ID: prID, TenantID: tID})
	if err != nil {
		return err
	}

	// 2. Get all employees
	employees, err := s.q.ListEmployees(ctx, db.ListEmployeesParams{
		TenantID: tID,
		Limit:    1000,
		Offset:   0,
	})
	if err != nil {
		return err
	}

	// 3. Generate payslips
	for _, emp := range employees {
		if emp.Status != "active" {
			continue
		}

		// Calculate payslip
		payslip, err := s.calculatePayslip(ctx, tID, prID, emp.ID)
		if err != nil {
			continue // Log error and continue with next employee
		}

		// Save payslip
		ps, err := s.q.CreatePayslip(ctx, db.CreatePayslipParams{
			PayrollRunID:    prID,
			EmployeeID:      emp.ID,
			GrossSalary:     payslip.Gross,
			TotalDeductions: payslip.TotalDeductions,
			NetSalary:       payslip.Net,
			Breakdown:       payslip.Breakdown,
			Status:          "generated",
		})
		if err == nil {
			// Link approved adjustments to this run
			adjs, _ := s.q.GetApprovedAdjustmentsForRun(ctx, db.GetApprovedAdjustmentsForRunParams{
				TenantID:   tID,
				EmployeeID: emp.ID,
			})
			for _, a := range adjs {
				s.q.LinkAdjustmentToRun(ctx, db.LinkAdjustmentToRunParams{
					ID:           a.ID,
					TenantID:     tID,
					PayrollRunID: prID,
				})
			}

			// Produce Outbox Event for background PDF generation
			payload, _ := json.Marshal(map[string]interface{}{
				"payslip_id":  ps.ID,
				"employee_id": emp.ID,
				"run_id":      prID,
			})
			s.q.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
				TenantID:  tID,
				EventType: "payslip.generated",
				Payload:   payload,
			})
		}
	}

	// 4. Mark payroll as completed
	s.q.UpdatePayrollRunStatus(ctx, db.UpdatePayrollRunStatusParams{
		ID:       prID,
		TenantID: tID,
		Status:   "completed",
	})

	return nil
}

type payslipResult struct {
	Gross           pgtype.Numeric
	TotalDeductions pgtype.Numeric
	Net             pgtype.Numeric
	Breakdown       []byte
}

func (s *Service) calculatePayslip(ctx context.Context, tID, prID, empID pgtype.UUID) (*payslipResult, error) {
	// Fetch salary structure and employee info
	info, err := s.q.GetEmployeeSalaryInfo(ctx, db.GetEmployeeSalaryInfoParams{
		ID:       empID,
		TenantID: tID,
	})
	if err != nil {
		return nil, err
	}

	var gross, deductions float64
	breakdown := make(map[string]float64)

	// Base Salary components
	b, _ := info.Basic.Float64Value()
	gross += b.Float64
	breakdown["Basic"] = b.Float64

	h, _ := info.Hra.Float64Value()
	gross += h.Float64
	breakdown["HRA"] = h.Float64

	d, _ := info.Da.Float64Value()
	gross += d.Float64
	breakdown["DA"] = d.Float64

	// Process approved adjustments
	adjs, _ := s.q.GetApprovedAdjustmentsForRun(ctx, db.GetApprovedAdjustmentsForRunParams{
		TenantID:   tID,
		EmployeeID: empID,
	})

	for _, a := range adjs {
		amt, _ := a.Amount.Float64Value()
		val := amt.Float64
		if a.Type == "deduction" {
			deductions += val
			breakdown["Adj: "+a.Type+" ("+a.Description.String+")"] = -val
		} else {
			gross += val
			breakdown["Adj: "+a.Type+" ("+a.Description.String+")"] = val
		}
	}

	net := gross - deductions

	gNum := pgtype.Numeric{}
	gNum.Scan(fmt.Sprintf("%.2f", gross))
	dNum := pgtype.Numeric{}
	dNum.Scan(fmt.Sprintf("%.2f", deductions))
	nNum := pgtype.Numeric{}
	nNum.Scan(fmt.Sprintf("%.2f", net))

	jsonBreakdown, _ := json.Marshal(breakdown)

	return &payslipResult{
		Gross:           gNum,
		TotalDeductions: dNum,
		Net:             nNum,
		Breakdown:       jsonBreakdown,
	}, nil
}

func (s *Service) AddAdjustment(ctx context.Context, tenantID, employeeID, userID, adjType string, amount float64, desc string) error {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(employeeID)
	uID := pgtype.UUID{}
	uID.Scan(userID)

	amt := pgtype.Numeric{}
	amt.Scan(fmt.Sprintf("%.2f", amount))

	adj, err := s.q.CreateAdjustment(ctx, db.CreateAdjustmentParams{
		TenantID:    tID,
		EmployeeID:  eID,
		Type:        adjType,
		Amount:      amt,
		Description: pgtype.Text{String: desc, Valid: desc != ""},
		Status:      "pending",
	})
	if err != nil {
		return err
	}

	// Create Approval Request
	_, err = s.approvals.CreateRequest(ctx, tenantID, userID, "hrms", "payroll_adjustment", adj.ID.String(), adj)
	return err
}
