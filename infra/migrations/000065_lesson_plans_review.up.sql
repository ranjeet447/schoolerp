-- Add review fields to lesson plans
ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS review_remarks TEXT;

-- Update Chat Rooms for easier querying
CREATE INDEX IF NOT EXISTS idx_ptm_slots_start ON ptm_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_ptm_events_date ON ptm_events(event_date);
