-- name: CreateEmployee :one
INSERT INTO employees (
    tenant_id, employee_code, full_name, email, phone, department, designation, join_date, salary_structure_id, bank_details, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING *;

-- name: GetEmployee :one
SELECT * FROM employees WHERE id = $1 AND tenant_id = $2;

-- name: ListEmployees :many
SELECT * FROM employees
WHERE tenant_id = $1
ORDER BY full_name
LIMIT $2 OFFSET $3;

-- name: UpdateEmployee :one
UPDATE employees SET
    full_name = $3, email = $4, phone = $5, department = $6, designation = $7, 
    salary_structure_id = $8, bank_details = $9, status = $10, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: CreateSalaryStructure :one
INSERT INTO salary_structures (
    tenant_id, name, basic, hra, da, other_allowances, deductions
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: ListSalaryStructures :many
SELECT * FROM salary_structures
WHERE tenant_id = $1
ORDER BY name;

-- name: CreatePayrollRun :one
INSERT INTO payroll_runs (
    tenant_id, month, year, status, run_by
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetPayrollRun :one
SELECT * FROM payroll_runs WHERE id = $1 AND tenant_id = $2;

-- name: ListPayrollRuns :many
SELECT * FROM payroll_runs
WHERE tenant_id = $1
ORDER BY year DESC, month DESC
LIMIT $2 OFFSET $3;

-- name: UpdatePayrollRunStatus :one
UPDATE payroll_runs SET status = $3, run_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: CreatePayslip :one
INSERT INTO payslips (
    payroll_run_id, employee_id, gross_salary, total_deductions, net_salary, breakdown, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: ListPayslipsByRun :many
SELECT 
    p.*,
    e.full_name as employee_name,
    e.employee_code
FROM payslips p
JOIN employees e ON p.employee_id = e.id
WHERE p.payroll_run_id = $1
ORDER BY e.full_name;

-- name: GetEmployeePayslips :many
SELECT 
    p.*,
    pr.month,
    pr.year
FROM payslips p
JOIN payroll_runs pr ON p.payroll_run_id = pr.id
WHERE p.employee_id = $1
ORDER BY pr.year DESC, pr.month DESC
LIMIT $2 OFFSET $3;
-- name: GetEmployeeSalaryInfo :one
SELECT 
    e.*,
    ss.basic,
    ss.hra,
    ss.da,
    ss.other_allowances,
    ss.deductions
FROM employees e
JOIN salary_structures ss ON e.salary_structure_id = ss.id
WHERE e.id = $1 AND e.tenant_id = $2;

-- name: CreateAdjustment :one
INSERT INTO payroll_adjustments (
    tenant_id, employee_id, type, amount, description, status
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetPendingAdjustments :many
SELECT * FROM payroll_adjustments
WHERE tenant_id = $1 AND employee_id = $2 AND status = 'pending';

-- name: GetApprovedAdjustmentsForRun :many
-- Adjustments that are approved but not yet processed in a run
SELECT * FROM payroll_adjustments
WHERE tenant_id = $1 AND employee_id = $2 AND status = 'approved' AND payroll_run_id IS NULL;

-- name: LinkAdjustmentToRun :exec
UPDATE payroll_adjustments
SET payroll_run_id = $3, status = 'processed', updated_at = NOW()
WHERE id = $1 AND tenant_id = $2;

-- name: UpdateAdjustmentStatus :exec
UPDATE payroll_adjustments
SET status = $3, approved_by = $4, approved_at = NOW(), updated_at = NOW()
WHERE id = $1 AND tenant_id = $2;

-- name: CreateTeacherSubjectSpecialization :one
INSERT INTO teacher_subject_specializations (tenant_id, teacher_id, subject_id)
VALUES (@tenant_id, @teacher_id, @subject_id)
RETURNING *;

-- name: ListTeacherSubjectSpecializations :many
SELECT ts.*, e.full_name as teacher_name, s.name as subject_name
FROM teacher_subject_specializations ts
JOIN employees e ON ts.teacher_id = e.id
JOIN subjects s ON ts.subject_id = s.id
WHERE ts.tenant_id = @tenant_id 
  AND (@filter_teacher::BOOLEAN = false OR ts.teacher_id = @teacher_id::UUID);

-- name: CreateClassTeacherAssignment :one
INSERT INTO class_teacher_assignments (tenant_id, academic_year_id, class_section_id, teacher_id, remarks)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListClassTeacherAssignments :many
SELECT ct.*, e.full_name as teacher_name, s.name as section_name, c.name as class_name
FROM class_teacher_assignments ct
JOIN employees e ON ct.teacher_id = e.id
JOIN sections s ON ct.class_section_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE ct.tenant_id = $1 AND ct.academic_year_id = $2;

-- Leaves
-- name: CreateLeaveType :one
INSERT INTO staff_leave_types (tenant_id, name, code, annual_allowance, carry_forward_limit, is_active)
VALUES (@tenant_id, @name, @code, @annual_allowance, @carry_forward_limit, @is_active)
RETURNING *;

-- name: ListLeaveTypes :many
SELECT * FROM staff_leave_types
WHERE tenant_id = @tenant_id AND (@is_active::BOOLEAN = false OR is_active = @is_active::BOOLEAN);

-- name: CreateStaffLeaveRequest :one
INSERT INTO staff_leave_requests (
    tenant_id, employee_id, leave_type_id, start_date, end_date, reason, status
) VALUES (
    @tenant_id, @employee_id, @leave_type_id, @start_date, @end_date, @reason, 'pending'
) RETURNING *;

-- name: ListStaffLeaveRequests :many
SELECT lr.*, lt.name as leave_name, e.full_name as employee_name
FROM staff_leave_requests lr
JOIN staff_leave_types lt ON lr.leave_type_id = lt.id
JOIN employees e ON lr.employee_id = e.id
WHERE lr.tenant_id = @tenant_id
  AND (@employee_id::UUID IS NULL OR lr.employee_id = @employee_id::UUID)
  AND (@status::TEXT = '' OR lr.status = @status::TEXT)
ORDER BY lr.created_at DESC;

-- name: UpdateLeaveRequestStatus :one
UPDATE staff_leave_requests
SET status = @status, reviewed_by = @reviewed_by, reviewed_at = NOW(), remarks = @remarks
WHERE id = @id AND tenant_id = @tenant_id
RETURNING *;

-- Awards
-- name: CreateStaffAward :one
INSERT INTO staff_awards (
    tenant_id, employee_id, award_name, category, awarded_date, awarded_by, description, bonus_amount
) VALUES (
    @tenant_id, @employee_id, @award_name, @category, @awarded_date, @awarded_by, @description, @bonus_amount
) RETURNING *;

-- name: ListStaffAwards :many
SELECT sa.*, e.full_name as employee_name
FROM staff_awards sa
JOIN employees e ON sa.employee_id = e.id
WHERE sa.tenant_id = @tenant_id
ORDER BY sa.awarded_date DESC;

-- Transfers
-- name: CreateStaffTransfer :one
INSERT INTO staff_transfers (
    tenant_id, employee_id, from_branch_id, to_branch_id, transfer_date, reason, authorized_by, status
) VALUES (
    @tenant_id, @employee_id, @from_branch_id, @to_branch_id, @transfer_date, @reason, @authorized_by, @status
) RETURNING *;

-- name: ListStaffTransfers :many
SELECT st.*, e.full_name as employee_name
FROM staff_transfers st
JOIN employees e ON st.employee_id = e.id
WHERE st.tenant_id = @tenant_id
ORDER BY st.transfer_date DESC;

-- Bonus History
-- name: CreateStaffBonus :one
INSERT INTO staff_bonus_history (
    tenant_id, employee_id, amount, bonus_type, payment_date, payroll_run_id, remarks
) VALUES (
    @tenant_id, @employee_id, @amount, @bonus_type, @payment_date, @payroll_run_id, @remarks
) RETURNING *;
