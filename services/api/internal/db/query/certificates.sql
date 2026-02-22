-- name: CreateCertificate :one
INSERT INTO certificates (
    tenant_id, student_id, template_id, certificate_type, 
    certificate_number, issuance_date, issued_by, reason, 
    metadata, file_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: GetCertificate :one
SELECT * FROM certificates WHERE id = $1 AND tenant_id = $2;

-- name: ListCertificatesByStudent :many
SELECT * FROM certificates 
WHERE student_id = $1 AND tenant_id = $2
ORDER BY created_at DESC;

-- name: ListCertificatesByTenant :many
SELECT c.*, s.full_name as student_name, s.admission_number, u.full_name as issued_by_name
FROM certificates c
JOIN students s ON c.student_id = s.id
JOIN users u ON c.issued_by = u.id
WHERE c.tenant_id = $1
ORDER BY c.created_at DESC;

-- name: RevokeCertificate :exec
UPDATE certificates 
SET status = 'revoked', updated_at = NOW() 
WHERE id = $1 AND tenant_id = $2;

-- name: GetLastCertificateNumber :one
SELECT certificate_number 
FROM certificates 
WHERE tenant_id = $1 AND certificate_type = $2
ORDER BY created_at DESC 
LIMIT 1;
