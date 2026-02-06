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

-- foundation.sql

-- Policies
-- name: GetPolicy :one
SELECT * FROM policies
WHERE tenant_id = $1 AND module = $2 AND action = $3 AND is_active = TRUE;

-- name: ListPolicies :many
SELECT * FROM policies
WHERE tenant_id = $1;

-- name: UpdateOrCreatePolicy :one
INSERT INTO policies (tenant_id, module, action, logic, is_active)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (tenant_id, module, action) DO UPDATE
SET logic = $4, is_active = $5, updated_at = NOW()
RETURNING *;

-- Locks
-- name: CreateLock :one
INSERT INTO locks (tenant_id, module, resource_id, locked_by, reason)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: CheckLock :one
SELECT EXISTS(
    SELECT 1 FROM locks
    WHERE tenant_id = $1 AND module = $2 AND (resource_id = $3 OR resource_id IS NULL)
) as is_locked;

-- name: DeleteLock :exec
DELETE FROM locks
WHERE tenant_id = $1 AND module = $2 AND resource_id = $3;

-- Approvals
-- name: CreateApprovalRequest :one
INSERT INTO approval_requests (tenant_id, requester_id, module, action, resource_id, payload)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetApprovalRequest :one
SELECT * FROM approval_requests
WHERE id = $1;

-- name: UpdateApprovalStatus :one
UPDATE approval_requests
SET status = $2, reason = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ListPendingApprovals :many
SELECT * FROM approval_requests
WHERE tenant_id = $1 AND status = 'pending';
