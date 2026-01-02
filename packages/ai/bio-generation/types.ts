// ============================================================================
// BIO GENERATION TYPES
// ============================================================================
// Types for AI-powered candidate bio generation
// ============================================================================

import type {
  PositionExtracted,
  YachtExperience,
  VillaExperience,
  CertificationDetail,
  LicenseDetail,
  EducationDetail,
  ReferenceDetail,
  LanguageDetail,
} from '../cv-extraction/types';

// ----------------------------------------------------------------------------
// BIO GENERATION REQUEST
// ----------------------------------------------------------------------------

export interface BioGenerationCandidate {
  // Core identity
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  nationality?: string | null;

  // Position info
  primary_position?: string | null;
  years_experience?: number | null;

  // Extracted CV data
  positions_held?: PositionExtracted[] | null;
  yacht_experience_extracted?: YachtExperience[] | null;
  villa_experience_extracted?: VillaExperience[] | null;
  certifications_extracted?: CertificationDetail[] | null;
  licenses_extracted?: LicenseDetail[] | null;
  education_extracted?: EducationDetail[] | null;
  references_extracted?: ReferenceDetail[] | null;
  languages_extracted?: LanguageDetail[] | null;
  cv_skills?: string[] | null;

  // Existing summaries (for context)
  profile_summary?: string | null;

  // Key flags
  highest_license?: string | null;
  has_stcw?: boolean;
  has_eng1?: boolean;
}

export interface BioGenerationRequest {
  candidate: BioGenerationCandidate;
}

// ----------------------------------------------------------------------------
// BIO GENERATION RESULT
// ----------------------------------------------------------------------------

export interface BioGenerationResult {
  /** Complete 5-paragraph bio with candidate name */
  bio_full: string;

  /** Confidence score 0-1 for the generation quality */
  generation_confidence: number;

  /** Any warnings or notes about the generation */
  generation_notes?: string[];
}

// ----------------------------------------------------------------------------
// BIO VERSION
// ----------------------------------------------------------------------------

/**
 * Current version of the bio generation algorithm.
 * Increment when making significant prompt changes to track
 * which candidates need regeneration.
 */
export const BIO_GENERATION_VERSION = 1;
