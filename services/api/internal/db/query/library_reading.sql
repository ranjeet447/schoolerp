-- name: UpsertReadingLog :one
INSERT INTO library_reading_logs (
    tenant_id, student_id, book_id, status, current_page, total_pages, rating, notes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
ON CONFLICT (student_id, book_id) DO UPDATE SET
    status = EXCLUDED.status,
    current_page = EXCLUDED.current_page,
    total_pages = EXCLUDED.total_pages,
    rating = EXCLUDED.rating,
    notes = EXCLUDED.notes,
    updated_at = NOW()
RETURNING *;

-- name: GetStudentReadingLogs :many
SELECT 
    l.*,
    b.title as book_title,
    b.cover_image_url
FROM library_reading_logs l
JOIN library_books b ON l.book_id = b.id
WHERE l.tenant_id = $1 AND l.student_id = $2
ORDER BY l.updated_at DESC;

-- name: ListRecentReadingLogs :many
SELECT 
    l.*,
    b.title as book_title,
    b.cover_image_url,
    s.full_name as student_name
FROM library_reading_logs l
JOIN library_books b ON l.book_id = b.id
JOIN students s ON l.student_id = s.id
WHERE l.tenant_id = $1
ORDER BY l.updated_at DESC
LIMIT $2;

-- name: ListAllReadingLogs :many
SELECT 
    l.*,
    b.title as book_title,
    b.cover_image_url,
    s.full_name as student_name
FROM library_reading_logs l
JOIN library_books b ON l.book_id = b.id
JOIN students s ON l.student_id = s.id
WHERE l.tenant_id = $1
ORDER BY l.updated_at DESC;

-- name: CreateReadingProgress :one
INSERT INTO library_reading_progress (
    student_id, asset_id, pages_read, total_pages
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetReadingVelocity :many
SELECT 
    recorded_at,
    pages_read
FROM library_reading_progress
WHERE student_id = $1 AND asset_id = $2
ORDER BY recorded_at ASC;
