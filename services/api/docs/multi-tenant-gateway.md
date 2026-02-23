# Multi-tenant Payment Gateway Architecture

The SchoolERP platform processes fee payments across hundreds of tenant schools. Operating at this scale requires a multi-tenant payment architecture that is capable of securely routing transactions to each tenant's chosen payment processor (Razorpay, PayU, Stripe, etc.) while maintaining strict isolation of sensitive API credentials.

## Architectural Overview

The gateway architecture uses the **Strategy Pattern** combined with **Envelope Encryption**.

1. **Provider Abstraction**: A single `PaymentProvider` interface abstracts the operations required across all integrated gateways, such as:
   - `CreateOrder`
   - `VerifyWebhookSignature`

2. **Secure Credential Storage (Envelope Encryption)**:
   - Tenant-specific API keys and webhook secrets are never stored in plaintext.
   - We use AES-256-GCM encryption at the application layer.
   - The system employs a Key Encryption Key (KEK) bounded by the application's environment configuration (`TENANT_ENCRYPTION_KEY`).
   - The encrypted Data Encryption Keys (DEKs) alongside the ciphertext are stored in the database (`tenant_gateway_configs`).

3. **Dynamic Provider Resolution**:
   - The `FinanceService` dynamically inspects the active billing environment.
   - A `getTenantPaymentProvider` factory method queries the database for the active gateway per tenant, decrypts the securely stored credentials in memory, and initializes the provider strategy struct (e.g., `RazorpayProvider`), ready for transaction execution.

## Billing Feature Gating

In addition to routing transactions, the system restricts gateway flexibility based on the tenant's exact platform subscription plan.
We issue Entitlement checks (`HasAddon`) leveraging the `BillingService`. A tenant may only configure custom API credentials if they have subscribed to the "Custom Gateway Add-on".

## Webhook Handling and Idempotency

Callback webhooks from third-party processors are routed to a unified `/admin/finance/payments/{provider}-webhook` endpoint.
- **Provider Resolution**: The correct tenant context is resolved using the unique reference/order ID embedded in the webhook payload.
- **Signature Verification**: Webhooks are securely verified using cryptographic signatures (e.g., HMAC-SHA256) evaluated against the decrypted webhook secrets belonging specifically to that resolved tenant.
- **Idempotency**: All processed Gateway Event IDs are immediately memorialized in the `payment_gateway_events` table within a transacted session to explicitly prevent duplicate processing.

## Security Posture
- All DB queries dynamically apply Row-Level Security equivalent `tenant_id` WHERE clauses.
- Cryptographic DEKs never leave memory.
- RBAC ensures only users holding `finance:write:config` permissions can attempt to modify an encrypted gateway credential payload.
