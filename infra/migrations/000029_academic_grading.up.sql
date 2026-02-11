-- 000029_academic_grading.up.sql

-- Add type to exams
ALTER TABLE exams ADD COLUMN type TEXT NOT NULL DEFAULT 'periodic'; -- 'periodic', 'half_yearly', 'annual'

-- Grading Scales (A1, A2, B1, etc.)
CREATE TABLE grading_scales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    min_percent DECIMAL(5, 2) NOT NULL,
    max_percent DECIMAL(5, 2) NOT NULL,
    grade_label TEXT NOT NULL,
    grade_point DECIMAL(4, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, grade_label)
);

-- Exam Weightage Configuration
CREATE TABLE exam_weightage_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL, -- 'periodic', 'half_yearly', 'annual'
    weight_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, academic_year_id, exam_type)
);

-- Marks Aggregates (Term End / Final Results)
CREATE TABLE marks_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    aggregate_marks DECIMAL(5, 2) NOT NULL,
    grade_label TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id, subject_id)
);

-- Index for lookups
CREATE INDEX idx_marks_aggregates_student ON marks_aggregates(student_id);
CREATE INDEX idx_marks_aggregates_tenant_ay ON marks_aggregates(tenant_id, academic_year_id);
