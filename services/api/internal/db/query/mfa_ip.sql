-- name: UpsertMFASecret :exec
INSERT INTO mfa_secrets (user_id, secret, enabled, backup_codes)
VALUES (@user_id, @secret, @enabled, @backup_codes)
ON CONFLICT (user_id) DO UPDATE
SET secret = EXCLUDED.secret,
    enabled = EXCLUDED.enabled,
    backup_codes = EXCLUDED.backup_codes,
    updated_at = NOW();

-- name: GetMFASecret :one
SELECT * FROM mfa_secrets WHERE user_id = @user_id;

-- name: SetMFAEnabled :exec
UPDATE mfa_secrets SET enabled = @enabled, updated_at = NOW() WHERE user_id = @user_id;

-- name: CreateIPAllowlist :one
INSERT INTO ip_allowlists (tenant_id, role_name, cidr_block, description, created_by)
VALUES (@tenant_id, @role_name, @cidr_block, @description, @created_by)
RETURNING *;

-- name: ListIPAllowlists :many
SELECT * FROM ip_allowlists WHERE tenant_id = @tenant_id;

-- name: DeleteIPAllowlist :exec
DELETE FROM ip_allowlists WHERE id = @id AND tenant_id = @tenant_id;

-- name: CheckIPAllowlist :one
SELECT EXISTS(
    SELECT 1 FROM ip_allowlists
    WHERE tenant_id = @tenant_id
      AND role_name = @role_name
      AND cidr_block >>= @ip::inet
);
