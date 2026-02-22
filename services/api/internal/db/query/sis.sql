-- name: UpdateStudentStatus :exec
UPDATE students
SET status = @status, 
    updated_at = NOW()
WHERE id = @id AND tenant_id = @tenant_id;

-- name: CreateStudent :one
INSERT INTO students (
    tenant_id, admission_number, full_name, date_of_birth, gender, section_id, status
) VALUES (
    @tenant_id, @admission_number, @full_name, @date_of_birth, @gender, @section_id, @status
) RETURNING *;

-- name: GetStudent :one
SELECT s.*, sec.name as section_name, c.name as class_name
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN classes c ON sec.class_id = c.id
WHERE s.id = $1 AND s.tenant_id = $2;

-- name: ListStudents :many
SELECT s.id, s.full_name, s.admission_number, s.status, s.section_id, c.id as class_id, sec.name as section_name, c.name as class_name
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN classes c ON sec.class_id = c.id
WHERE s.tenant_id = $1 
LIMIT $2 OFFSET $3;

-- name: SearchStudents :many
SELECT s.id, s.full_name, s.admission_number, s.status, s.section_id, c.id as class_id, sec.name as section_name, c.name as class_name
FROM students s
LEFT JOIN sections sec ON s.section_id = sec.id
LEFT JOIN classes c ON sec.class_id = c.id
WHERE s.tenant_id = $1
  AND (
    $2::text = '' 
    OR s.full_name ILIKE '%' || $2 || '%' 
    OR s.admission_number ILIKE '%' || $2 || '%'
  )
  AND (array_length($3::uuid[], 1) IS NULL OR s.section_id = ANY($3::uuid[]))
  AND (array_length($4::uuid[], 1) IS NULL OR sec.class_id = ANY($4::uuid[]))
  AND s.status = 'active'
LIMIT $5;

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

-- name: GetActiveAcademicYear :one
SELECT * FROM academic_years
WHERE tenant_id = $1 AND is_active = TRUE
LIMIT 1;


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

-- name: GetHolidaysBetween :many
SELECT * FROM school_events
WHERE tenant_id = $1 AND event_type = 'holiday'
AND start_time < $3 AND end_time > $2
ORDER BY start_time;

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

-- name: PromoteStudent :one
INSERT INTO student_promotions (
    tenant_id, student_id, from_academic_year_id, to_academic_year_id,
    from_section_id, to_section_id, promoted_by, status, remarks
) VALUES (
    @tenant_id, @student_id, @from_academic_year_id, @to_academic_year_id,
    @from_section_id, @to_section_id, @promoted_by, @status, @remarks
) RETURNING *;

-- name: CreatePromotionRule :one
INSERT INTO promotion_rules (
    tenant_id, priority, min_aggregate_percent, min_subject_percent,
    required_attendance_percent, is_active
) VALUES (
    @tenant_id, @priority, @min_aggregate_percent, @min_subject_percent,
    @required_attendance_percent, @is_active
) RETURNING *;

-- name: CreateStudentRemark :one
INSERT INTO student_remarks (
    tenant_id, student_id, posted_by, category, remark_text, requires_ack
) VALUES (
    @tenant_id, @student_id, @posted_by, @category, @remark_text, @requires_ack
) RETURNING *;

-- name: ListStudentRemarks :many
SELECT sr.*, u.full_name as posted_by_name 
FROM student_remarks sr
JOIN users u ON sr.posted_by = u.id
WHERE sr.student_id = @student_id AND sr.tenant_id = @tenant_id
ORDER BY sr.created_at DESC;

-- name: AcknowledgeStudentRemark :one
UPDATE student_remarks
SET is_acknowledged = TRUE, ack_by_user_id = @ack_by_user_id, ack_at = NOW()
WHERE id = @id AND tenant_id = @tenant_id
RETURNING *;

-- name: CreateStudentDocument :one
INSERT INTO student_documents (
    tenant_id, student_id, file_id, type, note
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: ListStudentDocuments :many
SELECT sd.*, f.name as file_name, f.url as file_url
FROM student_documents sd
JOIN files f ON sd.file_id = f.id
WHERE sd.student_id = $1 AND sd.tenant_id = $2;

-- name: ListTeacherSections :many
SELECT DISTINCT sec.*, c.name as class_name
FROM sections sec
JOIN classes c ON sec.class_id = c.id
JOIN timetable_entries te ON sec.id = te.class_section_id
WHERE te.teacher_id = $1 AND te.tenant_id = $2
ORDER BY c.name, sec.name;

-- name: ListTeacherSubjects :many
SELECT DISTINCT s.*
FROM subjects s
JOIN timetable_entries te ON s.id = te.subject_id
WHERE te.teacher_id = $1 AND te.tenant_id = $2
ORDER BY s.name;
