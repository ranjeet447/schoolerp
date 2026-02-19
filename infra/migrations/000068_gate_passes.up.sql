-- Gate Passes for secure student exit
CREATE TABLE IF NOT EXISTS gate_passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    qr_code TEXT,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gate_passes_student ON gate_passes(student_id);
CREATE INDEX idx_gate_passes_tenant ON gate_passes(tenant_id);
CREATE INDEX idx_gate_passes_status ON gate_passes(tenant_id, status);
