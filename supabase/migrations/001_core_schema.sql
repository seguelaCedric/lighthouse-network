-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Core Database Schema
-- ============================================================================
-- A multi-tenant platform for yacht/villa crew recruitment
-- Supports: Agencies, Clients (boats), Candidates, Jobs, Submissions
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- ENUMS (wrapped in DO blocks for idempotency)
-- ============================================================================

-- Organization types
DO $$ BEGIN
  CREATE TYPE org_type AS ENUM (
    'agency',           -- Recruitment agency (Lighthouse + partners)
    'management_co',    -- Yacht management company
    'private_owner',    -- Private yacht/villa owner
    'charter_co'        -- Charter company
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User roles within an organization
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'owner',            -- Full access, billing
    'admin',            -- Full access, no billing
    'recruiter',        -- Can manage jobs, candidates, submissions
    'viewer'            -- Read-only access
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Candidate verification tiers
DO $$ BEGIN
  CREATE TYPE verification_tier AS ENUM (
    'basic',            -- Self-registered, unverified
    'identity',         -- ID verified
    'verified',         -- ID + certs + basic reference check
    'premium'           -- Full vetting: interview, deep references, background
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Candidate availability status
DO $$ BEGIN
  CREATE TYPE availability_status AS ENUM (
    'available',        -- Actively looking, can start soon
    'looking',          -- Open to opportunities, not urgent
    'employed',         -- Currently on contract, future date available
    'unavailable'       -- Not looking
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Job visibility
DO $$ BEGIN
  CREATE TYPE job_visibility AS ENUM (
    'private',          -- Only the posting agency sees it
    'network',          -- All network agencies can submit
    'public'            -- Visible on public job board
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Job status
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM (
    'draft',            -- Not yet published
    'open',             -- Accepting submissions
    'shortlisting',     -- No new submissions, reviewing
    'interviewing',     -- Interviews in progress
    'offer',            -- Offer extended
    'filled',           -- Position filled
    'cancelled',        -- Job cancelled
    'on_hold'           -- Temporarily paused
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Submission status
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM (
    'pending',          -- Submitted, awaiting review
    'shortlisted',      -- Client wants to see more
    'interviewing',     -- Interview scheduled/completed
    'offer',            -- Offer extended to this candidate
    'placed',           -- Successfully placed
    'rejected',         -- Not proceeding
    'withdrawn'         -- Candidate withdrew
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Contract types
DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM (
    'permanent',
    'rotational',
    'seasonal',
    'temporary',
    'freelance'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Position categories
DO $$ BEGIN
  CREATE TYPE position_category AS ENUM (
    'deck',
    'interior',
    'engineering',
    'galley',
    'medical',
    'childcare',
    'security',
    'management',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Communication channels
DO $$ BEGIN
  CREATE TYPE comm_channel AS ENUM (
    'email',
    'whatsapp',
    'sms',
    'phone',
    'platform',
    'in_person'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS
-- Multi-tenant: agencies, clients (boats/management cos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  type org_type NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,  -- For URLs: lighthouse-careers

  -- Contact
  email TEXT,
  phone TEXT,
  website TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,

  -- For agencies
  agency_license TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,  -- Default commission %

  -- For clients (boats)
  vessel_name TEXT,
  vessel_type TEXT,  -- Motor, Sailing
  vessel_size_meters INTEGER,
  vessel_flag TEXT,
  vessel_year INTEGER,
  imo_number TEXT,

  -- For management companies
  fleet_size INTEGER,

  -- Subscription/billing
  subscription_tier TEXT DEFAULT 'free',  -- free, basic, pro, enterprise
  subscription_status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,

  -- Platform settings
  settings JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- ----------------------------------------------------------------------------
-- USERS
-- Platform users (recruiters, client admins, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Auth (links to Supabase auth.users)
  auth_id UUID UNIQUE,  -- References auth.users.id

  -- Organization membership
  organization_id UUID REFERENCES organizations(id),
  role user_role DEFAULT 'viewer',

  -- Profile
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,

  -- Preferences
  preferences JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_id);

-- ----------------------------------------------------------------------------
-- CANDIDATES
-- Crew members looking for positions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- May have a user account (for self-service)
  user_id UUID REFERENCES users(id),

  -- Basic info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,

  -- Demographics
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  second_nationality TEXT,

  -- Location
  current_location TEXT,
  current_country TEXT,

  -- Professional
  primary_position TEXT,  -- Main role: Chief Stewardess
  secondary_positions TEXT[],  -- Other roles they can do
  position_category position_category,
  years_experience INTEGER,

  -- Yacht preferences
  preferred_yacht_types TEXT[],  -- Motor, Sailing
  preferred_yacht_size_min INTEGER,
  preferred_yacht_size_max INTEGER,
  preferred_contract_types contract_type[],
  preferred_regions TEXT[],  -- Mediterranean, Caribbean, etc.

  -- Availability
  availability_status availability_status DEFAULT 'looking',
  available_from DATE,
  current_contract_end DATE,

  -- Compensation
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  salary_currency TEXT DEFAULT 'EUR',

  -- Visas & travel
  has_schengen BOOLEAN,
  has_b1b2 BOOLEAN,
  has_c1d BOOLEAN,
  other_visas TEXT[],
  passport_expiry DATE,

  -- Certifications (denormalized for quick filtering)
  has_stcw BOOLEAN DEFAULT FALSE,
  stcw_expiry DATE,
  has_eng1 BOOLEAN DEFAULT FALSE,
  eng1_expiry DATE,
  highest_license TEXT,

  -- Personal
  is_smoker BOOLEAN,
  has_visible_tattoos BOOLEAN,
  tattoo_description TEXT,
  marital_status TEXT,

  -- Couple placement
  is_couple BOOLEAN DEFAULT FALSE,
  partner_name TEXT,
  partner_position TEXT,
  partner_candidate_id UUID REFERENCES candidates(id),

  -- Verification
  verification_tier verification_tier DEFAULT 'basic',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),

  -- AI/Search
  embedding vector(1536),  -- For semantic search
  profile_summary TEXT,    -- AI-generated summary
  search_keywords TEXT[],  -- Extracted keywords

  -- Source
  source TEXT,  -- How they found us: website, referral, etc.
  referred_by UUID REFERENCES candidates(id),

  -- Internal notes (visible to agencies only)
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_availability ON candidates(availability_status, available_from);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(primary_position);
CREATE INDEX IF NOT EXISTS idx_candidates_verification ON candidates(verification_tier);
CREATE INDEX IF NOT EXISTS idx_candidates_embedding ON candidates USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ----------------------------------------------------------------------------
-- CANDIDATE_AGENCY_RELATIONSHIPS
-- Which agencies have relationships with which candidates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_agency_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  candidate_id UUID NOT NULL REFERENCES candidates(id),
  agency_id UUID NOT NULL REFERENCES organizations(id),

  -- Relationship type
  relationship_type TEXT DEFAULT 'registered',  -- registered, vetted, exclusive

  -- Exclusivity
  is_exclusive BOOLEAN DEFAULT FALSE,
  exclusive_until DATE,

  -- Agency-specific data
  agency_candidate_id TEXT,  -- Their internal ID (e.g., Vincere ID)
  agency_notes TEXT,
  agency_rating INTEGER CHECK (agency_rating >= 1 AND agency_rating <= 5),

  -- Interview/vetting status at this agency
  interviewed_at TIMESTAMPTZ,
  interviewed_by UUID REFERENCES users(id),
  interview_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(candidate_id, agency_id)
);

CREATE INDEX IF NOT EXISTS idx_car_candidate ON candidate_agency_relationships(candidate_id);
CREATE INDEX IF NOT EXISTS idx_car_agency ON candidate_agency_relationships(agency_id);

-- ----------------------------------------------------------------------------
-- JOBS
-- Positions that need to be filled
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who posted it
  client_id UUID REFERENCES organizations(id),  -- The boat/owner
  created_by_agency_id UUID REFERENCES organizations(id),  -- Agency that entered it
  created_by_user_id UUID REFERENCES users(id),

  -- For Vincere sync (Lighthouse jobs)
  external_id TEXT,  -- Vincere job ID
  external_source TEXT,  -- 'vincere'

  -- Job details
  title TEXT NOT NULL,  -- "Chief Stewardess"
  position_category position_category,

  -- Vessel info (denormalized for display)
  vessel_name TEXT,
  vessel_type TEXT,
  vessel_size_meters INTEGER,

  -- Contract
  contract_type contract_type,
  start_date DATE,
  end_date DATE,  -- For seasonal
  rotation_schedule TEXT,  -- "6 weeks on / 6 weeks off"

  -- Location
  primary_region TEXT,  -- Mediterranean
  itinerary TEXT,  -- Detailed travel plans

  -- Compensation
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'EUR',
  salary_period TEXT DEFAULT 'month',  -- month, year, day
  benefits TEXT,  -- "flights, rotation, health insurance"

  -- Requirements (structured)
  requirements JSONB DEFAULT '{}',
  /*
  {
    "experience_years_min": 5,
    "certifications_required": ["STCW", "ENG1"],
    "visas_required": ["Schengen", "B1/B2"],
    "languages_required": ["English"],
    "languages_preferred": ["French"],
    "non_smoker": true,
    "no_visible_tattoos": true,
    "nationality_preferences": ["EU"],
    "couple_acceptable": false
  }
  */

  -- Requirements (text, for display)
  requirements_text TEXT,

  -- Status
  status job_status DEFAULT 'draft',
  visibility job_visibility DEFAULT 'private',

  -- For network jobs: fee structure
  fee_type TEXT DEFAULT 'percentage',  -- percentage, fixed
  fee_amount DECIMAL(10,2),  -- 15.00 for %, or fixed amount
  fee_split_policy TEXT,  -- "50/50 client agency / candidate agency"

  -- Urgency
  is_urgent BOOLEAN DEFAULT FALSE,
  closes_at TIMESTAMPTZ,

  -- AI/Search
  embedding vector(1536),
  parsed_requirements JSONB,  -- AI-extracted structured requirements

  -- Stats
  submissions_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_agency ON jobs(created_by_agency_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_visibility ON jobs(visibility);
CREATE INDEX IF NOT EXISTS idx_jobs_position ON jobs(position_category);
CREATE INDEX IF NOT EXISTS idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ----------------------------------------------------------------------------
-- SUBMISSIONS
-- Agency submits candidate to job (THE CRITICAL TABLE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The submission
  job_id UUID NOT NULL REFERENCES jobs(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  agency_id UUID NOT NULL REFERENCES organizations(id),
  submitted_by UUID NOT NULL REFERENCES users(id),

  -- THE TIMESTAMP (immutable, critical for "first CV wins")
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Submission hash for integrity verification
  -- Hash of: job_id + candidate_id + submitted_at
  submission_hash TEXT NOT NULL,

  -- Status
  status submission_status DEFAULT 'pending',
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES users(id),

  -- Agency's pitch
  cover_note TEXT,  -- Why this candidate is right

  -- AI matching info
  match_score INTEGER,  -- 0-100
  match_reasoning TEXT,  -- AI explanation

  -- Client feedback
  client_viewed_at TIMESTAMPTZ,
  client_rating INTEGER,  -- 1-5 stars
  client_feedback TEXT,
  rejection_reason TEXT,

  -- Interview tracking
  interview_scheduled_at TIMESTAMPTZ,
  interview_completed_at TIMESTAMPTZ,
  interview_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: same candidate can't be submitted twice to same job by same agency
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_unique ON submissions(job_id, candidate_id, agency_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_job ON submissions(job_id);
CREATE INDEX IF NOT EXISTS idx_submissions_candidate ON submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_submissions_agency ON submissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON submissions(job_id, submitted_at);

-- Function to generate submission hash
CREATE OR REPLACE FUNCTION generate_submission_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.submission_hash := encode(
    digest(
      NEW.job_id::text || NEW.candidate_id::text || NEW.submitted_at::text,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate hash (drop first for idempotency)
DROP TRIGGER IF EXISTS trg_submission_hash ON submissions;
CREATE TRIGGER trg_submission_hash
  BEFORE INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION generate_submission_hash();

-- Function to check if candidate already submitted to this job by another agency
CREATE OR REPLACE FUNCTION check_duplicate_candidate()
RETURNS TRIGGER AS $$
DECLARE
  existing_submission RECORD;
BEGIN
  -- Check if this candidate was already submitted by another agency
  SELECT s.*, o.name as agency_name
  INTO existing_submission
  FROM submissions s
  JOIN organizations o ON s.agency_id = o.id
  WHERE s.job_id = NEW.job_id
    AND s.candidate_id = NEW.candidate_id
    AND s.agency_id != NEW.agency_id
  ORDER BY s.submitted_at ASC
  LIMIT 1;

  -- If exists, we still allow the submission but flag it
  -- (Business logic can decide whether to notify or reject)
  IF existing_submission.id IS NOT NULL THEN
    -- Store reference to first submission
    NEW.cover_note := COALESCE(NEW.cover_note, '') ||
      E'\n\n[SYSTEM: Candidate was first submitted by ' ||
      existing_submission.agency_name || ' at ' ||
      existing_submission.submitted_at::text || ']';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_duplicate ON submissions;
CREATE TRIGGER trg_check_duplicate
  BEFORE INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_candidate();

-- ----------------------------------------------------------------------------
-- PLACEMENTS
-- Successful submissions become placements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Links
  submission_id UUID NOT NULL REFERENCES submissions(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  client_id UUID NOT NULL REFERENCES organizations(id),

  -- Agencies involved (for split placements)
  placing_agency_id UUID NOT NULL REFERENCES organizations(id),  -- Agency that submitted
  sourcing_agency_id UUID REFERENCES organizations(id),  -- If different (collaboration)

  -- Placement details
  start_date DATE,
  end_date DATE,  -- For seasonal
  contract_type contract_type,

  -- Financials
  salary_agreed INTEGER,
  salary_currency TEXT DEFAULT 'EUR',

  -- Fees
  total_fee DECIMAL(10,2),
  fee_currency TEXT DEFAULT 'EUR',

  -- Fee split (for collaboration)
  placing_agency_fee DECIMAL(10,2),  -- Agency that has client relationship
  sourcing_agency_fee DECIMAL(10,2), -- Agency that has candidate
  platform_fee DECIMAL(10,2),        -- Lighthouse platform cut

  -- Payment tracking
  invoice_sent_at TIMESTAMPTZ,
  invoice_amount DECIMAL(10,2),
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(10,2),

  -- Status
  status TEXT DEFAULT 'pending',  -- pending, active, completed, cancelled
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Guarantee tracking
  guarantee_period_days INTEGER DEFAULT 90,
  guarantee_ends_at DATE,
  guarantee_claimed BOOLEAN DEFAULT FALSE,
  replacement_needed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placements_submission ON placements(submission_id);
CREATE INDEX IF NOT EXISTS idx_placements_candidate ON placements(candidate_id);
CREATE INDEX IF NOT EXISTS idx_placements_client ON placements(client_id);
CREATE INDEX IF NOT EXISTS idx_placements_placing_agency ON placements(placing_agency_id);
CREATE INDEX IF NOT EXISTS idx_placements_status ON placements(status);

-- ----------------------------------------------------------------------------
-- CERTIFICATIONS
-- Candidate certifications with verification status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  candidate_id UUID NOT NULL REFERENCES candidates(id),

  -- Certification details
  name TEXT NOT NULL,  -- "STCW Basic Safety Training"
  type TEXT,  -- STCW, License, ENG1, Food Safety, etc.
  issuing_authority TEXT,
  certificate_number TEXT,

  -- Dates
  issue_date DATE,
  expiry_date DATE,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  verification_method TEXT,  -- manual, api, document_check

  -- Document
  document_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certifications_candidate ON certifications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_certifications_type ON certifications(type);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON certifications(expiry_date);

-- ----------------------------------------------------------------------------
-- REFERENCES
-- Candidate references
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  candidate_id UUID NOT NULL REFERENCES candidates(id),

  -- Referee details
  referee_name TEXT NOT NULL,
  referee_position TEXT,
  referee_company TEXT,  -- Yacht name or company
  referee_email TEXT,
  referee_phone TEXT,

  -- Relationship
  relationship TEXT,  -- "Direct supervisor", "Captain", etc.
  worked_together_from DATE,
  worked_together_to DATE,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  verification_method TEXT,  -- email, phone, voice_ai

  -- Reference content
  reference_text TEXT,  -- Written reference
  reference_document_url TEXT,  -- PDF of written reference

  -- Voice AI reference check
  voice_call_id TEXT,  -- Vapi call ID
  voice_transcript TEXT,
  voice_summary TEXT,

  -- Rating from reference (1-5)
  overall_rating INTEGER,
  would_rehire BOOLEAN,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_references_candidate ON candidate_references(candidate_id);
CREATE INDEX IF NOT EXISTS idx_references_verified ON candidate_references(is_verified);

-- ----------------------------------------------------------------------------
-- DOCUMENTS
-- Files associated with candidates, jobs, etc.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Polymorphic association
  entity_type TEXT NOT NULL,  -- 'candidate', 'job', 'placement', etc.
  entity_id UUID NOT NULL,

  -- Document info
  type TEXT NOT NULL,  -- cv, certificate, reference, photo, contract
  name TEXT NOT NULL,
  description TEXT,

  -- File
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  -- Processing
  is_processed BOOLEAN DEFAULT FALSE,
  extracted_text TEXT,
  embedding vector(1536),

  -- Timestamps
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- ----------------------------------------------------------------------------
-- BRIEFS
-- Raw job briefs before they become structured jobs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source
  source comm_channel NOT NULL,  -- whatsapp, email, portal, phone
  source_identifier TEXT,  -- Phone number, email address

  -- Raw content
  raw_content TEXT NOT NULL,
  attachments TEXT[],  -- URLs to uploaded files

  -- Identified client (if known)
  client_id UUID REFERENCES organizations(id),
  client_user_id UUID REFERENCES users(id),

  -- Assigned agency/recruiter
  assigned_agency_id UUID REFERENCES organizations(id),
  assigned_user_id UUID REFERENCES users(id),

  -- AI parsing
  parsed_at TIMESTAMPTZ,
  parsed_requirements JSONB,
  parsing_confidence DECIMAL(3,2),  -- 0.00 to 1.00
  parsing_ambiguities TEXT[],

  -- Conversion to job
  converted_to_job_id UUID REFERENCES jobs(id),
  converted_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'new',  -- new, parsing, parsed, converted, abandoned

  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefs_client ON briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_source ON briefs(source);

-- ----------------------------------------------------------------------------
-- INTERACTIONS
-- CRM activity log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who
  user_id UUID REFERENCES users(id),  -- Who logged it
  agency_id UUID REFERENCES organizations(id),

  -- With whom (polymorphic)
  entity_type TEXT NOT NULL,  -- 'candidate', 'client', 'organization'
  entity_id UUID NOT NULL,

  -- What
  type TEXT NOT NULL,  -- call, email, whatsapp, meeting, note, status_change
  channel comm_channel,
  direction TEXT,  -- inbound, outbound

  -- Content
  subject TEXT,
  content TEXT,

  -- Related to
  job_id UUID REFERENCES jobs(id),
  submission_id UUID REFERENCES submissions(id),

  -- Timestamps
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_entity ON interactions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(occurred_at);

-- ----------------------------------------------------------------------------
-- MESSAGES
-- Platform messaging (not external comms)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Conversation context
  job_id UUID REFERENCES jobs(id),
  submission_id UUID REFERENCES submissions(id),

  -- Participants
  from_user_id UUID REFERENCES users(id),
  from_org_id UUID REFERENCES organizations(id),
  to_user_id UUID REFERENCES users(id),
  to_org_id UUID REFERENCES organizations(id),

  -- Content
  content TEXT NOT NULL,
  attachments JSONB,  -- [{name, url, type}]

  -- Status
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_job ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_submission ON messages(submission_id);
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_user_id);

-- ----------------------------------------------------------------------------
-- ALERTS
-- System notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- For whom
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),

  -- What
  type TEXT NOT NULL,  -- new_job, new_submission, interview_reminder, etc.
  title TEXT NOT NULL,
  message TEXT,

  -- Related entities
  entity_type TEXT,
  entity_id UUID,

  -- Action
  action_url TEXT,
  action_text TEXT,

  -- Priority
  priority TEXT DEFAULT 'normal',  -- low, normal, high, urgent

  -- Status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read_at);

-- ----------------------------------------------------------------------------
-- COLLABORATION_REQUESTS
-- Agency requests to access another agency's candidate or job
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who's asking
  requesting_agency_id UUID NOT NULL REFERENCES organizations(id),
  requesting_user_id UUID NOT NULL REFERENCES users(id),

  -- What they want
  type TEXT NOT NULL,  -- 'candidate_access', 'job_share', 'introduction'

  -- For candidate access
  candidate_id UUID REFERENCES candidates(id),

  -- For job share
  job_id UUID REFERENCES jobs(id),

  -- Who owns it
  owning_agency_id UUID NOT NULL REFERENCES organizations(id),

  -- Terms
  proposed_split TEXT,  -- "50/50"
  message TEXT,

  -- Status
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected, expired
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id),
  response_message TEXT,

  -- If approved, the fee split
  approved_requesting_share DECIMAL(5,2),  -- e.g., 50.00
  approved_owning_share DECIMAL(5,2),      -- e.g., 50.00

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_collab_requesting ON collaboration_requests(requesting_agency_id);
CREATE INDEX IF NOT EXISTS idx_collab_owning ON collaboration_requests(owning_agency_id);
CREATE INDEX IF NOT EXISTS idx_collab_status ON collaboration_requests(status);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: First submission for each candidate per job
CREATE OR REPLACE VIEW first_submissions AS
SELECT DISTINCT ON (job_id, candidate_id)
  id,
  job_id,
  candidate_id,
  agency_id,
  submitted_by,
  submitted_at,
  status,
  submission_hash
FROM submissions
ORDER BY job_id, candidate_id, submitted_at ASC;

-- View: Job with submission counts
CREATE OR REPLACE VIEW jobs_with_stats AS
SELECT
  j.*,
  COUNT(DISTINCT s.id) as total_submissions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'shortlisted') as shortlisted_count,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'interviewing') as interviewing_count,
  COUNT(DISTINCT s.agency_id) as agencies_submitted
FROM jobs j
LEFT JOIN submissions s ON j.id = s.job_id
GROUP BY j.id;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Match candidates to job using vector similarity
CREATE OR REPLACE FUNCTION match_candidates_to_job(
  job_uuid UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_limit INT DEFAULT 50
)
RETURNS TABLE (
  candidate_id UUID,
  first_name TEXT,
  last_name TEXT,
  primary_position TEXT,
  verification_tier verification_tier,
  availability_status availability_status,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.primary_position,
    c.verification_tier,
    c.availability_status,
    1 - (c.embedding <=> j.embedding) as similarity
  FROM candidates c
  CROSS JOIN jobs j
  WHERE j.id = job_uuid
    AND c.embedding IS NOT NULL
    AND j.embedding IS NOT NULL
    AND c.deleted_at IS NULL
    AND c.availability_status IN ('available', 'looking')
    AND 1 - (c.embedding <=> j.embedding) >= match_threshold
  ORDER BY c.embedding <=> j.embedding
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if agency was first to submit candidate
CREATE OR REPLACE FUNCTION was_first_submission(
  p_job_id UUID,
  p_candidate_id UUID,
  p_agency_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  first_agency UUID;
BEGIN
  SELECT agency_id INTO first_agency
  FROM submissions
  WHERE job_id = p_job_id AND candidate_id = p_candidate_id
  ORDER BY submitted_at ASC
  LIMIT 1;

  RETURN first_agency = p_agency_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate placement fee split
CREATE OR REPLACE FUNCTION calculate_fee_split(
  p_total_fee DECIMAL,
  p_placing_agency_id UUID,
  p_sourcing_agency_id UUID,
  p_platform_fee_percent DECIMAL DEFAULT 10.0
)
RETURNS TABLE (
  placing_fee DECIMAL,
  sourcing_fee DECIMAL,
  platform_fee DECIMAL
) AS $$
DECLARE
  platform_cut DECIMAL;
  remaining DECIMAL;
BEGIN
  -- Platform always takes its cut
  platform_cut := p_total_fee * (p_platform_fee_percent / 100);
  remaining := p_total_fee - platform_cut;

  IF p_sourcing_agency_id IS NULL OR p_placing_agency_id = p_sourcing_agency_id THEN
    -- No collaboration, placing agency gets everything (minus platform)
    RETURN QUERY SELECT remaining, 0::DECIMAL, platform_cut;
  ELSE
    -- Collaboration: 50/50 split of remainder
    RETURN QUERY SELECT remaining / 2, remaining / 2, platform_cut;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at (drop first for idempotency)
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_candidates_updated_at ON candidates;
CREATE TRIGGER trg_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON submissions;
CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_placements_updated_at ON placements;
CREATE TRIGGER trg_placements_updated_at BEFORE UPDATE ON placements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_briefs_updated_at ON briefs;
CREATE TRIGGER trg_briefs_updated_at BEFORE UPDATE ON briefs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update job submission count when submission added
CREATE OR REPLACE FUNCTION update_job_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs SET submissions_count = submissions_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs SET submissions_count = submissions_count - 1 WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_submission_count ON submissions;
CREATE TRIGGER trg_submission_count
  AFTER INSERT OR DELETE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_job_submission_count();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_agency_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Basic policies (drop first for idempotency)
-- Users can see their own organization
DROP POLICY IF EXISTS org_access ON organizations;
CREATE POLICY org_access ON organizations
  FOR ALL
  USING (
    id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    OR type = 'agency'  -- Agencies are visible for collaboration
  );

-- Users see own user record
DROP POLICY IF EXISTS user_access ON users;
CREATE POLICY user_access ON users
  FOR ALL
  USING (auth_id = auth.uid());

-- Candidates visible to agencies they have relationships with
DROP POLICY IF EXISTS candidate_agency_access ON candidates;
CREATE POLICY candidate_agency_access ON candidates
  FOR SELECT
  USING (
    id IN (
      SELECT candidate_id FROM candidate_agency_relationships
      WHERE agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    )
    OR verification_tier IN ('verified', 'premium')  -- Verified candidates visible to all agencies
  );

-- Jobs visible based on visibility setting
DROP POLICY IF EXISTS job_visibility ON jobs;
CREATE POLICY job_visibility ON jobs
  FOR SELECT
  USING (
    visibility = 'public'
    OR visibility = 'network'
    OR client_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    OR created_by_agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- Submissions visible to submitting agency and client
DROP POLICY IF EXISTS submission_access ON submissions;
CREATE POLICY submission_access ON submissions
  FOR SELECT
  USING (
    agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    OR job_id IN (SELECT id FROM jobs WHERE client_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid()))
  );

-- ============================================================================
-- SEED DATA - Lighthouse as first organization
-- ============================================================================

-- Insert Lighthouse as the founding agency (ON CONFLICT for idempotency)
INSERT INTO organizations (
  id,
  type,
  name,
  slug,
  email,
  website,
  commission_rate,
  subscription_tier
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'agency',
  'Lighthouse Careers',
  'lighthouse',
  'info@lighthouse-careers.com',
  'https://lighthouse-careers.com',
  15.00,
  'enterprise'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant root: agencies, clients (boats/owners), management companies';
COMMENT ON TABLE candidates IS 'Crew members seeking positions. Independent of any single agency.';
COMMENT ON TABLE jobs IS 'Positions to fill. Posted by clients or entered by agencies from briefs.';
COMMENT ON TABLE submissions IS 'The critical table: agency submits candidate to job. Timestamps are immutable.';
COMMENT ON TABLE placements IS 'Successful placements with fee tracking and collaboration splits.';
COMMENT ON COLUMN submissions.submitted_at IS 'IMMUTABLE. The timestamp that determines "first CV wins".';
COMMENT ON COLUMN submissions.submission_hash IS 'SHA256 hash of job_id + candidate_id + timestamp for integrity verification.';
