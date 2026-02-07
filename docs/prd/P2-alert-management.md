# P2 - Alert Management System (Automated)

## 1. Overview
The Alert Management System (AMS) enables schools to configure automated, event-driven notifications. Unlike "Notices" (manual broadcast), AMS reacts to domain events (e.g., student absence, low fee balance, medical incident) based on tenant-defined rules.

**Goals:**
- Automate repetitive communication (Absence alerts, Payment reminders).
- Reduce manual overhead for administrative staff.
- Ensure timely delivery of critical safety/finance alerts.

**Non-goals:**
- Generic marketing newsletter broadcasts (use Notices module).
- Real-time chat (use Parent-Teacher Interaction module).

## 2. Personas & RBAC Permission Matrix

| Action | Admin | Accountant | Teacher | Parent |
| :--- | :---: | :---: | :---: | :---: |
| Configure Alert Rules | ✅ | ❌ | ❌ | ❌ |
| Manage Templates | ✅ | ✅ (Finance only) | ❌ | ❌ |
| View Delivery Logs | ✅ | ✅ | ✅ (Class only) | ❌ |
| Set Preferences | ❌ | ❌ | ❌ | ✅ |

## 3. Workflows
### Happy Path: Automated Absence Alert
1. **Trigger**: Teacher marks student "Absent" in Attendance module.
2. **Evaluation**: AMS checks if `attendance.absent` rule is active for the tenant.
3. **Template**: AMS fetches the "Absence Alert" template in the parent's preferred language.
4. **Routing**: If within "Quiet Hours", it enqueues for later; otherwise, sends via Push -> WhatsApp fallback.
5. **Logging**: Entry added to `notification_delivery_logs`.

### Edge Case: Delivery Failure
1. **Failure**: WhatsApp provider returns `ERROR_REJECTED`.
2. **Action**: System attempts fallback to SMS.
3. **Alert**: If both fail, the "Notification Error" dashboard is updated for Admin review.

## 4. Data Model
### `alert_rules`
- `id` (UUID, PK)
- `tenant_id` (FK)
- `event_type` (e.g., `fees.overdue`, `attendance.absent`)
- `is_active` (Boolean)
- `threshold_amount` (Decimal, optional for finance)
- `delay_minutes` (Int)

### `alert_templates`
- `id` (UUID, PK)
- `rule_id` (FK)
- `language_code` (e.g., `hi`, `en`)
- `channel` (Enum: `push`, `whatsapp`, `sms`, `email`)
- `content_template` (Text with `{{student_name}}` placeholders)

## 5. API Contracts
### Create Alert Rule
`POST /api/v1/alerts/rules`
```json
{
  "event_type": "attendance.absent",
  "is_active": true,
  "channels": ["push", "whatsapp"]
}
```

### Get Delivery Logs
`GET /api/v1/alerts/logs?student_id={uuid}`

## 6. UI Screens
- **Alert Dashboard**: Status of active automated alerts.
- **Rule Editor**: Trigger selection, condition builder, channel priority.
- **Template Library**: Multilingual editor for each channel.
- **Delivery Analytics**: Success/failure rates by channel.

## 7. Notifications
- Multi-channel support (FCM, WhatsApp, SMS).
- Support for "Priority" alerts (Safety) that bypass quiet hours.

## 8. Reporting & Exports
- **Failure Report**: List of failed critical alerts for manual follow-up.
- **Cost Analysis**: Estimated spend per month on SMS/WhatsApp bytes.

## 9. Security & Privacy
- **Tenancy**: `tenant_id` mandatory in all queries and events.
- **PII**: Templates must not include sensitive PII in non-encrypted channels (e.g., partial mask for Fee IDs).

## 10. QA Plan
- **Sanity**: Trigger an absence alert via API and verify mock delivery to Worker outbox.
- **Acceptance**: Rule persists post-refresh; fallback logic executes if primary channel is disabled.
