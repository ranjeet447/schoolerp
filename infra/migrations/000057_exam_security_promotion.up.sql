-- 000057_exam_security_promotion.up.sql

-- 1. Secure Question Papers Repository
CREATE TABLE exam_question_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    set_name TEXT NOT NULL DEFAULT 'Set A', -- Set A, Set B, etc.
    file_path TEXT NOT NULL, -- S3/Storage path
    is_encrypted BOOLEAN DEFAULT true,
    unlock_at TIMESTAMP WITH TIME ZONE, -- Lock paper until exam date/time
    is_previous_year BOOLEAN DEFAULT false,
    academic_year_id UUID REFERENCES academic_years(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Security Access Logs (Audit for sensitive papers)
CREATE TABLE paper_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES exam_question_papers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- 3. Promotion Logic & Rules
CREATE TABLE promotion_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    min_aggregate_percent DECIMAL(5, 2) DEFAULT 33.00,
    min_subject_percent DECIMAL(5, 2) DEFAULT 33.00,
    required_attendance_percent DECIMAL(5, 2) DEFAULT 75.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Student Promotion History
CREATE TABLE student_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    to_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    from_section_id UUID REFERENCES sections(id),
    to_section_id UUID REFERENCES sections(id),
    promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    promoted_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'promoted', -- promoted, detained, tc_issued
    remarks TEXT
);

-- Indexes
CREATE INDEX idx_exam_papers_lookup ON exam_question_papers(tenant_id, exam_id, subject_id);
CREATE INDEX idx_paper_access_audit ON paper_access_logs(paper_id, accessed_at);
CREATE INDEX idx_promotion_history ON student_promotions(student_id, to_academic_year_id);
