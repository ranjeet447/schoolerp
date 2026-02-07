# API Reference

The SchoolERP API is a Go-based RESTful service using the `chi` router.

## Base URL
- **Production**: `https://<your-backend-url>/v1`
- **Development**: `http://localhost:8080/v1`

## Authentication
Most endpoints require a Bearer token in the `Authorization` header.
- **Header**: `Authorization: Bearer <jwt-token>`
- **Tenant ID**: `X-Tenant-ID: <tenant-uuid>` (Required for multi-tenant isolation)

## Core Modules (V1)

### 1. SIS (Student Information System)
- `GET /admin/students`: List all students.
- `POST /admin/students`: Create a new student profile.
- `GET /admin/students/{id}`: Get student details.

### 2. Attendance
- `POST /admin/attendance`: Mark attendance for a class.
- `GET /admin/attendance/summary`: Get attendance reports.

### 3. Finance (Fees)
- `POST /admin/finance/receipts`: Generate a fee receipt.
- `GET /admin/finance/status/{student_id}`: Check pending fees.

### 4. Notices
- `POST /admin/notices`: Broadcast a new notice.
- `GET /parent/notices`: View notices targeted at the current parent/student.

### 5. Exams
- `POST /admin/exams/marks`: Bulk entry of marks.
- `GET /admin/exams/report-cards/{student_id}`: Generate/Preview report card.

## Health Check
- `GET /healthz`: Returns API status and timestamp.
