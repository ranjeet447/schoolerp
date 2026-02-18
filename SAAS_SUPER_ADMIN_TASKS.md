# SaaS Super Admin Implementation Tracker

## Purpose
This file is the single source of truth for implementing the full SaaS Super Admin control plane.

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[!]` Blocked

## Current Progress Snapshot
- `[x]` Super admin workspace routing enabled (`super_admin -> /platform/dashboard`).
- `[x]` Platform core pages added: dashboard, tenant directory, tenant detail, platform payments.
- `[x]` Platform plan management added: plans API + plans UI (create/edit/clone/status).
- `[x]` Tenant-level plan override UI added for modules, limits, and feature flags in plan assignment flow.
- `[x]` Feature-flag rollout control added (cohort filters + percentage + dry-run/apply).
- `[x]` Quota enforcement upgraded to resolve effective limits from plan/overrides for students, staff, and storage upload checks.
- `[x]` Temporary/permanent tenant limit override controls added (expiry-based override metadata).
- `[x]` Critical module lock guardrails added to prevent disabling compliance modules in plan/tenant module payloads.
- `[x]` Billing overview API + platform billing dashboard cards/trends added (MRR/ARR/churn/trials/renewals mix).
- `[x]` Platform invoices lifecycle added (create/list/resend/mark-paid/export with audit trail).
- `[x]` Tenant trial lifecycle controls added (start/extend/convert to paid with audit logging).
- `[x]` Billing configuration management added (gateway settings, tax rules, invoice template via platform settings API/UI).
- `[x]` Invoice adjustments added (refunds, partial refunds, credit notes, and adjustment ledger with audit logging).
- `[x]` Dunning and lockout controls added (retry/channel rules, grace window controls, and tenant access lock/unlock flows).
- `[x]` Internal platform user management added (create/list/update users with platform role assignment and active-state controls).
- `[x]` Platform RBAC role template matrix added (platform permission catalog + per-role template editing in UI/API).
- `[x]` Platform IP allowlist controls added for internal roles (create/list/delete CIDR/IP entries for platform access).
- `[x]` Internal session/token controls added (session listing, revoke single/all, token rotation) with session-backed JWT validation.
- `[x]` Internal MFA policy enforcement added (platform security policy API/UI + login-time MFA requirement for internal roles).
- `[x]` Break-glass emergency controls added (policy management, monitored activation with reason/ticket/duration, cooldown enforcement, and event history UI/API with audit logs).
- `[x]` Platform audit log explorer added (backend filter API + responsive UI filters for tenant/user/action/date and audit table view).
- `[x]` Audit export added (CSV/JSON export endpoint with masking + UI export buttons in audit explorer).
- `[x]` Security events stream added (record CORS denials, auth rate-limit blocks, login failures/MFA requirement, and IP allowlist blocks; listable via platform UI page).
- `[x]` Data retention policy settings added (platform-scoped retention window config API/UI with audit logging).
- `[x]` Tenant data export workflow added (request/list/download ZIP NDJSON exports per tenant with audit trail; safe defaults and restricted-table allowlist).
- `[x]` Tenant deletion workflow added (request/list/approve/reject/execute with typed confirmation and cooldown; executes safe soft-close).
- `[x]` Platform secrets/key rotation workflow added (rotation requests with 2-person approval + execute; JWT + data-encryption multi-key env support; secrets UI page).
- `[x]` Platform password policy management added (length/reuse/expiry config API/UI; enforced on onboarding and admin resets; expiry evaluated at login).
- `[x]` Risk blocks added (block/release tenant or user with TTL, session revoke, and middleware enforcement).
- `[x]` Legal docs versioning + forced re-acceptance added (publish Terms/Privacy/DPA versions and gate login until accepted).
- `[x]` Support ticketing (v1) added (create/list/update tickets with audit logging and support desk UI).
- `[x]` Support ticket notes added (internal/customer notes with attachment metadata support).
- `[x]` Support SLA added (policy config, SLA overview metrics, and manual escalation runner).
- `[x]` Incident management added (platform incidents with timeline events and status/severity tracking).
- `[x]` Tenant plan change flow added (upgrade/downgrade with proration policy and effective time).
- `[x]` Tenant management core APIs added (filters, lifecycle, defaults, plan assignment, branding/domain mapping, branch create/update/activate/deactivate, admin reset/logout, impersonation).
- `[x]` Signup request moderation UI and API flow added (approve/reject with notes).
- `[x]` Platform audit coverage expanded for super-admin actions (tenant-management mutation endpoints + signup review + impersonation entry/exit).
- `[x]` Control-plane schema migration added; verified runtime migration in target environments.

## Execution Order
1. Tenant management core and lifecycle [COMPLETED]
2. Plans/modules/feature flags [COMPLETED]
3. Subscription, billing, and payments [COMPLETED]
4. Global platform RBAC and access controls [COMPLETED]
5. Security, compliance, and governance guardrails [COMPLETED]
6. Support/ops console [COMPLETED]
7. Platform settings [COMPLETED]
8. Integrations/API management [COMPLETED]
9. Monitoring/reliability/performance [COMPLETED]
10. Data tools and danger-zone workflows [COMPLETED]
11. Content and marketing admin [COMPLETED]
12. Analytics and business dashboards [COMPLETED]
13. Hardening, audits, tests, docs, rollout [COMPLETED]

## 1) Tenant Management (Schools / Organizations)
- [x] TM-001 Tenant directory API with filters (plan, status, region, created date).
- [x] TM-002 Tenant directory UI with search, filters, sorting, pagination.
- [x] TM-003 Tenant lifecycle state machine (trial -> active -> suspended -> closed).
- [x] TM-004 Multi-campus/branches API (list/create/update/activate/deactivate).
- [x] TM-005 Branding and domain mapping API (branding config, CNAME target, SSL status).
- [x] TM-006 Manual tenant onboarding flow (create tenant + tenant admin + default config).
- [x] TM-007 Signup request moderation (approve/reject + notes + audit).
- [x] TM-008 Tenant actions: activate/suspend/terminate.
- [x] TM-009 Reset tenant admin password endpoint + force logout all sessions.
- [x] TM-010 Tenant defaults: timezone, locale, academic year.
- [x] TM-011 Assign plan and limits to tenant.
- [x] TM-012 Domain mapping UI and verification status panel.
- [x] TM-013 Impersonate tenant admin with reason, TTL, explicit exit/restore flow, and audit trail (entry/exit).
- [x] TM-014 Tenant region/shard migration explicitly marked unsupported with safe messaging in platform UI.

## 2) Plans, Modules, and Feature Flags
- [x] PL-001 Plan model and API (Basic/Pro/Enterprise/custom).
- [x] PL-002 Plan builder UI (create/edit/clone plans).
- [x] PL-003 Module toggles by plan and by tenant override.
- [x] PL-004 Feature flags by tenant/cohort with rollout percentage support.
- [x] PL-005 Usage limits model + enforcement hooks for students/staff/storage/modules.
- [x] PL-006 Temporary and permanent tenant limit overrides.
- [x] PL-007 Critical/compliance modules lock rules (cannot disable when policy-locked).
- [x] PL-008 Audit every plan/module/flag mutation.

## 3) Subscription, Billing, and Payments
- [x] BI-001 Subscription overview API (MRR, ARR, churn, trials, renewals).
- [x] BI-002 Billing dashboard UI with trends and cohort slices.
- [x] BI-003 Invoice model/endpoints (create, resend, mark paid, export).
- [x] BI-004 Credits, refunds, partial refunds, and credit notes.
- [x] BI-005 Payment gateway settings management (Razorpay/Stripe provider config).
- [x] BI-006 Tax rules (GST/VAT) and invoice template support.
- [x] BI-011 Grace period and lockout controls for non-payment.

## 4) Global User & Access Control (Platform-Level)
- [x] AC-001 Internal platform users model (super_admin, support, finance, ops, developer).
- [x] AC-002 Platform RBAC templates and permission matrix.
- [x] AC-003 Internal admin management UI (create/edit/disable users).
- [x] AC-004 Assign/revoke platform roles and permissions.
- [x] AC-005 MFA/2FA enforcement policy for platform users.
- [x] AC-006 Session/device listing and forced revoke endpoint.
- [x] AC-007 Token rotation endpoint for internal users.
- [x] AC-008 IP allowlist controls for platform access.
- [x] AC-009 Break-glass admin policy with monitored use and audit.

## 5) Security, Compliance, and Governance
- [x] SG-001 Platform audit log explorer (tenant/user/action/date filters).
- [x] SG-002 Audit export (CSV/JSON) with masking policy.
- [x] SG-003 Security events stream (anomalies, suspicious access, rate-limit events).
- [x] SG-004 Data retention and deletion policy settings.
- [x] SG-005 Tenant data export workflow (compliance request).
- [x] SG-006 Tenant deletion workflow with cooldown + approvals.
- [x] SG-007 Platform secrets/key rotation workflow.
- [x] SG-008 Password policy configuration (length/reuse/expiry).
- [x] SG-009 Risk-based tenant/user block actions.
- [x] SG-010 Legal docs versions and forced re-acceptance controls.

## 6) Support Desk & Operations Console
- [x] OP-001 Ticket model/API (create/assign/tag/close/reopen).
- [x] OP-002 Ticket notes (internal/customer-visible) and attachment metadata.
- [x] OP-003 SLA dashboard and escalation rules.
- [x] OP-004 Incident management timeline view.
- [x] OP-005 Temporary limit increase controls during incidents.
- [x] OP-006 Broadcast notifications to impacted tenants.
- [x] OP-007 Billing freeze during outage flow (policy-based).
- [x] OP-008 Optional external helpdesk integration adapter [ENABLED].

## 7) Platform Settings (Global Configuration)
- [x] PS-001 Global settings registry (timezone/locales/currencies/channels).
- [x] PS-002 Notification sender settings (email/SMS/WhatsApp).
- [x] PS-003 Notification template manager with variable preview.
- [x] PS-004 Region-wise channel enable/disable policy.
- [x] PS-005 Global master data templates (holidays/grade systems).
- [x] PS-006 Document templates (report card/certificate/receipt).
- [x] PS-007 Storage rules config (bucket/retention/lifecycle).

## 8) Integrations & API Management
- [x] IN-001 API key management (create/revoke/rotate per tenant).
- [x] IN-002 OAuth app management (platform scope).
- [x] IN-003 Webhook endpoints registry and event subscriptions.
- [x] IN-004 Webhook secret rotation and key versioning.
- [x] IN-005 Failed webhook replay endpoint.
- [x] IN-006 Integration health dashboard (success/failure rates).
- [x] IN-007 Integration logs viewer with payload masking/sampling.
- [x] IN-008 Per-tenant connector enable/disable controls.

## 9) Monitoring, Reliability, and Performance
- [x] MR-001 Platform health dashboard (uptime, latency, error rate).
- [x] MR-002 Queue health (pending/retries/dead letters).
- [x] MR-003 Database health view (connections/slow queries/storage).
- [x] MR-004 Tenant release/version tracking.
- [x] MR-005 Trigger background jobs safely.
- [x] MR-006 Pause/resume queues with impact warnings.
- [x] MR-007 Reprocess failed jobs.
- [x] MR-008 Maintenance mode (platform-wide or tenant-specific).
- [x] MR-009 Read-only mode controls for outage mitigation.
- [x] MR-010 Incident timeline and root-cause note management.

## 10) Data Management & Tools (Danger Zone)
- [x] DZ-001 Tenant backup trigger endpoint.
- [x] DZ-002 Restore point listing and guarded restore execution [MANDATORY 2-PERSON APPROVAL].
- [x] DZ-003 Tenant data export (students/fees/attendance/etc.).
- [x] DZ-004 Admin-safe data-fix task runner (validated tasks only).
- [x] DZ-005 Tenant merge workflow [SUPPORTED].
- [x] DZ-006 Destructive action guardrails (typed confirmation + cooldown).

## 11) Content & Marketing Admin
- [x] CM-001 Marketing/CMS content moderation hooks.
- [x] CM-002 In-app announcement banner targeting by tenant/cohort.
- [x] CM-003 Onboarding checklist/tooltips manager.
- [x] CM-004 Changelog/release notes publishing workflow.

## 12) Analytics & Business Dashboard
- [x] AN-001 Activation funnel metrics (signup -> onboarding -> active usage).
- [x] AN-002 Feature usage analytics per tenant/module.
- [x] AN-003 Revenue analytics (MRR/churn/ARPA).
- [x] AN-004 Support analytics (volume, SLA, resolution time).
- [x] AN-005 Report exports (CSV).
- [x] AN-006 Alert rules for churn risk/payment failures.
- [x] AN-007 High-value tenant flagging and routing.

## Practical Extras (Required)
- [x] EX-001 Impersonation guardrails: reason required, TTL, explicit exit, fully audited.
- [x] EX-002 Mandatory audit logging for every super-admin action endpoint.
- [x] EX-003 Two-person approval for destructive actions (delete tenant, restore, key rotation).
- [x] EX-004 Internal role-based UI segmentation (finance/support/dev/ops scoped views).

## Definition of Done (Global)
- [x] DO-001 Backend endpoints implemented with authz and input validation.
- [x] DO-002 Every mutation action writes structured audit logs.
- [x] DO-003 Unit/integration tests for critical flows and destructive guardrails.
- [x] DO-004 Responsive platform UI for desktop/tablet/mobile.
- [x] DO-005 Docs updated (env vars, runbooks, walkthrough).
- [x] DO-006 Production-safe defaults and feature flags for staged rollout.
