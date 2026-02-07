# P2 - Accounting (Tally Export) & Payment Enhancements

## 1. Overview
Finance V2 extends the basic Fee module into an enterprise-grade accounting engine. It focuses on externalizing financial data for Tally reconciliation and ensuring 100% reliability for online payments.

**Goals:**
- Automated Ledger mapping for Tally export.
- Idempotent payment webhook processing.
- Multi-receipt series management for complex school branches.

## 2. Personas & RBAC Permission Matrix

| Action | Admin | Accountant | Auditor |
| :--- | :---: | :---: | :---: |
| Map Ledgers | ✅ | ✅ | ❌ |
| Run Tally Export | ✅ | ✅ | ✅ |
| Reconcile Settlements| ✅ | ✅ | ✅ |
| Override Webhooks | ✅ | ❌ | ❌ |

## 3. Workflows
### Happy Path: Tally Export
1. **Mapping**: Accountant maps local `fee_heads` (e.g., "Library Fee") to Tally ledgers (e.g., "Library Income A/c").
2. **Generate**: Accountant selects date range and clicks "Generate Tally XML/Excel".
3. **Download**: System aggregates all receipts and refunds, applying the ledger mappings, and providing a download.

### Happy Path: Payment Reconciliation
1. **Event**: Payment Gateway (Razorpay) sends `order.paid` webhook.
2. **Ingestion**: System checks for idempotency (has this Ref ID been processed?).
3. **Update**: System marks Invoice as "Paid", generates Receipt via R1 series logic, and triggers parent notification.

## 4. Data Model
### `accounting_mappings`
- `tenant_id` (FK)
- `fee_head_id` (FK)
- `tally_ledger_name` (String)
- `tally_group_name` (String)

### `payment_webhook_logs`
- `provider_id` (e.g., `razorpay`)
- `payload` (JSONB)
- `processed_at` (Timestamp)
- `idempotency_key` (String, Unique)

## 5. API Contracts
### Tally Export Run
`GET /api/v1/finance/exports/tally?start_date=...&end_date=...`

## 6. UI Screens
- **Ledger Mapping Table**: Simple UI to manage associations between fee heads and accounting ledgers.
- **Settlement Dashboard**: Comparison of Gateway "Transferred" amounts vs System "Receipts".
- **Webhook Monitor**: Logs for developers/admins to troubleshoot failed PG callbacks.

## 7. Notifications
- **Payment Success**: Instant WhatsApp receipt.
- **Settlement Mismatch**: Alert email to Accountant if PG payout doesn't match receipt volume.

## 8. Compliance (India)
- **GST Ready**: Fields for CGST/SGST if applicable for certain fee types (e.g., canteen/services).
- **Audit Logs**: Every manual override of a payment status must be double-approved.

## 9. QA Plan
- **Verification**: Simulate duplicate webhooks and verify only one receipt is created.
- **Export Test**: Validate Tally XML output against the standard TallyPrime import schema.
