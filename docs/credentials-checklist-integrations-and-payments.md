# Credentials Checklist (Fill Later)

Use this checklist when you are ready to enable live providers in staging/production.

## Core platform secrets (required)

- `TENANT_ENCRYPTION_KEY`
  - 32-byte key used to encrypt tenant payment and OAuth secrets at rest.
- `JWT_SECRET`
  - Used by auth/session flows (also fallback source for encryption in dev if encryption key missing).
- `PUBLIC_API_BASE_URL` (recommended) or `API_BASE_URL`
  - Public API URL used to build OAuth callback URLs (e.g. `https://api.schoolerp.example`).
- `PUBLIC_APP_BASE_URL` (optional but recommended for UI/docs links)
  - Public web app URL (e.g. `https://app.schoolerp.example`).

## Google Workspace for Education (OAuth + Calendar/Meet)

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI` (optional override)
  - If set, must point to:
  - `https://<api-domain>/v1/integrations/oauth/google_workspace/callback`

Google Cloud Console setup notes:

- Enable Google Calendar API
- Configure OAuth consent screen
- Add authorized redirect URI matching the callback above
- Request scopes:
  - `https://www.googleapis.com/auth/calendar`
  - `openid`
  - `email`
  - `profile`

## Microsoft 365 / Microsoft 365 Education (OAuth + Graph/Teams)

- `MICROSOFT_OAUTH_CLIENT_ID`
- `MICROSOFT_OAUTH_CLIENT_SECRET`
- `MICROSOFT_OAUTH_TENANT_ID` (optional; defaults to `common`)
- `MICROSOFT_OAUTH_REDIRECT_URI` (optional override)
  - If set, must point to:
  - `https://<api-domain>/v1/integrations/oauth/microsoft_365/callback`

Microsoft Entra App setup notes:

- Add redirect URI matching the callback above
- API permissions (delegated):
  - `Calendars.ReadWrite`
  - `User.Read`
  - `offline_access`
  - `openid`
  - `email`
  - `profile`
- Grant admin consent as required for the tenant

## Local/dev toggle (optional)

- `INTEGRATIONS_MOCK_OAUTH=1`
  - Keeps OAuth and live-class provider flows in mock mode for local/dev testing.

## Tenant-entered payment gateway credentials (NOT platform env vars)

These are entered by each school in the UI (`/admin/settings/payments`) and stored encrypted:

- Razorpay:
  - `key_id`
  - `key_secret`
  - `webhook_secret`
- PayU:
  - `merchant_key`
  - `merchant_salt`
  - `webhook_secret`

Tenant webhook endpoint to configure in provider dashboards:

- `POST https://<api-domain>/v1/payments/webhook/razorpay`
- `POST https://<api-domain>/v1/payments/webhook/payu`

## Optional operations / infra

- `SENTRY_DSN` (error monitoring)
- `DATABASE_URL`
- `REDIS_URL`

## Go-live verification checklist

- OAuth connect for Google succeeds and shows `connected` on `/admin/settings/integrations`
- OAuth connect for Microsoft succeeds and shows `connected`
- Teacher schedules live class and receives real Meet/Teams link
- Parent/student pages show the meeting link
- Payment webhook status updates after provider test webhook
- Secrets remain masked on all read APIs/UI screens

