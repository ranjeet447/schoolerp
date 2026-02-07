package hrms

import (
	"context"
	"fmt"

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
	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	ssID := pgtype.UUID{}
	if p.SalaryStructureID != "" {
		ssID.Scan(p.SalaryStructureID)
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
		BankDetails:       p.BankDetails,
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

	// 1. Get all employees
	employees, err := s.q.ListEmployees(ctx, db.ListEmployeesParams{
		TenantID: tID,
		Limit:    1000,
		Offset:   0,
	})
	if err != nil {
		return err
	}

	// 2. Generate payslips (simplified: assumes salary structure is applied)
	for _, emp := range employees {
		if emp.Status != "active" {
			continue
		}
		// In a real system, we'd fetch the salary structure and calculate
		gross := pgtype.Numeric{}
		gross.Scan("50000.00") // Placeholder
		deductions := pgtype.Numeric{}
		deductions.Scan("5000.00")
		net := pgtype.Numeric{}
		net.Scan("45000.00")

		s.q.CreatePayslip(ctx, db.CreatePayslipParams{
			PayrollRunID:    prID,
			EmployeeID:      emp.ID,
			GrossSalary:     gross,
			TotalDeductions: deductions,
			NetSalary:       net,
			Status:          "generated",
		})
	}

	// 3. Mark payroll as completed
	s.q.UpdatePayrollRunStatus(ctx, db.UpdatePayrollRunStatusParams{
		ID:       prID,
		TenantID: tID,
		Status:   "completed",
	})

	return nil
}
