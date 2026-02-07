-- Alumni & Placement Portal Migration

CREATE TABLE alumni (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id), -- Original student record
    user_id UUID REFERENCES users(id), -- Alumni can have a user account
    full_name TEXT NOT NULL,
    graduation_year INT,
    batch TEXT,
    email TEXT,
    phone TEXT,
    current_company TEXT,
    current_role TEXT,
    linkedin_url TEXT,
    profile_picture_url TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE placement_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    description TEXT,
    drive_date DATE,
    application_deadline DATE,
    min_graduation_year INT,
    max_graduation_year INT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE placement_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id UUID NOT NULL REFERENCES placement_drives(id) ON DELETE CASCADE,
    alumni_id UUID NOT NULL REFERENCES alumni(id) ON DELETE CASCADE,
    resume_url TEXT,
    cover_letter TEXT,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interviewed', 'offered', 'placed', 'rejected')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(drive_id, alumni_id)
);

-- Indexes
CREATE INDEX idx_alumni_tenant ON alumni(tenant_id);
CREATE INDEX idx_alumni_graduation ON alumni(graduation_year);
CREATE INDEX idx_placement_drives_tenant ON placement_drives(tenant_id);
CREATE INDEX idx_placement_drives_status ON placement_drives(status);
CREATE INDEX idx_placement_applications_drive ON placement_applications(drive_id);
CREATE INDEX idx_placement_applications_alumni ON placement_applications(alumni_id);
