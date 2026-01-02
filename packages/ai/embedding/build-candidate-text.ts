/**
 * Unified Embedding Text Builder
 *
 * Builds a comprehensive text representation of a candidate by combining:
 * 1. Structured profile data (position, experience, certifications, visas)
 * 2. CV/Resume text
 * 3. Certificate descriptions
 * 4. Interview notes (recruiter-visible)
 * 5. Reference summaries (verified references only)
 *
 * This unified text is used for:
 * - Generating embeddings for semantic search
 * - Full-text search indexing
 * - AI matching context
 *
 * The builder respects visibility controls - different text versions
 * are generated for different audiences (recruiter vs client).
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CandidateProfile {
  first_name: string;
  last_name: string;
  primary_position?: string;
  secondary_positions?: string[];
  years_experience?: number;
  nationality?: string;
  second_nationality?: string;
  current_location?: string;

  // Certifications
  has_stcw?: boolean;
  stcw_expiry?: string;
  has_eng1?: boolean;
  eng1_expiry?: string;
  highest_license?: string;

  // Visas
  has_schengen?: boolean;
  has_b1b2?: boolean;
  has_c1d?: boolean;
  other_visas?: string[];

  // Preferences
  preferred_yacht_types?: string[];
  preferred_yacht_size_min?: number;
  preferred_yacht_size_max?: number;
  preferred_regions?: string[];
  preferred_contract_types?: string[];

  // Personal
  is_smoker?: boolean;
  has_visible_tattoos?: boolean;
  is_couple?: boolean;
  partner_position?: string;

  // AI-generated
  profile_summary?: string;
  search_keywords?: string[];
}

export interface CandidateDocument {
  type: 'cv' | 'certificate' | 'written_reference' | 'id_document' | 'other';
  name?: string;
  extracted_text?: string;
  visibility: 'public' | 'client' | 'recruiter';
}

export interface CandidateInterviewNote {
  note_type: 'interview' | 'verbal_reference' | 'phone_screen' | 'client_feedback' | 'general';
  title?: string;
  content: string;
  summary?: string;
  visibility: 'public' | 'client' | 'recruiter';
  include_in_embedding: boolean;
}

export interface CandidateReference {
  referee_name?: string;
  relationship?: string;
  reference_text?: string;
  voice_summary?: string;
  overall_rating?: number;
  would_rehire?: boolean;
  is_verified: boolean;
}

export type Visibility = 'public' | 'client' | 'recruiter';

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build unified embedding text for a candidate
 *
 * @param profile - Structured candidate profile data
 * @param documents - Associated documents (CV, certificates, etc.)
 * @param notes - Interview notes and feedback
 * @param references - Verified references
 * @param visibility - Which audience to build for (affects what's included)
 * @returns Unified text ready for embedding generation
 */
export function buildCandidateEmbeddingText(
  profile: CandidateProfile,
  documents: CandidateDocument[] = [],
  notes: CandidateInterviewNote[] = [],
  references: CandidateReference[] = [],
  visibility: Visibility = 'recruiter'
): string {
  const sections: string[] = [];

  // ============ SECTION 1: PROFILE SUMMARY ============
  sections.push(buildProfileSection(profile));

  // ============ SECTION 2: CV/RESUME ============
  const cv = documents.find(d => d.type === 'cv' && isVisible(d.visibility, visibility));
  if (cv?.extracted_text) {
    sections.push(`\n## CV/RESUME\n${truncateText(cv.extracted_text, 4000)}`);
  }

  // ============ SECTION 3: CERTIFICATES ============
  const certificates = documents.filter(
    d => d.type === 'certificate' && isVisible(d.visibility, visibility)
  );
  if (certificates.length > 0) {
    const certTexts = certificates
      .map(c => c.name || c.extracted_text?.slice(0, 100))
      .filter(Boolean)
      .join(', ');
    if (certTexts) {
      sections.push(`\n## CERTIFICATES\n${certTexts}`);
    }
  }

  // ============ SECTION 4: INTERVIEW NOTES (recruiter only) ============
  if (visibility === 'recruiter') {
    const relevantNotes = notes.filter(
      n => n.include_in_embedding && isVisible(n.visibility, visibility)
    );
    if (relevantNotes.length > 0) {
      const notesText = relevantNotes
        .map(n => n.summary || truncateText(n.content, 500))
        .join('\n\n');
      sections.push(`\n## INTERVIEW NOTES\n${notesText}`);
    }
  }

  // ============ SECTION 5: REFERENCES ============
  const verifiedRefs = references.filter(r => r.is_verified);
  if (verifiedRefs.length > 0) {
    // For client/public visibility, only include high-level summary
    if (visibility === 'recruiter') {
      const refsText = verifiedRefs
        .map(r => {
          const parts = [];
          if (r.referee_name && r.relationship) {
            parts.push(`${r.referee_name} (${r.relationship})`);
          }
          if (r.overall_rating) {
            parts.push(`Rating: ${r.overall_rating}/5`);
          }
          if (r.would_rehire !== undefined) {
            parts.push(r.would_rehire ? 'Would rehire: Yes' : 'Would rehire: No');
          }
          if (r.voice_summary) {
            parts.push(truncateText(r.voice_summary, 300));
          } else if (r.reference_text) {
            parts.push(truncateText(r.reference_text, 300));
          }
          return parts.join(' - ');
        })
        .join('\n');
      sections.push(`\n## VERIFIED REFERENCES\n${refsText}`);
    } else {
      // Client/public: just mention verified reference count
      const avgRating = verifiedRefs.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / verifiedRefs.length;
      sections.push(`\n## REFERENCES\n${verifiedRefs.length} verified references${avgRating > 0 ? `, average rating ${avgRating.toFixed(1)}/5` : ''}`);
    }
  }

  // ============ SECTION 6: KEYWORDS ============
  if (profile.search_keywords?.length) {
    sections.push(`\n## KEYWORDS\n${profile.search_keywords.join(', ')}`);
  }

  return sections.join('\n').trim();
}

// ============================================================================
// SECTION BUILDERS
// ============================================================================

function buildProfileSection(profile: CandidateProfile): string {
  const parts: string[] = [];

  // Position (most important for matching)
  if (profile.primary_position) {
    parts.push(`POSITION: ${profile.primary_position}`);
  }
  if (profile.secondary_positions?.length) {
    parts.push(`ALSO QUALIFIED: ${profile.secondary_positions.join(', ')}`);
  }

  // Experience
  if (profile.years_experience) {
    parts.push(`EXPERIENCE: ${profile.years_experience} years in yachting`);
  }

  // Location/Nationality
  if (profile.nationality) {
    const nat = profile.second_nationality
      ? `${profile.nationality} / ${profile.second_nationality}`
      : profile.nationality;
    parts.push(`NATIONALITY: ${nat}`);
  }
  if (profile.current_location) {
    parts.push(`LOCATION: ${profile.current_location}`);
  }

  // Certifications
  const certs: string[] = [];
  if (profile.has_stcw) {
    certs.push(`STCW${profile.stcw_expiry ? ` (exp: ${profile.stcw_expiry})` : ''}`);
  }
  if (profile.has_eng1) {
    certs.push(`ENG1${profile.eng1_expiry ? ` (exp: ${profile.eng1_expiry})` : ''}`);
  }
  if (profile.highest_license) {
    certs.push(profile.highest_license);
  }
  if (certs.length > 0) {
    parts.push(`CERTIFICATIONS: ${certs.join(', ')}`);
  }

  // Visas
  const visas: string[] = [];
  if (profile.has_schengen) visas.push('Schengen');
  if (profile.has_b1b2) visas.push('B1/B2');
  if (profile.has_c1d) visas.push('C1/D');
  if (profile.other_visas?.length) visas.push(...profile.other_visas);
  if (visas.length > 0) {
    parts.push(`VISAS: ${visas.join(', ')}`);
  }

  // Preferences
  if (profile.preferred_yacht_types?.length) {
    parts.push(`YACHT TYPES: ${profile.preferred_yacht_types.join(', ')}`);
  }
  if (profile.preferred_yacht_size_min || profile.preferred_yacht_size_max) {
    const min = profile.preferred_yacht_size_min || 0;
    const max = profile.preferred_yacht_size_max || '∞';
    parts.push(`YACHT SIZE: ${min}m - ${max}m`);
  }
  if (profile.preferred_regions?.length) {
    parts.push(`REGIONS: ${profile.preferred_regions.join(', ')}`);
  }
  if (profile.preferred_contract_types?.length) {
    parts.push(`CONTRACT: ${profile.preferred_contract_types.join(', ')}`);
  }

  // Personal requirements often used in matching
  if (profile.is_smoker === false) {
    parts.push('NON-SMOKER: Yes');
  }
  if (profile.has_visible_tattoos === false) {
    parts.push('NO VISIBLE TATTOOS: Yes');
  }
  if (profile.is_couple) {
    parts.push(`COUPLE: Yes${profile.partner_position ? `, partner is ${profile.partner_position}` : ''}`);
  }

  // AI-generated summary (if available)
  if (profile.profile_summary) {
    parts.push(`\nSUMMARY: ${profile.profile_summary}`);
  }

  return `## PROFILE\n${parts.join('\n')}`;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if content at a given visibility level should be included
 * for the target visibility
 */
function isVisible(contentVisibility: Visibility, targetVisibility: Visibility): boolean {
  const hierarchy: Visibility[] = ['public', 'client', 'recruiter'];
  const contentLevel = hierarchy.indexOf(contentVisibility);
  const targetLevel = hierarchy.indexOf(targetVisibility);
  // Content is visible if it's at or below the target level
  // e.g., 'public' content is visible to everyone
  // 'recruiter' content is only visible to recruiters
  return contentLevel <= targetLevel;
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Find last space before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Estimate token count for OpenAI embedding model
 * text-embedding-3-small has 8191 token limit
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Check if text is within embedding token limits
 */
export function isWithinTokenLimit(text: string, maxTokens = 8000): boolean {
  return estimateTokens(text) <= maxTokens;
}

// ============================================================================
// CLIENT-SAFE VERSION
// ============================================================================

/**
 * Build embedding text safe for client/self-serve portal
 * Excludes recruiter-only information (interview notes, raw references)
 */
export function buildClientSafeEmbeddingText(
  profile: CandidateProfile,
  documents: CandidateDocument[] = [],
  references: CandidateReference[] = []
): string {
  return buildCandidateEmbeddingText(
    profile,
    documents.filter(d => d.visibility !== 'recruiter'),
    [], // No interview notes for clients
    references,
    'client'
  );
}

// ============================================================================
// JOB EMBEDDING TEXT
// ============================================================================

export interface JobProfile {
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

/**
 * Build embedding text for a job posting
 */
export function buildJobEmbeddingText(job: JobProfile): string {
  const parts: string[] = [];

  // Position (most important)
  parts.push(`POSITION: ${job.title}`);
  if (job.position_category) {
    parts.push(`DEPARTMENT: ${job.position_category}`);
  }

  // Vessel
  if (job.vessel_type) {
    parts.push(`VESSEL TYPE: ${job.vessel_type}`);
  }
  if (job.vessel_size_meters) {
    parts.push(`VESSEL SIZE: ${job.vessel_size_meters}m`);
  }
  if (job.vessel_name) {
    parts.push(`VESSEL: ${job.vessel_name}`);
  }

  // Contract
  if (job.contract_type) {
    parts.push(`CONTRACT: ${job.contract_type}`);
  }
  if (job.start_date) {
    parts.push(`START DATE: ${job.start_date}`);
  }

  // Location
  if (job.primary_region) {
    parts.push(`REGION: ${job.primary_region}`);
  }

  // Compensation
  if (job.salary_min || job.salary_max) {
    const salaryStr = job.salary_min && job.salary_max
      ? `€${job.salary_min} - €${job.salary_max}`
      : job.salary_min
        ? `From €${job.salary_min}`
        : `Up to €${job.salary_max}`;
    parts.push(`SALARY: ${salaryStr}/month`);
  }

  // Structured requirements
  const req = job.job_requirements;
  if (req) {
    if (req.experience_years_min) {
      parts.push(`EXPERIENCE REQUIRED: ${req.experience_years_min}+ years`);
    }
    if (req.certifications_required?.length) {
      parts.push(`CERTIFICATIONS REQUIRED: ${req.certifications_required.join(', ')}`);
    }
    if (req.certifications_preferred?.length) {
      parts.push(`CERTIFICATIONS PREFERRED: ${req.certifications_preferred.join(', ')}`);
    }
    if (req.visas_required?.length) {
      parts.push(`VISAS REQUIRED: ${req.visas_required.join(', ')}`);
    }
    if (req.languages_required?.length) {
      parts.push(`LANGUAGES REQUIRED: ${req.languages_required.join(', ')}`);
    }
    if (req.languages_preferred?.length) {
      parts.push(`LANGUAGES PREFERRED: ${req.languages_preferred.join(', ')}`);
    }
    if (req.non_smoker) {
      parts.push('NON-SMOKER: Required');
    }
    if (req.no_visible_tattoos) {
      parts.push('NO VISIBLE TATTOOS: Required');
    }
    if (req.couple_acceptable === false) {
      parts.push('COUPLES: Not accepted');
    } else if (req.couple_acceptable === true) {
      parts.push('COUPLES: Welcome');
    }
  }

  // Full description
  if (job.description) {
    parts.push(`\nDESCRIPTION:\n${truncateText(job.description, 2000)}`);
  }

  // Requirements text
  if (job.requirements) {
    parts.push(`\nREQUIREMENTS:\n${truncateText(job.requirements, 1000)}`);
  }

  return parts.join('\n');
}
