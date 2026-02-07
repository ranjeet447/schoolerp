# P2 - Accounting (Tally) & Payment Reconciliation (Implementation Spec)

## 1. Overview
This module automates financial reconciliation and accounting exports. It ensures 100% accurate synchronization between the Payment Gateway (PG), the School ERP Fee Ledger, and external accounting software (Tally Prime).

**Goals:**
- **Zero-touch Reconciliation**: PG settlements match ERP receipts automatically.
- **Tally Integration**: XML export of Vouchers (Receipt, Refund, Journal) with mapped Ledgers.
- **Compliance**: GST-ready invoicing for taxable services (Transport, Books).

---

## 2. Personas & RBAC

| Role | Permissions |
| :--- | :--- |
| **Accountant** | Map Ledgers, Generate Tally XML, View Reconciliation Reports. |
| **Auditor** | View-only access to Tally Exports & Audit Logs. |
| **Super Admin** | Configure Gateway API Keys, Manage Tax Rules. |

---

## 3. Workflows

### 3.1 Happy Path: Tally Export
1.  **Map Ledgers**: Accountant maps `Fee Head: Tuition` -> `Legder: Tuition Income`.
2.  **Filter**: Select Date Range (e.g., Apr 1 - Apr 30).
3.  **Generate**: System fetches all *Posted* Receipts & Refunds.
4.  **Format**: Convert to Tally XML schema (`<VOUCHER>...`).
5.  **Download**: Standard XML file for import into Tally.

### 3.2 Happy Path: Payment Reconciliation
1.  **Webhook**: Razorpay sends `payment.captured` event.
2.  **Idempotency Check**: Has `order_id` been processed? If yes, ignore (return 200).
3.  **Ledger Entry**:
    - Debit: Bank Account (PG Settlement).
    - Credit: Student Fee Account (Receivable).
4.  **Receipt**: Generate PDF Receipt (Series: `ONLINE-2026-001`).
5.  **Notify**: Send WhatsApp receipt link to Parent.

### 3.3 Edge Case: Settlement Mismatch
1.  **Daily Job**: Fetch PG Settlement Report (API).
2.  **Compare**: Total Settled Amount vs Total System Receipts for Batch ID.
3.  **Alert**: If discrepancy > ₹0, flag batch "Action Required".
4.  **Resolution**: Admin manually links orphaned payment or initiates refund.

---

## 4. Data Model

### `ledger_mappings`
*Maps internal Fee Heads to external Accounting Ledgers.*
- `id` (UUID, PK)
- `tenant_id` (UUID, FK)
- `fee_head_id` (UUID, FK, Unique constraint with `tenant_id`)
- `tally_ledger_name` (String, e.g., "Tuition Fees FY26")
- `tally_group_name` (String, e.g., "Direct Incomes")
- `is_taxable` (Boolean)
- `tax_rate` (Decimal)

### `payment_gateway_configs`
*Per-tenant gateway settings.*
- `id` (UUID, PK)
- `tenant_id` (UUID, FK)
- `provider` (Enum: `razorpay`, `payu`, `cashfree`)
- `merchant_id` (String)
- `api_key_enc` (Text, Encrypted)
- `webhook_secret_enc` (Text, Encrypted)
- `is_active` (Boolean)

### `reconciliation_batches`
*Tracks settlement batches from PG.*
- `id` (UUID, PK)
- `tenant_id` (UUID, FK)
- `provider_batch_id` (String)
- `settlement_date` (Date)
- `total_amount` (Decimal)
- `status` (Enum: `matched`, `mismatch`, `pending`)
- `discrepancy_amount` (Decimal)

---

## 5. API Contracts

### 5.1 Generate Tally XML
`GET /api/v1/finance/exports/tally`
**Query Params**: `start_date`, `end_date`, `voucher_type` (receipt/refund)
**Response**: `Content-Type: application/xml`, File Download.

### 5.2 Payment Webhook (Public)
`POST /webhooks/payments/{provider}`
**Headers**: `X-Razorpay-Signature` (HMAC verification required)
**Body**: JSON payload from provider.
**Logic**: Verify signature -> Check Idempotency -> Process Order -> Return 200 OK.

### 5.3 Trigger Manual Reconciliation
`POST /api/v1/finance/reconcile`
**Request**: `{ "date": "2026-02-01" }`
**Response**: `{ "status": "queued", "job_id": "abc-123" }`

---

## 6. UI Screens
1.  **Ledger Configuration**: Table mapping Fee Heads to Ledger Names.
2.  **Reconciliation Dashboard**: Calendar view showing Daily Collection vs Bank Settlement. Red/Green indicators.
3.  **Webhook Logs**: Troubleshooting tool for Admins (Raw Payload, Response Code).
4.  **Tally Export History**: List of generated files with download links & Audit info (Who/When).

---

## 7. Reporting
- **Settlement Report**: Daily breakdown of Gross Collection, MDR (Gateway Fee), Net Settlement.
- **Unreconciled Transactions**: List of payments with status `authorized` but not `captured` or missing Order ID.
- **GST Input/Output**: Summary of Tax Collected vs Tax Paid (if relevant).

---

## 8. Security & Privacy
- **Credentials**: API Keys/Secrets stored using AES-256 encryption.
- **Logging**: Mask PII/Card details in webhook logs.
- **Access**: Only `finance.admin` role can view Gateway Keys or Trigger Refunds.

---

## 9. QA Plan

### 9.1 Playwright Scenarios
- **Mapping**: Login as Accountant -> Map "Tuition" to "Tuition Income" -> Save -> Verify persistence.
- **Export**: Generate XML for last month -> Verify file downloads -> Check content for correct `<VOUCHER>` tags.
- **Dashboard**: Simulate a mismatched settlement -> Verify dashboard shows "Red" status.

### 9.2 API Tests
- **Webhook Security**: Send payload without Signature header -> Expect `401 Unauthorized`.
- **Idempotency**: Send same `payment.captured` webhook twice -> Expect 200 OK but NO duplicate receipt created.
- **Format**: Verify Tally XML output validates against standard XSD.

---
