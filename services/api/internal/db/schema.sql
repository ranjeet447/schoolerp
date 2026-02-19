-- 000001_core_saas.up.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants & Branches
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    domain TEXT UNIQUE, -- Custom domain
    logo_url TEXT,
    board_type TEXT DEFAULT 'other', -- 'CBSE', 'ICSE', 'STATE', 'OTHER'
    config JSONB DEFAULT '{}', -- Branding, term terminology overrides
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- e.g. "MAIN", "NORTH"
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- 2. People & Identities
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- "password", "otp", "google"
    identifier TEXT NOT NULL, -- phone or email
    credential TEXT, -- hash
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, identifier)
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    device_info JSONB,
    ip_address TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RBAC
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for platform roles
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- e.g. "admin", "teacher", "accountant"
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g. "sis:read", "fees:create"
    module TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL, -- "tenant", "branch", "class"
    scope_id UUID, -- NULL for tenant scope
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Governance: Policies & Locks
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    action TEXT NOT NULL, -- e.g. "edit_attendance"
    logic JSONB NOT NULL, -- e.g. {"window_hours": 48}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, module, action)
);

CREATE TABLE locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    resource_id UUID, -- Optional: specific exam_id or month_id
    locked_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id),
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- "pending", "approved", "rejected"
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audit & Outbox
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    request_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    before_state JSONB,
    after_state JSONB,
    reason_code TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE outbox_events (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    request_id TEXT,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- "pending", "processing", "done", "failed"
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    process_after TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Notifications
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id), -- NULL for base templates
    code TEXT NOT NULL,
    channel TEXT NOT NULL, -- "email", "sms", "whatsapp", "push"
    locale TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code, channel, locale)
);

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id),
    balance_paise BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE wallet_ledger (
    id BIGSERIAL PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    amount_paise BIGINT NOT NULL,
    type TEXT NOT NULL, -- "topup", "usage"
    description TEXT,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and isolation
CREATE INDEX idx_audit_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_outbox_tenant_status ON outbox_events(tenant_id, status);
CREATE INDEX idx_role_assignments_user ON role_assignments(user_id, tenant_id);

-- Down migration stub
-- CREATE TABLE audit_logs_down (id int);
-- 000002_add_leads.up.sql

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    school_name TEXT NOT NULL,
    city TEXT,
    student_count INTEGER,
    message TEXT,
    source_page TEXT, -- which page the lead came from
    utm_campaign TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    status TEXT DEFAULT 'new', -- "new", "contacted", "qualified", "lost"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for lead management
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
-- 000003_marketing_growth.up.sql

-- 1. Marketing PDF Jobs
CREATE TABLE marketing_pdf_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL,
    locale TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- "pending", "processing", "completed", "failed"
    file_id UUID,
    request_ip TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Public Reviews & Testimonials
CREATE TABLE review_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    school_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    locale TEXT DEFAULT 'en',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- "pending", "used", "expired"
    created_by UUID, -- Admin ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT, -- Optional if submitted via direct request
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    school_name TEXT NOT NULL,
    city TEXT,
    logo_file_id UUID,
    status TEXT DEFAULT 'pending', -- "pending", "approved", "rejected"
    consent BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Partner Applications
CREATE TABLE partner_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    category TEXT NOT NULL, -- "Payments", "Messaging", etc.
    description TEXT,
    logo_file_id UUID,
    status TEXT DEFAULT 'pending', -- "pending", "reviewed", "approved", "rejected"
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-language Integrations Fallback (if not using Directus)
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    short_description TEXT,
    long_description TEXT,
    logo_url TEXT,
    website_url TEXT,
    status TEXT DEFAULT 'active', -- "active", "coming_soon"
    locale TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_review_token ON review_requests(token);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_partners_status ON partner_applications(status);
CREATE INDEX idx_integrations_slug_locale ON integrations(slug, locale);
-- 000004_demo_booking.up.sql

-- 1. Demo Types (e.g., 15/30/60 min)
CREATE TABLE demo_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Availability Rules (Weekly Schedule)
CREATE TABLE availability_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID, -- NULL for platform default, or specific admin ID
    timezone TEXT DEFAULT 'Asia/Kolkata',
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_interval_minutes INTEGER DEFAULT 15,
    buffer_before_minutes INTEGER DEFAULT 0,
    buffer_after_minutes INTEGER DEFAULT 0,
    max_bookings_per_slot INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Availability Exceptions (Holidays or custom days)
CREATE TABLE availability_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID,
    exception_date DATE NOT NULL,
    is_unavailable BOOLEAN DEFAULT TRUE,
    custom_start_time TIME,
    custom_end_time TIME,
    note TEXT
);

-- 4. Demo Bookings
CREATE TABLE demo_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID,
    demo_type_id UUID REFERENCES demo_types(id),
    start_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- "pending", "confirmed", "cancelled", "rescheduled", "completed", "no_show"
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    school_name TEXT NOT NULL,
    city TEXT,
    student_count_range TEXT,
    message TEXT,
    source_page TEXT,
    utm_source TEXT,
    utm_campaign TEXT,
    utm_medium TEXT,
    confirmation_token TEXT UNIQUE NOT NULL,
    idempotency_key TEXT UNIQUE,
    request_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Booking Events (Audit Trail)
CREATE TABLE booking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES demo_bookings(id),
    event_type TEXT NOT NULL, -- "created", "confirmed", "rescheduled", "cancelled", etc.
    payload_json JSONB,
    actor_user_id UUID, -- NULL for public actions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Calendar Connections (Stubs for future integrations)
CREATE TABLE calendar_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL,
    provider TEXT NOT NULL, -- "google", "microsoft"
    status TEXT DEFAULT 'active',
    scopes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance & race safety
CREATE INDEX idx_bookings_owner_start ON demo_bookings(owner_user_id, start_at_utc);
CREATE INDEX idx_bookings_token ON demo_bookings(confirmation_token);
CREATE INDEX idx_bookings_status ON demo_bookings(status);

-- Unique constraint for slot locking (Option A: Race safety)
-- In real app, we might check overlaps more strictly in Go/PLpgSQL
CREATE UNIQUE INDEX idx_unique_booking_slot ON demo_bookings(owner_user_id, start_at_utc) 
WHERE status IN ('pending', 'confirmed');
-- 000005_files_and_jobs.up.sql

-- 1. File Storage Metadata
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bucket TEXT NOT NULL,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT,
    size BIGINT DEFAULT 0,
    url TEXT, -- Presigned or public URL cache
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_files_tenant ON files(tenant_id);

-- 2. PDF Templates
CREATE TABLE pdf_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for system defaults
    code TEXT NOT NULL, -- e.g. "receipt_v1", "report_card_term_1"
    name TEXT NOT NULL,
    html_body TEXT NOT NULL, -- Handlebars/Go template string
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code, version)
);

-- 3. PDF Generation Jobs
CREATE TABLE pdf_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_code TEXT NOT NULL,
    payload JSONB NOT NULL, -- Data to inject into template
    status TEXT DEFAULT 'pending', -- "pending", "processing", "completed", "failed"
    file_id UUID REFERENCES files(id), -- Resulting PDF
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pdf_jobs_status ON pdf_jobs(status, created_at);
-- 000006_sis_foundation.up.sql

-- 1. Academic Structure
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "2025-2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Class 10"
    level INTEGER, -- Sort order: 1, 2, ... 12
    stream TEXT, -- "Science", "Commerce", etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "A", "B"
    capacity INTEGER DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, name)
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT, -- "PHY101"
    type TEXT DEFAULT 'theory', -- "theory", "practical"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. People (Students & Guardians)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    admission_number TEXT NOT NULL,
    roll_number TEXT,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT, -- "male", "female", "other"
    address TEXT,
    
    -- Current Status
    section_id UUID REFERENCES sections(id),
    status TEXT DEFAULT 'active', -- "active", "graduated", "left"
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, admission_number)
);

CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_guardians (
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL, -- "father", "mother", "guardian"
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(student_id, guardian_id)
);

CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id),
    type TEXT NOT NULL, -- "birth_certificate", "transfer_certificate"
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
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
-- 000008_notices_and_exams.up.sql

-- PHASE 5: NOTICES
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scope JSONB NOT NULL, -- {"type": "class", "target": "uuid"}
    attachments JSONB DEFAULT '[]',
    publish_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notice_acks (
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ack_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(notice_id, user_id)
);

-- PHASE 6: EXAMS
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    name TEXT NOT NULL, -- "Mid-Term"
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'draft', -- "draft", "published", "completed"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exam_subjects (
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    max_marks INTEGER NOT NULL DEFAULT 100,
    exam_date DATE,
    PRIMARY KEY(exam_id, subject_id)
);

CREATE TABLE marks_entries (
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5, 2),
    remarks TEXT,
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(exam_id, subject_id, student_id)
);
-- 000009_guardian_user_link.up.sql

ALTER TABLE guardians ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_guardians_user_id ON guardians(user_id);
-- 000010_foundation_updates.up.sql

ALTER TABLE policies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE approval_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE locks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- 000012_attendance_updates.up.sql

ALTER TABLE attendance_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE attendance_entries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- 000013_fees_hardening.up.sql

-- 1. Receipt Numbering Series
CREATE TABLE receipt_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id), -- NULL for all branches
    prefix TEXT NOT NULL, -- "REC/2025/"
    current_number INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, prefix)
);

-- 2. Refunds
CREATE TABLE fee_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    receipt_id UUID NOT NULL REFERENCES receipts(id),
    amount BIGINT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- "pending", "approved", "rejected"
    decided_by UUID REFERENCES users(id),
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhance Receipts with series link
ALTER TABLE receipts ADD COLUMN series_id UUID REFERENCES receipt_series(id);

-- 4. Payment Orders (Pre-receipt)
CREATE TABLE payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    amount BIGINT NOT NULL,
    mode TEXT NOT NULL, -- "online", "offline"
    status TEXT DEFAULT 'pending', -- "pending", "success", "failed"
    external_ref TEXT, -- Gateway txn id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 000014_notice_updates.up.sql

ALTER TABLE notices ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- 000015_performance_indices.up.sql

-- 1. Financial Performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_tenant_date ON payment_orders (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_date ON receipts (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_refunds_tenant_receipt ON fee_refunds (tenant_id, receipt_id);

-- 2. SIS & Academic Performance
CREATE INDEX IF NOT EXISTS idx_attendance_entries_session ON attendance_entries (session_id);
CREATE INDEX IF NOT EXISTS idx_marks_entries_exam_subject ON marks_entries (exam_id, subject_id);

-- 3. Audit & Logging
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (tenant_id, action, created_at DESC);
-- Transport Module

CREATE TABLE transport_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- bus, van, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, registration_number)
);

CREATE TABLE transport_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- driver might be a system user
    full_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    vehicle_id UUID REFERENCES transport_vehicles(id),
    driver_id UUID REFERENCES transport_drivers(id),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transport_route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sequence_order INT NOT NULL,
    arrival_time TIME,
    pickup_cost BIGINT, -- in paise
    drop_cost BIGINT, -- in paise
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transport_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES transport_routes(id),
    stop_id UUID REFERENCES transport_route_stops(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transport_vehicles_tenant ON transport_vehicles(tenant_id);
CREATE INDEX idx_transport_drivers_tenant ON transport_drivers(tenant_id);
CREATE INDEX idx_transport_routes_tenant ON transport_routes(tenant_id);
CREATE INDEX idx_transport_route_stops_route ON transport_route_stops(route_id);
CREATE INDEX idx_transport_allocations_student ON transport_allocations(student_id);
CREATE INDEX idx_transport_allocations_route ON transport_allocations(route_id);
-- Library Logic
CREATE TABLE library_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES library_categories(id),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE library_authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title TEXT NOT NULL,
    isbn TEXT,
    barcode TEXT UNIQUE,
    publisher TEXT,
    published_year INTEGER,
    category_id UUID REFERENCES library_categories(id),
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    shelf_location TEXT,
    cover_image_url TEXT,
    price DECIMAL(10, 2),
    language TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, lost, damaged, archived
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE library_book_authors (
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES library_authors(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

CREATE TABLE library_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    book_id UUID NOT NULL REFERENCES library_books(id),
    student_id UUID REFERENCES students(id), -- Nullable to allow issuing to staff later if needed
    user_id UUID REFERENCES users(id), -- Staff who issued/returned
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ,
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'issued', -- issued, returned, overdue, lost
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_library_books_tenant ON library_books(tenant_id);
CREATE INDEX idx_library_books_category ON library_books(category_id);
CREATE INDEX idx_library_issues_tenant ON library_issues(tenant_id);
CREATE INDEX idx_library_issues_student ON library_issues(student_id);
CREATE INDEX idx_library_issues_status ON library_issues(status);
-- Inventory Logic

CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'consumable')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE inventory_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    category_id UUID REFERENCES inventory_categories(id),
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    unit TEXT, -- e.g., 'pcs', 'kg', 'ltr', 'box'
    reorder_level INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, sku)
);

CREATE TABLE inventory_stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    location TEXT, -- e.g., 'Main Store', 'Chemistry Lab'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, item_id, location)
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2), -- Only relevant for 'in' usually, but good for valuation
    supplier_id UUID REFERENCES inventory_suppliers(id), -- For 'in'
    reference_id UUID, -- Could be a generic reference (e.g. Purchase Order ID or Requester User ID)
    reference_type TEXT, -- 'purchase_order', 'user', 'department'
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_stocks_item ON inventory_stocks(item_id);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(type);
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
-- Library Digital Assets Migration

CREATE TABLE library_digital_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('pdf', 'epub', 'link', 'video')),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    file_size_bytes BIGINT,
    access_level TEXT NOT NULL DEFAULT 'all' CHECK (access_level IN ('all', 'staff', 'students', 'premium')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_library_digital_assets_book ON library_digital_assets(book_id);
CREATE INDEX idx_library_digital_assets_tenant ON library_digital_assets(tenant_id);

-- Inventory Procurement Tables

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    po_number TEXT NOT NULL,
    supplier_id UUID REFERENCES inventory_suppliers(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'received', 'cancelled')),
    total_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, po_number)
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    received_quantity INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(po_id);
-- HRMS & Payroll Migration

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    employee_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT,
    designation TEXT,
    join_date DATE,
    salary_structure_id UUID,
    bank_details JSONB, -- {bank_name, account_number, ifsc}
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, employee_code)
);

CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    basic DECIMAL(12, 2) NOT NULL,
    hra DECIMAL(12, 2) DEFAULT 0,
    da DECIMAL(12, 2) DEFAULT 0,
    other_allowances JSONB, -- {conveyance, medical, etc}
    deductions JSONB, -- {pf, tax, etc}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

ALTER TABLE employees ADD CONSTRAINT fk_salary_structure 
    FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id);

CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    year INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    run_by UUID REFERENCES users(id),
    run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, month, year)
);

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    gross_salary DECIMAL(12, 2) NOT NULL,
    total_deductions DECIMAL(12, 2) DEFAULT 0,
    net_salary DECIMAL(12, 2) NOT NULL,
    breakdown JSONB, -- detailed line items
    status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_salary_structures_tenant ON salary_structures(tenant_id);
CREATE INDEX idx_payroll_runs_tenant ON payroll_runs(tenant_id);
CREATE INDEX idx_payslips_run ON payslips(payroll_run_id);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
-- Portfolio & Multi-School Groups Migration

CREATE TABLE school_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE school_group_members (
    group_id UUID NOT NULL REFERENCES school_groups(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, tenant_id)
);

-- Indexes
CREATE INDEX idx_school_groups_owner ON school_groups(owner_user_id);
CREATE INDEX idx_school_group_members_group ON school_group_members(group_id);
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
    job_role TEXT,
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
-- Add processing fee columns to admission applications
ALTER TABLE admission_applications 
ADD COLUMN processing_fee_amount BIGINT DEFAULT 0,
ADD COLUMN processing_fee_status TEXT DEFAULT 'pending' CHECK (processing_fee_status IN ('pending', 'paid', 'waived')),
ADD COLUMN payment_reference TEXT;

-- Index for financial reporting
CREATE INDEX idx_admission_applications_payment ON admission_applications(processing_fee_status);
CREATE TABLE IF NOT EXISTS mfa_secrets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    backup_codes TEXT[] DEFAULT '{}',
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ip_allowlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL, -- e.g., 'admin', 'teacher'
    cidr_block CIDR NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, role_name, cidr_block)
);

CREATE INDEX idx_ip_allowlists_tenant_role ON ip_allowlists(tenant_id, role_name);
CREATE TABLE IF NOT EXISTS outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'attendance.absent', 'fee.paid', 'notice.published'
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    retry_count INT DEFAULT 0,
    error_message TEXT,
    process_after TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_status_created ON outbox(status, created_at);
CREATE INDEX idx_outbox_tenant_id ON outbox(tenant_id);
-- 000027_payment_events.up.sql

CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    gateway_event_id TEXT NOT NULL, -- Razorpay's internal event ID
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, gateway_event_id)
);

-- Index for idempotency checks
CREATE INDEX idx_payment_events_gateway_id ON payment_events(tenant_id, gateway_event_id);
-- 000028_tally_integration.up.sql

CREATE TABLE tally_ledger_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES fee_heads(id) ON DELETE CASCADE,
    tally_ledger_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, fee_head_id)
);

-- Index for mapping lookups
CREATE INDEX idx_tally_mappings_tenant ON tally_ledger_mappings(tenant_id);
-- 000029_academic_grading.up.sql

-- Add type to exams
ALTER TABLE exams ADD COLUMN type TEXT NOT NULL DEFAULT 'periodic'; -- 'periodic', 'half_yearly', 'annual'

-- Grading Scales (A1, A2, B1, etc.)
CREATE TABLE grading_scales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    min_percent DECIMAL(5, 2) NOT NULL,
    max_percent DECIMAL(5, 2) NOT NULL,
    grade_label TEXT NOT NULL,
    grade_point DECIMAL(4, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, grade_label)
);

-- Exam Weightage Configuration
CREATE TABLE exam_weightage_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL, -- 'periodic', 'half_yearly', 'annual'
    weight_percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, academic_year_id, exam_type)
);

-- Marks Aggregates (Term End / Final Results)
CREATE TABLE marks_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    aggregate_marks DECIMAL(5, 2) NOT NULL,
    grade_label TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id, subject_id)
);

-- Index for lookups
CREATE INDEX idx_marks_aggregates_student ON marks_aggregates(student_id);
CREATE INDEX idx_marks_aggregates_tenant_ay ON marks_aggregates(tenant_id, academic_year_id);
-- 000030_homework_lesson_plans.up.sql

-- Homework assignments
CREATE TABLE homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_section_id UUID NOT NULL REFERENCES class_sections(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_allowed BOOLEAN DEFAULT TRUE,
    attachments JSONB DEFAULT '[]', -- Array of S3 refs
    resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student submissions
CREATE TABLE homework_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homework_id UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attachment_url TEXT,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'checked', 'returned'
    teacher_feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(homework_id, student_id)
);

-- Lesson plans / Syllabus tracking
CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    planned_topic TEXT NOT NULL,
    covered_at TIMESTAMP WITH TIME ZONE,
    review_status TEXT NOT NULL DEFAULT 'pending',
    review_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, subject_id, class_id, week_number)
);

-- Indexes
CREATE INDEX idx_homework_class ON homework(class_section_id);
CREATE INDEX idx_homework_tenant_due ON homework(tenant_id, due_date);
CREATE INDEX idx_lesson_plans_subject ON lesson_plans(subject_id, class_id);
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
-- 000032_safety_module.up.sql

-- 1. Discipline Incidents
CREATE TABLE discipline_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id),
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    category VARCHAR(50) NOT NULL, -- "behavioral", "academic", "attendance", "other"
    title VARCHAR(255) NOT NULL,
    description TEXT,
    action_taken TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'reported', -- "reported", "investigating", "resolved", "dismissed"
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    parent_visibility BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Visitors
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    id_type VARCHAR(50), -- "aadhaar", "driving_license", "voter_id", "passport"
    id_number TEXT, -- To be encrypted at service layer
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, phone, id_type, id_number)
);

CREATE TABLE visitor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    contact_person_id UUID REFERENCES users(id), -- Staff member being visited
    check_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out_at TIMESTAMP WITH TIME ZONE,
    badge_number VARCHAR(50),
    remarks TEXT,
    entry_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Pickup Authorizations
CREATE TABLE pickup_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Pickup Events (Logs)
CREATE TABLE pickup_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    auth_id UUID REFERENCES pickup_authorizations(id) ON DELETE SET NULL,
    pickup_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    picked_up_by_name VARCHAR(255),
    relationship VARCHAR(100),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pickup_events_student ON pickup_events(student_id);
CREATE INDEX idx_pickup_events_tenant ON pickup_events(tenant_id);
CREATE INDEX idx_pickup_events_at ON pickup_events(pickup_at);



-- 4. Emergency Broadcasts
CREATE TABLE emergency_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL, -- "sms", "whatsapp", "push", "all"
    target_roles TEXT[] NOT NULL, -- ["parent", "staff", "teacher"]
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- "pending", "sent", "failed"
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_discipline_student ON discipline_incidents(student_id);
CREATE INDEX idx_discipline_tenant ON discipline_incidents(tenant_id);
CREATE INDEX idx_visitor_logs_visitor ON visitor_logs(visitor_id);
CREATE INDEX idx_visitor_logs_tenant ON visitor_logs(tenant_id);
CREATE INDEX idx_pickup_student ON pickup_authorizations(student_id);
CREATE INDEX idx_pickup_tenant ON pickup_authorizations(tenant_id);
CREATE INDEX idx_emergency_tenant ON emergency_broadcasts(tenant_id);
-- 000033_communication_module.up.sql

-- 1. PTM (Parent-Teacher Meeting)
CREATE TABLE ptm_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 15,
    teacher_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ptm_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES ptm_events(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    student_id UUID REFERENCES students(id), -- Null if available
    status VARCHAR(20) NOT NULL DEFAULT 'available', -- "available", "booked", "blocked"
    booking_remarks TEXT,
    booked_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, start_time)
);

CREATE TABLE ptm_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES ptm_slots(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL, -- '24h', '1h'
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, slot_id, student_id, reminder_type)
);

CREATE INDEX idx_ptm_reminder_logs_slot ON ptm_reminder_logs(slot_id);

-- 2. Moderated Chat
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255), -- Usually "Chat for [Student Name]"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_participants (
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL, -- "teacher", "parent", "admin"
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(room_id, user_id)
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT FALSE,
    moderation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_moderation_settings (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    quiet_hours_start TIME, -- e.g., 20:00
    quiet_hours_end TIME,   -- e.g., 08:00
    blocked_keywords TEXT[], -- Array of patterns/words
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ptm_event_tenant ON ptm_events(tenant_id);
CREATE INDEX idx_ptm_slots_event ON ptm_slots(event_id);
CREATE INDEX idx_chat_room_student ON chat_rooms(student_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
-- Migration: 000034_ai_knowledge_base
-- Description: Create knowledge base table for per-tenant AI grounding

BEGIN;

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'markdown', 'faq'
    metadata JSONB DEFAULT '{}', -- For storing source refs, tags, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search weighting/category if needed later
    category TEXT
);

-- Index for tenant-based retrieval
CREATE INDEX IF NOT EXISTS idx_ai_kb_tenant_id ON ai_knowledge_base(tenant_id);

-- Optional: Full text search index on content
CREATE INDEX IF NOT EXISTS idx_ai_kb_content_search ON ai_knowledge_base USING GIN (to_tsvector('english', content));

COMMIT;
-- 000035_uuid_v7_support.up.sql
-- Implements UUID v7 generation in Pure SQL (PL/pgSQL)
-- UUID v7 is time-ordered and much better for DB indexing than v4.

CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
AS $$
DECLARE
  v_time timestamp with time zone:= clock_timestamp();
  v_unix_t bigint;
  v_rand_a bigint;
  v_rand_b bigint;
  v_bytea bytea;
BEGIN
  v_unix_t := (EXTRACT(EPOCH FROM v_time) * 1000)::bigint;
  v_rand_a := (random() * 4096)::int; -- 12 bits
  v_rand_b := (random() * 4611686018427387904)::bigint; -- 62 bits
  
  -- Build bytea: 48 bits time, 4 bits version (7), 12 bits rand_a, 2 bits variant (10), 62 bits rand_b
  v_bytea := decode(
    lpad(to_hex(v_unix_t), 12, '0') ||
    to_hex(7 * 4096 + v_rand_a) ||
    to_hex(2 * 4611686018427387904 + v_rand_b),
    'hex'
  );
  
  RETURN encode(v_bytea, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update Core SaaS table defaults
ALTER TABLE tenants ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE branches ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE user_identities ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE sessions ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE roles ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE permissions ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE role_assignments ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- Update SIS table defaults
ALTER TABLE students ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE guardians ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- Update HRMS table defaults
ALTER TABLE employees ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE payroll_runs ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE payslips ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- Update Fees table defaults
ALTER TABLE receipts ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE payment_orders ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE fee_plans ALTER COLUMN id SET DEFAULT uuid_generate_v7();

-- Update AI KB table defaults
ALTER TABLE ai_knowledge_base ALTER COLUMN id SET DEFAULT uuid_generate_v7();
-- 000036_uuid_v7_overflow_fix.up.sql
-- Fix uuid_generate_v7() overflow from previous implementation.
--
-- Prior logic attempted to compute:
--   2 * 4611686018427387904 + rand
-- which overflows bigint (2^63) in PostgreSQL.
--
-- This implementation assembles UUIDv7 as hex segments without overflowing bigint.

CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
AS $$
DECLARE
  v_unix_t bigint;
  v_rand_a integer;
  v_variant_nibble integer;
  v_rand_b bigint;
  v_hex text;
BEGIN
  -- 48-bit unix milliseconds
  v_unix_t := floor(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint;

  -- 12 random bits
  v_rand_a := floor(random() * 4096)::integer;

  -- Variant nibble 10xx (8..11)
  v_variant_nibble := 8 + floor(random() * 4)::integer;

  -- 60 random bits (keeps arithmetic inside bigint range)
  v_rand_b := floor(random() * 1152921504606846976)::bigint; -- 2^60

  v_hex :=
    lpad(to_hex(v_unix_t), 12, '0') ||
    lpad(to_hex((7 << 12) + v_rand_a), 4, '0') ||
    to_hex(v_variant_nibble) ||
    lpad(to_hex(v_rand_b), 15, '0');

  RETURN (
    substr(v_hex, 1, 8) || '-' ||
    substr(v_hex, 9, 4) || '-' ||
    substr(v_hex, 13, 4) || '-' ||
    substr(v_hex, 17, 4) || '-' ||
    substr(v_hex, 21, 12)
  )::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;
-- 000037_platform_control_plane.up.sql

CREATE TABLE IF NOT EXISTS platform_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly BIGINT NOT NULL DEFAULT 0,
    price_yearly BIGINT NOT NULL DEFAULT 0,
    modules JSONB NOT NULL DEFAULT '{}'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES platform_plans(id),
    status TEXT NOT NULL DEFAULT 'trial', -- trial, active, suspended, closed
    trial_starts_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    renews_at TIMESTAMPTZ,
    grace_period_ends_at TIMESTAMPTZ,
    billing_email TEXT,
    tax_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    dunning_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);

CREATE TABLE IF NOT EXISTS tenant_signup_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    country TEXT,
    student_count_range TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    review_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_signup_requests_status ON tenant_signup_requests(status);

CREATE TABLE IF NOT EXISTS platform_action_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL,
    target_tenant_id UUID REFERENCES tenants(id),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, expired
    reason TEXT,
    expires_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_action_approvals_status ON platform_action_approvals(status, action_type);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    subject TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, critical
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    tags TEXT[] NOT NULL DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'internal', -- internal, email, api
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    due_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority);

CREATE TABLE IF NOT EXISTS support_ticket_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    note_type TEXT NOT NULL DEFAULT 'internal', -- internal, customer
    note TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_last4 TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    rotated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_api_keys_tenant_active ON platform_api_keys(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS platform_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_webhooks_tenant_active ON platform_webhooks(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES platform_webhooks(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, delivered, failed
    http_status INT,
    request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_status_created ON integration_logs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- backup, restore, export, data_fix
    status TEXT NOT NULL DEFAULT 'requested', -- requested, approved, running, completed, failed
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_backups_tenant_action ON platform_backups(tenant_id, action, created_at DESC);
-- 000038_platform_billing_invoices.up.sql

CREATE TABLE IF NOT EXISTS platform_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'INR',
    amount_total BIGINT NOT NULL,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, issued, paid, overdue, cancelled
    due_date TIMESTAMPTZ,
    issued_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    external_ref TEXT,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_invoices_tenant_status ON platform_invoices(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_number ON platform_invoices(invoice_number);
-- 000039_platform_billing_adjustments.up.sql

CREATE TABLE IF NOT EXISTS platform_invoice_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES platform_invoices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL, -- refund, credit_note
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'recorded', -- recorded, issued, applied, cancelled
    reason TEXT,
    external_ref TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_invoice_adjustments_invoice_created
    ON platform_invoice_adjustments(invoice_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_invoice_adjustments_tenant_type_status
    ON platform_invoice_adjustments(tenant_id, adjustment_type, status, created_at DESC);
-- 000040_platform_rbac_templates.up.sql

-- Ensure baseline platform roles exist.
INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Super Admin', 'super_admin', 'Full platform access', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'super_admin'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Support L1', 'support_l1', 'First-line support operations', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'support_l1'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Support L2', 'support_l2', 'Escalated support operations', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'support_l2'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Finance', 'finance', 'Billing and payment operations', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'finance'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Operations', 'ops', 'Platform operations and lifecycle control', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'ops'
);

INSERT INTO roles (tenant_id, name, code, description, is_system)
SELECT NULL, 'Developer', 'developer', 'Technical integrations and diagnostics', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE tenant_id IS NULL AND code = 'developer'
);

-- Baseline platform permission matrix.
INSERT INTO permissions (code, module, description) VALUES
  ('platform:tenant.read', 'platform', 'View tenant directory and tenant profile'),
  ('platform:tenant.write', 'platform', 'Update tenant settings and lifecycle state'),
  ('platform:billing.read', 'platform', 'View subscriptions, invoices, and collections'),
  ('platform:billing.write', 'platform', 'Mutate subscriptions, invoices, and lockout controls'),
  ('platform:user.read', 'platform', 'View internal platform users and role assignments'),
  ('platform:user.write', 'platform', 'Create/update internal platform users and role assignments'),
  ('platform:audit.read', 'platform', 'View platform audit logs and security trails'),
  ('platform:impersonation.use', 'platform', 'Use login-as tenant admin controls'),
  ('platform:ops.manage', 'platform', 'Manage incident, queue, and reliability operations'),
  ('platform:dev.manage', 'platform', 'Access developer-only tooling and controls'),
  ('platform:integrations.manage', 'platform', 'Manage API keys, webhooks, and integrations'),
  ('platform:monitoring.read', 'platform', 'View monitoring and system health dashboards'),
  ('platform:settings.write', 'platform', 'Manage platform-wide settings and templates'),
  ('platform:marketing.write', 'platform', 'Manage platform announcements and changelogs'),
  ('platform:analytics.read', 'platform', 'View business and platform analytics dashboard'),
  ('platform:data.export', 'platform', 'Run tenant/platform exports'),
  ('platform:data.restore', 'platform', 'Run restore and destructive data workflows')
ON CONFLICT (code) DO NOTHING;

-- Role-to-permission defaults.
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'super_admin' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code LIKE 'platform:%'
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'support_l1' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenant.read',
  'platform:billing.read',
  'platform:user.read',
  'platform:audit.read',
  'platform:monitoring.read'
)
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'support_l2' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenant.read',
  'platform:tenant.write',
  'platform:billing.read',
  'platform:user.read',
  'platform:audit.read',
  'platform:impersonation.use',
  'platform:monitoring.read'
)
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'finance' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:billing.read',
  'platform:billing.write',
  'platform:tenant.read',
  'platform:user.read',
  'platform:audit.read',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'ops' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenant.read',
  'platform:tenant.write',
  'platform:billing.read',
  'platform:billing.write',
  'platform:ops.manage',
  'platform:monitoring.read',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;

WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'developer' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
  'platform:tenant.read',
  'platform:integrations.manage',
  'platform:dev.manage',
  'platform:monitoring.read',
  'platform:data.export'
)
ON CONFLICT DO NOTHING;
-- 000041_platform_security_events.up.sql

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role_name TEXT,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info', -- info, warning, critical
    method TEXT,
    path TEXT,
    status_code INT,
    ip_address TEXT,
    user_agent TEXT,
    origin TEXT,
    request_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_created_at ON security_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_created_at ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type_created_at ON security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity_created_at ON security_events(severity, created_at DESC);
-- 000042_platform_password_policy_and_history.up.sql

-- Track when a password credential was last updated (used for expiry policy).
ALTER TABLE user_identities
    ADD COLUMN IF NOT EXISTS credential_updated_at TIMESTAMPTZ;

ALTER TABLE user_identities
    ALTER COLUMN credential_updated_at SET DEFAULT NOW();

UPDATE user_identities
SET credential_updated_at = COALESCE(credential_updated_at, created_at, NOW())
WHERE credential_updated_at IS NULL;

-- Password history table to prevent credential reuse (policy-driven).
CREATE TABLE IF NOT EXISTS user_credential_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- "password"
    credential_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, provider, credential_hash)
);

CREATE INDEX IF NOT EXISTS idx_user_credential_history_user_provider_created
    ON user_credential_history(user_id, provider, created_at DESC);

-- Backfill existing password identities into history (idempotent).
INSERT INTO user_credential_history (user_id, provider, credential_hash, created_at)
SELECT
    ui.user_id,
    ui.provider,
    ui.credential,
    COALESCE(ui.credential_updated_at, ui.created_at, NOW())
FROM user_identities ui
WHERE ui.provider = 'password'
  AND ui.credential IS NOT NULL
ON CONFLICT (user_id, provider, credential_hash) DO NOTHING;

-- 000043_platform_security_blocks.up.sql

-- Manual risk-based blocks for tenants and users (platform super admin).
-- Enforcement is handled at request time (middleware) for authenticated requests.

CREATE TABLE IF NOT EXISTS platform_security_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type TEXT NOT NULL, -- tenant, user
    target_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- active, released
    severity TEXT NOT NULL DEFAULT 'warning', -- info, warning, critical
    reason TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    released_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    CHECK (target_type IN ('tenant', 'user')),
    CHECK (status IN ('active', 'released')),
    CHECK (severity IN ('info', 'warning', 'critical')),
    CHECK (target_tenant_id IS NOT NULL OR target_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_platform_security_blocks_active_tenant
    ON platform_security_blocks(target_tenant_id)
    WHERE status = 'active' AND target_tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_security_blocks_active_user
    ON platform_security_blocks(target_user_id)
    WHERE status = 'active' AND target_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_security_blocks_status_created
    ON platform_security_blocks(status, created_at DESC);

-- 000044_legal_docs_and_acceptances.up.sql

-- Platform-managed legal document versions (Terms, Privacy, DPA) and user acceptances.

CREATE TABLE IF NOT EXISTS legal_doc_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_key TEXT NOT NULL, -- terms, privacy, dpa
    title TEXT NOT NULL,
    version TEXT NOT NULL,
    content_url TEXT NOT NULL,
    requires_acceptance BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doc_key, version),
    CHECK (doc_key IN ('terms', 'privacy', 'dpa'))
);

CREATE INDEX IF NOT EXISTS idx_legal_doc_versions_doc_active_published
    ON legal_doc_versions(doc_key, is_active, published_at DESC);

CREATE TABLE IF NOT EXISTS user_legal_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_key TEXT NOT NULL,
    version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (user_id, doc_key, version),
    CHECK (doc_key IN ('terms', 'privacy', 'dpa'))
);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user_doc
    ON user_legal_acceptances(user_id, doc_key, accepted_at DESC);

BEGIN;

-- Incident management for the SaaS platform ops console.
-- This is intentionally platform-scoped (not tenant data) and can be surfaced in a status-page style UI.

CREATE TABLE IF NOT EXISTS platform_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'investigating', -- investigating, identified, monitoring, resolved
    severity TEXT NOT NULL DEFAULT 'minor', -- minor, major, critical
    scope TEXT NOT NULL DEFAULT 'platform', -- platform, tenant
    affected_tenant_ids UUID[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_incidents_status_created ON platform_incidents(status, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_incident_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES platform_incidents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'update', -- update, note, status_change
    message TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_incident_events_incident_created ON platform_incident_events(incident_id, created_at ASC);

COMMIT;

BEGIN;

-- Platform broadcast notifications for incident response and operations.
-- Broadcasts are platform-scoped and can target one or more tenants. Delivery is queued via the outbox.

CREATE TABLE IF NOT EXISTS platform_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES platform_incidents(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    channels TEXT[] NOT NULL DEFAULT '{in_app}',
    tenant_ids UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, failed
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_broadcasts_incident_created ON platform_broadcasts(incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_broadcasts_status_created ON platform_broadcasts(status, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_broadcast_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID NOT NULL REFERENCES platform_broadcasts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    outbox_id UUID REFERENCES outbox(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, completed, failed
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_broadcast_deliveries_broadcast ON platform_broadcast_deliveries(broadcast_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_broadcast_deliveries_tenant_status ON platform_broadcast_deliveries(tenant_id, status);

COMMIT;

BEGIN;

-- Make role editing safe: some code paths expect roles.updated_at.
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Baseline permissions used across the app (tenant scope).
INSERT INTO permissions (code, module, description) VALUES
  ('sis:read', 'sis', 'View student profiles'),
  ('sis:write', 'sis', 'Create/Edit student profiles'),
  ('sis:delete', 'sis', 'Delete student profiles'),
  ('fees:read', 'fees', 'View fee structures and payments'),
  ('fees:collect', 'fees', 'Collect fee payments'),
  ('fees:manage', 'fees', 'Manage fee structures and concessions'),
  ('attendance:read', 'attendance', 'View attendance records'),
  ('attendance:write', 'attendance', 'Mark/Edit attendance'),
  ('finance:read', 'finance', 'View financial reports'),
  ('finance:write', 'finance', 'Manage expenses and accounting'),
  ('tenant:manage', 'tenant', 'Manage tenant settings and users')
ON CONFLICT (code) DO NOTHING;

-- Global role templates (tenant_id IS NULL). These should exist even in "no-seed" environments.
INSERT INTO roles (tenant_id, name, code, description, is_system, created_at, updated_at)
SELECT NULL, v.name, v.code, v.description, TRUE, NOW(), NOW()
FROM (
  VALUES
    ('Tenant Admin', 'tenant_admin', 'School owner/administrator'),
    ('Teacher', 'teacher', 'Academic staff'),
    ('Accountant', 'accountant', 'Finance and fee collector'),
    ('Parent', 'parent', 'Guardian view'),
    ('Student', 'student', 'Student view')
) AS v(name, code, description)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.tenant_id IS NULL AND r.code = v.code
);

-- Template role permissions (idempotent).
WITH role_ref AS (
  SELECT DISTINCT ON (code) id, code
  FROM roles
  WHERE tenant_id IS NULL
    AND code IN ('tenant_admin','teacher','accountant','parent','student')
  ORDER BY code, created_at ASC
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT rr.id, p.id
FROM role_ref rr
JOIN permissions p ON (
  (rr.code = 'tenant_admin' AND p.code IN ('sis:read','sis:write','sis:delete','fees:read','fees:collect','fees:manage','attendance:read','attendance:write','finance:read','finance:write','tenant:manage'))
  OR (rr.code = 'teacher' AND p.code IN ('sis:read','sis:write','attendance:read','attendance:write','fees:read'))
  OR (rr.code = 'accountant' AND p.code IN ('fees:read','fees:collect','fees:manage','finance:read','finance:write','sis:read'))
  OR (rr.code = 'parent' AND p.code IN ('attendance:read','fees:read','sis:read'))
  OR (rr.code = 'student' AND p.code IN ('attendance:read','fees:read','sis:read'))
)
ON CONFLICT DO NOTHING;

-- Create per-tenant default roles (editable, is_system = FALSE) by cloning templates.
WITH tmpl AS (
  SELECT DISTINCT ON (code) id AS template_role_id, code, name, description
  FROM roles
  WHERE tenant_id IS NULL
    AND code IN ('tenant_admin','teacher','accountant','parent','student')
  ORDER BY code, created_at ASC
),
target_tenants AS (
  SELECT t.id AS tenant_id
  FROM tenants t
  WHERE NOT (t.config ? 'is_system' AND t.config->>'is_system' = 'true')
),
inserted AS (
  INSERT INTO roles (tenant_id, name, code, description, is_system, created_at, updated_at)
  SELECT tt.tenant_id, tmpl.name, tmpl.code, tmpl.description, FALSE, NOW(), NOW()
  FROM target_tenants tt
  JOIN tmpl ON TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.tenant_id = tt.tenant_id AND r.code = tmpl.code
  )
  RETURNING tenant_id, id, code
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT tr.id, rp.permission_id
FROM roles tr
JOIN target_tenants tt ON tt.tenant_id = tr.tenant_id
JOIN tmpl ON tmpl.code = tr.code
JOIN role_permissions rp ON rp.role_id = tmpl.template_role_id
WHERE tr.code IN ('tenant_admin','teacher','accountant','parent','student')
ON CONFLICT DO NOTHING;

-- If any users were assigned to template roles, migrate those assignments to the tenant-scoped default roles.
UPDATE role_assignments ra
SET role_id = tr.id
FROM roles tmpl
JOIN roles tr
  ON tr.tenant_id = ra.tenant_id
 AND tr.code = tmpl.code
WHERE ra.role_id = tmpl.id
  AND tmpl.tenant_id IS NULL
  AND tmpl.code IN ('tenant_admin','teacher','accountant','parent','student')
  AND tr.is_system = FALSE;

COMMIT;

BEGIN;

DROP TABLE IF EXISTS platform_notification_templates CASCADE;
DROP TABLE IF EXISTS platform_document_templates CASCADE;
DROP TABLE IF EXISTS platform_announcements CASCADE;
DROP TABLE IF EXISTS platform_changelogs CASCADE;
DROP TABLE IF EXISTS platform_analytics_snapshots CASCADE;
DROP TABLE IF EXISTS platform_master_data_templates CASCADE;

-- PS-003: Notification template manager
CREATE TABLE IF NOT EXISTS platform_notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- email, sms, whatsapp
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PS-006: Document templates
CREATE TABLE IF NOT EXISTS platform_document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'generic', -- report_card, certificate, receipt
    file_url TEXT,
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    template_html TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CM-002: In-app announcement banner
CREATE TABLE IF NOT EXISTS platform_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_cohorts TEXT[] NOT NULL DEFAULT '{}',
    target_tenants UUID[] NOT NULL DEFAULT '{}',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CM-004: Changelog publishing
CREATE TABLE IF NOT EXISTS platform_changelogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- markdown
    type TEXT NOT NULL DEFAULT 'feature', -- feature, improvement, fix, security
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AN-001: Analytics Aggregates
CREATE TABLE IF NOT EXISTS platform_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_analytics_metric_date ON platform_analytics_snapshots(metric_name, snapshot_date);

-- Global master data templates (PS-005)
CREATE TABLE IF NOT EXISTS platform_master_data_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    type TEXT NOT NULL, -- holidays, grade_system, subjects
    name TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add permissions for new modules
INSERT INTO permissions (code, module, description) VALUES
  ('platform:settings.write', 'platform', 'Update global platform settings and templates'),
  ('platform:marketing.write', 'platform', 'Manage announcements, changelogs, and checklists'),
  ('platform:analytics.read', 'platform', 'View business analytics and metrics snapshots')
ON CONFLICT (code) DO NOTHING;

-- Grant to Super Admin
WITH role_ref AS (
    SELECT id FROM roles WHERE tenant_id IS NULL AND code = 'super_admin' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_ref.id, p.id
FROM role_ref
JOIN permissions p ON p.code IN (
    'platform:settings.write',
    'platform:marketing.write',
    'platform:analytics.read'
)
ON CONFLICT DO NOTHING;

COMMIT;
BEGIN;

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure core admin roles exist in global templates.
INSERT INTO roles (tenant_id, name, code, description, is_system, created_at, updated_at)
SELECT NULL, v.name, v.code, v.description, TRUE, NOW(), NOW()
FROM (
  VALUES
    ('Super Admin', 'super_admin', 'Platform wide access'),
    ('Tenant Admin', 'tenant_admin', 'School owner/administrator')
) AS v(name, code, description)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.tenant_id IS NULL AND r.code = v.code
);

UPDATE roles
SET
  name = CASE code
    WHEN 'super_admin' THEN 'Super Admin'
    WHEN 'tenant_admin' THEN 'Tenant Admin'
    ELSE name
  END,
  description = CASE code
    WHEN 'super_admin' THEN 'Platform wide access'
    WHEN 'tenant_admin' THEN 'School owner/administrator'
    ELSE description
  END,
  updated_at = NOW()
WHERE tenant_id IS NULL
  AND code IN ('super_admin', 'tenant_admin');

-- Tenant admins should have all tenant/application permissions (everything except platform:*).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code NOT LIKE 'platform:%'
WHERE r.code = 'tenant_admin'
ON CONFLICT DO NOTHING;

-- Super admins should have every permission, including platform:*.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

COMMIT;
-- 000050_phase1_enhancements.up.sql
-- Phase 1: Custom fields, house system, staff attendance, period-wise attendance, school profile

-- ============================================================
-- 1. Custom Field Definitions & Values
-- ============================================================

CREATE TABLE custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'student', 'employee', 'guardian'
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text', 'number', 'date', 'select', 'multiselect', 'boolean', 'textarea'
    options JSONB DEFAULT '[]', -- For select/multiselect: ["Option1", "Option2"]
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, entity_type, field_name)
);

CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL, -- student_id, employee_id, etc.
    value JSONB NOT NULL DEFAULT '""', -- Stores any type: "text", 123, true, ["a","b"]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(definition_id, entity_id)
);

CREATE INDEX idx_custom_field_defs_tenant ON custom_field_definitions(tenant_id, entity_type);
CREATE INDEX idx_custom_field_vals_entity ON custom_field_values(entity_id);
CREATE INDEX idx_custom_field_vals_def ON custom_field_values(definition_id);

-- ============================================================
-- 2. House System
-- ============================================================

CREATE TABLE student_houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50), -- hex or color name
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Add house_id to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS house_id UUID REFERENCES student_houses(id);
CREATE INDEX idx_students_house ON students(house_id);

-- ============================================================
-- 3. Staff Attendance
-- ============================================================

CREATE TABLE staff_attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, date)
);

CREATE TABLE staff_attendance_entries (
    session_id UUID NOT NULL REFERENCES staff_attendance_sessions(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'late', 'half_day', 'on_leave'
    check_in_time TIME,
    check_out_time TIME,
    remarks TEXT,
    PRIMARY KEY(session_id, employee_id)
);

CREATE INDEX idx_staff_attendance_sessions_tenant ON staff_attendance_sessions(tenant_id, date);

-- ============================================================
-- 4. Period-wise Attendance
-- ============================================================

CREATE TABLE period_attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    class_section_id UUID NOT NULL REFERENCES sections(id),
    date DATE NOT NULL,
    period_number INT NOT NULL, -- 1, 2, 3...
    subject_id UUID REFERENCES subjects(id),
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_section_id, date, period_number)
);

CREATE TABLE period_attendance_entries (
    session_id UUID NOT NULL REFERENCES period_attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'late'
    remarks TEXT,
    PRIMARY KEY(session_id, student_id)
);

CREATE INDEX idx_period_attendance_tenant ON period_attendance_sessions(tenant_id, date);

-- ============================================================
-- 5. School Profile Settings (extends tenant_config)
-- ============================================================

CREATE TABLE school_profiles (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    school_name VARCHAR(500),
    logo_url TEXT,
    address TEXT,
    city VARCHAR(200),
    state VARCHAR(200),
    pincode VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(200),
    website VARCHAR(500),
    affiliation_board VARCHAR(100), -- 'CBSE', 'ICSE', 'State Board'
    affiliation_number VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    academic_year_format VARCHAR(50) DEFAULT 'YYYY-YYYY', -- '2025-2026'
    grading_system VARCHAR(50) DEFAULT 'percentage', -- 'percentage', 'grade', 'cgpa'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. Bulk Import Job Tracking
-- ============================================================

CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'students', 'users', 'employees'
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    total_rows INT DEFAULT 0,
    success_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    errors JSONB DEFAULT '[]',
    file_name VARCHAR(500),
    uploaded_by UUID REFERENCES users(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_tenant ON import_jobs(tenant_id);
-- 000051_phase2_features.up.sql

-- School Calendar & Events
CREATE TABLE IF NOT EXISTS school_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'activity', -- holiday, meeting, activity, exam, ptm
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    location VARCHAR(255),
    target_audience JSONB DEFAULT '[]', -- ['student', 'teacher', 'parent']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES school_events(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL, -- push, sms, email
    remind_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ID Card Templates
CREATE TABLE IF NOT EXISTS id_card_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- student, employee
    layout VARCHAR(20) DEFAULT 'portrait', -- portrait, landscape
    bg_image_url TEXT,
    config JSONB DEFAULT '{}', -- colors, font sizes, etc.
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Resources (LMS-lite)
CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES academic_subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(20) NOT NULL, -- video_link, file, document_link
    url TEXT NOT NULL,
    uploaded_by UUID NOT NULL, -- employee_id
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hostel Module
CREATE TABLE IF NOT EXISTS hostel_buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'unisex', -- boys, girls, unisex
    address TEXT,
    warden_id UUID, -- References employee_id
    total_rooms INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hostel_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES hostel_buildings(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    room_type VARCHAR(50), -- single, double, triple, bunk
    capacity INT NOT NULL,
    occupancy INT DEFAULT 0,
    cost_per_month NUMERIC(12, 2) DEFAULT 0,
    amenities JSONB DEFAULT '[]', -- ['ac', 'wifi', 'attached_bath']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hostel_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES hostel_rooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    allotted_on DATE DEFAULT CURRENT_DATE,
    vacated_on DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, vacated, suspended
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_school_events_date ON school_events(start_time, end_time);
CREATE INDEX idx_learning_resources_lookup ON learning_resources(class_id, subject_id);
CREATE INDEX idx_hostel_allocations_active ON hostel_allocations(student_id) WHERE status = 'active';
-- 000052_finance_enhancements.up.sql

-- Late Fee Rules
CREATE TABLE IF NOT EXISTS fee_late_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fee_head_id UUID REFERENCES fee_heads(id) ON DELETE CASCADE, -- Optional: Specific head or all
    rule_type VARCHAR(20) NOT NULL, -- 'fixed', 'daily'
    amount NUMERIC(12, 2) NOT NULL,
    grace_days INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, fee_head_id)
);

-- Concession/Discount Rules
CREATE TABLE IF NOT EXISTS fee_concession_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    value NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'sibling', 'employee', 'scholarship', 'special'
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Concessions (Applied)
CREATE TABLE IF NOT EXISTS student_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES fee_concession_rules(id) ON DELETE CASCADE,
    approved_by UUID, -- employee_id
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, rule_id)
);

-- Indices
CREATE INDEX idx_fee_late_rules_tenant ON fee_late_rules(tenant_id);
CREATE INDEX idx_fee_concession_rules_tenant ON fee_concession_rules(tenant_id);
-- 000053_advanced_scheduling.up.sql

-- Timetable variants (Regular, Summer, Winter, etc.)
CREATE TABLE timetable_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timetable periods / slots (Period 1, Break, Period 2, etc.)
CREATE TABLE timetable_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES timetable_variants(id) ON DELETE CASCADE,
    period_name TEXT NOT NULL, -- e.g. "1st Period", "Lunch Break"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relational timetable entries
CREATE TABLE timetable_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES timetable_variants(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES timetable_periods(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    class_section_id UUID NOT NULL REFERENCES class_sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id),
    room_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher absences (for substitution management)
CREATE TABLE teacher_absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id),
    absence_date DATE NOT NULL,
    reason TEXT,
    is_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily substitutions
CREATE TABLE teacher_substitutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    substitution_date DATE NOT NULL,
    timetable_entry_id UUID NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
    substitute_teacher_id UUID NOT NULL REFERENCES users(id),
    remarks TEXT,
    status TEXT DEFAULT 'assigned', -- 'assigned', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and conflict detection
CREATE INDEX idx_tt_entries_lookup ON timetable_entries(tenant_id, variant_id, day_of_week);
CREATE INDEX idx_tt_entries_teacher ON timetable_entries(teacher_id, day_of_week);
CREATE INDEX idx_tt_entries_section ON timetable_entries(class_section_id, day_of_week);
CREATE INDEX idx_tt_subst_date ON teacher_substitutions(substitution_date, tenant_id);
CREATE INDEX idx_tt_abs_date ON teacher_absences(absence_date, teacher_id);

-- Enforce no double-booking of rooms, teachers or classes within a variant
-- teacher/day/period uniqueness
ALTER TABLE timetable_entries ADD CONSTRAINT tt_teacher_busy UNIQUE (variant_id, day_of_week, period_id, teacher_id);
-- class/day/period uniqueness
ALTER TABLE timetable_entries ADD CONSTRAINT tt_class_busy UNIQUE (variant_id, day_of_week, period_id, class_section_id);
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
-- 000056_teacher_assignments.up.sql

-- 1. Teacher Specializations (What they can teach)
CREATE TABLE teacher_subject_specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, subject_id)
);

CREATE TABLE teacher_class_specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, class_id)
);

-- 2. Class Teacher Assignments (The 'Year' or 'Session' owner of a class)
CREATE TABLE class_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    remarks TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partial unique index for active assignments
CREATE UNIQUE INDEX idx_class_teacher_active_unique ON class_teacher_assignments (academic_year_id, class_section_id) WHERE is_active = true;

-- 3. Indexes for retrieval
CREATE INDEX idx_teacher_sub_spec ON teacher_subject_specializations(teacher_id, tenant_id);
CREATE INDEX idx_teacher_class_spec ON teacher_class_specializations(teacher_id, tenant_id);
CREATE INDEX idx_class_teacher_curr ON class_teacher_assignments(class_section_id, academic_year_id) WHERE is_active = true;
-- 000057_exam_security_promotion.up.sql

-- 1. Secure Question Papers Repository
CREATE TABLE exam_question_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    set_name TEXT NOT NULL DEFAULT 'Set A', -- Set A, Set B, etc.
    file_path TEXT NOT NULL, -- S3/Storage path
    is_encrypted BOOLEAN DEFAULT true,
    unlock_at TIMESTAMP WITH TIME ZONE, -- Lock paper until exam date/time
    is_previous_year BOOLEAN DEFAULT false,
    academic_year_id UUID REFERENCES academic_years(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Security Access Logs (Audit for sensitive papers)
CREATE TABLE paper_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES exam_question_papers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- 3. Promotion Logic & Rules
CREATE TABLE promotion_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    min_aggregate_percent DECIMAL(5, 2) DEFAULT 33.00,
    min_subject_percent DECIMAL(5, 2) DEFAULT 33.00,
    required_attendance_percent DECIMAL(5, 2) DEFAULT 75.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Student Promotion History
CREATE TABLE student_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    to_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    from_section_id UUID REFERENCES sections(id),
    to_section_id UUID REFERENCES sections(id),
    promoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    promoted_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'promoted', -- promoted, detained, tc_issued
    remarks TEXT
);

-- Indexes
CREATE INDEX idx_exam_papers_lookup ON exam_question_papers(tenant_id, exam_id, subject_id);
CREATE INDEX idx_paper_access_audit ON paper_access_logs(paper_id, accessed_at);
CREATE INDEX idx_promotion_history ON student_promotions(student_id, to_academic_year_id);

-- 000058_question_bank.up.sql

-- 1. Question Bank
CREATE TABLE exam_question_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'descriptive', 'short_answer')) DEFAULT 'mcq',
    question_text TEXT NOT NULL,
    options JSONB, -- For MCQs: {"A": "Choice 1", "B": "Choice 2", ...}
    correct_answer TEXT,
    marks DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Linking Bank Questions to Specific Paper Sets
CREATE TABLE exam_paper_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES exam_question_papers(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_question_bank(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(paper_id, question_id)
);

-- 3. Indexes
CREATE INDEX idx_qbank_subject ON exam_question_bank(tenant_id, subject_id, topic);
CREATE INDEX idx_paper_questions ON exam_paper_questions(paper_id, sort_order);

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

-- 000060_advanced_fees_gateways.up.sql

-- 1. Yearly Fee Setup by Class (Dynamic Configuration)
CREATE TABLE fee_class_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    fee_head_id UUID NOT NULL REFERENCES fee_heads(id),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, academic_year_id, class_id, fee_head_id)
);

-- 2. Scholarships & Discounts
CREATE TABLE fee_discounts_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Merit Scholarship", "Staff Child Discount"
    type TEXT NOT NULL CHECK (type IN ('percentage', 'flat_amount')),
    value DECIMAL(12, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    scholarship_id UUID NOT NULL REFERENCES fee_discounts_scholarships(id),
    academic_year_id UUID REFERENCES academic_years(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, student_id, scholarship_id, academic_year_id)
);

-- 3. Payment Gateway Configuration (Multi-Tenant)
CREATE TABLE payment_gateway_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('razorpay', 'stripe', 'payu')),
    api_key TEXT, -- Encrypted or securely stored
    api_secret TEXT, -- Encrypted
    webhook_secret TEXT,
    is_active BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}', -- Provider specific settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

-- 4. Auto-Debit Mandates (eNACH / Subscriptions)
CREATE TABLE auto_debit_mandates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- razorpay_subscription, stripe_subscription
    mandate_ref TEXT NOT NULL, -- External ID
    max_amount DECIMAL(12, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Optional Fee Items (Add-ons)
CREATE TABLE optional_fee_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Transport: Zone A, Uniform Set
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT, -- Transport, Books, Uniform, Activity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);


CREATE TABLE student_optional_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES optional_fee_items(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    status TEXT NOT NULL DEFAULT 'selected', -- selected, paid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, student_id, item_id, academic_year_id)
);

-- 6. Receipt Items (Breakdown)
CREATE TABLE receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES fee_heads(id),
    amount BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_receipt_items_receipt ON receipt_items(receipt_id);

-- Indexes
CREATE INDEX idx_fee_class_config ON fee_class_configurations(academic_year_id, class_id);
CREATE INDEX idx_student_scholarships_lookup ON student_scholarships(student_id, academic_year_id);
CREATE INDEX idx_gateway_config ON payment_gateway_configs(tenant_id, is_active);
-- 000061_ops_enhancements.up.sql

-- 1. Staff Task Master
CREATE TABLE staff_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transport Fuel Tracking
CREATE TABLE transport_fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES transport_vehicles(id) ON DELETE CASCADE,
    fill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity DECIMAL(10, 2) NOT NULL, -- Liters/Gallons
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    odometer_reading INTEGER,
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inventory Requisitions (Internal Requests)
CREATE TABLE inventory_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department TEXT,
    purpose TEXT,
    items JSONB NOT NULL, -- Array of {item_id, quantity, unit}
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'issued', 'rejected')),
    approved_by UUID REFERENCES users(id),
    issued_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_tasks_assigned ON staff_tasks(assigned_to, status);
CREATE INDEX idx_staff_tasks_tenant ON staff_tasks(tenant_id);
CREATE INDEX idx_fuel_logs_vehicle ON transport_fuel_logs(vehicle_id, fill_date);
CREATE INDEX idx_inv_req_status ON inventory_requisitions(tenant_id, status);

-- 000063_p0_feature_completion.up.sql

-- 1. Notice Enhancements
-- (Actually updated in place above)
CREATE INDEX idx_notices_publish_at ON notices(tenant_id, publish_at);

-- 2. Outbox Scheduling Support
-- (Actually updated in place above)
CREATE INDEX idx_outbox_process_after ON outbox(status, process_after);

-- 3. Fee Reminder Configuration
CREATE TABLE fee_reminder_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    days_offset INTEGER NOT NULL, -- e.g., 7
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'after_due', 'on_due')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, days_offset, reminder_type)
);

-- 4. Track which students were already reminded for a specific fee and offset
CREATE TABLE fee_reminder_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES fee_heads(id) ON DELETE CASCADE,
    reminder_config_id UUID NOT NULL REFERENCES fee_reminder_configs(id) ON DELETE CASCADE,
    reminded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, fee_head_id, reminder_config_id)
);

-- 000064_p1_features.up.sql

CREATE TABLE IF NOT EXISTS hall_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL,
    hall_number TEXT,
    seat_number TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id),
    UNIQUE(exam_id, roll_number)
);

CREATE INDEX idx_hall_tickets_exam ON hall_tickets(exam_id);
CREATE INDEX idx_hall_tickets_student ON hall_tickets(student_id);
-- Student Confidential Notes
CREATE TABLE IF NOT EXISTS student_confidential_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    encrypted_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conf_notes_student ON student_confidential_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_conf_notes_tenant ON student_confidential_notes(tenant_id);
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

-- Pickup Verification Codes (QR/OTP)
CREATE TABLE IF NOT EXISTS pickup_verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    auth_id UUID REFERENCES pickup_authorizations(id) ON DELETE CASCADE,
    code_type TEXT NOT NULL, -- 'qr', 'otp'
    code_value TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pickup_codes_student ON pickup_verification_codes(student_id, is_used);
CREATE INDEX idx_pickup_codes_value ON pickup_verification_codes(code_value) WHERE is_used = FALSE;


-- Holidays for Lesson Planning
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type TEXT NOT NULL DEFAULT 'public', -- 'public', 'local', 'restricted'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, holiday_date)
);

-- Library Reading Progress Journal
CREATE TABLE IF NOT EXISTS library_reading_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'reading', -- 'reading', 'completed', 'wishlist'
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, book_id)
);

-- 000071_automation_studio.up.sql
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    condition_json JSONB DEFAULT '{}'::jsonb,
    action_json JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_automation_rules_tenant_trigger ON automation_rules(tenant_id, trigger_event) WHERE is_active = true;

ALTER TABLE library_reading_logs ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- 000072_multilingual_alerts.up.sql
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add seed templates for Hindi (hi)
-- Note: These are usually seeded via a separate script or migration, 
-- but we include them here for completeness in schema.sql if it's used for fresh setups.
INSERT INTO notification_templates (code, channel, locale, subject, body)
VALUES 
('attendance.absent', 'sms', 'hi', 'अनुपस्थिति सूचना', 'नमस्ते, आपका बच्चा आज अनुपस्थित है।'),
('fee.reminder', 'sms', 'hi', 'शुल्क अनुस्मारक', 'नमस्ते, आपके बच्चे का स्कूल शुल्क देय है। कृपया भुगतान करें।')
ON CONFLICT DO NOTHING;

-- Add metadata column to exam_subjects
ALTER TABLE exam_subjects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Batch 6: AI & Library Enhancements
CREATE TABLE ai_query_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(12, 6) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE library_reading_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE, -- assuming asset_id maps to books for now
    pages_read INTEGER NOT NULL,
    total_pages INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_tenant ON ai_query_logs(tenant_id);
CREATE INDEX idx_reading_progress_student ON library_reading_progress(student_id);

-- Update automation_rules for scheduling
ALTER TABLE automation_rules ADD COLUMN trigger_type TEXT NOT NULL DEFAULT 'event' CHECK (trigger_type IN ('event', 'time'));
ALTER TABLE automation_rules ADD COLUMN schedule_cron TEXT; -- optional cron expression

-- AI Chat Sessions for multi-turn conversations
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    external_id TEXT NOT NULL, -- WhatsApp number, etc.
    messages JSONB NOT NULL DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ai_sessions_external ON ai_chat_sessions(tenant_id, external_id);
