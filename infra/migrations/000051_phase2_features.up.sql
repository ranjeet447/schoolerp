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
