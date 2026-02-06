-- Copyright 2026 Google LLC
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- name: CreateFile :one
INSERT INTO files (
    tenant_id, bucket, key, name, mime_type, size, uploaded_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
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
