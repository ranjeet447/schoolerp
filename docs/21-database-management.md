# 21 - Database Management

This document outlines the workflow for managing the PostgreSQL database, schema migrations, and code generation.

## 1. Database Infrastructure
The primary database is **PostgreSQL**. For local development, it is managed via Docker:
- **Up**: `make up` (starts the `schoolerp-db` container).
- **Down**: `make down`.

## 2. Schema Migrations
We use a migration-based approach to evolve the database schema.
- **Location**: [infra/migrations/](file:///Users/ranjeet/projects/schoolERP/infra/migrations)
- **Format**: SQL files (e.g., `000001_init.up.sql`).
- **Applying**: Migrations are usually applied by the API service on startup or via manual scripts in the `infra` directory.

## 3. Code Generation (SQLC)
We use **SQLC** to generate type-safe Go code from raw SQL queries. This avoids the overhead of a heavy ORM while maintaining type safety.
- **Config**: [sqlc.yaml](file:///Users/ranjeet/projects/schoolERP/sqlc.yaml)
- **Queries**: Located in `services/api/internal/db/query/`.
- **Generated Code**: Output to `services/api/internal/db/`.
- **Command**: `sqlc generate` (Run this after changing any `.sql` query file).

## 4. Seeding Data
Seed data for local development is stored in the `infra/seed` directory.
- **Marketing Seed**: `make seed-marketing`.
- **Demo Seed**: `make seed-demo`.
- **Tool**: Uses `psql` to execute SQL scripts against the running container.

## 5. Best Practices
- **Naming**: Use `snake_case` for all table and column names.
- **Tenant ID**: Every tenant-specific table **MUST** include a `tenant_id` column.
- **Audit Fields**: Include `created_at`, `updated_at`, and `deleted_at` where relevant.
