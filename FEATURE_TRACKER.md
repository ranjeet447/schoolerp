# SchoolERP — Unified Implementation Tracker

**Last Updated:** 2026-02-19
**Owner:** Engineering
**Purpose:** Single source of truth for all implementation status — product features, platform admin, and execution history.

> This file supersedes and unifies: `EXECUTION_TRACKER.md`, `SAAS_SUPER_ADMIN_TASKS.md`.

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed (schema + API + UI)
- `[!]` Blocked

---

# PART A — SaaS Super Admin Control Plane ✅

> All 13 execution phases completed. See collapsed sections for detail.

<details>
<summary><strong>1) Tenant Management — 14/14 ✅</strong></summary>

- [x] TM-001 Tenant directory API with filters (plan, status, region, date)
- [x] TM-002 Tenant directory UI with search/filters/sort/pagination
- [x] TM-003 Tenant lifecycle state machine (trial → active → suspended → closed)
- [x] TM-004 Multi-campus/branches API (create/update/activate/deactivate)
- [x] TM-005 Branding and domain mapping API (CNAME, SSL status)
- [x] TM-006 Manual tenant onboarding flow
- [x] TM-007 Signup request moderation (approve/reject + audit)
- [x] TM-008 Tenant actions: activate/suspend/terminate
- [x] TM-009 Reset tenant admin password + force logout all sessions
- [x] TM-010 Tenant defaults: timezone, locale, academic year
- [x] TM-011 Assign plan and limits to tenant
- [x] TM-012 Domain mapping UI and verification panel
- [x] TM-013 Impersonate tenant admin with reason, TTL, audit trail
- [x] TM-014 Region/shard migration marked unsupported with messaging
</details>

<details>
<summary><strong>2) Plans, Modules, Feature Flags — 8/8 ✅</strong></summary>

- [x] PL-001 Plan model/API (Basic/Pro/Enterprise/custom)
- [x] PL-002 Plan builder UI (create/edit/clone)
- [x] PL-003 Module toggles by plan and tenant override
- [x] PL-004 Feature flags by tenant/cohort with rollout %
- [x] PL-005 Usage limits + enforcement (students/staff/storage)
- [x] PL-006 Temporary/permanent tenant limit overrides
- [x] PL-007 Critical module lock rules
- [x] PL-008 Audit every plan/module/flag mutation
</details>

<details>
<summary><strong>3) Billing & Payments — 7/7 ✅</strong></summary>

- [x] BI-001 Subscription overview API (MRR/ARR/churn/trials)
- [x] BI-002 Billing dashboard with trends
- [x] BI-003 Invoice lifecycle (create/resend/mark paid/export)
- [x] BI-004 Credits/refunds/credit notes
- [x] BI-005 Payment gateway settings
- [x] BI-006 Tax rules + invoice templates
- [x] BI-011 Grace period and lockout controls
</details>

<details>
<summary><strong>4) Platform RBAC & Access — 9/9 ✅</strong></summary>

- [x] AC-001 Internal platform users model
- [x] AC-002 RBAC templates + permission matrix
- [x] AC-003 Admin management UI
- [x] AC-004 Assign/revoke roles
- [x] AC-005 MFA enforcement policy
- [x] AC-006 Session/device listing + forced revoke
- [x] AC-007 Token rotation
- [x] AC-008 IP allowlist controls
- [x] AC-009 Break-glass admin policy
</details>

<details>
<summary><strong>5) Security & Compliance — 10/10 ✅</strong></summary>

- [x] SG-001–010: Audit explorer, export, security events, retention, tenant export/deletion, key rotation, password policy, risk blocks, legal docs
</details>

<details>
<summary><strong>6–13) Support, Settings, Integrations, Monitoring, Data Tools, Content, Analytics, Hardening — All ✅</strong></summary>

- [x] OP-001–008: Ticketing, SLA, incidents, broadcasts, billing freeze
- [x] PS-001–007: Global settings, notification templates, master data, document templates
- [x] IN-001–008: API keys, OAuth, webhooks, replay, integration health
- [x] MR-001–010: Platform health, queue health, DB health, maintenance mode
- [x] DZ-001–006: Backup/restore, data export, merge, guardrails
- [x] CM-001–004: CMS hooks, announcements, changelog
- [x] AN-001–007: Activation funnel, feature usage, revenue, support analytics
- [x] EX-001–004: Impersonation, audit, 2-person approval, role-based UI
- [x] DO-001–006: Backend endpoints, audit, tests, responsive UI, docs, feature flags
</details>

---

# PART B — Execution History

<details>
<summary><strong>Completed execution log (2026-02-12 → 2026-02-19)</strong></summary>

- 2026-02-12: Marketing service + public APIs (demo booking, contact, partners, reviews, case-study PDF)
- 2026-02-12: Admin demo booking APIs and web integration
- 2026-02-12: Admissions route refactoring, env controls
- 2026-02-12: Transport driver update, inventory update, attendance stats hardening
- 2026-02-12: UI feedback hardening (alert → toast migration)
- 2026-02-18: Finance online payment flow hardening (real Razorpay orders, webhook receipt)
- 2026-02-18: Admissions application, safety, academics outbox integrations
- 2026-02-18: AI provider expansion (OpenAI + Anthropic + Gemini)
- 2026-02-18: Library dynamic deps, timetable normalization, certificates workflow
- 2026-02-18: Admissions workflow policies, teacher attendance/homework options
- 2026-02-18: Worker notification routing hardening (guardian resolution, payslip PDF, broadcasts)
- 2026-02-18: ISBN lookup, Razorpay HTTP API, MFA label, platform monitoring
- 2026-02-18: Notification webhook adapter, library audit, admissions concurrency
- 2026-02-18: Notices audience scoping, parent dashboard API integration
- 2026-02-19: Child profile tabs (attendance, fees, receipts, exams, notices)
- 2026-02-19: Parent fees/results normalization, CSV export
- 2026-02-19: Fee collection UI implementation
- 2026-02-19: Operational enhancements (Staff Tasks, Transport Fuel Logs, Inventory Requisitions)
- 2026-02-19: Platform admin comprehensive audit & fixes (Granular RBAC seed, Impersonation guardrails, White-labeling DNS/SSL workflow, UI consistency)
- 2026-02-19: P0 Feature Completion (Fee Reminder Automation, Notice Attachments & Scheduling)
- 2026-02-19: P2 Batch 1: QR Gate Pass, Library Assets, Transport Fee Automation, Portfolio Aggregation, Pickup Logs, Smart Alert Templates
- 2026-02-20: Automated PTM Reminders (Logic/Worker), Student Pickup QR/OTP Verification Workflow
</details>

---

# PART C — Product Feature Modules

## Module 1: Academic Lifecycle — 80%

### 1A: Customizable Gradebook Schemas
- [x] AL-001 Grading scales table
- [x] AL-002 Exam weightage config table
- [x] AL-003 Marks aggregates table
- [x] AL-004 Board-type selector on school profile (CBSE/ICSE/State Board)
- [x] AL-005 Predefined grading templates per board
- [x] AL-006 Admin UI for grading scale management (Sync button)
- [x] AL-007 Weighted final result calculation API

### 1B: Automated Hall Ticket Generation
- [x] AL-010 Hall ticket DB table
- [x] AL-011 Hall ticket PDF template
- [x] AL-012 Hall ticket generation API
- [x] AL-013 Bulk hall ticket download
- [x] AL-014 Admin UI for hall ticket generation

### 1C: Teacher Lesson Planning & Tracking ✅
- [x] AL-020 Lesson plans table
- [x] AL-021 `UpsertLessonPlan` / `ListLessonPlans` APIs
- [x] AL-022 AI-assisted lesson plan generation
- [x] AL-023 Admin/teacher UI

### 1D: Digital Student Portfolios ✅
- [x] AL-030 Behavioral logs + health records + documents tables
- [x] AL-034 Unified portfolio aggregation page
- [x] AL-035 Portfolio PDF export

---

## Module 2: Financial Controls — 90%

### 2A: Sequential Receipt Compliance ✅
- [x] FC-001 Receipt series table · FC-002 APIs · FC-003 Enforcement

### 2B: Auto-Reconciliation via Gateway ✅
- [x] FC-010 Gateway configs · FC-011 Payment orders · FC-012 Razorpay API · FC-013 Webhook processing · FC-014 Idempotency

### 2C: Direct Tally Export ✅
- [x] FC-020 Tally mappings · FC-021 APIs · FC-022 Export endpoint

### 2D: Scholarship & Concession Management ✅
- [x] FC-030 Scholarships + concession tables · FC-033/034 All APIs

### 2E: Fee Reminder Automation ✅
- [x] FC-040 Outbox events for overdue fees
- [x] FC-041 Configurable reminder schedule per tenant
- [x] FC-042 Admin UI for reminder cadence

---

## Module 3: Campus Safety — 40%

### 3A: QR-Based Secure Gate Pass ✅
- [x] CS-001 Gate pass table · CS-002 API · CS-003 QR generation · CS-004 Scan/validate · CS-005 UI

### 3B: Visitor Photo & ID Verification
- [x] CS-010 Visitors table · CS-011 Check-in/out APIs · CS-012 Logs
- [x] CS-013 Photo upload in check-in · [x] CS-014 ID verification display

### 3C: Emergency Broadcast System ✅
- [x] CS-020 Broadcasts table · CS-021 APIs · CS-022 Outbox · CS-023 Worker delivery

### 3D: Verified Guardian Pickup Logs ✅
- [x] CS-030 Pickup auth table · CS-031 APIs
- [x] CS-032 Pickup event log table · [x] CS-033 QR/OTP verification · [x] CS-034 Parent pickup history

---

## Module 4: Automation Studio — 10%

### 4A: Automation Studio Foundations
- [x] AS-001 Automation rules table · AS-002 CRUD APIs · [x] AS-004 Execution engine
- [ ] AS-003 Visual builder UI

### 4B: Custom SMS & Email Templates
- [x] AS-010 System notification templates
- [ ] AS-012 Tenant-level template CRUD · AS-013 Editor UI · AS-014 Preview

### 4C: Time-Based Scheduled Tasks
- [ ] AS-020 Scheduled tasks table · AS-021 API · AS-022 Worker scheduler · AS-023 Config UI

### 4D: External API Webhooks
- [x] AS-030 Platform webhooks + integration logs
- [ ] AS-031 Tenant-level webhook API · AS-032 UI · AS-033 Custom subscriptions

---

## Module 5: Smart Alerts — 60%

- [x] SA-001–003 Absence auto-alerts (worker + guardian resolution + SMS) ✅
- [x] SA-010–011 Payment success receipts ✅
- [x] SA-020–021 Emergency broadcasts ✅
- [x] SA-030 Notification templates locale field
- [x] SA-031 Locale-based template routing for all events
- [x] SA-032 Admin template management UI
- [x] SA-033 Hindi/English pairs for core events (Attendance/Fees)

---

## Module 6: Notices & Circulars — 75%

- [x] NC-001–003 Role-based targeting ✅
- [x] NC-010–012 Read receipt tracking ✅
- [x] NC-020–022 Attachment support (JSONB column + upload + display) ✅
- [x] NC-030 `publish_at` field exists ✅
- [x] NC-031 Scheduled publishing worker · NC-032 Status display ✅

---

## Module 7: Discipline & Behavior — 75%

- [x] DB-001–002 Incident logs ✅
- [x] DB-010–012 Severity-based notifications (Outbox triggers)
- [x] DB-020 Behavioral logs (merit/demerit + points)
- [x] DB-021–023 Behavioral CRUD API + points view + Profile UI
- [x] DB-030–032 Confidential management notes ✅

---

## Module 8: Homework & Assignments — 100% ✅

- [x] HA-001–002 Submissions with attachments ✅
- [x] HA-003 Multi-file support · HA-004 Mobile camera
- [x] HA-010 Homework outbox event
- [x] HA-011 Due-date reminder worker · HA-012 Configurable timing
- [x] HA-020 Learning resources table
- [x] HA-021 Resource → homework linking · HA-022 Resource picker UI
- [x] HA-030–031 Teacher feedback ✅

---

## Module 9: Lesson Planning — 85%

- [x] LP-001–002 Weekly topic planning ✅
- [x] LP-010–012 Syllabus lag detection + alerts + dashboard
- [x] LP-020–022 Coordinator review flow (status + API + UI)
- [x] LP-030 Holidays table exists
- [x] LP-031–032 Holiday-aware week number adjustment ✅

---

## Module 10: Parent-Teacher Connect — 100% ✅

- [x] PT-001–002 PTM slot booking ✅
- [x] PT-010–012 Moderated chat ✅
- [x] PT-020–021 Interaction history ✅
- [x] PT-030–032 Automated PTM reminders

---

## Module 11: Transport & Logistics — 50%

- [ ] TL-001–004 Live GPS bus tracking (device integration + API + websocket + parent map)
- [x] TL-010 Route stops with lat/long
- [ ] TL-011–013 Route optimization engine
- [x] TL-020–021 Transport allocations with costs
- [x] TL-022–023 Auto-generate transport fees on allocation
- [x] TL-030 Ops enhancements migration ✅
- [x] TL-031–033 Fuel + maintenance logs + fleet dashboard ✅

---

## Module 12: Digital Media Center / Library — 60%

- [x] LB-001 Digital assets table ✅
- [x] LB-002–003 Digital asset CRUD API + viewer
- [x] LB-010–011 Issue/return lifecycle ✅
- [x] LB-020–021 ISBN lookup ✅
- [x] LB-022–023 QR code generation + scan
- [~] LB-030–032 Student reading progress

---

## Module 13: Inventory & Procurement — 90%

- [x] IP-001–003 Purchase order workflow ✅
- [x] IP-010–011 Multi-godown stock tracking ✅
- [x] IP-021–022 Supplier performance metrics ✅
- [x] IP-030 Reorder level on items
- [x] IP-031–032 Low stock monitoring + requisitions overflow ✅

---

## Module 14: HRMS & Payroll — 90%

- [x] HR-001–003 Biometric attendance link ✅
- [x] HR-010–012 Payslip engine ✅
- [x] HR-020–021 Salary structure configurator ✅
- [x] HR-030–033 Staff Task Master (Priority, status, assignments) ✅
- [x] HR-034 Employee profile audit + leave settings ✅

---

## Module 15: Portfolio Dashboards — 20%

- [x] PD-001–002 School groups + basic analytics
- [x] PD-003–004 Rich cross-campus dashboard UI
- [x] PD-010–011 Financial health aggregation
- [ ] PD-020–021 Member school comparisons
- [ ] PD-030–032 Group-level policy control

---

## Module 16: Alumni & Placements — 95% ✅

- [x] AP-001–003 Alumni directory ✅
- [x] AP-010–012 Professional profiles + placement drives ✅

---

## Module 17: Teacher Copilot (AI Assist) — 85% ✅

- [x] TC-001–002 Draft lesson plans ✅
- [x] TC-010 Teacher-in-the-loop ✅
- [x] TC-020–021 ERP-grounded AI ✅
- [x] TC-030–031 Rubric generation endpoint

---

## Module 18: AI Parent Helpdesk — 40%

- [x] PH-001 Web chat API
- [ ] PH-002 WhatsApp integration · PH-003 Session persistence
- [x] PH-010 Multilingual responses
- [ ] PH-011–012 Language detection/routing
- [x] PH-020–021 ERP grounding ✅
- [x] PH-030 Wallet tables
- [ ] PH-031–032 Per-query billing logic

---

## Module 19: Fee Intelligence — 0%

- [ ] FI-001–004 Risk flags (velocity model + scoring + API + UI)
- [ ] FI-010–013 Predictive cashflow (aggregation + model + API + dashboard)
- [ ] FI-020–022 Smart reminder cadence (engine + API + admin UI)
- [ ] FI-030–032 Explainable decision logic (metadata + audit + UI)

---

## Module 20: Advanced AI Insights — 0%

- [x] AI-001 Timetable conflict constraints
- [ ] AI-002–004 Constraint solver (CSP/genetic algorithm + API + UI)
- [ ] AI-010–012 Attendance anomaly detection
- [ ] AI-020–022 Transport deviation logs (requires GPS from Module 11)
- [ ] AI-030–032 Remedial study suggestions

---

## Priority Matrix

| Priority | Module | Effort | Impact |
|---|---|---|---|
| **P0** | Financial Controls – reminders | 2d | Revenue |
| **P0** | Notices – attachments + scheduling | 2d | Daily ops |
| **P1** | Academic Lifecycle – hall tickets, gradebook UI | 5d | Academics |
| **P1** | Discipline – severity alerts, merit UI | 3d | Parent trust |
| **P1** | Homework – due reminders, resources | 3d | Teaching |
| **P1** | Lesson Planning – lag alerts, coordinator | 3d | Quality |
| **P1** | Parent-Teacher – PTM reminders | 1d | Communication |
| **P2** | Campus Safety – gate pass, photo, pickup | 5d | Compliance |
| **P2** | Smart Alerts – multilingual templates | 3d | Communication |
| **P2** | HRMS – KRA/performance | 5d | HR module |
| **P2** | Library – QR, reading progress | 3d | Library |
| **P2** | Inventory – supplier perf, low stock | 2d | Operations |
| **P2** | Transport – maintenance, fee integration | 3d | Operations |
| **P3** | Automation Studio | 10+d | Premium |
| **P3** | Portfolio Dashboards | 5d | Enterprise |
| **P3** | AI Parent Helpdesk – WhatsApp, billing | 5d | AI add-on |
| **P4** | Fee Intelligence | 10+d | AI premium |
| **P4** | Advanced AI Insights | 10+d | AI premium |
| **P4** | Transport GPS Tracking | 10+d | Premium |

---

