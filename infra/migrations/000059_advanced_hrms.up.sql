-- 000059_advanced_hrms.up.sql

-- 1. Staff Leave Management
CREATE TABLE staff_leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Sick, Casual, Earned, Maternity
    code TEXT NOT NULL, -- SL, CL, EL, ML
    annual_allowance INTEGER DEFAULT 0,
    carry_forward_limit INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE staff_leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES staff_leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staff Awards & Recognition
CREATE TABLE staff_awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    award_name TEXT NOT NULL, -- Teacher of the Month, Innovation Award
    category TEXT, -- Performance, Attendance, Innovation
    awarded_date DATE NOT NULL,
    awarded_by TEXT,
    description TEXT,
    bonus_amount DECIMAL(12, 2) DEFAULT 0, -- Link to payroll if any
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Multi-branch Transfers (Audit & History)
CREATE TABLE staff_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    from_branch_id UUID REFERENCES branches(id),
    to_branch_id UUID REFERENCES branches(id),
    transfer_date DATE NOT NULL,
    reason TEXT,
    authorized_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Monthly Bonuses & Adjustments History
CREATE TABLE staff_bonus_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    bonus_type TEXT NOT NULL, -- Performance, Festival, Statutory
    payment_date DATE NOT NULL,
    payroll_run_id UUID REFERENCES payroll_runs(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_leave_lookup ON staff_leave_requests(employee_id, status, start_date);
CREATE INDEX idx_staff_award_summary ON staff_awards(employee_id, awarded_date);
CREATE INDEX idx_staff_transfer_history ON staff_transfers(employee_id, transfer_date);
