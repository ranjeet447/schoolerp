ALTER TABLE lesson_plans DROP COLUMN IF NOT EXISTS review_status;
ALTER TABLE lesson_plans DROP COLUMN IF NOT EXISTS review_remarks;
DROP INDEX IF EXISTS idx_ptm_slots_start;
DROP INDEX IF EXISTS idx_ptm_events_date;
