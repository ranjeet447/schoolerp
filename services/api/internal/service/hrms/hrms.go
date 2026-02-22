package hrms

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/schoolerp/api/internal/db"
	"github.com/schoolerp/api/internal/foundation/approvals"
	"github.com/schoolerp/api/internal/foundation/audit"
	"github.com/schoolerp/api/internal/foundation/quota"
)

type Service struct {
	q         db.Querier
	pool      *pgxpool.Pool
	audit     *audit.Logger
	approvals *approvals.Service
	quota     *quota.Service
}

func NewService(q db.Querier, pool *pgxpool.Pool, audit *audit.Logger, approvals *approvals.Service, quotaSvc *quota.Service) *Service {
	return &Service{q: q, pool: pool, audit: audit, approvals: approvals, quota: quotaSvc}
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
	if strings.TrimSpace(p.EmployeeCode) == "" || strings.TrimSpace(p.FullName) == "" {
		return db.Employee{}, errors.New("employee_code and full_name are required")
	}
	if strings.TrimSpace(p.Email) == "" {
		return db.Employee{}, errors.New("email is required")
	}

	if s.quota != nil {
		if err := s.quota.CheckQuota(ctx, p.TenantID, quota.QuotaStaff); err != nil {
			return db.Employee{}, err
		}
	}

	tID := pgtype.UUID{}
	tID.Scan(p.TenantID)
	ssID := pgtype.UUID{}
	if p.SalaryStructureID != "" {
		if err := ssID.Scan(p.SalaryStructureID); err != nil {
			return db.Employee{}, errors.New("invalid salary_structure_id")
		}
	}

	joinDate := pgtype.Date{}
	if p.JoinDate != "" {
		parsed, err := time.Parse("2006-01-02", p.JoinDate)
		if err != nil {
			return db.Employee{}, errors.New("join_date must be in YYYY-MM-DD format")
		}
		joinDate = pgtype.Date{Time: parsed, Valid: true}
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
		JoinDate:          joinDate,
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
	if strings.TrimSpace(p.Name) == "" {
		return db.SalaryStructure{}, errors.New("name is required")
	}
	if p.Basic < 0 || p.HRA < 0 || p.DA < 0 {
		return db.SalaryStructure{}, errors.New("salary components cannot be negative")
	}

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
	if month < 1 || month > 12 {
		return db.PayrollRun{}, errors.New("month must be between 1 and 12")
	}
	if year < 2000 || year > 2100 {
		return db.PayrollRun{}, errors.New("year must be between 2000 and 2100")
	}

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
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin payroll transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := db.New(tx)

	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	prID := pgtype.UUID{}
	prID.Scan(payrollRunID)

	// 1. Verify payroll run
	run, err := qtx.GetPayrollRun(ctx, db.GetPayrollRunParams{ID: prID, TenantID: tID})
	if err != nil {
		return err
	}
	if run.Status == "completed" {
		return errors.New("payroll run is already completed")
	}

	if _, err := qtx.UpdatePayrollRunStatus(ctx, db.UpdatePayrollRunStatusParams{
		ID:       prID,
		TenantID: tID,
		Status:   "processing",
	}); err != nil {
		return fmt.Errorf("failed to set payroll run to processing: %w", err)
	}

	// 2. Get all employees
	employees, err := qtx.ListEmployees(ctx, db.ListEmployeesParams{
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
		payslip, err := s.calculatePayslip(ctx, qtx, tID, emp.ID)
		if err != nil {
			return fmt.Errorf("failed to calculate payslip for employee %s: %w", emp.ID.String(), err)
		}

		// Save payslip
		ps, err := qtx.CreatePayslip(ctx, db.CreatePayslipParams{
			PayrollRunID:    prID,
			EmployeeID:      emp.ID,
			GrossSalary:     payslip.Gross,
			TotalDeductions: payslip.TotalDeductions,
			NetSalary:       payslip.Net,
			Breakdown:       payslip.Breakdown,
			Status:          "generated",
		})
		if err != nil {
			return fmt.Errorf("failed to create payslip for employee %s: %w", emp.ID.String(), err)
		}

		// Link approved adjustments to this run
		adjs, err := qtx.GetApprovedAdjustmentsForRun(ctx, db.GetApprovedAdjustmentsForRunParams{
			TenantID:   tID,
			EmployeeID: emp.ID,
		})
		if err != nil {
			return fmt.Errorf("failed to fetch approved adjustments for employee %s: %w", emp.ID.String(), err)
		}
		for _, a := range adjs {
			if err := qtx.LinkAdjustmentToRun(ctx, db.LinkAdjustmentToRunParams{
				ID:           a.ID,
				TenantID:     tID,
				PayrollRunID: prID,
			}); err != nil {
				return fmt.Errorf("failed to link adjustment %s to payroll run: %w", a.ID.String(), err)
			}
		}

		// Produce Outbox Event for background PDF generation
		payload, _ := json.Marshal(map[string]interface{}{
			"payslip_id":  ps.ID,
			"employee_id": emp.ID,
			"run_id":      prID,
		})
		if _, err := qtx.CreateOutboxEvent(ctx, db.CreateOutboxEventParams{
			TenantID:  tID,
			EventType: "payslip.generated",
			Payload:   payload,
		}); err != nil {
			return fmt.Errorf("failed to create outbox event for employee %s: %w", emp.ID.String(), err)
		}
	}

	// 4. Mark payroll as completed
	if _, err := qtx.UpdatePayrollRunStatus(ctx, db.UpdatePayrollRunStatusParams{
		ID:       prID,
		TenantID: tID,
		Status:   "completed",
	}); err != nil {
		return fmt.Errorf("failed to mark payroll run completed: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit payroll transaction: %w", err)
	}

	return nil
}

type payslipResult struct {
	Gross           pgtype.Numeric
	TotalDeductions pgtype.Numeric
	Net             pgtype.Numeric
	Breakdown       []byte
}

func (s *Service) calculatePayslip(ctx context.Context, q db.Querier, tID, empID pgtype.UUID) (*payslipResult, error) {
	// Fetch salary structure and employee info
	info, err := q.GetEmployeeSalaryInfo(ctx, db.GetEmployeeSalaryInfoParams{
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
	adjs, _ := q.GetApprovedAdjustmentsForRun(ctx, db.GetApprovedAdjustmentsForRunParams{
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
	if adjType != "allowance" && adjType != "deduction" {
		return errors.New("type must be 'allowance' or 'deduction'")
	}
	if amount <= 0 {
		return errors.New("amount must be greater than zero")
	}
	if s.approvals == nil {
		return errors.New("approval workflow is not configured")
	}

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

// ==================== Staff Assignments ====================

func (s *Service) CreateTeacherSubjectSpecialization(ctx context.Context, tenantID, teacherID, subjectID string) (db.TeacherSubjectSpecialization, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	trID := pgtype.UUID{}
	trID.Scan(teacherID)
	sID := pgtype.UUID{}
	sID.Scan(subjectID)

	return s.q.CreateTeacherSubjectSpecialization(ctx, db.CreateTeacherSubjectSpecializationParams{
		TenantID:  tID,
		TeacherID: trID,
		SubjectID: sID,
	})
}

func (s *Service) ListTeacherSubjectSpecializations(ctx context.Context, tenantID string, teacherID *string) ([]db.ListTeacherSubjectSpecializationsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	trID := pgtype.UUID{}
	var hasTeacher bool
	if teacherID != nil {
		trID.Scan(*teacherID)
		hasTeacher = true
	}

	return s.q.ListTeacherSubjectSpecializations(ctx, db.ListTeacherSubjectSpecializationsParams{
		TenantID:      tID,
		FilterTeacher: hasTeacher,
		TeacherID:     trID,
	})
}

func (s *Service) AssignClassTeacher(ctx context.Context, tenantID, ayID, sectionID, teacherID, remarks string) (db.ClassTeacherAssignment, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(ayID)
	sID := pgtype.UUID{}
	sID.Scan(sectionID)
	trID := pgtype.UUID{}
	trID.Scan(teacherID)

	return s.q.CreateClassTeacherAssignment(ctx, db.CreateClassTeacherAssignmentParams{
		TenantID:       tID,
		AcademicYearID: aID,
		ClassSectionID: sID,
		TeacherID:      trID,
		Remarks:        pgtype.Text{String: remarks, Valid: remarks != ""},
	})
}


func (s *Service) ListClassTeacherAssignments(ctx context.Context, tenantID, ayID string) ([]db.ListClassTeacherAssignmentsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	aID := pgtype.UUID{}
	aID.Scan(ayID)

	return s.q.ListClassTeacherAssignments(ctx, db.ListClassTeacherAssignmentsParams{
		TenantID:       tID,
		AcademicYearID: aID,
	})
}

// ==================== Advanced HRMS ====================

// Leaves
func (s *Service) CreateLeaveType(ctx context.Context, tenantID, name, code string, allowance, carryForward int32, isActive bool) (db.StaffLeaveType, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)

	return s.q.CreateLeaveType(ctx, db.CreateLeaveTypeParams{
		TenantID:           tID,
		Name:               name,
		Code:               code,
		AnnualAllowance:    pgtype.Int4{Int32: allowance, Valid: true},
		CarryForwardLimit:  pgtype.Int4{Int32: carryForward, Valid: true},
		IsActive:           pgtype.Bool{Bool: isActive, Valid: true},
	})
}

func (s *Service) ListLeaveTypes(ctx context.Context, tenantID string, isActive *bool) ([]db.StaffLeaveType, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	var active bool
	if isActive != nil && *isActive {
		active = true
	}

	return s.q.ListLeaveTypes(ctx, db.ListLeaveTypesParams{
		TenantID: tID,
		IsActive: active,
	})
}

func (s *Service) CreateStaffLeaveRequest(ctx context.Context, tenantID, employeeID, leaveTypeID string, start, end time.Time, reason string) (db.StaffLeaveRequest, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(employeeID)
	ltID := pgtype.UUID{}
	ltID.Scan(leaveTypeID)

	return s.q.CreateStaffLeaveRequest(ctx, db.CreateStaffLeaveRequestParams{
		TenantID:    tID,
		EmployeeID:  eID,
		LeaveTypeID: ltID,
		StartDate:   pgtype.Date{Time: start, Valid: true},
		EndDate:     pgtype.Date{Time: end, Valid: true},
		Reason:      pgtype.Text{String: reason, Valid: reason != ""},
	})
}

func (s *Service) ListStaffLeaveRequests(ctx context.Context, tenantID string, employeeID, status *string) ([]db.ListStaffLeaveRequestsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	var eID pgtype.UUID
	if employeeID != nil {
		eID.Scan(*employeeID)
	}
	var stat string
	if status != nil {
		stat = *status
	}

	return s.q.ListStaffLeaveRequests(ctx, db.ListStaffLeaveRequestsParams{
		TenantID:   tID,
		EmployeeID: eID,
		Status:     stat,
	})
}

func (s *Service) UpdateLeaveRequestStatus(ctx context.Context, tenantID, requestID, status, reviewerID, remarks string) (db.StaffLeaveRequest, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	rID := pgtype.UUID{}
	rID.Scan(requestID)
	rvID := pgtype.UUID{}
	rvID.Scan(reviewerID)

	return s.q.UpdateLeaveRequestStatus(ctx, db.UpdateLeaveRequestStatusParams{
		ID:         rID,
		TenantID:   tID,
		Status:     status,
		ReviewedBy: rvID,
		Remarks:    pgtype.Text{String: remarks, Valid: remarks != ""},
	})
}

// Awards
func (s *Service) CreateStaffAward(ctx context.Context, tenantID, employeeID, name, category string, awardedDate time.Time, awardedBy, desc string, bonus float64) (db.StaffAward, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(employeeID)

	bonusNum := pgtype.Numeric{}
	bonusNum.Scan(fmt.Sprintf("%.2f", bonus))

	return s.q.CreateStaffAward(ctx, db.CreateStaffAwardParams{
		TenantID:    tID,
		EmployeeID:  eID,
		AwardName:   name,
		Category:    pgtype.Text{String: category, Valid: category != ""},
		AwardedDate: pgtype.Date{Time: awardedDate, Valid: true},
		AwardedBy:   pgtype.Text{String: awardedBy, Valid: awardedBy != ""},
		Description: pgtype.Text{String: desc, Valid: desc != ""},
		BonusAmount: bonusNum,
	})
}

func (s *Service) ListStaffAwards(ctx context.Context, tenantID string) ([]db.ListStaffAwardsRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListStaffAwards(ctx, tID)
}

// Transfers
func (s *Service) CreateStaffTransfer(ctx context.Context, tenantID, employeeID, fromBranchID, toBranchID string, date time.Time, reason, authBy, status string) (db.StaffTransfer, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(employeeID)
	
	fID := pgtype.UUID{}
	if fromBranchID != "" {
		fID.Scan(fromBranchID)
	} else {
		fID.Valid = false
	}
	
	toID := pgtype.UUID{}
	if toBranchID != "" {
		toID.Scan(toBranchID)
	} else {
		toID.Valid = false
	}

	aID := pgtype.UUID{}
	if authBy != "" {
		aID.Scan(authBy)
	} else {
		aID.Valid = false
	}

	return s.q.CreateStaffTransfer(ctx, db.CreateStaffTransferParams{
		TenantID:     tID,
		EmployeeID:   eID,
		FromBranchID: fID,
		ToBranchID:   toID,
		TransferDate: pgtype.Date{Time: date, Valid: true},
		Reason:       pgtype.Text{String: reason, Valid: reason != ""},
		AuthorizedBy: aID,
		Status:       status,
	})
}

func (s *Service) ListStaffTransfers(ctx context.Context, tenantID string) ([]db.ListStaffTransfersRow, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	return s.q.ListStaffTransfers(ctx, tID)
}

// Bonus History
func (s *Service) CreateStaffBonus(ctx context.Context, tenantID, employeeID string, amount float64, bonusType string, paymentDate time.Time, payrollRunID *string, remarks string) (db.StaffBonusHistory, error) {
	tID := pgtype.UUID{}
	tID.Scan(tenantID)
	eID := pgtype.UUID{}
	eID.Scan(employeeID)

	pID := pgtype.UUID{}
	if payrollRunID != nil {
		pID.Scan(*payrollRunID)
	} else {
		pID.Valid = false
	}

	amountNum := pgtype.Numeric{}
	amountNum.Scan(fmt.Sprintf("%.2f", amount))

	return s.q.CreateStaffBonus(ctx, db.CreateStaffBonusParams{
		TenantID:     tID,
		EmployeeID:   eID,
		Amount:       amountNum,
		BonusType:    bonusType,
		PaymentDate:  pgtype.Date{Time: paymentDate, Valid: true},
		PayrollRunID: pID,
		Remarks:      pgtype.Text{String: remarks, Valid: remarks != ""},
	})
}
func (s *Service) GetEmployeeByUserID(ctx context.Context, tenantID, userID string) (db.Employee, error) {
	tUID := pgtype.UUID{}
	tUID.Scan(tenantID)
	uUID := pgtype.UUID{}
	uUID.Scan(userID)

	return s.q.GetEmployeeByUserID(ctx, db.GetEmployeeByUserIDParams{
		UserID:   uUID,
		TenantID: tUID,
	})
}
