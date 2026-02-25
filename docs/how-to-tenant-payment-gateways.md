# How Tenant Admins Configure Razorpay / PayU

## Scope

Tenant-owned payment gateway configuration for fee collections.

Supported providers in current implementation:

- Razorpay
- PayU

## UI Path

- `apps/web`: `Admin -> Settings -> Payments`
- Route: `/admin/settings/payments`
- Alias route: `/admin/billing/settings`

## What the tenant enters

- Razorpay:
  - `key_id`
  - `key_secret`
  - `webhook_secret`
- PayU:
  - `merchant_key` (stored in `api_key`)
  - `merchant_salt` (stored in `api_secret`)
  - `webhook_secret`

## API Endpoints (tenant-scoped)

- `GET /v1/admin/settings/payments/gateways?provider={razorpay|payu}`
- `PUT /v1/admin/settings/payments/gateways`
- `POST /v1/admin/settings/payments/gateways/test`
- `GET /v1/admin/settings/payments/gateways/webhook-status?provider={razorpay|payu}`

Implementation:

- `services/api/internal/handler/finance/handler.go`
- `services/api/internal/service/finance/fees_advanced.go`

## Security behavior

- Secrets are encrypted at rest before DB write (`enc:<hex>` AES-GCM):
  - `services/api/internal/service/finance/fees_advanced.go`
- Secrets are masked on read (admin UI receives masked values):
  - `GetGatewayConfigForAdmin(...)`
- Partial updates preserve existing encrypted secrets when UI keeps masked placeholders:
  - `UpsertGatewayConfig(...)`
- Config changes are audit logged:
  - `AuditGatewayConfigChange(...)`

## Webhook setup (tenant action in provider dashboard)

Use the platform webhook endpoint and paste the tenant's `webhook_secret` in the provider dashboard:

- Public webhook endpoint: `POST /v1/payments/webhook/{provider}`
- Implemented in: `services/api/internal/handler/finance/handler.go` (`HandleWebhookPublicByProvider`)

Notes:

- Tenant is resolved server-side by signature verification over candidate active configs.
- Do not rely on `tenant_id` query params for webhook routing.

## Verification checklist

- Save config returns masked secrets on subsequent reads.
- Test connection succeeds (Razorpay does live auth check).
- Webhook status page shows `last_received_at` after a successful provider callback.

