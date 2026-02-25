# Integrations and Add-ons Verification Audit

Date: 2026-02-25

Status: ⚠️ Partial implementation and verification complete (core payment gateway security, tenant add-ons, credits wallets, provider-capable OAuth/token refresh + live-class meeting creation paths, worker maintenance hooks). Full production verification with live provider credentials and full E2E coverage is not complete yet.

## Scope

Audited and implemented across:

- `services/api`
- `services/worker`
- `apps/web`
- `infra/migrations`
- tests/docs (partial)

## Current State Summary (B0)

### Already present before this pass (and verified)

- Payment gateway config storage and fee payment flow (`Razorpay`, `PayU`) in finance service and handler:
  - `services/api/internal/service/finance/payment.go`
  - `services/api/internal/service/finance/fees_advanced.go`
  - `services/api/internal/handler/finance/handler.go`
- Webhook logs table and finance webhook processing:
  - `infra/migrations/000079_webhook_hardening.up.sql`
  - `services/api/internal/db/query/fees.sql`
- Billing/add-ons base tables and tenant add-on support:
  - `services/api/internal/db/migrations/000064_billing_v2.up.sql`
  - `services/api/internal/service/tenant/service.go`
  - `services/api/internal/service/tenant/billing.go`
- Worker notification adapters (MSG91 SMS/WhatsApp support path):
  - `services/worker/internal/notification/msg91.go`
  - `services/worker/internal/notification/adapter.go`
- Audit logging framework:
  - `services/api/internal/foundation/audit/audit.go`
- Encryption utility (AES-GCM):
  - `services/api/internal/foundation/security/crypto.go`

### Added/extended in this implementation pass

- Add-ons/credits/integrations/live-classes data model extensions:
  - `infra/migrations/000080_integrations_addons_credits.up.sql`
  - `infra/migrations/000080_integrations_addons_credits.down.sql`
- New tenant/platform integrations + credits API service/handler (with public OAuth callback support):
  - `services/api/internal/service/integrationhub/service.go`
  - `services/api/internal/service/integrationhub/providers.go`
  - `services/api/internal/handler/integrationhub/handler.go`
- API route wiring:
  - `services/api/cmd/api/main.go`
- Worker monthly included credits + token refresh hooks:
  - `services/worker/internal/service/billing.go`
  - `services/worker/cmd/worker/main.go`
- Tenant webhook security hardening for payments:
  - `POST /v1/payments/webhook/{provider}`
  - `ResolveWebhookTenant(...)` and public webhook handler
- Tenant admin payment settings alias endpoints and webhook/test status:
  - `GET/PUT /v1/admin/settings/payments/gateways`
  - `POST /v1/admin/settings/payments/gateways/test`
  - `GET /v1/admin/settings/payments/gateways/webhook-status`
- Web pages:
  - `apps/web/src/app/(admin)/admin/settings/payments/page.tsx`
  - `apps/web/src/app/(admin)/admin/settings/integrations/page.tsx`
  - `apps/web/src/app/(admin)/admin/billing/credits/page.tsx`
  - `apps/web/src/app/(teacher)/teacher/live-classes/page.tsx`
  - `apps/web/src/app/(parent)/parent/live-classes/page.tsx`
  - `apps/web/src/app/(student)/student/live-classes/page.tsx`

### Missing or inconsistent (important)

- Google/Microsoft OAuth and calendar APIs are mock implementations (not production provider API integrations).
- OAuth callback route is currently admin-auth route shape, not a public provider callback endpoint.
- Add-on catalog platform CRUD API/UI is not fully implemented in the new `integrationhub` handler.
- Credits top-up creates an approval request only (manual/platform invoice flow), not a direct provider checkout.
- Full Go + Playwright QA matrix required by the spec is not complete.

## Integrations Catalog (final, code-discovered)

### Payments

- Razorpay
  - Type: payment
  - Tenant configurable: yes
  - Secrets: `api_key`, `api_secret`, `webhook_secret`
  - Webhook: yes
  - Worker required: no (webhook processed in API)
  - Evidence:
    - `services/api/internal/service/finance/payment.go`
    - `services/api/internal/service/finance/fees_advanced.go`
    - `apps/web/src/app/(admin)/admin/billing/settings/page.tsx`

- PayU
  - Type: payment
  - Tenant configurable: yes
  - Secrets: `api_key` (merchant key), `api_secret` (merchant salt), `webhook_secret`
  - Webhook: yes
  - Worker required: no
  - Evidence:
    - `services/api/internal/service/finance/payment.go`
    - `services/api/internal/service/finance/payment_test.go`
    - `apps/web/src/app/(admin)/admin/billing/settings/page.tsx`

### Education productivity / live classes

- Google Workspace for Education (`google_workspace`)
  - Type: productivity/integration (calendar/meet)
  - Tenant configurable: yes (OAuth connect flow)
  - Secrets: encrypted access token, refresh token
  - Webhook: no (current implementation)
  - Worker required: yes (real token refresh path when provider credentials configured; mock fallback supported)
  - Evidence:
    - `services/api/internal/service/integrationhub/service.go`
    - `services/api/internal/handler/integrationhub/handler.go`
    - `apps/web/src/app/(admin)/admin/settings/integrations/page.tsx`
    - `apps/web/src/app/(teacher)/teacher/live-classes/page.tsx`
    - `services/worker/internal/service/billing.go`

- Microsoft 365 Education (`microsoft_365`)
  - Type: productivity/integration (Graph calendar/Teams meetings)
  - Tenant configurable: yes (OAuth connect flow)
  - Secrets: encrypted access token, refresh token
  - Webhook: no (current implementation)
  - Worker required: yes (real token refresh path when provider credentials configured; mock fallback supported)
  - Evidence:
    - same files as Google above

### Messaging providers (code-discovered, partial verification)

- MSG91 (SMS and WhatsApp via worker adapters)
  - Type: comms
  - Tenant configurable: partially inferred (worker adapter + openapi docs present; tenant UI config endpoint not fully verified in this audit)
  - Secrets: auth key / sender (adapter expects runtime config)
  - Webhook: delivery callback support not verified
  - Worker required: yes
  - Evidence:
    - `services/worker/internal/notification/msg91.go`
    - `services/worker/internal/notification/adapter.go`
    - `services/worker/internal/worker/consumer.go`

### CMS / content

- Directus (marketing/content infrastructure)
  - Type: CMS
  - Tenant configurable: no evidence of tenant runtime config in app/API
  - Webhook: not verified
  - Worker required: no evidence
  - Evidence:
    - `infra/docker-compose.yml`
    - `docs/13-cms-directus.md`

### Accounting / exports

- Tally export (CSV/XML-style finance export support)
  - Type: accounting/export
  - Tenant configurable: ledger mappings yes
  - Webhook: no
  - Worker required: no
  - Evidence:
    - `services/api/internal/service/finance/tally.go`
    - `services/api/internal/handler/finance/handler.go` (`/tally-export`)
    - `infra/migrations/000028_tally_integration.up.sql`
    - `apps/web/src/app/(admin)/admin/finance/page.tsx`

## Add-ons Catalog (final, code-discovered + modeled)

Source of truth:

- `platform_addons` (DB)
- `tenant_addons` (DB)
- `services/api/internal/service/tenant/addon_catalog.go`
- `services/api/internal/service/integrationhub/service.go`

Currently verified add-on codes in active use:

- `payments_pro` (expected catalog pattern; tenant payments gating path exists via plugins/add-ons, verify exact seeded code in DB)
- `live_classes_google`
  - Unlocks Google live classes scheduling
  - Monthly subscription
  - Entitlement enforcement:
    - `services/api/internal/service/integrationhub/service.go` (`ScheduleLiveClass`)
- `live_classes_microsoft`
  - Unlocks Microsoft live classes scheduling
  - Monthly subscription
  - Entitlement enforcement:
    - same as above
- `communications_sms` / alias compatibility with `notifications_sms`
  - Worker add-on check:
    - `services/worker/internal/worker/consumer.go`
- `communications_whatsapp` / alias compatibility with `notifications_whatsapp`
  - Worker add-on check:
    - `services/worker/internal/worker/consumer.go`

Credits-based categories modeled and enforced:

- `sms_credits`
- `whatsapp_credits`
- `email_credits`
- `ai_credits` (schema/UI present; enforcement not fully migrated in all flows)

## Credits Model and Enforcement Points

### Data model

- Wallet balances:
  - `tenant_credit_wallets`
- Ledger:
  - `tenant_credit_ledger`
- Idempotency:
  - unique `(tenant_id, wallet_type, reference_id)`

Migration:

- `infra/migrations/000080_integrations_addons_credits.up.sql`

### API enforcement

- `RequireCredits(...)`
- `applyCreditLedger(...)`

File:

- `services/api/internal/service/integrationhub/service.go`

### Worker enforcement (messaging sends)

- pre-check credit balance (new wallet system)
- idempotent debit by reference ID
- legacy wallet debit path retained for backward compatibility

Files:

- `services/worker/internal/worker/consumer.go`
- `services/worker/internal/service/billing.go`

### Monthly included credits

- Applied from `platform_addons.included_credits`
- Idempotent reference format:
  - `monthly_allowance:YYYY-MM:{tenant_id}:{wallet_type}:{addon_code}`

Files:

- `services/api/internal/service/integrationhub/service.go`
- `services/worker/internal/service/billing.go`
- `services/worker/cmd/worker/main.go`

## Security Controls Verification

### Secrets encryption at rest and masking

Verified:

- Payment gateway secrets encrypted at rest and masked on read:
  - `services/api/internal/service/finance/fees_advanced.go`
- OAuth tokens encrypted at rest in tenant integrations:
  - `services/api/internal/service/integrationhub/service.go` (`encryptMaybe`, `decryptMaybe`)
  - Worker decrypt/refresh support:
    - `services/worker/internal/service/billing.go`

Gaps:

- Messaging provider config secret masking/encryption not fully re-verified in API config endpoints in this pass.

### Webhook security (payments)

Verified:

- Signature verification in provider adapters:
  - `services/api/internal/service/finance/payment.go`
- Secure tenant resolution by signature across active configs:
  - `ResolveWebhookTenant(...)`
- Public webhook endpoint:
  - `POST /v1/payments/webhook/{provider}`
- Webhook logging:
  - `webhook_logs` + indexes (`000079`, `000080`)

Tests:

- `services/api/internal/service/finance/payment_test.go`
  - `TestResolveWebhookTenantFromCandidatesRazorpay`
  - `TestResolveWebhookTenantFromCandidatesRejectsInvalidSignature`

### Audit logging

Verified:

- Payment gateway config changes audit logged:
  - `services/api/internal/service/finance/fees_advanced.go`
- Add-on activate/request/cancel, credit top-up request/adjust, integration connect/disconnect, live class schedule now audit logged:
  - `services/api/internal/service/integrationhub/service.go`

## Routes and UI Evidence

### API routes (new/verified)

- Payment gateway admin settings:
  - `GET /v1/admin/settings/payments/gateways`
  - `PUT /v1/admin/settings/payments/gateways`
  - `POST /v1/admin/settings/payments/gateways/test`
  - `GET /v1/admin/settings/payments/gateways/webhook-status`
- Payment webhooks:
  - `POST /v1/payments/webhook/{provider}`
- Billing add-ons:
  - `GET /v1/admin/billing/addons`
  - `POST /v1/admin/billing/addons/{code}/activate`
  - `POST /v1/admin/billing/addons/{code}/cancel`
- Credits:
  - `GET /v1/admin/billing/credits/balance`
  - `GET /v1/admin/billing/credits/ledger`
  - `POST /v1/admin/billing/credits/topup`
  - `POST /v1/admin/platform/billing/credits/adjust`
- Platform add-on catalog (new):
  - `GET /v1/admin/platform/billing/addons/catalog`
  - `POST /v1/admin/platform/billing/addons/catalog`
  - `PUT /v1/admin/platform/billing/addons/catalog/{code}`
- Integrations:
  - `GET /v1/admin/settings/integrations/`
  - `POST /v1/admin/settings/integrations/{provider}/connect`
  - `GET /v1/admin/settings/integrations/{provider}/callback`
  - `GET /v1/integrations/oauth/{provider}/callback` (public provider callback; tenant resolved by stored oauth state)
  - `POST /v1/admin/settings/integrations/{provider}/disconnect`
- Live classes:
  - `POST /v1/teacher/live-classes/schedule`
  - `GET /v1/teacher/live-classes/list`
  - `GET /v1/parent/live-classes/list`
  - `GET /v1/student/live-classes/list`

Route implementation files:

- `services/api/internal/handler/finance/handler.go`
- `services/api/internal/handler/integrationhub/handler.go`
- `services/api/cmd/api/main.go`

### Web UI pages

- Admin payments:
  - `apps/web/src/app/(admin)/admin/billing/settings/page.tsx`
  - `apps/web/src/app/(admin)/admin/settings/payments/page.tsx`
- Admin integrations:
  - `apps/web/src/app/(admin)/admin/settings/integrations/page.tsx`
- Admin credits:
  - `apps/web/src/app/(admin)/admin/billing/credits/page.tsx`
- Admin add-ons explicit route alias:
  - `apps/web/src/app/(admin)/admin/billing/addons/page.tsx`
- Teacher live classes:
  - `apps/web/src/app/(teacher)/teacher/live-classes/page.tsx`
- Parent/student live classes:
  - `apps/web/src/app/(parent)/parent/live-classes/page.tsx`
  - `apps/web/src/app/(student)/student/live-classes/page.tsx`

## Tests Added and Run

### Added

- `services/api/internal/service/integrationhub/service_test.go`
  - provider normalization
  - meeting URL generation
  - encryption/decryption helper round-trip
  - credit map parsing helper
  - wrapped Postgres duplicate error detection helper
  - provider auth URL / callback URL helper coverage
- `services/worker/internal/service/billing_test.go`
  - worker token encryption/decryption helper
  - worker OAuth provider config helper

### Existing/extended finance tests used as evidence

- `services/api/internal/service/finance/payment_test.go`
  - webhook signature and tenant-resolution hardening tests

### Commands run

- `go test ./internal/service/integrationhub ./internal/service/finance -run 'Test(...)'` (from `services/api`) ✅
- `go build ./cmd/api` (from `services/api`) ✅
- `go build ./cmd/worker` (from `services/worker`) ✅ (previous pass)
- `pnpm --filter @schoolerp/web build` ✅ (previous pass)

### QA gaps

- Playwright E2E matrix for add-ons, credits, payments webhook-status, mocked OAuth/live-class scheduling, and RBAC negative tests is not yet implemented in this audit.

## Remaining Gaps (prioritized)

### P0 (security / correctness / money)

- Credits reserve/commit lifecycle is not implemented; current path performs idempotent debit after send (better than nothing, but not full reservation semantics).
- Live provider OAuth/calendar flows are code-implemented but not yet verified in staging/prod with real credentials and provider callbacks.

### P1 (operational)

- Platform add-on catalog CRUD endpoints/UI for `status`, `requires_approval`, `features_unlocked`, `included_credits` are incomplete in the new integration module.
- PayU “test connection” endpoint currently performs validation fallback, not live provider auth probe.
- Messaging provider config secret masking/encryption verification across API config endpoints needs dedicated audit.

### P2 (polish / completeness)

- Full docs parity in marketing pages for add-ons/credits/integrations claims not audited.
- Comprehensive observability metrics (beyond logs/audit/webhook logs) not added for all new flows.
- Retention period configurability for webhook logs cleanup remains hardcoded (`90 days` in worker).

## Acceptance Criteria Snapshot (current)

- Tenant payment gateway credentials are encrypted at rest and masked on read: ✅
- Public per-provider payment webhook endpoint with signature-based tenant resolution: ✅
- Webhook log retention cleanup job exists: ✅
- Tenant add-ons and credit wallets/ledger schema + APIs exist: ✅
- Credit debits idempotent by unique reference ID: ✅
- Google/Microsoft live class scheduling with add-on gating and encrypted tokens: ✅ (provider-capable code paths implemented, mock mode still supported)
- Public OAuth callback route with server-side state resolution: ✅
- Full production-grade OAuth/calendar integrations: ⚠️ implemented in code but not environment-verified in this audit
- Full test matrix (Go + Playwright) from spec: ⚠️ partial

## How to run verification locally

API:

- `cd services/api && go test ./internal/service/integrationhub ./internal/service/finance`
- `cd services/api && go build ./cmd/api`

Worker:

- `cd services/worker && go build ./cmd/worker`

Web:

- `pnpm --filter @schoolerp/web build`

## Credential setup checklist (operator handoff)

- `docs/credentials-checklist-integrations-and-payments.md`
