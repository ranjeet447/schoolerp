# P2 - Academic Management Enhancements (Grading)

## 1. Overview
Adds advanced grading configuration for schools with complex assessment models, allowing for board-specific grading scales and weighted GPA calculations.

**Goals:**
- Support CBSE/IGCSE and regional grading standards.
- Automate weighted aggregation across terms/exams.

## 2. Features
- **Weightage Config**: Define % contribution from Unit Tests, Mid-term, and Finals.
- **Grading Scales**: Mapping of percentage ranges to letter grades/points.
- **Grace Marks**: Automated logic for borderline candidates (with approval).

## 3. Workflows
### Weighted Calculation
1. **Trigger**: Teacher completes marks entry for all subjects in a Term.
2. **Process**: System checks the `exam_weightage_config`.
3. **Store**: Results are aggregated into the `marks_aggregates` table for report card generation.

## 4. Data Model
### `grading_scales`
- `tenant_id` (FK)
- `min_percent`, `max_percent`
- `grade_label` (e.g., `A1`)
- `grade_point` (e.g., `10.0`)

### `exam_weightage_config`
- `academic_year_id`
- `exam_type` (Enum: `periodic`, `half_yearly`, `annual`)
- `weight_percentage` (e.g., `20.0`)

## 5. Reports
- **Class Merit List**: Ranked view of students based on aggregated GPA.
- **Subject-wise Heatmap**: Identifying subjects with high fail/low-grade distributions.
