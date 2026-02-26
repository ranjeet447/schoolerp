# AI Billing Transition (Current vs Target)

## Current implementation (accepted transitional design)

AI usage enforcement is currently split between:

1. **AI quota checks** (monthly + burst/rate limiting)
   - `services/api/internal/service/ai/service.go` (`checkBilling`)
   - Tenant limits via `GetEffectiveTenantLimit` / `CountQueriesInPeriod`
2. **Legacy wallet debit path**
   - `BillingService.GetWalletBalance`, `DebitWallet`, `GetEffectiveRate`
   - Async debit in `logAndDebit(...)`

This is separate from the newer `tenant_credit_wallets` / `tenant_credit_ledger` model used for messaging/add-ons credits.

## Why this is documented (not yet unified)

- AI already has quota + billing enforcement in production paths
- Unifying AI onto `tenant_credit_wallets` is desirable but not required for safe operation today
- A migration requires product decisions on:
  - `ai_credits` vs token-based wallets
  - price/rate mapping by feature/model
  - quota vs credits precedence

## Safety guarantees in current state

- Add-on/feature billing checks run before provider calls
- Burst limiter blocks excessive requests
- Quota failures stop requests before debit
- Debit is attempted only after successful generation/log path (best effort async)

## Known limitations

- AI debits are not yet recorded in `tenant_credit_ledger`
- AI usage and messaging credits are reported from different billing subsystems
- Async debit can lag user-visible usage moment

## Target state (future)

- Map AI usage to `tenant_credit_wallets` (`ai_credits` or token wallets)
- Idempotent debit reference IDs for every AI request
- Unified ledger visibility in `/admin/billing/credits`
