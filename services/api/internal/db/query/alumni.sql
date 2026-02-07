-- name: CreateAlumni :one
INSERT INTO alumni (
    tenant_id, student_id, user_id, full_name, graduation_year, batch, email, phone, 
    current_company, current_role, linkedin_url, bio, is_verified
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;

-- name: GetAlumni :one
SELECT * FROM alumni WHERE id = $1 AND tenant_id = $2;

-- name: ListAlumni :many
SELECT * FROM alumni
WHERE tenant_id = $1
ORDER BY graduation_year DESC, full_name
LIMIT $2 OFFSET $3;

-- name: UpdateAlumni :one
UPDATE alumni SET
    current_company = $3, current_role = $4, linkedin_url = $5, bio = $6, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: CreatePlacementDrive :one
INSERT INTO placement_drives (
    tenant_id, company_name, role_title, description, drive_date, application_deadline, 
    min_graduation_year, max_graduation_year, status, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: GetPlacementDrive :one
SELECT * FROM placement_drives WHERE id = $1 AND tenant_id = $2;

-- name: ListPlacementDrives :many
SELECT * FROM placement_drives
WHERE tenant_id = $1
ORDER BY drive_date DESC
LIMIT $2 OFFSET $3;

-- name: UpdatePlacementDriveStatus :one
UPDATE placement_drives SET status = $3, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: CreatePlacementApplication :one
INSERT INTO placement_applications (drive_id, alumni_id, resume_url, cover_letter, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListDriveApplications :many
SELECT 
    pa.*,
    a.full_name as alumni_name,
    a.graduation_year,
    a.current_company
FROM placement_applications pa
JOIN alumni a ON pa.alumni_id = a.id
WHERE pa.drive_id = $1
ORDER BY pa.applied_at DESC;

-- name: UpdateApplicationStatus :one
UPDATE placement_applications SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetAlumniApplications :many
SELECT 
    pa.*,
    pd.company_name,
    pd.role_title,
    pd.drive_date
FROM placement_applications pa
JOIN placement_drives pd ON pa.drive_id = pd.id
WHERE pa.alumni_id = $1
ORDER BY pa.applied_at DESC;
