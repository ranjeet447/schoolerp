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

## 3. The Message Wallet
Messaging costs (WhatsApp/SMS) are pass-through.
- schools top-up a `wallet_balance`.
- Worker checks balance before sending a paid-channel message.
- Notifications are blocked/enqueued if balance is low.
- In-app and Push are always free (unlimited).

## 4. Quiet Hours
- Mandatory window (e.g., 9 PM - 7 AM) for non-critical messages.
- Overridable for `Safety/Emergency` alerts.

## 5. Reliability
- **Idempotency**: `notification_id` used to prevent double sends.
- **Templates**: Centralized in `notification_templates`, supports `next-intl` like placeholders.
- **Logs**: `delivery_logs` track status receipts (Sent -> Delivered -> Read).
