-- 000050_phase1_enhancements.down.sql

DROP TABLE IF EXISTS import_jobs;
DROP TABLE IF EXISTS school_profiles;
DROP TABLE IF EXISTS period_attendance_entries;
DROP TABLE IF EXISTS period_attendance_sessions;
DROP TABLE IF EXISTS staff_attendance_entries;
DROP TABLE IF EXISTS staff_attendance_sessions;
ALTER TABLE students DROP COLUMN IF EXISTS house_id;
DROP TABLE IF EXISTS student_houses;
DROP TABLE IF EXISTS custom_field_values;
DROP TABLE IF EXISTS custom_field_definitions;
