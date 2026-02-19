-- Student Confidential Notes
CREATE TABLE IF NOT EXISTS student_confidential_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    is_sensitive BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conf_notes_student ON student_confidential_notes(student_id);
CREATE INDEX idx_conf_notes_tenant ON student_confidential_notes(tenant_id);
