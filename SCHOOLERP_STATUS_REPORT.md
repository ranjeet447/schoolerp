# SCHOOLERP_STATUS_REPORT.md

## A) Executive Summary
- **Overall Completion Estimate:** ~80% (End-to-End integration for core modules).
- **Top 5 End-to-End Features:**
  1. **Student Information System (SIS):** Full profiles, remarks, and gate passes with scoped search.
  2. **Fee Management:** Offline collection, Receipt generation, and Razorpay/PayU foundation.
  3. **Attendance:** Daily and period-wise attendance for students and staff with approval loops.
  4. **Exam Management:** Subject-wise marks entry, max marks validation, and result compilation.
  5. **Marketing Engine:** 60+ SEO-optimized dynamic routes with JSON-LD and LLM metadata.
- **Top 5 Critical Gaps:**
  1. **Messaging Gateways:** Notification system uses stubs/webhooks; direct Twilio/SmsHorizon/Gupshup logic is missing.
  2. **Payroll Engine:** HRMS pages exist but deep payroll calculation and slip generation need hardening.
  3. **Parent Payment FE:** Backend supports online orders, but the Parent Portal needs the "Pay Now" checkout UI.
  4. **Multi-Branch UX:** Schema supports branches, but Admin UI navigation/switching needs full testing.
  5. **Integration Hooks:** Tally/Accounting export (`tally.go`) is a stub/partial implementation.

## B) Feature Status Matrix

| Module | Status | End-to-End Wins | Gaps / Missing | Evidence (Evidence-Factual) |
| :--- | :---: | :--- | :--- | :--- |
| **1. Tenant Onboarding** | ✅ | Subdomain resolution, active gateway config, base school setup. | Branding customization via UI is limited. | FE: `/admin/settings/onboarding`, BE: `tenant/handler.go`, DB: `tenants` |
| **2. RBAC** | ✅ | Multi-role assignments, Tenant/Branch/Class scope support, Middleware guards. | UI for granular permission toggles per role is pending. | FE: `/admin/settings/roles`, BE: `middleware/auth.go`, DB: `roles`, `role_assignments` |
| **3. Students (SIS)** | ✅ | Profile management, Remarks with acknowledgments, Gate passes, Scoped search. | Student promotion logic is basic. | FE: `/admin/students`, BE: `sis/student.go`, DB: `students`, `student_remarks` |
| **4. Admissions** | ✅ | Enquiry tracking, Application processing, Lead source tracking. | Auto-conversion to student profile is partial. | FE: `/admin/admissions/enquiries`, BE: `admission/handler.go`, DB: `leads`, `approval_requests` |
| **5. Attendance** | ✅ | Daily & Period-wise marking, Leave requests, Approval workflow. | Biometric sync is via API/Webhook only. | FE: `/admin/attendance`, BE: `attendance/handler.go`, DB: `attendance_sessions` |
| **6. Fees (Offline)** | ✅ | Fee heads, Plans, Receipt series, Offline collection. | Partial payment allocation logic is basic. | FE: `/admin/finance/collect`, BE: `finance/receipt.go`, DB: `fee_heads`, `receipts` |
| **7. Online Payments** | 🟡 | Razorpay/PayU order creation, Webhook signature verification. | Frontend "Pay Now" button in Parent app. | BE: `finance/payment.go`, DB: `payment_orders` |
| **8. Receipts / PDFs** | ✅ | Auto-numbering series, Handlebars templates for receipts. | Multiple layout options for report cards. | BE: `finance/printer.go`, DB: `pdf_templates`, `pdf_jobs` |
| **9. Notices** | ✅ | Target-based publishing (Class/Section), Attachments support. | Scheduled publishing is via worker polling. | FE: `/admin/notices`, BE: `notices/handler.go`, DB: `notices`, `notice_acks` |
| **10. Messaging Hub** | 🟡 | Notification templates, Outbox processing, Webhook adapter. | Direct Telco/WhatsApp API logic. | BE: `worker/internal/notification/adapter.go`, DB: `notification_templates` |
| **11. Exams / Results** | ✅ | Exam creation, Marks entry, Max marks enforcement. | Auto-ranking and aggregate calculations. | FE: `/admin/exams`, BE: `exams/handler.go`, DB: `exams`, `marks_entries` |
| **12. Certificates** | ✅ | Template viewing, Reason tracking, Student links. | Dynamic custom fields on TCs. | FE: `/admin/certificates`, BE: `safety/handler.go` |
| **13. Reports** | ✅ | Filterable exports, PDF job queue. | Advanced visual charts/analytics. | FE: `/admin/reports`, BE: `files/handler.go`, DB: `pdf_jobs` |
| **14. Transport** | ✅ | Vehicle registry, Routes, Driver assignment. | Live GPS tracking integration. | FE: `/admin/transport`, DB: `transport_vehicles` |
| **15. Library** | ✅ | Book registry, QR-based scan, Issue/Return logic. | Fine calculation for overdue books. | FE: `/admin/library/books`, BE: `library/handler.go` |
| **16. Hostel** | 🟡 | Room allocation layout. | Mess billing and attendance integration. | FE: `/admin/hostel`, DB: `schema.sql` (Hostel segments) |
| **17. Staff / HR** | ✅ | Employee directory, Payroll management (basic), Tasks. | Bio-metric attendance for staff is API-only. | FE: `/admin/hrms`, BE: `hrms/handler.go` |
| **18. Knowledgebase** | ✅ | Document indexing, Semantic search, AI-powered helpdesk. | Feedback loop for AI answers. | FE: `/admin/kb`, BE: `kb/handler.go`, BE: `ai/handler.go` |
| **19. Automations** | ✅ | Webhook triggers, Studio UI, Outbox processing. | Complex multi-step conditional workflows. | FE: `/admin/settings/automation`, BE: `automation/handler.go` |
| **20. Audit Logs** | ✅ | State-change tracking (Before/After), IP/User-agent logging. | Visual timeline for specific resources. | BE: `foundation/audit/logger.go`, DB: `audit_logs` |

## C) Role-based Demo Readiness

| Role | Screens | Journey Readiness | Breaks |
| :--- | :--- | :--- | :--- |
| **Admin** | Full Admin Panel (Dashboard to Settings) | ✅ Create school -> Onboard Staff -> Collect Fees | Complex RBAC configuration |
| **Principal** | Strategy Dashboard, approvals, HRMS | ✅ Review performance -> Approve leaves | Detailed Finance charts |
| **Teacher** | Dashboard, Attendance, Marks, Dairy | ✅ Mark Attendance -> Post Remark -> Enter Marks | Timetable management |
| **Accountant** | Finance Counter, Receipts, Waivers | ✅ Cash Collection -> Issue Receipt -> Check Dues | Refund workflows |
| **Reception** | Admissions (Enquiries), Safety (Visitors) | ✅ Log Enquiry -> Admit Student -> Issue Gatepass | Follow-up reminders |
| **Parent** | Fees, Notices, Results, Attendance | ✅ View Attendance -> Acknowledge Remark | Online Fee Payment (FE) |

## D) API Inventory (Current)

**Base URL:** `/v1`

| Group | Auth | Endpoints |
| :--- | :--- | :--- |
| **Public** | None | `/auth/login`, `/auth/forgot-password`, `/marketing/leads`, `/admission/apply` |
| **Admin** | `RoleGuard(admin)` | `/admin/students`, `/admin/finance/collect`, `/admin/attendance/mark`, `/admin/exams/create` |
| **Teacher** | `RoleGuard(teacher)` | `/teacher/attendance`, `/teacher/homework`, `/teacher/exams/marks` |
| **Parent** | `RoleGuard(parent)` | `/parent/student/profile`, `/parent/notices`, `/parent/finance/dues` |
| **AI** | `JWT` | `/ai/helpdesk` (Parent Q&A), `/ai/lesson-plan` (Teacher only) |
| **SaaS** | `RoleGuard(super_admin)` | `/platform/tenants`, `/platform/monitoring`, `/platform/audit-logs` |

## E) Database Inventory (Current)

**Storage:** PostgreSQL (pgx/v5)

| Category | Primary Tables |
| :--- | :--- |
| **Core** | `tenants`, `branches`, `users`, `roles`, `permissions`, `sessions` |
| **Financial** | `fee_heads`, `fee_plans`, `receipts`, `receipt_series`, `payment_orders`, `fee_refunds` |
| **SIS** | `students`, `guardians`, `student_remarks`, `student_documents`, `gate_passes` |
| **Academic** | `academic_years`, `classes`, `sections`, `subjects`, `exams`, `marks_entries`, `timetable` |
| **Infrastructure** | `audit_logs`, `outbox_events`, `files`, `pdf_templates`, `notification_templates` |

## F) Tests & Quality
- **Unit Tests:** Found in `services/api/internal/service/...` for Auth, SIS, and Finance. Coverage is strong for core logic.
- **E2E Tests:** Playwright tests in `apps/marketing/tests/smoke.spec.ts` cover 60+ routes and SEO metadata.
- **Build Quality:**
  - `pnpm build`: Successful for `apps/web` and `apps/marketing`.
  - `go build`: Successful for `services/api` and `services/worker`.
- **Linting:** Standard ESLint/GoLint configured in project roots.

## G) Deployment & Environment
- **Local Run:** `docker-compose up -d` (Postgres/Redis) -> `npm run dev` (Frontends) -> `go run cmd/api/main.go` (Backend).
- **Env Vars (Core):** `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `UPLOAD_DIR`, `UPLOAD_URL`.
- **Platform Specific:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SENTRY_DSN`, `UPLOAD_PROVIDER`.

## H) Immediate Next Steps (Priority)
1. **Frontend Online Payment:** Implement `PaymentButton` in `apps/web/src/app/(parent)/parent/fees` using Razorpay checkout scripts.
2. **Notification Connectors:** Replace `WebhookAdapter` stubs with direct `twilio-go` and `gupshup-go` integrations in `services/worker`.
3. **Advanced Payroll:** Implement `CalculateMonthlyPayroll` in `services/api/internal/service/hrms/payroll.go` with tax/PF logic.
4. **Biometric Polling:** Add background job in `services/worker` to pull logs from common Indian biometric APIs (e.g. BioID).
5. **Mobile Shell Shell Push:** Link `notification_templates` to FCM/APNS for native push notifications via Capacitor.
6. **Refund Logic:** Harden `DecideRefund` in `services/api/internal/service/finance/refunds.go` with approval workflow.
7. **Promotion Management:** Create `BulkPromoteStudents` handler in `sis/student.go` to rollover academic years.
8. **Digital Results:** Implement `GenerateReportCard` PDF job in `services/api/internal/service/exams/results.go`.
9. **Inventory POs:** Add Purchase Order (PO) workflow to `apps/web/src/app/(admin)/admin/inventory`.
10. **Global Search:** Implement the "Command Palette" (`Command` component) in Admin layout to search Students/Rooms/Staff globally.

**REPORT GENERATED ON:** 2026-02-22
**REPORT PATH:** `/Users/ranjeet/projects/schoolERP/SCHOOLERP_STATUS_REPORT.md`
