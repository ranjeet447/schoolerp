-- name: CreateFile :one
INSERT INTO files (
    tenant_id, bucket, key, name, mime_type, size, uploaded_by
) VALUES (
    @tenant_id, @bucket, @key, @name, @mime_type, @size, @uploaded_by
) RETURNING *;

-- name: GetFile :one
SELECT * FROM files 
WHERE id = $1 AND tenant_id = $2;

-- name: GetPDFTemplate :one
SELECT * FROM pdf_templates
WHERE tenant_id = $1 AND code = $2 AND is_active = true
ORDER BY version DESC
LIMIT 1;

-- name: CreatePDFJob :one
INSERT INTO pdf_jobs (
    tenant_id, template_code, payload, status
) VALUES (
    $1, $2, $3, 'pending'
) RETURNING *;

-- name: UpdatePDFJobStatus :one
UPDATE pdf_jobs
SET status = $3, file_id = $4, error_message = $5, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: ListPendingPDFJobs :many
SELECT * FROM pdf_jobs
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT $1;
