-- 000077_certificate_issuance.up.sql

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL, -- Format: TC/2025/101, BF/2025/502
    type TEXT NOT NULL, -- "bonafide", "transfer_certificate", "character"
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'issued', -- "issued", "revoked", "cancelled"
    
    -- Metadata for specific types
    reason TEXT, -- Reason for TC or Bonafide
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store dynamic fields like character rating, etc.
    
    file_id UUID REFERENCES files(id), -- Link to the generated PDF if stored
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, certificate_number)
);

CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_tenant_type ON certificates(tenant_id, type);

-- Add permissions
INSERT INTO permissions (code, module, description) VALUES
  ('sis:certificates.read', 'sis', 'View issued certificates'),
  ('sis:certificates.write', 'sis', 'Issue and manage school certificates')
ON CONFLICT (code) DO NOTHING;
