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
