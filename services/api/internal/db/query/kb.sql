-- name: CreateKBDocument :one
INSERT INTO kb_documents (
    tenant_id, title, category, tags, visibility, status, content_text, created_by, updated_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $8
) RETURNING *;

-- name: ListKBDocuments :many
SELECT * FROM kb_documents
WHERE tenant_id = $1
  AND deleted_at IS NULL
  AND ($2::text = '' OR status = $2)
  AND ($3::text = '' OR visibility = $3)
  AND ($4::text = '' OR category = $4)
  AND ($5::text = '' OR title ILIKE '%' || $5 || '%' OR content_text ILIKE '%' || $5 || '%')
ORDER BY updated_at DESC
LIMIT $6 OFFSET $7;

-- name: GetKBDocument :one
SELECT * FROM kb_documents
WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL;

-- name: UpdateKBDocument :one
UPDATE kb_documents
SET
    title = $3,
    category = $4,
    tags = $5,
    visibility = $6,
    status = $7,
    content_text = $8,
    updated_by = $9,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteKBDocument :exec
UPDATE kb_documents
SET deleted_at = NOW(), updated_at = NOW(), updated_by = $3
WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL;

-- name: CreateKBChunk :one
INSERT INTO kb_chunks (
    tenant_id, document_id, chunk_index, content, tsv
) VALUES (
    $1, $2, $3, $4, to_tsvector('simple', $4)
) RETURNING *;

-- name: DeleteKBChunksByDocument :exec
DELETE FROM kb_chunks
WHERE tenant_id = $1 AND document_id = $2;

-- name: ListKBChunksByDocument :many
SELECT * FROM kb_chunks
WHERE tenant_id = $1 AND document_id = $2
ORDER BY chunk_index ASC;

-- name: GetTenantKBSettings :one
SELECT * FROM tenant_kb_settings
WHERE tenant_id = $1;

-- name: UpsertTenantKBSettings :one
INSERT INTO tenant_kb_settings (
    tenant_id, enabled, allowed_roles, allow_parents, allow_students, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, NOW(), NOW()
)
ON CONFLICT (tenant_id) DO UPDATE
SET
    enabled = EXCLUDED.enabled,
    allowed_roles = EXCLUDED.allowed_roles,
    allow_parents = EXCLUDED.allow_parents,
    allow_students = EXCLUDED.allow_students,
    updated_at = NOW()
RETURNING *;

-- name: ListKBCategories :many
SELECT DISTINCT category
FROM kb_documents
WHERE tenant_id = $1
  AND deleted_at IS NULL
  AND status = 'published'
  AND category IS NOT NULL
  AND category <> ''
  AND (array_length($2::text[], 1) IS NULL OR visibility = ANY($2::text[]))
ORDER BY category ASC;

-- name: ListKBTags :many
SELECT DISTINCT tag::text
FROM kb_documents d
CROSS JOIN LATERAL unnest(d.tags) AS tag
WHERE tenant_id = $1
  AND deleted_at IS NULL
  AND status = 'published'
  AND tags IS NOT NULL
  AND array_length(tags, 1) > 0
  AND (array_length($2::text[], 1) IS NULL OR visibility = ANY($2::text[]))
ORDER BY tag ASC;

-- name: SearchKBChunksWithTrgm :many
WITH q AS (
  SELECT plainto_tsquery('simple', $2::text) AS tsq
)
SELECT
  d.id AS document_id,
  d.title,
  d.category,
  d.tags,
  d.visibility,
  d.status,
  d.updated_at,
  c.id AS chunk_id,
  c.chunk_index,
  c.content AS raw_chunk_content,
  ts_headline(
    'simple',
    c.content,
    q.tsq,
    'StartSel=<mark>,StopSel=</mark>,MaxWords=35,MinWords=10,ShortWord=2,HighlightAll=FALSE,MaxFragments=2,FragmentDelimiter= ... '
  )::text AS snippet_html,
  (
    (0.7 * ts_rank_cd(c.tsv, q.tsq)) +
    (0.3 * similarity(c.content, $2::text)) +
    LEAST(0.05, GREATEST(0::double precision, 0.05 - (EXTRACT(EPOCH FROM (NOW() - d.updated_at)) / 86400.0 / 365.0)))
  )::double precision AS score
FROM kb_chunks c
JOIN kb_documents d ON d.id = c.document_id
CROSS JOIN q
WHERE c.tenant_id = $1
  AND d.tenant_id = $1
  AND d.deleted_at IS NULL
  AND d.status = $6
  AND (array_length($7::text[], 1) IS NULL OR d.visibility = ANY($7::text[]))
  AND ($3::text = '' OR d.category = $3)
  AND (array_length($4::text[], 1) IS NULL OR d.tags && $4::text[])
  AND ($5::text = '' OR d.visibility = $5)
  AND (
    c.tsv @@ q.tsq
    OR similarity(c.content, $2::text) > 0.08
  )
ORDER BY score DESC, d.updated_at DESC
LIMIT $8;

-- name: SearchKBChunksFTSOnly :many
WITH q AS (
  SELECT plainto_tsquery('simple', $2::text) AS tsq
)
SELECT
  d.id AS document_id,
  d.title,
  d.category,
  d.tags,
  d.visibility,
  d.status,
  d.updated_at,
  c.id AS chunk_id,
  c.chunk_index,
  c.content AS raw_chunk_content,
  ts_headline(
    'simple',
    c.content,
    q.tsq,
    'StartSel=<mark>,StopSel=</mark>,MaxWords=35,MinWords=10,ShortWord=2,HighlightAll=FALSE,MaxFragments=2,FragmentDelimiter= ... '
  )::text AS snippet_html,
  (
    ts_rank_cd(c.tsv, q.tsq) +
    LEAST(0.05, GREATEST(0::double precision, 0.05 - (EXTRACT(EPOCH FROM (NOW() - d.updated_at)) / 86400.0 / 365.0)))
  )::double precision AS score
FROM kb_chunks c
JOIN kb_documents d ON d.id = c.document_id
CROSS JOIN q
WHERE c.tenant_id = $1
  AND d.tenant_id = $1
  AND d.deleted_at IS NULL
  AND d.status = $6
  AND (array_length($7::text[], 1) IS NULL OR d.visibility = ANY($7::text[]))
  AND ($3::text = '' OR d.category = $3)
  AND (array_length($4::text[], 1) IS NULL OR d.tags && $4::text[])
  AND ($5::text = '' OR d.visibility = $5)
  AND c.tsv @@ q.tsq
ORDER BY score DESC, d.updated_at DESC
LIMIT $8;
