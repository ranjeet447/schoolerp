# School ERP SaaS Platform - Ultimate Consolidated PRD
**Version: v5.0 (Ultimate Master Consolidated)**  
**Date: January 28, 2026**  
**Status: Ultimate Consolidated (All Features from v3.0-v4.4.1)**

*India-first • Multi-language Everywhere • Enterprise Controls • Automation Studio*

---

## Document Information
- **Document Owner:** Ranjeet Gupta (Product Owner)
- **Prepared By:** AI Assistant (Ultimate Consolidation from v3.0 - v4.4.1)
- **Scope:** Complete feature consolidation from ALL PRD versions including latest enhancements
- **Confidential:** For internal planning, estimates, and stakeholder alignment
- **Key Updates in v5.1:** Enhanced notification strategy, improved mobile distribution, detailed API recommendations, comprehensive tech stack guidance, enhanced data governance

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Goals, Non-goals, and Success Metrics](#2-goals-non-goals-and-success-metrics)
3. [Personas, Roles, and Permission Model](#3-personas-roles-and-permission-model)
4. [SaaS Platform Architecture](#4-saas-platform-architecture)
5. [Multi-language Everywhere](#5-multi-language-everywhere)
6. [Authentication and Identity](#6-authentication-and-identity)
7. [Governance: Policy Engine, Locks, Approvals, Audit](#7-governance-policy-engine-locks-approvals-audit)
8. [Core Modules and Features](#8-core-modules-and-features)
9. [Automation Studio](#9-automation-studio-workflows-rules-custom-functions)
10. [SaaS Admin Platform](#10-saas-admin-platform)
11. [Reporting and Analytics](#11-reporting-and-analytics)
12. [Integrations and Notifications](#12-integrations-and-notifications)
13. [Data Governance and Compliance](#13-data-governance-and-compliance)
14. [Non-functional Requirements](#14-non-functional-requirements)
15. [Data Model and API Design](#15-data-model-and-api-design)
16. [User Stories](#16-user-stories)
17. [Packaging and Commercial Model](#17-packaging-and-commercial-model)
18. [Implementation Roadmap](#18-implementation-roadmap)
19. [Risks and Assumptions](#19-risks-and-assumptions)

---

## 1. Product Overview

Build a comprehensive **School Operating System** that manages Academics, Fees, HR, Operations, Safety, and Communication for Indian schools. Delivered as a true multi-tenant SaaS with enterprise-grade controls including RBAC, audit logs, locks, approvals, compliance-grade receipt numbering, and comprehensive multi-language support across UI and documents.

### 1.1 Target Customers
- **Primary:** Private schools (300–4000+ students)
- **Secondary:** Multi-branch school groups and educational chains
- **Tertiary:** Schools using Google Workspace / Microsoft 365 Education
- **Geographic Focus:** Tier-2/Tier-3 Indian schools needing regional language UI + PDFs

### 1.2 Key Differentiators
1. **Multi-language Everywhere:** Complete UI, templates, PDFs, master data translations, and tenant terminology overrides
2. **Policy Engine:** Configurable edit windows, locks, approvals, reason codes, and audit enforcement
3. **Audit-grade Finance:** Receipt series, cancel/refund workflows, reconciliation dashboards, Tally exports
4. **Built-in Safety Suite:** Visitor management, gate pass, pickup authorization, emergency broadcast
5. **Comprehensive SaaS Admin:** Plans, feature flags, quotas, billing, tenant onboarding wizard, operations dashboards
6. **Automation Studio:** No-code workflows, rule engine, enterprise-only sandboxed scripted functions
7. **Mobile-first Design:** Capacitor-based mobile apps with offline capabilities
8. **White-label Options:** Branded mobile apps and custom domains for enterprise clients

### 1.3 Product Scope at a Glance
- **Core:** SIS, Attendance, Fees/Payments, Exams/Report Cards, Timetable, Homework, Notices, Communication
- **Ops:** Inventory, Assets & Maintenance, Procurement, Transport, Hostel, Canteen, Library
- **People:** HR, Payroll, Leaves, Staff workload/substitution
- **Safety & Health:** Visitor, Gate pass, Pickup authorization, Emergency broadcast, Health logs
- **SaaS:** Multi-tenant + billing + onboarding wizard + observability + support tooling

---

## 2. Goals, Non-goals, and Success Metrics

### 2.1 Goals
- Replace multiple disparate tools with one unified platform (ERP + communication + operational workflows)
- Achieve high adoption by parents and teachers through mobile-first experiences
- Standardize 80–90% of workflows while allowing "customization" via configuration rather than per-school code changes
- Operate profitably at low monthly pricing through pass-through costs and automation

### 2.2 Non-goals
- Building in-house video infrastructure (WebRTC, recording pipeline, bandwidth scaling) - integrate with Google/Microsoft instead
- Including unlimited bespoke development in low-priced plans - custom code is either a reusable product feature or paid Enterprise work
- Competing with specialized LMS platforms - focus on school operations and administration

### 2.3 Success Metrics (First 12 Months)
- **Customer Growth:** 10+ paying schools with renewal rate > 85%
- **User Engagement:** Parent MAU > 70% in active schools
- **Financial Accuracy:** Payment reconciliation failures < 1%
- **System Reliability:** Uptime ≥ 99.5% (Standard), 99.9% (Premium+)
- **Automation Performance:** ≥ 98% success rate excluding provider outages; median workflow run time < 5 seconds

---
## 3. Personas, Roles, and Permission Model

### 3.1 Primary Personas
- **SaaS Super Admin** (platform owner)
- **School Admin**
- **Principal/Management**
- **Accountant**
- **Teacher**
- **Parent**
- **Student** (optional)
- **Reception**
- **Transport Manager**
- **Librarian**
- **Hostel Warden**
- **Canteen/Shop Operator**
- **HR/Payroll Admin**
- **Security/Gate Staff**
- **Counselor/Nurse** (restricted)
- **Tenant Workflow Admin** (optional role)
- **Tenant Developer** (Enterprise-only)

### 3.2 Permission Model (RBAC)
Use RBAC with scope filters (tenant/branch/class/section). Policies and locks can further restrict actions even if a role has permission. All sensitive operations must emit immutable audit logs.

**Core permission actions:**
- View
- Create
- Edit
- Approve
- Publish/Lock
- Cancel/Refund
- Export
- Configure
- Override (with reason/approval)

---

## 4. SaaS Platform Architecture

### 4.1 Multi-tenant Model
- **Tenant = School** with optional Branch/Campus layer for multi-branch groups
- Every record carries tenant_id (and branch_id when applicable)
- **Isolation controls:**
  - Application-layer enforcement and request context scoping
  - Database constraints (tenant_id mandatory) + tenant-aware indexes
  - Strict access middleware (deny-by-default)

### 4.2 Feature Flags and Quotas
Plans control feature availability and quotas: students, messages, storage, exports, automations, rule sets, and log retention.

### 4.3 Background Jobs and Queues
- Message delivery queue (WhatsApp/SMS/Email/In-app)
- Payment webhook processing and retry pipeline
- Scheduled reports/exports and reconciliations
- Academic year rollover automation jobs
- Automation Studio workflow runs and retries
- Optional: OCR/doc processing (later)

### 4.4 Event Bus (for Automations)
Modules publish domain events (e.g., fees.overdue, payment.success, attendance.absent). Automation Studio subscribes and enqueues workflow runs. All workflow actions must be idempotent to prevent duplicate sends on retries.

### 4.5 API Strategy
- **REST-first** for core domain services (simplicity, caching, tooling, easier debugging)
- **Optional GraphQL** "BFF" (Backend-for-Frontend) layer for web/app clients if complex composed screens needed
- **Webhooks** for payment gateways, biometric devices, SMS/WhatsApp delivery updates
- **Idempotency keys** + request signing for all external callbacks

### 4.6 Observability
- **Structured logs (JSON)** + correlation IDs to trace requests across services/jobs
- **Error tracking (Sentry-like)** for frontend + backend
- **Slow query monitoring** + periodic EXPLAIN review; index governance
- **Metrics + alerts:** latency, error rate, job failures, webhook failures, queue depth, message delivery failure rate
- **Audit dashboard** for policy overrides + critical actions

### 4.7 Release Engineering & Deployment
- **Versioning:** SemVer (MAJOR.MINOR.PATCH) for platform releases
- **Commit discipline:** Conventional Commits (feat/fix/refactor/chore/docs/perf)
- **Deployment strategy:** Trunk-based development with feature flags
- **Safe rollouts:** Canary → staged rollout (10% → 50% → 100%) with automatic rollback triggers
- **Database migrations:** Backwards-compatible migrations only ( dual-write if needed)
- **Hotfix policy:** PATCH releases for urgent production fixes
- **Auditability:** Store release metadata (version, git sha, deployer) and rollout status

### 4.8 Design System & Component Governance
- **Shared UI Library:** Reusable components with Storybook documentation
- **Design Tokens:** Centralized colors, typography, spacing, and radius definitions
- **i18n-safe components:** Layouts must handle variable text lengths (Hindi/Tamil/etc.)
- **Accessibility:** Keyboard navigation and proper ARIA labels as baseline
- **White-label Branding:** Config-driven theme overrides via design tokens (no code forks)

---

## 5. Multi-language Everywhere

### 5.1 Supported Languages (Phase 1)
English, Hindi, Gujarati, Bengali, Marathi, Malayalam, Tamil, Telugu, Kannada (expandable)

### 5.2 Translation Scope
- **UI:** Every label, button, validation message, and error
- **Tenant terminology overrides** per locale (e.g., Term 1 name, fee head labels)
- **Notification templates** (WhatsApp/SMS/Email) per locale
- **PDFs:** Receipts, report cards, hall tickets, certificates, ID cards, payslips
- **Master data translations:** Subjects, fee heads, designations, events, categories

### 5.3 Data Design
- **Global translation keys:** i18n_key → translations(locale → value)
- **Tenant overrides:** tenant_terms(tenant_id, key, locale, value)
- **Entity i18n tables:** subject_i18n, fee_head_i18n, designation_i18n, etc.

### 5.4 PDF Rendering Requirements
- Embed fonts per script to avoid missing glyphs (Tamil/Telugu/etc.)
- Template engine must support layout rules for variable-length text (avoid overflow)
- All PDFs must support school branding and template variants

### 5.5 Acceptance Criteria
- Every screen supports language switch (user preference)
- Every PDF renders correctly in all supported languages
- Tenant admin can override terminology per language without code changes

---

## 6. Authentication and Identity

### 6.1 Parent Authentication
- **Mobile OTP** (primary) with rate limiting and abuse protection
- **Email/password** (optional)
- **Multi-child mapping** under one parent account

### 6.2 Staff/Admin Authentication
- **Email/password**
- **Optional SSO** later (Google/Microsoft)
- **Optional 2FA** for finance/admin roles (Premium+)
- **IP restriction** option (Enterprise)

### 6.3 Session and Security Controls
- Device/session management (list active sessions, revoke)
- Token rotation and refresh strategy
- Audit login events

---

## 7. Governance: Policy Engine, Locks, Approvals, Audit

### 7.1 Policy Engine (Tenant-configurable)
**Edit windows:**
- Attendance edits allowed within X hours/days
- Marks edits allowed until publish/lock
- Receipt cancellation rules and windows

**Post-lock editing controls:**
- Reason required
- Approval required
- Audit entry mandatory

### 7.2 Locks
- **Attendance lock** (by date range/class)
- **Marks lock** (by exam/term)
- **Finance lock** (day-close / receipt series lock)
- **Academic year lock** (after rollover)

### 7.3 Approval Workflows
- Receipt cancellation approval
- Refund approval
- Post-publish marks change approval
- Gate pass approvals (optional)
- High-impact rules/workflows approval (Automation Studio)

### 7.4 Audit Logging (Cross-cutting)
Audit logs must capture: who, when, what changed (before/after), why (reason code), from where (device/IP), and approver if applicable. Audit logs must be immutable and exportable for compliance.

---

## 8. Core Modules and Features

### 8.1 SIS — Student Information System
**Key Features:**
- Student profile: admission no, roll no, demographics, identifiers, category, addresses, transport/hostel flags
- Parent/guardian mapping: multiple guardians, relationship, primary contact, custody/authorization flags
- Document storage: TC, birth cert, photos, custom docs; expiry reminders for required docs
- **Lifecycle:** enquiry → applicant → admitted → active → left/alumni
- **Certificates:** TC, bonafide, character, transfer, custom templates with multilingual PDFs

**Key Screens:**
- Student directory (filters, export)
- Student profile (tabs: personal, academics, fees, attendance, documents, health, discipline)
- Guardian directory
- Document manager
- Certificate generator

### 8.2 Admissions + Enquiry CRM
**Key Features:**
- Enquiry capture: manual + optional web form embed/API
- Configurable pipeline stages; owners; next actions; reminders
- Scheduling: test/interview; document checklist + verification
- Admission form builder (optional) and conversion dashboard

**Online Admissions Portal (Add-on):**
- Public admissions portal that schools can embed or host under school subdomain
- Admission form builder (multi-step): fields, validations, conditional logic, translations
- Document upload + checklist: verification status, rejection reasons, resubmission workflow
- Application payment: integrate with payment gateway; auto receipt and accounting entry
- Merit/shortlist workflow: scorecards, interview scheduling, status communication
- Applicant portal: view status, upload pending docs, download receipts/acknowledgements

### 8.3 Attendance (Students + Staff)
**Key Features:**
- **Student:** Daily attendance (mandatory); optional period-wise attendance; late/half-day rules; leave requests; approvals; auto notifications
- Edits governed by policy engine + locks
- **Staff:** Manual attendance + device integration pack

**Device Hub (Biometric/RFID) (Add-on):**
- Tenant-scoped Device Hub to onboard and monitor attendance devices and card scanners
- Device registry: type, location, timezone, mapping to branch/gate, status/health checks
- Ingestion methods: CSV import, scheduled polling, webhook intake, or vendor connector
- Raw log viewer: punch_id, device_id, timestamp, person_id candidate matches, anomalies
- Mapping rules: multiple shifts, grace times, duplicate punch handling, late/half-day rules
- Reconciliation: identify missing punches, manual resolution with reason codes + audit
- Security: device-specific API keys; per-tenant isolation; replay protection

### 8.4 Fees + Payments + Finance Compliance
**Key Features:**
- Fee planning: fee heads (translated), fee plans per class/section/year, installments, concessions, scholarships, fine rules
- Collections: offline (cash/cheque/UPI ref) + online gateway (Razorpay/Cashfree/PayU)
- Partial payments, advance payments, adjustments, refunds with approvals + audit
- **Compliance:** Receipt numbering series per tenant/branch/year; cancellations cannot reuse numbers; printable cancel memo; day-close lock
- Reconciliation: gateway settlements vs receipts; webhook retries + ops dashboard
- Exports: CSV/Excel; Tally export pack (high priority for India)

**Accounting & Audit Exports (India) (Add-on):**
- Tally export pack: voucher mapping (fee head → ledger), receipts, refunds, cancellations, day-close entries
- Reports: cash/bank book, day book, fee head wise collections, concession registers, outstanding aging, settlement reconciliation
- GST-ready exports (where applicable): configurable tax fields and exports; audit trail maintained
- Idempotent export runs: export batches with unique IDs and re-download history

### 8.5 Exams + Report Cards + Assessments
**Key Features:**
- Terms/exams/subjects mapping; electives/streams; grading/weightage rules
- Marks entry (teacher-wise), bulk import, validations, publish/unpublish with locks
- Report card PDFs in selected language; hall tickets/admit cards templates
- Re-evaluation workflow: request → approval → audit → updated marks
- Analytics: subject-wise weakness, student trend, class/section comparisons

**Online Tests (Add-on):**
- **Question Bank:** Question bank and online tests (MCQ)
- MCQ tests with timer, auto evaluation, analytics
- **Exam Question Paper Generator:** Generate printable question papers from question bank + print packs

### 8.6 Timetable + Staff Workload + Substitution
**Key Features:**
- Timetable builder; conflict checks (teacher/room)
- Workload dashboard: periods/week, subjects assigned
- Substitution: find available teacher by free slot; substitution record; notifications
- **Staff substitution payroll integration:** Auto-calc extra classes payouts and include in payroll run

### 8.7 Homework + Classwork + Assignments
**Key Features:**
- Homework posting with attachments; optional student submission; teacher remarks
- Classwork/notes archive; subject/class mapping; multilingual labels

### 8.8 Lesson Plan + Syllabus Coverage
**Key Features:**
- Lesson plan templates; weekly/monthly plans; syllabus coverage updates by teacher
- Management dashboard for delays and progress

### 8.9 PTM Scheduling
**Key Features:**
- PTM events; teacher time slots; parent booking; reminders; attendance tracking
- Teacher notes (optional) and follow-up actions

### 8.10 Notices/Circulars with Acknowledgement
**Key Features:**
- Targeted notices by class/section/route/hostel/fee defaulters
- Parent acknowledgement ("Seen/Confirmed") + non-ack reports

### 8.11 Student Diary / Remarks
**Key Features:**
- Daily diary notes; teacher remarks (private/shared); visibility rules

### 8.12 Discipline & Behaviour
**Key Features:**
- Incident log with severity/category; actions taken; follow-up tasks
- Parent notification; restricted visibility for sensitive records

### 8.13 Permission Slips / Consent
**Key Features:**
- Consent requests for trips/events; parent yes/no + notes; audit time
- Optional e-sign later (Enterprise)

### 8.14 Communication Center
**Key Features:**
- Templates per language; broadcast targeting filters; delivery status logs; cost analytics
- Governance: approvals for big broadcasts; role restrictions; quiet hours; opt-outs/unsub
- **Two-way chat add-on:** Moderated teacher-parent chat with hours policy
- **Important:** Messaging charges are pass-through/wallet-based for low-price plan viability

**Multi-channel Delivery:**
- Push notifications (Android/iOS) for time-sensitive alerts and reminders
- In-app notification inbox with read/ack status and searchable history
- Local notifications for scheduled reminders on device (optional, Premium+)
- Background Runner tasks (best-effort) for light retries and local scheduling

### 8.15 Live Classes Integration
**Key Features:**
- Basic: store meeting links per class/teacher
- **Integrated:** Create Google Calendar event → Meet link; Microsoft Graph → Teams meeting link
- Timetable shows "Join" button; store recording link field

### 8.16 Content Links (Lightweight Content Strategy)
**Key Features:**
- Resource library linking to Google Drive, OneDrive, YouTube (unlisted), LMS (Moodle/Classroom)
- Mapping to class/subject with role-based access

### 8.17 Library
**Key Features:**
- Catalog (ISBN/accession), issue/return, late fines, borrow limits
- Reports: overdue, fine collection
- **Student ID cards / barcodes / QR verification workflows** (library & pickup auth)

### 8.18 Inventory
**Key Features:**
- Stock items, vendors, stock in/out, consumption, issue to labs, low stock alerts
- Reports: usage trends

### 8.19 Assets + Maintenance
**Key Features:**
- Asset registry, allocation, maintenance schedules, repair logs, costs
- Optional depreciation (Enterprise)

### 8.20 Procurement (PR → PO → GRN)
**Key Features:**
- Purchase Requests with approvals; Purchase Orders; Vendor management; GRN
- Link to inventory/assets; audit trail end-to-end

### 8.21 Events
**Key Features:**
- Events calendar; registrations/team assignments; result publishing; certificates generation; consent integration

### 8.22 Transport (GPS + Maps)
**Key Features:**
- Vehicles, routes, stops, drivers; parent live tracking (optional)
- **GPS integration via Traccar layer;** map integration (MapmyIndia optional)
- **Alerts:** Bus near stop (Premium+)

### 8.23 Hostel
**Key Features:**
- Rooms/beds allocation; hostel fee integration; hostel attendance optional; warden dashboards

### 8.24 Canteen + Shop
**Key Features:**
- Monthly billing (recommended) and POS-lite sales entries
- Inventory integration; wallet mode future add-on

### 8.25 HR + Payroll
**Key Features:**
- Staff profiles, departments, roles, documents, onboarding/offboarding
- Leave management; payroll runs; salary structures; bonuses/deductions; payslip PDFs (multilingual optional)
- Timesheets for hourly staff (optional)

### 8.26 Safety Suite (Campus Security)
**Key Features:**
- **Visitor management:** Entry/exit logs, purpose, host; optional badge printing add-on
- **Gate pass:** Early leave/late entry requests + approvals; guard verification screen
- **Pickup authorization:** Approved pickup persons; OTP/QR verification optional; logs + audit
- **Emergency broadcast:** One-click urgent alert; multilingual templates; delivery tracking
- **Visitor badge printing + QR:** Badge template, QR scan verification and fast checkout flow

### 8.27 Health & Wellness
**Key Features:**
- Student health profile (allergies/conditions), medical incident log, vaccination tracker optional
- Counselor notes (restricted) with strict RBAC and audit

### 8.28 Alumni Module (Add-on)
**Key Features:**
- **Alumni directory:** Alumni directory, events, donation drives
- **Certificate verification portal:** Digital certificate verification system

---

## 9. Automation Studio (Workflows, Rules, Custom Functions)

Schools will demand customization. Provide it safely via configuration and sandboxed automation—not by shipping bespoke code in low-priced plans.

### 9.1 Workflow Builder (No-code)
**Workflow model:** Trigger → Conditions → Actions, with optional delays/schedules and retry policies

**Key requirements:**
- Visual builder UI with publish/draft and version history
- Idempotency to prevent duplicate sends on retries
- Rate limits and quiet hours to prevent spamming parents
- Execution logs with per-action status and failure reasons
- Approval required for high-impact workflows (finance/safety)

### 9.2 Rule/Formula Engine (No-code Logic)
Use rules to configure business logic without code (fees, attendance, grading, eligibility)

**Capabilities:**
- Rule sets scoped by tenant/branch with effective dates (optional)
- Versioning + rollback + audit logs
- Approval workflow for finance/exam critical rule changes
- Safe function library: IF, AND, OR, ROUND, MIN, MAX, DATE_DIFF, TODAY, IN, CONTAINS

### 9.3 Enterprise Scripted Functions (Optional)
Enterprise-only: allow custom scripted functions in a sandbox with strict limits. No direct DB/network access; only approved SDK calls. Requires versioning, logs, rollback, and emergency disable.

**Sandbox guardrails:**
- Time/memory limits per execution; deny long-running scripts
- No direct DB access: scripts call safe SDK methods only
- Optional: whitelisted outbound webhooks for Enterprise integrations
- Tenant Developer role only; publish requires admin approval

### 9.4 Plan Limits (to protect ₹5k entry plan)

| Plan | Automations | Schedules | Rule Sets | Scripted Functions | Log Retention |
|------|-------------|-----------|-----------|-------------------|---------------|
| Starter | 5 | No | 5 | No | 7 days |
| Standard | 30 | Daily/Weekly | 20 | No | 30 days |
| Premium | Unlimited | Cron-like | Unlimited | Optional add-on | 90 days |
| Enterprise | Unlimited | Cron-like | Unlimited | Yes | 1–3 years |

---

## 10. SaaS Admin Platform

### 10.1 Super Admin Console
- Tenant lifecycle management (create, suspend, delete)
- Plan/subscription management with feature flags and quotas
- Usage metrics: active students, message volumes, storage, exports, automation runs
- Billing: invoices, payments, renewals, discounts/coupons (optional)
- Global templates library for PDFs (receipts, report cards, certificates, hall tickets)
- Platform operations dashboard: queues health, webhook failures, automation failures, incident logs

### 10.2 Tenant Onboarding Wizard (Self-serve)
- School profile, branding, and domain/subdomain setup
- Language enablement and defaults
- Academic structure setup (classes/sections/subjects)
- Role templates selection and initial admin creation
- Fee plan templates and series rules setup
- Import wizard for students/parents/staff with validation and error reports
- Go-live checklist and progress tracking

**Custom Domain Onboarding (White-label Add-on):**
- Enable schools to map their own domain/subdomain to the platform with automated SSL and tenant routing
- DNS setup: School creates a CNAME (e.g., portal.schoolname.edu.in → tenant.yourplatform.com)
- Auto SSL: Automatically provision and renew TLS certificates; enforce HTTPS and canonical redirects
- Tenant routing: Map domain → tenant_id and load tenant theme + feature flags + language defaults
- Auth links on tenant domain: Password reset/magic links and email templates should use the custom domain
- Cookie/session safety: Ensure session cookies are correctly scoped per custom domain

### 10.3 Data Export and Trust
- Export all SIS/fees/attendance/exams data
- Export audit logs (admin-only)
- Configurable retention and archival for Enterprise tenants

---

## 11. Reporting and Analytics

Dashboards must be role-aware, tenant-aware, and exportable. Scheduled reports are Premium+.

**Core dashboards:**
- **Fees:** Collections, dues, defaulters, refunds, reconciliation
- **Attendance:** Trends, absentees, low-attendance alerts
- **Academics:** Exam analytics, performance trends, syllabus coverage
- **Admissions:** Enquiry funnel and conversions
- **Communication:** Delivery status and cost analytics
- **Safety:** Visitor logs, gate pass usage, pickup audit
- **Operations:** Assets due, procurement status, low stock
- **Automation:** Workflow success rate, failures, spend impact

**Export capabilities:**
- Excel/CSV/PDF exports
- Scheduled reports (Premium+)
- Custom Reports Builder (if enabled)

---

## 12. Integrations and Notifications

### 12.1 Mandatory (Core) Integrations
- **Payment gateway** (start with Razorpay for India)
- **WhatsApp provider + SMS provider**
- **Email provider** (optional)
- **Push notification infrastructure** (FCM/APNs) for mobile apps
- **In-app notifications store** (tenant-scoped) with read/ack status

### 12.2 High-value Add-ons
- **Google Calendar/Meet + Microsoft Graph/Teams** meeting creation
- **Transport GPS** via Traccar or vendor API
- **Biometric/RFID devices** integration
- **Tally export** integration (India accounting)

### 12.3 Mobile App Delivery (Next.js + Capacitor)
Provide Parent and Teacher mobile apps as a Capacitor wrapper over the Next.js web app to minimize development and maintenance cost. Admin experience remains web-first.

**App Targets:**
- **Parent App:** Fees, receipts, attendance, notices + acknowledgement, homework, results/report cards, PTM booking, consents, live class join links, transport tracking (if enabled), profile/settings
- **Teacher App:** Attendance, timetable, substitutions, homework/classwork, marks entry, PTM slots, notices, remarks/diary, approvals (if permitted)
- **Admin Web:** Full configuration, policies/locks, approvals, audit logs, dashboards, exports, setup wizard

**Performance Guidelines:**
- Use SSR/ISR for read-heavy screens; minimize client-side API calls to reduce latency on low-end devices
- Virtualize long lists (student lists, logs, message history)
- Cache critical dashboards and use incremental refresh patterns
- Optimize bundle size; avoid heavy animations; support low-bandwidth mode (optional)

**App Distribution & White-label Strategy:**
- **Common app (default):** One Parent/Teacher app for all schools. User selects school by entering SchoolID or searching name/city
- **Tenant-aware runtime config:** On selection, app fetches and caches branding, enabled modules, and language rules
- **PWA-first option:** Deploy PWA for low-friction adoption; Capacitor wrapper for native features (push, deep links)
- **White-label branded apps:** Separate store listings per school (Premium/Enterprise only)
- **Deep Links:** Notification taps route accurately to specific screens within the tenant context

### 12.4 Notification Strategy (Multi-channel)
Design notifications as a multi-channel, policy-driven system: In-app + Push + WhatsApp + SMS + Email. The server is the source of truth; mobile background execution is best-effort and used only to improve UX.

**Notification Categories:**
- **Transactional:** Receipts, payment success/failure, fee due/overdue, login OTP, approval outcomes
- **Academic:** Attendance absent, homework posted, timetable changes, exam schedule, results published, report card available
- **Engagement:** Event reminders, PTM reminders, circular reminders, newsletter
- **Critical/Safety:** Emergency broadcast, pickup authorization, gate pass status, transport alerts (Premium+)

**Detailed Routing Matrix (Default):**

| Category | Primary Channel | Fallback 1 | Fallback 2 |
| :--- | :--- | :--- | :--- |
| **OTP / Auth** | SMS / WhatsApp | Email | In-app |
| **Payments & Receipts**| WhatsApp + In-app | SMS | Email |
| **Safety / Emergency** | Multi-send (WA+SMS+Push) | Voice (optional) | Email |
| **Academics / Notices**| In-app + Push | WhatsApp (for High Pri) | SMS |
| **PTM / Reminders** | In-app + Push | WhatsApp | SMS |

**Governance & Reliability:**
- **Broadcast approvals:** Principal approval required for mass broadcasts
- **Quiet hours:** Mandatory for non-critical messages; Safety alerts can bypass
- **Idempotency keys:** Required to prevent duplicate sends on retries
- **Provider webhooks:** Store delivery receipts and error callbacks; retry failures with backoff

---

## 13. Data Governance and Compliance

### 13.1 Data Protection & Legal Readiness (DPDP-aligned)
- **Consent records:** Store user consent for communication channels and data processing where applicable (tenant configurable)
- **Data Subject Requests:** Allow tenant admin to export or correct personal data upon request; provide Super Admin tools for verified deletion/anonymization workflows
- **Data retention policy:** Configurable retention windows for logs/messages/documents; default safe values provided
- **Offboarding:** One-click export pack (data + documents) + defined deletion schedule with confirmation report

### 13.2 Disaster Recovery (DR) & Business Continuity
- **RPO/RTO targets** per plan (e.g., Standard: 24h/24h, Premium: 6h/6h; configurable)
- **Automated backups:** DB + object storage manifests; encryption and retention policy; restore drills SOP (quarterly internal)
- **Incident handling:** Tenant-visible status updates (optional) and incident history for transparency (Premium+)

### 13.3 Data Import & Migration Toolkit (Go-live Accelerator)
- **Import templates + validation:** Students/parents/staff, classes/sections, fee plans, opening balances, subjects, timetable skeleton
- **Dry-run mode:** Validate and preview errors without committing; generate error report and suggested fixes
- **Batch tracking + rollback:** Import_batch IDs with ability to revert a batch safely (where possible)
- **Duplicate detection:** Phone/email and admission number de-duplication rules; merge workflow (admin-only)
- **Go-live checklist:** Fees reconciliation, academic year setup, permissions review, messaging wallet setup, branding, and training completion

### 13.4 Custom Fields & Forms Engine (SaaS-safe customization)
- **Custom fields** for key entities (Student, Staff, Enquiry/Applicant, Fees/Receipts, Tickets, Inventory/Assets) with per-role visibility and validation
- **Field types:** Text/number/date/dropdown/multi-select/file/boolean; translations for labels and options
- **Form layouts:** Configure sections/tabs and required fields per tenant and per academic year (where applicable)
- **Search & reporting:** Custom fields usable in filters, exports, and Custom Reports Builder (if enabled)
- **Change control:** Edits to forms/fields are audited and can be locked after go-live per policy

### 13.5 Security & Audit Enhancements
- **Session log:** User login history with device metadata and IP (optional) for admin roles; revoke sessions
- **Export audit:** Track all exports (who/what/when/filters) and download history
- **Permission change audit:** RBAC edits and role assignment changes treated as sensitive actions with approval option (Enterprise)
- **2FA option:** Enable 2FA for finance/admin roles (Premium+) and IP allowlists (Enterprise)

### 13.6 Academic Calendar (Platform Primitive)
- Central calendar for holidays, exam periods, PTM, events, fee due dates, timetable exceptions
- Branch-aware calendars for school groups; role-based visibility
- Calendar drives automation: scheduled reminders and screen highlights (e.g., upcoming exams) via notification rules

### 13.7 Parent Identity Across Tenants (Multi-school Support)
- Allow a parent phone/email to link to multiple child profiles across tenants (with tenant consent)
- Tenant switcher in Parent app/web; separate notification preferences per tenant
- Security: prevent accidental cross-tenant linkage; explicit verification per school during mapping

### 13.8 Content, Attachments & Storage Governance
- Per-tenant storage quota and per-module limits (e.g., homework attachments max size/type)
- Allowed file types and virus/malware scanning hook (optional) for uploads
- Temporary upload cleanup policy and lifecycle rules for archived data/documents
- Storage alerts and overage handling (block uploads or charge for extra storage based on plan)

---

## 14. Non-functional Requirements

### 14.1 Security
- **RBAC + scopes:** Deny-by-default for sensitive modules (finance, health, counseling)
- **Audit logs** for finance/attendance/exams/policies/automations
- **Encryption** at rest for DB and file storage
- **OTP rate limiting,** device binding (optional), abuse detection
- **Optional 2FA** for sensitive roles

### 14.2 Reliability
- **Uptime targets:** 99.5% Standard, 99.9% Premium+
- **Daily backups** with retention; documented restore process and periodic drills
- **Monitoring and alerting** for API errors, job failures, webhook failures, message delivery issues, automation spikes

### 14.3 Performance
- **Mobile-first performance** for parent portal under low bandwidth
- **Caching** for read-heavy views (student profile, fee dues, notices)
- **Peak-load resilience** (result publish days, fee due windows)
- **Performance budgets:** Enforce max bundle size for Parent PWA; ensure p95 API latency targets per plan

### 14.4 Scalability
- **Load testing:** Focus on list/search endpoints and PDF generation pipeline; validate queue behavior under burst
- **Database performance:** Index strategy reviewed per module; add slow query monitoring and periodic EXPLAIN review

---

## 15. Data Model and API Design

### 15.1 Database Entities (High-level)
All tenant data tables MUST include tenant_id; tables with branch scoping include branch_id. Add created_at, updated_at, created_by where relevant.

**Core Tenant & Identity:**
- tenants (schools), branches
- users, user_identities (otp/email), sessions
- roles, permissions, role_assignments (scoped)
- audit_logs (immutable)
- feature_flags, plan_limits, usage_counters
- i18n_translations, tenant_terms, entity_i18n tables

**Academics:**
- academic_years, classes, sections, subjects, subject_assignments
- timetables, timetable_slots, substitutions
- attendance_records (student), attendance_staff
- homework, homework_attachments, submissions (optional)
- lesson_plans, syllabus_coverage
- exams, exam_subjects, marks_entries, grade_rules, report_cards
- question_bank, questions, tests, test_attempts

**Finance:**
- fee_heads, fee_plans, fee_installments, concessions/discounts
- invoices/dues, payments, payment_attempts, refunds
- receipts (series), receipt_cancellations
- gateway_settlements, reconciliation_jobs

**Operations & Safety:**
- inventory_items, stock_movements, vendors
- assets, asset_allocations, maintenance_jobs
- procurement_requests, purchase_orders, grns
- transport_routes, stops, vehicles, gps_events
- hostels, rooms, allocations
- canteen_sales, canteen_billing
- visitors, gate_passes, pickup_authorizations, emergency_broadcasts
- health_profiles, medical_incidents

**Automation Studio:**
- workflows, workflow_versions, workflow_runs, workflow_action_runs
- rule_sets, rule_versions, rules
- script_functions, script_function_versions (Enterprise)
- domain_events (optional persistence)

### 15.2 API Strategy
**REST-first** for core domain services (stability, caching, third-party support) + **Optional GraphQL BFF** for UI aggregation.

**Key REST Webhooks:**
- `POST /webhooks/payments/{provider}` — payment success/failure (idempotent)
- `POST /webhooks/biometric/{vendor}` — staff attendance (secured)
- `POST /webhooks/gps/{vendor}` — vehicle location (secured)
- `POST /webhooks/whatsapp/{provider}` — status receipts & inbound messages

**GraphQL Domains (Internal UI):**
- **Auth:** `loginOtpRequest`, `loginOtpVerify`, `sessionRevoke`
- **SIS:** `students`, `studentById`, `generateCertificatePdf`
- **Fees:** `feePlans`, `generateDues`, `recordOfflinePayment`
- **Exams:** `enterMarks`, `publishResults`, `generateReportCardPdf`

### 15.3 Event Catalog (Automation Triggers)
**Fees:** fees.due_created, fees.overdue, payment.success, payment.failed, refund.requested, refund.approved, receipt.cancelled
**Attendance:** attendance.marked, attendance.absent, attendance.absent_streak, attendance.below_threshold
**Exams:** exam.created, marks.pending, marks.submitted, results.published, reval.requested, reval.approved
**Safety:** visitor.checkin, visitor.checkout, gatepass.requested, gatepass.approved, pickup.used, emergency.triggered
**System:** schedule.daily, schedule.weekly, academic_year.rollover_completed, policy.updated, workflow.failed_deadletter

---

## 16. User Stories

### 16.1 SIS User Stories
- As a School Admin, I can create and update student profiles with admission number, class/section, and guardian mapping
- As a School Admin, I can bulk import students and guardians from a validated spreadsheet template and see an error report for failed rows
- As a Parent, I can view my child's profile, class details, and uploaded documents based on permissions
- As an Admin, I can generate certificates (TC/bonafide/character) using school templates and download them as multilingual PDFs
- As an Admin, I can mark a student as left/alumni and enforce policies on access visibility and historical reports

### 16.2 Attendance User Stories
- As a Teacher, I can mark daily attendance for my assigned class/section and submit it within the policy window
- As a Parent, I can request leave with reason and attachment; the teacher/admin can approve/reject
- As an Admin, I can define late/half-day rules using the Rule Engine
- As an Admin, I can ingest staff attendance from biometric devices and handle conflicts via override workflow with reason and approval
- As the system, I can trigger automated parent notifications and escalations based on absence rules (Automation Studio)

### 16.3 Fees & Payments User Stories
- As an Accountant, I can define fee heads and create a fee plan for each class/section with installments
- As an Accountant, I can generate dues/invoices for an academic year and apply discounts/fines based on Rule Engine rules
- As a Parent, I can view dues and pay online; on success, the system auto-generates a receipt and notifies me
- As an Accountant, I can accept offline payments and generate receipts using compliant receipt series rules
- As an Accountant/Admin, I can cancel a receipt or process a refund only with approval and audit logging
- As Management, I can reconcile gateway settlements versus receipts and see mismatch resolution workflows

### 16.4 Communication User Stories
- As an Admin, I can create multilingual message templates and send targeted broadcasts by class/section/fee status
- As a Parent, I receive notifications via WhatsApp/SMS/Email based on availability and preference
- As Principal, I can approve or reject sensitive broadcasts before they are sent
- As an Admin, I can view delivery logs and cost analytics per campaign
- As the system, workflows can schedule reminders and escalations using Automation Studio

### 16.5 Safety Suite User Stories
- As Gate Staff, I can register visitor check-in and check-out with purpose and host
- As a Parent, I can request a gate pass for early leave; staff can approve and gate staff can verify
- As an Admin, I can manage pickup authorization list and verify pickup using OTP/QR (optional)
- As Management, I can trigger an emergency broadcast to all parents/staff with multilingual templates and delivery tracking

### 16.6 Automation Studio User Stories
- As a Tenant Workflow Admin, I can create a workflow: fees.overdue → send WhatsApp reminder → create task if overdue > 7 days
- As a School Admin, I can create rule sets for late fee calculation and preview them with sample data before publishing
- As Principal, I can approve high-impact rule/workflow changes before they go live
- As the system, workflow actions are idempotent; retries do not send duplicate messages or duplicate receipts
- As an Enterprise Tenant Developer, I can publish a sandboxed scripted function with versioning and rollback, restricted to safe SDK calls

---

## 17. Packaging and Commercial Model

### 17.1 Core Plans

| Plan | Target | Price (Indicative) | Key Limits | Support Model |
|------|--------|-------------------|------------|---------------|
| **Starter** | Up to 1000 students | ₹5,000/month | Core modules, limited automations; messaging pass-through | Ticket-based, limited quota |
| **Standard** | Up to 2000 students | ₹12,000/month | More modules + schedules; more logs | Ticket-based, faster SLA |
| **Premium** | Up to 4000 students | ₹25,000/month | Full modules; unlimited automations; advanced analytics | Priority support |
| **Enterprise** | 4,000+ / multi-branch | Custom | SLA, scripted functions, advanced integrations | SLA + retainer |

### 17.2 Setup and Implementation Fees (Required)
- **Basic setup + onboarding + training:** ₹50,000+ per school (minimum)
- **Data migration packs:** ₹1.25L–₹6L depending on data quality/volume and number of modules
- **Custom templates** (report card/receipt/certificates) billed separately if highly customized

### 17.3 Add-ons (Upsells)
- **Messaging wallet top-ups** (pass-through) + admin control
- **Google/Microsoft meeting automation**
- **Biometric/RFID pack**
- **Transport GPS tracking**
- **Tally export**
- **Online tests**
- **White-label branding + custom domain + store publishing support**
- **Automation Studio higher limits** (more runs, more outbound calls)

### 17.4 White-label Add-ons (ARPU Lever)
White-labeling increases operational overhead (domain, branding, store releases). Treat it as a paid add-on with clear scope and SOP.

**White-label Web (Custom Domain + Theme Studio):**
- Custom domain for portals (parent/teacher/admin) with auto SSL and tenant routing
- **Theme Studio:** Logo (light/dark), favicon, primary/secondary/accent colors, optional limited fonts, dashboard layout toggles; versioned config + rollback + audit
- Branding included in PDFs (receipts, report cards, certificates) as per tenant theme

**White-label Branded Mobile Apps (Per School Listing):**
- Separate store listing (Play Store; App Store optional) with school branding (app name/icon/splash)
- **Store publishing SOP:** Signing keys/keystore & certificates, Play Console setup, release tracks, review checklist, and update cadence
- Monthly recurring charge + one-time setup fee recommended due to ongoing release management and store review dependencies

### 17.5 Nice-to-have Add-ons (ARPU Expansion)
- **Alumni module:** Alumni directory, events, donation drives, certificate verification portal
- **Staff substitution payroll integration:** Auto-calc extra classes payouts and include in payroll run
- **Exam question paper generator:** Generate printable question papers from question bank + print packs
- **Visitor badge printing + QR:** Badge template, QR scan verification and fast checkout flow

---

## 18. Implementation Roadmap

### 18.1 Release Phasing (Solo-dev friendly)

**Release A (Core Enterprise):** SaaS foundation + i18n + RBAC/audit/policies + SIS + fees/payments + attendance + exams/report cards + notices + parent portal

**Release B (Engagement):** Homework, PTM, acknowledgements, lesson plans, discipline, consent, timetable/substitution/workload

**Release C (Operations):** Assets, procurement, inventory, HR/payroll, safety suite, health

**Release D (Integrations/Add-ons):** Meet/Teams automation, transport GPS, biometric/RFID, Tally export, online tests

### 18.2 Development Planning & Engineering Execution

**Repo Structure & Monorepo Conventions:**
- **Monorepo (recommended):** apps/web (Parent/Teacher), apps/admin, apps/mobile (Capacitor wrapper), services/api, services/worker, packages/ui, packages/tokens, packages/utils, packages/config
- **Code ownership:** Shared packages must remain app-agnostic; no tenant-specific hacks inside shared UI or core services
- **Linting/formatting:** Enforce via CI (ESLint, Prettier) and commit hooks; TypeScript strict mode enabled

**CI/CD Pipelines & Release Gates:**
- **CI stages:** Lint → typecheck → unit tests → build → container scan (optional) → deploy to staging
- **Staging gates:** Run DB migrations + seed test tenant data + smoke tests (golden flows)
- **Production gates:** Canary deploy → monitor rollback triggers → staged rollout (10%→50%→100%)

**Testing Strategy (Enterprise-grade):**
- **Golden flows:** Define top 25 end-to-end flows; must pass in staging before production
- **Unit tests:** Rule engines (fees, proration, fines, concessions), policy engine, receipt series, numbering constraints
- **Integration tests:** Payment webhooks, message provider callbacks, OTP verification, file/PDF generation pipeline
- **E2E tests:** Smoke tests for Parent/Teacher/Admin portals; keep minimal but critical

### 18.3 Recommended Tech Stack

**Backend:**
- **Go** (Gin/Fiber) for performance and low runtime cost; or **NestJS** if you want faster iteration with existing skillset
- **PostgreSQL + Redis** (cache/queue) + object storage (S3-compatible)
- **Job queue:** Redis-based (Asynq) or Postgres-based; run workers separately
- **PDF generation service** (server-side) with multilingual font support

**Frontend:**
- **Next.js** (App Router) for web + PWA; SSR/ISR for admin dashboards; aggressive caching for parent portal reads
- **Capacitor wrapper** for Play Store when needed; keep one codebase

**Infrastructure (Lean):**
- Start single-region with Docker on a small VM + managed Postgres; scale to managed K8s only after traction
- CDN for static assets; separate worker process for jobs
- Cost controls: message wallet, storage quotas, export throttling

---

## 19. Risks and Assumptions

### 19.1 Key Risks
- **Support load** can destroy margins at ₹5k/month unless onboarding is self-serve and messaging costs are pass-through
- **Multi-language PDFs** require careful font embedding and layout handling for long text
- **Payment gateway webhook reliability** and reconciliation must be rock-solid to build trust
- **Automation Studio** must enforce rate limits and idempotency to avoid duplicate messaging/cost spikes
- **Hardware integrations** (biometric/GPS) vary widely and can become a customization sink without adapters/standards

### 19.2 Assumptions
- Schools will accept configuration-based customization and paid add-ons for advanced needs
- Google/Microsoft are used for live classes; the ERP integrates rather than hosts live video
- Schools are willing to pay setup/migration fees for go-live support

### 19.3 Open Questions (for stakeholder meetings)
- **Board compliance requirements:** CBSE/ICSE/state templates needed for report cards and certificates
- **Receipt numbering rules** and audit requirements per region/school trust policies
- **Data retention expectations** and legal compliance requirements per school group
- **Preferred WhatsApp/SMS providers** and whether schools pay directly or via wallet
- **Scope of 'custom fields'** and how far to allow per module without breaking analytics

---

## Appendix A — Permissions Matrix (High-level)

Matrix shows typical permissions by role. Final permissions are tenant-configurable but must obey Policy Engine and Locks.

| Module | School Admin | Principal | Accountant | Teacher | Parent | HR | Gate Staff | Librarian | Transport | SaaS Super Admin |
|--------|--------------|-----------|------------|---------|--------|----|-----------|-----------|-----------|--------------------|
| **SIS** | C/E/X | V/A | V | V/E (assigned) | V (own) | V | - | - | - | Meta only |
| **Admissions** | C/E/X | V/A | - | V (optional) | - | - | - | - | - | Meta only |
| **Attendance** | C/E/X | V/A | V | C/E (assigned) | V (own) | V | - | - | - | Meta only |
| **Fees** | V/Cfg | V/A | C/E/X/Cancel | V | V/Pay | - | - | - | - | Meta only |
| **Exams** | V/Cfg | V/A | V | C/E (assigned) | V (own) | - | - | - | - | Meta only |
| **Communication** | C/E/X | A | V | Send (limited) | Receive | - | - | - | - | Meta only |
| **Safety** | C/E/X | A | - | - | V (own) | - | C/E/Verify | - | - | Meta only |
| **HR/Payroll** | Cfg | V/A | - | - | - | C/E/X | - | - | - | Meta only |
| **Automation Studio** | C/E/X | A | V (finance) | V | - | - | - | - | - | Meta only |

**Legend:** V=View, C=Create, E=Edit, X=Export, A=Approve. Actual permissions depend on tenant configuration and policy locks.

---

**END OF DOCUMENT**

*This consolidated PRD represents the complete feature set from all versions (v3.0 through v4.4.1) and serves as the definitive specification for the School ERP SaaS Platform implementation.*

---

## 20. Enhanced Notification Strategy (v4.4+ Features)

### 20.1 Detailed Channel Routing Matrix

| Notification Type | Primary Channel | Fallback 1 | Fallback 2 | Cost Model |
|-------------------|----------------|------------|------------|------------|
| **OTP / Auth** | SMS OTP (or WhatsApp OTP if supported) | Email OTP (optional) | In-app banner (if logged in) | Wallet |
| **Payments & Receipts** | WhatsApp (template) + in-app | SMS | Email (optional) | Wallet |
| **Notices / Academics** | In-app + Push | WhatsApp (for important) | SMS | Wallet for paid channels |
| **PTM / Reminders** | In-app + Push | WhatsApp | SMS | Wallet for paid channels |
| **Safety / Emergency** | WhatsApp + SMS + Push (multi-send) | Voice call add-on (optional) | Email | Wallet |

### 20.2 Advanced Cost Controls
- **Daily/weekly spend limits** per tenant with hard stops or approval required after threshold
- **Template governance:** Only pre-approved templates can be used for bulk sends (prevents ad-hoc blasting)
- **Role restrictions:** Only Principal/Admin can broadcast to "All Parents" unless explicitly delegated
- **Per-message cost attribution:** Campaign-wise and module-wise (fees reminders vs notices vs emergencies)
- **Auto low-balance alerts** + optional auto-topup (Enterprise)
- **Monthly statement export** for accounts/audit

### 20.3 Reliability & Operations (Enhanced Runbook)
- **Provider outage handling:** Fallback routing when primary provider fails
- **Retry/DLQ processing:** Exponential backoff with dead letter queue management
- **Template approval flow:** Workflow for approving new message templates
- **Spend cap overrides:** Emergency procedures for critical communications
- **Incident communications:** Automated status updates during outages
- **Monitoring:** Notification queue depth, provider failure rates, wallet balance anomalies, OTP abuse spikes

---

## 21. Advanced Data Governance & Compliance (v4.4+ Features)

### 21.1 DPDP-aligned Practices (Operational)
- **Tenant Data Processing Agreement (DPA)** templates for schools (especially groups)
- **Data minimization:** Collect only required fields; make optional fields explicitly opt-in
- **Consent and purpose tracking** for communications (WhatsApp/SMS/Email)
- **Role-based access + least privilege** for sensitive data (health, counseling, discipline)
- **Data retention controls (Enterprise):** Configure retention for logs, messages, documents, alumni records
- **Right to export:** School admin can export core datasets + audit logs (as permitted)

### 21.2 Auditability & Financial Compliance
- **Receipt series rules** enforced in code and DB; no duplicates ever
- **Cancellation/refund/adjustment** requires reason code + approver (policy driven)
- **Immutable audit trail** for ledger actions; exportable for audits
- **Daily close/day-lock** option for accountants; re-open requires approval + audit

### 21.3 Data Import, Migration & Go-live Toolkit
**Import Pipelines:**
- Students + guardians + relationships (with validation and duplicate checks)
- Staff directory + roles + class mappings
- Opening fee balances and installment plans (with reconciliation checks)
- Optional: attendance history, exam history (if available)

**Migration Safety:**
- Dry-run validation reports before commit
- Tenant-scoped staging tables; commit step is explicit and auditable
- Rollback plan for go-live week; snapshot backups and restore SOP

---

## 22. Design System & Component Governance (v4.4+ Features)

### 22.1 Component Architecture
- **Monorepo structure:** apps/web (Parent/Teacher), apps/admin, apps/mobile (Capacitor wrapper), packages/ui (shared components), packages/tokens (design tokens), packages/utils
- **Component documentation:** Storybook is the single source of truth for UI components; every reusable component must have stories for states (default/loading/empty/error/disabled) and variants
- **Design tokens:** Colors, spacing, typography, radius defined centrally; avoid hardcoding styles inside apps

### 22.2 Accessibility & i18n Requirements
- **Accessibility baseline:** Components must support keyboard navigation and proper labels; ensure font scaling and text expansion works for Indian languages
- **i18n-safe components:** No hardcoded text; accept label keys or text props; layouts must handle longer strings (Hindi/Tamil/etc.)
- **Visual regression testing:** Automated snapshot testing for Storybook stories (e.g., Chromatic or equivalent) to prevent unintended UI breaks

### 22.3 White-label Theming
- **Component lifecycle:** Version components with changelog; deprecate carefully; avoid breaking changes outside MAJOR release
- **App theming/branding:** Tenant theming via tokens (logo/colors/fonts) without forking components; white-label overrides must remain config-driven
- **White-label theming rule:** All branding must be config-driven via design tokens (no code forks per tenant) to keep SaaS maintainable

---

## 23. Operational Excellence & Support (v4.4+ Features)

### 23.1 Support Model (SaaS)
| Plan | Support Type | Response Time | Channels | Onboarding |
|------|-------------|---------------|----------|------------|
| **Starter** | Ticket-based support, best-effort within business hours | 48-72 hours | Email/Portal | Limited onboarding |
| **Standard/Premium** | Faster response times | 24-48 hours | Phone/WhatsApp support window optional | Standard onboarding |
| **Enterprise** | Dedicated onboarding manager, priority incident handling | 4-24 hours | Custom SLA | Dedicated manager |

### 23.2 Runbooks & Operational Readiness
**Runbook must cover:**
- Payment webhook failures (retry, manual reconcile, incident notes)
- Messaging provider outages (fallback to in-app + SMS if WhatsApp fails, where configured)
- Backup restore drill steps and frequency
- Tenant data export and offboarding process

### 23.3 Risk Mitigation Strategies
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Low-price plan margin erosion** | High | Wallet-based pass-through + quotas |
| **Infinite customization requests** | High | Policy engine + custom fields/forms + automation studio + paid change requests |
| **Board/report-card format variations** | Medium | Template library + per-tenant template editor + paid professional template service |
| **School data quality (migration)** | Medium | Staged import with validation and paid migration packs |
| **Seasonal load spikes (results/fees)** | Medium | Caching, queues, async exports, rate limits |

---

## 24. Advanced Features Summary (v4.4+ Additions)

### 24.1 New Features Added in Latest Versions
1. **Enhanced Notification Strategy** with detailed cost controls and routing matrix
2. **Advanced Data Governance** with DPDP compliance and migration toolkit
3. **Design System Architecture** with component governance and white-label theming
4. **Operational Excellence** framework with detailed support models and runbooks
5. **Risk Mitigation** strategies with specific solutions for common SaaS challenges
6. **Implementation Roadmap** with solo-dev friendly phasing and tech stack recommendations

### 24.2 Key Enhancements
- **Messaging Wallet System:** Complete pass-through cost model with detailed controls
- **White-label Capabilities:** Both web and mobile app branding with operational SOPs
- **Enterprise Governance:** DPDP-aligned data protection and audit capabilities
- **Mobile Strategy:** Detailed Capacitor implementation with PWA-first approach
- **API Architecture:** REST-first with optional GraphQL BFF layer
- **Release Engineering:** Complete CI/CD pipeline with canary deployments

---
