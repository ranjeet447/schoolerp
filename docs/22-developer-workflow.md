# 22 - Developer Workflow

This document describes the daily activities and standards for developers working on the SchoolERP monorepo.

## 1. Local Development
We use **pnpm** and **Turborepo** to manage the codebase.

- **Start all services**: `npm run dev` from the root.
- **Target specific apps**: `pnpm --filter @schoolerp/web dev`.
- **Utility Tasks**: Use the [Makefile](../Makefile) for common commands like `make dev-api` or `make storybook`.

## 2. Git Conventions
We follow **Conventional Commits** to keep our history clean and make it easier to generate changelogs.

- `feat`: A new feature.
- `fix`: A bug fix.
- `docs`: Documentation only changes.
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to the build process or auxiliary tools and libraries.

## 3. PR Process & CI Gating
All changes must go through a Pull Request on GitHub.
- **Branching**: Use descriptive names like `feature/attendance-api` or `fix/login-bug`.
- **CI Status**: Your PR must pass all CI checks before it can be merged:
  - Linting (ESLint, golangci-lint).
  - Type checking (TSC).
  - Unit tests.
  - Playwright smoke tests.

## 4. Code Standards
- **Go**: Follow official Go formatting (`gofmt`).
- **Frontend**: Use functional components and hooks. Prefer the shared UI library in `packages/ui`.
- **Documentation**: Update the `docs/` folder if you introduce new architectural patterns or services.

## 5. Common Pitfalls
- **Missing tenant_id**: Always verify that new tables and queries are tenant-scoped.
- **Hardcoding URLs**: Use environment variables for API endpoints and external service URLs.
