-- 000056_teacher_assignments.up.sql

-- 1. Teacher Specializations (What they can teach)
CREATE TABLE teacher_subject_specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, subject_id)
);

CREATE TABLE teacher_class_specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, class_id)
);

-- 2. Class Teacher Assignments (The 'Year' or 'Session' owner of a class)
CREATE TABLE class_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    remarks TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partial unique index for active assignments
CREATE UNIQUE INDEX idx_class_teacher_active_unique ON class_teacher_assignments (academic_year_id, class_section_id) WHERE is_active = true;

-- 3. Indexes for retrieval
CREATE INDEX idx_teacher_sub_spec ON teacher_subject_specializations(teacher_id, tenant_id);
CREATE INDEX idx_teacher_class_spec ON teacher_class_specializations(teacher_id, tenant_id);
CREATE INDEX idx_class_teacher_curr ON class_teacher_assignments(class_section_id, academic_year_id) WHERE is_active = true;
