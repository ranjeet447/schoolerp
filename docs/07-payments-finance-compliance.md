# 07 - Payments and Finance Compliance

## 1. Indian Compliance Standards
- **Receipt Series**: Each tenant/branch/academic year must have its own configurable receipt series (prefix + number).
- **No Gaps**: Once a receipt is generated, the number is consumed.
- **Cancellations**: Receipts cannot be deleted. They are `cancelled` with a reason code and audit log.

## 2. Payment workflow
1. **Order Creation**: Create `payment_order`.
2. **Gateway Hook**: Razorpay/PayU sends `payment.success` webhook.
3. **Idempotency**: API verifies signature and checks if receipt already exists.
4. **Accounting**: Update `ledgers` and generate `receipt`.
5. **Automation**: Trigger `receipt.generated` event for Notification worker.

## 3. Refunds and Credit Notes
- Controlled via the Policy Engine.
- Requires dual approval for high amounts.
- Generates `credit_note` entity for audit trail.

## 4. Tally ERP Exports
- Standardized CSV/XML exports for direct Tally import.
- Mapping: `Fee Head` -> `Tally Ledger`.
