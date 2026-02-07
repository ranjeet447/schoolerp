-- name: CreateCategory :one
INSERT INTO library_categories (
    tenant_id, name, parent_id, description
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListCategories :many
SELECT * FROM library_categories
WHERE tenant_id = $1
ORDER BY name;

-- name: CreateAuthor :one
INSERT INTO library_authors (
    tenant_id, name, bio
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: ListAuthors :many
SELECT * FROM library_authors
WHERE tenant_id = $1
ORDER BY name;

-- name: CreateBook :one
INSERT INTO library_books (
    tenant_id, title, isbn, publisher, published_year, category_id, 
    total_copies, available_copies, shelf_location, cover_image_url, 
    price, language, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;

-- name: CreateBookAuthor :exec
INSERT INTO library_book_authors (book_id, author_id) VALUES ($1, $2);

-- name: GetBook :one
SELECT * FROM library_books WHERE id = $1 AND tenant_id = $2;

-- name: ListBooks :many
SELECT * FROM library_books
WHERE tenant_id = $1
ORDER BY title
LIMIT $2 OFFSET $3;

-- name: IssueBook :one
INSERT INTO library_issues (
    tenant_id, book_id, student_id, user_id, issue_date, due_date, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: UpdateBookCopies :exec
UPDATE library_books 
SET available_copies = available_copies + $2
WHERE id = $1;

-- name: ReturnBook :one
UPDATE library_issues
SET return_date = $3, fine_amount = $4, status = $5, remarks = $6
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: ListIssues :many
SELECT 
    i.*,
    b.title as book_title,
    s.full_name as student_name,
    s.admission_number
FROM library_issues i
JOIN library_books b ON i.book_id = b.id
LEFT JOIN students s ON i.student_id = s.id
WHERE i.tenant_id = $1
ORDER BY i.created_at DESC
LIMIT $2 OFFSET $3;
