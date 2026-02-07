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
