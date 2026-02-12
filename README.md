# School ERP SaaS Monorepo (India-first)

A production-grade foundation for a multi-tenant School Operating System.

## Repository
- **GitHub**: [ranjeet447/schoolerp](https://github.com/ranjeet447/schoolerp)

## Architecture
- **Backend**: Go (chi + pgx + SQLC)
- **Frontend**: Next.js (App Router) + Tailwind + shadcn/ui
- **Infrastructure**: PostgreSQL + Redis + Minio
- **CMS**: Directus (Optional)
- **Mobile**: Capacitor
- **Quality**: Storybook + Playwright

## How to Run Locally

### 1. Prerequisites
- Docker & Docker Compose
- Node.js & pnpm
- Go (1.25+)

### 2. Infrastructure Setup
```bash
make up
# For CMS, run:
make up-cms
```

### 3. Migrations & Seed
```bash
# Apply migrations (using golang-migrate CLI or manual)
# Example manual apply if CLI not installed:
cat infra/migrations/*.up.sql | docker exec -i schoolerp-postgres-1 psql -U schoolerp

# Safe bootstrap seed (recommended default)
cat infra/migrations/seed_users.sql | docker exec -i schoolerp-postgres-1 psql -U schoolerp

# Destructive full reset + reseed (use with caution)
cat infra/migrations/seed_production.sql | docker exec -i schoolerp-postgres-1 psql -U schoolerp
```

### 4. Run Development Services
```bash
# Terminal 1: Go API
make dev-api

# Terminal 2: Go Worker
make dev-worker

# Terminal 3: SaaS App
make dev-web

# Terminal 4: Marketing Site
make dev-marketing
```

### 5. Storybook & Testing
```bash
# View components in isolation
make storybook

# Run E2E tests
make test-ui
```

## Feature Modules (Release 1 & 2)

All core modules have been implemented, tested, and documented:

### 1. SIS (Student Information System)
- **Foundation**: Academic years, classes, sections, and subjects.
- **Management**: Comprehensive student and guardian profiles with document storage.

### 2. Attendance & Leaves
- **Tracking**: Daily/Session-based attendance marking.
- **Approvals**: Leave request workflow with 48h locking policy.

### 3. Fees & Receipts (Finance)
- **Construction**: Multi-head fee plan builder.
- **Collection**: Sequential receipting, partial payments, and cancellation flows.

### 4. Notices & Circulars
- **Broadcasting**: Targeted notifications to specific classes or roles.
- **Tracking**: Parent acknowledgment tracking for critical circulars.

### 5. Exams & Report Cards
- **Assessment**: Exam scheduling and bulk marks entry.
- **Results**: Published result views and PDF report card generation.

### 6. Transport Management
- **Logistics**: Vehicles, drivers, routes, and stop management.
- **Safety**: Student allocation to routes with billing integration.

### 7. Library System
- **Catalog**: Physical book and digital asset management.
- **Operations**: Issue/Return tracking with automated fine calculation.

### 8. Inventory & Procurement
- **Assets**: Item catalog, categories, and supplier management.
- **Stock**: Purchase orders and real-time stock level tracking.

### 9. Admission Pipeline
- **Leads**: Public enquiry submission and lead management.
- **Conversion**: Application processing, document verification, and processing fee recording.

### 10. HRMS & Payroll
- **Personnel**: Employee profiles, departments, and designations.
- **Payroll**: Salary structures, payroll runs, and automated payslip generation.

### 11. Portfolio & Achievements
- **Growth**: Student achievement tracking and school group analytics.

### 12. Alumni Association
- **Network**: Alumni database and verification.
- **Careers**: Placement drive management and application tracking.

## Deployment Strategy (v1)

Release 1/2 is designed for easy deployment on modern cloud platforms:
1. **Frontend**: Deployed to **Vercel** (`apps/marketing` and `apps/web`).
2. **Backend**: Deployed to **Render** or **Railway** (Go standard library).
3. **Database**: **Supabase** (PostgreSQL).

Refer to [Deployment Documentation](./docs/23-deployment-infrastructure.md) for step-by-step instructions.

## Status: PRODUCTION READY ✅

### Documentation
- [API Reference](./docs/api-reference.md)
- [Changelog](./CHANGELOG.md)
- [Architecture Details](./docs/01-architecture-overview.md)
