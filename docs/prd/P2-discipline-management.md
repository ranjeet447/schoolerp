# P2 - Discipline Management System

## 1. Overview
The Discipline Management System (DMS) provides a structured way to record student behavioral incidents, track disciplinary actions, and inform guardians while maintaining appropriate confidentiality.

**Goals:**
- Standardization of incident logging across branches.
- Transparency for parents regarding disciplinary events.
- Audit trail for management (e.g., for TC generation).

## 2. Personas & RBAC Permission Matrix

| Action | Admin | Teacher | Parent |
| :--- | :---: | :---: | :---: |
| Report Incident | ✅ | ✅ | ❌ |
| Set Severity/Category | ✅ | ✅ | ❌ |
| Add Internal Remarks | ✅ | ✅ | ❌ |
| View Incident (Shared) | ✅ | ✅ | ✅ |

## 3. Workflows
### Happy Path: Recording a Behavior Incident
1. **Report**: Teacher logs an incident (e.g., bullying, property damage).
2. **Detail**: Selects category, severity (Low/Medium/High), and adds description + photos.
3. **Action**: Selects "Wait for Admin Review" or "Self-resolve" (e.g., verbal warning).
4. **Visibility**: If Admin approves, the incident is shared with the parent dashboard.

## 4. Data Model
### `discipline_incidents`
- `id` (UUID)
- `tenant_id` (FK)
- `student_id` (FK)
- `category` (Enum: `academic_dishonesty`, `behavioral`, `vandalism`)
- `severity` (Enum: `low`, `medium`, `high`)
- `status` (Enum: `pending_review`, `resolved`, `escalated_to_management`)
- `is_visible_to_parent` (Boolean)
- `reported_by_user_id` (FK)

## 5. API Contracts
### Create Incident
`POST /api/v1/discipline/incidents`
```json
{
  "student_id": "uuid",
  "category": "behavioral",
  "severity": "medium",
  "description": "Late for assembly repeatedly",
  "is_visible_to_parent": true
}
```

## 6. UI Screens
- **Incident Log**: Searchable list of all incidents with filters for status/severity.
- **Reporting Wizard**: multi-step form for reporting new events.
- **Management Dashboard**: High-severity incidents requiring immediate attention.

## 7. Notifications
- Parents are notified via Push/SMS when an incident is "Published".
- Principal notified for "High" severity events.

## 8. Reporting
- **Behavior Trend**: Students with >3 incidents in a term.
- **Category Summary**: Distribution of incidents across the school.

## 9. Security & Privacy
- **Internal Docs**: Separate field for internal management notes not visible to parents.
- **Confidentiality**: Automatic restricted access for "Sensitive" categories (e.g., harassment/medical-related).
