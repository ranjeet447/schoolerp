# UI Screen Checklist — Storybook Components + Pages

**Last Updated:** 2026-02-20

## Status Legend
- `[ ]` Not built
- `[~]` Page exists, no Storybook story
- `[x]` Page + Storybook story

---

## Shared Components (`packages/ui`)

### Core Primitives
- [x] Button (variants: primary, secondary, destructive, outline, ghost)
- [x] Input / Label
- [x] Select / MultiSelect
- [x] Dialog / Modal
- [x] Dropdown Menu
- [x] Tabs
- [x] Table (sortable, paginated)
- [x] Card
- [x] Badge / Status Badge
- [~] Tooltip / Popover
- [~] Skeleton Loader
- [x] Avatar
- [x] Progress Bar
- [~] Toast / Sonner notifications
- [x] ErrorState (generic, offline, 404, server)
- [ ] DatePicker
- [ ] FileUpload (with drag-and-drop)
- [ ] QRCode (generation + display)
- [ ] RichTextEditor (for notices/homework)
- [ ] MapView (for transport GPS)
- [ ] Timeline (for audit/incident logs)
- [ ] StatCard (dashboard metric card)
- [ ] EmptyState (no data illustration)

---

## Admin Pages (`/admin/*`)

### Dashboard
- [~] `/admin/dashboard` — Admin dashboard (stats cards, recent activity)
- [~] `/admin/dashboard/strategy` — Strategy and planning dashboard

### SIS — Students
- [~] `/admin/students` — Student list (search, filters, pagination)
- [~] `/admin/students/[id]` — Student profile (tabs: info, attendance, fees, exams, notices)
- [~] `/admin/students/confidential-notes` — Sensitive student notes
- [~] `/admin/students/gate-passes` — Gate pass management
- [~] `/admin/students/promotion` — Student promotion workflows
- [~] `/admin/bulk-import` — Bulk student import

### Academic Structure
- [~] `/admin/academics/class-teachers` — Class teacher assignments
- [~] `/admin/academics/holidays` — Holiday calendar management
- [~] `/admin/academics/lesson-review` — Lesson plan review
- [~] `/admin/academics/question-bank` — Question bank management
- [~] `/admin/academics/question-bank/generate` — Question generation
- [~] `/admin/academics/specializations` — Subject specializations
- [~] `/admin/academics/syllabus-lag` — Syllabus progress tracking
- [~] `/admin/timetable` — Timetable editor
- [~] `/admin/exams` — Exam management + marks entry
- [~] `/admin/certificates` — Certificate request management
- [~] `/admin/learning-resources` — Learning resources library
- [~] `/admin/calendar` — School events calendar
- [ ] `/admin/academics/gradebook` — Gradebook schema management (board-aware)
- [ ] `/admin/exams/hall-tickets` — Hall ticket generation

### Finance
- [~] `/admin/finance` — Fee heads, plans, dashboard
- [~] `/admin/finance/collect` — Fee collection page
- [~] `/admin/finance/setup` — Finance setup and configuration
- [ ] `/admin/finance/receipts` — Receipt list + PDF
- [ ] `/admin/finance/reminders` — Fee reminder cadence settings
- [ ] `/admin/finance/intelligence` — Fee intelligence dashboard (P4)

### Attendance
- [~] `/admin/attendance` — Daily attendance marking
- [~] `/admin/attendance/settings` — Attendance configuration
- [~] `/admin/staff-attendance` — Staff attendance

### Communication
- [~] `/admin/notices` — Notice management (create, list, target scope)
- [~] `/admin/communication` — PTM events, chat rooms, moderation

### Safety & Discipline
- [~] `/admin/safety/visitors` — Visitor log management
- [~] `/admin/safety/verify` — Safety verification console
- [ ] `/admin/safety/gate-pass` — Gate pass management
- [ ] `/admin/safety/pickups` — Pickup authorization management
- [ ] `/admin/safety/broadcasts` — Emergency broadcast console
- [ ] `/admin/safety/incidents` — Discipline incident log
- [ ] `/admin/safety/behavior` — Merit/demerit tracking

### Transport
- [~] `/admin/transport` — Vehicles, routes, drivers, allocations (overview)
- [~] `/admin/transport/vehicles` — Vehicle registry
- [~] `/admin/transport/routes` — Route management
- [~] `/admin/transport/drivers` — Driver management
- [~] `/admin/transport/allocations` — Student/route allocation
- [ ] `/admin/transport/gps` — Live GPS tracking view (P4)
- [ ] `/admin/transport/maintenance` — Fuel + maintenance logs
- [ ] `/admin/transport/fees` — Transport fee integration

### Library
- [~] `/admin/library/books` — Book catalog
- [~] `/admin/library/issues` — Issue/return desk
- [~] `/admin/library/scan` — Barcode/scan workflow
- [~] `/admin/library/digital-assets` — Digital assets management
- [~] `/admin/library/reading` — Student reading progress

### Inventory
- [~] `/admin/inventory` — Inventory overview
- [~] `/admin/inventory/items` — Item master
- [~] `/admin/inventory/suppliers` — Supplier management
- [~] `/admin/inventory/transactions` — Stock movements
- [ ] `/admin/inventory/alerts` — Low stock alerts dashboard
- [ ] `/admin/inventory/supplier-performance` — Supplier metrics

### HRMS
- [~] `/admin/hrms` — HRMS overview
- [~] `/admin/hrms/employees` — Employee list
- [~] `/admin/hrms/payroll` — Payroll management
- [~] `/admin/hrms/tasks` — HR task workflows
- [ ] `/admin/hrms/performance` — KRA/performance review
- [ ] `/admin/hrms/leave` — Staff leave management

### Admissions
- [~] `/admin/admissions/enquiries` — Enquiry pipeline
- [~] `/admin/admissions/applications` — Application review queue

### Alumni
- [~] `/admin/alumni` — Alumni directory + placement drives

### Portfolio (Multi-School)
- [~] `/admin/portfolio` — School groups management
- [ ] `/admin/portfolio/dashboard` — Cross-campus analytics

### Settings
- [~] `/admin/school-profile` — School profile settings
- [~] `/admin/custom-fields` — Custom field definitions
- [~] `/admin/houses` — Student house management
- [~] `/admin/id-cards` — ID card template editor
- [~] `/admin/hostel` — Hostel buildings/rooms
- [~] `/admin/settings/automation` — Automation settings
- [~] `/admin/settings/branding` — Branding settings
- [~] `/admin/settings/master-data` — Master data settings
- [~] `/admin/settings/onboarding` — Onboarding settings
- [~] `/admin/settings/plugins` — Plugin settings
- [~] `/admin/settings/roles` — Role/permission settings
- [~] `/admin/settings/templates` — Template settings
- [~] `/admin/settings/users` — User management settings

---

## Parent Pages (`/parent/*`)
- [~] `/parent/dashboard` — Parent dashboard
- [~] `/parent/notices` — Notice list with read/ack
- [~] `/parent/fees` — Per-child fee summary + receipts
- [~] `/parent/results` — Exam results
- [~] `/parent/children` — Child directory
- [~] `/parent/children/[id]` — Child profile (multi-tab)
- [~] `/parent/homework` — Homework tracking
- [~] `/parent/leaves` — Leave history and metrics

---

## Teacher Pages (`/teacher/*`)
- [~] `/teacher/dashboard` — Teacher dashboard
- [~] `/teacher/attendance` — Attendance marking
- [~] `/teacher/homework` — Homework create/manage
- [~] `/teacher/notices` — Teacher notices
- [~] `/teacher/exams/marks` — Marks entry

---

## Super Admin Pages (`/platform/*`)

### Core Control Plane
- [~] `/platform/dashboard` — Platform summary dashboard
- [~] `/platform/analytics` — Platform analytics and trends
- [~] `/platform/settings` — Global platform settings

### Tenant Management
- [~] `/platform/tenants` — Tenant portfolio overview
- [~] `/platform/tenants/list` — Tenant directory and filters
- [~] `/platform/tenants/new` — Tenant onboarding
- [~] `/platform/tenants/[id]` — Tenant control panel
- [~] `/platform/signup-requests` — Signup request review queue

### Billing & Plans
- [~] `/platform/payments` — Billing overview dashboard
- [~] `/platform/payments/manage` — Invoices, config, collections
- [~] `/platform/plans` — Plan and feature rollout management

### Users & Access
- [~] `/platform/internal-users` — Internal admin governance dashboard
- [~] `/platform/internal-users/manage` — Internal users, RBAC, access controls
- [~] `/platform/users` — Global user directory
- [~] `/platform/audit-logs` — Platform audit explorer

### Security & Operations
- [~] `/platform/security-events` — Security event stream
- [~] `/platform/blocks` — Security block rules and releases
- [~] `/platform/password-policy` — Password policy management
- [~] `/platform/secrets` — Secret rotation workflow
- [~] `/platform/monitoring` — Health and queue monitoring
- [~] `/platform/incidents` — Incident management

### Integrations & Support
- [~] `/platform/integrations` — Integration health + events
- [~] `/platform/integrations/manage` — Webhooks/log/security tabs
- [~] `/platform/support` — Support ticket operations
- [~] `/platform/legal` — Legal document publishing
- [~] `/platform/marketing` — Announcements and changelogs

---

## Accountant Pages (`/accountant/*`)
- [~] `/accountant/dashboard` — Accountant dashboard
- [~] `/accountant/fees` — Fees operations
- [~] `/accountant/payments` — Payment tracking
- [~] `/accountant/reports` — Accountant reports

---

## Public & Auth Pages
- [~] `/` — Marketing/home
- [~] `/admissions` — Public admissions landing
- [~] `/sales/bookings` — Sales booking flow
- [~] `/auth/login` — Login
- [~] `/auth/forget-password` — Forgot password
- [~] `/auth/legal-accept` — Legal acceptance flow

---

## Storybook Action Items

### Phase 1 — Core Component Stories (P0)
- [x] Create stories for: Button
- [x] Create stories for: Input
- [x] Create stories for: Select
- [x] Create stories for: Dialog
- [x] Create stories for: Table
- [x] Create stories for: Card
- [x] Create stories for: Badge
- [x] Create stories for: Tabs
- [ ] Create stories for: Toast
- [x] Create stories for: ErrorState
- [~] Add stories for composite patterns: SearchableList, FormWithValidation, DataTable
- [x] Add stories for all exported `@schoolerp/ui` components (primitives + composites)

### Phase 2 — Page Stories (P1)
- [ ] Student list page story
- [ ] Fee collection page story
- [ ] Attendance marking page story
- [ ] Notice creation page story

### Phase 3 — New Components (P2)
- [ ] DatePicker component + story
- [ ] FileUpload component + story
- [ ] QRCode component + story
- [ ] MapView component + story
- [ ] Timeline component + story
- [ ] StatCard component + story
- [ ] EmptyState component + story
