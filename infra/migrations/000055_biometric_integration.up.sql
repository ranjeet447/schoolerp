-- 000055_biometric_integration.up.sql

-- 1. Extend Students and Employees for Hardware Identifiers
ALTER TABLE students ADD COLUMN IF NOT EXISTS rfid_tag TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS biometric_id TEXT;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS rfid_tag TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS biometric_id TEXT;

-- 2. Create Biometric Logs for Raw Hardware Ingestion
CREATE TABLE biometric_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL, -- Hardware ID of the scanner
    raw_identifier TEXT NOT NULL, -- The RFID tag or Biometric string sensed
    
    -- Resolved Entity (if match found)
    entity_type TEXT, -- 'student' or 'employee'
    entity_id UUID,
    
    direction TEXT DEFAULT 'in', -- 'in' or 'out'
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Unique Constraints (Optional but recommended for faster lookups)
CREATE INDEX idx_students_rfid ON students(tenant_id, rfid_tag) WHERE rfid_tag IS NOT NULL;
CREATE INDEX idx_students_biometric ON students(tenant_id, biometric_id) WHERE biometric_id IS NOT NULL;

CREATE INDEX idx_employees_rfid ON employees(tenant_id, rfid_tag) WHERE rfid_tag IS NOT NULL;
CREATE INDEX idx_employees_biometric ON employees(tenant_id, biometric_id) WHERE biometric_id IS NOT NULL;

CREATE INDEX idx_biometric_logs_resolver ON biometric_logs(tenant_id, raw_identifier, logged_at);
