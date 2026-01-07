// ============================================================================
// LIGHTHOUSE CREW NETWORK - Database Types
// ============================================================================
// Auto-generated types should eventually replace these, but this serves as
// the source of truth for the data model.
// ============================================================================

// ----------------------------------------------------------------------------
// ENUMS
// ----------------------------------------------------------------------------

export type OrgType = 'agency' | 'management_co' | 'private_owner' | 'charter_co';

export type UserRole = 'owner' | 'admin' | 'recruiter' | 'viewer';

// Legacy string-based tiers (for backwards compatibility)
export type VerificationTierLegacy = 'basic' | 'identity' | 'verified' | 'premium';

// Numeric verification tiers (0-3) - deprecated
export type VerificationTierNumeric = 0 | 1 | 2 | 3;

// String-based verification tiers (current)
export type VerificationTier = 'unverified' | 'basic' | 'identity' | 'references' | 'verified' | 'premium';

// Reference check status
export type ReferenceStatus = 'pending' | 'contacted' | 'verified' | 'failed' | 'declined';

// Verification event types
export type VerificationEventType =
  | 'tier_changed'
  | 'email_verified'
  | 'cv_uploaded'
  | 'cv_approved'
  | 'cv_rejected'
  | 'id_uploaded'
  | 'id_verified'
  | 'reference_added'
  | 'reference_contacted'
  | 'reference_verified'
  | 'voice_completed';

export type AvailabilityStatus = 'available' | 'notice_period' | 'not_looking' | 'on_contract' | 'unknown';

export type JobVisibility = 'private' | 'network' | 'public';

export type JobStatus =
  | 'draft'
  | 'open'
  | 'shortlist'
  | 'interviewing'
  | 'offer'
  | 'filled'
  | 'closed';

export type SubmissionStatus =
  | 'pending'
  | 'shortlisted'
  | 'interviewing'
  | 'offer'
  | 'placed'
  | 'rejected'
  | 'withdrawn';

export type ContractType =
  | 'permanent'
  | 'rotational'
  | 'seasonal'
  | 'temporary'
  | 'freelance';

export type PositionCategory =
  | 'deck'
  | 'interior'
  | 'engineering'
  | 'galley'
  | 'captain'
  | 'medical'
  | 'childcare'
  | 'security'
  | 'management'
  | 'other';

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'submitted'
  | 'interview'
  | 'offer'
  | 'placed'
  | 'rejected';

export type ApplicationSource =
  | 'job_board'      // Candidate applied via public job board
  | 'direct'         // Agency added candidate directly
  | 'referral'       // Candidate was referred
  | 'ai_match'       // AI matching suggested candidate
  | 'manual'         // Legacy/manual entry
  | 'vincere_sync';  // Synced from Vincere

export type BriefStatus =
  | 'new'
  | 'parsing'
  | 'parsed'
  | 'needs_clarification'
  | 'converted'
  | 'abandoned';

export type CommChannel =
  | 'email'
  | 'whatsapp'
  | 'sms'
  | 'phone'
  | 'platform'
  | 'in_person';

// ----------------------------------------------------------------------------
// BASE TYPES
// ----------------------------------------------------------------------------

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// ORGANIZATIONS
// ----------------------------------------------------------------------------

export interface Organization extends BaseEntity {
  type: OrgType;
  name: string;
  slug: string | null;

  // Contact
  email: string | null;
  phone: string | null;
  website: string | null;

  // Address
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;

  // Agency fields
  agency_license: string | null;
  commission_rate: number;

  // Vessel fields (for clients)
  vessel_name: string | null;
  vessel_type: string | null;
  vessel_size_meters: number | null;
  vessel_flag: string | null;
  vessel_year: number | null;
  imo_number: string | null;

  // Management company fields
  fleet_size: number | null;

  // Subscription
  subscription_tier: string;
  subscription_status: string;
  stripe_customer_id: string | null;

  // Settings
  settings: Record<string, unknown>;

  deleted_at: string | null;
}

export type OrganizationInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
export type OrganizationUpdate = Partial<OrganizationInsert>;

// Agency is an Organization with type='agency'
export type Agency = Organization & { type: 'agency' };

// ----------------------------------------------------------------------------
// USERS
// ----------------------------------------------------------------------------

export interface User extends BaseEntity {
  auth_id: string | null;
  organization_id: string | null;
  role: UserRole;

  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;

  preferences: Record<string, unknown>;

  is_active: boolean;
  last_login_at: string | null;
}

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UserUpdate = Partial<UserInsert>;

// ----------------------------------------------------------------------------
// CANDIDATES
// ----------------------------------------------------------------------------

export interface Candidate extends BaseEntity {
  user_id: string | null;

  // External IDs (for CRM sync)
  vincere_id: string | null;

  // Basic info
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  photo_url: string | null;
  avatar_url: string | null;  // Profile photo from Vincere sync

  // Demographics
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  second_nationality: string | null;

  // Location
  current_location: string | null;
  current_country: string | null;

  // Professional
  primary_position: string | null;
  secondary_position: string | null;
  secondary_positions: string[] | null;
  position_category: PositionCategory | null;
  candidate_type: 'yacht_crew' | 'household_staff' | 'other' | 'both' | null;
  years_experience: number | null;

  // Yacht experience
  yacht_size_min: number | null;
  yacht_size_max: number | null;
  yacht_types: string[] | null;

  // Yacht preferences
  preferred_yacht_types: string[] | null;
  preferred_yacht_size_min: number | null;
  preferred_yacht_size_max: number | null;
  preferred_contract_types: ContractType[] | null;
  preferred_regions: string[] | null;
  contract_preferences: string[] | null;

  // Availability
  availability_status: AvailabilityStatus;
  available_from: string | null;
  current_contract_end: string | null;

  // Compensation
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;

  // Visas
  has_schengen: boolean | null;
  schengen_expiry: string | null;
  has_b1b2: boolean | null;
  b1b2_expiry: string | null;
  has_c1d: boolean | null;
  other_visas: string[] | null;
  passport_expiry: string | null;

  // Certifications (denormalized)
  has_stcw: boolean;
  stcw_expiry: string | null;
  has_eng1: boolean;
  eng1_expiry: string | null;
  highest_license: string | null;
  second_license: string | null;

  // Personal
  is_smoker: boolean | null;
  has_visible_tattoos: boolean | null;
  tattoo_description: string | null;
  marital_status: string | null;

  // Couple
  is_couple: boolean;
  partner_name: string | null;
  partner_position: string | null;
  partner_candidate_id: string | null;
  couple_position: string | null;

  // Verification
  verification_tier: VerificationTier;
  verification_updated_at: string | null;  // NEW
  verified_at: string | null;
  verified_by: string | null;

  // Email verification (for self-service)
  email_verified_at: string | null;        // NEW

  // CV tracking
  cv_url: string | null;                   // NEW
  cv_status: 'not_uploaded' | 'pending' | 'approved' | 'rejected';  // NEW
  cv_document_id: string | null;           // NEW

  // ID verification
  id_verified_at: string | null;           // NEW
  id_document_url: string | null;          // NEW
  id_verification_notes: string | null;    // NEW

  // Voice verification (Vapi)
  voice_verified_at: string | null;        // NEW
  voice_verification_id: string | null;    // NEW

  // AI/Search
  embedding: number[] | null;
  profile_summary: string | null;
  ai_summary: string | null;
  search_keywords: string[] | null;

  // Generated Bio (5-paragraph candidate brief)
  bio_full: string | null;
  bio_anonymized: string | null;
  bio_generated_at: string | null;
  bio_generation_version: number | null;

  // Source
  source: string | null;
  referred_by: string | null;

  // Sync tracking
  last_synced_at: string | null;

  // Internal
  internal_notes: string | null;

  last_active_at: string | null;
  deleted_at: string | null;
}

export type CandidateInsert = Omit<Candidate, 'id' | 'created_at' | 'updated_at'>;
export type CandidateUpdate = Partial<CandidateInsert>;

// Candidate with computed fields for display
export interface CandidateWithDetails extends Candidate {
  full_name: string;
  age: number | null;
  certifications?: Certification[];
  references?: CandidateReference[];
  agency_relationships?: CandidateAgencyRelationship[];
}

// Candidate with related entities (for API responses)
export interface CandidateWithRelations extends Candidate {
  certifications: CandidateCertification[];
  references: CandidateReference[];
}

// Alias for Certification (API compatibility)
export type CandidateCertification = Certification;

// ----------------------------------------------------------------------------
// CANDIDATE AGENCY RELATIONSHIPS
// ----------------------------------------------------------------------------

export interface CandidateAgencyRelationship extends BaseEntity {
  candidate_id: string;
  agency_id: string;

  relationship_type: string;

  is_exclusive: boolean;
  exclusive_until: string | null;

  agency_candidate_id: string | null;
  agency_notes: string | null;
  agency_rating: number | null;

  interviewed_at: string | null;
  interviewed_by: string | null;
  interview_notes: string | null;
}

// ----------------------------------------------------------------------------
// JOBS
// ----------------------------------------------------------------------------

export interface JobRequirements {
  experience_years_min?: number;
  experience_years_max?: number;
  certifications_required?: string[];
  certifications_preferred?: string[];
  visas_required?: string[];
  languages_required?: string[];
  languages_preferred?: string[];
  non_smoker?: boolean;
  no_visible_tattoos?: boolean;
  nationality_preferences?: string[];
  couple_acceptable?: boolean;
  gender_preference?: string;
}

export interface Job extends BaseEntity {
  client_id: string | null;
  created_by_agency_id: string | null;
  created_by_user_id: string | null;

  external_id: string | null;
  external_source: string | null;

  // Job details
  title: string;
  position_category: PositionCategory | null;

  // Vessel
  vessel_name: string | null;
  vessel_type: string | null;
  vessel_size_meters: number | null;

  // Contract
  contract_type: ContractType | null;
  start_date: string | null;
  end_date: string | null;
  rotation_schedule: string | null;

  // Location
  primary_region: string | null;
  itinerary: string | null;

  // Compensation
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string;
  benefits: string | null;

  // Requirements
  requirements: JobRequirements;
  requirements_text: string | null;

  // Status
  status: JobStatus;
  visibility: JobVisibility;

  // Public job board
  is_public: boolean;
  public_title: string | null;
  public_description: string | null;
  apply_deadline: string | null;

  // Fees
  fee_type: string;
  fee_amount: number | null;
  fee_split_policy: string | null;

  // Urgency
  is_urgent: boolean;
  closes_at: string | null;

  // AI/Search
  embedding: number[] | null;
  parsed_requirements: JobRequirements | null;

  // Stats
  submissions_count: number;
  views_count: number;
  applications_count: number;

  // Timestamps
  published_at: string | null;
  filled_at: string | null;
  deleted_at: string | null;
}

export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at' | 'submissions_count' | 'views_count' | 'applications_count'>;
export type JobUpdate = Partial<JobInsert>;

// Public job - safe subset for public display (no confidential info)
export interface PublicJob {
  id: string;
  title: string;                          // Uses public_title if set, otherwise title
  description: string | null;             // Uses public_description if set
  position_category: PositionCategory | null;
  vessel_type: string | null;             // Visible, but not vessel_name
  vessel_size_meters: number | null;
  contract_type: ContractType | null;
  start_date: string | null;
  end_date: string | null;
  rotation_schedule: string | null;
  primary_region: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string;
  benefits: string | null;
  requirements: JobRequirements;
  is_urgent: boolean;
  apply_deadline: string | null;
  applications_count: number;
  views_count: number;
  created_at: string;
  published_at: string | null;
  agency_name: string | null;             // Agency name (if not confidential)
  // Intentionally excluded: vessel_name, client_id, fees, internal notes, etc.
}

// Job with related data
export interface JobWithDetails extends Job {
  client?: Organization;
  created_by_agency?: Organization;
  submissions?: Submission[];
}

// Job with application statistics
export interface JobWithStats extends Job {
  application_counts: {
    total: number;
    by_stage: Record<ApplicationStage, number>;
  };
}

// ----------------------------------------------------------------------------
// SUBMISSIONS
// ----------------------------------------------------------------------------

export interface Submission extends BaseEntity {
  job_id: string;
  candidate_id: string;
  agency_id: string;
  submitted_by: string;

  submitted_at: string;
  submission_hash: string;

  status: SubmissionStatus;
  status_changed_at: string | null;
  status_changed_by: string | null;

  cover_note: string | null;

  match_score: number | null;
  match_reasoning: string | null;

  client_viewed_at: string | null;
  client_rating: number | null;
  client_feedback: string | null;
  rejection_reason: string | null;

  interview_scheduled_at: string | null;
  interview_completed_at: string | null;
  interview_notes: string | null;
}

export type SubmissionInsert = Omit<Submission, 'id' | 'created_at' | 'updated_at' | 'submission_hash'>;
export type SubmissionUpdate = Partial<Pick<Submission, 'status' | 'status_changed_at' | 'status_changed_by' | 'cover_note' | 'client_viewed_at' | 'client_rating' | 'client_feedback' | 'rejection_reason' | 'interview_scheduled_at' | 'interview_completed_at' | 'interview_notes'>>;

// Submission with related data
export interface SubmissionWithDetails extends Submission {
  job?: Job;
  candidate?: Candidate;
  agency?: Organization;
  submitted_by_user?: User;
  is_first_submission?: boolean;
}

// ----------------------------------------------------------------------------
// APPLICATIONS (Candidate-Job Pipeline)
// ----------------------------------------------------------------------------

export interface ApplicationMatchBreakdown {
  skills_match?: number;
  experience_match?: number;
  certification_match?: number;
  availability_match?: number;
  location_match?: number;
  salary_match?: number;
}

export interface Application extends BaseEntity {
  // Core relationships
  candidate_id: string;
  job_id: string;
  agency_id: string;

  // Stage tracking
  stage: ApplicationStage;
  stage_changed_at: string | null;
  stage_changed_by: string | null;

  // AI Matching
  match_score: number | null;
  match_breakdown: ApplicationMatchBreakdown;
  ai_assessment: string | null;

  // Source
  source: ApplicationSource | string | null;

  // Notes
  internal_notes: string | null;
  rejection_reason: string | null;

  // Related submission (if converted)
  submission_id: string | null;

  // Client interaction
  submitted_to_client_at: string | null;
  client_feedback: string | null;
  client_rating: number | null;

  // Interview tracking
  interview_requested_at: string | null;
  interview_scheduled_at: string | null;
  interview_notes: string | null;

  // Outcome tracking
  placed_at: string | null;
  placement_salary: number | null;
  placement_fee: number | null;
  withdrawn_reason: string | null;

  // Meta
  created_by: string | null;

  // Timestamps
  applied_at: string;
}

export type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at'>;
export type ApplicationUpdate = Partial<Omit<ApplicationInsert, 'candidate_id' | 'job_id' | 'agency_id'>>;

// Application with related data
export interface ApplicationWithDetails extends Application {
  candidate?: Candidate;
  job?: Job;
  agency?: Organization;
  submission?: Submission;
}

// ----------------------------------------------------------------------------
// PLACEMENTS
// ----------------------------------------------------------------------------

export interface Placement extends BaseEntity {
  submission_id: string;
  job_id: string;
  candidate_id: string;
  client_id: string;

  placing_agency_id: string;
  sourcing_agency_id: string | null;

  start_date: string | null;
  end_date: string | null;
  contract_type: ContractType | null;

  salary_agreed: number | null;
  salary_currency: string;

  total_fee: number | null;
  fee_currency: string;

  placing_agency_fee: number | null;
  sourcing_agency_fee: number | null;
  platform_fee: number | null;

  invoice_sent_at: string | null;
  invoice_amount: number | null;
  paid_at: string | null;
  paid_amount: number | null;

  status: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  guarantee_period_days: number;
  guarantee_ends_at: string | null;
  guarantee_claimed: boolean;
  replacement_needed: boolean;
}

// ----------------------------------------------------------------------------
// CERTIFICATIONS
// ----------------------------------------------------------------------------

export interface Certification extends BaseEntity {
  candidate_id: string;

  name: string;
  type: string | null;
  issuing_authority: string | null;
  certificate_number: string | null;

  issue_date: string | null;
  expiry_date: string | null;

  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_method: string | null;

  document_url: string | null;
}

// ----------------------------------------------------------------------------
// REFERENCES
// ----------------------------------------------------------------------------

export interface CandidateReference extends BaseEntity {
  candidate_id: string;

  // Reference contact info (legacy: referee_*)
  referee_name: string;
  referee_position: string | null;
  referee_company: string | null;
  referee_email: string | null;
  referee_phone: string | null;

  // Relationship details
  relationship: string | null;
  worked_together_from: string | null;
  worked_together_to: string | null;
  company_vessel: string | null;  // NEW: Where they worked together
  dates_worked: string | null;    // NEW: e.g., "2022-2024"

  // Verification status
  status: ReferenceStatus;        // NEW: pending, contacted, verified, failed, declined
  is_verified: boolean;           // Legacy boolean
  verified_at: string | null;
  verified_by: string | null;
  verification_method: string | null;
  contacted_at: string | null;    // NEW: When reference was contacted
  contacted_via: string | null;   // NEW: email, phone, vapi

  // Reference content
  reference_text: string | null;
  reference_document_url: string | null;

  // Voice AI (Vapi)
  voice_call_id: string | null;
  voice_transcript: string | null;
  voice_summary: string | null;

  // Feedback from reference
  overall_rating: number | null;
  rating: number | null;          // NEW: Alias for overall_rating (1-5)
  feedback: string | null;        // NEW: Reference's feedback
  would_rehire: boolean | null;
  notes: string | null;           // NEW: Internal notes from recruiter
}

// ----------------------------------------------------------------------------
// VERIFICATION EVENTS (Audit Log)
// ----------------------------------------------------------------------------

export interface VerificationEvent {
  id: string;
  candidate_id: string;
  event_type: VerificationEventType;
  old_value: string | null;
  new_value: string | null;
  performed_by: string | null;  // User ID, null if self-service
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type VerificationEventInsert = Omit<VerificationEvent, 'id' | 'created_at'>;

// Verification tier requirements for UI/logic
export const VERIFICATION_REQUIREMENTS = {
  unverified: [],
  basic: ['email_verified', 'cv_uploaded'],
  identity: ['email_verified', 'cv_uploaded', 'id_verified'],
  references: ['email_verified', 'cv_uploaded', 'references_verified_2'],
  verified: ['email_verified', 'cv_uploaded', 'id_verified', 'references_verified_2'],
  premium: ['email_verified', 'cv_uploaded', 'id_verified', 'references_verified_2', 'voice_verified'],
} as const;

// Tier display info
export const VERIFICATION_TIER_INFO: Record<VerificationTier, { label: string; description: string; color: string }> = {
  unverified: { label: 'Unverified', description: 'Just signed up', color: 'gray' },
  basic: { label: 'Basic', description: 'Email verified, CV uploaded', color: 'gray' },
  identity: { label: 'Identity', description: 'ID document verified', color: 'blue' },
  references: { label: 'References', description: '2+ references checked', color: 'green' },
  verified: { label: 'Verified', description: 'ID + references verified', color: 'green' },
  premium: { label: 'Premium', description: 'Full verification', color: 'gold' },
};

// ----------------------------------------------------------------------------
// BRIEFS
// ----------------------------------------------------------------------------

export interface Brief extends BaseEntity {
  source: CommChannel;
  source_identifier: string | null;

  raw_content: string;
  attachments: string[] | null;

  client_id: string | null;
  client_user_id: string | null;

  assigned_agency_id: string | null;
  assigned_user_id: string | null;

  parsed_at: string | null;
  parsed_requirements: JobRequirements | null;
  parsing_confidence: number | null;
  parsing_ambiguities: string[] | null;

  converted_to_job_id: string | null;
  converted_at: string | null;

  status: BriefStatus;

  // AI-parsed structured data
  parsed_data: BriefParsedData | null;

  received_at: string;
}

export type BriefInsert = Omit<Brief, 'id' | 'created_at' | 'updated_at'>;

// ----------------------------------------------------------------------------
// INTERACTIONS
// ----------------------------------------------------------------------------

export interface Interaction extends BaseEntity {
  user_id: string | null;
  agency_id: string | null;

  entity_type: string;
  entity_id: string;

  type: string;
  channel: CommChannel | null;
  direction: 'inbound' | 'outbound' | null;

  subject: string | null;
  content: string | null;

  job_id: string | null;
  submission_id: string | null;

  occurred_at: string;
}

// ----------------------------------------------------------------------------
// MESSAGES
// ----------------------------------------------------------------------------

export interface Message extends BaseEntity {
  job_id: string | null;
  submission_id: string | null;

  from_user_id: string | null;
  from_org_id: string | null;
  to_user_id: string | null;
  to_org_id: string | null;

  content: string;
  attachments: { name: string; url: string; type: string }[] | null;

  read_at: string | null;
}

// ----------------------------------------------------------------------------
// ALERTS
// ----------------------------------------------------------------------------

export interface Alert extends BaseEntity {
  user_id: string | null;
  organization_id: string | null;

  type: string;
  title: string;
  message: string | null;

  entity_type: string | null;
  entity_id: string | null;

  action_url: string | null;
  action_text: string | null;

  priority: 'low' | 'normal' | 'high' | 'urgent';

  read_at: string | null;
  dismissed_at: string | null;
  expires_at: string | null;
}

// ----------------------------------------------------------------------------
// COLLABORATION
// ----------------------------------------------------------------------------

export interface CollaborationRequest extends BaseEntity {
  requesting_agency_id: string;
  requesting_user_id: string;

  type: 'candidate_access' | 'job_share' | 'introduction';

  candidate_id: string | null;
  job_id: string | null;

  owning_agency_id: string;

  proposed_split: string | null;
  message: string | null;

  status: 'pending' | 'approved' | 'rejected' | 'expired';
  responded_at: string | null;
  responded_by: string | null;
  response_message: string | null;

  approved_requesting_share: number | null;
  approved_owning_share: number | null;

  expires_at: string;
}

// ----------------------------------------------------------------------------
// BRIEF PARSED DATA (AI Parser Output)
// ----------------------------------------------------------------------------

export interface BriefParsedData {
  position: string;
  positionCategory: 'deck' | 'interior' | 'galley' | 'engineering' | 'captain' | 'other';
  vessel: {
    name: string | null;
    type: 'motor' | 'sailing' | 'catamaran' | 'explorer' | null;
    sizeMeters: number | null;
  };
  contract: {
    type: 'permanent' | 'rotational' | 'seasonal' | 'temporary' | null;
    rotation: string | null;
    startDate: string | null;
  };
  compensation: {
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
  };
  requirements: {
    minExperience: number | null;
    minYachtSize: number | null;
    certifications: string[];
    languages: string[];
    other: string[];
  };
  location: {
    cruisingAreas: string[];
    base: string | null;
  };
  ambiguities: Array<{
    field: string;
    issue: string;
    suggestedQuestion: string;
  }>;
  confidence: number;
}

// ----------------------------------------------------------------------------
// AI/MATCHING TYPES
// ----------------------------------------------------------------------------

export interface CandidateMatch {
  candidate: CandidateWithRelations;
  match_score: number;
  match_reasoning: string;
  strengths: string[];
  concerns: string[];
}

/** @deprecated Use BriefParsedData instead */
export interface ParsedBrief {
  position: string;
  position_category?: PositionCategory;

  vessel?: {
    name?: string;
    type?: string;
    size_min?: number;
    size_max?: number;
  };

  contract?: {
    type?: ContractType;
    start_date?: string;
    end_date?: string;
    rotation?: string;
  };

  location?: {
    region?: string;
    itinerary?: string;
  };

  compensation?: {
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    benefits?: string;
  };

  requirements?: JobRequirements;

  confidence: number;
  ambiguities: string[];
  raw_text: string;
}

// ----------------------------------------------------------------------------
// API RESPONSE TYPES
// ----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface MatchResponse {
  matches: CandidateMatch[];
  total_candidates_searched: number;
  search_time_ms: number;
}

// ----------------------------------------------------------------------------
// REFERRALS
// ----------------------------------------------------------------------------

export type ReferralStatus = 'pending' | 'signed_up' | 'applied' | 'placed' | 'expired' | 'invalid';

export type ReferralSource = 'link' | 'qr_code' | 'email_share' | 'whatsapp_share' | 'linkedin_share' | 'copy_link';

export type RewardStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export type RewardType = 'signup_bonus' | 'application_bonus' | 'placement_bonus' | 'referred_bonus';

export type RewardTrigger = 'signup' | 'application' | 'placement';

export type PayoutMethod = 'bank_transfer' | 'paypal' | 'revolut' | 'wise' | 'credit';

export interface Referral extends BaseEntity {
  // Who referred
  referrer_id: string;
  referrer_code: string;

  // Who was referred
  referred_id: string | null;
  referred_email: string | null;

  // Status
  status: ReferralStatus;

  // Milestones
  clicked_at: string;
  signed_up_at: string | null;
  first_application_at: string | null;
  placed_at: string | null;

  // Reward tracking (denormalized)
  signup_reward_paid: boolean;
  signup_reward_amount: number | null;
  signup_reward_paid_at: string | null;

  application_reward_paid: boolean;
  application_reward_amount: number | null;
  application_reward_paid_at: string | null;

  placement_reward_paid: boolean;
  placement_reward_amount: number | null;
  placement_reward_paid_at: string | null;

  // Source
  source: ReferralSource;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;

  // Expiry
  expires_at: string;
}

export type ReferralInsert = Omit<Referral, 'id' | 'created_at' | 'updated_at'>;
export type ReferralUpdate = Partial<Pick<Referral, 'referred_id' | 'referred_email' | 'status' | 'signed_up_at' | 'first_application_at' | 'placed_at'>>;

export interface ReferralWithDetails extends Referral {
  referrer?: Candidate;
  referred?: Candidate;
  rewards?: ReferralReward[];
}

export interface ReferralReward extends Omit<BaseEntity, 'updated_at'> {
  referral_id: string;
  candidate_id: string;

  // Reward details
  reward_type: RewardType;
  reward_trigger: RewardTrigger;
  amount: number; // in cents
  currency: string;

  // Status
  status: RewardStatus;
  approved_at: string | null;
  approved_by: string | null;
  paid_at: string | null;
  payout_method: PayoutMethod | null;
  payment_reference: string | null;

  // Meta
  notes: string | null;
}

export type ReferralRewardInsert = Omit<ReferralReward, 'id' | 'created_at'>;
export type ReferralRewardUpdate = Partial<Pick<ReferralReward, 'status' | 'approved_at' | 'approved_by' | 'paid_at' | 'payout_method' | 'payment_reference' | 'notes'>>;

export interface ReferralSettings {
  id: string;

  // Enable/disable
  program_active: boolean;
  program_name: string;
  program_description: string;

  // Reward amounts (in cents)
  signup_reward_referrer: number;
  signup_reward_referred: number;
  application_reward_referrer: number;
  application_reward_referred: number;
  placement_reward_referrer: number;
  placement_reward_referred: number;

  // Limits
  max_referrals_per_month: number;
  max_pending_referrals: number;
  referral_expiry_days: number;
  min_payout_amount: number;

  // Requirements
  referrer_min_tier: VerificationTier;
  referrer_must_be_placed: boolean;
  referred_must_apply_days: number;

  // Anti-fraud
  require_different_email_domain: boolean;
  require_different_ip: boolean;
  cooldown_between_referrals_hours: number;

  updated_at: string;
  updated_by: string | null;
}

export type ReferralSettingsUpdate = Partial<Omit<ReferralSettings, 'id' | 'updated_at'>>;

export interface ReferralStats {
  total_referrals: number;
  signed_up: number;
  applied: number;
  placed: number;
  pending_rewards: number;   // amount in cents
  approved_rewards: number;  // amount in cents
  total_earned: number;      // amount in cents
  referral_code: string | null;
}

// For leaderboard display
export interface ReferralLeaderboardEntry {
  candidate_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  referral_code: string;
  total_referrals: number;
  placed_referrals: number;
  total_earned: number; // in cents
}

// For admin payout management
export interface PendingPayout {
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  approved_amount: number;  // in cents, ready to pay
  pending_amount: number;   // in cents, awaiting approval
  pending_rewards_count: number;
}

// ----------------------------------------------------------------------------
// BILLING & SUBSCRIPTIONS
// ----------------------------------------------------------------------------

export type BillingCycle = 'monthly' | 'yearly';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'void' | 'uncollectible';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type PlacementFeeStatus = 'pending' | 'invoiced' | 'paid' | 'waived';

export type InvoiceItemType = 'subscription' | 'placement_fee' | 'addon' | 'credit';

export type PaymentMethod = 'card' | 'sepa_debit' | 'bank_transfer';

// Available plan features
export type PlanFeature =
  | 'basic_search'
  | 'ai_matching'
  | 'client_portal'
  | 'whatsapp_integration'
  | 'api_access'
  | 'white_label'
  | 'priority_support'
  | 'dedicated_support'
  | 'manual_matching';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number; // in cents
  price_yearly: number; // in cents
  currency: string;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  stripe_product_id: string | null;
  max_candidates: number | null; // null = unlimited
  max_active_jobs: number | null;
  max_team_members: number | null;
  max_placements_per_month: number | null;
  features: PlanFeature[];
  placement_fee_percent: number;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlanInsert = Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>;
export type SubscriptionPlanUpdate = Partial<SubscriptionPlanInsert>;

export interface AgencySubscription {
  id: string;
  agency_id: string;
  plan_id: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  candidates_count: number;
  active_jobs_count: number;
  placements_count: number;
  created_at: string;
  updated_at: string;
}

export type AgencySubscriptionInsert = Omit<AgencySubscription, 'id' | 'created_at' | 'updated_at'>;
export type AgencySubscriptionUpdate = Partial<AgencySubscriptionInsert>;

// Subscription with joined plan
export interface AgencySubscriptionWithPlan extends AgencySubscription {
  plan: SubscriptionPlan;
}

export interface Invoice {
  id: string;
  agency_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number; // in cents
  tax_amount: number;
  tax_percent: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_address: BillingAddress | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
export type InvoiceUpdate = Partial<InvoiceInsert>;

// Invoice with line items
export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  item_type: InvoiceItemType;
  quantity: number;
  unit_amount: number; // in cents
  amount: number; // quantity * unit_amount
  currency: string;
  placement_id: string | null;
  subscription_id: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export type InvoiceItemInsert = Omit<InvoiceItem, 'id' | 'created_at'>;

export interface Payment {
  id: string;
  agency_id: string;
  invoice_id: string | null;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_method_details: PaymentMethodDetails | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  created_at: string;
  succeeded_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>;
export type PaymentUpdate = Partial<PaymentInsert>;

export interface PaymentMethodDetails {
  brand?: string; // visa, mastercard, etc.
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  bank_name?: string; // for sepa_debit
  iban_last4?: string; // for sepa_debit
}

export interface PlacementFee {
  id: string;
  placement_id: string;
  agency_id: string;
  invoice_id: string | null;
  placement_value: number; // in cents
  fee_percent: number;
  platform_fee: number; // calculated platform cut in cents
  currency: string;
  status: PlacementFeeStatus;
  placement_date: string;
  invoiced_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export type PlacementFeeInsert = Omit<PlacementFee, 'id' | 'created_at'>;
export type PlacementFeeUpdate = Partial<PlacementFeeInsert>;

// Placement fee with related placement data
export interface PlacementFeeWithDetails extends PlacementFee {
  placement?: Placement;
  invoice?: Invoice;
}

export interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// Usage stats for billing UI
export interface SubscriptionUsage {
  candidates: { used: number; limit: number | null };
  active_jobs: { used: number; limit: number | null };
  team_members: { used: number; limit: number | null };
  placements_this_month: { used: number; limit: number | null };
}

// Billing overview for dashboard
export interface BillingOverview {
  subscription: AgencySubscriptionWithPlan | null;
  usage: SubscriptionUsage;
  current_invoice: Invoice | null;
  recent_invoices: Invoice[];
  pending_placement_fees: PlacementFee[];
  total_pending_fees: number; // in cents
}

// =============================================================================
// Employer Portal Types
// =============================================================================

// Employer account tier
export type EmployerAccountTier = "basic" | "verified" | "premium";

// Employer vetting status
export type EmployerVettingStatus = "pending" | "scheduled" | "completed" | "rejected";

// Employer hiring type
export type EmployerHiringFor = "yacht" | "household" | "both";

// Employer account
export interface EmployerAccount {
  id: string;
  email: string;
  contact_name: string;
  phone: string | null;
  company_name: string | null;
  // What they're hiring for
  hiring_for: EmployerHiringFor | null;
  vessel_name: string | null;
  vessel_type: string | null;
  vessel_size_meters: number | null;
  property_type: string | null;
  property_location: string | null;
  positions_needed: string[] | null;
  timeline: string | null;
  // Access control
  tier: EmployerAccountTier;
  vetting_status: EmployerVettingStatus;
  vetted_at: string | null;
  vetted_by: string | null;
  // Magic link auth
  magic_token: string | null;
  magic_token_expires_at: string | null;
  last_login_at: string | null;
  // Assignment
  assigned_agency_id: string | null;
  assigned_recruiter_id: string | null;
  // Tracking
  source_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Employer account for insert
export interface EmployerAccountInsert {
  email: string;
  contact_name: string;
  phone?: string | null;
  company_name?: string | null;
  hiring_for?: EmployerHiringFor | null;
  vessel_name?: string | null;
  vessel_type?: string | null;
  vessel_size_meters?: number | null;
  property_type?: string | null;
  property_location?: string | null;
  positions_needed?: string[] | null;
  timeline?: string | null;
  tier?: EmployerAccountTier;
  vetting_status?: EmployerVettingStatus;
  source_url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

// Employer account for update
export interface EmployerAccountUpdate {
  contact_name?: string;
  phone?: string | null;
  company_name?: string | null;
  hiring_for?: EmployerHiringFor | null;
  vessel_name?: string | null;
  vessel_type?: string | null;
  vessel_size_meters?: number | null;
  property_type?: string | null;
  property_location?: string | null;
  positions_needed?: string[] | null;
  timeline?: string | null;
  tier?: EmployerAccountTier;
  vetting_status?: EmployerVettingStatus;
  vetted_at?: string | null;
  vetted_by?: string | null;
  magic_token?: string | null;
  magic_token_expires_at?: string | null;
  last_login_at?: string | null;
  assigned_agency_id?: string | null;
  assigned_recruiter_id?: string | null;
}

// Employer session
export interface EmployerSession {
  id: string;
  employer_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

// Employer session with account data (returned from validate_employer_session)
export interface EmployerSessionWithAccount {
  employer_id: string;
  email: string;
  contact_name: string;
  company_name: string | null;
  tier: EmployerAccountTier;
  vetting_status: EmployerVettingStatus;
}

// =============================================================================
// Employer Briefs Types
// =============================================================================

// Brief status
export type EmployerBriefStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "matching"
  | "shortlisted"
  | "closed";

// Brief candidate status (employer's decision)
export type EmployerBriefCandidateStatus =
  | "pending"
  | "interested"
  | "not_interested"
  | "interview_requested";

// Employer brief
export interface EmployerBrief {
  id: string;
  employer_id: string;
  title: string;
  hiring_for: EmployerHiringFor;
  // Vessel details
  vessel_name: string | null;
  vessel_type: string | null;
  vessel_size_meters: number | null;
  // Property details
  property_type: string | null;
  property_location: string | null;
  // Position requirements
  positions_needed: string[];
  experience_years_min: number | null;
  certifications_required: string[] | null;
  languages_required: string[] | null;
  additional_requirements: string | null;
  // Timeline and contract
  timeline: string | null;
  contract_type: string | null;
  start_date: string | null;
  // Status and tracking
  status: EmployerBriefStatus;
  candidates_matched: number;
  // Internal notes
  notes: string | null;
  // Assignment
  assigned_recruiter_id: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Employer brief for insert
export interface EmployerBriefInsert {
  employer_id: string;
  title: string;
  hiring_for: EmployerHiringFor;
  vessel_name?: string | null;
  vessel_type?: string | null;
  vessel_size_meters?: number | null;
  property_type?: string | null;
  property_location?: string | null;
  positions_needed: string[];
  experience_years_min?: number | null;
  certifications_required?: string[] | null;
  languages_required?: string[] | null;
  additional_requirements?: string | null;
  timeline?: string | null;
  contract_type?: string | null;
  start_date?: string | null;
  status?: EmployerBriefStatus;
  notes?: string | null;
  assigned_recruiter_id?: string | null;
}

// Employer brief for update
export interface EmployerBriefUpdate {
  title?: string;
  hiring_for?: EmployerHiringFor;
  vessel_name?: string | null;
  vessel_type?: string | null;
  vessel_size_meters?: number | null;
  property_type?: string | null;
  property_location?: string | null;
  positions_needed?: string[];
  experience_years_min?: number | null;
  certifications_required?: string[] | null;
  languages_required?: string[] | null;
  additional_requirements?: string | null;
  timeline?: string | null;
  contract_type?: string | null;
  start_date?: string | null;
  status?: EmployerBriefStatus;
  candidates_matched?: number;
  notes?: string | null;
  assigned_recruiter_id?: string | null;
}

// Employer brief candidate (shortlist entry)
export interface EmployerBriefCandidate {
  id: string;
  brief_id: string;
  candidate_id: string;
  match_score: number | null;
  match_reasons: string[] | null;
  employer_status: EmployerBriefCandidateStatus;
  employer_notes: string | null;
  employer_feedback_at: string | null;
  internal_notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

// Brief with related data
export interface EmployerBriefWithCandidates extends EmployerBrief {
  candidates?: EmployerBriefCandidate[];
}

// Brief candidate with candidate details
export interface EmployerBriefCandidateWithDetails extends EmployerBriefCandidate {
  candidate?: Candidate;
}
