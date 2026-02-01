-- name: CreateExam :one
INSERT INTO exams (
    tenant_id, academic_year_id, name, start_date, end_date
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: AddExamSubject :exec
INSERT INTO exam_subjects (
    exam_id, subject_id, max_marks, exam_date
) VALUES (
    $1, $2, $3, $4
);

-- name: GetExam :one
SELECT * FROM exams WHERE id = $1 AND tenant_id = $2;

-- name: ListExams :many
SELECT * FROM exams WHERE tenant_id = $1 ORDER BY created_at DESC;

-- name: ListExamSubjects :many
SELECT es.*, s.name as subject_name
FROM exam_subjects es
JOIN subjects s ON es.subject_id = s.id
WHERE es.exam_id = $1;

-- name: UpsertMarks :exec
INSERT INTO marks_entries (
    exam_id, subject_id, student_id, marks_obtained, entered_by
) VALUES (
    $1, $2, $3, $4, $5
)
ON CONFLICT (exam_id, subject_id, student_id)
DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, entered_by = EXCLUDED.entered_by;

-- name: PublishExam :one
UPDATE exams
SET status = 'published'
WHERE id = $1 AND tenant_id = $2
RETURNING *;

-- name: GetExamResultsForStudent :many
SELECT 
    me.marks_obtained,
    es.max_marks,
    s.name as subject_name,
    e.name as exam_name
FROM marks_entries me
JOIN exam_subjects es ON me.exam_id = es.exam_id AND me.subject_id = es.subject_id
JOIN exams e ON me.exam_id = e.id
JOIN subjects s ON me.subject_id = s.id
WHERE me.student_id = $1 AND e.tenant_id = $2 AND e.status = 'published';

-- name: GetExamMarks :many
SELECT 
    st.id as student_id,
    st.full_name as student_name,
    me.marks_obtained,
    me.remarks
FROM students st
LEFT JOIN marks_entries me ON st.id = me.student_id AND me.exam_id = $1 AND me.subject_id = $2
WHERE st.tenant_id = $3
ORDER BY st.full_name;
