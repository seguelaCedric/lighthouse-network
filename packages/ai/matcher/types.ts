/**
 * Matcher Types
 *
 * Type definitions for the AI matching system, including
 * permission-scoped result types for different audiences.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface MatchBreakdown {
  qualifications: number;  // 25 points
  experience: number;      // 25 points
  availability: number;    // 15 points
  preferences: number;     // 15 points
  verification: number;    // 10 points
  aiAssessment: number;    // 10 points
}

export type UserType = 'recruiter' | 'client' | 'candidate';
export type Visibility = 'public' | 'client' | 'recruiter';

// ============================================================================
// CANDIDATE DATA (full, internal)
// ============================================================================

export interface CandidateData {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;

  // Position
  primary_position?: string;
  secondary_positions?: string[];
  years_experience?: number;

  // Location/Nationality
  nationality?: string;
  second_nationality?: string;
  current_location?: string;

  // Certifications
  has_stcw: boolean;
  stcw_expiry?: string;
  has_eng1: boolean;
  eng1_expiry?: string;
  highest_license?: string;

  // Visas
  has_schengen: boolean;
  has_b1b2: boolean;
  has_c1d: boolean;
  other_visas?: string[];

  // Availability
  availability_status: 'available' | 'looking' | 'employed' | 'unavailable';
  available_from?: string;

  // Preferences
  preferred_yacht_types?: string[];
  preferred_yacht_size_min?: number;
  preferred_yacht_size_max?: number;
  preferred_regions?: string[];
  preferred_contract_types?: string[];
  desired_salary_min?: number;
  desired_salary_max?: number;

  // Personal
  is_smoker?: boolean;
  has_visible_tattoos?: boolean;
  is_couple: boolean;
  partner_position?: string;

  // Verification
  verification_tier: 'basic' | 'identity' | 'verified' | 'premium';

  // AI
  profile_summary?: string;
  embedding_text?: string;

  // Stats (for recruiter)
  references_count?: number;
  average_reference_rating?: number;
}

// ============================================================================
// RECRUITER MATCH RESULT (full access)
// ============================================================================

export interface RecruiterMatchResult {
  candidateId: string;
  candidate: CandidateData;

  // Scores
  score: number;
  breakdown: MatchBreakdown;

  // AI assessment (full)
  aiAssessment: {
    fitScore: number;
    strengths: string[];
    concerns: string[];
    redFlags: string[];
    summary: string;
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  };

  // Match metadata
  matchConfidence: 'high' | 'medium' | 'low';
  requiresHumanReview: boolean;
  reviewReasons?: string[];

  // Recruiter-only fields
  contactInfo: {
    email?: string;
    phone?: string;
  };
  referencesSummary?: {
    count: number;
    averageRating?: number;
    highlights?: string[];
  };
  interviewNotes?: string;
  internalNotes?: string;
}

// ============================================================================
// CLIENT MATCH RESULT (sanitized for self-serve portal)
// ============================================================================

export interface ClientMatchResult {
  candidateId: string;

  // Basic info only
  candidate: {
    firstName: string;
    lastName: string;  // Initial only for privacy
    position: string;
    yearsExperience?: number;
    nationality?: string;
    verificationTier: 'basic' | 'identity' | 'verified' | 'premium';
    availability: string;
  };

  // Simplified scores
  matchScore: number;  // 0-100
  matchLevel: 'excellent' | 'good' | 'fair';  // Simplified tier

  // Sanitized assessment (no red flags or concerns)
  summary: string;  // Positive-focused AI summary
  keyStrengths: string[];  // Top 3 strengths only

  // Certifications (verified only)
  certifications: {
    hasSTCW: boolean;
    hasENG1: boolean;
    license?: string;
  };

  // Visas (important for region)
  visas: {
    schengen: boolean;
    usVisa: boolean;
  };

  // Reference badge (not details)
  hasVerifiedReferences: boolean;
  referenceRating?: 'excellent' | 'good' | 'satisfactory';
}

// ============================================================================
// PUBLIC MATCH RESULT (for job board listings)
// ============================================================================

export interface PublicMatchResult {
  candidateId: string;

  // Very limited info
  candidate: {
    position: string;
    experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
    region?: string;  // General region preference
    verificationBadge: 'verified' | 'premium' | null;
  };

  // Match indication only
  matchLevel: 'strong' | 'good' | 'potential';

  // Single-line summary
  summary: string;
}

// ============================================================================
// JOB DATA
// ============================================================================

export interface JobData {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  position_category?: string;
  vessel_type?: string;
  vessel_size_meters?: number;
  vessel_name?: string;
  contract_type?: string;
  start_date?: string;
  primary_region?: string;
  salary_min?: number;
  salary_max?: number;

  // Structured requirements
  job_requirements?: {
    experience_years_min?: number;
    certifications_required?: string[];
    certifications_preferred?: string[];
    visas_required?: string[];
    languages_required?: string[];
    languages_preferred?: string[];
    non_smoker?: boolean;
    no_visible_tattoos?: boolean;
    couple_acceptable?: boolean;
  };
}

// ============================================================================
// MATCHING OPTIONS
// ============================================================================

export interface MatchingOptions {
  // Basic options
  limit?: number;
  minScore?: number;

  // Feature flags
  includeAIAssessment?: boolean;
  useCohere?: boolean;

  // Filters
  verificationTiers?: Array<'basic' | 'identity' | 'verified' | 'premium'>;
  positionCategories?: string[];
  excludeCandidateIds?: string[];

  // Hard requirements (pass/fail)
  requireSTCW?: boolean;
  requireENG1?: boolean;
  requireSchengen?: boolean;
  requireUSVisa?: boolean;
  minExperience?: number;

  // Output format
  outputType?: UserType;  // Determines sanitization level
}

export interface MatchingMetadata {
  jobId: string;
  totalCandidatesSearched: number;
  candidatesAfterFilters: number;
  candidatesReranked: number;
  candidatesReturned: number;
  processingTimeMs: number;
  stages: {
    vectorSearchMs: number;
    filteringMs: number;
    rerankingMs: number;
    aiAssessmentMs: number;
    sanitizationMs: number;
  };
  cohereUsed: boolean;
  embeddingModel: string;
}
