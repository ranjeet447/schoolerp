# Project Completion Tracker

Last Updated: 2026-02-12
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
8. `BLOCKED` Final verification sweep (web production build blocked by external Google Fonts fetch in restricted network)
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
  - `apps/web`: production build failed due network-restricted Google Fonts fetch.

## Known Environment Constraints
- Web production build is blocked by external Google Fonts fetch in restricted network environment.
- Marketing build succeeds but shows cache write warning (`ENOSPC`) in this environment.
