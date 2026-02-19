-- 000058_question_bank.up.sql

-- 1. Question Bank
CREATE TABLE exam_question_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'descriptive', 'short_answer')) DEFAULT 'mcq',
    question_text TEXT NOT NULL,
    options JSONB, -- For MCQs: {"A": "Choice 1", "B": "Choice 2", ...}
    correct_answer TEXT,
    marks DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Linking Bank Questions to Specific Paper Sets
CREATE TABLE exam_paper_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES exam_question_papers(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_question_bank(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(paper_id, question_id)
);

-- 3. Indexes
CREATE INDEX idx_qbank_subject ON exam_question_bank(tenant_id, subject_id, topic);
CREATE INDEX idx_paper_questions ON exam_paper_questions(paper_id, sort_order);
