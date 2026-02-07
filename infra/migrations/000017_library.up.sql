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
