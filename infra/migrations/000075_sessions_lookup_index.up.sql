-- Speed up auth session validation lookups:
-- SELECT EXISTS(SELECT 1 FROM sessions WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW())
CREATE INDEX IF NOT EXISTS idx_sessions_user_token_expires
    ON sessions (user_id, token_hash, expires_at DESC);

