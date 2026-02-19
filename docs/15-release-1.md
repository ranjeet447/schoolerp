# Release 1: School ERP SaaS Foundation

## Overview
Release 1 establishes the production-grade foundation for the School ERP SaaS, covering core administrative, academic, and financial workflows with strict multi-tenancy and auditability.

## Scoped Modules

### 1. SIS (Student Information System) ✅
- **Data Model**: `students`, `guardians`, `academic_years`, `classes`, `sections`, `subjects`.
- **Key Features**: Admission management, student profiles, academic structure, CSV import wizard, custom fields, document management.

### 2. Attendance & Leaves ✅
- **Data Model**: `attendance_sessions`, `attendance_entries`, `leave_requests`.
- **Key Features**: Daily attendance marking, parent leave requests, 48h locking policy, absence auto-alerts.

### 3. Fees & Receipts ✅
- **Data Model**: `fee_heads`, `fee_plans`, `receipts`, `receipt_series`, `refunds`, `payment_orders`, `payment_gateway_configs`.
- **Key Features**: Fee plan construction, sequential receipting, partial payments, cancellation flows, online payment (Razorpay), Tally export, scholarships, concessions.

### 4. Notices & Circulars ✅
- **Data Model**: `notices`, `notice_acks`.
- **Key Features**: Targeted broadcasting (class/section/all), parent acknowledgment tracking, read receipts.

### 5. Exams & Report Cards ✅
- **Data Model**: `exams`, `exam_subjects`, `marks_entries`, `grading_scales`.
- **Key Features**: Exam scheduling, bulk marks entry, published result view, grading scale configuration.

## Engineering Foundation
- **Multi-Tenancy**: Strict `tenant_id` enforcement at database and API middleware levels.
- **Auditability**: Append-only audit logs for all mutations with request correlation.
- **Security**: RBAC and Policy Engine for conditional action authorization.
- **Reliability**: Worker-based PDF generation and file storage abstraction (MinIO/S3).
- **AI Integration**: Multi-provider (OpenAI/Anthropic/Gemini) teacher copilot and parent helpdesk.

## Test Plan Summary
- **Unit/Integration**: Go-side testing for policy enforcement and financial logic.
- **Component**: Storybook component library (see [Component System](./12-storybook-component-system.md)).
- **E2E**: Playwright regression suite (see [Test Map](./PLAYWRIGHT_TEST_MAP.md)).

## Related
- [Release 2](./24-release-2.md)
- [Product Roadmap](./product/roadmap.md)
- [Feature Tracker](../FEATURE_TRACKER.md)
