-- name: CreateSchoolGroup :one
INSERT INTO school_groups (name, description, owner_user_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetSchoolGroup :one
SELECT * FROM school_groups WHERE id = $1;

-- name: ListSchoolGroups :many
SELECT * FROM school_groups
WHERE owner_user_id = $1
ORDER BY name;

-- name: AddGroupMember :exec
INSERT INTO school_group_members (group_id, tenant_id)
VALUES ($1, $2);

-- name: ListGroupMembers :many
SELECT 
    gm.*,
    t.name as tenant_name
FROM school_group_members gm
JOIN tenants t ON gm.tenant_id = t.id
WHERE gm.group_id = $1;

-- name: RemoveGroupMember :exec
DELETE FROM school_group_members
WHERE group_id = $1 AND tenant_id = $2;

-- name: GetGroupAnalytics :one
SELECT 
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT e.id) as total_employees
FROM school_group_members gm
LEFT JOIN students s ON s.tenant_id = gm.tenant_id
LEFT JOIN employees e ON e.tenant_id = gm.tenant_id
WHERE gm.group_id = $1;

-- name: GetGroupFinancialAnalytics :one
SELECT 
    (
        SELECT COALESCE(SUM(r.amount_paid), 0)::BIGINT
        FROM school_group_members gm2
        JOIN receipts r ON r.tenant_id = gm2.tenant_id AND r.status != 'cancelled'
        WHERE gm2.group_id = gm.group_id
    ) as total_collected,
    (
        SELECT COALESCE(SUM(fpi.amount), 0)::BIGINT
        FROM school_group_members gm2
        JOIN fee_plans fp ON fp.tenant_id = gm2.tenant_id
        JOIN fee_plan_items fpi ON fpi.plan_id = fp.id
        JOIN student_fee_plans sfp ON sfp.plan_id = fp.id
        WHERE gm2.group_id = gm.group_id
    ) - (
        SELECT COALESCE(SUM(r.amount_paid), 0)::BIGINT
        FROM school_group_members gm2
        JOIN receipts r ON r.tenant_id = gm2.tenant_id AND r.status != 'cancelled'
        WHERE gm2.group_id = gm.group_id
    ) as total_pending,
    (
        SELECT COALESCE(SUM(ps.net_salary), 0)::NUMERIC(12, 2)
        FROM school_group_members gm2
        JOIN payroll_runs pr ON pr.tenant_id = gm2.tenant_id AND pr.status = 'completed'
        JOIN payslips ps ON ps.payroll_run_id = pr.id AND ps.status = 'paid'
        WHERE gm2.group_id = gm.group_id
    ) as total_salaries,
    (
        SELECT COALESCE(SUM(po.total_amount), 0)::NUMERIC(12, 2)
        FROM school_group_members gm2
        JOIN purchase_orders po ON po.tenant_id = gm2.tenant_id AND po.status IN ('approved', 'received')
        WHERE gm2.group_id = gm.group_id
    ) as total_purchases
FROM school_group_members gm
WHERE gm.group_id = $1
LIMIT 1;

-- name: GetGroupMemberComparison :many
SELECT 
    t.name as school_name,
    COUNT(DISTINCT s.id) as total_students,
    (
        SELECT COALESCE(SUM(r.amount_paid), 0)::BIGINT
        FROM receipts r
        WHERE r.tenant_id = t.id AND r.status != 'cancelled'
    ) as total_collected
FROM school_group_members gm
JOIN tenants t ON gm.tenant_id = t.id
LEFT JOIN students s ON s.tenant_id = t.id
WHERE gm.group_id = $1
GROUP BY t.id, t.name;

-- name: GetGroupEnrollmentTrend :many
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(id) as total_enrollments
FROM students s
JOIN school_group_members gm ON s.tenant_id = gm.tenant_id
WHERE gm.group_id = $1 AND s.created_at >= NOW() - INTERVAL '1 year'
GROUP BY 1
ORDER BY 1;

-- name: GetGroupRevenueTrend :many
SELECT 
    DATE_TRUNC('month', r.created_at) as month,
    SUM(r.amount_paid)::BIGINT as total_collected
FROM receipts r
JOIN school_group_members gm ON r.tenant_id = gm.tenant_id
WHERE gm.group_id = $1 AND r.status != 'cancelled' AND r.created_at >= NOW() - INTERVAL '1 year'
GROUP BY 1
ORDER BY 1;
