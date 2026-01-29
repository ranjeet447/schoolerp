-- 000007_attendance_and_fees.up.sql

-- PHASE 3: ATTENDANCE
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    class_section_id UUID NOT NULL REFERENCES sections(id),
    date DATE NOT NULL,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_section_id, date)
);

CREATE TABLE attendance_entries (
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    remarks TEXT,
    PRIMARY KEY(session_id, student_id)
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    decided_by UUID REFERENCES users(id),
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PHASE 4: FEES
CREATE TABLE fee_heads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'recurring',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    total_amount BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE fee_plan_items (
    plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE CASCADE,
    head_id UUID NOT NULL REFERENCES fee_heads(id),
    amount BIGINT NOT NULL,
    due_date DATE,
    info TEXT,
    PRIMARY KEY(plan_id, head_id)
);

CREATE TABLE student_fee_plans (
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(student_id, plan_id)
);

CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL, -- "REC-2025-001"
    student_id UUID NOT NULL REFERENCES students(id),
    amount_paid BIGINT NOT NULL,
    payment_mode TEXT NOT NULL,
    status TEXT DEFAULT 'issued',
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    transaction_ref TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, receipt_number)
);
