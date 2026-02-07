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
