-- 000014_notice_updates.up.sql

ALTER TABLE notices ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
