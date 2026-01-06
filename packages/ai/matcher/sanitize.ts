/**
 * Permission-Scoped Output Sanitization
 *
 * Transforms full match results into permission-appropriate outputs
 * for different user types:
 *
 * - Recruiter: Full access (contacts, notes, raw references, concerns)
 * - Client: Limited access (no contacts, sanitized assessments, verified info only)
 * - Public: Minimal access (anonymous, match level only)
 *
 * This prevents self-serve clients from getting the same depth of
 * information that would cannibalize the agency recruitment business.
 */

import {
  CandidateData,
  RecruiterMatchResult,
  ClientMatchResult,
  PublicMatchResult,
  MatchBreakdown,
  UserType,
} from './types';

// ============================================================================
// MAIN SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize match result for the target user type
 */
export function sanitizeMatchResult(
  result: RecruiterMatchResult,
  userType: UserType
): RecruiterMatchResult | ClientMatchResult | PublicMatchResult {
  switch (userType) {
    case 'recruiter':
      return result; // Full access

    case 'client':
      return sanitizeForClient(result);

    case 'candidate':
    default:
      return sanitizeForPublic(result);
  }
}

/**
 * Batch sanitize multiple results
 */
export function sanitizeMatchResults(
  results: RecruiterMatchResult[],
  userType: UserType
): Array<RecruiterMatchResult | ClientMatchResult | PublicMatchResult> {
  return results.map(result => sanitizeMatchResult(result, userType));
}

// ============================================================================
// CLIENT SANITIZATION
// ============================================================================

/**
 * Sanitize for self-serve client portal
 *
 * Rules:
 * - No contact info (must go through recruiter)
 * - No raw reference content (just verified badge)
 * - No internal notes or concerns
 * - Simplified scoring (no breakdown)
 * - Positive-focused summary
 */
function sanitizeForClient(result: RecruiterMatchResult): ClientMatchResult {
  const candidate = result.candidate;

  // Convert score to match level
  const matchLevel = getMatchLevel(result.score);

  // Sanitize AI summary to be positive-focused
  const sanitizedSummary = sanitizeSummaryForClient(
    result.aiAssessment.summary,
    result.aiAssessment.strengths
  );

  // Get top 3 strengths only
  const keyStrengths = result.aiAssessment.strengths.slice(0, 3);

  // Convert reference data to rating badge
  const referenceRating = getReferenceRating(result.referencesSummary);

  return {
    candidateId: result.candidateId,

    candidate: {
      firstName: candidate.first_name,
      lastName: candidate.last_name.charAt(0) + '.', // Privacy: initial only
      position: candidate.primary_position || 'Not specified',
      yearsExperience: candidate.years_experience,
      nationality: candidate.nationality,
      verificationTier: candidate.verification_tier,
      availability: formatAvailability(candidate.availability_status, candidate.available_from),
    },

    matchScore: result.score,
    matchLevel,

    summary: sanitizedSummary,
    keyStrengths,

    certifications: {
      hasSTCW: candidate.has_stcw,
      hasENG1: candidate.has_eng1,
      license: candidate.highest_license,
    },

    visas: {
      schengen: candidate.has_schengen,
      usVisa: candidate.has_b1b2 || candidate.has_c1d,
    },

    hasVerifiedReferences: (result.referencesSummary?.count || 0) > 0,
    referenceRating,
  };
}

// ============================================================================
// PUBLIC SANITIZATION
// ============================================================================

/**
 * Sanitize for public job board / anonymous viewing
 *
 * Rules:
 * - No names
 * - No contact info
 * - No detailed certifications
 * - Generic experience level only
 * - Single-line generic summary
 */
function sanitizeForPublic(result: RecruiterMatchResult): PublicMatchResult {
  const candidate = result.candidate;

  // Convert years to experience level
  const experienceLevel = getExperienceLevel(candidate.years_experience);

  // Generic match level
  const matchLevel = getPublicMatchLevel(result.score);

  // Very generic summary
  const summary = generatePublicSummary(candidate, result.score);

  return {
    candidateId: result.candidateId,

    candidate: {
      position: candidate.primary_position || 'Crew member',
      experienceLevel,
      region: getGeneralRegion(candidate.preferred_regions),
      verificationBadge: getVerificationBadge(candidate.verification_tier),
    },

    matchLevel,
    summary,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMatchLevel(score: number): 'excellent' | 'good' | 'fair' {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  return 'fair';
}

function getPublicMatchLevel(score: number): 'strong' | 'good' | 'potential' {
  if (score >= 75) return 'strong';
  if (score >= 60) return 'good';
  return 'potential';
}

function getExperienceLevel(years?: number): 'junior' | 'mid' | 'senior' | 'expert' {
  if (!years || years < 2) return 'junior';
  if (years < 5) return 'mid';
  if (years < 10) return 'senior';
  return 'expert';
}

function getVerificationBadge(tier: string): 'verified' | 'premium' | null {
  if (tier === 'premium') return 'premium';
  if (tier === 'verified') return 'verified';
  return null;
}

function getReferenceRating(
  refs?: { count: number; averageRating?: number }
): 'excellent' | 'good' | 'satisfactory' | undefined {
  if (!refs || refs.count === 0) return undefined;
  const avg = refs.averageRating || 0;
  if (avg >= 4.5) return 'excellent';
  if (avg >= 3.5) return 'good';
  return 'satisfactory';
}

function formatAvailability(status: string, from?: string): string {
  if (status === 'available') {
    return 'Immediately available';
  }
  if (status === 'looking' && from) {
    const date = new Date(from);
    return `Available from ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }
  if (status === 'looking') {
    return 'Actively looking';
  }
  return 'Currently employed';
}

function getGeneralRegion(regions?: string[]): string | undefined {
  if (!regions || regions.length === 0) return undefined;

  // Map specific regions to general areas
  const regionMap: Record<string, string> = {
    'mediterranean': 'Europe',
    'caribbean': 'Americas',
    'florida': 'Americas',
    'bahamas': 'Americas',
    'new england': 'Americas',
    'pacific': 'Asia-Pacific',
    'asia': 'Asia-Pacific',
    'middle east': 'Middle East',
    'global': 'Worldwide',
  };

  for (const region of regions) {
    const lower = region.toLowerCase();
    for (const [key, value] of Object.entries(regionMap)) {
      if (lower.includes(key)) {
        return value;
      }
    }
  }

  return regions[0]; // Fallback to first region
}

/**
 * Sanitize AI summary for clients
 * Remove concerns, red flags, and negative language
 */
function sanitizeSummaryForClient(summary: string, strengths: string[]): string {
  // If summary mentions concerns/issues, replace with strengths-based summary
  const negativePhrases = [
    'concern',
    'issue',
    'red flag',
    'gap',
    'lacking',
    'weak',
    'problem',
    'however',
    'but',
    'unfortunately',
  ];

  const hasNegative = negativePhrases.some(phrase =>
    summary.toLowerCase().includes(phrase)
  );

  if (hasNegative || summary.length < 20) {
    // Generate a positive summary from strengths
    if (strengths.length === 0) {
      return 'A qualified candidate for consideration.';
    }

    if (strengths.length === 1) {
      return `Candidate with ${strengths[0].toLowerCase()}.`;
    }

    return `Candidate with ${strengths[0].toLowerCase()} and ${strengths[1].toLowerCase()}.`;
  }

  // Clean up the summary - remove sentences with negative phrases
  const sentences = summary.split(/[.!?]+/).filter(s => s.trim());
  const cleanSentences = sentences.filter(sentence => {
    const lower = sentence.toLowerCase();
    return !negativePhrases.some(phrase => lower.includes(phrase));
  });

  if (cleanSentences.length === 0) {
    return `Candidate with ${strengths[0]?.toLowerCase() || 'relevant experience'}.`;
  }

  return cleanSentences.join('. ').trim() + '.';
}

/**
 * Generate a generic public summary
 */
function generatePublicSummary(candidate: CandidateData, score: number): string {
  const parts: string[] = [];

  if (candidate.primary_position) {
    parts.push(`${candidate.primary_position}`);
  }

  if (candidate.years_experience) {
    parts.push(`${candidate.years_experience}+ years experience`);
  }

  const identityVerifiedTiers = new Set(['identity', 'verified', 'premium']);
  if (identityVerifiedTiers.has(candidate.verification_tier)) {
    parts.push('verified profile');
  }

  if (parts.length === 0) {
    return 'Available crew member';
  }

  return parts.join(' with ');
}

// ============================================================================
// SCORE BREAKDOWN SANITIZATION
// ============================================================================

/**
 * Simplify score breakdown for clients
 * Combines detailed categories into simpler groupings
 */
export function simplifyBreakdown(
  breakdown: MatchBreakdown
): { skills: number; fit: number; verification: number } {
  return {
    skills: breakdown.qualifications + breakdown.experience, // 50 pts max
    fit: breakdown.availability + breakdown.preferences + breakdown.aiAssessment, // 40 pts max
    verification: breakdown.verification, // 10 pts max
  };
}

/**
 * Convert breakdown to percentage bars for UI
 */
export function breakdownToPercentages(
  breakdown: MatchBreakdown
): Record<keyof MatchBreakdown, number> {
  const maxScores: MatchBreakdown = {
    qualifications: 25,
    experience: 25,
    availability: 15,
    preferences: 15,
    verification: 10,
    aiAssessment: 10,
  };

  return {
    qualifications: Math.round((breakdown.qualifications / maxScores.qualifications) * 100),
    experience: Math.round((breakdown.experience / maxScores.experience) * 100),
    availability: Math.round((breakdown.availability / maxScores.availability) * 100),
    preferences: Math.round((breakdown.preferences / maxScores.preferences) * 100),
    verification: Math.round((breakdown.verification / maxScores.verification) * 100),
    aiAssessment: Math.round((breakdown.aiAssessment / maxScores.aiAssessment) * 100),
  };
}
