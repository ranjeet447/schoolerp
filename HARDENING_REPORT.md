# Hardening Report - February 2026

## Executive Summary
Following the mandate to audit and harden the SchoolERP platform, significant security gaps in Mobile, AI, Webhooks, and Impersonation have been addressed. The system has been transitioned from "experimental" to "Beta Release Candidate" quality across these dimensions.

## Key Hardening Measures

### 1. Mobile & Web Shell Session Protection (B1)
- **Problem**: Plaintext storage of JWT tokens in Capacitor Preferences/LocalStorage on mobile.
- **Solution**: Implemented environment-aware XOR-based obfuscation using a platform-specific salt (`erp-native`/`erp-web`). This prevents basic string inspection from device backups or shared storage.
- **Verification**: New `encrypt`/`decrypt` utility in `apps/mobile/src/lib/secure-storage.ts` and parity in `apps/web/src/lib/auth-service.ts`.

### 2. Platform Impersonation Guard (B2)
- **Problem**: Impersonated tokens could potentially access platform admin routes if the original actor was a super-admin.
- **Solution**: Injected a "Platform Guard" in the API middleware (`Auth` middleware) that checks for the `impersonated: true` claim in the JWT. It explicitly blocks any request to `/admin/platform`.
- **Verification**: Verified with `impersonation_test.go` and logic check in `middleware.go`.

### 3. Webhook Log Retention (B3)
- **Problem**: Missing log retention strategy leading to infinite database growth.
- **Solution**: Added a background maintenance ticker in the worker that prunes `webhook_logs` older than 90 days every 24 hours using indexed `created_at` timestamps.
- **Verification**: Integrated into `services/worker/cmd/worker/main.go`.

### 4. PDF Security & Resource Limits (B4)
- **Problem**: Potential for DoS via large HTML templates or crashes due to missing payload variables in critical certificates (Bonafide/TC).
- **Solution**: Enforced a **1MB size cap** on PDF templates and added validation for required variables (`student_name`, `admission_no`).
- **Verification**: Verified with `service_test.go` in the worker's PDF processing module.

### 5. AI Service Multi-Layer Quotas (B5)
- **Problem**: Absence of burst limiting for AI features, leading to provider cost spikes or potential abuse.
- **Solution**: Implemented a **10 req/min sliding-window burst limiter** per user (and per sender for WhatsApp). This is enforced local to the pod via `sync.Map` for high performance.
- **Verification**: Tested with `quota_test.go` and verified in `service.go`.

## Stability Improvements
- Resolved pre-existing build errors in `auth/handler.go` (duplicate methods) and `sis/certificates_tc.go` (illegal syntax).
- Verified that the `api` and `worker` services build cleanly under `CGO_ENABLED=0`.

## Future Recommendations
- **Mobile Native**: Transition to `@capacitor-community/secure-storage` for true hardware-backed Keychain/Keystore encryption.
- **Global Rate Limiting**: Migrate the pod-local `sync.Map` rate limiter to Redis if the system scales beyond single pods per region.

---
**Status**: Beta Release Candidate (RC) Ready.
<ranjeet@schoolerp.io>
