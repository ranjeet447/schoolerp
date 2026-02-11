-- Payroll Adjustments
CREATE TABLE payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    payroll_run_id UUID REFERENCES payroll_runs(id), -- Nullable until processed in a run
    
    type TEXT NOT NULL CHECK (type IN ('bonus', 'deduction', 'overtime', 'adjustment')),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payroll_adjustments_employee ON payroll_adjustments(employee_id);
CREATE INDEX idx_payroll_adjustments_tenant ON payroll_adjustments(tenant_id);
CREATE INDEX idx_payroll_adjustments_status ON payroll_adjustments(status);
