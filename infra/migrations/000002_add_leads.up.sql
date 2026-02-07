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
