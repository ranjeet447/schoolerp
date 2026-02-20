# 26 - Session Store & Data Loading Standards

## Purpose
This document defines the required pattern for:
- JWT auth session validation on hot paths.
- Session lifecycle writes/revokes across platform features.
- Frontend data loading strategy for management screens.

These standards are mandatory for all new features.

## Auth Session Model

### Core Rules
1. JWT signature verification remains mandatory on every request.
2. Session allowlist lookup must use Redis hot-path keys, not Postgres queries per request.
3. Postgres remains source-of-truth/audit store for session records.
4. Middleware may use Postgres as fallback only when Redis misses or is unavailable.

### Redis Key Contract
- Session key: `session:{user_id}:{jti_hash}`
- User index key: `session_index:{user_id}`

`jti_hash` is the same SHA-256 token hash persisted in `sessions.token_hash`.

### Lifecycle
- Login/token mint:
  - Write row to `sessions` (Postgres).
  - Write Redis key `session:{user_id}:{jti_hash}` with TTL = token expiry.
  - Add `jti_hash` to `session_index:{user_id}`.
- Middleware request:
  - Verify JWT signature.
  - Compute `jti_hash`.
  - Check Redis session key.
  - If Redis miss/error: fallback `SELECT EXISTS(...)` in Postgres.
  - On DB fallback hit: backfill Redis key.
- Logout/revoke/block/password reset/deactivate:
  - Delete session rows in Postgres.
  - Delete corresponding Redis session keys and user index entries.

## Backend Implementation Standard

### Required Touchpoints
Any feature that creates or invalidates login sessions must integrate with the shared session store:
- Auth service login/token issue.
- Platform user session revoke endpoints.
- Force logout (tenant-wide or user-wide).
- Security block flows.
- Password reset/deactivate flows.
- Impersonation token creation and revocation.

### Error Handling Policy
- Session creation must fail if Postgres write fails.
- Session cache write failure should be logged with context.
- Session revoke paths must attempt Redis invalidation for the same session refs that are removed from Postgres.

## Frontend Data Loading Standard

### Rules
1. Do not preload unrelated datasets for all tabs on initial render.
2. Load data per active route/tab/section.
3. Keep tab URL state canonical (`?tab=...`) for deep-linking and reload stability.
4. For pages that truly need multiple independent datasets at once, expose a composed backend endpoint instead of fanning out many frontend requests.

### Practical Guidance
- Good:
  - `overview` tab loads overview API only.
  - `invoices` tab loads invoice/payment APIs.
  - `config` tab loads config API only.
- Avoid:
  - `Promise.all` across every dashboard endpoint regardless of visible tab.

## Environment Variables
- `REDIS_URL`: required in production for session hot-path caching.
- `DATABASE_URL`: required for source-of-truth and fallback checks.

## Operational Notes
- Repeated `auth session validation failed: session store unavailable` indicates Redis or fallback store pressure.
- Keep database pool sizing and request fan-out aligned with traffic.
- Treat session-store errors as availability/security signals, not as normal auth failures.
