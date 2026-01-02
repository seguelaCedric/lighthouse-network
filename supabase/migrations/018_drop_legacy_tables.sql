-- ============================================================================
-- DROP LEGACY VINCERE VECTOR TABLES
-- Migration: 018_drop_legacy_tables.sql
-- Description: Remove legacy chunked embedding tables superseded by
--              whole-document embedding strategy
-- ============================================================================
-- WARNING: This is a destructive migration. Ensure backups exist.
-- ============================================================================

-- Drop legacy chunked candidate tables (from external n8n/CloudConvert workflows)
-- These tables used halfvec type with chunked embeddings per document section
-- They are superseded by the whole-document embedding on the candidates table
DROP TABLE IF EXISTS lighthouse_candidates CASCADE;
DROP TABLE IF EXISTS lighthouse_candidates_cv CASCADE;
DROP TABLE IF EXISTS lighthouse_candidates_certificates CASCADE;
DROP TABLE IF EXISTS lighthouse_candidates_references CASCADE;

-- Drop unused generic vector store (never populated)
DROP TABLE IF EXISTS vector_documents CASCADE;

-- Drop legacy file processing tracker (superseded by documents table workflow)
DROP TABLE IF EXISTS file_processing_status CASCADE;

-- Note: n8n_chat_histories tables are preserved for debugging old workflows
-- If no longer needed, run manually:
-- DROP TABLE IF EXISTS n8n_chat_histories CASCADE;
-- DROP TABLE IF EXISTS n8n_chat_histories_lighthouse CASCADE;
