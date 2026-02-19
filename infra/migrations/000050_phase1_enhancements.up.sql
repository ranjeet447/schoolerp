-- 000050_phase1_enhancements.up.sql
-- Phase 1: Custom fields, house system, staff attendance, period-wise attendance, school profile

-- ============================================================
-- 1. Custom Field Definitions & Values
-- ============================================================

CREATE TABLE custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'student', 'employee', 'guardian'
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text', 'number', 'date', 'select', 'multiselect', 'boolean', 'textarea'
    options JSONB DEFAULT '[]', -- For select/multiselect: ["Option1", "Option2"]
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, entity_type, field_name)
);

CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL, -- student_id, employee_id, etc.
    value JSONB NOT NULL DEFAULT '""', -- Stores any type: "text", 123, true, ["a","b"]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(definition_id, entity_id)
);

CREATE INDEX idx_custom_field_defs_tenant ON custom_field_definitions(tenant_id, entity_type);
CREATE INDEX idx_custom_field_vals_entity ON custom_field_values(entity_id);
CREATE INDEX idx_custom_field_vals_def ON custom_field_values(definition_id);

-- ============================================================
-- 2. House System
-- ============================================================

CREATE TABLE student_houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50), -- hex or color name
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Add house_id to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS house_id UUID REFERENCES student_houses(id);
CREATE INDEX idx_students_house ON students(house_id);

-- ============================================================
-- 3. Staff Attendance
-- ============================================================

CREATE TABLE staff_attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, date)
);

CREATE TABLE staff_attendance_entries (
    session_id UUID NOT NULL REFERENCES staff_attendance_sessions(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'late', 'half_day', 'on_leave'
    check_in_time TIME,
    check_out_time TIME,
    remarks TEXT,
    PRIMARY KEY(session_id, employee_id)
);

CREATE INDEX idx_staff_attendance_sessions_tenant ON staff_attendance_sessions(tenant_id, date);

-- ============================================================
-- 4. Period-wise Attendance
-- ============================================================

CREATE TABLE period_attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    class_section_id UUID NOT NULL REFERENCES sections(id),
    date DATE NOT NULL,
    period_number INT NOT NULL, -- 1, 2, 3...
    subject_id UUID REFERENCES subjects(id),
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_section_id, date, period_number)
);

CREATE TABLE period_attendance_entries (
    session_id UUID NOT NULL REFERENCES period_attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'late'
    remarks TEXT,
    PRIMARY KEY(session_id, student_id)
);

CREATE INDEX idx_period_attendance_tenant ON period_attendance_sessions(tenant_id, date);

-- ============================================================
-- 5. School Profile Settings (extends tenant_config)
-- ============================================================

CREATE TABLE school_profiles (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    school_name VARCHAR(500),
    logo_url TEXT,
    address TEXT,
    city VARCHAR(200),
    state VARCHAR(200),
    pincode VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(200),
    website VARCHAR(500),
    affiliation_board VARCHAR(100), -- 'CBSE', 'ICSE', 'State Board'
    affiliation_number VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    academic_year_format VARCHAR(50) DEFAULT 'YYYY-YYYY', -- '2025-2026'
    grading_system VARCHAR(50) DEFAULT 'percentage', -- 'percentage', 'grade', 'cgpa'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. Bulk Import Job Tracking
-- ============================================================

CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'students', 'users', 'employees'
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    total_rows INT DEFAULT 0,
    success_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    errors JSONB DEFAULT '[]',
    file_name VARCHAR(500),
    uploaded_by UUID REFERENCES users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_tenant ON import_jobs(tenant_id);
