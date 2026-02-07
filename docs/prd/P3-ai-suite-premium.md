# P3 - AI Suite Premium (Advanced Automation)

## 1. Overview
The "AI Suite Premium" is an advanced module providing heavy optimization, deeper insights, and automated remedial recommendations. These features require significant compute and data integration, hence "Premium" gating.

**Goals:**
-   **Optimization**: Solve complex timetabling problems.
-   **Intelligence**: Detect deviations (GP, Marks) anomalies.
-   **Remedial**: Personalized help for students.

## 2. Personas & RBAC Permission Matrix

| Role | Permission | A5: Timetable | A6: Insights | A7: Remedial |
| :--- | :--- | :---: | :---: | :---: |
| **Admin** | `ai.premium.config` | ✅ (Constraints) | ✅ (View Alerts) | ✅ (Dashboard) |
| **Coordinator** | `ai.timetable.gen` | ✅ (Generate/Edit) | ✅ (View) | ✅ (Assign) |
| **Teacher** | `ai.class.view` | ❌ | ✅ (My Class) | ✅ (My Students) |
| **Parent** | `ai.remedial.view` | ❌ | ❌ | ✅ (Student Only) |

## 3. Features & Data Model

### A5) Timetable Optimizer (Solver)
**Description**: Generates conflict-free class schedules based on rooms, teachers, subjects, and constraints.
**Data Model**:
-   `timetable_constraints`: (Tenant_ID, Max_Consecutive: 2, Free_Period: Fri-PM).
-   `timetable_solutions`: (Solution_ID, JSONB: Schedule).
**Workflow**:
1.  **Coordinator**: Defines Constraints (Teacher A: No Mon AM).
2.  **Solver**: Genetic Algorithm (or constraint solver) runs for ~5 mins.
3.  **Output**: Proposed Schedule with 0 conflicts.
4.  **Action**: Coordinator approves/modifies.

### A6) Insights & Anomaly Alerts (Data Science)
**Description**: Outlier detection for Attendance, Fees, and GPS.
**Data Model**:
-   `anomaly_alerts`: (Domain: `Transport`, Metric: `Route_deviation`, Severity: `High`).
**Workflow**:
1.  **Worker**: Compares daily metrics against 30-day moving average.
2.  **Detection**: Attendance drop > 20% compared to same day last year? -> "Flu Season Alert".
3.  **GPS**: Bus stops for > 15 mins outside designated stop? -> "Route Deviation Alert".
4.  **Action**: Push Notification to Admin.

### A7) Remedial Recommendations (Personalized Learning)
**Description**: Suggests extra help topics based on low marks in specific exam questions.
**Data Model**:
-   `remedial_suggestions`: (Student_ID, Subject: `Math`, Topic: `Fractions`, Resource_Link).
**Workflow**:
1.  **Trigger**: Exam results published. Marks < 40% in "Geometry".
2.  **Engine**: Maps "Geometry" low score to Syllabus -> Topic.
3.  **Generation**: Suggests: "Review Chapter 4 + Watch Video Link".
4.  **Delivery**: In-app suggestion to Parent/Student.

## 4. API Contracts

### A5: Generate Timetable
`POST /api/v1/ai/timetable/solve`
```json
{
  "academic_year_id": "uuid",
  "constraints": {
    "max_teaching_hours_per_day": 5
  }
}
```

### A6: Get Anomalies
`GET /api/v1/ai/insights/alerts?severity=high`
*Returns list of systemic issues detected today.*

### A7: Remedial Plan
`GET /api/v1/ai/remedial/student/{id}`
*Returns prioritized list of topics to review based on weak areas.*

## 5. UI Surfaces
-   **Coordinator Dashboard**: "Timetable Studio" with drag-and-drop + "Auto-Fill" button.
-   **Admin Control Center**: "Insights Feed" widget (like Facebook feed for school health).
-   **Student Profile**: "Study Plan" tab with AI suggestions.

## 6. QA Plan
-   **Solver Verification**: Verify generated timetable has NO double-booked teachers or rooms.
-   **Load Test**: Timetable generation for 50 classes < 10 mins.
-   **Explanation**: Remedial suggestion must cite the specific exam/question that caused the recommendation.
