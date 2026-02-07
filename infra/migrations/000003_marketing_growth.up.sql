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
