# 00 - Getting Started

Welcome to the SchoolERP monorepo. This guide will help you set up and start the various services.

## Prerequisites

- **PNPM**: Fast, disk space efficient package manager.
- **Go**: Language used for backend services (API and Worker).
- **Docker**: Used for infrastructure (PostgreSQL, Redis, etc.).

## Infrastructure Setup

Before starting the applications, bring up the database and other services:

```bash
make up
```
This runs `docker-compose -f infra/docker-compose.yml up -d`.

## Starting Services

We use **Turborepo** to orchestrate tasks across the monorepo.

### Run Everything (Recommended for Local Dev)
To start all services simultaneously:
```bash
npm run dev
```

### Run Specific Services
If you only need specific services, you can filter them using `turbo` flags or use the pre-defined `Makefile` targets.

| Service | Turbo Command | Makefile Target | URL / Port |
| :--- | :--- | :--- | :--- |
| **Web App** | `npm run dev --filter @schoolerp/web` | `make dev-web` | [localhost:3000](http://localhost:3000) |
| **Marketing Site**| `npm run dev --filter @schoolerp/marketing`| `make dev-marketing` | [localhost:3001](http://localhost:3001) |
| **Go API** | `npm run dev --filter api` | `make dev-api` | Local Port |
| **Go Worker** | `npm run dev --filter worker` | `make dev-worker` | Background Service |
| **Storybook** | `npm run storybook` | `make storybook` | UI Components |

---

## Why Turborepo?

This project is a monorepo managed by Turborepo. It differs from standalone projects in several ways:

1.  **Unified Workflow**: A single command (`npm run dev`) manages multiple processes.
2.  **Remote Caching**: Build outputs are cached. If you didn't change a package, Turbo skips rebuilding it.
3.  **Task Dependencies**: Turbo knows that `@schoolerp/web` depends on `@schoolerp/ui` and ensures everything is built in the right order.
4.  **Parallel Execution**: Tasks are run in parallel across all CPU cores for maximum speed.
5.  **Workspace Isolation**: Packages in `packages/` are shared codebases used across different `apps/`.
