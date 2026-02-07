# Changelog - School ERP SaaS

## [Unreleased] - 2026-02-07

### Added
- **Modernization Phase**: Upgraded core project dependencies to **Next.js 16.1.6** and **React 19.2.4**.
- **Unified Config Package**: Created `@schoolerp/config` to centralize and share Tailwind CSS v4 configurations across the monorepo.
- **Enhanced UI Library**: Implemented robust, modular versions of `DropdownMenu`, `Select`, `Tabs`, and `Switch` in the shared `@schoolerp/ui` package.

### Changed
- **Monorepo Standardization**: Global replacement of legacy `@/components/ui` imports with the standardized `@schoolerp/ui` package for improved maintainability.
- **Internationalization Refactor**: Updated `next-intl` setup for Next.js 16 compatibility, migrating `i18n.ts` to `src/i18n/request.ts`.
- **Dependency Management**: Optimized `pnpm` resolution using overrides to force React 19 type deduplication and resolve version conflicts.

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
