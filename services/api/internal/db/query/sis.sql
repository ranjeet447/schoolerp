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

-- name: CreateStudent :one
INSERT INTO students (
    tenant_id, admission_number, full_name, date_of_birth, gender, section_id, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetStudent :one
SELECT s.*, sec.name as section_name, c.name as class_name
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN classes c ON sec.class_id = c.id
WHERE s.id = $1 AND s.tenant_id = $2;

-- name: ListStudents :many
SELECT s.id, s.full_name, s.admission_number, s.status, s.section_id, sec.name as section_name, c.name as class_name
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN classes c ON sec.class_id = c.id
WHERE s.tenant_id = $1 
LIMIT $2 OFFSET $3;

-- name: UpdateStudent :one
UPDATE students
SET 
    full_name = $3,
    date_of_birth = $4,
    gender = $5,
    section_id = $6,
    status = $7,
    updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: DeleteStudent :exec
DELETE FROM students
WHERE id = $1 AND tenant_id = $2;

-- name: CreateGuardian :one
INSERT INTO guardians (
    tenant_id, full_name, phone, email, address
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: LinkStudentGuardian :exec
INSERT INTO student_guardians (
    student_id, guardian_id, relationship, is_primary
) VALUES (
    $1, $2, $3, $4
);

-- name: GetStudentGuardians :many
SELECT g.*, sg.relationship, sg.is_primary
FROM guardians g
JOIN student_guardians sg ON g.id = sg.guardian_id
WHERE sg.student_id = $1;

-- Academic Structure

-- name: CreateAcademicYear :one
INSERT INTO academic_years (
    tenant_id, name, start_date, end_date, is_active
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: ListAcademicYears :many
SELECT * FROM academic_years
WHERE tenant_id = $1
ORDER BY start_date DESC;

-- name: CreateClass :one
INSERT INTO classes (
    tenant_id, name, level, stream
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListClasses :many
SELECT * FROM classes
WHERE tenant_id = $1
ORDER BY level;

-- name: CreateSection :one
INSERT INTO sections (
    tenant_id, class_id, name, capacity
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListSectionsByClass :many
SELECT * FROM sections
WHERE class_id = $1
ORDER BY name;

-- name: ListSectionsByTenant :many
SELECT * FROM sections
WHERE tenant_id = $1
ORDER BY class_id, name;

-- name: CreateSubject :one
INSERT INTO subjects (
    tenant_id, name, code, type
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: ListSubjects :many
SELECT * FROM subjects
WHERE tenant_id = $1
ORDER BY name;

-- name: GetChildrenByParentUser :many
SELECT s.*, sec.name as section_name, c.name as class_name
FROM students s
JOIN student_guardians sg ON s.id = sg.student_id
JOIN guardians g ON sg.guardian_id = g.id
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN classes c ON sec.class_id = c.id
WHERE g.user_id = $1 AND s.tenant_id = $2;

-- name: CountStudents :one
SELECT count(*) FROM students
WHERE tenant_id = $1;
