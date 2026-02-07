-- Admission Enquiries (Public & Internal)
CREATE TABLE admission_enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id), -- For public forms, this must be supplied
    
    -- Parent/Guardian Details
    parent_name TEXT NOT NULL,
    email TEXT CHECK (email ~* '^.+@.+\..+$'),
    phone TEXT NOT NULL,
    
    -- Student Details
    student_name TEXT NOT NULL,
    grade_interested TEXT NOT NULL,
    academic_year TEXT NOT NULL, -- e.g., "2024-2025"
    
    -- Meta
    source TEXT DEFAULT 'website', -- website, referral, walk-in
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'contacted', 'interview_scheduled', 'converted', 'rejected')),
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admission Applications (Formal Application linked to Enquiry)
CREATE TABLE admission_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    enquiry_id UUID REFERENCES admission_enquiries(id),
    
    application_number TEXT NOT NULL, -- Auto-generated sequence e.g. APP-2024-001
    
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'review', 'assessment', 'offered', 'admitted', 'declined')),
    
    -- JSONB for flexible form fields (documents, detailed history, etc.)
    form_data JSONB NOT NULL DEFAULT '{}',
    documents JSONB NOT NULL DEFAULT '[]',
    
    reviewed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, application_number)
);

CREATE INDEX idx_admission_enquiries_tenant ON admission_enquiries(tenant_id);
CREATE INDEX idx_admission_enquiries_status ON admission_enquiries(status);
CREATE INDEX idx_admission_applications_enquiry ON admission_applications(enquiry_id);
