# Product Roadmap & Feature Status

This document tracks the high-level roadmap and current status of SchoolERP modules.

> **Canonical Tracker:** [`FEATURE_TRACKER.md`](file:///Users/ranjeet/projects/schoolERP/FEATURE_TRACKER.md) — the unified source of truth for all implementation status.

**Current Phase:** Phase 3 (Automation & Optimization)

---

## 1. Roadmap Phases

### ✅ Phase 1: Released
**Focus: Academic & Financial Core** *(Q1 2026)*

- Student Information System (SIS): Admissions, profiles, document management
- Attendance: Daily student/staff, leave management
- Fees & Payments: Fee heads, installments, receipts, gateway reconciliation, Tally export
- Exams & Results: Marks entry, report cards, exam scheduling
- Core Communication: Notices, announcements, in-app alerts
- Multilingual UI: Hindi/English support

### ✅ Phase 2: Released
**Focus: Logistics & Operations** *(Q2 2026)*

- Transport: Routes, stops, vehicle management
- Library: Books, issue/return, digital assets, ISBN lookup
- Inventory & Assets: Stock management, purchase orders, multi-godown
- Admissions Portal: Public forms, workflow management
- HRMS: Employees, salary structures, payroll, biometric attendance
- Alumni: Directory, placement drives
- Safety: Visitors, discipline incidents, broadcasts
- Communication: PTM booking, moderated chat

### 🚧 Phase 3: In Progress
**Focus: Automation & Optimization** *(Q3/Q4 2026)*

- **Academic:** Hall tickets, gradebook schema management, coordinator review flows
- **Operations:** Fee reminder automation, scheduled notices, low stock alerts
- **Discipline:** Severity alerts, merit/demerit tracking UI
- **Safety:** QR gate passes, photo verification, pickup event logging
- **Transport:** Maintenance/fuel logs, transport fee integration
- **HRMS:** KRA/performance tracking, staff leave management
- **Portfolio:** Cross-campus analytics, financial health dashboards
- **Automation Studio:** Rule engine, custom templates, scheduled tasks

### 📋 Phase 4: Planned
**Focus: AI & Intelligence** *(2027)*

- Fee Intelligence: Risk flags, predictive cashflow, smart reminder cadence
- Advanced AI: Timetable solver, attendance anomaly detection, remedial suggestions
- Transport GPS: Live tracking, deviation alerts
- AI Parent Helpdesk: WhatsApp, wallet billing

---

## 2. AI Strategy

### AI Suite v1 (In Progress)
| Feature | Status | Module |
|---|---|---|
| Teacher Copilot — Lesson Plans | ✅ Done | M17 |
| AI Parent Helpdesk — Web | ⚠️ Partial | M18 |
| Fee Intelligence | 📋 Planned | M19 |

### AI Suite Premium (Planned)
| Feature | Status | Module |
|---|---|---|
| Constraint Timetable Solver | 📋 Planned | M20 |
| Attendance Anomaly Alerts | 📋 Planned | M20 |
| Transport Deviation Logs | 📋 Planned | M20 |
| Remedial Study Suggestions | 📋 Planned | M20 |

---

## 3. Related Documentation

| Document | Description |
|---|---|
| [FEATURE_TRACKER.md](file:///Users/ranjeet/projects/schoolERP/FEATURE_TRACKER.md) | Unified implementation tracker (200+ tasks) |
| [api-reference.md](file:///Users/ranjeet/projects/schoolERP/docs/api-reference.md) | Complete API reference (120+ endpoints) |
| [UI_SCREEN_CHECKLIST.md](file:///Users/ranjeet/projects/schoolERP/docs/UI_SCREEN_CHECKLIST.md) | UI screens + Storybook component checklist |
| [PLAYWRIGHT_TEST_MAP.md](file:///Users/ranjeet/projects/schoolERP/docs/PLAYWRIGHT_TEST_MAP.md) | E2E test regression suite map (35 tests) |

---

> **Change Log:**
> - **v3.0 (Feb 19, 2026):** Unified trackers. Linked to FEATURE_TRACKER.md. Added Phase 3/4 detail.
> - **v2.0 (Feb 2026):** Consolidated roadmap. Split AI into Practical vs Plugin.
