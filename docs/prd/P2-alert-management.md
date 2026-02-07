# P2 - Alert Management System (Implementation Spec)

## 1. Overview
The Alert Management System (AMS) is an event-driven notification engine that automatically triggers alerts based on tenant-defined rules. It listens for domain events (e.g., `attendance.absent`, `fees.overdue`) and dispatches notifications via configured channels (SMS, WhatsApp, Push).

**Goals:**
- Zero-touch notification for routine events (Attendance, Fees).
- Configurable "Quiet Hours" to prevent nuisance alerts.
- High reliability for safety/emergency alerts (bypassing quiet hours).

**Non-goals:**
- Marketing campaigns (handled by "Notices" module).
- Real-time chat.

---

## 2. Personas & RBAC

| Role | Permissions |
| :--- | :--- |
| **Super Admin** | Manage global event types, debug delivery logs. |
| **School Admin** | Create/Edit Alert Rules, Configure Templates, View Logs. |
| **Accountant** | Configure Fee-related Rules/Templates only. |
| **Parent/Staff** | Receive alerts, Manage preferences (if enabled). |

---

## 3. Workflows

### 3.1 Happy Path: Automated Absence Alert
1.  **Trigger**: `AttendanceService` emits `attendance.absent` event for Student A.
2.  **Rule Match**: AMS finds active rule: `Event=attendance.absent` for `Tenant=101`.
3.  **Time Check**: Current time (8:00 PM) is within `Quiet Hours` (9 PM - 7 AM)? No.
4.  **Template Render**: Fetch `HI` (Hindi) template for Parent A. Render: "Student A is absent today."
5.  **Dispatch**: Send via `WhatsApp`.
6.  **Log**: Record success in `notification_delivery_logs`.

### 3.2 Edge Case: Quiet Hours & Batching
1.  **Trigger**: `Fees.Overdue` event at 11:00 PM (Batch job).
2.  **Rule Match**: Active rule exists.
3.  **Time Check**: Inside Quiet Hours.
4.  **Action**: Enqueue to `delayed_alerts_queue` with `process_after = 7:00 AM next day`.

### 3.3 Edge Case: Channel Failover
1.  **Attempt**: WhatsApp API returns `503 Unavailable`.
2.  **Retry**: Exponential backoff (x3).
3.  **Failover**: If all retries fail, check Rule config for `fallback_channel` (e.g., SMS).
4.  **Final Dispatch**: Send via SMS.

---

## 4. Data Model

### `alert_rules`
*Configuration for when to trigger alerts.*
- `id` (UUID, PK)
- `tenant_id` (UUID, FK, Index)
- `event_type` (Enum: `attendance.absent`, `fees.overdue`, `exam.results`, `discipline.incident`)
- `is_active` (Boolean, Default: `true`)
- `channels` (Array<String>: `["whatsapp", "sms"]`)
- `config` (JSONB: Thresholds, delay logic)
- `created_at`, `updated_at`

### `alert_templates`
*Multilingual content for rules.*
- `id` (UUID, PK)
- `alert_rule_id` (UUID, FK)
- `language` (String, e.g., `en`, `hi`)
- `template_body` (Text, supports Mustache vars `{{name}}`, `{{date}}`)
- `is_approved` (Boolean, DLT requirement)

### `notification_delivery_logs`
*Audit trail of all sent messages.*
- `id` (UUID, PK)
- `tenant_id` (UUID, FK)
- `student_id` (UUID, FK, Index)
- `event_type` (String)
- `channel` (String)
- `status` (Enum: `queued`, `sent`, `delivered`, `failed`, `skipped_quiet_hours`)
- `provider_response` (JSONB)
- `sent_at` (Timestamp)

---

## 5. API Contracts

### 5.1 Create Alert Rule
`POST /api/v1/alerts/rules`
**Permission**: `alerts.manage`

**Request:**
```json
{
  "event_type": "attendance.absent",
  "channels": ["push", "whatsapp"],
  "config": {
    "quiet_hours_bypass": false,
    "delay_minutes": 30
  },
  "templates": [
    { "lang": "en", "body": "Your child {{name}} is absent today." },
    { "lang": "hi", "body": "आपका बच्चा {{name}} आज अनुपस्थित है।" }
  ]
}
```

**Response:** `201 Created`

### 5.2 Get Delivery Logs
`GET /api/v1/alerts/logs`
**Permission**: `alerts.view`
**Query Params**: `student_id`, `status`, `date_range`

**Response:**
```json
{
  "data": [
    {
      "id": "log_123",
      "event": "attendance.absent",
      "channel": "whatsapp",
      "status": "delivered",
      "sent_at": "2026-02-07T09:30:00Z"
    }
  ]
}
```

---

## 6. UI Screens
1.  **Alert Rules Manager**: Table of configured rules/triggers with toggles (Active/Inactive).
2.  **Template Editor**: Rich text/Plain text editor per language with variable picker.
3.  **Delivery Report**: Dashboard showing Delivery Rate, Failure Rate, and Channel Spend.
4.  **Student Notification History**: View within Student Profile showing all timeline alerts sent.

---

## 7. Reporting
- **Channel Cost Report**: Monthly breakdown of SMS/WhatsApp costs per tenant.
- **Delivery Reliability**: Percentage of alerts delivered within <5 mins.
- **Failure Analysis**: Top error codes from providers (e.g., "Invalid Number").

---

## 8. QA Plan

### 8.1 Playwright Scenarios
- **Rule Creation**: Admin creates a new "Fee Overdue" rule and saves template.
- **Trigger**: Simulate `fees.overdue` event via dev-tools. Verify log appears in "Delivery Report".
- **Quiet Hours**: Configure Quiet Hours. Trigger alert. Verify status is `queued`. Fast-forward time. Verify status changes to `sent`.

### 8.2 API Tests
- **Idempotency**: Emit same event ID twice. Verify only 1 log entry created.
- **Validation**: Try creating rule with empty template. Expect `400 Bad Request`.
- **Tenancy**: Ensure Tenant A cannot see Tenant B's logs.

---
