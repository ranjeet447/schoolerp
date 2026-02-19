-- name: CreatePTMEvent :one
INSERT INTO ptm_events (
    tenant_id, title, description, event_date, start_time, end_time, slot_duration_minutes, teacher_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;

-- name: ListPTMEvents :many
SELECT 
    pe.*,
    u.full_name as teacher_name
FROM ptm_events pe
JOIN users u ON pe.teacher_id = u.id
WHERE pe.tenant_id = $1
ORDER BY pe.event_date DESC, pe.start_time DESC;

-- name: CreatePTMSlot :one
INSERT INTO ptm_slots (
    event_id, start_time, end_time, status
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetPTMSlots :many
SELECT 
    ps.*,
    s.full_name as student_name
FROM ptm_slots ps
LEFT JOIN students s ON ps.student_id = s.id
WHERE ps.event_id = $1
ORDER BY ps.start_time ASC;

-- name: BookPTMSlot :one
UPDATE ptm_slots
SET 
    student_id = $3,
    status = 'booked',
    booking_remarks = $4,
    booked_at = NOW(),
    updated_at = NOW()
WHERE id = $1 AND event_id = $2 AND status = 'available'
RETURNING *;

-- name: CreateChatRoom :one
INSERT INTO chat_rooms (
    tenant_id, student_id, title
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: AddChatParticipant :exec
INSERT INTO chat_participants (
    room_id, user_id, role
) VALUES (
    $1, $2, $3
);

-- name: CreateChatMessage :one
INSERT INTO chat_messages (
    room_id, sender_id, message, is_moderated, moderation_reason
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetChatHistory :many
SELECT 
    cm.*,
    u.full_name as sender_name
FROM chat_messages cm
JOIN users u ON cm.sender_id = u.id
WHERE cm.room_id = $1
ORDER BY cm.created_at ASC
LIMIT $2 OFFSET $3;

-- name: GetPTMSlotsStartingSoon :many
SELECT 
    ps.*, 
    pe.title as event_title,
    s.full_name as student_name,
    s.id as student_id,
    pe.tenant_id
FROM ptm_slots ps
JOIN ptm_events pe ON ps.event_id = pe.id
JOIN students s ON ps.student_id = s.id
WHERE ps.status = 'booked'
AND (pe.event_date + ps.start_time) BETWEEN NOW() AND NOW() + INTERVAL '30 minutes';

-- name: GetChatModerationSettings :one
SELECT * FROM chat_moderation_settings WHERE tenant_id = $1;

-- name: UpsertChatModerationSettings :one
INSERT INTO chat_moderation_settings (
    tenant_id, quiet_hours_start, quiet_hours_end, blocked_keywords, is_enabled
) VALUES (
    $1, $2, $3, $4, $5
) ON CONFLICT (tenant_id) DO UPDATE SET
    quiet_hours_start = EXCLUDED.quiet_hours_start,
    quiet_hours_end = EXCLUDED.quiet_hours_end,
    blocked_keywords = EXCLUDED.blocked_keywords,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = NOW()
RETURNING *;

-- name: ListStudentChatRooms :many
SELECT 
    cr.*,
    s.full_name as student_name
FROM chat_rooms cr
JOIN students s ON cr.student_id = s.id
JOIN chat_participants cp ON cr.id = cp.room_id
WHERE cp.user_id = $1 AND cr.tenant_id = $2;

-- name: GetPTMSlotsForReminders :many
SELECT 
    ps.id as slot_id,
    pe.id as event_id,
    pe.tenant_id,
    pe.title as event_title,
    ps.start_time,
    pe.event_date,
    s.id as student_id,
    s.full_name as student_name,
    g.phone as guardian_phone
FROM ptm_slots ps
JOIN ptm_events pe ON ps.event_id = pe.id
JOIN students s ON ps.student_id = s.id
JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = true
JOIN guardians g ON sg.guardian_id = g.id
WHERE ps.status = 'booked'
AND (pe.event_date + ps.start_time) BETWEEN @start_window::TIMESTAMPTZ AND @end_window::TIMESTAMPTZ
AND NOT EXISTS (
    SELECT 1 FROM ptm_reminder_logs prl
    WHERE prl.slot_id = ps.id AND prl.reminder_type = @reminder_type
);

-- name: LogPTMReminder :one
INSERT INTO ptm_reminder_logs (tenant_id, slot_id, student_id, reminder_type)
VALUES ($1, $2, $3, $4)
RETURNING *;
