-- ============================================================================
-- AI MATCHING FOUNDATION
-- Migration: 014_ai_matching_foundation.sql
-- Description: Adds AI matching infrastructure - embedding text, visibility controls,
--              and unified candidate embedding for 200K scale matching
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- PART 1: CANDIDATE EMBEDDING INFRASTRUCTURE
-- ============================================================================

-- Add embedding text column to candidates (unified text from all documents)
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS embedding_text TEXT,
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS embedding_version INTEGER DEFAULT 1;

-- Add full-text search column for hybrid search
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION candidates_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.primary_position, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.secondary_positions, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.profile_summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.embedding_text, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.search_keywords, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidates_search_vector ON candidates;
CREATE TRIGGER trg_candidates_search_vector
  BEFORE INSERT OR UPDATE OF first_name, last_name, primary_position, secondary_positions,
                             profile_summary, embedding_text, search_keywords
  ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION candidates_search_vector_update();

-- ============================================================================
-- PART 2: DOCUMENT VISIBILITY FOR PERMISSION-SCOPED OUTPUT
-- ============================================================================

-- Add visibility column to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'recruiter'
    CHECK (visibility IN ('public', 'client', 'recruiter'));

-- Add vincere_id for sync tracking
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS vincere_id TEXT;

-- Create unique index for vincere document sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_vincere_id
  ON documents(vincere_id)
  WHERE vincere_id IS NOT NULL;

-- Index for visibility-filtered queries
CREATE INDEX IF NOT EXISTS idx_documents_visibility
  ON documents(entity_type, entity_id, visibility)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 3: INTERVIEW NOTES TABLE (for verbal references & recruiter notes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS candidate_interview_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Note metadata
  note_type TEXT NOT NULL CHECK (note_type IN (
    'interview',           -- Recruiter interview notes
    'verbal_reference',    -- Transcribed verbal reference
    'phone_screen',        -- Phone screening notes
    'client_feedback',     -- Client feedback after interview
    'general'              -- General recruiter notes
  )),

  -- Content
  title TEXT,
  content TEXT NOT NULL,           -- The actual note text
  summary TEXT,                    -- AI-generated summary

  -- Source information
  source_call_id TEXT,             -- Vapi/Twilio call ID if from voice
  source_reference_id UUID REFERENCES candidate_references(id),

  -- Visibility controls for permission-scoped output
  visibility TEXT DEFAULT 'recruiter'
    CHECK (visibility IN ('recruiter', 'client', 'public')),

  -- Include in AI matching?
  include_in_embedding BOOLEAN DEFAULT TRUE,

  -- Audit trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_notes_candidate
  ON candidate_interview_notes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_notes_type
  ON candidate_interview_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_interview_notes_embedding
  ON candidate_interview_notes(candidate_id, include_in_embedding)
  WHERE include_in_embedding = TRUE;

-- ============================================================================
-- PART 4: EMBEDDING QUEUE FOR ASYNC PROCESSING
-- ============================================================================

CREATE TABLE IF NOT EXISTS embedding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What needs embedding
  entity_type TEXT NOT NULL CHECK (entity_type IN ('candidate', 'job')),
  entity_id UUID NOT NULL,

  -- Queue management
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,  -- 1 = highest, 10 = lowest
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Processing info
  error_message TEXT,
  processed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique pending entries per entity
  UNIQUE(entity_type, entity_id, status)
);

CREATE INDEX IF NOT EXISTS idx_embedding_queue_pending
  ON embedding_queue(priority, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_embedding_queue_entity
  ON embedding_queue(entity_type, entity_id);

-- ============================================================================
-- PART 5: TRIGGERS TO AUTO-QUEUE EMBEDDING UPDATES
-- ============================================================================

-- Function to queue candidate for re-embedding when relevant data changes
CREATE OR REPLACE FUNCTION queue_candidate_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update queue entry (upsert pattern)
  INSERT INTO embedding_queue (entity_type, entity_id, priority, status)
  VALUES ('candidate', NEW.id, 5, 'pending')
  ON CONFLICT (entity_type, entity_id, status)
  DO UPDATE SET
    updated_at = NOW(),
    priority = LEAST(embedding_queue.priority, EXCLUDED.priority);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on candidate changes that affect embedding
DROP TRIGGER IF EXISTS trg_queue_candidate_embedding ON candidates;
CREATE TRIGGER trg_queue_candidate_embedding
  AFTER INSERT OR UPDATE OF
    first_name, last_name, primary_position, secondary_positions,
    profile_summary, years_experience, nationality, current_location,
    preferred_yacht_types, preferred_regions, highest_license
  ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION queue_candidate_embedding();

-- Function to queue candidate when document is added/updated
CREATE OR REPLACE FUNCTION queue_candidate_embedding_on_document()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entity_type = 'candidate' THEN
    INSERT INTO embedding_queue (entity_type, entity_id, priority, status)
    VALUES ('candidate', NEW.entity_id, 3, 'pending')  -- Higher priority for doc changes
    ON CONFLICT (entity_type, entity_id, status)
    DO UPDATE SET
      updated_at = NOW(),
      priority = LEAST(embedding_queue.priority, 3);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_queue_embedding_on_document ON documents;
CREATE TRIGGER trg_queue_embedding_on_document
  AFTER INSERT OR UPDATE OF extracted_text, type
  ON documents
  FOR EACH ROW
  WHEN (NEW.entity_type = 'candidate')
  EXECUTE FUNCTION queue_candidate_embedding_on_document();

-- Function to queue candidate when interview note is added/updated
CREATE OR REPLACE FUNCTION queue_candidate_embedding_on_note()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.include_in_embedding THEN
    INSERT INTO embedding_queue (entity_type, entity_id, priority, status)
    VALUES ('candidate', NEW.candidate_id, 3, 'pending')
    ON CONFLICT (entity_type, entity_id, status)
    DO UPDATE SET
      updated_at = NOW(),
      priority = LEAST(embedding_queue.priority, 3);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_queue_embedding_on_note ON candidate_interview_notes;
CREATE TRIGGER trg_queue_embedding_on_note
  AFTER INSERT OR UPDATE OF content, include_in_embedding
  ON candidate_interview_notes
  FOR EACH ROW
  EXECUTE FUNCTION queue_candidate_embedding_on_note();

-- ============================================================================
-- PART 6: FULL-TEXT SEARCH INDEX
-- ============================================================================

-- GIN index for full-text search (for hybrid search)
CREATE INDEX IF NOT EXISTS idx_candidates_search_vector
  ON candidates USING GIN(search_vector);

-- ============================================================================
-- PART 7: JOB EMBEDDING INFRASTRUCTURE
-- ============================================================================

-- Add embedding text to jobs for unified embedding generation
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS embedding_text TEXT,
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Job search vector trigger
CREATE OR REPLACE FUNCTION jobs_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.requirements, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.embedding_text, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.vessel_name, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_search_vector ON jobs;
CREATE TRIGGER trg_jobs_search_vector
  BEFORE INSERT OR UPDATE OF title, description, requirements, embedding_text, vessel_name
  ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION jobs_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_jobs_search_vector
  ON jobs USING GIN(search_vector);

-- Trigger to queue job for re-embedding
CREATE OR REPLACE FUNCTION queue_job_embedding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO embedding_queue (entity_type, entity_id, priority, status)
  VALUES ('job', NEW.id, 5, 'pending')
  ON CONFLICT (entity_type, entity_id, status)
  DO UPDATE SET
    updated_at = NOW(),
    priority = LEAST(embedding_queue.priority, EXCLUDED.priority);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_queue_job_embedding ON jobs;
CREATE TRIGGER trg_queue_job_embedding
  AFTER INSERT OR UPDATE OF
    title, description, requirements, vessel_name, vessel_type,
    vessel_size_meters, primary_region, salary_min, salary_max
  ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION queue_job_embedding();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN candidates.embedding_text IS
  'Unified text combining CV, certificates, references, and interview notes for embedding generation';
COMMENT ON COLUMN candidates.embedding_updated_at IS
  'Timestamp when embedding was last regenerated';
COMMENT ON COLUMN candidates.embedding_version IS
  'Version of embedding algorithm used, allows invalidating old embeddings';
COMMENT ON COLUMN candidates.search_vector IS
  'Full-text search vector for hybrid search (vector + keyword)';

COMMENT ON COLUMN documents.visibility IS
  'Who can see this document: public (job boards), client (self-serve portal), recruiter (agency only)';

COMMENT ON TABLE candidate_interview_notes IS
  'Recruiter notes, verbal reference transcripts, and interview feedback for AI matching';
COMMENT ON COLUMN candidate_interview_notes.include_in_embedding IS
  'Whether this note should be included in candidate embedding for AI matching';

COMMENT ON TABLE embedding_queue IS
  'Queue for async embedding generation. Triggers auto-queue candidates/jobs when data changes.';
