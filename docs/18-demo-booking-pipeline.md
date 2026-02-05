# Engineering: Demo Booking Pipeline

## Overview
The demo booking system allows prospects to schedule product walkthroughs directly from the marketing site. It handles availability rules, time-slot generation, and automated reminders.

## System Architecture

### 1. Availability Engine (Go API)
The engine processes `availability_rules` (e.g., Mon-Fri 10am-6pm) and subtracts `availability_exceptions` and existing `demo_bookings`.

**Conflict Detection**:
```sql
-- Partial unique index ensures no two confirmed bookings overlap at the same start time
CREATE UNIQUE INDEX idx_unique_booking_slot ON demo_bookings(owner_user_id, start_at_utc) 
WHERE status IN ('pending', 'confirmed');
```

### 2. Marketing Funnel (Next.js)
- `/book-demo`: Landing for selection.
- `/book-demo/[demo_type]`: Slot picker and details form.
- `/book-demo/success`: Confirmation page.
- `/book-demo/manage/[token]`: Self-service cancellation and rescheduling.

### 3. CRM Integration
Every confirmed demo booking automatically creates or updates a **Lead** record in the CRM system.
- `lead_source`: "demo_booking"
- `lead_status`: "demo_scheduled"

## Notifications & Lifecycle
Managed by the Go Worker via the Outbox pattern.

| Event | Action |
|---|---|
| `demo.booking.created` | Send Email Confirmation + `.ics` Calendar Invite |
| `demo.booking.reminder_24h` | Send Email/WhatsApp Reminder |
| `demo.booking.reminder_1h` | Send SMS/WhatsApp Final Alert |
| `demo.booking.completed` | Trigger Feedback Loop (Review Request) |

## Calendar Integration Interface
A stub interface is provided in the Go backend to allow for future Google/Microsoft calendar syncing.

```go
type CalendarProvider interface {
    CreateEvent(ctx context.Context, booking Booking) (string, error)
    UpdateEvent(ctx context.Context, booking Booking) error
    DeleteEvent(ctx context.Context, externalID string) error
}
```
Currently implemented with `NoOpCalendarProvider`.
