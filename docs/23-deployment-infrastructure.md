# 23 - Deployment & Infrastructure

This document provides a step-by-step guide for deploying the SchoolERP SaaS platform using free-tier services.

## 1. Database: Supabase (PostgreSQL)
1. Create a new project on [Supabase](https://supabase.com/).
2. Retrieve your **Connection string** (URI) from **Project Settings > Database**.
3. Apply migrations using the `Makefile`:
   ```bash
   export DATABASE_URL="your-supabase-uri"
   make migrate
   make seed-bootstrap
   ```

## 2. Backend: Render (Go API)
1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect the [schoolerp repository](https://github.com/ranjeet447/schoolerp).
3. Configuration:
   - **Root Directory**: `services/api`
   - **Runtime**: `Go`
   - **Build Command**: `go run ./cmd/openapi-bundle && go build -o api ./cmd/api`
   - **Start Command**: `./api`
4. **Environment Variables**:
   - `DATABASE_URL`: Your Supabase URI.
   - `REDIS_URL`: Redis connection URL used for auth session hot-path checks.
   - `JWT_SECRET`: A secure random string.
   - `ENV`: `production`
   - `CORS_ALLOWED_ORIGINS`: Comma-separated frontend origins allowed to call API
     (example: `https://schoolerp-web.vercel.app` or `https://*.vercel.app`).

## 3. Frontend: Vercel (Next.js)
1. Import the repository into [Vercel](https://vercel.com/).
2. Deploy two projects from the monorepo:
   - **Marketing**: Root Directory = `apps/marketing`
   - **Web App**: Root Directory = `apps/web`
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your Render API URL (e.g., `https://schoolerp-api.onrender.com/v1`).

## 4. Multi-tenancy & Scaling
- **Isolation**: Enforced via `tenant_id` at the application layer.
- **Assets**: MinIO used locally, S3 recommended for production.
