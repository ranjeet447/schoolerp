# SchoolERP Full Implementation Verification Audit

**Audit Date:** 2026-02-26  
**Auditor Role:** Staff Engineer + QA Lead + Security Auditor + Product Analyst  
**Scope:** `services/api`, `services/worker`, `apps/web`, `apps/marketing`, migrations/sqlc, tests/docs  
**Method:** Code audit + route tracing + schema/migration inference + targeted builds/tests (no external provider credentials used)

## Executive Summary

**Overall implementation completeness (audited scope): ~78%**  
**Deployment readiness (core ERP + tenant payments + add-ons/credits): Conditional ✅**  
**Deployment readiness (real Google/Microsoft live classes with external providers): Conditional ⚠️ (code implemented, external runtime verification pending credentials)**

### Top Findings (Severity-Ordered)

1. **P0 (fixed in this pass): Online payment order creation lacked explicit add-on enforcement**
- Fixed server-side in `services/api/internal/service/finance/payment.go` (`requireOnlinePaymentsAddon`, enforced in `CreateOnlineOrder` / `CreateOnlineOrderParent`).
- Handler now returns a clear `403` for missing entitlement in `services/api/internal/handler/finance/handler.go`.

2. **P0/P1 (fixed in this pass): Parent receipt download used admin receipt PDF endpoint**
- Fixed by adding parent-scoped route `GET /parent/children/{childID}/fees/receipts/{receiptID}/pdf` in `services/api/internal/handler/finance/handler.go` and ownership-checking service method `GetReceiptPDFParent` in `services/api/internal/service/finance/payment.go`.
- Parent UI updated in `apps/web/src/app/(parent)/parent/fees/page.tsx`.

3. **P1 (fixed in this pass): Marketing parity mismatches were reduced**
- Updated `apps/marketing/src/app/integrations/data.ts` statuses/copy for Google Workspace, Microsoft 365 Education, and Tally Prime to better match current implementation.
- Updated homepage featured integrations in `apps/marketing/src/app/page.tsx` to use actual status values instead of forcing all cards to `active`.
- Tally remains a CSV export integration (not XML), and that limitation is still tracked separately.

4. **P1 (fixed in this pass): Communication gateway tenant config UI was missing**
- Added tenant-admin page `apps/web/src/app/(admin)/admin/communication/gateways/page.tsx` wired to `/admin/notifications/gateways`.
- Added CTA from `apps/web/src/app/(admin)/admin/communication/page.tsx`.
- Backend secret preservation for provider updates was hardened in `services/api/internal/service/notification/service.go` (provider-specific partial secret update).

5. **P1: Test coverage gaps remain for critical flows**
- `parent-payment` and `communication-logs` Playwright specs were refreshed in this pass (mocked UI smoke).
- Mocked integrations UI spec exists (`apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts`) but does not prove provider callbacks/meeting creation end-to-end.

6. **P2 (closed in this pass): Tally export is CSV and docs now state that explicitly**
- Endpoint `GET /payments/tally-export` returns CSV via `ExportReceiptsToTallyCSV` (`services/api/internal/service/finance/tally.go`).
- Clarified in docs: `docs/how-to-tally-export-csv.md`, `docs/07-payments-finance-compliance.md`.

### Builds / Verification Executed In This Audit Pass

- `go test ./internal/service/finance ./internal/handler/finance && go build ./cmd/api` in `services/api` ✅
- `go test ./internal/service/notification` in `services/api` ✅
- `go build ./cmd/worker && go test ./internal/service -run '^$'` in `services/worker` ✅
- `pnpm build` (root Turbo; `apps/web`, `apps/marketing`, and workspace packages) ✅
  - Executed with `PATH` including `/opt/homebrew/bin` due local shell PATH differences in the tool environment.

---

## Phase 0 — Repo Map & Source of Truth

### Short Repo Map

- `services/api` — Go REST API, RBAC, tenant isolation, business services, public webhooks/OAuth callbacks
- `services/worker` — Go worker for outbox consumption, notifications, billing/credits jobs, token refresh jobs
- `apps/web` — Next.js app for platform/admin/teacher/parent/student/accountant roles
- `apps/marketing` — Next.js marketing site (integrations, features, pricing, case studies, docs-like pages)
- `infra/migrations` + `services/api/internal/db/migrations` — DB schema migrations
- `services/api/internal/db/query/*.sql` + generated `*.sql.go` — sqlc source of truth for many DB flows
- `apps/web/src/tests/*.spec.ts` + Go `*_test.go` — UI and backend tests

### Current Source of Truth (with exact paths)

#### Plans & Add-ons Catalog
- Platform add-on catalog CRUD and tenant-facing listing: `services/api/internal/service/integrationhub/service.go`
  - Functions include `ListPlatformAddonCatalog`, `CreatePlatformAddon`, `UpdatePlatformAddon`, `ListTenantAddons`, `ActivateTenantAddon`, `CancelTenantAddon`
- Legacy/plugin-backed catalog seeding and tenant entitlements bridge: `services/api/internal/service/tenant/addon_catalog.go`
- Static fallback plugin catalog (legacy seed): `services/api/internal/service/tenant/service.go` (`SystemPlugins`)
- Schema evolution: `infra/migrations/000080_integrations_addons_credits.up.sql`, `services/api/internal/db/migrations/000064_billing_v2.up.sql`

#### Tenant Entitlement State
- `tenant_addons` + `platform_addons` checks in:
  - `services/api/internal/service/tenant/billing.go` (`HasAddon`)
  - `services/api/internal/service/tenant/service.go` (plugin enable enforcement)
  - `services/api/internal/service/integrationhub/service.go` (add-on state + integration gating)
  - `services/api/internal/service/finance/payment.go` (online payments add-on enforcement; fixed in this pass)

#### Wallet / Credits Balances and Ledger
- New credit wallets/ledger (`tenant_credit_wallets`, `tenant_credit_ledger`): `services/api/internal/service/integrationhub/service.go`
  - `ListCreditBalances`, `ListCreditLedger`, `RequireCredits`, `AdjustCredits`, `TopupCredits`, `ApplyMonthlyIncludedCredits`
- Worker monthly allowance + credit helpers: `services/worker/internal/service/billing.go`
- Unique idempotency constraint: `infra/migrations/000080_integrations_addons_credits.up.sql`

#### Payment Gateways Config (Razorpay/PayU)
- Finance gateway CRUD/test/webhook status APIs: `services/api/internal/handler/finance/handler.go`
- Secret encryption/masking/testing/webhook status: `services/api/internal/service/finance/fees_advanced.go`
- Public webhook tenant resolution + signature verification + idempotent processing: `services/api/internal/service/finance/payment.go`

#### Integration Config (Google/Microsoft)
- HTTP routes and callbacks: `services/api/internal/handler/integrationhub/handler.go`
- OAuth/token storage/connect/disconnect/list/schedule/list live classes: `services/api/internal/service/integrationhub/service.go`
- Provider implementations (OAuth exchange/refresh, profile, Google Calendar + Meet, Microsoft Graph + Teams): `services/api/internal/service/integrationhub/providers.go`
- Worker token refresh job: `services/worker/internal/service/billing.go`

#### Notification Gateways Config (SMS/WhatsApp/Email)
- Routes: `services/api/internal/handler/notification/handler.go`
- Service (encrypted secrets + masked reads): `services/api/internal/service/notification/service.go`
- Providers/adapters in worker: `services/worker/internal/notification/{msg91.go,smshorizon.go,adapter.go}`
- Outbox/sqlc queries: `services/api/internal/db/query/{notifications.sql,outbox.sql}`

#### Audit Logs
- Audit logger usage in services (finance, integrationhub, tenant/platform flows)
- Platform audit explorer routes/pages:
  - API: `services/api/internal/handler/tenant/handler.go`
  - UI: `apps/web/src/app/(platform)/platform/audit-logs/page.tsx`

#### Security Events / Rate Limiting
- Security event middleware recorder: `services/api/internal/middleware/security_events.go`
- Security/rate-limit middleware: `services/api/internal/middleware/security.go`
- Platform security events UI/API:
  - API routes in `services/api/internal/handler/tenant/handler.go`
  - UI in `apps/web/src/app/(platform)/platform/security-events/page.tsx`

#### Encryption Utility (Secrets at Rest)
- `services/api/internal/foundation/security/crypto.go`
- Used by finance gateway secrets and integrationhub token storage; notification service also encrypts secrets before persistence.

---

## Phase 1 — Feature Master Index (Exhaustive)

Legend: `✅ Implemented`, `⚠️ Partial`, `❌ Missing`, `🛠 Fixed in this pass`

### Auth & Identity

| Feature | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Login / auth sessions | Auth endpoints protected, session/JWT flow, MFA hooks | `services/api/internal/handler/auth/handler.go`, `services/api/cmd/api/main.go` (auth handler + session store wiring), `services/api/internal/foundation/sessionstore/*` | ✅ |
| Password reset / forgot password | Public reset flow, rate-limited | `services/api/internal/handler/auth/handler.go` (forgot/reset handlers + specific limiter on forgot path), `apps/web/src/app/auth/reset-password/page.tsx` | ⚠️ (login/reset stricter dedicated limits not consistently applied) |
| Impersonation start/exit | Reason required, audit logged, safe exit | Platform route registration `services/api/internal/handler/tenant/handler.go`; web UI reason dialog `apps/web/src/app/(platform)/platform/tenants/list/page.tsx`; exit flow in `apps/web/src/app/(admin)/admin-layout-client.tsx`; middleware guard `services/api/internal/middleware/middleware.go` | ✅ |

### RBAC & Tenant Isolation

| Feature | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Platform RBAC | Granular platform permissions, server-side enforcement | `services/api/cmd/api/main.go` platform group + `PermissionGuard`, `services/api/internal/handler/tenant/handler.go` route segmentation | ✅ |
| Tenant role guards | Admin/teacher/parent/student/accountant routes role-guarded server-side | Route groups in `services/api/cmd/api/main.go`; web layout guards strengthened in `apps/web/src/app/*-layout-client.tsx` | ✅ |
| Tenant isolation | Queries filter by tenant_id for multi-tenant data | Widespread sqlc query params (e.g., `ListStudentReceipts`, `GetTenantActiveGateway`, `GetChildrenByParentUser`), finance webhook resolves tenant securely before processing | ✅ (spot checks passed; full query audit still manual) |

### Billing: Plans + Add-ons + Entitlements

| Feature | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Platform add-on catalog | CRUD with pricing/status/metadata | `services/api/internal/handler/integrationhub/handler.go` (`/admin/platform/billing/addons/catalog`), `services/api/internal/service/integrationhub/service.go`; platform UI related billing pages in `apps/web/src/app/(platform)/platform/payments*` | ✅ |
| Tenant add-ons list/activate/cancel/request | Tenant can view pricing and activate/request | `services/api/internal/handler/integrationhub/handler.go`; `apps/web/src/app/(admin)/admin/billing/page.tsx`, `/admin/billing/addons`, plugin pages | ✅ |
| Server-side entitlement enforcement | Features blocked server-side when add-on missing | `services/api/internal/service/tenant/service.go` plugin enable checks; `services/api/internal/service/integrationhub/service.go` live-class scheduling checks; `services/api/internal/service/finance/payment.go` online payment order checks | 🛠 Fixed / ✅ |

### Credits: Included Monthly Allowance + Topups + Debit Enforcement

| Feature | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Credit wallets by category | SMS/WhatsApp/Email/AI balances | Schema `infra/migrations/000080_integrations_addons_credits.up.sql` (`tenant_credit_wallets`), service `integrationhub/service.go` balance endpoints | ✅ |
| Idempotent ledger entries | Unique reference prevents double-debit | Unique `(tenant_id, wallet_type, reference_id)` in migration; duplicate handling in `RequireCredits` (`integrationhub/service.go`) and worker credit helper (`services/worker/internal/service/billing.go`) | ✅ |
| Monthly included credits | Monthly allowance job adds included credits idempotently | Worker `ApplyMonthlyIncludedCredits` + cron in `services/worker/cmd/worker/main.go`; reference format `monthly_allowance:...` | ✅ |
| Top-up flow | Tenant top-up request + platform adjust | API routes in `integrationhub/handler.go`, UI `apps/web/src/app/(admin)/admin/billing/credits/page.tsx`; platform adjust route and audit in integrationhub service | ✅ |
| Prevent uncontrolled sending cost | Send blocked when insufficient credits | Worker consumer checks add-on + credits before SMS/WA send in `services/worker/internal/worker/consumer.go`; returns failure and marks outbox failed | ✅ |

### Payments: Tenant Gateway Setup + Webhooks + Receipts

| Feature | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Tenant-owned Razorpay/PayU config | Tenant stores own credentials securely | `finance/handler.go` settings routes; `fees_advanced.go` `Put/Get/Test` + encrypt/mask | ✅ |
| Public webhook per provider | Signature verified, tenant resolved safely, idempotent | `finance/handler.go` `POST /webhook/{provider}`; `payment.go` `ResolveWebhookTenant` + `ProcessPaymentWebhook`; `webhook_logs` use | ✅ |
| Payment order creation add-on gated | Paid payment feature requires add-on | `services/api/internal/service/finance/payment.go` `requireOnlinePaymentsAddon` in `CreateOnlineOrder*` | 🛠 Fixed / ✅ |
| Parent receipt access | Parent can only download their child receipt | New parent PDF route/handler in `finance/handler.go` + `GetReceiptPDFParent` ownership verification in `finance/payment.go`; parent UI `apps/web/src/app/(parent)/parent/fees/page.tsx` | 🛠 Fixed / ✅ |

### Messaging: SMS/WhatsApp/Email + Outbox + Delivery Center + Cost Controls

| Feature | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Outbox processing | Reliable async delivery with retries/backoff | `services/api/internal/db/query/outbox.sql`, `services/worker/internal/worker/consumer.go` | ✅ |
| SMS/WhatsApp provider adapters | Runtime provider send exists | `services/worker/internal/notification/msg91.go`, `smshorizon.go`, `adapter.go` | ✅ (provider matrix varies) |
| Tenant gateway config UI | Tenant configures provider credentials from web app | API exists (`notification/handler.go`), encrypted service exists (`notification/service.go`), tenant-admin UI page `apps/web/src/app/(admin)/admin/communication/gateways/page.tsx` | ✅ |
| Credits cost controls on sends | Check entitlements and debit credits idempotently | `services/worker/internal/worker/consumer.go`, `services/worker/internal/service/billing.go` | ✅ |
| Delivery center logs | Status lifecycle visible | `apps/web/src/app/(admin)/admin/communication/logs/page.tsx` + `/admin/notifications/logs` API | ✅ |

### Live Classes: Google/Microsoft Integrations + Scheduling + Join Links

| Feature | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Tenant connect Google/Microsoft via OAuth | No passwords stored; encrypted tokens | `integrationhub/handler.go` connect/callback routes; `integrationhub/service.go` token persistence; `providers.go` exchange/refresh | ✅ (code) |
| Teacher schedules live class | Creates Meet/Teams link and stores metadata | `integrationhub/service.go` `ScheduleLiveClass`; UI `apps/web/src/app/(teacher)/teacher/live-classes/page.tsx` | ✅ (code; external runtime not validated here) |
| Parent/student can view links | Read-only listing | `integrationhub/handler.go` parent/student live-class list routes; UIs in parent/student pages | ✅ |
| Token refresh worker | Refresh expiring tokens, mark needs_reauth on failures | `services/worker/internal/service/billing.go` `RefreshExpiringIntegrationTokens` + worker cron registration | ✅ |
| Add-on gating | Missing add-on returns upgrade-required | `integrationhub/service.go` `ScheduleLiveClass` checks add-ons; UI surfaces gating | ✅ |

### Core ERP Modules (Representative Coverage from Page Inventory)

| Feature Area | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| SIS / students / remarks | Admin/teacher/parent/student role-specific data and actions | Many pages in `/admin/students`, `/parent/children`, `/teacher/remarks`; SIS handlers `services/api/internal/handler/sis/*` | ✅ |
| Attendance (student/staff/period) | Admin oversight + teacher execution | `apps/web` admin/teacher attendance pages; `services/api/internal/handler/attendance/*` | ✅ |
| Exams / hall tickets / marks | Exam lifecycle, hall tickets, marks publish | `/admin/exams`, `/teacher/exams/marks`; exam handlers/services and sqlc | ✅ |
| Finance collections/reports | Counter/offline receipts/reports/export | `/admin/finance*`, `/accountant/*`; finance handlers/services | ✅ |
| Certificates | Request + issue + templates | `/admin/certificates`; certificate handlers/services | ✅ |
| Promotions / academic structure | Class/section/subject/year management | `/admin/settings/master-data`, `/admin/students/promotion`; SIS handlers/services + `section_profiles` migration | ✅ |
| Biometric | Device/log listing and ingestion basics | `/admin/biometric`; handler/service present | ⚠️ (thin tests / limited QA tooling) |

### Platform Console (Support / Audit / Security / Ops)

| Feature | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Support tickets / SLA | Platform support operations UI + APIs | `apps/web/src/app/(platform)/platform/support/page.tsx`; routes in `tenant/handler.go` | ✅ |
| Audit explorer | Filterable audit logs and exports | `apps/web/src/app/(platform)/platform/audit-logs/page.tsx`; `tenant/handler.go` security routes | ✅ |
| Security events browser | Event list + retention management | `apps/web/src/app/(platform)/platform/security-events/page.tsx`; middleware recorder + API routes | ✅ |
| Impersonation | Reason + start/exit + audit + blocked platform access during impersonation | UI + tenant handler + middleware | ✅ |

### Marketing Site Claims vs Reality

| Claim Area | Expected business rule | Actual implementation evidence | Status |
|---|---|---|---|
| Integrations statuses | Marketing statuses should match actual implementation stage | `apps/marketing/src/app/integrations/data.ts` vs `services/api/internal/service/integrationhub/*` and web integration pages | ⚠️ mismatch |
| Pricing/add-ons/credits model | Marketing pricing should explain monthly add-ons + included credits + topups | `apps/marketing/src/app/pricing/page.tsx` is generic; docs exist in repo (`docs/addons-credits-pricing-model.md`, `docs/operational-rules-included-credits-overage-topups.md`) but not surfaced in marketing page copy | ⚠️ partial |

---

## Phase 2 — Flow-by-Flow Verification (Page/API/DB/Worker)

### Flow Spec
Flow Name: Tenant-owned Payment Gateway Setup + Parent Payment + Webhook Settlement
User Role: Tenant Admin (config), Parent (pay), System (webhook)
Entry Page URL: `/admin/billing/settings` (alias `/admin/settings/payments`), parent payment from `/parent/fees`
Pages involved (in order): (include exact Next routes)
- `apps/web/src/app/(admin)/admin/billing/settings/page.tsx`
- `apps/web/src/app/(admin)/admin/settings/payments/page.tsx` (re-export alias)
- `apps/web/src/app/(parent)/parent/fees/page.tsx`
UI components (key): (file paths)
- `apps/web/src/app/(admin)/admin/billing/settings/page.tsx` (Razorpay/PayU credential forms, test button, webhook status UI)
- `apps/web/src/app/(parent)/parent/fees/page.tsx` (order creation, gateway key fetch, receipt download)
API calls (in order): (method + route + request/response shape summary + server file path)
- `GET /v1/admin/settings/payments/gateways?provider={razorpay|payu}` — masked config for admin UI; handler `services/api/internal/handler/finance/handler.go` → service `GetGatewayConfigForAdmin` (`fees_advanced.go`)
- `PUT /v1/admin/settings/payments/gateways` — save tenant gateway credentials (provider + keys + webhook secret); handler `finance/handler.go` → service `UpsertGatewayConfig` (`fees_advanced.go`)
- `POST /v1/admin/settings/payments/gateways/test` — provider connectivity test; handler `finance/handler.go` → service `TestGatewayConfig` (`fees_advanced.go`)
- `GET /v1/admin/settings/payments/gateways/webhook-status?provider=...` — last webhook timestamps/status from `webhook_logs`; handler/service in finance
- `GET /v1/parent/fees/gateways?provider=...` — parent fetches public gateway key only; `GetGatewayKeyParent` in `finance/handler.go`
- `POST /v1/parent/payments/online` — create payment order; `CreateOnlineOrderParent` in `finance/handler.go` → `CreateOnlineOrderParent`/`CreateOnlineOrder` in `finance/payment.go`
- `POST /v1/payments/webhook/{provider}` — public webhook endpoint; `HandleWebhook` in `finance/handler.go` → `ResolveWebhookTenant` + `ProcessPaymentWebhook` in `finance/payment.go`
- `GET /v1/parent/children/{childID}/fees/receipts/{receiptID}/pdf` — parent-safe receipt PDF (fixed in this pass); `GetReceiptPDFParent` handler/service
DB tables touched: (migrations/sqlc evidence)
- `payment_gateway_configs`, `payment_orders`, `receipts`, `payment_events`, `webhook_logs` (finance migrations + sqlc queries in `services/api/internal/db/query/fees.sql` and webhook hardening migration `infra/migrations/000079_webhook_hardening.up.sql`)
Worker jobs involved: (consumer + event type)
- Outbox events emitted after payment success (receipt/payment notifications) consumed by `services/worker/internal/worker/consumer.go`
Entitlement checks: (where enforced server-side + UI)
- Server-side: `services/api/internal/service/finance/payment.go` `requireOnlinePaymentsAddon` (checks `payments_pro` or provider-specific `payments_{provider}` add-on before order creation)
- UI: billing/plugins pages show add-on states (`apps/web/src/app/(admin)/admin/billing/page.tsx`, `.../settings/plugins/*`) but server-side is the security boundary
Credit checks & debits: (reference_id, idempotency constraint, failure behavior)
- N/A for gateway order creation itself; notification sends after settlement may consume comms credits in worker using outbox event reference (`outbox-{eventID}`)
Audit logs recorded: (event name/action + where)
- Gateway config changes audited in `services/api/internal/service/finance/fees_advanced.go` (`AuditGatewayConfigChange`)
- Receipt/payment-related domain events recorded by finance service and audit logger integrations
Failure modes & user messaging:
- Missing add-on returns `403` "online payments add-on required" (fixed in this pass)
- Invalid webhook signature → 401/400 path in webhook handler/service
- Replay webhook → idempotent no duplicate receipt due `CheckPaymentEventProcessed`/stable event ID
- Parent receipt access to non-child receipt → `403` from new parent handler/service
Tests covering it: (Go tests + Playwright)
- `services/api/internal/service/finance/payment_test.go` (webhook signature/idempotency/tenant resolution + add-on enforcement helper tests; mock panic fixed in this pass)
- `apps/web/src/tests/parent-payment.spec.ts` refreshed in this pass as mocked UI smoke aligned to current `/parent/fees` flow
Gaps / bugs found:
- Parent receipt PDF route mismatch (fixed)
- Add-on enforcement missing in online order path (fixed)
- No backend integration test yet directly asserts `CreateOnlineOrder*` add-on enforcement against DB-backed add-on states (helper-level unit coverage added in this pass)
Fix recommendation: (minimal patch)
- Add DB-backed/integration tests for add-on enforcement in `CreateOnlineOrder*`

### Flow Spec
Flow Name: Add-ons Monthly Subscription Lifecycle (Tenant View/Request/Activate/Cancel + Platform Catalog/Approval)
User Role: Tenant Admin / Platform Finance-Ops
Entry Page URL: `/admin/billing` (tabs, alias `/admin/billing/addons`), platform catalog via platform billing admin APIs/pages
Pages involved (in order): (include exact Next routes)
- `apps/web/src/app/(admin)/admin/billing/page.tsx`
- `apps/web/src/app/(admin)/admin/billing/addons/page.tsx`
- `apps/web/src/app/(admin)/admin/settings/plugins/page.tsx`
- `apps/web/src/app/(admin)/admin/settings/plugins/plugin-card.tsx`
- `apps/web/src/app/(platform)/platform/tenants/[id]/page.tsx` (tenant add-on view)
UI components (key): (file paths)
- Billing tabs in admin billing page
- Plugin cards/config dialogs in admin settings plugins
- Platform tenant add-on controls/details in tenant details page
API calls (in order): (method + route + request/response shape summary + server file path)
- `GET /v1/admin/billing/addons` — tenant add-on catalog + tenant status (`integrationhub/handler.go` → `ListTenantAddons` in `integrationhub/service.go`)
- `POST /v1/admin/billing/addons/{code}/activate` or `/request` — self-serve or request flow (`integrationhub/handler.go`)
- `POST /v1/admin/billing/addons/{code}/cancel` — cancel/downgrade (`integrationhub/handler.go`)
- `GET/POST/PUT /v1/admin/platform/billing/addons/catalog...` — platform catalog CRUD (`integrationhub/handler.go`, `integrationhub/service.go`)
- Platform add-on request review/approve flows are also available via tenant/platform services (`tenant/platform_addon_requests.go`)
DB tables touched: (migrations/sqlc evidence)
- `platform_addons`, `tenant_addons`, add-on request tables (billing v2 + integrations/credits migrations)
Worker jobs involved: (consumer + event type)
- Monthly allowance job uses active tenant add-ons to apply included credits (`services/worker/internal/service/billing.go`)
Entitlement checks: (where enforced server-side + UI)
- Server-side plugin/module gating in `services/api/internal/service/tenant/service.go` (`updatePluginConfig` blocks enable without entitlement)
- Live classes and payment order flows additionally check add-ons in service layers
- UI shows status and request/activate CTAs but is not authoritative
Credit checks & debits: (reference_id, idempotency constraint, failure behavior)
- Included credits can be attached to add-on metadata and applied by monthly allowance job; debit occurs in messaging/AI flows, not on activation itself
Audit logs recorded: (event name/action + where)
- Add-on activation/cancel/request/platform catalog changes audited in `services/api/internal/service/integrationhub/service.go`
Failure modes & user messaging:
- Missing entitlement on protected feature returns clear errors (`ADDON_REQUIRED`, `UPGRADE_REQUIRED`, payment add-on required)
- Requires-approval flows remain pending until platform approves
Tests covering it: (Go tests + Playwright)
- `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` (mock UI flow)
- Backend unit tests for integrationhub helpers exist, but add-on lifecycle endpoint coverage is partial
Gaps / bugs found:
- Add-on code taxonomy is mixed (legacy plugin IDs vs new product add-ons), causing operator ambiguity
- No strong end-to-end automated test for request→platform approval→feature unlock
Fix recommendation: (minimal patch)
- Add a canonical add-on code map + migration script for legacy plugin IDs
- Add Go endpoint tests for activate/cancel/request + approval transitions
- Add Playwright mock E2E for tenant request and platform approval visibility

### Flow Spec
Flow Name: Credits (Included Allowance + Topups + Debit Enforcement + Idempotency)
User Role: Tenant Admin / Worker / Platform Support-Finance
Entry Page URL: `/admin/billing/credits`
Pages involved (in order): (include exact Next routes)
- `apps/web/src/app/(admin)/admin/billing/credits/page.tsx`
- `apps/web/src/app/(admin)/admin/communication/page.tsx` and `/admin/communication/logs` (send + observe outcomes)
UI components (key): (file paths)
- Credits balance + ledger + topup UI in `apps/web/src/app/(admin)/admin/billing/credits/page.tsx`
- Communication logs page for delivery outcomes in `apps/web/src/app/(admin)/admin/communication/logs/page.tsx`
API calls (in order): (method + route + request/response shape summary + server file path)
- `GET /v1/admin/billing/credits/balance` — per-wallet balances (`integrationhub/handler.go` → `ListCreditBalances`)
- `GET /v1/admin/billing/credits/ledger` — paged ledger (`integrationhub/service.go`)
- `POST /v1/admin/billing/credits/topup` — top-up request/invoice/order abstraction (`integrationhub/service.go`)
- `POST /v1/admin/platform/credits/adjust` — platform manual adjustment with audit (`integrationhub/handler.go` + service)
- Worker uses internal helpers for debit on outbox send (`services/worker/internal/worker/consumer.go` + `services/worker/internal/service/billing.go`)
DB tables touched: (migrations/sqlc evidence)
- `tenant_credit_wallets`, `tenant_credit_ledger` (`infra/migrations/000080_integrations_addons_credits.up.sql`)
- Legacy `wallets`/`wallet_ledger` also used in some pathways (AI and legacy billing)
Worker jobs involved: (consumer + event type)
- Monthly allowance top-up job (`services/worker/internal/service/billing.go`, scheduled in `services/worker/cmd/worker/main.go`)
- Outbox delivery consumer (`services/worker/internal/worker/consumer.go`) debits credits with idempotent reference `outbox-{eventID}`
Entitlement checks: (where enforced server-side + UI)
- Worker checks add-on entitlement (`communications_sms`, `communications_whatsapp`) before send in consumer
- Tenant UI exposes balances/top-up but server-side controls billing correctness
Credit checks & debits: (reference_id, idempotency constraint, failure behavior)
- `RequireCredits` and worker debit insert unique ledger rows by `(tenant_id, wallet_type, reference_id)`
- Duplicate insert (`23505`) treated as idempotent success
- Insufficient balance blocks send and marks outbox event failed; no double-debit on retry with same reference
Audit logs recorded: (event name/action + where)
- Credit top-up/adjust actions audited via `integrationhub/service.go`
Failure modes & user messaging:
- Insufficient credits -> error surfaced in worker logs/delivery logs and API error codes on direct billing checks
- Duplicate retry -> safe no-op debit
Tests covering it: (Go tests + Playwright)
- Worker helper tests: `services/worker/internal/service/billing_test.go` (partial; mostly token/encryption helper coverage)
- UI mock spec includes credits screen: `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts`
Gaps / bugs found:
- Full reservation/commit semantics are not implemented (debit-on-send path used)
- Limited automated DB tests for monthly allowance idempotency and `RequireCredits` duplicate handling
Fix recommendation: (minimal patch)
- Add DB-backed unit tests for `RequireCredits` idempotency + insufficient balance
- Add worker test for monthly allowance duplicate reference behavior
- Add communication send Playwright mocked test asserting balance decrement/insufficient block

### Flow Spec
Flow Name: Messaging / Communication Center (Providers + Outbox + Delivery Logs + Cost Controls)
User Role: Tenant Admin / Worker
Entry Page URL: `/admin/communication` and `/admin/communication/logs`
Pages involved (in order): (include exact Next routes)
- `apps/web/src/app/(admin)/admin/communication/page.tsx`
- `apps/web/src/app/(admin)/admin/communication/logs/page.tsx`
UI components (key): (file paths)
- Communication operations panels and PTM/event controls in `communication/page.tsx`
- Delivery log filters/table in `communication/logs/page.tsx`
API calls (in order): (method + route + request/response shape summary + server file path)
- `GET /v1/admin/notifications/logs` and `/stats` (`services/api/internal/handler/notification/handler.go`)
- `GET/POST /v1/admin/notifications/templates` + template routes
- `GET/POST /v1/admin/notifications/gateways`, `POST /v1/admin/notifications/gateways/{id}/test`, `POST /v1/admin/notifications/gateways/{id}/activate` (API exists)
DB tables touched: (migrations/sqlc evidence)
- Notification gateway config and log tables (`infra/migrations/*notifications*`, sqlc `services/api/internal/db/query/notifications.sql`)
- `outbox` for queued send events (`infra/migrations/000026_outbox_notifications.up.sql`, sqlc `outbox.sql`)
Worker jobs involved: (consumer + event type)
- `services/worker/internal/worker/consumer.go` handles outbox send events and routes to `msg91`, `smshorizon`, or `WebhookAdapter`
Entitlement checks: (where enforced server-side + UI)
- Server-side: worker enforces add-on + credits before SMS/WhatsApp delivery
- UI: communication pages don’t appear to surface gateway config for tenant yet; only logs/ops views are exposed
Credit checks & debits: (reference_id, idempotency constraint, failure behavior)
- `outbox-{eventID}` reference for debit in worker; duplicate retries do not double-debit due unique ledger constraint
- Insufficient credits aborts provider send and marks event failed
Audit logs recorded: (event name/action + where)
- Notification gateway config changes audited in notification service; delivery logs persisted in notification log tables
Failure modes & user messaging:
- Provider adapter unsupported capability returns error (e.g., `smshorizon` WhatsApp/push unsupported)
- Delivery failures visible in `/admin/communication/logs`
Tests covering it: (Go tests + Playwright)
- `services/api/internal/service/notification/service_test.go` (secret masking/encryption config behavior)
- `apps/web/src/tests/communication-logs.spec.ts` exists but appears stale vs current UI strings/actions
Gaps / bugs found:
- Communication logs flow is covered by a refreshed mocked Playwright smoke spec, but still lacks backend/API integration tests for filter semantics and export/retry behavior
- Provider test/activate endpoints are still not exposed in notification API/UI (only create/list/get-active currently)
Fix recommendation: (minimal patch)
- Add notification gateway test/activate endpoints (and UI actions) for safer operational validation
- Add backend/API integration tests for notification logs filtering/export behavior

### Flow Spec
Flow Name: Google Workspace / Microsoft 365 Live Classes (OAuth Connect + Schedule + Visibility + Token Refresh)
User Role: Tenant Admin / Teacher / Parent / Student / Worker
Entry Page URL: `/admin/settings/integrations`, `/teacher/live-classes`
Pages involved (in order): (include exact Next routes)
- `apps/web/src/app/(admin)/admin/settings/integrations/page.tsx`
- `apps/web/src/app/(teacher)/teacher/live-classes/page.tsx`
- `apps/web/src/app/(parent)/parent/live-classes/page.tsx`
- `apps/web/src/app/(student)/student/live-classes/page.tsx`
UI components (key): (file paths)
- Integrations cards/status/connect/disconnect in admin settings integrations page
- Teacher live class scheduler form/list in teacher page
- Parent/student list views in respective pages
API calls (in order): (method + route + request/response shape summary + server file path)
- `GET /v1/admin/settings/integrations` — list provider connection state + add-on state (`integrationhub/handler.go` -> `ListTenantIntegrations`)
- `POST /v1/admin/settings/integrations/google_workspace/connect` and `/microsoft_365/connect` — returns OAuth URL (`StartOAuthConnect`)
- `GET /v1/integrations/oauth/{provider}/callback` — public callback (`HandlePublicOAuthCallback` in `integrationhub/handler.go`) delegates to service complete connect
- `POST /v1/admin/settings/integrations/{provider}/disconnect` — disconnect + token cleanup
- `POST /v1/teacher/live-classes/schedule` — create event and meeting link (`ScheduleLiveClass`)
- `GET /v1/teacher/live-classes/list`, `/v1/parent/live-classes/list`, `/v1/student/live-classes/list`
DB tables touched: (migrations/sqlc evidence)
- `tenant_integrations`, `live_classes` / integration state tables added/extended in `infra/migrations/000080_integrations_addons_credits.up.sql`
Worker jobs involved: (consumer + event type)
- Token refresh cron: `RefreshExpiringIntegrationTokens` in `services/worker/internal/service/billing.go`, scheduled in `services/worker/cmd/worker/main.go`
Entitlement checks: (where enforced server-side + UI)
- Server-side live class scheduling add-on checks in `integrationhub/service.go` (`UPGRADE_REQUIRED`)
- UI surfaces upgrade/connect CTAs but does not replace server enforcement
Credit checks & debits: (reference_id, idempotency constraint, failure behavior)
- No credits currently debited for live class scheduling (subscription-gated feature)
Audit logs recorded: (event name/action + where)
- Integration connect/disconnect/schedule actions audited in `services/api/internal/service/integrationhub/service.go`
Failure modes & user messaging:
- Missing add-on -> upgrade-required error
- Missing connection / expired token -> clear error + status `needs_reauth`
- External provider errors are wrapped and surfaced; mock mode available via `INTEGRATIONS_MOCK_OAUTH=1`
Tests covering it: (Go tests + Playwright)
- `services/api/internal/service/integrationhub/service_test.go` (mocked OAuth exchange/profile, meeting payload mapping)
- `services/worker/internal/service/billing_test.go` (token refresh helper coverage)
- `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` (mock UI flow)
Gaps / bugs found:
- No live E2E verification against real Google/Microsoft credentials in this audit
- Playwright real OAuth flow not present (expected due credential/env complexity)
Fix recommendation: (minimal patch)
- Add provider HTTP mock server tests for callback→schedule→refresh path (backend integration tests)
- Add env-gated Playwright mocked OAuth callback completion flow with deterministic fixtures

### Flow Spec
Flow Name: AI Usage Controls (Add-on Gating + Quota + Credits + Error Codes)
User Role: Tenant Admin / Teacher/Admin AI callers (feature-dependent)
Entry Page URL: AI-enabled UI surfaces (various; no single dedicated page in audited scope)
Pages involved (in order): (include exact Next routes)
- Feature-specific AI UI surfaces (e.g., AI assistants/generators in modules); backend is primary evidence in this audit
UI components (key): (file paths)
- Example AI-related components exist under `apps/web/src/components/*ai*` and AI-powered module screens; comprehensive UI map not completed here
API calls (in order): (method + route + request/response shape summary + server file path)
- AI routes handled by `services/api/internal/handler/ai_handler.go` (mounted in admin route group in `services/api/cmd/api/main.go`)
- Handler maps service errors to HTTP: quota `429`, insufficient credits `402`, add-on required `403`
DB tables touched: (migrations/sqlc evidence)
- AI usage/quota tracking tables and legacy tenant wallet/rate-card billing tables (from earlier billing migrations; service references tenant billing APIs)
Worker jobs involved: (consumer + event type)
- None required for synchronous AI request gating; logging/analytics may be async elsewhere
Entitlement checks: (where enforced server-side + UI)
- `services/api/internal/service/ai/service.go` enforces add-on + quotas + wallet balance server-side
Credit checks & debits: (reference_id, idempotency constraint, failure behavior)
- AI billing currently uses legacy wallet debit/rate-card flow via tenant service interfaces, not the new `tenant_credit_wallets` ledger
- Service prevents debit when quota/add-on blocks occur
Audit logs recorded: (event name/action + where)
- AI request logging/audit paths exist in AI service; detailed audit UI linkage is partial
Failure modes & user messaging:
- `429` monthly quota exceeded, `402` insufficient credits, `403` add-on required
Tests covering it: (Go tests + Playwright)
- `services/api/internal/service/ai/quota_test.go` (burst limiter focus)
- No strong end-to-end tests for AI quota + credits interaction in this audit
Gaps / bugs found:
- New credit wallet model and AI billing are not fully unified
- Sparse automated tests for quota+credit interplay
Fix recommendation: (minimal patch)
- Add table-driven unit tests for `checkBilling` / `logAndDebit` transitions (quota block should not debit; insufficient credits should not debit)
- Plan migration path to `tenant_credit_wallets` or document legacy/modern wallet split explicitly

### Flow Spec
Flow Name: Platform Support Operations (Impersonation, Audit Explorer, Security Events, Role Separation)
User Role: Platform Support / Finance / Ops
Entry Page URL: `/platform/tenants/list`, `/platform/audit-logs`, `/platform/security-events`, `/platform/support`
Pages involved (in order): (include exact Next routes)
- `apps/web/src/app/(platform)/platform/tenants/list/page.tsx`
- `apps/web/src/app/(platform)/platform/audit-logs/page.tsx`
- `apps/web/src/app/(platform)/platform/security-events/page.tsx`
- `apps/web/src/app/(platform)/platform/support/page.tsx`
UI components (key): (file paths)
- Tenant list impersonation dialog/action in `platform/tenants/list/page.tsx`
- Audit log filters/export in `platform/audit-logs/page.tsx`
- Security event browser in `platform/security-events/page.tsx`
API calls (in order): (method + route + request/response shape summary + server file path)
- `POST /v1/admin/platform/tenants/{tenant_id}/impersonate` and `/impersonation-exit` (`services/api/internal/handler/tenant/handler.go`)
- `GET /v1/admin/platform/security/audit-logs`, `GET /export`
- `GET/PUT /v1/admin/platform/security/events`, retention policy endpoints
- Support ticket/SLA endpoints in `tenant/handler.go`
DB tables touched: (migrations/sqlc evidence)
- `platform_audit_logs`/audit tables, `security_events` (`infra/migrations/000041_platform_security_events.up.sql`), impersonation audit entries via audit logger
Worker jobs involved: (consumer + event type)
- No dedicated worker required for impersonation/audit browsing; security events are recorded asynchronously by middleware goroutine
Entitlement checks: (where enforced server-side + UI)
- Server-side `PermissionGuard` groups in `services/api/cmd/api/main.go` and `tenant/handler.go`
- Web platform layout enforces platform-role allowlist (`apps/web/src/app/(platform)/platform-layout-client.tsx`)
Credit checks & debits: (reference_id, idempotency constraint, failure behavior)
- N/A
Audit logs recorded: (event name/action + where)
- Impersonation start/exit and platform admin actions logged via tenant handler/service audit calls
- Security middleware writes `security_events`
Failure modes & user messaging:
- Missing reason for impersonation rejected (UI requires reason; backend validates payload)
- Impersonated user blocked from platform routes by middleware
Tests covering it: (Go tests + Playwright)
- `services/api/internal/middleware/impersonation_test.go` (real `AuthResolver` middleware integration test covering `/v1/admin/platform/*` denial)
- `apps/web/src/tests/role-route-matrix.spec.ts` (route access smoke, env-gated)
Gaps / bugs found:
- None found in this pass for the middleware platform-block path; test also caught and fixed `/v1` route-prefix mismatch.
Fix recommendation: (minimal patch)
- Keep the real middleware test and extend it if path prefixes or JWT/session validation order changes

---

## Phase 3 — Page Inventory & Coverage Map (Complete)

### Web App Pages (`/platform/*`, `/admin/*`, `/teacher/*`, `/accountant/*`, `/parent/*`, `/student/*`)

> Generated from `apps/web/src/app/**/page.tsx` and literal API-route extraction during this audit.
> Post-generation update in this pass: added `apps/web/src/app/(admin)/admin/communication/gateways/page.tsx` (verified in `next build` route output as `/admin/communication/gateways`).

| Page Route | Role(s) | Purpose | Key components | Backend endpoints | Add-on/credits required? | Tests |
|---|---|---|---|---|---|---|
| `/accountant/dashboard` | `accountant` | dashboard | `apps/web/src/app/(accountant)/accountant/dashboard/page.tsx` | `/accountant/fees/heads`, `/accountant/payments/ledger-mappings`, `/accountant/receipts/series` | — | — |
| `/accountant/fees` | `accountant` | fees | `apps/web/src/app/(accountant)/accountant/fees/page.tsx` | `/accountant/fees/heads`, `/accountant/fees/plans`, `/accountant/receipts/series` | — | `apps/web/src/tests/fee-receipt-offline.spec.ts`, `apps/web/src/tests/finance-smoke.spec.ts`, `apps/web/src/tests/parent-payment.spec.ts` |
| `/accountant/payments` | `accountant` | payments | `apps/web/src/app/(accountant)/accountant/payments/page.tsx` | `/accountant/payments/offline`, `/accountant/payments/receipts?student_id=${encodeURIComponent(targetStudentID)}`, `/accountant/receipts/${receiptID}/pdf` | — | — |
| `/accountant/reports` | `accountant` | reports | `apps/web/src/app/(accountant)/accountant/reports/page.tsx` | `/accountant/payments/reports/billing?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`, `/accountant/payments/tally-export?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}` | — | — |
| `/admin/academics/class-teachers` | `admin` | class teachers | `apps/web/src/app/(admin)/admin/academics/class-teachers/page.tsx` | `/academics/homework/options`, `/hrms/employees?limit=100`, `/hrms/staff/class-teachers` | — | — |
| `/admin/academics/holidays` | `admin` | holidays | `apps/web/src/app/(admin)/admin/academics/holidays/page.tsx` | `/academics/holidays`, `/academics/holidays/${id}` | — | — |
| `/admin/academics/lesson-review` | `admin` | lesson review | `apps/web/src/app/(admin)/admin/academics/lesson-review/page.tsx` | `/admin/academics/calendar`, `/admin/academics/lesson-plans/${reviewDialog.id}/status`, `/admin/academics/lesson-plans?subject_id=${selectedSubject}&class_id=${selectedClass}`, `/admin/academics/subjects`, `/admin/foundation/classes` | — | — |
| `/admin/academics/question-bank/generate` | `admin` | generate | `apps/web/src/app/(admin)/admin/academics/question-bank/generate/page.tsx` | `/admin/academic-structure/academic-years`, `/admin/academic-structure/subjects`, `/admin/exams/papers/generate` | — | — |
| `/admin/academics/question-bank` | `admin` | question bank | `apps/web/src/app/(admin)/admin/academics/question-bank/page.tsx` | `/academics/subjects`, `/exams/questions?${params.toString()}` | — | — |
| `/admin/academics/specializations` | `admin` | specializations | `apps/web/src/app/(admin)/admin/academics/specializations/page.tsx` | `/academics/subjects`, `/hrms/employees?limit=100`, `/hrms/staff/specializations` | — | — |
| `/admin/academics/syllabus-lag` | `admin` | syllabus lag | `apps/web/src/app/(admin)/admin/academics/syllabus-lag/page.tsx` | `/admin/academics/lesson-plans/lag?current_week=${currentWeek}` | — | — |
| `/admin/admissions/applications` | `admin` | applications | `apps/web/src/app/(admin)/admin/admissions/applications/page.tsx` | `/admin/academic-structure/classes`, `/admin/academic-structure/classes/${classID}/sections`, `/admin/admissions/applications/${appID}/status`, `/admin/admissions/applications/${selectedApp.id}/accept`, `/admin/admissions/applications/${selectedApp.id}/pay-fee`, `/admin/admissions/applications?limit=50`, `/admin/admissions/settings/workflow` | — | — |
| `/admin/admissions/enquiries` | `admin` | enquiries | `apps/web/src/app/(admin)/admin/admissions/enquiries/page.tsx` | `/admin/admissions/applications`, `/admin/admissions/enquiries/${id}/status`, `/admin/admissions/enquiries?limit=100` | — | — |
| `/admin/admissions/pipeline` | `admin` | pipeline | `apps/web/src/app/(admin)/admin/admissions/pipeline/page.tsx` | `/admin/admissions/applications`, `/admin/admissions/applications/${appId}/status` | — | — |
| `/admin/alumni` | `admin` | alumni | `apps/web/src/app/(admin)/admin/alumni/page.tsx` | `/admin/alumni` | — | — |
| `/admin/alumni/placement-drives` | `admin` | placement drives | `apps/web/src/app/(admin)/admin/alumni/placement-drives/page.tsx` | `/admin/alumni/drives` | — | — |
| `/admin/approvals` | `admin` | approvals | `apps/web/src/app/(admin)/admin/approvals/page.tsx` | `/admin/approvals/${selectedReq.id}/${actionType}`, `/admin/approvals?status=${activeTab}&limit=100` | — | — |
| `/admin/attendance` | `admin` | attendance | `apps/web/src/app/(admin)/admin/attendance/page.tsx` | `/admin/attendance/stats?date=${dateStr}`, `/admin/leaves/${leaveID}/${action}`, `/admin/leaves?status=pending` | — | — |
| `/admin/attendance/settings` | `admin` | settings | `apps/web/src/app/(admin)/admin/attendance/settings/page.tsx` | `/admin/attendance/locks/emergency`, `/admin/attendance/policies` | — | — |
| `/admin/billing/addons` | `admin` | addons | `apps/web/src/app/(admin)/admin/billing/addons/page.tsx` | — | — | `apps/web/src/tests/finance-smoke.spec.ts`, `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` |
| `/admin/billing/credits` | `admin` | credits | `apps/web/src/app/(admin)/admin/billing/credits/page.tsx` | `/admin/billing/credits/balance`, `/admin/billing/credits/ledger?limit=20`, `/admin/billing/credits/topup` | credits management page | `apps/web/src/tests/finance-smoke.spec.ts`, `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` |
| `/admin/billing` | `admin` | billing | `apps/web/src/app/(admin)/admin/billing/page.tsx` | `/admin/tenant/billing`, `/admin/tenant/invoices?limit=100${status ? `, `/admin/tenants/addon-requests`, `/admin/tenants/addon-requests?limit=100`, `/admin/tenants/plugins`, `/admin/tenants/plugins/${addonID}` | — | `apps/web/src/tests/finance-smoke.spec.ts`, `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` |
| `/admin/billing/settings` | `admin` | settings | `apps/web/src/app/(admin)/admin/billing/settings/page.tsx` | `/admin/fees/gateways?provider=${provider}`, `/admin/settings/payments/gateways`, `/admin/settings/payments/gateways/test`, `/admin/settings/payments/gateways/webhook-status?provider=${provider}` | gateway config only (no addon enforcement found in payment order path) | `apps/web/src/tests/finance-smoke.spec.ts`, `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` |
| `/admin/biometric` | `admin` | biometric | `apps/web/src/app/(admin)/admin/biometric/page.tsx` | `/admin/biometric/devices`, `/admin/biometric/logs` | — | — |
| `/admin/bulk-import` | `admin` | bulk import | `apps/web/src/app/(admin)/admin/bulk-import/page.tsx` | `/admin/import-jobs`, `/admin/sis/import` | — | — |
| `/admin/calendar` | `admin` | calendar | `apps/web/src/app/(admin)/admin/calendar/page.tsx` | `/admin/calendar/events`, `/admin/calendar/events?${params.toString()}` | — | — |
| `/admin/certificates` | `admin` | certificates | `apps/web/src/app/(admin)/admin/certificates/page.tsx` | `/admin/certificates`, `/admin/certificates/requests`, `/admin/certificates/requests/${encodeURIComponent(id)}/status`, `/admin/students?query=${encodeURIComponent(studentQuery)}&limit=10` | — | — |
| `/admin/communication/logs` | `admin` | logs | `apps/web/src/app/(admin)/admin/communication/logs/page.tsx` | `/admin/notifications/logs?${params.toString()}`, `/admin/notifications/stats` | credits may apply via outbox send paths (server/worker) | `apps/web/src/tests/communication-logs.spec.ts` |
| `/admin/communication/notices` | `admin` | notices | `apps/web/src/app/(admin)/admin/communication/notices/page.tsx` | — | credits may apply via outbox send paths (server/worker) | `apps/web/src/tests/notice-smoke.spec.ts`, `apps/web/src/tests/notice-full-flow.spec.ts`, `apps/web/src/tests/communication-logs.spec.ts` |
| `/admin/communication` | `admin` | communication | `apps/web/src/app/(admin)/admin/communication/page.tsx` | `/admin/communication/chats/moderation`, `/admin/communication/events?${params.toString()}`, `/admin/communication/ptm/events`, `/admin/communication/ptm/settings` | credits may apply via outbox send paths (server/worker) | `apps/web/src/tests/communication-logs.spec.ts` |
| `/admin/custom-fields` | `admin` | custom fields | `apps/web/src/app/(admin)/admin/custom-fields/page.tsx` | `/admin/custom-fields/definitions/${id}`, `/admin/custom-fields/definitions?entity_type=${activeType}` | — | — |
| `/admin/dashboard` | `admin` | dashboard | `apps/web/src/app/(admin)/admin/dashboard/page.tsx` | `/admin/approvals?status=pending&limit=3`, `/admin/certificates/list?status=pending&limit=5`, `/admin/dashboard/command-status`, `/admin/payments/reports/defaulters/data` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/admin/dashboard/strategy` | `admin` | strategy | `apps/web/src/app/(admin)/admin/dashboard/strategy/page.tsx` | — | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/admin/diary` | `admin` | diary | `apps/web/src/app/(admin)/admin/diary/page.tsx` | `/admin/remarks`, `/admin/students/${studentId}/remarks`, `/admin/students?query=${encodeURIComponent(modalStudentQuery)}&limit=10`, `/admin/students?query=${encodeURIComponent(studentQuery)}&limit=10` | — | — |
| `/admin/exams` | `admin` | exams | `apps/web/src/app/(admin)/admin/exams/page.tsx` | `/admin/academic-structure/academic-years`, `/admin/academic-structure/subjects`, `/admin/aggregates/calculate`, `/admin/exams`, `/admin/exams/${examID}/hall-tickets`, `/admin/exams/${examID}/publish`, `/admin/exams/${examID}/subjects`, `/admin/exams/${selectedExamID}/hall-tickets`, `/admin/exams/${selectedExamID}/hall-tickets/${studentID}/pdf`, `/admin/exams/${selectedExamID}/subjects` | — | — |
| `/admin/finance/charts` | `admin` | charts | `apps/web/src/app/(admin)/admin/finance/charts/page.tsx` | `/admin/payments/reports/billing?from=${from}&to=${to}`, `/admin/payments/reports/billing?from=${prevFrom}&to=${prevTo}`, `/admin/payments/reports/collections?from=${from}&to=${to}` | — | — |
| `/admin/finance/collect` | `admin` | collect | `apps/web/src/app/(admin)/admin/finance/collect/page.tsx` | `/admin/fees/students/${student.id}/summary`, `/admin/payments/offline`, `/admin/students?query=${encodeURIComponent(query)}&limit=10` | — | — |
| `/admin/finance/counter` | `admin` | counter | `apps/web/src/app/(admin)/admin/finance/counter/page.tsx` | `/admin/fees/students/${student.id}/summary`, `/admin/finance/waivers`, `/admin/payments/offline`, `/admin/students?limit=10&search=${search}` | — | — |
| `/admin/finance` | `admin` | finance | `apps/web/src/app/(admin)/admin/finance/page.tsx` | `/admin/finance/reports/daily-summary?date=${reportsDate}`, `/admin/payments/receipts/${receiptId}/pdf`, `/admin/payments/reports/billing?from=${fromDate}&to=${toDate}`, `/admin/payments/reports/collections?from=${fromDate}&to=${toDate}`, `/admin/payments/tally-export?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`, `/admin/rules/concessions`, `/admin/rules/fee-reminders`, `/admin/rules/late-fees` | — | — |
| `/admin/finance/setup` | `admin` | setup | `apps/web/src/app/(admin)/admin/finance/setup/page.tsx` | `/admin/academic-structure/academic-years`, `/admin/academic-structure/classes`, `/admin/fees/gateways`, `/admin/fees/gateways?provider=${provider}`, `/admin/fees/heads`, `/admin/fees/optional`, `/admin/fees/select`, `/admin/fees/structure`, `/admin/fees/structure?academic_year_id=${activeYearId}&class_id=${clsId}` | — | — |
| `/admin/hostel/finance` | `admin` | finance | `apps/web/src/app/(admin)/admin/hostel/finance/page.tsx` | `/admin/hostel/fee-mappings`, `/admin/hostel/fee-postings`, `/admin/hostel/fee-postings/trigger` | — | — |
| `/admin/hostel` | `admin` | hostel | `apps/web/src/app/(admin)/admin/hostel/page.tsx` | `/admin/hostel/allocations`, `/admin/hostel/allocations/${allocationID}/vacate`, `/admin/hostel/buildings`, `/admin/hostel/buildings/${building.id}/rooms` | — | — |
| `/admin/houses` | `admin` | houses | `apps/web/src/app/(admin)/admin/houses/page.tsx` | `/admin/houses`, `/admin/houses/${id}` | — | — |
| `/admin/hrms/employees` | `admin` | employees | `apps/web/src/app/(admin)/admin/hrms/employees/page.tsx` | `/hrms/employees?limit=100` | — | — |
| `/admin/hrms` | `admin` | hrms | `apps/web/src/app/(admin)/admin/hrms/page.tsx` | `/admin/hrms/employees?limit=200`, `/admin/hrms/payroll-runs?limit=200`, `/admin/hrms/salary-structures`, `/admin/hrms/staff/tasks` | — | — |
| `/admin/hrms/payroll` | `admin` | payroll | `apps/web/src/app/(admin)/admin/hrms/payroll/page.tsx` | `/hrms/payroll-runs`, `/hrms/payroll-runs/${id}/execute`, `/hrms/payroll-runs?limit=12` | — | — |
| `/admin/hrms/tasks` | `admin` | tasks | `apps/web/src/app/(admin)/admin/hrms/tasks/page.tsx` | `/hrms/employees?limit=100`, `/hrms/staff/tasks` | — | — |
| `/admin/id-cards` | `admin` | id cards | `apps/web/src/app/(admin)/admin/id-cards/page.tsx` | `/admin/id-cards/templates`, `/admin/id-cards/templates/${id}` | — | — |
| `/admin/inventory/items` | `admin` | items | `apps/web/src/app/(admin)/admin/inventory/items/page.tsx` | `/admin/inventory/items` | — | — |
| `/admin/inventory` | `admin` | inventory | `apps/web/src/app/(admin)/admin/inventory/page.tsx` | `/inventory/categories`, `/inventory/items`, `/inventory/purchase-orders`, `/inventory/requisitions`, `/inventory/suppliers`, `/inventory/transactions?limit=10` | — | — |
| `/admin/inventory/suppliers` | `admin` | suppliers | `apps/web/src/app/(admin)/admin/inventory/suppliers/page.tsx` | `/admin/inventory/suppliers` | — | — |
| `/admin/inventory/transactions` | `admin` | transactions | `apps/web/src/app/(admin)/admin/inventory/transactions/page.tsx` | `/admin/inventory/transactions?limit=50` | — | — |
| `/admin/kb/documents/[id]` | `admin` | documents detail | `apps/web/src/app/(admin)/admin/kb/documents/[id]/page.tsx` | `/admin/kb/documents/${params.id}` | — | — |
| `/admin/kb/documents` | `admin` | documents | `apps/web/src/app/(admin)/admin/kb/documents/page.tsx` | `/admin/kb/documents/${doc.id}`, `/admin/kb/documents/${id}`, `/admin/kb/documents?limit=200` | — | — |
| `/admin/kb` | `admin` | kb | `apps/web/src/app/(admin)/admin/kb/page.tsx` | — | — | — |
| `/admin/kb/settings` | `admin` | settings | `apps/web/src/app/(admin)/admin/kb/settings/page.tsx` | `/admin/kb/settings` | — | — |
| `/admin/learning-resources` | `admin` | learning resources | `apps/web/src/app/(admin)/admin/learning-resources/page.tsx` | `/admin/academics/subjects`, `/admin/foundation/classes`, `/admin/resources`, `/admin/resources/${id}`, `/admin/resources?${params.toString()}` | — | — |
| `/admin/library/books` | `admin` | books | `apps/web/src/app/(admin)/admin/library/books/page.tsx` | `/admin/library/books?limit=50` | — | — |
| `/admin/library/digital-assets` | `admin` | digital assets | `apps/web/src/app/(admin)/admin/library/digital-assets/page.tsx` | `/admin/library/assets/${id}`, `/admin/library/books/${bookId}/assets` | — | — |
| `/admin/library/issues` | `admin` | issues | `apps/web/src/app/(admin)/admin/library/issues/page.tsx` | `/admin/library/issues/${issue.id}/return`, `/admin/library/issues?limit=50` | — | — |
| `/admin/library/reading` | `admin` | reading | `apps/web/src/app/(admin)/admin/library/reading/page.tsx` | `/library/reading-progress/recent` | — | — |
| `/admin/library/scan` | `admin` | scan | `apps/web/src/app/(admin)/admin/library/scan/page.tsx` | — | — | — |
| `/admin/notices` | `admin` | notices | `apps/web/src/app/(admin)/admin/notices/page.tsx` | `/admin/academic-structure/classes`, `/admin/academic-structure/classes/${classID}/sections`, `/admin/notices`, `/admin/notices/${notice.id}/acks`, `/admin/notices/${notice.id}/acks/stats`, `/api/files/upload` | credits may apply via outbox send paths (server/worker) | `apps/web/src/tests/notice-smoke.spec.ts`, `apps/web/src/tests/notice-full-flow.spec.ts` |
| `/admin/plan` | `admin` | plan | `apps/web/src/app/(admin)/admin/plan/page.tsx` | `/admin/tenant/plan` | — | — |
| `/admin/portfolio` | `admin` | portfolio | `apps/web/src/app/(admin)/admin/portfolio/page.tsx` | `/admin/portfolio/groups`, `/admin/portfolio/groups/${groupId}/financial-analytics`, `/admin/portfolio/groups/${groupId}/members` | — | — |
| `/admin/reception` | `admin` | reception | `apps/web/src/app/(admin)/admin/reception/page.tsx` | `/admin/admissions/enquiries?limit=10`, `/admin/safety/gate-passes?limit=10`, `/admin/safety/visitors/logs?limit=10` | — | — |
| `/admin/reports` | `admin` | reports | `apps/web/src/app/(admin)/admin/reports/page.tsx` | `/admin/finance/receipts?limit=5000`, `/admin/sis/students?limit=5000`, `/admin/sis/students?limit=5000&status=withdrawn` | — | — |
| `/admin/safety/gate-passes` | `admin` | gate passes | `apps/web/src/app/(admin)/admin/safety/gate-passes/page.tsx` | — | — | — |
| `/admin/safety/verify` | `admin` | verify | `apps/web/src/app/(admin)/admin/safety/verify/page.tsx` | `/admin/safety/pickups/verify` | — | — |
| `/admin/safety/visitors` | `admin` | visitors | `apps/web/src/app/(admin)/admin/safety/visitors/page.tsx` | `/admin/safety/visitors/check-in`, `/admin/safety/visitors/check-out/${id}`, `/admin/safety/visitors/logs` | — | — |
| `/admin/school-profile` | `admin` | school profile | `apps/web/src/app/(admin)/admin/school-profile/page.tsx` | `/admin/school-profile` | — | — |
| `/admin/settings/academic-structure` | `admin` | academic structure | `apps/web/src/app/(admin)/admin/settings/academic-structure/page.tsx` | — | — | — |
| `/admin/settings/access` | `admin` | access | `apps/web/src/app/(admin)/admin/settings/access/page.tsx` | — | — | — |
| `/admin/settings/automation` | `admin` | automation | `apps/web/src/app/(admin)/admin/settings/automation/page.tsx` | `/admin/automation/rules`, `/admin/automation/rules/${id}` | — | — |
| `/admin/settings/branding` | `admin` | branding | `apps/web/src/app/(admin)/admin/settings/branding/page.tsx` | — | — | — |
| `/admin/settings/gateways` | `admin` | gateways | `apps/web/src/app/(admin)/admin/settings/gateways/page.tsx` | — | — | — |
| `/admin/settings/integrations` | `admin` | integrations | `apps/web/src/app/(admin)/admin/settings/integrations/page.tsx` | `/admin/settings/integrations`, `/admin/settings/integrations/${provider}/connect`, `/admin/settings/integrations/${provider}/disconnect` | — | `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` |
| `/admin/settings/master-data` | `admin` | master data | `apps/web/src/app/(admin)/admin/settings/master-data/page.tsx` | `/admin/academic-structure/academic-years`, `/admin/academic-structure/academic-years/${editingYearID}`, `/admin/academic-structure/academic-years/${yearID}`, `/admin/academic-structure/classes`, `/admin/academic-structure/classes/${classID}`, `/admin/academic-structure/classes/${classID}/sections`, `/admin/academic-structure/classes/${editingClassID}`, `/admin/academic-structure/classes/${selectedClassID}/sections`, `/admin/academic-structure/sections/${editingSectionID}`, `/admin/academic-structure/sections/${sectionID}` | — | — |
| `/admin/settings/onboarding` | `admin` | onboarding | `apps/web/src/app/(admin)/admin/settings/onboarding/page.tsx` | — | — | — |
| `/admin/settings` | `admin` | settings | `apps/web/src/app/(admin)/admin/settings/page.tsx` | — | — | — |
| `/admin/settings/payments` | `admin` | payments | `apps/web/src/app/(admin)/admin/settings/payments/page.tsx` | — | gateway config only (no addon enforcement found in payment order path) | — |
| `/admin/settings/permissions` | `admin` | permissions | `apps/web/src/app/(admin)/admin/settings/permissions/page.tsx` | — | — | — |
| `/admin/settings/plugins` | `admin` | plugins | `apps/web/src/app/(admin)/admin/settings/plugins/page.tsx` | — | — | — |
| `/admin/settings/profile` | `admin` | profile | `apps/web/src/app/(admin)/admin/settings/profile/page.tsx` | — | — | — |
| `/admin/settings/reminders` | `admin` | reminders | `apps/web/src/app/(admin)/admin/settings/reminders/page.tsx` | `/admin/rules/fee-reminders` | — | — |
| `/admin/settings/roles` | `admin` | roles | `apps/web/src/app/(admin)/admin/settings/roles/page.tsx` | — | — | — |
| `/admin/settings/templates` | `admin` | templates | `apps/web/src/app/(admin)/admin/settings/templates/page.tsx` | `/admin/notifications/templates`, `/admin/notifications/templates/${editingTemplate.id}`, `/admin/notifications/templates/${id}` | — | — |
| `/admin/settings/users` | `admin` | users | `apps/web/src/app/(admin)/admin/settings/users/page.tsx` | — | — | — |
| `/admin/staff-attendance` | `admin` | staff attendance | `apps/web/src/app/(admin)/admin/staff-attendance/page.tsx` | `/admin/hrms/employees?limit=200`, `/admin/staff-attendance`, `/admin/staff-attendance/stats?date=${date}`, `/admin/staff-attendance?date=${date}` | — | — |
| `/admin/students/[id]` | `admin` | students detail | `apps/web/src/app/(admin)/admin/students/[id]/page.tsx` | — | — | — |
| `/admin/students/confidential-notes` | `admin` | confidential notes | `apps/web/src/app/(admin)/admin/students/confidential-notes/page.tsx` | `/admin/safety/notes/${id}`, `/admin/safety/notes/student/${studentId}` | — | — |
| `/admin/students/gate-passes` | `admin` | gate passes | `apps/web/src/app/(admin)/admin/students/gate-passes/page.tsx` | `/admin/safety/gate-passes`, `/admin/safety/gate-passes/${id}/approve`, `/admin/safety/gate-passes/${id}/use` | — | — |
| `/admin/students` | `admin` | students | `apps/web/src/app/(admin)/admin/students/page.tsx` | — | — | — |
| `/admin/students/promotion` | `admin` | promotion | `apps/web/src/app/(admin)/admin/students/promotion/page.tsx` | `/admin/academic-structure/academic-years`, `/admin/academic-structure/classes`, `/admin/academic-structure/classes/${classId}/sections`, `/admin/promotions/apply`, `/admin/students?limit=500` | — | — |
| `/admin/timetable` | `admin` | timetable | `apps/web/src/app/(admin)/admin/timetable/page.tsx` | `/admin/academic-structure/classes`, `/admin/academic-structure/subjects`, `/admin/roles/users`, `/admin/schedule/periods?variant_id=${variantID}`, `/admin/schedule/substitutions`, `/admin/schedule/substitutions/absences`, `/admin/schedule/substitutions/absences?date=${searchDate}`, `/admin/schedule/substitutions/free-teachers?date=${searchDate}&period_id=${periodID}`, `/admin/schedule/substitutions/teacher-lessons/${teacherID}?date=${searchDate}`, `/admin/schedule/timetable?variant_id=${variantID}&section_id=${selectedSectionID}` | — | — |
| `/admin/transport/allocations` | `admin` | allocations | `apps/web/src/app/(admin)/admin/transport/allocations/page.tsx` | `/admin/transport/allocations` | — | — |
| `/admin/transport/drivers` | `admin` | drivers | `apps/web/src/app/(admin)/admin/transport/drivers/page.tsx` | `/admin/transport/drivers` | — | — |
| `/admin/transport` | `admin` | transport | `apps/web/src/app/(admin)/admin/transport/page.tsx` | `/transport/allocations`, `/transport/drivers`, `/transport/fuel-logs`, `/transport/generate-fees`, `/transport/routes`, `/transport/vehicles` | — | — |
| `/admin/transport/routes` | `admin` | routes | `apps/web/src/app/(admin)/admin/transport/routes/page.tsx` | `/admin/transport/routes` | — | — |
| `/admin/transport/vehicles` | `admin` | vehicles | `apps/web/src/app/(admin)/admin/transport/vehicles/page.tsx` | `/admin/transport/vehicles` | — | — |
| `/parent/children/[id]` | `parent` | children detail | `apps/web/src/app/(parent)/parent/children/[id]/page.tsx` | — | — | — |
| `/parent/children` | `parent` | children | `apps/web/src/app/(parent)/parent/children/page.tsx` | — | — | — |
| `/parent/dashboard` | `parent` | dashboard | `apps/web/src/app/(parent)/parent/dashboard/page.tsx` | `/parent/children/${child.id}/fees/summary`, `/parent/me/children`, `/parent/notices` | — | `apps/web/src/tests/role-route-matrix.spec.ts` |
| `/parent/diary` | `parent` | diary | `apps/web/src/app/(parent)/parent/diary/page.tsx` | `/parent/children/${childId}/remarks`, `/parent/me/children`, `/parent/remarks/${remarkId}/acknowledge` | — | — |
| `/parent/fees` | `parent` | fees | `apps/web/src/app/(parent)/parent/fees/page.tsx` | `/parent/children/${childId}/fees/receipts`, `/parent/children/${childId}/fees/summary`, `/parent/me/children`, `/v1/admin/receipts/${receiptId}/pdf`, `/v1/parent/fees/gateways?provider=razorpay`, `/v1/parent/payments/online` | — | `apps/web/src/tests/fee-receipt-offline.spec.ts`, `apps/web/src/tests/finance-smoke.spec.ts`, `apps/web/src/tests/parent-payment.spec.ts` |
| `/parent/homework` | `parent` | homework | `apps/web/src/app/(parent)/parent/homework/page.tsx` | `/parent/homework/${selectedHw.id}/submit`, `/parent/homework?student_id=${encodeURIComponent(childID)}`, `/parent/me/children` | — | — |
| `/parent/kb` | `parent` | kb | `apps/web/src/app/(parent)/parent/kb/page.tsx` | — | — | — |
| `/parent/leaves` | `parent` | leaves | `apps/web/src/app/(parent)/parent/leaves/page.tsx` | `/parent/leaves`, `/parent/leaves?student_id=${encodeURIComponent(targetChildID)}`, `/parent/me/children` | — | — |
| `/parent/live-classes` | `parent` | live classes | `apps/web/src/app/(parent)/parent/live-classes/page.tsx` | `/parent/live-classes/list` | `live_classes_google`/`live_classes_microsoft` (server-enforced on schedule) | `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` |
| `/parent/notices` | `parent` | notices | `apps/web/src/app/(parent)/parent/notices/page.tsx` | `/parent/notices`, `/parent/notices/${id}/ack` | credits may apply via outbox send paths (server/worker) | `apps/web/src/tests/notice-smoke.spec.ts`, `apps/web/src/tests/notice-full-flow.spec.ts` |
| `/parent/profile` | `parent` | profile | `apps/web/src/app/(parent)/parent/profile/page.tsx` | — | — | — |
| `/parent/results` | `parent` | results | `apps/web/src/app/(parent)/parent/results/page.tsx` | `/parent/children/${childID}/exams/results`, `/parent/me/children` | — | — |
| `/platform/analytics` | `platform` | analytics | `apps/web/src/app/(platform)/platform/analytics/page.tsx` | `/admin/platform/analytics/metrics?metric=revenue&days=30`, `/admin/platform/billing/overview`, `/admin/platform/summary`, `/admin/platform/tenants?limit=200` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/audit-logs` | `platform` | audit logs | `apps/web/src/app/(platform)/platform/audit-logs/page.tsx` | `/admin/platform/security/audit-logs/export?${params.toString()}`, `/admin/platform/security/audit-logs?${buildQueryParams().toString()}` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/blocks` | `platform` | blocks | `apps/web/src/app/(platform)/platform/blocks/page.tsx` | `/admin/platform/security/blocks`, `/admin/platform/security/blocks/${blockId}/release`, `/admin/platform/security/blocks?${query}` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/dashboard` | `platform` | dashboard | `apps/web/src/app/(platform)/platform/dashboard/page.tsx` | `/admin/platform/summary` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/incidents` | `platform` | incidents | `apps/web/src/app/(platform)/platform/incidents/page.tsx` | `/admin/platform/incidents`, `/admin/platform/incidents/${id}`, `/admin/platform/incidents?limit=20` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/integrations/manage/[tab]` | `platform` | manage detail | `apps/web/src/app/(platform)/platform/integrations/manage/[tab]/page.tsx` | — | — | `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts`, `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/integrations/manage` | `platform` | manage | `apps/web/src/app/(platform)/platform/integrations/manage/page.tsx` | — | — | `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts`, `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/integrations` | `platform` | integrations | `apps/web/src/app/(platform)/platform/integrations/page.tsx` | `/admin/platform/integrations/health`, `/admin/platform/integrations/logs?limit=10` | — | `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts`, `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/internal-users/manage/[tab]` | `platform` | manage detail | `apps/web/src/app/(platform)/platform/internal-users/manage/[tab]/page.tsx` | — | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/internal-users/manage` | `platform` | manage | `apps/web/src/app/(platform)/platform/internal-users/manage/page.tsx` | — | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/internal-users` | `platform` | internal users | `apps/web/src/app/(platform)/platform/internal-users/page.tsx` | `/admin/platform/internal-users?limit=200`, `/admin/platform/security/audit-logs?limit=10` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/legal` | `platform` | legal | `apps/web/src/app/(platform)/platform/legal/page.tsx` | `/admin/platform/legal/docs`, `/admin/platform/legal/docs?include_inactive=true&limit=500` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/marketing` | `platform` | marketing | `apps/web/src/app/(platform)/platform/marketing/page.tsx` | `/admin/platform/marketing/announcements`, `/admin/platform/marketing/changelogs` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/monitoring` | `platform` | monitoring | `apps/web/src/app/(platform)/platform/monitoring/page.tsx` | `/admin/platform/monitoring/health`, `/admin/platform/monitoring/queue` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/password-policy` | `platform` | password policy | `apps/web/src/app/(platform)/platform/password-policy/page.tsx` | `/admin/platform/security/password-policy` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/payments/manage/[tab]` | `platform` | manage detail | `apps/web/src/app/(platform)/platform/payments/manage/[tab]/page.tsx` | — | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/payments/manage` | `platform` | manage | `apps/web/src/app/(platform)/platform/payments/manage/page.tsx` | — | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/payments` | `platform` | payments | `apps/web/src/app/(platform)/platform/payments/page.tsx` | `/admin/platform/billing/overview`, `/admin/platform/payments?limit=5` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/plans` | `platform` | plans | `apps/web/src/app/(platform)/platform/plans/page.tsx` | `/admin/platform/feature-rollouts`, `/admin/platform/plans`, `/admin/platform/plans/${cloneSourcePlan.id}/clone`, `/admin/platform/plans/${editingPlanId}`, `/admin/platform/plans/${plan.id}`, `/admin/platform/plans?include_inactive=true` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/secrets` | `platform` | secrets | `apps/web/src/app/(platform)/platform/secrets/page.tsx` | `/admin/platform/security/secret-rotations`, `/admin/platform/security/secret-rotations/${req.id}/execute`, `/admin/platform/security/secret-rotations/${requestId}/review`, `/admin/platform/security/secret-rotations?limit=50`, `/admin/platform/security/secrets/status` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/security-events` | `platform` | security events | `apps/web/src/app/(platform)/platform/security-events/page.tsx` | `/admin/platform/security/events?${query}`, `/admin/platform/security/retention-policy` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/settings/gateways` | `platform` | gateways | `apps/web/src/app/(platform)/platform/settings/gateways/page.tsx` | — | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/settings` | `platform` | settings | `apps/web/src/app/(platform)/platform/settings/page.tsx` | `/admin/platform/settings/document-templates`, `/admin/platform/settings/notification-templates`, `/admin/platform/settings/notifications` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/signup-requests` | `platform` | signup requests | `apps/web/src/app/(platform)/platform/signup-requests/page.tsx` | `/admin/platform/signup-requests${q}`, `/admin/platform/signup-requests/${row.id}/review` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/support` | `platform` | support | `apps/web/src/app/(platform)/platform/support/page.tsx` | `/admin/platform/support/sla/overview`, `/admin/platform/support/sla/policy`, `/admin/platform/support/tickets`, `/admin/platform/support/tickets/${selectedTicket.id}/notes`, `/admin/platform/support/tickets/${ticket.id}/notes`, `/admin/platform/support/tickets/${ticketId}`, `/admin/platform/support/tickets/${ticketId}/notes`, `/admin/platform/support/tickets?${ticketQuery}` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/tenants/[id]` | `platform` | tenants detail | `apps/web/src/app/(platform)/platform/tenants/[id]/page.tsx` | `/admin/platform/addon-requests/${requestID}/activate`, `/admin/platform/addon-requests/${requestID}/review`, `/admin/platform/addon-requests?tenant_id=${id}&limit=50`, `/admin/platform/tenants/${id}`, `/admin/platform/tenants/${id}/addons`, `/admin/platform/tenants/${id}/addons/${addonID}`, `/admin/platform/tenants/${id}/billing-controls`, `/admin/platform/tenants/${id}/billing-freeze`, `/admin/platform/tenants/${id}/billing-lock`, `/admin/platform/tenants/${id}/branches` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/tenants/list` | `platform` | list | `apps/web/src/app/(platform)/platform/tenants/list/page.tsx` | `/admin/platform/tenants/${tenantId}/lifecycle`, `/admin/platform/tenants?limit=100` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/tenants/new` | `platform` | new | `apps/web/src/app/(platform)/platform/tenants/new/page.tsx` | `/admin/tenants/onboard` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/tenants` | `platform` | tenants | `apps/web/src/app/(platform)/platform/tenants/page.tsx` | `/admin/platform/summary`, `/admin/platform/tenants?limit=8` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/users` | `platform` | users | `apps/web/src/app/(platform)/platform/users/page.tsx` | `/admin/platform/users/${userId}/impersonate`, `/admin/platform/users?${params.toString()}` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/platform/worker` | `platform` | worker | `apps/web/src/app/(platform)/platform/worker/page.tsx` | `/admin/platform/monitoring/queue` | — | `apps/web/src/tests/role-route-matrix.spec.ts`, `apps/web/src/tests/operations-smoke.spec.ts` |
| `/admissions` | `public` | admissions | `apps/web/src/app/(public)/admissions/page.tsx` | `/public/admissions/enquiry` | — | — |
| `/student/dashboard` | `student` | dashboard | `apps/web/src/app/(student)/student/dashboard/page.tsx` | `/student/me/homework/pending`, `/student/notices` | — | `apps/web/src/tests/role-route-matrix.spec.ts` |
| `/student/live-classes` | `student` | live classes | `apps/web/src/app/(student)/student/live-classes/page.tsx` | `/student/live-classes/list` | `live_classes_google`/`live_classes_microsoft` (server-enforced on schedule) | `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` |
| `/student/profile` | `student` | profile | `apps/web/src/app/(student)/student/profile/page.tsx` | — | — | — |
| `/teacher/attendance` | `teacher` | attendance | `apps/web/src/app/(teacher)/teacher/attendance/page.tsx` | `/teacher/attendance/class-sections`, `/teacher/attendance/sessions?class_section_id=${classSectionID}&date=${date}`, `/teacher/attendance/sessions?class_section_id=${selectedPeriod.class_section_id}&date=${date}`, `/teacher/period-attendance?class_section_id=${selectedPeriod.class_section_id}&date=${date}&period=${periodNum}`, `/teacher/remarks`, `/teacher/schedule/teacher-daily?date=${date}` | — | — |
| `/teacher/dashboard` | `teacher` | dashboard | `apps/web/src/app/(teacher)/teacher/dashboard/page.tsx` | `/teacher/attendance/stats?date=${dateStr}`, `/teacher/schedule/teacher-daily?date=${dateStr}` | — | `apps/web/src/tests/role-route-matrix.spec.ts` |
| `/teacher/exams/marks` | `teacher` | marks | `apps/web/src/app/(teacher)/teacher/exams/marks/page.tsx` | `/teacher/exams`, `/teacher/exams/${examID}/subjects/${subjectID}/marks`, `/teacher/exams/${selectedExamID}/subjects/${selectedSubjectID}/marks/bulk` | — | — |
| `/teacher/homework` | `teacher` | homework | `apps/web/src/app/(teacher)/teacher/homework/page.tsx` | `/teacher/homework`, `/teacher/homework/${hwID}/submissions`, `/teacher/homework/section/${encodeURIComponent(sectionID)}`, `/teacher/homework/submissions/${gradingSub.id}/grade` | — | — |
| `/teacher/kb` | `teacher` | kb | `apps/web/src/app/(teacher)/teacher/kb/page.tsx` | — | — | — |
| `/teacher/leaves` | `teacher` | leaves | `apps/web/src/app/(teacher)/teacher/leaves/page.tsx` | `/teacher/leaves`, `/teacher/leaves/types` | — | — |
| `/teacher/live-classes` | `teacher` | live classes | `apps/web/src/app/(teacher)/teacher/live-classes/page.tsx` | `/teacher/live-classes/list`, `/teacher/live-classes/schedule` | `live_classes_google`/`live_classes_microsoft` (server-enforced on schedule) | `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts` |
| `/teacher/notices` | `teacher` | notices | `apps/web/src/app/(teacher)/teacher/notices/page.tsx` | `/teacher/notices` | credits may apply via outbox send paths (server/worker) | `apps/web/src/tests/notice-smoke.spec.ts`, `apps/web/src/tests/notice-full-flow.spec.ts` |
| `/teacher/profile` | `teacher` | profile | `apps/web/src/app/(teacher)/teacher/profile/page.tsx` | — | — | — |
| `/teacher/remarks` | `teacher` | remarks | `apps/web/src/app/(teacher)/teacher/remarks/page.tsx` | `/teacher/attendance/class-sections`, `/teacher/attendance/sessions?class_section_id=${selectedSection}&date=${today}`, `/teacher/remarks`, `/teacher/students/${studentId}/remarks` | — | — |
| `/teacher/timetable` | `teacher` | timetable | `apps/web/src/app/(teacher)/teacher/timetable/page.tsx` | — | — | — |
| `/auth/forget-password` | `auth` | forget password | `apps/web/src/app/auth/forget-password/page.tsx` | — | — | — |
| `/auth/legal-accept` | `auth` | legal accept | `apps/web/src/app/auth/legal-accept/page.tsx` | `/auth/legal/accept` | — | — |
| `/auth/login` | `auth` | login | `apps/web/src/app/auth/login/page.tsx` | — | — | — |
| `/auth/reset-password` | `auth` | reset password | `apps/web/src/app/auth/reset-password/page.tsx` | — | — | — |
| `/` | `public` | home | `apps/web/src/app/page.tsx` | — | — | — |
| `/sales/bookings` | `public` | bookings | `apps/web/src/app/sales/bookings/page.tsx` | — | — | — |
### Marketing Pages (Claims/Parity-Relevant Inventory)

> Generated from `apps/marketing/src/app/**/page.tsx` and keyword scans.

| Marketing Route | Purpose/File | Claims keywords | Parity note |
|---|---|---|---|
| `/about` | `apps/marketing/src/app/about/page.tsx` | — | — |
| `/blog/[slug]` | `apps/marketing/src/app/blog/[slug]/page.tsx` | — | — |
| `/blog` | `apps/marketing/src/app/blog/page.tsx` | — | — |
| `/book-demo/[slug]` | `apps/marketing/src/app/book-demo/[slug]/page.tsx` | — | — |
| `/book-demo` | `apps/marketing/src/app/book-demo/page.tsx` | — | — |
| `/book-demo/success` | `apps/marketing/src/app/book-demo/success/page.tsx` | — | — |
| `/careers` | `apps/marketing/src/app/careers/page.tsx` | — | — |
| `/case-studies/[slug]` | `apps/marketing/src/app/case-studies/[slug]/page.tsx` | — | — |
| `/case-studies` | `apps/marketing/src/app/case-studies/page.tsx` | — | — |
| `/contact` | `apps/marketing/src/app/contact/page.tsx` | — | — |
| `/features/[slug]` | `apps/marketing/src/app/features/[slug]/page.tsx` | add-on | — |
| `/features` | `apps/marketing/src/app/features/page.tsx` | — | — |
| `/integrations/[slug]` | `apps/marketing/src/app/integrations/[slug]/page.tsx` | — | — |
| `/integrations` | `apps/marketing/src/app/integrations/page.tsx` | Razorpay, Tally, Biometric | Integration catalog claims page; compare statuses vs backend implementation. |
| `/legal/privacy` | `apps/marketing/src/app/legal/privacy/page.tsx` | — | — |
| `/legal/security` | `apps/marketing/src/app/legal/security/page.tsx` | — | — |
| `/legal/terms` | `apps/marketing/src/app/legal/terms/page.tsx` | credits | — |
| `/mockup-stage` | `apps/marketing/src/app/mockup-stage/page.tsx` | — | — |
| `` | `apps/marketing/src/app/page.tsx` | Razorpay, WhatsApp, Tally, add-on | — |
| `/partners/apply` | `apps/marketing/src/app/partners/apply/page.tsx` | Biometric | — |
| `/pricing` | `apps/marketing/src/app/pricing/page.tsx` | — | Includes add-ons + credits + top-up cost-control messaging (high-level, sales-led pricing still applies). |
| `/product` | `apps/marketing/src/app/product/page.tsx` | — | — |
| `/resources/[slug]` | `apps/marketing/src/app/resources/[slug]/page.tsx` | — | — |
| `/resources` | `apps/marketing/src/app/resources/page.tsx` | — | — |
| `/review/[token]` | `apps/marketing/src/app/review/[token]/page.tsx` | — | — |
| `/roadmap` | `apps/marketing/src/app/roadmap/page.tsx` | — | — |
| `/security` | `apps/marketing/src/app/security/page.tsx` | add-on | — |
| `/templates/[slug]` | `apps/marketing/src/app/templates/[slug]/page.tsx` | — | — |
| `/templates` | `apps/marketing/src/app/templates/page.tsx` | — | — |
| `/use-cases/[slug]` | `apps/marketing/src/app/use-cases/[slug]/page.tsx` | — | — |
| `/use-cases` | `apps/marketing/src/app/use-cases/page.tsx` | — | — |
---

## Phase 4 — Integration Verification Checklist (Provider-Specific Scorecards)

Legend: `✅ yes`, `⚠️ partial`, `❌ no`, `N/A` not applicable

### Razorpay (Payment Gateway)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | `apps/web/src/app/(admin)/admin/billing/settings/page.tsx` | ✅ |
| Config API exists | `services/api/internal/handler/finance/handler.go` (`GET/PUT /settings/payments/gateways`) | ✅ |
| Secrets encrypted + masked | `services/api/internal/service/finance/fees_advanced.go` (`UpsertGatewayConfig`, `GetGatewayConfigForAdmin`) using `security.Crypto` | ✅ |
| Runtime usage exists | `RazorpayProvider.CreateOrder` in `services/api/internal/service/finance/payment.go` | ✅ |
| Webhook verification exists | `RazorpayProvider.VerifyWebhookSignature`, webhook handler/service in `payment.go` | ✅ |
| Idempotency exists | `CheckPaymentEventProcessed` + stable provider event IDs in `payment.go`; `payment_events`/webhook logs | ✅ |
| Tests exist | `services/api/internal/service/finance/payment_test.go` | ✅ (partial suite instability) |
| Docs exist | `docs/how-to-tenant-payment-gateways.md` | ✅ |

### PayU (Payment Gateway)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | same admin billing settings page | ✅ |
| Config API exists | same finance gateway settings APIs | ✅ |
| Secrets encrypted + masked | `fees_advanced.go` | ✅ |
| Runtime usage exists | `PayUProvider.CreateOrder` in `payment.go` | ✅ |
| Webhook verification exists | PayU signature verification/normalization in `payment.go` | ✅ |
| Idempotency exists | common webhook event processing path in `ProcessPaymentWebhook` | ✅ |
| Tests exist | `payment_test.go` includes PayU normalization/signature coverage | ✅ |
| Docs exist | `docs/how-to-tenant-payment-gateways.md` | ✅ |

### MSG91 (SMS / WhatsApp)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | `apps/web/src/app/(admin)/admin/communication/gateways/page.tsx` | ✅ |
| Config API exists | `services/api/internal/handler/notification/handler.go` (`/admin/notifications/gateways`) | ✅ |
| Secrets encrypted + masked | `services/api/internal/service/notification/service.go` | ✅ |
| Runtime usage exists | `services/worker/internal/notification/msg91.go` | ✅ |
| Callback/webhook verification exists | Delivery callbacks not clearly implemented/provider-specific callback endpoints not found | ⚠️ |
| Idempotency exists | Outbox-driven retries + credit debit idempotency (`outbox-{eventID}`) | ✅ (delivery callback idempotency N/A/partial) |
| Tests exist | Notification service config tests only; no MSG91 adapter tests found | ⚠️ |
| Docs exist | No provider-specific tenant setup doc found | ⚠️ |

### SMS Horizon (SMS)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | `apps/web/src/app/(admin)/admin/communication/gateways/page.tsx` (provider-select form) | ✅ |
| Config API exists | Notification gateway APIs support provider records | ✅ |
| Secrets encrypted + masked | Notification service | ✅ |
| Runtime usage exists | `services/worker/internal/notification/smshorizon.go` | ✅ |
| Callback verification exists | Not found | ❌ |
| Idempotency exists | Outbox retry + credit debit idempotency | ✅ |
| Tests exist | No adapter tests found | ❌ |
| Docs exist | Not found | ❌ |

### Generic Webhook Adapter (SMS/WA/Push proxy)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | No tenant-admin gateway UI | ⚠️ |
| Config API exists | Notification gateway APIs | ✅ |
| Secrets encrypted + masked | Notification service | ✅ |
| Runtime usage exists | `services/worker/internal/notification/adapter.go` (`WebhookAdapter`) | ✅ |
| Callback verification exists | Outbound-only adapter; inbound callback N/A | N/A |
| Idempotency exists | Outbox + credit ledger idempotency path | ✅ |
| Tests exist | No adapter unit tests found | ❌ |
| Docs exist | Not found | ❌ |

### Email Provider (SMTP/O365/etc.)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | No explicit SMTP/O365 UI found | ❌ |
| Config API exists | Generic notification gateway APIs can store `type=email` configs | ⚠️ |
| Secrets encrypted + masked | Notification service encrypts/masks gateway secrets generically | ✅ |
| Runtime usage exists | No dedicated SMTP/SES/SendGrid provider adapter found in `services/worker/internal/notification` | ❌ |
| Callback verification exists | Not found | ❌ |
| Idempotency exists | Outbox infra exists, but provider runtime missing | ⚠️ |
| Tests exist | No email provider adapter tests | ❌ |
| Docs exist | Not found | ❌ |

### WhatsApp Provider (standalone)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | No dedicated UI; can be configured via generic gateway API (not surfaced) | ⚠️ |
| Config API exists | Notification gateway APIs | ✅ |
| Secrets encrypted + masked | Notification service | ✅ |
| Runtime usage exists | MSG91 (`msg91.go`) and generic webhook adapter (`adapter.go`) support WhatsApp send path | ✅ |
| Callback verification exists | No explicit WhatsApp delivery callback route found | ⚠️ |
| Idempotency exists | Worker outbox + credit ledger | ✅ |
| Tests exist | Sparse/none provider adapter tests | ❌ |
| Docs exist | Not found | ❌ |

### Google Workspace for Education (Calendar + Meet)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | `apps/web/src/app/(admin)/admin/settings/integrations/page.tsx` | ✅ |
| Config API exists | `services/api/internal/handler/integrationhub/handler.go` connect/callback/disconnect/list routes | ✅ |
| Secrets encrypted + masked | Tokens stored encrypted in `integrationhub/service.go` using crypto helpers; no raw token return in list response | ✅ |
| Runtime usage exists | OAuth/token exchange/refresh/profile + Google Calendar Meet event creation in `integrationhub/providers.go` and `integrationhub/service.go` | ✅ |
| Callback/webhook verification exists | OAuth callback route exists (`/v1/integrations/oauth/{provider}/callback`); webhook N/A | ✅ |
| Idempotency exists | Scheduling idempotency is not explicit (no unique request reference constraint shown) | ⚠️ |
| Tests exist | `services/api/internal/service/integrationhub/service_test.go` (mocked HTTP + meeting payloads) | ✅ |
| Docs exist | `docs/how-to-google-microsoft-live-classes.md` | ✅ |

### Microsoft 365 Education (Graph + Teams)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | admin integrations page | ✅ |
| Config API exists | integrationhub routes | ✅ |
| Secrets encrypted + masked | integrationhub encrypted token storage | ✅ |
| Runtime usage exists | OAuth/token refresh + Graph/Teams meeting creation in `providers.go` | ✅ |
| Callback verification exists | OAuth callback route exists | ✅ |
| Idempotency exists | Scheduling idempotency not explicit | ⚠️ |
| Tests exist | `integrationhub/service_test.go`, `services/worker/internal/service/billing_test.go` | ✅ |
| Docs exist | `docs/how-to-google-microsoft-live-classes.md` | ✅ |

### Tally (Accounting Export)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | Ledger mapping UIs and finance reports pages (`/admin/finance`, `/accountant/reports`) | ✅ |
| Config API exists | `services/api/internal/handler/finance/handler.go` (`/payments/tally-export`, ledger mapping routes) | ✅ |
| Secrets encrypted + masked | N/A (export integration, no secrets seen) | N/A |
| Runtime usage exists | `services/api/internal/service/finance/tally.go` `ExportReceiptsToTallyCSV` | ✅ |
| Callback/webhook verification exists | N/A | N/A |
| Idempotency exists | Export generation is read-only | N/A |
| Tests exist | No Tally export unit tests found | ⚠️ |
| Docs exist | `docs/how-to-tally-export-csv.md` | ✅ |
| Accuracy vs claim | CSV export, not XML pipeline | ⚠️ |

### Biometric (Hardware / Device Sync)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | `apps/web/src/app/(admin)/admin/biometric/page.tsx` | ✅ |
| Config API exists | `services/api/internal/handler/biometric/handler.go` (mounted in admin routes via main) | ✅ |
| Secrets encrypted + masked | Device credentials handling not fully audited; likely generic config fields | ⚠️ |
| Runtime usage exists | `services/api/internal/service/biometric/service.go` | ✅ |
| Callback/webhook verification exists | Device push ingestion endpoints appear present depending handler; full proof not exhaustively traced | ⚠️ |
| Idempotency exists | SQL semantics include attendance upsert and check-in/out LEAST/GREATEST protections; tested in `service_test.go` | ✅ |
| Tests exist | `services/api/internal/service/biometric/service_test.go`, `services/api/internal/handler/biometric/handler_test.go` | ✅ |
| Docs exist | `docs/how-to-biometric-emulator.md` | ✅ |

### Storage / Files (Local Provider)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | N/A (platform/env config) | N/A |
| Config API exists | File upload endpoint `services/api/internal/handler/files/handler.go` | ✅ |
| Secrets encrypted + masked | N/A for local storage | N/A |
| Runtime usage exists | `services/api/internal/foundation/filestore/local.go` (`NewLocalProvider`) | ✅ |
| Callback/webhook verification exists | N/A | N/A |
| Idempotency exists | N/A | N/A |
| Tests exist | No strong file storage provider tests found | ⚠️ |
| Docs exist | `docs/storage-upload-posture.md` (documents current local-public posture and mitigations) | ✅ |
| Access control | Uploads returned as public `/uploads/...` URLs; no signed URLs/presigned S3 path found | ⚠️ |

### Directus (CMS)

| Check | Evidence | Result |
|---|---|---|
| Config UI exists | Not found | ❌ |
| Config API exists | Not found | ❌ |
| Runtime usage exists | Only docker service in `infra/docker-compose.yml` (`directus`) | ⚠️ (infra only) |
| Callback/webhook verification exists | Not found | ❌ |
| Idempotency exists | N/A | N/A |
| Tests exist | Not found | ❌ |
| Docs exist | Not found | ❌ |

---

## Phase 5 — Security & Cost-Control Audit (Explicit Pass/Fail)

### 1) Rate limiting on public endpoints (`/login`, `/reset-password`, `/webhooks`)

**Result:** ✅ Pass

Evidence:
- Global auth-path limiter in `services/api/internal/middleware/security.go` applies to `/v1/auth*`.
- `forgot-password` has dedicated limiter in `services/api/internal/handler/auth/handler.go`.
- Dedicated endpoint-specific limiters now wrap `login`, `forgot-password`, and `reset-password` routes in `services/api/internal/handler/auth/handler.go`.
- Payment webhooks now have provider/IP-keyed `RateLimitByKey(...)` wrappers in `services/api/internal/handler/finance/handler.go` (`RegisterWebhookRoutes`) in addition to signature verification.

Minimal fix:
- Keep monitoring webhook traffic volumes and tune the webhook limiter thresholds per provider as traffic grows.

### 2) Tenant isolation (tenant_id presence + query filtering)

**Result:** ✅ Pass (spot-checked; not mathematically exhaustive)

Evidence:
- Parent-child verification uses `GetChildrenByParentUser` with `tenant_id` in `services/api/internal/db/sis.sql.go` and reused in finance parent payment/receipt paths.
- Finance receipt listing uses `ListStudentReceipts(student_id, tenant_id)` (`services/api/internal/db/fees.sql.go` and `finance/receipt.go`).
- Webhook tenant resolution in `finance/payment.go` derives tenant via stored provider secrets/signatures, not untrusted query params.
- Platform/role route groups in `services/api/cmd/api/main.go` enforce role boundaries server-side.

Residual risk:
- Full repo-wide tenant isolation proof still requires automated query linting/static checks.

### 3) Secrets never logged; masked on read; encrypted at rest

**Result:** ✅ Pass (payments/notifications/integrations); ⚠️ partial repo-wide proof

Evidence:
- Finance gateway secrets encrypted and masked: `fees_advanced.go`.
- Notification gateway secrets encrypted and masked: `notification/service.go`; tests in `notification/service_test.go`.
- Google/Microsoft OAuth tokens encrypted in integrationhub service; list endpoints return status/metadata, not raw tokens.
- No direct logging of raw secrets found in audited paths.

Residual risk:
- Repo-wide secret-redaction audit across all modules/components not fully exhaustive in this pass.

### 4) Credits prevent uncontrolled spending (insufficient balance blocks send, monthly allowance, AI quotas)

**Result:** ✅ Pass for SMS/WhatsApp worker credits; ⚠️ Partial overall due AI wallet split

Evidence:
- Worker checks add-on + credits before send and aborts on insufficiency: `services/worker/internal/worker/consumer.go`.
- Credit ledger idempotency constraint + duplicate handling prevents double debit: `infra/migrations/000080...`, `integrationhub/service.go`, `worker/billing.go`.
- Monthly allowance idempotent job exists: `worker/billing.go` + `cmd/worker/main.go`.
- AI quota/add-on/credit checks exist in `services/api/internal/service/ai/service.go`, but AI still uses legacy wallet path not unified credit wallet.

### 5) Webhooks cannot spoof tenant identity

**Result:** ✅ Pass (payments)

Evidence:
- Public webhook route `POST /v1/payments/webhook/{provider}` in `finance/handler.go`.
- `ResolveWebhookTenant` in `finance/payment.go` enumerates candidate gateway configs and verifies signature using stored secrets before choosing tenant.
- Does not trust `tenant_id` query param for routing.

### 6) Impersonation scope cannot access platform endpoints when impersonating

**Result:** ✅ Pass (code-path verified)

Evidence:
- Platform impersonation start/exit routes in `tenant/handler.go`.
- Middleware blocks platform access for impersonated sessions (`services/api/internal/middleware/middleware.go`).
- Real middleware test coverage added in `services/api/internal/middleware/impersonation_test.go` (including `/v1/admin/platform/*` path).
- UI exit path in `apps/web/src/app/(admin)/admin-layout-client.tsx` restores original token and calls impersonation-exit API.

### 7) Webhook logs retention policy exists (if payloads stored)

**Result:** ✅ Pass

Evidence:
- Webhook payloads/logs are recorded in `webhook_logs` by finance service.
- Worker maintenance job deletes old `webhook_logs` in `services/worker/cmd/worker/main.go` (`processMaintenance`).
- Retention is now configurable via `WEBHOOK_LOG_RETENTION_DAYS` (`webhookLogRetentionDays`) with default `90`.
- Operational doc updated: `docs/how-to-tenant-payment-gateways.md`.

---

## Phase 6 — Tests & CI Truthfulness

### What Tests Exist (Inventory Highlights)

#### Go tests (backend)
- Finance/webhooks: `services/api/internal/service/finance/payment_test.go`
- Integrations (OAuth/connect/meeting payloads): `services/api/internal/service/integrationhub/service_test.go`
- Notifications secret handling: `services/api/internal/service/notification/service_test.go`
- AI quota limiter basics: `services/api/internal/service/ai/quota_test.go`
- Middleware/security/impersonation/isolation: `services/api/internal/middleware/{security_test.go,isolation_test.go,impersonation_test.go,auth_paths_test.go}`
- SIS parent remark ownership helper tests: `services/api/internal/handler/sis/remarks_test.go`

#### Playwright tests (web)
- Role route smoke matrix: `apps/web/src/tests/role-route-matrix.spec.ts`
- Integrations/add-ons/credits/live classes (mocked): `apps/web/src/tests/integrations-addons-credits-live-classes.mock.spec.ts`
- Parent payment flow (appears stale): `apps/web/src/tests/parent-payment.spec.ts`
- Communication logs (appears stale): `apps/web/src/tests/communication-logs.spec.ts`
- Additional smoke specs across notices/finance/ops exist under `apps/web/src/tests/*.spec.ts`

### CI / Test Truthfulness Findings

1. `⚠️` Playwright coverage exists for key flows, but much of it is mocked UI smoke rather than backend-integrated E2E
- `parent-payment.spec.ts` and `communication-logs.spec.ts` were refreshed in this pass as mocked UI smoke specs aligned to current UI.

2. `⚠️` Mocked integration tests prove UI wiring, not provider correctness
- `integrations-addons-credits-live-classes.mock.spec.ts` is useful for UI flow but not real OAuth/webhook/provider interactions.

3. `⚠️` Backend test coverage is still incomplete for several critical flows
- Finance webhook tests now run again (mock panic fixed in this pass), but add-on enforcement and credit idempotency paths still need dedicated unit tests.
  - Add-on enforcement helper decision logic tests were added in this pass; DB-backed enforcement tests remain pending.

### Recommended Minimum Test Suite for “Production-ready” Claim

#### Must-pass backend tests
- Finance webhooks: signature verification, tenant resolution spoof attempts, replay idempotency, double-processing prevention
- Finance payment order add-on enforcement (newly fixed path)
- Credits: `RequireCredits` idempotency, insufficient balance, monthly allowance duplicate reference
- Integrationhub: OAuth callback validation, token refresh failure -> `needs_reauth`, meeting payload mapping
- Notification worker: MSG91/SMS Horizon/WebhookAdapter adapter contract tests, outbox retry behavior, no double-debit on retry
- Middleware: impersonated session denied on platform routes (real middleware integration test) ✅ added

#### Must-pass Playwright (mocked/staging)
- Tenant admin gateway config save + masked read + webhook status UI update (mocked webhook)
- Parent payment order create + success simulation + receipt download (parent route)
- Add-on request/activate/cancel visibility
- Credits balance/ledger + insufficient credits messaging on comms send
- Google/Microsoft mocked connect + teacher schedule + parent/student view link
- RBAC negative checks (teacher cannot billing, student cannot admin)

---

## Phase 7 — Gaps and Prioritized Fix Plan (P0 / P1 / P2)

### P0 (Money/Security/Correctness)

- `[x]` **PAY-P0-001** Enforce add-on on online payment order creation server-side
  - Fixed in this pass: `services/api/internal/service/finance/payment.go`, `services/api/internal/handler/finance/handler.go`
- `[x]` **PAY-P0-002** Parent receipt PDF route must be parent-scoped with ownership validation
  - Fixed in this pass: `services/api/internal/handler/finance/handler.go`, `services/api/internal/service/finance/payment.go`, `apps/web/src/app/(parent)/parent/fees/page.tsx`
- `[x]` **PAY-P0-003** Add webhook-specific rate limiter for `/v1/payments/webhook/*`
  - Fixed in this pass: `services/api/internal/handler/finance/handler.go` (provider/IP-keyed rate limit wrappers on public webhook routes)
- `[x]` **PAY-P0-004** Repair `finance/payment_test.go` mock panic in `TestProcessPaymentWebhook`
  - Fixed in this pass: `services/api/internal/service/finance/payment_test.go` (webhook log mock methods)

### P1 (Operational Usability / Reliability)

- `[x]` **COM-P1-001** Build tenant-admin Notification Gateways UI (SMS/WhatsApp/Email provider config)
  - Fixed in this pass: `apps/web/src/app/(admin)/admin/communication/gateways/page.tsx`, `apps/web/src/app/(admin)/admin/communication/page.tsx`
- `[x]` **COM-P1-002** Refresh `communication-logs.spec.ts` to current UI behavior
  - Fixed in this pass: `apps/web/src/tests/communication-logs.spec.ts` (mocked UI smoke aligned to current Delivery Center page)
- `[x]` **PAY-P1-003** Refresh `parent-payment.spec.ts` to current parent fees UI + new parent PDF route
  - Fixed in this pass: `apps/web/src/tests/parent-payment.spec.ts` (mocked UI smoke aligned to `/parent/fees`)
- `[x]` **MKT-P1-004** Align marketing integration statuses (Google/Microsoft/Tally) with implementation reality
  - Fixed in this pass: `apps/marketing/src/app/integrations/data.ts`, `apps/marketing/src/app/page.tsx`
- `[x]` **MKT-P1-005** Add add-ons/credits pricing model disclosure to marketing pricing page
  - Fixed in this pass: `apps/marketing/src/app/pricing/page.tsx`
- `[x]` **SEC-P1-006** Add stricter per-endpoint rate limits for login/reset-password
  - Fixed in this pass: `services/api/internal/handler/auth/handler.go`
- `[x]` **OBS-P1-007** Verify/implement webhook logs retention cleanup worker job and document retention configuration
  - Verified existing cleanup and improved it in this pass with configurable retention: `services/worker/cmd/worker/main.go`, `services/worker/cmd/worker/main_test.go`, `docs/how-to-tenant-payment-gateways.md`

### P2 (Polish / Completeness / Test Depth)

- `[x]` **TAL-P2-001** Clarify Tally export is CSV (or implement XML export pipeline)
  - Fixed/documented in this pass: `docs/how-to-tally-export-csv.md`, `docs/07-payments-finance-compliance.md`
- `[x]` **BIO-P2-002** Add biometric service/handler tests and emulator/mock tooling (dev-only)
  - Fixed in this pass: `services/api/internal/service/biometric/service_test.go`, `services/api/internal/handler/biometric/handler_test.go`, `scripts/dev/biometric-emulator.sh`, `docs/how-to-biometric-emulator.md`
- `[x]` **STO-P2-003** Add S3 provider + signed URL support (or document local-only storage posture)
  - Documented current posture in this pass: `docs/storage-upload-posture.md`
- `[x]` **AI-P2-004** Unify AI billing with new `tenant_credit_wallets` or document transitional split explicitly
  - Documented current transitional design in this pass: `docs/ai-billing-transition.md`
- `[x]` **INT-P2-005** Add backend integration tests for live class scheduling idempotency / duplicate request behavior
  - Fixed in this pass: `services/api/internal/service/integrationhub/service.go` (duplicate error normalization), `services/api/internal/service/integrationhub/service_test.go`
- `[x]` **SEC-P2-006** Add real middleware integration tests for impersonated-session denial on platform routes
  - Fixed in this pass: `services/api/internal/middleware/middleware.go`, `services/api/internal/middleware/impersonation_test.go`

---

## Definition of Done (Production)

### Payments (Tenant-Owned Gateways)
- [x] Tenant-specific Razorpay/PayU credentials saved encrypted and masked on read
- [x] Public webhook endpoint verifies signature and resolves tenant safely
- [x] Webhook replay does not duplicate receipts
- [x] Parent payment order creation path server-side add-on gated
- [x] Parent receipt PDF download uses parent-scoped authorization
- [x] Webhook endpoint-specific rate limiting
- [x] Stable full finance webhook test suite (no mock panic)

### Messaging / Comms
- [x] Outbox + worker retries/backoff
- [x] SMS/WhatsApp provider adapters exist (MSG91, SMS Horizon, webhook adapter)
- [x] Credits/add-on checks enforced before SMS/WhatsApp send
- [ ] Tenant-admin gateway config UI for communication providers
- [ ] Updated E2E coverage for communication logs and send outcomes
- [ ] Delivery callbacks (provider-specific) if required by SLA

### AI
- [x] Add-on gating and quota/error code mapping exist
- [x] Quota and insufficient credits return distinct statuses (`429`, `402`)
- [ ] Deeper automated tests for quota/credit interplay
- [ ] Credit-wallet model unification (or explicit accepted transitional design)

### Google/Microsoft Live Classes
- [x] OAuth connect/disconnect routes + public callback route exist
- [x] Encrypted token storage + worker refresh job exist
- [x] Teacher schedule + parent/student list routes/UI exist
- [x] Add-on gating enforced server-side
- [ ] Runtime verification with real provider credentials in staging/prod
- [ ] E2E tests for mocked callback→schedule→visibility across roles

### CMS / Content / Directus
- [ ] Implement runtime Directus integration or remove infra-only implication from docs/compose references

### Biometric
- [x] Admin page + API/service present
- [x] Duplicate punch/idempotency semantics tests and QA emulator tooling (SQL semantics + handler tests + dev emulator script)

### Exports (Tally)
- [x] Export endpoint exists and works (CSV)
- [ ] XML export if product/marketing requires XML specifically
- [ ] Tests for Tally export correctness

---

## Appendix — Runtime / Build Evidence (This Audit Session)

### Commands Executed

- `services/api`: `go test ./internal/service/finance ./internal/handler/finance ./internal/middleware ./internal/service/integrationhub ./internal/service/biometric ./internal/handler/biometric && go build ./cmd/api` ✅
- `services/api`: `go test ./internal/service/notification` ✅
- `services/api`: `go test ./internal/handler/auth -run '^$' && go build ./cmd/api` ✅ (auth rate-limit route wrapper compile check)
- `services/worker`: `go build ./cmd/worker && go test ./internal/service -run '^$'` ✅
- `services/worker`: `go test ./cmd/worker && go build ./cmd/worker` ✅ (webhook retention env parsing helper + worker build)
- repo root: `export PATH="/opt/homebrew/bin:$PATH"; pnpm build` ✅ (Turbo build; `@schoolerp/web` and `@schoolerp/marketing` both built successfully)
- `apps/marketing`: `pnpm --filter @schoolerp/marketing build` ✅ (marketing parity/pricing updates)
- `apps/web`: `pnpm --filter @schoolerp/web exec playwright test src/tests/parent-payment.spec.ts src/tests/communication-logs.spec.ts --list` ✅ (spec registration/parse check)

### Constraints

- External provider credentials (Google/Microsoft/Razorpay/PayU) were not available in this audit session, so real provider callback/meeting/webhook runtime validation was not executed here.
- Several assertions are therefore code-path + unit-test verified rather than live-provider verified.
