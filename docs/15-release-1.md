# Release 1: School ERP SaaS Foundation

## Overview
Release 1 establishes the production-grade foundation for the School ERP SaaS, covering core administrative, academic, and financial workflows with strict multi-tenancy and auditability.

## Scoped Modules

### 1. SIS (Student Information System)
- **Status**: Complete
- **Data Model**: `students`, `guardians`, `academic_years`, `classes`, `sections`, `subjects`.
- **Key Features**: Admission management, student profiles, academic structure, CSV import wizard.

### 2. Attendance & Leaves
- **Status**: Complete
- **Data Model**: `attendance_sessions`, `attendance_entries`, `leave_requests`.
- **Key Features**: Daily attendance marking, parent leave requests, 48h locking policy.

### 3. Fees & Receipts
- **Status**: Complete
- **Data Model**: `fee_heads`, `fee_plans`, `receipts`, `receipt_series`, `refunds`.
- **Key Features**: Fee plan construction, sequential receipting, partial payments, cancellation flows.

### 4. Notices & Circulars
- **Status**: Complete
- **Data Model**: `notices`, `notice_acks`.
- **Key Features**: Targeted broadcasting, parent acknowledgment tracking.

### 5. Exams & Report Cards
- **Status**: Complete
- **Data Model**: `exams`, `exam_subjects`, `marks_entries`.
- **Key Features**: Exam scheduling, bulk marks entry, published result view, PDF report card preview.

## Engineering Foundation
- **Multi-Tenancy**: Strict `tenant_id` enforcement at the database and API middleware levels.
- **Auditability**: Append-only audit logs for all mutations with request correlation.
- **Security**: RBAC and Policy Engine for conditional action authorization.
- **Reliability**: Worker-based PDF generation and file storage abstraction (MinIO/S3).
- **Quality**: 100% Storybook coverage for new UI components and CI-gated Playwright smoke tests.

## Test Plan Summary
- **Unit/Integration**: Go-side testing for policy enforcement and financial logic.
- **Component**: Storybook visual regression and documented states.
- **E2E**: Playwright smoke tests for "Admin Setup -> Teacher Mark -> Parent View" happy paths across all modules.
## Next Steps
For future scope and Phase 2 implementation details, refer to:
- [Roadmap Summary](./16-roadmap-summary.md)
- [Phase 2 PRD Enhancements](./prd/)
