# P3 - Parent-Teacher Interaction & PTM Booking

## 1. Overview
Moves beyond one-way broadcasting (Notices) to two-way moderated interaction between parents and teachers, focused on PTM efficiency and secure, time-bound communication.

**Goals:**
- Eliminate manual scheduling for PTMs.
- Provide a secure channel for student-specific queries.

## 2. Personas & RBAC Permission Matrix

| Action | Teacher | Parent | Coordinator |
| :--- | :---: | :---: | :---: |
| Create PTM Event | ✅ | ❌ | ✅ |
| Set Availability Slots | ✅ | ❌ | ❌ |
| Book Slot | ❌ | ✅ | ❌ |
| Initiate Chat | ✅ | ✅ | ✅ |

## 3. Workflows
### PTM Slot Booking
1. **Trigger**: School schedules a PTM event on Saturday.
2. **Slots**: Teacher defines 15-minute slots (e.g., 9 AM to 12 PM).
3. **Booking**: Parent receives notification, opens the app, and picks an available slot.
4. **Reminder**: System sends Push/WhatsApp 1 hour before the slot.

### Moderated Chat
1. **Policy**: Chat is enabled only during school hours (e.g., 9 AM - 4 PM).
2. **Interaction**: Parent sends a query about homework.
3. **Moderation**: All messages are logged and visible to the Coordinator/Admin for safety.

## 4. Data Model
### `ptm_events`
- `id` (PK), `tenant_id` (FK)
- `event_date`, `description`

### `ptm_slots`
- `id` (PK), `event_id` (FK)
- `teacher_id` (FK), `student_id` (FK, Nullable)
- `start_time`, `end_time`
- `status` (Enum: `available`, `booked`)

## 5. UI Screens
- **PTM Scheduler (Teacher)**: Grid view to manage individual slots.
- **Booking Interface (Parent)**: Simplified "available/selected" view on mobile.
- **Interaction Hub (Teacher)**: Inbox for all student-specific parent queries.

## 6. Security & Compliance
- **Privacy**: Personal phone numbers of teachers are NEVER exposed; all communication happens via the platform.
- **Auditing**: Chat history is archived for 1 year and included in the student's holistic behavior profile.
