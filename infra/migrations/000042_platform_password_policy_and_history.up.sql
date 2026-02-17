-- 000042_platform_password_policy_and_history.up.sql

-- Track when a password credential was last updated (used for expiry policy).
ALTER TABLE user_identities
    ADD COLUMN IF NOT EXISTS credential_updated_at TIMESTAMPTZ;

ALTER TABLE user_identities
    ALTER COLUMN credential_updated_at SET DEFAULT NOW();

UPDATE user_identities
SET credential_updated_at = COALESCE(credential_updated_at, created_at, NOW())
WHERE credential_updated_at IS NULL;

-- Password history table to prevent credential reuse (policy-driven).
CREATE TABLE IF NOT EXISTS user_credential_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- "password"
    credential_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, provider, credential_hash)
);

CREATE INDEX IF NOT EXISTS idx_user_credential_history_user_provider_created
    ON user_credential_history(user_id, provider, created_at DESC);

-- Backfill existing password identities into history (idempotent).
INSERT INTO user_credential_history (user_id, provider, credential_hash, created_at)
SELECT
    ui.user_id,
    ui.provider,
    ui.credential,
    COALESCE(ui.credential_updated_at, ui.created_at, NOW())
FROM user_identities ui
WHERE ui.provider = 'password'
  AND ui.credential IS NOT NULL
ON CONFLICT (user_id, provider, credential_hash) DO NOTHING;

