# 04 - Policy Engine, Locks, and Approvals

## Objective
To allow schools to customize business logic (edit windows, locks, etc.) without writing custom code.

## 1. Policy Engine
A framework to define "When can X happen?".
- **Edit Windows**: Attendance can be marked only within 48 hours.
- **Receipt Rules**: Receipts cannot be cancelled after the bank settlement is reconciled.

## 2. Locks
Hard blocks on modules or data ranges.
- **Month Lock**: Lock all finance entries for the previous month.
- **Term Lock**: Lock marks entry after the term result is published.
- Schema: `locks(tenant_id, module, resource_id, locked_at, locked_by)`.

## 3. Approvals
Multi-step workflows for sensitive actions.
- **Triggers**: Marks change after publish, Receipt cancellation, Gate pass issuance.
- **Workflow**:
  1. User requests change (with reason code).
  2. Change enters `pending` state (or original remains, change is in `requested` state).
  3. Authorized role (e.g., Principal) approves/rejects.
  4. Decision is logged with audit trailing.

## 4. Reason Codes
Mandatory for any "Policy Override" or "Approval Request".
- Pre-defined list per tenant (e.g., "Typo in marks", "Parent request for refund").

## Integration with Audit Logs
Every policy check and approval result must be linked to a `correlation_id` in the `audit_logs` table.
