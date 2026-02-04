-- 000009_guardian_user_link.up.sql

ALTER TABLE guardians ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_guardians_user_id ON guardians(user_id);
