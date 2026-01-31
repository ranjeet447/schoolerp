-- 000008_notices_and_exams.up.sql

-- PHASE 5: NOTICES
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scope JSONB NOT NULL, -- {"type": "class", "target": "uuid"}
    publish_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notice_acks (
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ack_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(notice_id, user_id)
);

-- PHASE 6: EXAMS
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    name TEXT NOT NULL, -- "Mid-Term"
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'draft', -- "draft", "published", "completed"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exam_subjects (
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    max_marks INTEGER NOT NULL DEFAULT 100,
    exam_date DATE,
    PRIMARY KEY(exam_id, subject_id)
);

CREATE TABLE marks_entries (
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5, 2),
    remarks TEXT,
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(exam_id, subject_id, student_id)
);
