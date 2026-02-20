-- 000074_kb_search_mvp.up.sql
-- Tenant-wise Knowledgebase Search MVP (search-only, AI-ready boundary)

BEGIN;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'pg_trgm extension is not available in this environment';
END $$;

CREATE TABLE IF NOT EXISTS kb_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    visibility TEXT NOT NULL CHECK (visibility IN ('internal', 'parents', 'students')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    content_text TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    tsv tsvector,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS tenant_kb_settings (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_roles TEXT[] NOT NULL DEFAULT '{tenant_admin,teacher}',
    allow_parents BOOLEAN NOT NULL DEFAULT FALSE,
    allow_students BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kb_chunks_tsv_gin
    ON kb_chunks USING GIN (tsv);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        CREATE INDEX IF NOT EXISTS kb_chunks_content_trgm_gin
            ON kb_chunks USING GIN (content gin_trgm_ops);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS kb_documents_tenant_status_visibility
    ON kb_documents (tenant_id, status, visibility, deleted_at);

CREATE INDEX IF NOT EXISTS kb_chunks_tenant_doc
    ON kb_chunks (tenant_id, document_id);

COMMIT;
