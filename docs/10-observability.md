# 10 - Observability

## 1. Structured Logging
All services (API, Worker, Web) must emit JSON logs.
- Required fields: `level`, `msg`, `ts`, `service`, `request_id`, `tenant_id`, `user_id`.

## 2. Tracing
Propagation of `X-Request-ID` across all boundaries.
- API -> Worker (via Outbox payload).
- Worker -> Notification Provider.
- **AI Tracing**: All LLM calls must carry `X-AI-Trace-ID` linking the User Prompt to the Model Completion.

## 3. Error Tracking
- Use **Sentry** (or self-hosted Glitchtip) for automated error reporting.
- Source maps uploaded for Next.js builds.

## 4. Performance Monitoring
- **Slow Query Logs**: PostgreSQL `log_min_duration_statement` set to 500ms.
- **p95/p99**: API middleware logs duration for all routes.
- **Queue Health**: Monitor `outbox_events` depth and worker lag.
- **Index Watch**: Regular review of sequential scans on large tenant tables.

## 5. AI Observability
Specific metrics for the AI Suite:
- **Token Usage**: Count Input/Output tokens per Tenant for billing.
- **Latency**: Measure `LLM_Time_To_First_Token` and `Total_Generation_Time`.
- **Feedback Loop**: Monitor "Thumbs Up/Down" rate on AI Helpdesk answers.
- **Guardrail Trips**: Log frequency of "I cannot answer that" fallbacks (indicates gaps in KB or prompt attacks).
