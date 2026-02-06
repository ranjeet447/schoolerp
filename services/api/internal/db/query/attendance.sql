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

-- name: CreateAttendanceSession :one
INSERT INTO attendance_sessions (tenant_id, class_section_id, date, marked_by)
VALUES ($1, $2, $3, $4)
ON CONFLICT (class_section_id, date) DO UPDATE 
SET updated_at = NOW() -- Assuming updated_at exists, if not just return
RETURNING *;

-- name: GetAttendanceSession :one
SELECT * FROM attendance_sessions
WHERE tenant_id = $1 AND class_section_id = $2 AND date = $3;

-- name: BatchUpsertAttendanceEntries :copyfrom
INSERT INTO attendance_entries (session_id, student_id, status, remarks)
VALUES ($1, $2, $3, $4);

-- name: GetAttendanceEntries :many
SELECT e.*, s.full_name, s.admission_number
FROM attendance_entries e
JOIN students s ON e.student_id = s.id
WHERE e.session_id = $1;

-- name: CreateLeaveRequest :one
INSERT INTO leave_requests (tenant_id, student_id, from_date, to_date, reason)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListLeaveRequests :many
SELECT lr.*, s.full_name, s.admission_number
FROM leave_requests lr
JOIN students s ON lr.student_id = s.id
WHERE lr.tenant_id = $1 AND (lr.status = $2 OR $2 = '');

-- name: UpdateLeaveStatus :one
UPDATE leave_requests
SET status = $2, decided_by = $3, decided_at = NOW()
WHERE id = $1 AND tenant_id = $4
RETURNING *;

-- name: DeleteAttendanceEntries :exec
DELETE FROM attendance_entries
WHERE session_id = $1;
