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
