# 09 - Webhooks and Public API

## 1. Inbound Webhooks
Support for:
- Payment Gateways (Razorpay, PayU).
- Biometric Devices (Attendance ingestion).
- WhatsApp Providers.

## 2. Outbound Webhooks (Automation Studio)
Allow Enterprise schools to subscribe to events.
- **Signing**: HMAC signatures using `sh-256`.
- **Retries**: Exponential backoff with a 24-hour limit.
- **Logs**: Visible to tenant admins in the "Developers" tab.

## 3. Public API
- **Authentication**: `x-api-key` (Tenant-scoped).
- **Rate Limiting**: Tiered by plan.
- **Catalog**: `payment.success`, `attendance.marked`, `student.admitted`.
