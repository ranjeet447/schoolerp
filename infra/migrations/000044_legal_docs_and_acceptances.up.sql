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

