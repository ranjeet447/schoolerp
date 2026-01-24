# Changelog - School ERP SaaS

## [Release 1.0.0] - 2026-02-05

### Added
- **Foundation Hardening**: Multi-tenant isolation, request_id propagation, audit logging, policy engine, and generic approvals framework.
- **SIS (Student Information System)**: Complete student/guardian management, academic structure (academic years, classes, sections, subjects), and CSV import wizard.
- **Attendance & Leaves**: Daily attendance marking, leave request workflows for parents, and configurable attendance locks.
- **Fees & Receipts**: Fee plan builder, student account management, sequential receipt generation, and cancellation/refund workflows.
- **Notices & Circulars**: Targeted notice publishing with parent acknowledgment tracking.
- **Exams & Report Cards**: Exam scheduling, bulk marks entry for teachers, result publishing, and visual report card previews.
- **Shared UI Library**: 15+ reusable React components documented in Storybook.
- **Testing Suite**: Playwright smoke tests for all core modules and Go integration tests for business logic.

### Changed
- Refined database schema for multi-branch support and hardened financial transactions.
- Standardized API response patterns and error handling.
