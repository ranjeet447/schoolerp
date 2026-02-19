-- 000064_p1_features.up.sql

-- 1. Hall Tickets for Examinations
CREATE TABLE IF NOT EXISTS hall_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL,
    hall_number TEXT,
    seat_number TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id),
    UNIQUE(exam_id, roll_number)
);

CREATE INDEX idx_hall_tickets_exam ON hall_tickets(exam_id);
CREATE INDEX idx_hall_tickets_student ON hall_tickets(student_id);

-- 2. Discipline Severity
ALTER TABLE discipline_incidents ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- 3. Board Type for Tenants (if not already choosing to use config, let's add a explicit column for easier filtering)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS board_type TEXT DEFAULT 'other'; -- 'CBSE', 'ICSE', 'STATE', 'OTHER'
