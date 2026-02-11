-- homework.sql

-- name: CreateHomework :one
INSERT INTO homework (
    tenant_id, subject_id, class_section_id, teacher_id, 
    title, description, due_date, attachments
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;

-- name: ListHomeworkForSection :many
SELECT h.*, s.name as subject_name, u.full_name as teacher_name
FROM homework h
JOIN subjects s ON h.subject_id = s.id
JOIN users u ON h.teacher_id = u.id
WHERE h.class_section_id = $1 AND h.tenant_id = $2
ORDER BY h.due_date DESC;

-- name: GetHomework :one
SELECT * FROM homework WHERE id = $1 AND tenant_id = $2;

-- name: SubmitHomework :one
INSERT INTO homework_submissions (
    homework_id, student_id, attachment_url, remarks
) VALUES (
    $1, $2, $3, $4
) 
ON CONFLICT (homework_id, student_id) 
DO UPDATE SET 
    attachment_url = EXCLUDED.attachment_url,
    remarks = EXCLUDED.remarks,
    submitted_at = NOW(),
    status = 'pending'
RETURNING *;

-- name: ListSubmissions :many
SELECT hs.*, st.full_name as student_name
FROM homework_submissions hs
JOIN students st ON hs.student_id = st.id
WHERE hs.homework_id = $1
ORDER BY hs.submitted_at DESC;

-- name: GradeSubmission :one
UPDATE homework_submissions
SET status = $2::TEXT, teacher_feedback = $3, updated_at = NOW()
WHERE id = $1 AND status != 'checked'
RETURNING *;

-- name: UpsertLessonPlan :one
INSERT INTO lesson_plans (
    tenant_id, subject_id, class_id, week_number, planned_topic, covered_at
) VALUES (
    $1, $2, $3, $4, $5, $6
)
ON CONFLICT (tenant_id, subject_id, class_id, week_number)
DO UPDATE SET 
    planned_topic = EXCLUDED.planned_topic,
    covered_at = EXCLUDED.covered_at,
    updated_at = NOW()
RETURNING *;

-- name: ListLessonPlans :many
SELECT * FROM lesson_plans 
WHERE tenant_id = $1 AND subject_id = $2 AND class_id = $3
ORDER BY week_number ASC;

-- name: GetHomeworkForStudent :many
-- This searches homework for the section the student is currently in
SELECT h.*, s.name as subject_name, hs.status as submission_status
FROM homework h
JOIN subjects s ON h.subject_id = s.id
JOIN students st ON h.class_section_id = st.section_id
LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = st.id
WHERE st.id = $1 AND h.tenant_id = $2
ORDER BY h.due_date ASC;

