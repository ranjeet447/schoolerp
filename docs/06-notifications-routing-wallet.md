# 06 - Notifications, Routing, and Wallet

## 1. Multi-channel Strategy
- **Channels**: In-app (Inbox), Push (PWA/Capacitor), WhatsApp, SMS, Email.
- **Source of Truth**: The database. Notifications are policy-driven.

## 2. Routing Matrix
Default routing logic to balance cost and urgency:
| Category | Primary | Fallback 1 | Fallback 2 |
| :--- | :--- | :--- | :--- |
| **OTP** | WhatsApp | SMS | Email |
| **Finance** | In-app | WhatsApp | SMS |
| **Safety** | Push + WA | SMS | - |
| **Academic** | In-app | Push | Email |
| **AI Helpdesk** | WhatsApp | Web Chat | - |

## 3. The Message Wallet
Messaging costs (WhatsApp/SMS) are pass-through.
- schools top-up a `wallet_balance`.
- Worker checks balance before sending a paid-channel message.
- Notifications are blocked/enqueued if balance is low.
- In-app and Push are always free (unlimited).

### AI Chat Costs
- **AI Helpdesk** via WhatsApp incurs standard conversation (UIC/BIC) charges.
- These are deducted from the same `wallet_balance`.
- **Note**: Admin can set a daily "AI Budget Cap" to prevent runaway costs from chat loops.

## 4. Quiet Hours
- Mandatory window (e.g., 9 PM - 7 AM) for non-critical messages.
- Overridable for `Safety/Emergency` alerts.
- **AI Exception**: Helpdesk replies are *always* allowed (24x7) as they are user-initiated.

## 5. Reliability
- **Idempotency**: `notification_id` used to prevent double sends.
- **Templates**: Centralized in `notification_templates`, supports `next-intl` like placeholders.
- **Logs**: `delivery_logs` track status receipts (Sent -> Delivered -> Read).

## 6. Escalation Protocol (AI Support)
If the AI Helpdesk cannot answer a query (confidence < threshold or "Talk to Human" intent):
1.  **Tag**: The conversation is tagged `needs_human`.
2.  **Route**: Forwarded to the School Admin / Helpdesk Staff dashboard.
3.  **Alert**: Staff receives an In-app notification: "New handover from AI".
4.  **Fallback**: If no staff available (off-hours), AI replies: "I've logged your request. Staff will reply tomorrow."
