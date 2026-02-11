-- Migration: 000034_ai_knowledge_base
-- Description: Create knowledge base table for per-tenant AI grounding

BEGIN;

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'markdown', 'faq'
    metadata JSONB DEFAULT '{}', -- For storing source refs, tags, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search weighting/category if needed later
    category TEXT
);

-- Index for tenant-based retrieval
CREATE INDEX IF NOT EXISTS idx_ai_kb_tenant_id ON ai_knowledge_base(tenant_id);

-- Optional: Full text search index on content
CREATE INDEX IF NOT EXISTS idx_ai_kb_content_search ON ai_knowledge_base USING GIN (to_tsvector('english', content));

COMMIT;
