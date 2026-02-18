# Project Completion Tracker

Last Updated: 2026-02-18
Owner: Codex

## Goal
Validate and complete end-to-end readiness across APIs, services, responsive UI flows, API integrations, and enterprise-grade hardening.

## Status Legend
- `DONE` = implemented, verified, and committed
- `IN_PROGRESS` = currently being implemented or verified
- `PENDING` = queued
- `BLOCKED` = cannot be completed in current environment

## Work Plan
1. `DONE` Web route/auth integration cleanup (commit: `b72396e`)
2. `DONE` API auth/cors/access hardening (commit: `acb36fb`)
3. `DONE` Encryption key hardening via env config (commit: `01d0a5e`)
4. `DONE` Marketing/public API completion (demo booking, contact, reviews, partner applications, case-study PDF job flow)
5. `DONE` Marketing frontend API integration (replace stubs/fallback mocks with real endpoints)
6. `DONE` Sales bookings admin UI integration with backend
7. `DONE` Public admissions flow hardening (tenant resolution and captcha toggle behavior)
8. `DONE` Final verification sweep (using stable webpack build path for web)
9. `IN_PROGRESS` Remaining enterprise backlog triage and phased execution list

## Execution Log
- 2026-02-12: Added backend marketing service + handler and wired new routes in API server.
- 2026-02-12: Added public endpoints:
  - `POST /v1/public/demo-bookings`
  - `POST /v1/public/contact`
  - `POST /v1/public/partner-applications`
  - `GET /v1/public/review-requests/{token}`
  - `POST /v1/public/reviews`
  - `POST /v1/public/case-studies/{slug}/pdf`
  - `GET /v1/public/pdf-jobs/{id}`
  - `GET /v1/public/pdf-jobs/{id}/download`
- 2026-02-12: Added admin demo booking APIs:
  - `GET /v1/admin/demo-bookings`
  - `PATCH /v1/admin/demo-bookings/{id}/status`
- 2026-02-12: Replaced marketing frontend stubs for book demo, contact, partner apply, review submission, and case-study PDF polling/download.
- 2026-02-12: Replaced web sales bookings mock list with live admin API integration.
- 2026-02-12: Refactored admissions route registration into explicit public/admin paths and removed hardcoded public tenant dependency from web form.
- 2026-02-12: Added env controls:
  - `PUBLIC_DEFAULT_TENANT_ID`
  - `PUBLIC_FORM_CAPTCHA_REQUIRED`
  - `NEXT_PUBLIC_DEFAULT_TENANT_ID`
- 2026-02-12: Verification results:
  - `services/api`: `go test ./...` passed.
  - `services/worker`: `go test ./...` passed.
  - `apps/web`: `pnpm exec tsc --noEmit` passed.
  - `apps/marketing`: `pnpm exec tsc --noEmit` passed.
  - `apps/marketing`: production build passed.
  - `apps/web`: production build passed via `next build --webpack`.
- 2026-02-12: Cleared web build font dependency and implemented edit flows:
  - Enabled update API + UI flow for transport vehicles.
  - Enabled edit dialogs for transport routes and library books.

## Remaining Backlog (Phased)
- `DONE` Finance online payment hardening (real order-linking + webhook resolution; removed stubbed student fallback in finance service).
- `DONE` Driver update flow (`/admin/transport/drivers/{id}` backend + UI edit wiring).
- `DONE` Inventory edit flows (supplier/item update APIs + dialogs).
- `DONE` Attendance settings persistence UX cleanup (policy-backed save/load).
- `DONE` Replaced remaining `alert(...)` UX fallbacks with consistent toasts/stateful errors.
- `DONE` Replace local mock/setTimeout flows with API integrations (resolved 2026-02-18).
- `DONE` Complete remaining backend stubs/TODO integrations (resolved 2026-02-18).
- `DONE` Fill remaining UI data integration gaps (resolved 2026-02-18).

- 2026-02-12: Implemented transport driver update end-to-end:
  - Added `PUT /v1/admin/transport/drivers/{id}`.
  - Added backend update logic with audited raw SQL update path.
  - Wired admin drivers page + dialog edit flow to real update API.
- 2026-02-12: Implemented inventory update end-to-end:
  - Added `PUT /v1/admin/inventory/suppliers/{id}`.
  - Added `PUT /v1/admin/inventory/items/{id}`.
  - Added backend update logic with audited raw SQL update paths.
  - Wired supplier/item dialogs to create/update automatically based on edit mode.
- 2026-02-12: Attendance settings and stats hardening:
  - Added `GET /v1/admin/attendance/stats?date=YYYY-MM-DD`.
  - Replaced attendance settings stub save with policy-backed persistence via `/v1/admin/attendance/policies`.
  - Added settings load path from existing attendance policies.
- 2026-02-12: UI feedback hardening:
  - Removed `alert(...)` usage across admin/teacher/parent/public web flows.
  - Standardized to `sonner` toasts for success/error/info feedback.
- 2026-02-18: Started full-platform implementation wave execution.
  - Hardened finance online payment flow in `services/api/internal/service/finance/payment.go`.
  - `CreateOnlineOrder` now persists provider external reference and updates order state.
  - Webhook processing now resolves payment orders from webhook `order_id`, issues receipts against real student/order records, and marks orders `paid`.
  - Removed hardcoded fallback student usage in webhook receipt issuance path.
  - Verified with targeted finance service tests (`payment_test.go`).
- 2026-02-18: Completed admissions application path hardening.
  - Removed stub marker in `services/api/internal/handler/admission/admission.go` create-application route.
  - Enforced enquiry-backed application creation in `services/api/internal/service/admission/admission.go`.
  - Added validation for required `enquiry_id` and normalized application form payload with enquiry defaults.
- 2026-02-18: Completed safety and academics outbox TODO integrations.
  - Added emergency broadcast outbox event publication in `services/api/internal/service/safety/safety.go`.
  - Added homework-created outbox event publication in `services/api/internal/service/academics/service.go`.
  - Both integrations follow existing outbox/event patterns for async notification delivery.
- 2026-02-18: Completed AI provider fallback and remaining web mock-flow integrations.
  - Added Anthropic provider implementation to `services/api/internal/foundation/ai/client.go` and routed chat by provider.
  - Added parent-safe leave history API (`GET /v1/parent/leaves`) via attendance handler/service and wired parent leaves page to API-backed history refresh.
  - Added forgot-password backend endpoint (`POST /v1/auth/forgot-password`) with async outbox event publication and connected `apps/web/src/app/auth/forget-password/page.tsx` to real API calls.
- 2026-02-18: Completed library dynamic dependency integration for book dialog.
  - Added backend list endpoints `GET /v1/admin/library/categories` and `GET /v1/admin/library/authors`.
  - Added service methods to retrieve library categories/authors from database.
  - Updated `apps/web/src/components/library/book-dialog.tsx` to fetch and bind dynamic category/author options.
- 2026-02-18: Started timetable normalization to dedicated APIs (away from direct tenant-config UI writes).
  - Added `GET /v1/admin/timetable` and `PUT /v1/admin/timetable` in academics handler.
  - Added academics service methods to load/save timetable entries with validation and audit logging.
  - Refactored admin timetable UI to consume dedicated timetable endpoints instead of `/tenants/config` + `/admin/tenants/config`.
- 2026-02-18: Completed certificates workflow normalization to dedicated admin APIs.
  - Added `GET /v1/admin/certificates/requests`, `POST /v1/admin/certificates/requests`, and `POST /v1/admin/certificates/requests/{id}/status`.
  - Added certificate request service methods (list/create/status update) with validation, certificate-number generation, and audit logging.
  - Refactored `apps/web/src/app/(admin)/admin/certificates/page.tsx` to use dedicated certificate APIs instead of direct tenant-config persistence.
- 2026-02-18: Hardened admissions document workflow with dedicated settings and delete APIs.
  - Added admissions settings endpoints for document checklist types: `GET/PUT /v1/admin/admissions/settings/document-types`.
  - Added server-side document removal endpoint: `DELETE /v1/admin/admissions/applications/{id}/documents/{index}`.
  - Added admission service methods for document type retrieval/update and audited document deletion.
  - Updated admission documents dialog to fetch document types dynamically and perform real backend document deletion.
- 2026-02-18: Completed admissions workflow-policy hardening with configurable transitions and required-doc checks.
  - Added admissions workflow settings endpoints: `GET/PUT /v1/admin/admissions/settings/workflow`.
  - Added workflow settings persistence in admission service with normalization/defaulting and audit logging.
  - Enforced allowed status transitions and required-document checks in admissions status updates.
  - Updated admin admissions applications status dropdown to use workflow-configured allowed transitions.
- 2026-02-18: Added admin workflow-settings editor UI for admissions.
  - Added `Workflow Settings` dialog on applications page to edit allowed transitions and required docs per status.
  - Wired dialog save to `PUT /v1/admin/admissions/settings/workflow` and refresh via `GET /v1/admin/admissions/settings/workflow`.
- 2026-02-18: Completed teacher attendance/homework option integration (removed hardcoded/manual IDs).
  - Added teacher attendance class-section options API: `GET /v1/teacher/attendance/class-sections`.
  - Refactored teacher attendance page to load class-sections dynamically from API instead of hardcoded values.
  - Added teacher homework options API: `GET /v1/teacher/homework/options` (class-sections + subjects).
  - Refactored teacher homework page to use dropdown selectors for class section and subject instead of raw UUID input fields.
- 2026-02-18: Hardened worker notification routing for event delivery.
  - Replaced hardcoded attendance SMS recipient with guardian contact resolution via student guardians lookup.
  - Attendance absent messages now include student name when available.
  - Replaced hardcoded fee WhatsApp recipient with webhook payload contact extraction (`payload.payment.entity.contact`).
  - Added safe skip/log behavior when recipient contact is unavailable, avoiding invalid hardcoded sends.
  - Replaced `payslip.generated` stub handling with real PDF job enqueueing (`template_code: payslip`) via worker DB job queue.
  - Replaced `platform.broadcast` placeholder with tenant fan-out push delivery across student and employee recipients.
  - Updated `notice.published` delivery to use the same tenant-scoped fan-out push pipeline.
- 2026-02-18: Replaced library ISBN catalog stub with real external metadata lookup.
  - `ISBNLookup` now calls Open Library Books API with request timeout and response-status handling.
  - Added safe extraction for title, publisher, and published year from API payload.
  - Updated auto-fill path in book creation to avoid unsafe type assertions and only apply valid parsed values.
- 2026-02-18: Upgraded finance payment provider order creation toward production behavior.
  - Implemented Razorpay order creation via HTTP API (`POST /v1/orders`) with basic auth and response validation.
  - Added graceful fallback to internal deterministic order reference when Razorpay credentials are not configured (local/dev compatibility).
- 2026-02-18: Removed MFA setup placeholder account label.
  - Added auth service lookup for MFA account label using real user email/full name via `GetUserByID`.
  - Updated MFA setup handler to use resolved account label instead of hardcoded `SchoolERP User`.
- 2026-02-18: Replaced platform monitoring queue-health mock with real metrics.
  - `GetQueueHealth` now reads live outbox counts for pending, retryable failed, and dead-letter events.
  - `GetPlatformHealth` now reports queue status based on actual queue metrics and marks overall status `degraded` on queue/db issues.
- 2026-02-18: Expanded AI provider capability and runtime configurability.
  - Added Gemini provider support in AI client (`models/*:generateContent` integration with response parsing).
  - Added `AI_PROVIDER` runtime switch in AI service (`openai`, `anthropic`, `gemini`) with provider-specific API key env resolution.
  - Hardened unsupported-provider handling and config validation at service startup.
- 2026-02-18: Added production-ready notification delivery adapter path in worker.
  - Implemented webhook-based notification adapter for SMS/WhatsApp/Push delivery payloads.
  - Added env-driven worker wiring: `NOTIFICATION_WEBHOOK_URL` (+ optional `NOTIFICATION_WEBHOOK_TOKEN`) enables webhook adapter, otherwise fallback to stub.
- 2026-02-18: Hardened library audit actor attribution.
  - Replaced zero-value `UserID` audit entries in library book create/update flows with parsed actor IDs from request context.
- 2026-02-18: Hardened admissions application numbering for concurrency safety.
  - Replaced timestamp-only application number generation with date-prefixed random-suffix identifiers.
  - Added fallback generation path using nanosecond entropy when random source is unavailable.
- 2026-02-18: Hardened notices audience scoping and parent visibility filtering.
  - Updated notice-create handler to accept and normalize flexible scope payloads (`string`, `array`, or `object`) into a structured scope map.
  - Added parent-facing notice filtering by child audience (`all`, class-derived tags like `class_10`, and section-derived tags like `section_a`).
  - Preserved acknowledgment joins while restricting parent notice feed to matching scope values.
- 2026-02-18: Replaced hardcoded notice target list in admin UI with dynamic academic-structure targets.
  - Admin notices page now loads classes/sections from academic-structure APIs and builds target scope options dynamically.
  - Scope values are normalized to class/section tokens compatible with parent audience filtering.
- 2026-02-18: Replaced parent dashboard static mock content with API-backed data.
  - Parent dashboard now loads real children (`/parent/me/children`) and recent notices (`/parent/notices`).
  - Fee balance card now computes outstanding amount from live per-child fee summary endpoints.
  - Replaced static quick-action buttons/links with navigations to actual parent workflows.
- 2026-02-18: Hardened parent notices read/ack UX with typed payload normalization.
  - Normalized notice IDs/timestamps/read-state from pgtype-wrapped payloads in parent notices page.
  - Wired read-state to backend `ack_at` semantics to reflect acknowledged notices reliably.
- 2026-02-19: Completed next 10 parent/notices feature upgrades.
  1. Added child-profile attendance tab backed by parent leave API with approved/pending/rejected metrics.
  2. Added child-profile fees summary tab backed by parent fee summary API.
  3. Added child-profile receipt history rendering from parent receipts API.
  4. Added child-profile exams tab backed by parent results API with grouped subject marks.
  5. Added child-profile notices tab backed by parent notices API.
  6. Added child-profile per-tab loading/error states across attendance/fees/exams/notices.
  7. Added parent fees payload normalization for pgtype-wrapped child identity/name fields.
  8. Added persistent selected-child state in parent fees page via localStorage.
  9. Added persistent selected-child state in parent results page via localStorage.
  10. Added real CSV export for parent exam result cards (replacing toast-only download behavior).

## Known Environment Constraints
- `next build` default Turbopack path can fail in this sandbox due process/port restrictions; webpack build succeeds.
- Marketing build succeeds but shows cache write warning (`ENOSPC`) in this environment.
