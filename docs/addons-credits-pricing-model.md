# Add-ons and Credits Pricing Model

## Model Summary

- Add-ons are monthly subscriptions per tenant.
- Messaging and AI usage are credit-based.
- Monthly subscription can include bundled credits.
- Additional top-ups are required to continue usage after bundled credits are exhausted.

## Add-on catalog fields (current schema)

`platform_addons` supports:

- `code`
- `name`
- `price_paise` (existing price field)
- `status` (`active` / `inactive` / `hidden`)
- `requires_approval`
- `features_unlocked` (JSON array)
- `integration_unlocked` (text)
- `included_credits` (JSON object, e.g. `{"sms_credits":2000}`)

Schema extension migration:

- `infra/migrations/000080_integrations_addons_credits.up.sql`

## Tenant add-on state (current schema)

`tenant_addons` supports:

- `status`
- `start_at`
- `end_at`
- `renew_at`
- `billing_source`
- `metadata`

## Credits model (current schema)

- Balances: `tenant_credit_wallets (tenant_id, wallet_type, balance)`
- Ledger: `tenant_credit_ledger (...)`
- Idempotency: unique `(tenant_id, wallet_type, reference_id)`

Wallet types currently used:

- `sms_credits`
- `whatsapp_credits`
- `email_credits`
- `ai_credits` (available in schema/UI; not fully enforced in all AI flows yet)

## Enforcement points

API:

- `services/api/internal/service/integrationhub/service.go` (`RequireCredits`, `applyCreditLedger`)

Worker (messaging sends):

- `services/worker/internal/worker/consumer.go`
- `services/worker/internal/service/billing.go`

Monthly included credit grant:

- `ApplyMonthlyIncludedCredits(...)` in:
  - `services/api/internal/service/integrationhub/service.go`
  - `services/worker/internal/service/billing.go`

## Operational rule

Sending is blocked when:

- required add-on is not active
- or credit balance is insufficient

Current implementation note:

- SMS/WhatsApp worker path enforces balance checks and idempotent debits on `tenant_credit_wallets`, and also retains legacy wallet debit flow for backward compatibility.

