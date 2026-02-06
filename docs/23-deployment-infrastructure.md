# 23 - Deployment & Infrastructure

This document provides an overview of the infrastructure that powers the SchoolERP SaaS platform.

## 1. Containerization
The entire platform is containerized using **Docker**.
- **Base Config**: [infra/docker-compose.yml](file:///Users/ranjeet/projects/schoolERP/infra/docker-compose.yml).
- **Profiles**:
  - `default`: API, Web, DB, Redis.
  - `cms`: Adds Directus for content management.

## 2. Environment Management
Environment variables are used to manage configurations across different stages.
- **Local**: `.env` and `.env.local` files.
- **Staging/Production**: Managed via the deployment platform (e.g., Vercel for apps, Railway/AWS for services).

## 3. Deployment Strategy
- **Frontend (Next.js)**: Deployed to Vercel for edge-optimized delivery.
- **Backend (Go)**: Compiled into single binaries and deployed as containers.
- **Database**: Managed PostgreSQL (e.g., AWS RDS or Supabase) with daily backups.

## 4. Multi-tenancy Scaling
- **Routing**: Tenants are identified via subdomains (e.g., `school1.schoolerp.com`) or a dedicated header.
- **Data Isolation**: Enforced at the application layer via `tenant_id` and optionally at the DB layer via Row Level Security (RLS).
- **Static Assets**: Stored in S3-compatible object storage with tenant-scoped prefixes.

## 5. Monitoring & Logs
- **Logging**: Structured JSON logs collected for centralized searching.
- **Error Tracking**: Sentry is used for both frontend and backend error reporting.
- **Metrics**: Prometheus/Grafana for monitoring system health and throughput (in plan).
