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

## Deployment Strategy (v1)

Release 1 is designed for easy deployment on modern cloud platforms:
1. **Frontend**: Deployed to **Vercel** (`apps/marketing` and `apps/web`).
2. **Backend**: Deployed to **Render** or **Railway** (Go standard library).
3. **Database**: **Supabase** (PostgreSQL).

Refer to [Deployment Documentation](./docs/23-deployment-infrastructure.md) for step-by-step instructions.

## Release 1 Status: COMPLETELY IMPLEMENTED ✅

All core modules for Release 1 have been implemented, tested (Playwright/Storybook), and documented:
- [x] Phase 1: Foundation Hardening
- [x] Phase 2: SIS (Student Information System)
- [x] Phase 3: Attendance + Leaves
- [x] Phase 4: Fees + Receipts
- [x] Phase 5: Notices + Acknowledgement
- [x] Phase 6: Exams + Report Cards

### Documentation
- [API Reference](./docs/api-reference.md)
- [Changelog](./CHANGELOG.md)
