# Release 2: Operations & Specialized Modules

## Overview
Release 2 expands the SchoolERP foundation with specialized modules for school operations, logistics, and professional networking.

## Scoped Modules

### 1. Transport Management ✅
- **Features**: 
    - Vehicle and Driver registration.
    - Route planning and Stop sequencing with lat/long coordinates.
    - Student allocation to routes.
    - Cost per stop (pickup/drop) configuration.

### 2. Library Management ✅
- **Features**:
    - Cataloging for physical books and digital assets (PDF/EPUB).
    - Issue/Return workflow with due date management.
    - Automatic fine calculation for overdue returns.
    - ISBN lookup via Open Library API.

### 3. Inventory & Procurement ✅
- **Features**:
    - Category-based item management with reorder levels.
    - Supplier database.
    - Purchase Order (PO) workflows (draft → submitted → approved → received).
    - Multi-godown stock level tracking and adjustments.

### 4. Admission Pipeline ✅
- **Features**:
    - Public enquiry form for lead generation.
    - Lead tracking and status updates.
    - Configurable document type requirements.
    - Workflow policies (auto-advance, concurrency control).

### 5. HRMS & Payroll ✅
- **Features**:
    - Employee lifecycle management.
    - Salary structure configuration (Basic, HRA, DA, Allowances, Deductions).
    - Payroll run processing and automated payslip PDF generation.
    - Biometric attendance integration (RFID device ingestion).
    - Teacher specializations and class-teacher assignments.

### 6. Alumni & Career ✅
- **Features**:
    - Alumni database with batch/year/company/role tracking.
    - Placement drive management with application workflow.
    - LinkedIn profile linking and verified status.

### 7. Communication ✅
- **Features**:
    - PTM event creation with automatic slot generation.
    - Slot booking for parents.
    - Moderated two-way chat (quiet hours, blocked keywords).
    - Messaging event logs.

### 8. Safety & Discipline ✅
- **Features**:
    - Discipline incident reporting with categories.
    - Visitor check-in/check-out with ID verification.
    - Pickup authorization management.
    - Emergency broadcast system with multi-channel delivery.

## Integration
- All modules utilize the central **Audit Log** and **Policy Engine**.
- Multi-tenancy is strictly enforced across all modules.
- Worker service handles async operations: payslip PDFs, absence alerts, broadcast fan-out, webhook delivery.

## Related
- [Release 1](./15-release-1.md)
- [Product Roadmap](./product/roadmap.md)
- [Feature Tracker](../FEATURE_TRACKER.md)
