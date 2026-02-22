-- name: CreateAttendanceSession :one
INSERT INTO attendance_sessions (tenant_id, class_section_id, date, marked_by)
VALUES ($1, $2, $3, $4)
ON CONFLICT (class_section_id, date) DO UPDATE 
SET updated_at = NOW() 
RETURNING *;

-- name: GetAttendanceSession :one
SELECT * FROM attendance_sessions
WHERE tenant_id = $1 AND class_section_id = $2 AND date = $3;

-- name: ListLeaves :many
SELECT * FROM leave_requests
WHERE tenant_id = @tenant_id AND (@status::text = '' OR status = @status)
ORDER BY created_at DESC;

-- name: GetDailyAttendanceStats :one
SELECT 
    (SELECT COUNT(*) FROM students st WHERE st.tenant_id = @tenant_id AND st.status = 'active') as total_students,
    COUNT(CASE WHEN ae.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ae.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN ae.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ae.status = 'excused' THEN 1 END) as excused_count
FROM attendance_entries ae
JOIN attendance_sessions s ON ae.session_id = s.id
WHERE s.tenant_id = @tenant_id AND s.date = @date;

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

-- name: GetMonthlyAttendanceSummary :many
SELECT 
    s.id as student_id,
    s.full_name,
    s.admission_number,
    COUNT(CASE WHEN ae.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ae.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN ae.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ae.status = 'excused' THEN 1 END) as excused_count
FROM students s
LEFT JOIN attendance_sessions ssn ON ssn.class_section_id = s.section_id 
    AND ssn.tenant_id = s.tenant_id
    AND to_char(ssn.date, 'YYYY-MM') = @month::text
LEFT JOIN attendance_entries ae ON ae.session_id = ssn.id AND ae.student_id = s.id
WHERE s.tenant_id = @tenant_id 
  AND s.section_id = @class_section_id
  AND s.status = 'active'
GROUP BY s.id, s.full_name, s.admission_number
ORDER BY s.full_name ASC;
