-- name: CreateConfidentialNote :one
INSERT INTO student_confidential_notes (
    tenant_id, student_id, created_by, encrypted_content
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListConfidentialNotes :many
SELECT * FROM student_confidential_notes
WHERE tenant_id = $1 AND student_id = $2
ORDER BY created_at DESC;

-- name: DeleteConfidentialNote :exec
DELETE FROM student_confidential_notes WHERE id = $1 AND tenant_id = $2;
