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

-- name: UpsertGradingScale :one
INSERT INTO grading_scales (tenant_id, min_percent, max_percent, grade_label, grade_point)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (tenant_id, grade_label) DO UPDATE
SET min_percent = EXCLUDED.min_percent, 
    max_percent = EXCLUDED.max_percent,
    grade_point = EXCLUDED.grade_point
RETURNING *;

-- name: ListGradingScales :many
SELECT * FROM grading_scales WHERE tenant_id = $1 ORDER BY min_percent DESC;

-- name: UpsertWeightageConfig :one
INSERT INTO exam_weightage_config (tenant_id, academic_year_id, exam_type, weight_percentage)
VALUES ($1, $2, $3, $4)
ON CONFLICT (tenant_id, academic_year_id, exam_type) DO UPDATE
SET weight_percentage = EXCLUDED.weight_percentage
RETURNING *;

-- name: ListWeightageConfigs :many
SELECT * FROM exam_weightage_config WHERE tenant_id = $1 AND academic_year_id = $2;

-- name: UpsertMarksAggregate :one
INSERT INTO marks_aggregates (tenant_id, student_id, academic_year_id, subject_id, aggregate_marks, grade_label)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (student_id, academic_year_id, subject_id) DO UPDATE
SET aggregate_marks = EXCLUDED.aggregate_marks,
    grade_label = EXCLUDED.grade_label,
    calculated_at = NOW()
RETURNING *;

-- name: GetMarksForAggregation :many
SELECT 
    me.student_id,
    me.subject_id,
    me.marks_obtained,
    es.max_marks,
    e.type as exam_type
FROM marks_entries me
JOIN exams e ON me.exam_id = e.id
JOIN exam_subjects es ON me.exam_id = es.exam_id AND me.subject_id = es.subject_id
WHERE e.tenant_id = $1 AND e.academic_year_id = $2 AND e.status = 'published';

