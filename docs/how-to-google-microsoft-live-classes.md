# How to Connect Google Workspace / Microsoft 365 for Live Classes

## UI Path

- `Admin -> Settings -> Integrations`
- Route: `/admin/settings/integrations`

Related teacher page:

- `Teacher -> Live Classes`
- Route: `/teacher/live-classes`

## Current flow (implemented)

- Tenant admin clicks `Connect` on Google Workspace or Microsoft 365 card.
- Backend starts OAuth connect flow and stores a tenant/provider OAuth state.
- Provider redirects to a public callback route (no admin password/session required for the provider).
- Callback exchanges auth code for tokens (real OAuth when provider credentials are configured; mock mode in local/dev if enabled).
- Encrypted access + refresh tokens are stored tenant-scoped.
- Teacher can schedule a live class after:
  - integration is connected
  - matching add-on is active (`live_classes_google` or `live_classes_microsoft`)

Routes:

- `GET /v1/admin/settings/integrations/`
- `POST /v1/admin/settings/integrations/{provider}/connect`
- `GET /v1/admin/settings/integrations/{provider}/callback`
- `GET /v1/integrations/oauth/{provider}/callback` (public provider callback)
- `POST /v1/admin/settings/integrations/{provider}/disconnect`
- `POST /v1/teacher/live-classes/schedule`
- `GET /v1/teacher/live-classes/list`
- `GET /v1/parent/live-classes/list`
- `GET /v1/student/live-classes/list`

Implementation:

- `services/api/internal/handler/integrationhub/handler.go`
- `services/api/internal/service/integrationhub/service.go`
- `services/worker/internal/service/billing.go` (token refresh loop support)
- `services/worker/cmd/worker/main.go` (maintenance hook)

## Security behavior

- No tenant passwords are stored.
- Access/refresh tokens are encrypted at rest (`enc:<hex>` AES-GCM).
- OAuth callback tenant resolution is performed server-side using stored `oauth_state`.
- Integration connect/disconnect actions are audit logged.
- Add-on entitlement is enforced server-side in scheduling endpoint.

## Current limitations (must be known by operators)

- Real OAuth/token refresh and provider event creation paths are implemented, but production verification depends on configuring provider credentials:
  - `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
  - `MICROSOFT_OAUTH_CLIENT_ID`, `MICROSOFT_OAUTH_CLIENT_SECRET` (optional `MICROSOFT_OAUTH_TENANT_ID`)
- Mock mode is still supported for local/dev via `INTEGRATIONS_MOCK_OAUTH=1`.
- Provider API calls are not fully covered by unit/integration tests in this repo yet (network calls are mocked in UI tests).

## Expected production evolution

- Expand automated tests for provider callback, token refresh failure paths, and meeting payload mapping.
- Mark integration `needs_reauth` when provider refresh fails or consent is revoked.
