-- homework.sql

-- name: CreateHomework :one
INSERT INTO homework (
    tenant_id, subject_id, class_section_id, teacher_id, 
    title, description, due_date, attachments, resource_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
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
    tenant_id, subject_id, class_id, week_number, planned_topic, covered_at, review_status, review_remarks
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
ON CONFLICT (tenant_id, subject_id, class_id, week_number)
DO UPDATE SET 
    planned_topic = EXCLUDED.planned_topic,
    covered_at = EXCLUDED.covered_at,
    review_status = COALESCE(NULLIF(EXCLUDED.review_status, ''), lesson_plans.review_status),
    review_remarks = EXCLUDED.review_remarks,
    updated_at = NOW()
RETURNING *;

-- name: ListLessonPlans :many
SELECT lp.*, s.name as subject_name, c.name as class_name
FROM lesson_plans lp
JOIN subjects s ON lp.subject_id = s.id
JOIN classes c ON lp.class_id = c.id
WHERE lp.tenant_id = $1 AND lp.subject_id = $2 AND lp.class_id = $3
ORDER BY lp.week_number ASC;

-- name: UpdateLessonPlanStatus :one
UPDATE lesson_plans
SET review_status = $3, review_remarks = $4, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: GetSyllabusLag :many
SELECT lp.*, s.name as subject_name, c.name as class_name
FROM lesson_plans lp
JOIN subjects s ON lp.subject_id = s.id
JOIN classes c ON lp.class_id = c.id
WHERE lp.tenant_id = $1 
AND lp.week_number < $2 -- current week number
AND lp.covered_at IS NULL
ORDER BY lp.week_number ASC;

-- name: GetHomeworkForStudent :many
-- This searches homework for the section the student is currently in
SELECT h.*, s.name as subject_name, hs.status as submission_status
FROM homework h
JOIN subjects s ON h.subject_id = s.id
JOIN students st ON h.class_section_id = st.section_id
LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = st.id
WHERE st.id = $1 AND h.tenant_id = $2
ORDER BY h.due_date ASC;

-- name: GetHomeworkDueSoon :many
SELECT * FROM homework
WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '4 hours'
AND submission_allowed = TRUE;

-- name: GetStudentsMissingSubmissionForHomework :many
SELECT st.id as student_id, st.full_name
FROM students st
JOIN homework h ON st.section_id = h.class_section_id
LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND st.id = hs.student_id
WHERE h.id = $1 AND hs.id IS NULL;


