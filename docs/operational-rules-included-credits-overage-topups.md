# Operational Rules: Included Credits, Overage, and Top-ups

## Included credits

- Included credits come from active tenant add-ons (`platform_addons.included_credits`).
- They are granted monthly to per-category credit wallets.
- Granting is idempotent using reference format:
  - `monthly_allowance:YYYY-MM:{tenant_id}:{wallet_type}:{addon_code}`

Worker implementation:

- `services/worker/internal/service/billing.go` (`ApplyMonthlyIncludedCredits`)
- scheduled from `services/worker/cmd/worker/main.go`

## Overage protection

Sending must stop when credits are insufficient.

Current enforcement:

- Worker checks `tenant_credit_wallets` balance before SMS/WhatsApp sends.
- Debits are idempotent per message reference.

Files:

- `services/worker/internal/worker/consumer.go`
- `services/worker/internal/service/billing.go`

## Top-up requests

Tenant admins request top-ups from:

- `/admin/billing/credits`

Current API behavior:

- `POST /v1/admin/billing/credits/topup`
- Creates a pending approval record (`platform_action_approvals`) for manual processing / platform invoicing

Implementation:

- `services/api/internal/handler/integrationhub/handler.go`
- `services/api/internal/service/integrationhub/service.go`

## Finance/support credit adjustments

Platform/support can apply manual adjustments:

- `POST /v1/admin/platform/billing/credits/adjust`

Requirements enforced:

- `tenant_id`, `wallet_type`, `reference_id`, non-zero `amount`
- idempotent ledger write
- audit log on successful adjustment

