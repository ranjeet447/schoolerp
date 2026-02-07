# P2 - Discipline Management System (Implementation Spec)

## 1. Overview
The Discipline Management System (DMS) digitizes incident recording, ensuring consistent policies, transparent parent communication, and auditable history for student behavioral events.

**Goals:**
- **Standardization**: Uniform severity rating (Low/Medium/High).
- **Communication**: Controlled parent notifications.
- **Audit**: Immutable log for TC (Transfer Certificate) remarks.

---

## 2. Personas & RBAC

| Role | Permissions |
| :--- | :--- |
| **Teacher** | Report Incident (Draft), View own reports. |
| **Coordinator** | Review Incidents, Set Severity, Approve/Publish to Parent. |
| **Principal** | Approve High Severity (Suspension/Expulsion), View Analytics. |
| **Parent** | View Published Incidents (Read-only). |

---

## 3. Workflows

### 3.1 Report Incident (Teacher)
1.  **Form**: Teacher selects Student, Incident Type (e.g., "Disruption"), Severity (Low/Med/High), Add notes.
2.  **Submit**: Incident marked as `Pending Review`.
3.  **Coordinator Alert**: In-app notification received.

### 3.2 Review & Publish (Coordinator)
1.  **Review**: Coordinator checks details. Optionally modifies Severity/Category.
2.  **Approve**: Click "Publish to Parent".
3.  **Notify**: Parent receives Push Notification "New behavioral report available".
4.  **Log**: Incident visible on Student Profile -> Discipline Tab.

### 3.3 Escalation (High Severity)
1.  **Creation**: Marked as `High`.
2.  **Lock**: Only Principal can approve/publish.
3.  **Action**: Principal adds "Action Taken" (e.g., "Internal Suspension 2 days").
4.  **Publish**: Email sent to Parent + In-app notification.

---

## 4. Data Model

### `discipline_incidents`
- `id` (UUID, PK)
- `tenant_id` (UUID, FK, Index)
- `student_id` (UUID, FK, Index)
- `reported_by_id` (UUID, FK)
- `incident_date` (Date)
- `category` (Enum: `academic_dishonesty`, `behavioral`, `attendance`, `vandalism`)
- `severity` (Enum: `low`, `medium`, `high`)
- `status` (Enum: `draft`, `pending_review`, `published`, `resolved`, `escalated`)
- `description` (Text)
- `internal_notes` (Text, specific permission needed)
- `action_taken` (Text, e.g., "Parent called", "Detention")
- `is_visible_to_parent` (Boolean, Default: `false`)
- `created_at`, `updated_at`

### `discipline_audit_logs`
*Tracks status changes and edits to incidents.*
- `id` (UUID, PK)
- `incident_id` (UUID, FK)
- `changed_by_id` (UUID, FK)
- `change_type` (Enum: `status_change`, `edit_content`, `publish`)
- `old_value`, `new_value` (JSONB)
- `timestamp` (Timestamp)

---

## 5. API Contracts

### 5.1 Create Incident
`POST /api/v1/discipline/incidents`
**Request:**
```json
{
  "student_id": "uuid",
  "incident_date": "2026-02-07",
  "category": "behavioral",
  "severity": "medium",
  "description": "Repeatedly talking during exam."
}
```
**Response:** `201 Created` (Status: `pending_review`)

### 5.2 Update Incident Status
`PATCH /api/v1/discipline/incidents/{id}/status`
**Permission**: `discipline.review`
**Request:**
```json
{
  "status": "published",
  "action_taken": "Issued warning letter.",
  "is_visible_to_parent": true
}
```

### 5.3 Get Student Discipline History
`GET /api/v1/discipline/students/{student_id}`
**Permission**: `discipline.view`
**Response:** list of incidents.

---

## 6. UI Screens
1.  **Incident Reporting Form**: Simple wizard (Who, What, When, Severity).
2.  **Review Dashboard (Coordinator)**: List of `Pending Review` items. Quick "Approve" or "Reject".
3.  **Student Profile (Discipline Tab)**: Timeline view of incidents.
4.  **Parent App (Behavior)**: Read-only list of published incidents with "Action Taken".

---

## 7. Reporting
- **Behavior Trends**: Heatmap of incidents by Class/Section/Month.
- **Top Offenders**: List of students with >3 incidents (Early intervention).
- **Category Analysis**: Breakdown of incident types (e.g., 60% Late Arrival, 20% Uniform).

---

## 8. Security & Privacy
- **Internal Notes**: Must never be exposed via Parent API. Field-level permission check on API response.
- **Sensitive Categories**: Incidents marked `sensitive` (e.g., Harassment) visible only to Principal + designated Counselor.
- **Retention**: Incidents archived after Student leaves (configurable policy).

---

## 9. QA Plan

### 9.1 Playwright Scenarios
- **Teacher Report**: Login as Teacher -> Create Incident -> Verify it appears in "Pending".
- **Coordinator Publish**: Login as Coordinator -> Open Pending Incident -> Approve -> Check "Visible to Parent".
- **Parent View**: Login as Parent -> Check specific incident details -> Verify "Internal Notes" are missing.

### 9.2 API Tests
- **Endpoint Security**: Attempt to `PATCH` status as Teacher. Expect `403 Forbidden`.
- **Visibility Logic**: Fetch incident list as Parent. Ensure `is_visible_to_parent=false` items are filtered out.

---
