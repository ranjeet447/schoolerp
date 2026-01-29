-- 000012_attendance_updates.up.sql

ALTER TABLE attendance_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE attendance_entries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
