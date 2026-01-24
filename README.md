# School ERP SaaS Monorepo (India-first)

A production-grade foundation for a multi-tenant School Operating System.

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
- Go (1.21+)

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
cat infra/seed/seed.sql | docker exec -i schoolerp-postgres-1 psql -U schoolerp
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

## Release 1 Status: COMPLETELY IMPLEMENTED ✅

All core modules for Release 1 have been implemented, tested (Playwright/Storybook), and documented:
- [x] Phase 1: Foundation Hardening
- [x] Phase 2: SIS (Student Information System)
- [x] Phase 3: Attendance + Leaves
- [x] Phase 4: Fees + Receipts
- [x] Phase 5: Notices + Acknowledgement
- [x] Phase 6: Exams + Report Cards

### Release Documentation
- [View Task Tracker](file:///Users/ranjeet/.gemini/antigravity/brain/dcf2a783-6d6e-405e-a0d1-c7795c4927c9/task.md)
- [View Implementation Walkthrough](file:///Users/ranjeet/.gemini/antigravity/brain/dcf2a783-6d6e-405e-a0d1-c7795c4927c9/walkthrough.md)
- [View Changelog](file:///Users/ranjeet/projects/schoolERP/CHANGELOG.md)
