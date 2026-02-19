-- 000069_pickup_events.up.sql

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
