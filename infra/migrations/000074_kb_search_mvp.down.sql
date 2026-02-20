-- 000074_kb_search_mvp.down.sql

BEGIN;

DROP INDEX IF EXISTS kb_chunks_tenant_doc;
DROP INDEX IF EXISTS kb_documents_tenant_status_visibility;
DROP INDEX IF EXISTS kb_chunks_content_trgm_gin;
DROP INDEX IF EXISTS kb_chunks_tsv_gin;

DROP TABLE IF EXISTS tenant_kb_settings;
DROP TABLE IF EXISTS kb_chunks;
DROP TABLE IF EXISTS kb_documents;

COMMIT;
