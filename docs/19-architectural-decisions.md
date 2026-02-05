# DECISIONS.md (Architectural Decision Records)

## ADR 001: Backend Language selection
**Decision**: Go (LTS).
**Rationale**: Performance, simple concurrency model (goroutines) for workers, and single-binary deployment.

## ADR 002: Go Router
**Decision**: `chi` (preferred).
**Rationale**: Standard-library compliant, lightweight, and excellent for REST API structure.

## ADR 003: Database Access
**Decision**: `pgx` + `SQLC`.
**Rationale**: SQLC provides type-safe Go code from plain SQL queries. Much lower overhead than heavy ORMs like GORM, while maintaining type safety.

## ADR 004: Monorepo Tooling
**Decision**: `pnpm` Workspaces + `Turborepo`.
**Rationale**: High performance, intelligent caching, and perfect for multi-language (Go + TS) monorepos.

## ADR 005: Job Queue
**Decision**: Database-backed outbox/jobs table.
**Rationale**: Simplifies architecture for v1. No extra infrastructure dependency like RabbitMQ. Transactional safety (Outbox pattern) is easier to achieve.

## ADR 006: Frontend Framework
**Decision**: Next.js (App Router).
**Rationale**: SEO for marketing, SSR for performance, and a unified ecosystem for PWA and Capacitor.

## ADR 007: UI Components
**Decision**: `shadcn/ui` + Tailwind.
**Rationale**: Standard-based, easily themed for white-labeling, and doesn't lock us into a bloated UI library.
