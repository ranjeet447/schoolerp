# P2 - Homework & Lesson Planning

## 1. Overview
This module integrates daily classroom planning with student-parent engagement. Teachers plan their syllabus coverage (Lesson Plan) and assign tasks (Homework) to students, creating a closed-loop academic workflow.

**Goals:**
- Centralized tracking of syllabus coverage.
- Digital submission and feedback for assignments.
- Real-time visibility for parents into class activities.

## 2. Personas & RBAC Permission Matrix

| Action | Admin | Coordinator | Teacher | Student | Parent |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Create Lesson Plan | ❌ | ✅ | ✅ | ❌ | ❌ |
| Verify Syllabus | ✅ | ✅ | ❌ | ❌ | ❌ |
| Post Homework | ❌ | ❌ | ✅ | ❌ | ❌ |
| Submit Assignment | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Homework | ✅ | ✅ | ✅ | ✅ | ✅ |

## 3. Workflows
### Happy Path: Daily Homework
1. **Creation**: Teacher selects "Class 8A - Mathematics", adds title, description, and attaches a PDF worksheet.
2. **Publish**: Teacher sets a "Due Date". Parent/Student receives push notification.
3. **Submission**: Student uploads a photo of the completed worksheet.
4. **Evaluation**: Teacher views submission, adds "Well Done" remark, and marks as "Checked".

### Happy Path: Lesson Planning
1. **Setup**: Coordinator defines the "Physics" syllabus for the year (e.g., 10 Chapters).
2. **Weekly Plan**: Teacher assigns specific topics to weeks.
3. **Tracking**: After each lecture, Teacher marks "Topics Covered". Dashboard shows % of syllabus completion.

## 4. Data Model
### `homework`
- `id` (UUID)
- `tenant_id`, `subject_id`, `teacher_id` (FKs)
- `due_date`, `submission_allowed` (Boolean)
- `attachments` (JSONB array of S3 refs)

### `lesson_plans`
- `id` (UUID)
- `tenant_id`, `subject_id` (FKs)
- `week_number`, `planned_topic`, `covered_at` (Timestamp)

## 5. API Contracts
### Post Homework
`POST /api/v1/academics/homework`
```json
{
  "subject_id": "uuid",
  "title": "Algebra Basics",
  "description": "Solve exercises 1 to 5 on page 42",
  "due_date": "2026-02-10T10:00:00Z"
}
```

## 6. UI Screens
- **Teacher Diary**: Calendar view of posted homework and lesson plans.
- **Syllabus Tracker**: Progress bars showing coverage for each subject per class.
- **Student Submission Portal**: Mobile-optimized upload interface for parents/students.

## 7. Notifications
- **New Homework**: Immediate Push Notification.
- **Submission Reminder**: Push sent 4 hours before deadline to non-submitters.

## 8. Reporting
- **Submission Rate**: Reports showing students frequently missing deadlines.
- **Syllabus Lag**: Alerts for subjects where coverage is < 20% behind the planned schedule.

## 9. Security & Privacy
- **Tenancy**: Attachments are stored in tenant-scoped prefixes (`/tenant_id/homework/...`).
- **Isolation**: Students can only see their own submissions; Teachers see all.
