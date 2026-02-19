-- Student Behavioral Logs
CREATE TABLE student_behavioral_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    student_id UUID NOT NULL REFERENCES students(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('merit', 'demerit', 'info')),
    category VARCHAR(50) NOT NULL, -- e.g., 'discipline', 'academic', 'sports', 'punctuality'
    points INTEGER DEFAULT 0,
    remarks TEXT,
    incident_date DATE DEFAULT CURRENT_DATE,
    logged_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student Health Records
CREATE TABLE student_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id),
    blood_group VARCHAR(10),
    allergies JSONB DEFAULT '[]',
    vaccinations JSONB DEFAULT '[]',
    medical_conditions TEXT,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_behavioral_student ON student_behavioral_logs(student_id);
CREATE INDEX idx_health_records_student ON student_health_records(student_id);

-- Trigger for updated_at
CREATE TRIGGER update_student_behavioral_logs_modtime BEFORE UPDATE ON student_behavioral_logs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
