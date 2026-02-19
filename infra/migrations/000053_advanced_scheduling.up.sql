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
