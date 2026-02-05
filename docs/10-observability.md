# 10 - Observability

## 1. Structured Logging
All services (API, Worker, Web) must emit JSON logs.
- Required fields: `level`, `msg`, `ts`, `service`, `request_id`, `tenant_id`, `user_id`.

## 2. Tracing
Propagation of `X-Request-ID` across all boundaries.
- API -> Worker (via Outbox payload).
- Worker -> Notification Provider.

## 3. Error Tracking
- Use **Sentry** (or self-hosted Glitchtip) for automated error reporting.
- Source maps uploaded for Next.js builds.

## 4. Performance Monitoring
- **Slow Query Logs**: PostgreSQL `log_min_duration_statement` set to 500ms.
- **p95/p99**: API middleware logs duration for all routes.
- **Queue Health**: Monitor `outbox_events` depth and worker lag.
- **Index Watch**: Regular review of sequential scans on large tenant tables.
