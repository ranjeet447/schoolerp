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
