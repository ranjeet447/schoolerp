# SchoolERP — Complete API Reference

**Version:** v1.0
**Base URL:** `https://<backend>/v1`
**Last Updated:** 2026-02-19

---

## Authentication

All protected endpoints require:
- **Header:** `Authorization: Bearer <jwt-token>`
- **Header:** `X-Tenant-ID: <tenant-uuid>` (multi-tenant isolation)

JWT tokens are issued via the `/auth/login` endpoint and contain: `user_id`, `tenant_id`, `role`.

---

## Common Patterns

- **Pagination:** Most list endpoints accept `?limit=50&offset=0`
- **Dates:** Use `YYYY-MM-DD` format (e.g., `2026-01-15`)
- **Timestamps:** ISO 8601 UTC (e.g., `2026-01-15T10:30:00Z`)
- **IDs:** UUID v4/v7 format
- **Errors:** `{ "error": "message" }` with appropriate HTTP status codes

---

## Public APIs (No Auth Required)

### Auth

#### `POST /auth/login`
```json
// Request
{ "email": "admin@school.in", "password": "secret123" }
// Response 200
{ "token": "<jwt>", "user": { "id": "uuid", "name": "...", "role": "tenant_admin" }, "tenant_id": "uuid" }
```

#### `POST /auth/forgot-password`
```json
// Request
{ "email": "admin@school.in" }
// Response 200
{ "message": "password reset link sent" }
```

#### `GET /healthz`
```json
// Response 200
{ "status": "ok", "timestamp": "2026-02-19T14:00:00Z" }
```

### Marketing & Demo

#### `POST /public/demo-bookings`
```json
// Request
{ "name": "Priya Sharma", "email": "priya@school.in", "phone": "+919876543210",
  "school_name": "Delhi Public School", "city": "Delhi", "student_count": 500 }
// Response 201
{ "id": "uuid", "status": "pending" }
```

#### `POST /public/contact`
```json
// Request
{ "name": "Ravi Kumar", "email": "ravi@school.in", "phone": "+919876543210",
  "message": "Interested in enterprise plan", "source": "marketing" }
// Response 201
{ "id": "uuid" }
```

#### `POST /public/partner-applications`
```json
// Request
{ "company_name": "EduTech Solutions", "contact_name": "Amit", "email": "amit@edutech.in",
  "phone": "+919876543210", "description": "Implementation partner" }
// Response 201
{ "id": "uuid", "status": "pending" }
```

### Public Admissions

#### `POST /public/admissions/enquiries`
```json
// Request
{ "student_name": "Ananya", "class_applied": "5", "parent_name": "Meena",
  "phone": "+919876543210", "email": "meena@gmail.com" }
// Response 201
{ "id": "uuid", "status": "new" }
```

---

## Admin APIs

> All admin endpoints require `Authorization` + `X-Tenant-ID` headers.

### SIS — Student Information System

#### `GET /admin/students`
**Query Params:** `?limit=50&offset=0&search=ananya&class_id=uuid&section_id=uuid`
```json
// Response 200
[{ "id": "uuid", "admission_number": "2026001", "first_name": "Ananya", "last_name": "Sharma",
   "class_name": "5", "section_name": "A", "status": "active" }]
```

#### `POST /admin/students`
```json
// Request
{ "admission_number": "2026001", "first_name": "Ananya", "last_name": "Sharma",
  "date_of_birth": "2015-03-20", "gender": "female", "class_id": "uuid",
  "section_id": "uuid", "guardian_name": "Meena Sharma", "guardian_phone": "+919876543210",
  "guardian_email": "meena@gmail.com", "guardian_relation": "mother",
  "address": "12 MG Road, Delhi" }
// Response 201
{ "id": "uuid", "admission_number": "2026001", ... }
```

#### `GET /admin/students/{id}`
```json
// Response 200
{ "id": "uuid", "admission_number": "2026001", "first_name": "Ananya",
  "guardians": [...], "custom_fields": [...], "documents": [...] }
```

#### `GET /admin/students/search?q=ananya`
```json
// Response 200
[{ "id": "uuid", "admission_number": "2026001", "first_name": "Ananya", "last_name": "Sharma" }]
```

### Academic Structure

#### `GET /admin/academic-structure/classes`
```json
// Response 200
[{ "id": "uuid", "name": "Class 5", "numeric_name": 5, "is_active": true }]
```

#### `POST /admin/academic-structure/classes`
```json
// Request
{ "name": "Class 5", "numeric_name": 5 }
// Response 201
{ "id": "uuid", "name": "Class 5" }
```

#### `GET /admin/academic-structure/sections`
**Query Params:** `?class_id=uuid`

#### `POST /admin/academic-structure/sections`
```json
// Request
{ "class_id": "uuid", "name": "A", "capacity": 40 }
```

#### `GET /admin/academic-structure/subjects`

---

### Attendance

#### `POST /admin/attendance`
```json
// Request
{ "class_section_id": "uuid", "date": "2026-02-19",
  "entries": [
    { "student_id": "uuid", "status": "present" },
    { "student_id": "uuid", "status": "absent", "remarks": "sick" }
  ]}
// Response 200
{ "session_id": "uuid", "marked_count": 2 }
```
> Status values: `present`, `absent`, `late`, `half_day`, `excused`

#### `GET /admin/attendance/summary`
**Query Params:** `?class_section_id=uuid&from=2026-02-01&to=2026-02-28`

#### `GET /admin/attendance/stats?date=2026-02-19`
```json
// Response 200
{ "total_students": 450, "present": 420, "absent": 30, "attendance_percentage": 93.3 }
```

#### `GET /admin/attendance/policies`
#### `POST /admin/attendance/policies`
```json
// Request
{ "min_attendance_percent": 75.0, "auto_alert_on_absent": true }
```

---

### Finance / Fees

#### `POST /admin/finance/fees/heads`
```json
// Request
{ "name": "Tuition Fee", "type": "tuition" }
// Response 200
{ "id": "uuid", "name": "Tuition Fee", "type": "tuition" }
```

#### `GET /admin/finance/fees/heads`
```json
// Response 200
[{ "id": "uuid", "name": "Tuition Fee", "type": "tuition" }]
```

#### `POST /admin/finance/fees/plans`
```json
// Request
{ "name": "Class 5 Annual Plan", "academic_year_id": "uuid", "total_amount": 75000 }
// Response 200
{ "id": "uuid", "name": "Class 5 Annual Plan", "total_amount": 75000 }
```

#### `POST /admin/finance/fees/assign`
```json
// Request
{ "student_id": "uuid", "plan_id": "uuid" }
// Response 200 (empty body)
```

#### `GET /admin/finance/fees/students/{id}/summary`
```json
// Response 200
{ "student_id": "uuid", "total_fee": 75000, "total_paid": 50000,
  "total_due": 25000, "concessions_applied": 5000,
  "heads": [{ "name": "Tuition", "amount": 50000, "paid": 30000, "due": 20000 }] }
```

#### `POST /admin/finance/payments/offline` — Issue Receipt
```json
// Request
{ "student_id": "uuid", "amount": 25000, "mode": "cash",
  "transaction_ref": "TXN-001",
  "items": [{ "fee_head_id": "uuid", "amount": 20000 }, { "fee_head_id": "uuid", "amount": 5000 }] }
// Response 200
{ "id": "uuid", "receipt_number": "RCP/2026/0001", "amount": 25000, "status": "active" }
```
> Mode values: `cash`, `cheque`, `bank_transfer`, `online`, `upi`

#### `POST /admin/finance/receipts/{id}/cancel`
```json
// Request
{ "reason": "Duplicate entry" }
// Response 200
{ "id": "uuid", "status": "cancelled", "cancelled_at": "2026-02-19T14:00:00Z" }
```

#### `POST /admin/finance/receipts/{id}/refund`
```json
// Request
{ "amount": 5000, "reason": "Excess payment" }
// Response 200
{ "id": "uuid", "refund_amount": 5000 }
```

#### `GET /admin/finance/receipts/{id}/pdf`
> Response: `application/pdf` binary download

#### `GET /admin/finance/payments/receipts?student_id=uuid`
```json
// Response 200
[{ "id": "uuid", "receipt_number": "RCP/2026/0001", "amount": 25000,
   "mode": "cash", "status": "active", "created_at": "..." }]
```

#### `POST /admin/finance/receipts/series`
```json
// Request
{ "prefix": "RCP", "start_number": 1 }
// Response 200
{ "id": "uuid", "prefix": "RCP", "current_number": 1 }
```

#### `GET /admin/finance/receipts/series`

#### `POST /admin/finance/payments/online` — Create Online Order
```json
// Request
{ "student_id": "uuid", "amount": 25000 }
// Response 200
{ "order_id": "uuid", "razorpay_order_id": "order_xxx", "amount": 25000, "currency": "INR" }
```

#### `POST /admin/finance/payments/razorpay-webhook`
> Razorpay sends this automatically. Headers: `X-Razorpay-Signature`, `X-Razorpay-Event-Id`

#### `POST /admin/finance/fees/structure` — Upsert Fee Class Config
```json
// Request
{ "academic_year_id": "uuid", "class_id": "uuid", "fee_head_id": "uuid",
  "amount": 50000.00, "due_date": "2026-06-30", "is_optional": false }
```

#### `GET /admin/finance/fees/structure?academic_year_id=uuid&class_id=uuid`

#### `POST /admin/finance/fees/gateways` — Upsert Gateway Config
```json
// Request
{ "provider": "razorpay", "api_key": "rzp_live_xxx", "api_secret": "xxx",
  "webhook_secret": "xxx", "is_active": true, "settings": {} }
```
> Provider values: `razorpay`, `stripe`, `payu`

#### `GET /admin/finance/fees/gateways?provider=razorpay`

#### `POST /admin/finance/fees/scholarships`
```json
// Request
{ "name": "Merit Scholarship", "type": "percentage", "value": 25.0,
  "description": "Top 10% students", "is_active": true }
```
> Type values: `percentage`, `flat_amount`

#### `GET /admin/finance/fees/scholarships?active_only=true`

#### `GET /admin/finance/fees/optional`
#### `POST /admin/finance/fees/select`
```json
// Request
{ "student_id": "uuid", "item_id": "uuid", "academic_year_id": "uuid", "status": "active" }
```

#### `POST /admin/finance/rules/late-fees`
```json
// Request
{ "fee_head_id": "uuid", "rule_type": "daily", "amount": 50.00, "grace_days": 7 }
```
> Rule type values: `fixed`, `daily`

#### `GET /admin/finance/rules/late-fees`

#### `POST /admin/finance/rules/concessions`
```json
// Request
{ "name": "Sibling Discount", "discount_type": "percentage", "value": 10.0,
  "category": "sibling", "priority": 1 }
```
> Category values: `sibling`, `employee`, `scholarship`, `special`

#### `GET /admin/finance/rules/concessions`

#### `POST /admin/finance/student-concessions`
```json
// Request
{ "student_id": "uuid", "rule_id": "uuid", "remarks": "Second child in school" }
// Response 200 (empty body)
```

#### `GET /admin/finance/payments/reports/billing?from=2026-01-01&to=2026-01-31`
```json
// Response 200
{ "summary": { "total_collected": 5000000, "total_pending": 2000000, "receipt_count": 150 },
  "rows": [{ "date": "2026-01-15", "amount": 125000, "count": 5 }] }
```

#### `GET /admin/finance/payments/reports/collections?from=2026-01-01&to=2026-01-31`

#### `POST /admin/finance/payments/ledger-mappings`
```json
// Request
{ "fee_head_id": "uuid", "tally_ledger_name": "School Fees" }
```

#### `GET /admin/finance/payments/ledger-mappings`

#### `GET /admin/finance/payments/tally-export?from=2026-01-01&to=2026-01-31`
> Response: `text/csv` download

---

### Exams

#### `POST /admin/exams`
```json
// Request
{ "name": "Mid-Term Exam", "academic_year_id": "uuid", "exam_date": "2026-03-15", "max_marks": 100 }
```

#### `GET /admin/exams`

#### `POST /admin/exams/marks`
```json
// Request
{ "exam_id": "uuid", "subject_id": "uuid",
  "entries": [{ "student_id": "uuid", "marks": 85, "remarks": "Good" }] }
```

#### `GET /admin/exams/marks?exam_id=uuid&subject_id=uuid&class_section_id=uuid`

---

### Notices

#### `POST /admin/notices`
```json
// Request
{ "title": "Annual Day Celebration", "body": "All students are invited...",
  "scope": { "values": ["class_5", "class_6"] } }
// Response 201
{ "id": "uuid", "title": "Annual Day Celebration", "created_at": "..." }
```
> Scope formats: `"all"` | `["class_5","section_5A"]` | `{"value":"all"}`

#### `GET /admin/notices`

---

### Academics (Homework, Lesson Plans, Timetable)

#### `GET /admin/academics/homework/options`
```json
// Response 200 — lists classes/sections available for the logged-in teacher
[{ "class_id": "uuid", "class_name": "5", "section_id": "uuid", "section_name": "A",
   "subjects": [{ "id": "uuid", "name": "Mathematics" }] }]
```

#### `POST /admin/academics/homework`
```json
// Request
{ "class_section_id": "uuid", "subject_id": "uuid", "title": "Chapter 5 Exercises",
  "description": "Complete Q1-Q10", "due_date": "2026-02-25",
  "attachment_url": "https://storage/file.pdf", "max_marks": 20 }
// Response 201
{ "id": "uuid", "title": "Chapter 5 Exercises" }
```

#### `GET /admin/academics/homework/section/{section_id}`
#### `GET /admin/academics/homework/submissions/{homework_id}`

#### `POST /admin/academics/homework/submissions`
```json
// Request
{ "homework_id": "uuid", "attachment_url": "https://storage/photo.jpg", "remarks": "Done" }
```

#### `POST /admin/academics/homework/submissions/{id}/grade`
```json
// Request
{ "marks": 18, "teacher_feedback": "Excellent work!" }
```

#### `PUT /admin/academics/lesson-plans`
```json
// Request
{ "class_section_id": "uuid", "subject_id": "uuid", "week_number": 12,
  "planned_topic": "Quadratic Equations", "covered_at": "2026-02-19",
  "academic_year_id": "uuid" }
```

#### `GET /admin/academics/lesson-plans?class_section_id=uuid&subject_id=uuid&academic_year_id=uuid`

#### `GET /admin/academics/timetable?class_section_id=uuid`
#### `PUT /admin/academics/timetable`
```json
// Request
{ "class_section_id": "uuid",
  "slots": [{ "day": 1, "period": 1, "subject_id": "uuid", "teacher_id": "uuid" }] }
```

#### `GET /admin/academics/subjects`
#### `GET /admin/academics/certificates/requests`
#### `POST /admin/academics/certificates/requests`
```json
// Request
{ "student_id": "uuid", "certificate_type": "bonafide", "purpose": "Passport application" }
```

#### `POST /admin/academics/certificates/requests/{id}/status`
```json
// Request
{ "status": "approved" }
```
> Status values: `approved`, `rejected`

---

### Communication (PTM, Chat)

#### `POST /admin/communication/ptm/events`
```json
// Request
{ "title": "Term 1 PTM", "description": "Parent-teacher meeting for Term 1",
  "event_date": "2026-03-01T00:00:00Z", "start_time": "2026-03-01T09:00:00Z",
  "end_time": "2026-03-01T13:00:00Z", "slot_duration_minutes": 15, "teacher_id": "uuid" }
// Response 201
{ "id": "uuid", "title": "Term 1 PTM", "slots": [...] }
```

#### `GET /admin/communication/ptm/events`
#### `GET /admin/communication/ptm/events/{id}/slots`

#### `POST /admin/communication/ptm/events/{id}/slots/{slot_id}/book`
```json
// Request
{ "student_id": "uuid", "remarks": "Need to discuss math performance" }
```

#### `POST /admin/communication/chats/{room_id}/messages`
```json
// Request
{ "message": "Hello, I wanted to discuss Ananya's progress" }
// Response 201
{ "id": "uuid", "message": "...", "sender_id": "uuid", "created_at": "..." }
```

#### `GET /admin/communication/chats/{room_id}/history?limit=50&offset=0`
#### `GET /admin/communication/chats/rooms?user_id=uuid`

#### `GET /admin/communication/chats/moderation`
```json
// Response 200
{ "quiet_hours_start": "20:00", "quiet_hours_end": "07:00",
  "blocked_keywords": ["spam", "advertisement"], "is_enabled": true }
```

#### `PUT /admin/communication/chats/moderation`
> **Requires:** `tenant_admin` or `super_admin` role
```json
// Request
{ "quiet_hours_start": "20:00", "quiet_hours_end": "07:00",
  "blocked_keywords": ["spam"], "is_enabled": true }
```

#### `GET /admin/communication/events?event_type=sms&status=delivered&limit=50&offset=0`

---

### Safety (Discipline, Visitors, Pickups, Broadcasts)

#### `POST /admin/safety/incidents`
```json
// Request
{ "student_id": "uuid", "incident_date": "2026-02-19T10:30:00Z",
  "category": "discipline", "title": "Classroom disruption",
  "description": "Student was disruptive during math class",
  "action_taken": "Warning issued", "parent_visibility": true }
// Response 201
{ "id": "uuid", "status": "open" }
```
> Category examples: `discipline`, `bullying`, `attendance`, `academic`, `safety`

#### `GET /admin/safety/incidents?limit=50&offset=0`

#### `POST /admin/safety/visitors/check-in`
```json
// Request
{ "full_name": "Rajesh Kumar", "phone": "+919876543210",
  "purpose": "Parent meeting", "id_type": "aadhar", "id_number": "1234-5678-9012",
  "photo_url": "https://storage/visitor.jpg", "host_employee_id": "uuid" }
// Response 201
{ "id": "uuid", "check_in_time": "2026-02-19T10:30:00Z" }
```

#### `POST /admin/safety/visitors/check-out/{id}`
```json
// Request (optional)
{ "remarks": "Meeting completed" }
// Response 200
{ "id": "uuid", "check_out_time": "2026-02-19T11:00:00Z" }
```

#### `GET /admin/safety/visitors/logs?limit=50&offset=0`

#### `POST /admin/safety/pickups`
```json
// Request
{ "student_id": "uuid", "name": "Grandmother Lakshmi", "phone": "+919876543210",
  "relation": "grandmother", "id_proof": "DL-12345", "photo_url": "https://storage/photo.jpg" }
// Response 201
{ "id": "uuid" }
```

#### `GET /admin/safety/pickups/{student_id}`

#### `POST /admin/safety/broadcasts`
```json
// Request
{ "message": "School closing early due to weather advisory",
  "channel": "sms", "target_roles": ["parent", "teacher"] }
// Response 202
{ "id": "uuid", "status": "dispatched", "recipient_count": 450 }
```
> Channel values: `sms`, `push`, `whatsapp`

#### `GET /admin/safety/broadcasts?limit=50&offset=0`

---

### Transport

#### `GET /admin/transport/vehicles`
#### `POST /admin/transport/vehicles`
```json
// Request
{ "registration_number": "DL01AB1234", "type": "bus", "capacity": 40,
  "fuel_type": "diesel", "insurance_expiry": "2027-01-01" }
```

#### `GET /admin/transport/routes`
#### `POST /admin/transport/routes`
```json
// Request
{ "name": "Route A - South Delhi", "vehicle_id": "uuid", "driver_id": "uuid",
  "stops": [{ "name": "Green Park", "lat": 28.56, "lng": 77.21,
    "pickup_time": "07:30", "pickup_cost": 2000, "drop_cost": 2000 }] }
```

#### `GET /admin/transport/allocations`
#### `POST /admin/transport/allocations`
```json
// Request
{ "student_id": "uuid", "route_id": "uuid", "stop_id": "uuid", "type": "both" }
```
> Type values: `pickup`, `drop`, `both`

---

### Library

#### `GET /admin/library/books?limit=50&offset=0`
#### `POST /admin/library/books`
```json
// Request
{ "title": "Mathematics for Class 5", "author": "RD Sharma", "isbn": "978-xxx",
  "category_id": "uuid", "total_copies": 10, "available_copies": 10 }
```

#### `POST /admin/library/issues`
```json
// Request
{ "book_id": "uuid", "student_id": "uuid", "due_date": "2026-03-15" }
```

#### `POST /admin/library/returns`
```json
// Request
{ "issue_id": "uuid", "fine_amount": 0 }
```

---

### Inventory

#### `GET /admin/inventory/items`
#### `POST /admin/inventory/items`
```json
// Request
{ "name": "Whiteboard Marker", "category_id": "uuid", "unit": "piece",
  "reorder_level": 50, "current_stock": 200, "location": "Main Store" }
```

#### `POST /admin/inventory/purchase-orders`
```json
// Request
{ "supplier_id": "uuid", "expected_date": "2026-03-01",
  "items": [{ "item_id": "uuid", "quantity": 100, "unit_price": 25.00 }] }
```
> PO status workflow: `draft` → `submitted` → `approved` → `received`

#### `POST /admin/inventory/transactions`
```json
// Request
{ "item_id": "uuid", "type": "in", "quantity": 100, "remarks": "PO received" }
```
> Type values: `in`, `out`, `adjustment`

---

### HRMS & Payroll

#### `GET /admin/hrms/employees?limit=50&offset=0&status=active&department=uuid`
#### `POST /admin/hrms/employees`
```json
// Request
{ "first_name": "Ravi", "last_name": "Kumar", "email": "ravi@school.in",
  "phone": "+919876543210", "department_id": "uuid", "designation": "Teacher",
  "date_of_joining": "2025-06-01", "employment_type": "full_time",
  "salary_structure_id": "uuid" }
```

#### `POST /admin/hrms/salary-structures`
```json
// Request
{ "name": "Teacher Grade A", "basic": 30000, "hra": 12000, "da": 6000,
  "allowances": 5000, "pf_deduction": 3600, "tax_deduction": 2500 }
```

#### `GET /admin/hrms/salary-structures`

#### `POST /admin/hrms/payroll-runs`
```json
// Request
{ "month": 2, "year": 2026, "description": "February 2026 Payroll" }
```

#### `POST /admin/hrms/payroll-runs/{id}/execute`
> Calculates payslips for all employees. Response: `{ "processed": 45, "errors": 0 }`

#### `POST /admin/hrms/adjustments`
```json
// Request
{ "employee_id": "uuid", "payroll_run_id": "uuid", "type": "bonus",
  "amount": 5000, "description": "Performance bonus" }
```
> Type values: `bonus`, `deduction`, `reimbursement`, `advance`

#### `GET/POST /admin/hrms/teacher-specializations`
```json
// POST Request
{ "teacher_id": "uuid", "subject_ids": ["uuid", "uuid"], "class_ids": ["uuid"] }
```

#### `GET/POST /admin/hrms/class-teachers`
```json
// POST Request
{ "class_section_id": "uuid", "teacher_id": "uuid", "academic_year_id": "uuid" }
```

#### `GET/POST /admin/hrms/staff-tasks`
```json
// POST Request
{ "employee_id": "uuid", "title": "Prepare exam papers", "description": "...",
  "due_date": "2026-03-01", "priority": "high" }
```
> Priority values: `low`, `medium`, `high`, `urgent`

---

### Admissions

#### `GET /admin/admissions/enquiries`
#### `POST /admin/admissions/applications`
```json
// Request
{ "enquiry_id": "uuid", "academic_year_id": "uuid" }
```

#### `PATCH /admin/admissions/applications/{id}/status`
```json
// Request
{ "status": "accepted", "remarks": "Document verification complete" }
```
> Status values: `new`, `under_review`, `accepted`, `rejected`, `enrolled`

---

### Alumni

#### `GET /admin/alumni?limit=50&offset=0`
#### `POST /admin/alumni`
```json
// Request
{ "full_name": "Vikram Singh", "graduation_year": 2020, "batch": "2018-2020",
  "email": "vikram@corp.com", "phone": "+919876543210",
  "current_company": "Google", "job_role": "SDE-2", "linkedin_url": "https://linkedin.com/in/vikram" }
```

#### `GET /admin/alumni/drives?limit=50&offset=0`
#### `POST /admin/alumni/drives`
```json
// Request
{ "company_name": "Infosys", "role_title": "Associate",
  "description": "Campus placement drive", "min_graduation_year": 2023, "max_graduation_year": 2025 }
```

#### `POST /admin/alumni/drives/{id}/apply`
```json
// Request
{ "alumni_id": "uuid", "resume_url": "https://storage/resume.pdf", "cover_letter": "..." }
```

#### `PATCH /admin/alumni/applications/{id}/status`
```json
// Request
{ "status": "shortlisted" }
```
> Status values: `applied`, `shortlisted`, `interviewed`, `selected`, `rejected`

---

### Portfolio (Multi-School Groups)

#### `GET /admin/portfolio/groups`
#### `POST /admin/portfolio/groups`
```json
// Request
{ "name": "ABC Education Trust", "description": "Group of 5 schools" }
```

#### `GET /admin/portfolio/groups/{id}/members`
#### `POST /admin/portfolio/groups/{id}/members`
```json
// Request
{ "tenant_id": "uuid" }
```

#### `GET /admin/portfolio/groups/{id}/analytics`
```json
// Response 200
{ "total_students": 5000, "total_schools": 5, "average_attendance": 92.5 }
```

---

### AI Endpoints

#### `POST /admin/ai/lesson-plan`
> **Feature flag:** `enable_teacher_copilot` must be enabled in tenant config
```json
// Request
{ "subject": "Mathematics", "topic": "Quadratic Equations", "grade": "10" }
// Response 200
{ "lesson_plan": "## Lesson Plan: Quadratic Equations\n\n### Objectives:\n..." }
```

---

## Parent APIs

> All parent endpoints require `Authorization` + `X-Tenant-ID` headers.

#### `GET /parent/me/children`
```json
// Response 200
[{ "id": "uuid", "name": "Ananya Sharma", "class": "5A", "admission_number": "2026001" }]
```

#### `GET /parent/notices`
#### `POST /parent/notices/{id}/ack`
> Response 200 (empty body)

#### `GET /parent/fees/{child_id}/summary`
> Same response as admin fee summary

#### `GET /parent/fees/{child_id}/receipts`

#### `GET /parent/results/{child_id}`

#### `POST /parent/ai/query`
> **Feature flag:** `enable_parent_helpdesk` must be enabled
```json
// Request
{ "query": "What is the fee due for Ananya?", "context_info": "parent" }
// Response 200
{ "answer": "Ananya's pending fee for Term 2 is ₹25,000. The due date is March 31, 2026." }
```

---

## Teacher APIs

#### `GET /teacher/attendance/class-sections`
```json
// Response 200
[{ "class_section_id": "uuid", "class_name": "5", "section_name": "A" }]
```

#### `GET /teacher/homework/options`
> Returns classes/subjects the teacher is assigned to

---

## Notification Logs

#### `GET /admin/notifications/logs?limit=50&offset=0`
```json
// Response 200
[{ "id": "uuid", "event_type": "attendance.absent", "channel": "sms",
   "recipient": "+919876543210", "status": "delivered", "created_at": "..." }]
```
