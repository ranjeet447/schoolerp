# UI Screen Checklist — Storybook Components + Pages

**Last Updated:** 2026-02-19

## Status Legend
- `[ ]` Not built
- `[~]` Page exists, no Storybook story
- `[x]` Page + Storybook story

---

## Shared Components (packages/ui)

### Core Primitives
- [~] Button (variants: primary, secondary, destructive, outline, ghost)
- [~] Input / Label
- [~] Select / MultiSelect
- [~] Dialog / Modal
- [~] Dropdown Menu
- [~] Tabs
- [~] Table (sortable, paginated)
- [~] Card
- [~] Badge / Status Badge
- [~] Tooltip / Popover
- [~] Skeleton Loader
- [~] Avatar
- [~] Progress Bar
- [~] Toast / Sonner notifications
- [~] ErrorState (generic, offline, 404, server)
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

### SIS — Students
- [~] `/admin/students` — Student list (search, filters, pagination)
- [~] `/admin/students/[id]` — Student profile (tabs: info, attendance, fees, exams, notices)
- [~] `/admin/bulk-import` — Bulk student import

### Academic Structure
- [~] `/admin/academics` — Class/section/subject management, homework, lesson plans
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
- [~] `/admin/finance/receipts` — Receipt list + PDF
- [ ] `/admin/finance/reminders` — Fee reminder cadence settings
- [ ] `/admin/finance/intelligence` — Fee intelligence dashboard (P4)

### Attendance
- [~] `/admin/attendance` — Daily attendance marking
- [~] `/admin/staff-attendance` — Staff attendance

### Communication
- [~] `/admin/notices` — Notice management (create, list, target scope)
- [~] `/admin/communication` — PTM events, chat rooms, moderation

### Safety & Discipline
- [ ] `/admin/safety/visitors` — Visitor log management
- [ ] `/admin/safety/gate-pass` — Gate pass management
- [ ] `/admin/safety/pickups` — Pickup authorization management
- [ ] `/admin/safety/broadcasts` — Emergency broadcast console
- [ ] `/admin/safety/incidents` — Discipline incident log
- [ ] `/admin/safety/behavior` — Merit/demerit tracking

### Transport
- [~] `/admin/transport` — Vehicles, routes, drivers, allocations (tabbed)
- [ ] `/admin/transport/gps` — Live GPS tracking view (P4)
- [ ] `/admin/transport/maintenance` — Fuel + maintenance logs
- [ ] `/admin/transport/fees` — Transport fee integration

### Library
- [~] `/admin/library` — Book catalog, issues/returns (tabbed)
- [ ] `/admin/library/digital` — Digital assets management
- [ ] `/admin/library/reading-progress` — Student reading progress

### Inventory
- [~] `/admin/inventory` — Items, stock, suppliers, POs (tabbed)
- [ ] `/admin/inventory/alerts` — Low stock alerts dashboard
- [ ] `/admin/inventory/supplier-performance` — Supplier metrics

### HRMS
- [~] `/admin/hrms` — Employee list, salary structures, payroll (tabbed)
- [ ] `/admin/hrms/performance` — KRA/performance review
- [ ] `/admin/hrms/leave` — Staff leave management

### Admissions
- [~] `/admin/admissions` — Enquiries, applications, workflow settings

### Alumni
- [~] `/admin/alumni` — Alumni directory + placement drives

### Portfolio (Multi-School)
- [~] `/admin/portfolio` — School groups management
- [ ] `/admin/portfolio/dashboard` — Cross-campus analytics

### Settings
- [~] `/admin/settings` — Roles, permissions, custom fields, school profile
- [~] `/admin/school-profile` — School profile settings
- [~] `/admin/custom-fields` — Custom field definitions
- [~] `/admin/houses` — Student house management
- [~] `/admin/id-cards` — ID card template editor
- [~] `/admin/hostel` — Hostel buildings/rooms

---

## Parent Pages (`/parent/*`)
- [~] Parent dashboard — Children overview, fees, notices
- [~] Parent notices — Notice list with read/ack
- [~] Parent fees — Per-child fee summary + receipts
- [~] Parent results — Exam results with CSV export
- [~] Parent attendance — Leave history with metrics
- [~] Child profile — Multi-tab child view

---

## Teacher Pages (`/teacher/*`)
- [~] Teacher attendance — Class-section selector, mark attendance
- [~] Teacher homework — Create/manage homework per section

---

## Storybook Action Items

### Phase 1 — Core Component Stories (P0)
- [ ] Create stories for: Button, Input, Select, Dialog, Table, Card, Badge, Tabs, Toast, ErrorState
- [ ] Add stories for composite patterns: SearchableList, FormWithValidation, DataTable

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
