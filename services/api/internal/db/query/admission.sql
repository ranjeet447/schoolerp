-- name: CreateEnquiry :one
INSERT INTO admission_enquiries (
    tenant_id, parent_name, email, phone, student_name, grade_interested, academic_year, source, status, notes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: ListEnquiries :many
SELECT * FROM admission_enquiries
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetEnquiry :one
SELECT * FROM admission_enquiries WHERE id = $1 AND tenant_id = $2;

-- name: UpdateEnquiryStatus :exec
UPDATE admission_enquiries 
SET status = $3, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2;

-- name: CreateApplication :one
INSERT INTO admission_applications (
    tenant_id, enquiry_id, application_number, status, form_data, documents
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: ListApplications :many
SELECT 
    a.*,
    e.parent_name,
    e.student_name,
    e.grade_interested
FROM admission_applications a
LEFT JOIN admission_enquiries e ON a.enquiry_id = e.id
WHERE a.tenant_id = $1
ORDER BY a.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetApplication :one
SELECT * FROM admission_applications WHERE id = $1 AND tenant_id = $2;

-- name: UpdateApplicationStatus :exec
UPDATE admission_applications 
SET status = $3, reviewed_by = $4, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2;
