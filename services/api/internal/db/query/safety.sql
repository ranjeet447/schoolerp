-- name: CreateDisciplineIncident :one
INSERT INTO discipline_incidents (
    tenant_id, student_id, reporter_id, incident_date, category, title, description, action_taken, status, parent_visibility
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: ListDisciplineIncidents :many
SELECT 
    di.*,
    s.full_name as student_name,
    u.full_name as reporter_name
FROM discipline_incidents di
JOIN students s ON di.student_id = s.id
JOIN users u ON di.reporter_id = u.id
WHERE di.tenant_id = $1
ORDER BY di.incident_date DESC
LIMIT $2 OFFSET $3;

-- name: UpdateDisciplineIncident :one
UPDATE discipline_incidents
SET 
    action_taken = $3,
    status = $4,
    parent_visibility = $5,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: GetDisciplineIncident :one
SELECT * FROM discipline_incidents WHERE id = $1 AND tenant_id = $2;

-- name: CreateVisitor :one
INSERT INTO visitors (
    tenant_id, full_name, phone, email, id_type, id_number, photo_url
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetVisitorByPhone :one
SELECT * FROM visitors WHERE tenant_id = $1 AND phone = $2;

-- name: CreateVisitorLog :one
INSERT INTO visitor_logs (
    tenant_id, visitor_id, purpose, contact_person_id, badge_number, remarks
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: CheckOutVisitor :one
UPDATE visitor_logs
SET 
    check_out_at = NOW(),
    remarks = COALESCE($3, remarks)
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: ListVisitorLogs :many
SELECT 
    vl.*,
    v.full_name as visitor_name,
    v.phone as visitor_phone,
    u.full_name as contact_person_name
FROM visitor_logs vl
JOIN visitors v ON vl.visitor_id = v.id
LEFT JOIN users u ON vl.contact_person_id = u.id
WHERE vl.tenant_id = $1
ORDER BY vl.check_in_at DESC
LIMIT $2 OFFSET $3;

-- name: CreatePickupAuthorization :one
INSERT INTO pickup_authorizations (
    tenant_id, student_id, name, relationship, phone, photo_url
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: ListPickupAuthorizations :many
SELECT * FROM pickup_authorizations
WHERE student_id = $1 AND tenant_id = $2 AND is_active = TRUE;

-- name: DeactivatePickupAuthorization :exec
UPDATE pickup_authorizations
SET is_active = FALSE, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2;

-- name: CreateEmergencyBroadcast :one
INSERT INTO emergency_broadcasts (
    tenant_id, message, channel, target_roles, status, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: ListEmergencyBroadcasts :many
SELECT 
    eb.*,
    u.full_name as created_by_name
FROM emergency_broadcasts eb
JOIN users u ON eb.created_by = u.id
WHERE eb.tenant_id = $1
ORDER BY eb.created_at DESC
LIMIT $2 OFFSET $3;
