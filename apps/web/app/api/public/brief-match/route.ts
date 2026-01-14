// ============================================================================
// PUBLIC BRIEF MATCH API - AI-Powered Lead Generation
// ============================================================================
// This endpoint allows anonymous users to search for candidates based on
// their requirements. Results are anonymized to create a curiosity gap
// and encourage email capture for full profiles.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { generateEmbedding, anonymizeBio, anonymizeCareerAchievements, anonymizeText, rerankDocuments, validateAnonymizedBioSafe, type ReferenceDetail, type AnonymizeOptions, type RerankDocument } from '@lighthouse/ai';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// Use Claude Sonnet 4.5 for generating "Why We Recommend" presentations
// These are shown to clients, so quality and reasoning depth matter
const presentationModel = anthropic('claude-sonnet-4-5-20250929');

// Use Claude Sonnet 4.5 for AI judgment (deciding if candidate matches)
// Critical reasoning task that determines which candidates get shown
const judgmentModel = anthropic('claude-sonnet-4-5-20250929');

// ----------------------------------------------------------------------------
// REQUEST VALIDATION
// ----------------------------------------------------------------------------

const briefMatchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  preview_mode: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(20).optional(),
});

// ----------------------------------------------------------------------------
// ROLE MAPPING - Map frontend roles to search terms
// ----------------------------------------------------------------------------

const ROLE_SEARCH_TERMS: Record<string, string[]> = {
  // Yacht Crew roles
  'deckhand': ['deckhand', 'deck hand', 'junior deckhand', 'lead deckhand', 'deck crew'],
  'chief-stewardess': ['chief stewardess', 'chief stew', 'head stewardess', 'purser'],
  'stewardess': ['stewardess', 'stew', 'interior', 'second stewardess', 'third stewardess'],
  'engineer': ['engineer', 'chief engineer', 'second engineer', 'third engineer', 'ETO'],
  'captain': ['captain', 'master', 'yacht captain', 'skipper'],
  'first-officer': ['first officer', 'chief officer', 'first mate', 'mate'],
  'bosun': ['bosun', 'boatswain', 'lead deckhand', 'deck boss'],
  // Private Household Staff roles
  'butler': ['butler', 'head butler', 'under butler', 'footman'],
  'estate-manager': ['estate manager', 'property manager', 'household manager'],
  'house-manager': ['house manager', 'household manager', 'domestic manager'],
  'personal-assistant': ['personal assistant', 'PA', 'executive assistant', 'private PA'],
  'housekeeper': ['housekeeper', 'head housekeeper', 'housekeeping manager'],
  'nanny': ['nanny', 'live-in nanny', 'travelling nanny', 'baby nurse'],
  'governess': ['governess', 'tutor', 'educator'],
  'chef': ['chef', 'private chef', 'head chef', 'cook', 'sous chef', 'chef de partie'],
  'chauffeur': ['chauffeur', 'driver', 'security driver'],
  'security': ['security', 'close protection', 'bodyguard', 'CPO'],
  'laundress': ['laundress', 'seamstress', 'lady\'s maid'],
  'valet': ['valet', 'gentleman\'s gentleman', 'butler'],
  'caretaker': ['caretaker', 'property caretaker', 'grounds keeper', 'maintenance'],
  'couple': ['couple', 'household couple', 'domestic couple'],
};

// ----------------------------------------------------------------------------
// ANONYMIZED RESULT TYPE
// ----------------------------------------------------------------------------

interface AnonymizedCandidate {
  id: string; // Obfuscated ID (not the real DB ID)
  // Partially hidden name for personal touch (e.g., "J*** S***")
  display_name: string;
  // Blurred avatar URL (or placeholder if none)
  avatar_url: string | null;
  position: string;
  experience_years: number | null; // null = "Experience on file" display
  rich_bio: string; // Detailed 3-5 sentence mini-resume (anonymized)
  career_highlights: string[]; // 3-4 bullet points of impressive achievements
  experience_summary: string; // Brief summary of work history scope
  // NOTE: work_history removed for lead gen - full history available for authenticated clients only
  languages: string[];
  nationality: string;
  availability: string;
  match_score: number;
  key_strengths: string[];
  qualifications: string[]; // Key certs/licenses (anonymized)
  notable_employers: string[]; // Anonymized hints like "Major Royal Household", "UHNW Family"
  // Personalized fit and qualities
  why_good_fit: string; // 2-3 sentences explaining why they match THIS specific brief
  employee_qualities: string[]; // What makes them an exceptional employee (soft skills, traits)
  longevity_assessment: string; // Assessment of their tenure history and reliability
}

// ----------------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------------

const VECTOR_MATCH_THRESHOLD = 0.35;
const MAX_RESULTS = 10;

// ----------------------------------------------------------------------------
// TYPE DEFINITIONS (moved up for use in recruiter assessment)
// ----------------------------------------------------------------------------

// AI Judgment result type (defined early for use in candidate interfaces)
interface AIJudgment {
  isMatch: boolean;
  confidence: number;
  matchScore: number;
  reasoning: string;
  specialStrengths: string[];
  concerns: string[];
  stepUpPotential: boolean;
}

// Candidate data as returned from vector search queries
interface VectorSearchCandidate {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  primary_position: string | null;
  position_category: string | null;
  years_experience: number | null;
  nationality: string | null;
  availability_status: string | null;
  current_location: string | null;
  profile_summary: string | null;
  embedding: unknown;
  positions_held: string[] | null;
  cv_skills: string[] | null;
  languages_extracted: Array<{ language: string; proficiency: string }> | string[] | null;
  yacht_experience_extracted: YachtExperience[] | null;
  villa_experience_extracted: VillaExperience[] | null;
  certifications_extracted: CertificationExtracted[] | null;
  licenses_extracted: LicenseExtracted[] | null;
  education_extracted: unknown[] | null;
  references_extracted: ReferenceDetail[] | null;
  highest_license: string | null;
  has_stcw: boolean | null;
  has_eng1: boolean | null;
  bio_full: string | null;
  bio_anonymized: string | null;
  gender: string | null;
  vector_similarity?: number;
  // Additional scoring fields added during processing
  structured_score?: number;
  position_match?: boolean;
  step_up_candidate?: boolean;
  match_quality?: string;
  aiJudgment?: AIJudgment;
  recruiter_assessment?: RecruiterAssessment;
}

interface YachtExperience {
  yacht_name?: string | null;
  yacht_size_meters?: number | null;
  position?: string;
  duration_months?: number | null;
  yacht_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface VillaExperience {
  property_name?: string | null;
  location?: string | null;
  position?: string;
  duration_months?: number | null;
  property_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface CertificationExtracted {
  name: string;
  category: string;
}

interface LicenseExtracted {
  name: string;
  issuing_authority?: string | null;
}

// ----------------------------------------------------------------------------
// EXPERIENCE CALCULATION HELPER
// ----------------------------------------------------------------------------
// Calculate total experience from work history when years_experience is null/0
// This fixes the "0+ years experience" display issue

function calculateExperienceYears(candidate: {
  years_experience?: number | null;
  yacht_experience_extracted?: YachtExperience[] | null;
  villa_experience_extracted?: VillaExperience[] | null;
}): number | null {
  // If years_experience is set and > 0, use it
  if (candidate.years_experience && candidate.years_experience > 0) {
    return candidate.years_experience;
  }

  // Calculate from extracted work history
  const yachtMonths = (candidate.yacht_experience_extracted || [])
    .reduce((sum, y) => sum + (y.duration_months || 0), 0);
  const villaMonths = (candidate.villa_experience_extracted || [])
    .reduce((sum, v) => sum + (v.duration_months || 0), 0);

  const totalMonths = yachtMonths + villaMonths;
  if (totalMonths > 0) {
    const years = Math.round(totalMonths / 12);
    return years > 0 ? years : 1; // At least 1 year if they have any months
  }

  // Return null if we truly don't know (will display as "Experience on file")
  return null;
}

// ----------------------------------------------------------------------------
// RECRUITER SUITABILITY ASSESSMENT
// ----------------------------------------------------------------------------
// This layer acts as an experienced recruiter, evaluating whether a candidate
// is actually a good fit for the role - not just a skills match.
// Key considerations:
// - Overqualification: Would they realistically take this role?
// - Underqualification: Do they meet minimum requirements?
// - Qualification requirements: Do they have required certs/licenses?
// - Career trajectory: Is this a logical career move?
// - Yacht size context: Understanding that people can step up/down for various reasons
// ----------------------------------------------------------------------------

interface RecruiterAssessment {
  suitability_score: number;       // 0-1 adjustment factor for match score
  recommendation: 'strong' | 'suitable' | 'consider' | 'unlikely';
  flags: {
    overqualified: boolean;
    underqualified: boolean;
    missing_qualifications: boolean;
    career_mismatch: boolean;      // e.g., they're a chef applying for deckhand
    flight_risk: boolean;          // likely to leave for better opportunity quickly
  };
  missing_certs: string[];         // Which required certs they're missing
  reasoning: string;               // Brief explanation for internal use
}

interface ParsedRequirements {
  min_experience_months: number | null;
  max_experience_months: number | null;  // If they say "6 months" for entry role, max is probably ~24
  yacht_size_meters: number | null;
  min_yacht_size_experience_meters: number | null;  // Minimum yacht size candidate must have worked on
  required_certs: string[];              // Normalized cert requirements
  preferred_certs: string[];             // Nice to have
  is_junior_role: boolean;
  is_senior_role: boolean;
  salary_indicator: 'low' | 'medium' | 'high' | null;  // Helps identify role level
}

// Position hierarchy for career trajectory analysis
const POSITION_HIERARCHY: Record<string, number> = {
  // Deck department (1-5 scale)
  'deckhand': 1,
  'junior deckhand': 1,
  'lead deckhand': 2,
  'bosun': 3,
  'second officer': 3,
  'first officer': 4,
  'chief officer': 4,
  'captain': 5,
  'master': 5,
  // Interior department
  'stewardess': 1,
  'third stewardess': 1,
  'second stewardess': 2,
  'chief stewardess': 3,
  'chief stew': 3,
  'head stewardess': 3,
  'purser': 4,
  'interior manager': 4,
  // Engineering
  'junior engineer': 1,
  'third engineer': 2,
  'second engineer': 3,
  'chief engineer': 4,
  'eto': 3,
  // Galley
  'cook': 2,
  'sous chef': 3,
  'chef': 4,
  'head chef': 4,
  'private chef': 4,
};

// Certificate/qualification categories and their aliases
// Based on MCA/RYA certification ladder and commercial crossovers
const CERT_ALIASES: Record<string, string[]> = {
  // === STCW Basic Safety (mandatory for all) ===
  'stcw': ['stcw', 'stcw 95', 'stcw 2010', 'basic safety', 'bst', 'stcw basic'],
  'pst': ['pst', 'personal survival', 'survival techniques'],
  'fpff': ['fpff', 'fire prevention', 'fire fighting'],
  'efa': ['efa', 'elementary first aid'],
  'pssr': ['pssr', 'personal safety', 'social responsibility'],

  // === Medical Certificates ===
  'eng1': ['eng1', 'eng 1', 'ems1', 'ml5', 'seafarer medical', 'mca medical'],

  // === Captain/Master Licenses ===
  'master_200gt': ['master 200gt', 'master yacht 200', 'my 200'],
  'master_500gt': ['master 500gt', 'master yacht 500', 'my 500'],
  'master_3000gt': ['master 3000gt', 'master yacht 3000', 'my 3000'],
  'master_unlimited': ['master unlimited', 'master yacht unlimited'],

  // === Officer Certificates ===
  'oow_200gt': ['oow 200', 'oow yacht 200'],
  'oow_500gt': ['oow 500', 'oow yacht 500'],
  'oow_3000gt': ['oow 3000', 'oow yacht 3000'],
  'oow_unlimited': ['oow unlimited', 'chief mate', 'chief officer'],

  // === RYA Progression (Deck) ===
  'competent_crew': ['competent crew', 'rya competent'],
  'day_skipper': ['day skipper', 'rya day skipper'],
  'yachtmaster_coastal': ['yachtmaster coastal', 'ym coastal', 'yacht master coastal'],
  'yachtmaster_offshore': ['yachtmaster offshore', 'ym offshore', 'yacht master offshore'],
  'yachtmaster_ocean': ['yachtmaster ocean', 'ym ocean', 'yacht master ocean'],
  'yachtmaster': ['yachtmaster', 'yacht master', 'ym'],

  // === Commercial Deck Ratings ===
  'edh': ['edh', 'efficient deck hand', 'efficient deckhand'],
  'ab': ['ab', 'able seafarer', 'able seaman', 'able bodied'],

  // === Engineering Certificates ===
  'aec': ['aec', 'approved engine course', 'aec 1', 'aec 2'],
  'y4': ['y4', 'y 4', 'yacht 4', 'y4 engineer'],
  'y3': ['y3', 'y 3', 'yacht 3', 'y3 engineer'],
  'y2': ['y2', 'y 2', 'yacht 2', 'y2 engineer'],
  'y1': ['y1', 'y 1', 'yacht 1', 'y1 engineer'],
  'eoow': ['eoow', 'engine officer of watch', 'engineering watch'],
  'second_engineer': ['second engineer', '2nd engineer'],
  'chief_engineer': ['chief engineer', 'chief eng'],

  // === Additional Engineering ===
  'hv': ['hv', 'high voltage', 'hv certification'],
  'fgas': ['f-gas', 'fgas', 'refrigeration', 'air conditioning', 'hvac'],

  // === ETO ===
  'eto': ['eto', 'electro-technical', 'electro technical officer'],

  // === Radio/Navigation ===
  'gmdss_goc': ['gmdss goc', 'goc', 'general operator'],
  'gmdss_roc': ['gmdss roc', 'roc', 'restricted operator'],
  'gmdss': ['gmdss', 'radio operator'],
  'src': ['src', 'short range certificate', 'short range'],
  'radar': ['radar', 'arpa', 'radar arpa'],
  'ecdis': ['ecdis', 'electronic chart'],
  'dp': ['dp', 'dynamic positioning', 'dp basic', 'dp advanced'],
  'brm': ['brm', 'bridge resource management'],
  'helm': ['helm', 'human element leadership'],

  // === Powerboat/Watersports ===
  'powerboat': ['pbl2', 'pb2', 'powerboat level 2', 'powerboat 2', 'rya powerboat', 'pbl 2', 'powerboat'],
  'jet_ski': ['jet ski', 'jetski', 'pwc', 'personal watercraft', 'rya pwc'],
  'tender_operator': ['tender operator', 'rya tender'],

  // === Diving ===
  'diving': ['padi', 'ssi', 'divemaster', 'dive instructor', 'rescue diver', 'diving'],
  'padi_divemaster': ['padi divemaster', 'divemaster'],
  'padi_instructor': ['padi instructor', 'dive instructor'],

  // === Advanced STCW ===
  'pscrb': ['pscrb', 'proficiency survival craft', 'survival craft', 'rescue boat'],
  'afa': ['afa', 'advanced fire fighting', 'advanced fire'],
  'mfa': ['mfa', 'medical first aid', 'first aid', 'medical care'],
  'sdsd': ['sdsd', 'security duties'],

  // === Interior/Hospitality ===
  'guest': ['guest', 'pya guest', 'interior safety'],
  'food_safety_l2': ['food safety level 2', 'food hygiene level 2', 'food safety 2'],
  'food_safety_l3': ['food safety level 3', 'food hygiene level 3', 'food safety 3', 'food safety management'],
  'food_safety': ['food safety', 'food hygiene'],
  'ship_cook': ['ship cook', 'ships cook', 'galley ops'],
  'haccp': ['haccp', 'food safety management'],
  'wine': ['wset', 'wine', 'sommelier'],
  'wine_l1': ['wset 1', 'wset level 1'],
  'wine_l2': ['wset 2', 'wset level 2'],
  'wine_l3': ['wset 3', 'wset level 3'],
  'barista': ['barista'],
  'mixology': ['mixology', 'bartending', 'cocktails'],
  'silver_service': ['silver service', 'table service'],
  'floristry': ['floristry', 'floral'],
  'laundry': ['laundry', 'fabric care'],

  // === Childcare/Specialist ===
  'childcare': ['childcare', 'nanny', 'cache', 'norland', 'nursery nurse'],
  'spa': ['spa', 'massage', 'cibtac', 'itec', 'beauty therapy'],
  'personal_training': ['personal training', 'pt', 'fitness'],
  'yoga': ['yoga', 'pilates'],
};

// ----------------------------------------------------------------------------
// STRUCTURED CANDIDATE SCORE - Phase 5: Excellence Bonus System
// ----------------------------------------------------------------------------
// Replace simple suitability multiplier with weighted, transparent scoring.
// This enables "excellence bonus" for candidates who exceed requirements.
// ----------------------------------------------------------------------------

interface StructuredCandidateScore {
  // Must-pass checks (binary)
  passesHardFilters: boolean;

  // Weighted components (0-100 each, normalized to total 100)
  components: {
    positionFit: number;          // 35% - How well position matches (incl. step-up)
    experienceQuality: number;    // 30% - Years + yacht size + breadth
    skillMatch: number;           // 20% - Skills/certs matching requirements
    availability: number;         // 0%  - NOT USED - we can offer anyone the job
    verification: number;         // 10% - Profile completeness, references, verified
    excellence: number;           // 5%  - Exceeds requirements (bonus only)
  };

  // Weights for each component (must sum to 1.0)
  weights: {
    positionFit: number;
    experienceQuality: number;
    skillMatch: number;
    availability: number;
    verification: number;
    excellence: number;
  };

  // Final weighted score (0-100)
  totalScore: number;

  // Human-readable recommendation
  recommendation: 'excellent' | 'strong' | 'suitable' | 'consider' | 'unlikely';

  // Bonus indicators
  bonuses: {
    exceedsYachtSize: boolean;    // Experience on larger yachts than required
    exceedsExperience: boolean;   // More experience than required
    hasPremiumCerts: boolean;     // Has extra valuable certifications
    longTenure: boolean;          // History of staying in positions
    verifiedReferences: boolean;  // Has verified references
  };

  // Explanation for transparency
  reasoning: string[];
}

/**
 * Calculate a structured score for a candidate.
 * This provides transparency and enables excellence bonuses.
 */
function calculateStructuredScore(
  candidate: {
    primary_position: string | null;
    positions_held: string[] | null;
    years_experience: number | null;
    yacht_experience_extracted: YachtExperience[] | null;
    villa_experience_extracted: VillaExperience[] | null;
    certifications_extracted: CertificationExtracted[] | null;
    cv_skills: string[] | null;
    availability_status: string | null;
    references_extracted: ReferenceDetail[] | null;
    profile_summary: string | null;
  },
  searchRole: string,
  parsedReqs: ParsedRequirements,
  timeline: string | undefined,
  aiParsedQuery: AIQueryParsed | null,
  stepUpReadiness: { isStepUp: boolean; isReady: boolean }
): StructuredCandidateScore {
  const reasoning: string[] = [];
  // NOTE: Availability is NOT a criteria - we can reach out to any candidate
  // and offer them the job. Weight set to 0 intentionally.
  //
  // WEIGHTS ADJUSTED: Position fit is now dominant (50%) because an exact role
  // match is the primary qualification. Other factors are refinements.
  const weights = {
    positionFit: 0.50,        // UP from 0.35 - exact role match is the primary qualifier
    experienceQuality: 0.25,  // DOWN from 0.30 - still important but secondary
    skillMatch: 0.15,         // DOWN from 0.20 - nice-to-have refinements
    availability: 0.00,       // REMOVED - availability is not a filter, we can offer anyone the job
    verification: 0.07,       // DOWN from 0.10 - profile quality matters less
    excellence: 0.03,         // DOWN from 0.05 - bonus for exceptional candidates
  };

  // Initialize bonuses
  const bonuses = {
    exceedsYachtSize: false,
    exceedsExperience: false,
    hasPremiumCerts: false,
    longTenure: false,
    verifiedReferences: false,
  };

  // =========================================================================
  // 1. POSITION FIT (30%)
  // =========================================================================
  let positionFit = 0;
  const positionLower = (candidate.primary_position || '').toLowerCase();
  const searchRoleLower = searchRole.toLowerCase();

  // Exact match
  if (positionLower.includes(searchRoleLower) || searchRoleLower.includes(positionLower)) {
    positionFit = 100;
    reasoning.push('Exact position match');
  }
  // Step-up ready
  else if (stepUpReadiness.isStepUp && stepUpReadiness.isReady) {
    positionFit = 85;
    reasoning.push('Ready to step up to this role');
  }
  // Step-up developing
  else if (stepUpReadiness.isStepUp) {
    positionFit = 70;
    reasoning.push('Developing toward this role');
  }
  // Related position
  else {
    const positionsHeld = (candidate.positions_held || []).map(p => p.toLowerCase());
    const hasRelatedPosition = positionsHeld.some(p =>
      p.includes(searchRoleLower) || searchRoleLower.includes(p)
    );
    if (hasRelatedPosition) {
      positionFit = 60;
      reasoning.push('Has held related position');
    } else {
      positionFit = 30;
      reasoning.push('Position not directly related');
    }
  }

  // =========================================================================
  // 2. EXPERIENCE QUALITY (25%)
  // =========================================================================
  let experienceQuality = 0;
  const yearsExp = candidate.years_experience || 0;

  // Base score from years
  if (yearsExp >= 10) {
    experienceQuality = 100;
    bonuses.exceedsExperience = true;
  } else if (yearsExp >= 7) {
    experienceQuality = 90;
    bonuses.exceedsExperience = parsedReqs.min_experience_months ? yearsExp * 12 > parsedReqs.min_experience_months * 1.5 : false;
  } else if (yearsExp >= 5) {
    experienceQuality = 80;
  } else if (yearsExp >= 3) {
    experienceQuality = 65;
  } else if (yearsExp >= 1) {
    experienceQuality = 50;
  } else {
    experienceQuality = 30;
  }

  // Yacht size bonus
  const yachtExp = candidate.yacht_experience_extracted || [];
  if (yachtExp.length > 0) {
    const maxYacht = Math.max(...yachtExp.map(y => y.yacht_size_meters || 0));
    if (parsedReqs.min_yacht_size_experience_meters && maxYacht >= parsedReqs.min_yacht_size_experience_meters * 1.2) {
      experienceQuality = Math.min(100, experienceQuality + 10);
      bonuses.exceedsYachtSize = true;
      reasoning.push(`Exceeds yacht size requirement (${maxYacht}m)`);
    } else if (maxYacht >= 80) {
      experienceQuality = Math.min(100, experienceQuality + 5);
    }
  }

  // =========================================================================
  // 3. SKILL MATCH (20%)
  // =========================================================================
  let skillMatch = 50; // Base score
  const skills = (candidate.cv_skills || []).map(s => s.toLowerCase());
  const certs = (candidate.certifications_extracted || []).map(c => c.name.toLowerCase());

  // Check required certs
  const requiredCertsCount = parsedReqs.required_certs.length;
  let matchedRequiredCerts = 0;
  for (const certKey of parsedReqs.required_certs) {
    if (candidateHasCert(certKey, { certifications_extracted: candidate.certifications_extracted, licenses_extracted: null, has_stcw: null, has_eng1: null })) {
      matchedRequiredCerts++;
    }
  }
  if (requiredCertsCount > 0) {
    skillMatch = (matchedRequiredCerts / requiredCertsCount) * 80;
    if (matchedRequiredCerts === requiredCertsCount) {
      skillMatch = 90;
      reasoning.push('Has all required certifications');
    }
  }

  // Check preferred certs (bonus)
  let matchedPreferredCerts = 0;
  for (const certKey of parsedReqs.preferred_certs) {
    if (candidateHasCert(certKey, { certifications_extracted: candidate.certifications_extracted, licenses_extracted: null, has_stcw: null, has_eng1: null })) {
      matchedPreferredCerts++;
    }
  }
  if (matchedPreferredCerts > 0) {
    skillMatch = Math.min(100, skillMatch + matchedPreferredCerts * 5);
    bonuses.hasPremiumCerts = matchedPreferredCerts >= 2;
  }

  // AI-parsed soft requirements matching
  if (aiParsedQuery && aiParsedQuery.softRequirements) {
    const softReqs = aiParsedQuery.softRequirements;
    let softMatches = 0;
    let softTotal = 0;

    // Cuisine types
    if (softReqs.cuisineTypes?.length > 0) {
      softTotal += softReqs.cuisineTypes.length;
      for (const cuisine of softReqs.cuisineTypes) {
        if (skills.some(s => s.includes(cuisine.toLowerCase())) ||
            (candidate.profile_summary || '').toLowerCase().includes(cuisine.toLowerCase())) {
          softMatches++;
        }
      }
    }

    // Special skills - check both cv_skills AND profile_summary for matches
    // CRITICAL: These are from the job brief and should have significant weight
    if (softReqs.specialSkills?.length > 0) {
      softTotal += softReqs.specialSkills.length;
      const profileText = (candidate.profile_summary || '').toLowerCase();

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Scoring] Checking ${softReqs.specialSkills.length} special skills:`, softReqs.specialSkills);
        console.log(`[Scoring] Candidate cv_skills:`, skills.slice(0, 10));
      }

      for (const skill of softReqs.specialSkills) {
        const skillLower = skill.toLowerCase();
        const hasSkill = skills.some(s => s.includes(skillLower)) ||
                        profileText.includes(skillLower);

        if (hasSkill) {
          softMatches++;
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Scoring] ✓ Matched special skill: "${skill}"`);
          }
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`[Scoring] ✗ Missing special skill: "${skill}"`);
        }
      }
    }

    // INCREASED WEIGHT: Special skills from job brief now worth up to 30 points
    // (was 20 points). These are explicit client requirements and should matter more.
    if (softTotal > 0 && softMatches > 0) {
      const softMatchRatio = softMatches / softTotal;
      skillMatch = Math.min(100, skillMatch + softMatchRatio * 30); // UP from 20
      if (softMatchRatio >= 0.5) {
        reasoning.push(`Matches ${softMatches}/${softTotal} job brief requirements`);
      }
    } else if (softTotal > 0 && softMatches === 0) {
      // PENALTY: If special skills were requested but candidate has NONE, apply penalty
      skillMatch = Math.max(30, skillMatch - 15);
      reasoning.push(`Missing job brief requirements`);
    }
  }

  // =========================================================================
  // 4. AVAILABILITY (10%)
  // =========================================================================
  let availability = 50; // Default neutral
  const status = (candidate.availability_status || '').toLowerCase();

  if (status.includes('available') || status.includes('immediate')) {
    availability = 100;
  } else if (status.includes('notice') || status.includes('soon')) {
    availability = 80;
  } else if (status.includes('considering') || status.includes('open')) {
    availability = 60;
  } else if (status.includes('not available') || status.includes('employed')) {
    availability = 20;
  }

  // Timeline alignment
  if (timeline === 'asap' && availability >= 80) {
    availability = Math.min(100, availability + 10);
    reasoning.push('Available for immediate start');
  } else if (timeline === '3-months' && availability >= 60) {
    availability = Math.min(100, availability + 5);
  }

  // =========================================================================
  // 5. VERIFICATION (10%)
  // =========================================================================
  let verification = 40; // Base score

  // Profile completeness
  if (candidate.profile_summary && candidate.profile_summary.length > 200) {
    verification += 20;
  }

  // Has yacht experience details
  if (yachtExp.length >= 2) {
    verification += 15;
  }

  // Has references
  const refs = candidate.references_extracted || [];
  if (refs.length > 0) {
    verification += 15;
    bonuses.verifiedReferences = refs.some(r => r.relationship !== undefined);
  }

  // Has certifications listed
  if (certs.length >= 3) {
    verification += 10;
  }

  verification = Math.min(100, verification);

  // =========================================================================
  // 6. EXCELLENCE BONUS (5%)
  // =========================================================================
  let excellence = 0;
  let excellenceBonusCount = 0;

  if (bonuses.exceedsYachtSize) excellenceBonusCount++;
  if (bonuses.exceedsExperience) excellenceBonusCount++;
  if (bonuses.hasPremiumCerts) excellenceBonusCount++;
  if (bonuses.longTenure) excellenceBonusCount++;
  if (bonuses.verifiedReferences) excellenceBonusCount++;

  excellence = Math.min(100, excellenceBonusCount * 25);

  if (excellence > 50) {
    reasoning.push('Exceeds expectations in multiple areas');
  }

  // =========================================================================
  // CALCULATE TOTAL SCORE
  // =========================================================================
  const totalScore = Math.round(
    positionFit * weights.positionFit +
    experienceQuality * weights.experienceQuality +
    skillMatch * weights.skillMatch +
    availability * weights.availability +
    verification * weights.verification +
    excellence * weights.excellence
  );

  // Determine recommendation
  let recommendation: 'excellent' | 'strong' | 'suitable' | 'consider' | 'unlikely';
  if (totalScore >= 85) {
    recommendation = 'excellent';
  } else if (totalScore >= 70) {
    recommendation = 'strong';
  } else if (totalScore >= 55) {
    recommendation = 'suitable';
  } else if (totalScore >= 40) {
    recommendation = 'consider';
  } else {
    recommendation = 'unlikely';
  }

  return {
    passesHardFilters: true,
    components: {
      positionFit,
      experienceQuality,
      skillMatch,
      availability,
      verification,
      excellence,
    },
    weights,
    totalScore,
    recommendation,
    bonuses,
    reasoning,
  };
}

// ----------------------------------------------------------------------------
// CAREER LADDERS - Industry-Agnostic Progression Paths
// ----------------------------------------------------------------------------
// Each array represents a career progression from junior to senior.
// Used to identify "ready to step up" candidates (one level below target).
// ----------------------------------------------------------------------------

const CAREER_LADDERS: string[][] = [
  // Maritime Deck
  ['deckhand', 'lead deckhand', 'bosun', 'second officer', 'first officer', 'chief officer', 'captain'],
  // Maritime Interior
  ['stewardess', 'second stewardess', 'chief stewardess', 'purser', 'interior manager'],
  // Maritime Engineering
  ['junior engineer', 'third engineer', 'second engineer', 'chief engineer'],
  // Culinary (works for yacht and household)
  ['cook', 'sous chef', 'chef', 'head chef', 'executive chef'],
  // Household Service
  ['footman', 'under butler', 'butler', 'head butler', 'house manager'],
  ['housemaid', 'housekeeper', 'head housekeeper', 'house manager'],
  // Childcare
  ['nanny', 'head nanny', 'governess'],
  // Security
  ['security officer', 'close protection officer', 'head of security'],
];

// ----------------------------------------------------------------------------
// DEPARTMENT BOUNDARIES - Hard Filter to Prevent Cross-Department Matches
// ----------------------------------------------------------------------------
// A Captain search should NEVER return an Engineer.
// A Chef search should NEVER return a Stewardess.
// ----------------------------------------------------------------------------

const DEPARTMENTS: Record<string, string[]> = {
  // ==========================================================================
  // YACHT DEPARTMENTS
  // ==========================================================================
  deck: [
    'captain', 'master', 'skipper',
    'officer', 'mate', 'chief officer', 'first officer', 'second officer', 'third officer',
    'bosun', 'boatswain',
    'deckhand', 'deck hand', 'lead deckhand', 'senior deckhand', 'junior deckhand',
    'deck/stew', 'deckstew',
  ],
  interior: [
    'stewardess', 'stew', 'steward',
    'chief stewardess', 'chief stew', 'head stewardess', 'head stew',
    'second stewardess', '2nd stew', 'third stewardess', '3rd stew',
    'junior stewardess', 'sole stewardess',
    'purser', 'interior manager', 'head of interior',
    'laundress', 'laundry', 'cabin stewardess', 'service stewardess',
  ],
  engineering: [
    'engineer', 'chief engineer', 'second engineer', 'third engineer',
    'junior engineer', 'sole engineer',
    'eto', 'electro technical', 'electro-technical', 'electrical',
    'av/it', 'av it', 'av technician',
  ],
  galley: [
    'chef', 'cook', 'culinary', 'galley',
    'head chef', 'executive chef', 'sous chef', 'second chef', 'junior chef',
    'sole chef', 'crew chef', 'pastry chef', 'galley hand',
  ],

  // ==========================================================================
  // VILLA/ESTATE DEPARTMENTS
  // ==========================================================================
  villa: [
    // Management
    'estate manager', 'house manager', 'villa manager', 'property manager',
    'household manager', 'residence manager', 'chalet manager', 'lodge manager',
    'chalet host', 'caretaker',
    // Service
    'butler', 'head butler', 'under butler', 'junior butler', 'valet',
    'housekeeper', 'head housekeeper', 'executive housekeeper', 'housekeeping',
    'housemaid', 'maid', 'houseman',
    // Culinary (villa-specific)
    'private chef', 'personal chef', 'family chef', 'estate chef', 'villa chef',
    'chalet chef', 'private cook',
    // Support
    'chauffeur', 'driver', 'personal driver',
    'gardener', 'head gardener', 'groundskeeper', 'grounds',
    'pool technician', 'pool man', 'handyman', 'maintenance',
    'estate worker', 'estate technician',
    // Couples
    'domestic couple', 'house couple', 'caretaker couple', 'couple',
  ],

  // ==========================================================================
  // SPECIALIZED ROLES
  // ==========================================================================
  childcare: [
    'nanny', 'head nanny', 'senior nanny', 'junior nanny',
    'live-in nanny', 'live-out nanny', 'traveling nanny',
    'governess', 'au pair', 'tutor', 'private tutor',
    'maternity nurse', 'night nurse', 'newborn care specialist',
    'mothers help', "mother's help", 'nursery', 'childcare',
  ],
  security: [
    'security', 'security officer', 'security guard', 'security manager',
    'head of security', 'cpo', 'close protection officer', 'close protection',
    'bodyguard', 'personal protection',
  ],
  medical: [
    'nurse', 'registered nurse', 'rn',
    'medic', 'ship medic', 'yacht medic',
    'paramedic', 'emt', 'doctor', 'physician',
    'healthcare',
  ],
  management: [
    'yacht manager', 'fleet manager',
    'personal assistant', 'pa', 'executive pa', 'executive assistant', 'ea',
    'family office manager', 'chief of staff', 'private secretary',
  ],
  wellness: [
    'spa', 'spa therapist', 'spa manager',
    'massage', 'massage therapist', 'masseuse',
    'beauty', 'beautician', 'aesthetician',
    'fitness', 'fitness instructor', 'personal trainer',
    'yoga', 'yoga instructor', 'pilates', 'pilates instructor',
    'wellness',
  ],

  // ==========================================================================
  // OTHER SPECIALIZED ROLES
  // ==========================================================================
  other: [
    'dive instructor', 'divemaster', 'dive master',
    'water sports', 'watersports', 'jet ski',
    'florist', 'photographer', 'hairdresser', 'hair stylist',
  ],
};

/**
 * Get the department for a given role/position.
 * Returns null if the role doesn't clearly belong to a department.
 */
function getDepartment(role: string): string | null {
  const normalized = role.toLowerCase().trim();

  for (const [dept, keywords] of Object.entries(DEPARTMENTS)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      return dept;
    }
  }
  return null;
}

/**
 * Check if two roles are in compatible departments.
 * STRICT: If we know the search role's department, only allow candidates from that department
 * or explicitly compatible departments. Candidates with unknown departments are filtered out
 * when the search role has a known department - we can't risk showing spa therapists for butler searches.
 *
 * @param searchRole - The role being searched for (e.g., "butler")
 * @param candidateRole - The candidate's position string (e.g., "spa therapist")
 * @param candidateCategory - Optional: The candidate's position_category from CV extraction (takes precedence)
 */
function areDepartmentsCompatible(
  searchRole: string,
  candidateRole: string,
  candidateCategory?: string | null
): boolean {
  const searchDept = getDepartment(searchRole);

  // Use candidate's stored position_category if available, otherwise infer from position string
  // The position_category from CV extraction is more reliable as it's AI-classified
  const candidateDept = candidateCategory || getDepartment(candidateRole);

  // If search role has no known department, be lenient (allow any candidate)
  if (!searchDept) return true;

  // If search role HAS a known department but candidate doesn't, REJECT
  // This prevents spa therapists from appearing in butler searches
  if (!candidateDept) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Brief Match] Department filter: REJECT - candidate "${candidateRole}" has unknown department (category: ${candidateCategory}), search role "${searchRole}" is ${searchDept}`);
    }
    return false;
  }

  // Same department is compatible
  if (searchDept === candidateDept) return true;

  // ==========================================================================
  // CROSS-DEPARTMENT OVERLAPS
  // ==========================================================================
  // Many crew transition between yacht and villa roles. Define valid overlaps.
  // ==========================================================================

  const compatiblePairs: [string, string][] = [
    // INTERIOR overlaps
    ['interior', 'villa'],      // Stewardess ↔ Housekeeper, Butler works both
    ['interior', 'management'], // Chief Stew ↔ House Manager, PA works with interior

    // VILLA overlaps
    ['villa', 'management'],    // Estate Manager ↔ House Manager, PA
    ['villa', 'galley'],        // Private Chef works yacht and villa
    ['villa', 'childcare'],     // Nanny often part of villa household staff
    ['villa', 'security'],      // Security often part of estate staff

    // GALLEY overlaps
    ['galley', 'villa'],        // Chef works yacht and private residence

    // DECK overlaps (limited - very specialized)
    // Deck crew rarely cross to other departments

    // ENGINEERING overlaps (limited - very specialized)
    // Engineers rarely cross to other departments

    // CHILDCARE overlaps
    ['childcare', 'villa'],     // Nanny/Governess part of household
    ['childcare', 'interior'],  // Some stews have childcare duties

    // MEDICAL overlaps
    ['medical', 'childcare'],   // Maternity nurse, night nurse

    // WELLNESS overlaps (limited - specialized)
    // Wellness staff are specialists, don't overlap much
  ];

  // Check if the pair exists in either order
  for (const [dept1, dept2] of compatiblePairs) {
    if ((searchDept === dept1 && candidateDept === dept2) ||
        (searchDept === dept2 && candidateDept === dept1)) {
      return true;
    }
  }

  return false;
}

/**
 * Given a target role, find all roles that could "step up" to it.
 * For example, searching for "captain" will also include "chief officer".
 */
function getEligibleRolesForStepUp(targetRole: string): string[] {
  const normalized = targetRole.toLowerCase().trim();
  const eligible = new Set<string>([normalized]);

  // SENIOR ROLES: No step-up allowed - require exact match
  // These are top-level positions where we need exact experience, not aspirational candidates
  const seniorRoles = [
    'captain',
    'chief stewardess',
    'chief stew',
    'chief engineer',
    'head chef',
    'estate manager',
    'house manager',
  ];

  // If searching for a senior role, only return exact match - no step-up candidates
  if (seniorRoles.some(sr => normalized.includes(sr) || sr.includes(normalized))) {
    console.log(`[Brief Match] Senior role "${normalized}" - step-up disabled, exact match only`);
    return [normalized];
  }

  for (const ladder of CAREER_LADDERS) {
    // Find the BEST match in this ladder (prefer exact or most specific match)
    // This fixes a bug where "chief stewardess" would match "stewardess" (index 0)
    // instead of "chief stewardess" (index 2) because of substring matching order
    let bestMatchIndex = -1;
    let bestMatchScore = 0;

    for (let i = 0; i < ladder.length; i++) {
      const ladderRole = ladder[i];
      let score = 0;

      // Exact match gets highest score
      if (ladderRole === normalized) {
        score = 100;
      }
      // Target contains ladder role (e.g., "chief stewardess" contains "stewardess")
      else if (normalized.includes(ladderRole)) {
        // Longer ladder role = better match (more specific)
        score = ladderRole.length;
      }
      // Ladder role contains target (e.g., "chief stewardess" contains "chief stew")
      else if (ladderRole.includes(normalized)) {
        score = normalized.length;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatchIndex = i;
      }
    }

    if (bestMatchIndex > 0) {
      // Include the role directly below (ready to step up)
      eligible.add(ladder[bestMatchIndex - 1]);
    }

    // Also include the exact position if it matches
    if (bestMatchIndex >= 0) {
      eligible.add(ladder[bestMatchIndex]);
    }
  }

  return Array.from(eligible);
}

/**
 * Check if a candidate's position is eligible for the target role.
 * This includes exact matches AND "ready to step up" positions.
 */
function isPositionEligible(
  candidatePosition: string | null,
  candidatePositionsHeld: string[] | null,
  targetRole: string
): boolean {
  if (!candidatePosition && (!candidatePositionsHeld || candidatePositionsHeld.length === 0)) {
    return false;
  }

  const eligibleRoles = getEligibleRolesForStepUp(targetRole);

  // IMPORTANT: Only check the CURRENT position (primary_position)
  // We don't want someone who was once a Chief Officer but is now a Third Officer
  // to qualify for a Captain search. Their CURRENT role matters for step-up eligibility.
  const currentPosition = candidatePosition?.toLowerCase() || '';

  if (!currentPosition) {
    // If no current position, check if any held position matches
    // (fallback for candidates without a primary_position set)
    const heldPositions = (candidatePositionsHeld || []).map(p => p.toLowerCase());
    return heldPositions.some(pos =>
      eligibleRoles.some(eligible =>
        pos.includes(eligible) || eligible.includes(pos)
      )
    );
  }

  // Check if current position matches eligible roles
  return eligibleRoles.some(eligible =>
    currentPosition.includes(eligible) || eligible.includes(currentPosition)
  );
}

/**
 * Assess if a candidate is "ready to step up" to the target role.
 * Returns qualification factors and any gaps.
 */
interface StepUpReadiness {
  isStepUp: boolean;
  isReady: boolean;
  currentLevel: string;
  targetLevel: string;
  qualifyingFactors: string[];
  gaps: string[];
}

// Enriched candidate type with scoring fields added during processing
interface EnrichedCandidate extends VectorSearchCandidate {
  similarity: number;
  vectorScore: number;
  recruiterAssessment: RecruiterAssessment;
  stepUpReadiness: StepUpReadiness;
  structuredScore: StructuredCandidateScore;
  isStepUpCandidate: boolean;
  isReadyToStepUp: boolean;
  hasExcellenceBonus: boolean;
}

/**
 * Build a text representation of a candidate for Cohere reranking.
 * This creates a comprehensive text that Cohere's cross-encoder can use
 * to assess semantic relevance to the search query.
 */
function buildCandidateTextForRerank(candidate: {
  first_name: string | null;
  last_name: string | null;
  primary_position: string | null;
  positions_held: string[] | null;
  years_experience: number | null;
  nationality: string | null;
  current_location: string | null;
  profile_summary: string | null;
  cv_skills: string[] | null;
  languages_extracted: Array<{ language: string; proficiency: string }> | string[] | null;
  yacht_experience_extracted: unknown[] | null;
  villa_experience_extracted: unknown[] | null;
  certifications_extracted: unknown[] | null;
  licenses_extracted: unknown[] | null;
  highest_license: string | null;
  has_stcw: boolean | null;
  has_eng1: boolean | null;
  bio_full: string | null;
}): string {
  const parts: string[] = [];

  // Position and experience
  if (candidate.primary_position) {
    parts.push(`Position: ${candidate.primary_position}`);
  }
  if (candidate.positions_held?.length) {
    parts.push(`Also qualified as: ${candidate.positions_held.join(', ')}`);
  }
  if (candidate.years_experience) {
    parts.push(`Experience: ${candidate.years_experience} years`);
  }

  // Location and nationality
  if (candidate.current_location) {
    parts.push(`Current location: ${candidate.current_location}`);
  }
  if (candidate.nationality) {
    parts.push(`Nationality: ${candidate.nationality}`);
  }

  // Certifications and licenses
  const certs: string[] = [];
  if (candidate.has_stcw) certs.push('STCW');
  if (candidate.has_eng1) certs.push('ENG1');
  if (candidate.highest_license) certs.push(candidate.highest_license);
  if (candidate.certifications_extracted?.length) {
    const certNames = (candidate.certifications_extracted as Array<{ name?: string }>)
      .map(c => c.name)
      .filter(Boolean)
      .slice(0, 5);
    certs.push(...certNames as string[]);
  }
  if (certs.length) {
    parts.push(`Certifications: ${[...new Set(certs)].join(', ')}`);
  }

  // Skills
  if (candidate.cv_skills?.length) {
    parts.push(`Skills: ${candidate.cv_skills.slice(0, 10).join(', ')}`);
  }

  // Languages
  if (candidate.languages_extracted?.length) {
    parts.push(`Languages: ${candidate.languages_extracted.join(', ')}`);
  }

  // Yacht experience
  if (candidate.yacht_experience_extracted?.length) {
    const yachtExp = (candidate.yacht_experience_extracted as Array<{ vessel_name?: string; vessel_size?: number; position?: string }>)
      .slice(0, 3)
      .map(y => `${y.position || 'crew'} on ${y.vessel_size || '?'}m yacht`)
      .join('; ');
    parts.push(`Yacht experience: ${yachtExp}`);
  }

  // Villa experience (for hospitality roles)
  if (candidate.villa_experience_extracted?.length) {
    parts.push(`Villa/estate experience: ${candidate.villa_experience_extracted.length} positions`);
  }

  // Bio/summary - this is the most comprehensive text
  if (candidate.bio_full) {
    parts.push(`\nProfile: ${candidate.bio_full.slice(0, 500)}`);
  } else if (candidate.profile_summary) {
    parts.push(`\nSummary: ${candidate.profile_summary.slice(0, 300)}`);
  }

  return parts.join('\n');
}

function assessStepUpReadiness(
  candidate: {
    primary_position: string | null;
    years_experience: number | null;
    certifications_extracted: CertificationExtracted[] | null;
    licenses_extracted: LicenseExtracted[] | null;
    has_stcw: boolean | null;
    has_eng1: boolean | null;
    yacht_experience_extracted: YachtExperience[] | null;
  },
  targetRole: string,
  parsedReqs: ParsedRequirements
): StepUpReadiness {
  const candidatePos = (candidate.primary_position || '').toLowerCase();
  const targetPos = targetRole.toLowerCase();
  const qualifyingFactors: string[] = [];
  const gaps: string[] = [];

  // Check if this is a step-up scenario
  let isStepUp = false;
  for (const ladder of CAREER_LADDERS) {
    const candidateIndex = ladder.findIndex(r => candidatePos.includes(r) || r.includes(candidatePos));
    const targetIndex = ladder.findIndex(r => targetPos.includes(r) || r.includes(targetPos));

    if (candidateIndex >= 0 && targetIndex >= 0 && targetIndex === candidateIndex + 1) {
      isStepUp = true;
      break;
    }
  }

  if (!isStepUp) {
    return {
      isStepUp: false,
      isReady: false,
      currentLevel: candidatePos,
      targetLevel: targetPos,
      qualifyingFactors: [],
      gaps: [],
    };
  }

  // Assess readiness for step-up

  // 1. Experience check (2+ years in current role is good)
  const yearsExp = candidate.years_experience || 0;
  if (yearsExp >= 3) {
    qualifyingFactors.push(`${yearsExp} years of experience`);
  } else if (yearsExp < 2) {
    gaps.push('Less than 2 years in current role');
  }

  // 2. Certification check for specific step-ups
  // Captain role requires Master certificate
  if (targetPos.includes('captain') || targetPos.includes('master')) {
    const hasMasterCert =
      candidateHasCert('master_200gt', candidate) ||
      candidateHasCert('master_500gt', candidate) ||
      candidateHasCert('master_3000gt', candidate) ||
      candidateHasCert('master_unlimited', candidate) ||
      candidateHasCert('yachtmaster', candidate);

    if (hasMasterCert) {
      qualifyingFactors.push('Holds Master/Yachtmaster certification');
    } else {
      gaps.push('No Master certification found');
    }
  }

  // Chief Stewardess role - check for management experience
  if (targetPos.includes('chief stew') || targetPos.includes('chief stewardess')) {
    if (yearsExp >= 3) {
      qualifyingFactors.push('Sufficient seniority for chief role');
    }
  }

  // 3. Yacht size experience check
  const largestYacht = getLargestYachtWorked(candidate.yacht_experience_extracted);
  const requiredSize = parsedReqs.min_yacht_size_experience_meters;

  if (largestYacht && requiredSize) {
    if (largestYacht >= requiredSize * 0.7) { // Allow 70% of required size for step-up
      qualifyingFactors.push(`Experience on ${largestYacht}m vessels`);
    } else {
      gaps.push(`Largest vessel experience: ${largestYacht}m (${requiredSize}m+ preferred)`);
    }
  }

  const isReady = qualifyingFactors.length >= 2 || (qualifyingFactors.length >= 1 && gaps.length === 0);

  return {
    isStepUp: true,
    isReady,
    currentLevel: candidatePos,
    targetLevel: targetPos,
    qualifyingFactors,
    gaps,
  };
}

// ----------------------------------------------------------------------------
// AI-POWERED JUDGMENT FOR NUANCED MATCHING
// ----------------------------------------------------------------------------
// Uses Claude Haiku to make recruiter-level judgments for nuanced cases.
// This handles scenarios that rule-based logic can't capture:
// - "Chef who can cook for toddlers" → needs family cooking experience
// - "Butler for royalty" → needs formal service, protocol knowledge
// - Transferable skills from adjacent industries
// ----------------------------------------------------------------------------

const aiJudgmentSchema = z.object({
  isMatch: z.boolean().describe('Set true if the candidate has the right position/role for the search. Only set false if they are clearly wrong department (deck vs interior) or completely unrelated role. When in doubt, set true and let the score reflect quality.'),
  confidence: z.number().min(0).max(1).describe('Confidence in the assessment (0-1)'),
  matchScore: z.number().min(0).max(100).describe('Score based on how well candidate matches: 70-100 if position matches, 50-69 if related position, 0-49 if wrong department/role.'),
  reasoning: z.string().describe('Brief explanation of match quality'),
  specialStrengths: z.array(z.string()).describe('Special strengths relevant to this specific search'),
  concerns: z.array(z.string()).describe('Any concerns or gaps for this role'),
  stepUpPotential: z.boolean().describe('Whether they could step up to this role with support'),
});

// AIJudgment interface is defined earlier in the file for use in VectorSearchCandidate

interface CandidateForJudgment {
  primary_position: string | null;
  positions_held: string[] | null;
  years_experience: number | null;
  profile_summary: string | null;
  cv_skills: string[] | null;
  certifications_extracted: CertificationExtracted[] | null;
  yacht_experience_extracted: YachtExperience[] | null;
  villa_experience_extracted: VillaExperience[] | null;
  languages_extracted: unknown;
  gender: string | null;
}

/**
 * Calculate total experience years from work history when years_experience is null.
 * This prevents the AI from seeing "0 years" for candidates who have work history.
 */
function calculateTotalExperienceYears(candidate: CandidateForJudgment): number | string {
  // Use explicit years_experience if available
  if (candidate.years_experience && candidate.years_experience > 0) {
    return candidate.years_experience;
  }

  // Calculate from extracted work history
  let totalMonths = 0;

  if (candidate.yacht_experience_extracted?.length) {
    totalMonths += candidate.yacht_experience_extracted.reduce(
      (sum, y) => sum + (y.duration_months || 0), 0
    );
  }

  if (candidate.villa_experience_extracted?.length) {
    totalMonths += candidate.villa_experience_extracted.reduce(
      (sum, v) => sum + (v.duration_months || 0), 0
    );
  }

  // Return calculated years or "Not specified" if we still can't determine
  if (totalMonths > 0) {
    return Math.round(totalMonths / 12);
  }

  // If they have positions listed, they likely have experience even if we can't quantify it
  if (candidate.positions_held?.length || candidate.primary_position) {
    return 'Experience on file (see positions)';
  }

  return 'Not specified';
}

interface AISearchContext {
  role: string;
  location?: string;
  requirements?: string;
}

/**
 * Use AI to make nuanced judgment calls about candidate fit.
 * This is called for candidates that pass the hard filters but need
 * more sophisticated evaluation.
 */
async function assessCandidateWithAI(
  candidate: CandidateForJudgment,
  searchContext: AISearchContext
): Promise<AIJudgment | null> {
  try {
    // Build candidate profile - include ALL available data
    const candidateProfile = {
      currentPosition: candidate.primary_position || 'Not specified',
      allPositions: candidate.positions_held?.join(', ') || 'Not specified',
      yearsExperience: calculateTotalExperienceYears(candidate),
      gender: candidate.gender || 'Not specified',
      skills: candidate.cv_skills?.slice(0, 20).join(', ') || 'Not specified',
      certifications: candidate.certifications_extracted?.map(c => c.name).slice(0, 15).join(', ') || 'Not specified',
      profileSummary: (candidate.profile_summary || '').slice(0, 800) || 'Not available',
      yachtExperience: candidate.yacht_experience_extracted?.length
        ? candidate.yacht_experience_extracted.map(y =>
            `${y.position || 'Role'} on ${y.yacht_size_meters || '?'}m ${y.yacht_type || 'yacht'} (${y.duration_months || '?'} months)`
          ).slice(0, 8).join('; ')
        : 'Not specified',
      villaExperience: candidate.villa_experience_extracted?.length
        ? candidate.villa_experience_extracted.map(v =>
            `${v.position || 'Role'} at ${v.property_type || 'property'} in ${v.location || 'location'} (${v.duration_months || '?'} months)`
          ).slice(0, 5).join('; ')
        : 'Not specified',
    };

    const { object } = await generateObject({
      model: judgmentModel,
      schema: aiJudgmentSchema,
      system: `You are a recruitment expert for superyachts, private households, and luxury estates.

YOUR TASK IS SIMPLE: Compare what the job requires vs what the candidate has.

JOB BRIEF REQUIREMENTS → CANDIDATE PROFILE → MATCH OR NOT?

MATCHING LOGIC:
1. POSITION: Does the candidate's current or past positions include the role being searched?
   - "Chief Stewardess" searching → Candidate is/was Chief Stewardess → MATCH
   - "Chief Stewardess" searching → Candidate is only 2nd Stewardess → NOT a match for this senior role
   - If they HAVE the title (current or past), they likely have the experience too

2. SPECIFIC REQUIREMENTS: Only check what's actually mentioned in the brief
   - Brief mentions "55m+" → Check if candidate has 55m+ yacht experience
   - Brief mentions "Female" → Check gender
   - Brief mentions "10 years" → Check experience years
   - Brief says nothing about yacht size → DON'T filter on yacht size

3. DEPARTMENT: Basic sanity check only
   - Don't match deck crew (Captain, Officer) to interior roles (Stewardess)
   - Don't match yacht crew to childcare (Nanny) unless they have childcare experience

SCORING (Simple):
- 80-100: Position matches + meets mentioned requirements
- 60-79: Position matches + partially meets requirements OR strong related experience
- 40-59: Related position, might be suitable with some gaps
- 0-39: Wrong position/department → isMatch: false

CRITICAL: If the candidate's position MATCHES what's being searched (e.g., searching for Chief Stewardess and candidate IS a Chief Stewardess), they should score 70+ unless they fail a specific requirement mentioned in the brief.

BE GENEROUS with candidates who have the right position title. The vector search already filtered for relevance - your job is to confirm the match, not find reasons to reject.`,
      prompt: `JOB BRIEF:
Role: ${searchContext.role}
Location: ${searchContext.location || 'Any'}
Requirements: ${searchContext.requirements || 'None specified'}

CANDIDATE:
- Position: ${candidateProfile.currentPosition}
- Past Positions: ${candidateProfile.allPositions}
- Experience: ${candidateProfile.yearsExperience}
- Gender: ${candidateProfile.gender}
- Skills: ${candidateProfile.skills}
- Certifications: ${candidateProfile.certifications}
- Yacht History: ${candidateProfile.yachtExperience}
- Household History: ${candidateProfile.villaExperience}
- Summary: ${candidateProfile.profileSummary}

Does this candidate match the job brief? Compare requirements vs profile.`,
    });

    return object;
  } catch (error) {
    console.error('[Brief Match] AI judgment error:', error);
    return null;
  }
}

/**
 * Batch assess multiple candidates with AI for efficiency.
 * Runs assessments in parallel with concurrency limit.
 */
async function batchAssessCandidatesWithAI(
  candidates: Array<CandidateForJudgment & { id: string }>,
  searchContext: AISearchContext,
  concurrency: number = 5
): Promise<Map<string, AIJudgment>> {
  const results = new Map<string, AIJudgment>();

  // Process in batches
  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (candidate) => {
        const judgment = await assessCandidateWithAI(candidate, searchContext);
        return { id: candidate.id, judgment };
      })
    );

    for (const { id, judgment } of batchResults) {
      if (judgment) {
        results.set(id, judgment);
      }
    }
  }

  return results;
}

// ----------------------------------------------------------------------------
// PHASE 4: AI-ENHANCED QUERY PARSING
// ----------------------------------------------------------------------------
// Uses AI to extract structured requirements from natural language queries.
// Handles nuanced requests like "chef for Russian cuisine for toddlers",
// "butler with royalty experience", "captain for 100m+ yacht".
// ----------------------------------------------------------------------------

const aiQueryParseSchema = z.object({
  position: z.string().describe('The primary position/role being searched for'),
  department: z.enum(['deck', 'interior', 'engineering', 'galley', 'childcare', 'security', 'management', 'other'])
    .describe('The department this role belongs to'),
  seniorityLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'executive'])
    .describe('The seniority level expected'),
  hardRequirements: z.object({
    minYearsExperience: z.number().nullable().describe('Minimum years of experience required'),
    minYachtSizeMeters: z.number().nullable().describe('Minimum yacht size experience in meters'),
    requiredCertifications: z.array(z.string()).describe('Must-have certifications'),
    requiredLicenses: z.array(z.string()).describe('Required captain/officer licenses like "3000GT", "Master Unlimited", "500GT"'),
    languages: z.array(z.string()).describe('Required languages'),
  }),
  softRequirements: z.object({
    cuisineTypes: z.array(z.string()).describe('Preferred cuisine specialties (for chefs)'),
    serviceStyle: z.array(z.string()).describe('Service style preferences (formal, casual, royalty, family)'),
    specialSkills: z.array(z.string()).describe('Special skills mentioned'),
    dietaryExpertise: z.array(z.string()).describe('Dietary expertise (allergies, toddler food, health-conscious)'),
    preferredCertifications: z.array(z.string()).describe('Nice-to-have certifications'),
  }),
  context: z.object({
    yachtSize: z.number().nullable().describe('Size of the yacht for this job in meters'),
    propertyType: z.string().nullable().describe('Type of property (estate, villa, townhouse)'),
    clientType: z.string().nullable().describe('Type of client (family, single, royalty, corporate)'),
    travelRequired: z.boolean().describe('Whether travel is mentioned'),
  }),
  searchKeywords: z.array(z.string()).describe('Key terms to look for in candidate profiles'),
});

type AIQueryParsed = z.infer<typeof aiQueryParseSchema>;

// Use Haiku for fast, cheap role extraction
const roleExtractionModel = anthropic('claude-3-5-haiku-20241022');

// Schema for AI role extraction
const roleExtractionSchema = z.object({
  role: z.string().describe('The primary job role/position being searched for (e.g., "Chief Stewardess", "Butler", "Captain"). Use proper title case. If unclear or no specific role mentioned, return "this role".'),
});

/**
 * Fallback role extraction using regex patterns when AI is unavailable.
 * Covers the most common yacht crew and household staff roles.
 */
function extractRoleWithRegex(query: string): string | null {
  const queryLower = query.toLowerCase();

  // Common role patterns in order of specificity (more specific first)
  const rolePatterns: Array<{ pattern: RegExp; role: string }> = [
    // Interior - specific first
    { pattern: /chief\s+stew(?:ardess)?/i, role: 'Chief Stewardess' },
    { pattern: /head\s+stew(?:ardess)?/i, role: 'Chief Stewardess' },
    { pattern: /second\s+stew(?:ardess)?/i, role: 'Second Stewardess' },
    { pattern: /third\s+stew(?:ardess)?/i, role: 'Third Stewardess' },
    { pattern: /stew(?:ardess)?/i, role: 'Stewardess' },
    { pattern: /interior\s+manager/i, role: 'Interior Manager' },
    { pattern: /purser/i, role: 'Purser' },
    { pattern: /head\s+butler/i, role: 'Head Butler' },
    { pattern: /butler/i, role: 'Butler' },
    { pattern: /head\s+housekeeper/i, role: 'Head Housekeeper' },
    { pattern: /housekeeper/i, role: 'Housekeeper' },

    // Deck - specific first
    { pattern: /captain/i, role: 'Captain' },
    { pattern: /master/i, role: 'Captain' },
    { pattern: /chief\s+officer/i, role: 'Chief Officer' },
    { pattern: /first\s+officer/i, role: 'First Officer' },
    { pattern: /second\s+officer/i, role: 'Second Officer' },
    { pattern: /third\s+officer/i, role: 'Third Officer' },
    { pattern: /officer/i, role: 'Officer' },
    { pattern: /bosun/i, role: 'Bosun' },
    { pattern: /lead\s+deck(?:hand)?/i, role: 'Lead Deckhand' },
    { pattern: /deck(?:hand)?/i, role: 'Deckhand' },

    // Engineering
    { pattern: /chief\s+engineer/i, role: 'Chief Engineer' },
    { pattern: /second\s+engineer/i, role: 'Second Engineer' },
    { pattern: /third\s+engineer/i, role: 'Third Engineer' },
    { pattern: /engineer/i, role: 'Engineer' },
    { pattern: /eto/i, role: 'ETO' },
    { pattern: /electrician/i, role: 'Electrician' },

    // Galley
    { pattern: /executive\s+chef/i, role: 'Executive Chef' },
    { pattern: /head\s+chef/i, role: 'Head Chef' },
    { pattern: /sous\s+chef/i, role: 'Sous Chef' },
    { pattern: /chef/i, role: 'Chef' },
    { pattern: /cook/i, role: 'Cook' },

    // Childcare
    { pattern: /head\s+nanny/i, role: 'Head Nanny' },
    { pattern: /nanny/i, role: 'Nanny' },
    { pattern: /governess/i, role: 'Governess' },
    { pattern: /tutor/i, role: 'Tutor' },

    // Security
    { pattern: /head\s+of\s+security/i, role: 'Head of Security' },
    { pattern: /cpo/i, role: 'Close Protection Officer' },
    { pattern: /close\s+protection/i, role: 'Close Protection Officer' },
    { pattern: /security/i, role: 'Security Officer' },
    { pattern: /bodyguard/i, role: 'Bodyguard' },

    // Management
    { pattern: /estate\s+manager/i, role: 'Estate Manager' },
    { pattern: /house\s+manager/i, role: 'House Manager' },
    { pattern: /personal\s+assistant/i, role: 'Personal Assistant' },
    { pattern: /pa\b/i, role: 'Personal Assistant' },
  ];

  for (const { pattern, role } of rolePatterns) {
    if (pattern.test(queryLower)) {
      return role;
    }
  }

  return null;
}

/**
 * Extract the primary role/position from a natural language query using AI.
 * Handles typos, variations, and any role - not limited to a static list.
 * Falls back to regex-based extraction if AI fails.
 */
async function extractRoleFromQuery(query: string): Promise<string> {
  if (!query || query.trim().length < 3) {
    return 'this role';
  }

  try {
    const { object } = await generateObject({
      model: roleExtractionModel,
      schema: roleExtractionSchema,
      prompt: `Extract the primary job role/position from this search query. The context is yacht crew and private household staff recruitment.

Query: "${query}"

Examples:
- "looking for a chief stewardess for a 50m yacht" → "Chief Stewardess"
- "need a butlr with wine experience" → "Butler" (note: handle typos)
- "captain for mediterranean charter" → "Captain"
- "someone to manage the estate" → "Estate Manager"
- "i need crew for my boat" → "this role" (no specific role mentioned)

Return just the role name in proper title case. If no clear role is mentioned, return "this role".`,
    });

    return object.role || 'this role';
  } catch (error) {
    console.error('[extractRoleFromQuery] AI extraction failed:', error);
    // Fallback to regex-based extraction when AI is unavailable
    const regexExtracted = extractRoleWithRegex(query);
    if (regexExtracted) {
      console.log(`[extractRoleFromQuery] Using regex fallback: "${regexExtracted}"`);
      return regexExtracted;
    }
    return 'this role';
  }
}

/**
 * Use AI to parse a natural language search query into structured requirements.
 * This enables nuanced matching for complex queries.
 */
async function parseQueryWithAI(
  role: string,
  location: string | undefined,
  requirements: string | undefined
): Promise<AIQueryParsed | null> {
  // Only use AI parsing for non-trivial queries
  const fullQuery = `${role} ${location || ''} ${requirements || ''}`.trim();
  if (fullQuery.length < 15) {
    return null;
  }

  try {
    const { object } = await generateObject({
      model: judgmentModel,
      schema: aiQueryParseSchema,
      system: `You are an expert recruiter for luxury service industries (superyachts, private households, estates).

Your job is to parse a job search query and extract structured requirements.

DEPARTMENTS:
- deck: captain, officer, deckhand, bosun
- interior: stewardess, butler, housekeeper, purser
- engineering: engineer, ETO, electrical
- galley: chef, cook
- childcare: nanny, governess, tutor
- security: CPO, bodyguard, security
- management: estate manager, house manager, PA

SENIORITY LEVELS:
- entry: 0-6 months experience, trainee roles
- junior: 6 months - 2 years
- mid: 2-5 years
- senior: 5+ years, leadership roles
- executive: captain, chief roles, department heads

LICENSE REQUIREMENTS (CRITICAL for Captain/Officer roles):
- Extract any mentioned captain/officer licenses like "3000GT", "500GT", "Master Unlimited", "OOW"
- "3000GT" = Master 3000 Gross Tonnage license
- "500GT" = Master 500 Gross Tonnage license
- These are HARD requirements that MUST be extracted to requiredLicenses array
- Example: "Captain with 3000GT" → requiredLicenses: ["3000GT"]

Parse the query carefully. Extract any specific requirements mentioned, especially licenses for captain roles.`,
      prompt: `Parse this job search query:

Role: ${role}
Location: ${location || 'Not specified'}
Additional Requirements: ${requirements || 'None specified'}

Extract the structured requirements from this query.`,
    });

    return object;
  } catch (error) {
    console.error('[Brief Match] AI query parsing error:', error);
    return null;
  }
}

function parseRequirementsText(requirements: string, role: string): ParsedRequirements {
  const text = (requirements || '').toLowerCase();

  // Detect if this is a junior/entry role
  const juniorIndicators = [
    'entry', 'junior', 'at least 6 months', 'minimum 6 months',
    '6 months experience', 'first job', 'trainee', 'eager to learn',
    'looking to start', 'new to yachting', 'green', 'day work'
  ];
  const isJuniorRole = juniorIndicators.some(ind => text.includes(ind)) ||
    ['deckhand', 'stewardess', 'junior'].some(r => role.toLowerCase().includes(r));

  // Detect if this is a senior role
  const seniorIndicators = [
    '5+ years', '5 years', '7+ years', '10+ years', 'senior',
    'extensive experience', 'proven track record', 'management experience',
    'captain', 'chief', 'head', 'lead'
  ];
  const isSeniorRole = seniorIndicators.some(ind => text.includes(ind));

  // Parse experience requirement
  let minExperienceMonths: number | null = null;
  let maxExperienceMonths: number | null = null;

  // Match patterns like "6 months", "1 year", "2-3 years", "at least 6 months"
  const expPatterns = [
    /at least (\d+)\s*months?/i,
    /minimum (\d+)\s*months?/i,
    /(\d+)\s*months?\s*(?:experience|exp)/i,
    /(\d+)\+?\s*years?\s*(?:experience|exp)/i,
    /at least (\d+)\s*years?/i,
    /minimum (\d+)\s*years?/i,
  ];

  for (const pattern of expPatterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (pattern.source.includes('year')) {
        minExperienceMonths = num * 12;
      } else {
        minExperienceMonths = num;
      }
      break;
    }
  }

  // For junior roles with low min experience, set a reasonable max
  // (someone with 7 years won't take a 6-month-experience-required job)
  if (isJuniorRole && minExperienceMonths && minExperienceMonths <= 12) {
    maxExperienceMonths = 36; // 3 years max for entry level
  } else if (minExperienceMonths && minExperienceMonths <= 24) {
    maxExperienceMonths = 60; // 5 years max for 2-year requirement
  }

  // Parse minimum yacht size EXPERIENCE requirement first
  // These patterns capture "experience over 100m", "100m+ experience", etc.
  // This is DIFFERENT from job yacht size - it's the candidate's required experience level
  let minYachtExperience: number | null = null;
  const experiencePatterns = [
    /experience\s+(?:on\s+)?(?:over|above|at least|min(?:imum)?)\s+(\d+)\s*m/i,
    /(\d+)\s*m\+?\s+experience/i,
    /worked\s+(?:on\s+)?(?:vessels?\s+)?(?:over|above)\s+(\d+)\s*m/i,
    /experience\s+(\d+)\s*m\s*\+/i,
    /minimum\s+(\d+)\s*m\s+(?:experience|vessel)/i,
    /(\d+)\s*m\s+minimum/i,
    /(?:over|above)\s+(\d+)\s*m/i,  // "over 100m" in requirements context
  ];

  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match) {
      minYachtExperience = parseInt(match[1]);
      break;
    }
  }

  // Parse yacht size (for job vessel size, not experience requirement)
  let yachtSize: number | null = null;
  const sizePatterns = [
    /(\d+)\s*m\s*(?:yacht|boat|vessel)/i,
    /(\d+)\s*meter/i,
    /up to (\d+)\s*m/i,
    /(\d+)m\s*(?:motor|sail)/i,
  ];

  for (const pattern of sizePatterns) {
    const match = text.match(pattern);
    if (match) {
      yachtSize = parseInt(match[1]);
      break;
    }
  }

  // Parse required certifications - look for all mentioned certs
  const requiredCerts: string[] = [];
  const preferredCerts: string[] = [];

  for (const [certKey, aliases] of Object.entries(CERT_ALIASES)) {
    for (const alias of aliases) {
      if (text.includes(alias)) {
        // Check context - is it required or preferred?
        const isPreferred = /prefer|nice to have|ideally|bonus/i.test(text);
        if (isPreferred) {
          if (!preferredCerts.includes(certKey)) preferredCerts.push(certKey);
        } else {
          if (!requiredCerts.includes(certKey)) requiredCerts.push(certKey);
        }
        break; // Found this cert, move to next
      }
    }
  }

  // Salary indicator (helps understand role level)
  let salaryIndicator: 'low' | 'medium' | 'high' | null = null;
  const salaryMatch = text.match(/€?\s*(\d{1,2})[,.]?(\d{3})/);
  if (salaryMatch) {
    const salary = parseInt(salaryMatch[1]) * 1000 + parseInt(salaryMatch[2] || '0');
    if (salary < 3500) salaryIndicator = 'low';
    else if (salary < 6000) salaryIndicator = 'medium';
    else salaryIndicator = 'high';
  }

  return {
    min_experience_months: minExperienceMonths,
    max_experience_months: maxExperienceMonths,
    yacht_size_meters: yachtSize,
    min_yacht_size_experience_meters: minYachtExperience,
    required_certs: requiredCerts,
    preferred_certs: preferredCerts,
    is_junior_role: isJuniorRole,
    is_senior_role: isSeniorRole,
    salary_indicator: salaryIndicator,
  };
}

function getPositionLevel(position: string | null): number {
  if (!position) return 2; // Default to mid-level
  const normalized = position.toLowerCase().trim();

  // Check exact match first
  if (POSITION_HIERARCHY[normalized] !== undefined) {
    return POSITION_HIERARCHY[normalized];
  }

  // Check partial matches
  for (const [key, level] of Object.entries(POSITION_HIERARCHY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return level;
    }
  }

  return 2; // Default mid-level
}

function getLargestYachtWorked(yachtExperience: YachtExperience[] | null): number | null {
  if (!yachtExperience || yachtExperience.length === 0) return null;

  const sizes = yachtExperience
    .map(y => y.yacht_size_meters)
    .filter((s): s is number => s !== null && s !== undefined && s > 0);

  if (sizes.length === 0) return null;
  return Math.max(...sizes);
}

function candidateHasCert(
  certKey: string,
  candidate: {
    has_stcw: boolean | null;
    has_eng1: boolean | null;
    certifications_extracted: CertificationExtracted[] | null;
    licenses_extracted: LicenseExtracted[] | null;
  }
): boolean {
  // Quick checks for common certs
  if (certKey === 'stcw' && candidate.has_stcw) return true;
  if (certKey === 'eng1' && candidate.has_eng1) return true;

  const aliases = CERT_ALIASES[certKey] || [certKey];

  // Check certifications_extracted
  if (candidate.certifications_extracted) {
    for (const cert of candidate.certifications_extracted) {
      const certName = (cert.name || '').toLowerCase();
      const certCategory = (cert.category || '').toLowerCase();
      if (aliases.some(a => certName.includes(a) || certCategory.includes(a))) {
        return true;
      }
    }
  }

  // Check licenses_extracted
  if (candidate.licenses_extracted) {
    for (const license of candidate.licenses_extracted) {
      const licenseName = (license.name || '').toLowerCase();
      if (aliases.some(a => licenseName.includes(a))) {
        return true;
      }
    }
  }

  return false;
}

function assessRecruiterSuitability(
  candidate: {
    years_experience: number | null;
    primary_position: string | null;
    positions_held: string[] | null;
    yacht_experience_extracted: YachtExperience[] | null;
    certifications_extracted: CertificationExtracted[] | null;
    licenses_extracted: LicenseExtracted[] | null;
    has_stcw: boolean | null;
    has_eng1: boolean | null;
  },
  parsedReqs: ParsedRequirements,
  searchRole: string
): RecruiterAssessment {
  const flags = {
    overqualified: false,
    underqualified: false,
    missing_qualifications: false,
    career_mismatch: false,
    flight_risk: false,
  };

  let suitabilityScore = 1.0;
  const reasons: string[] = [];
  const missingCerts: string[] = [];

  const candidateExpMonths = (candidate.years_experience || 0) * 12;
  const candidatePositionLevel = getPositionLevel(candidate.primary_position);
  const searchRoleLevel = getPositionLevel(searchRole);
  const largestYacht = getLargestYachtWorked(candidate.yacht_experience_extracted as YachtExperience[] | null);

  // ==========================================================================
  // 1. OVERQUALIFICATION CHECK
  // ==========================================================================
  // If the job asks for 6 months experience and candidate has 7 years,
  // they're not going to take this job (unless it's a step up in vessel size/prestige)

  if (parsedReqs.is_junior_role && parsedReqs.max_experience_months) {
    if (candidateExpMonths > parsedReqs.max_experience_months * 2) {
      // Severely overqualified (more than 2x max expected experience)
      flags.overqualified = true;
      suitabilityScore *= 0.3;
      reasons.push(`Severely overqualified: ${Math.round(candidateExpMonths/12)} years for entry role`);
    } else if (candidateExpMonths > parsedReqs.max_experience_months * 1.5) {
      // Moderately overqualified
      flags.overqualified = true;
      suitabilityScore *= 0.6;
      reasons.push(`Overqualified: ${Math.round(candidateExpMonths/12)} years for junior role`);
    }
  }

  // Position level mismatch (Captain applying for deckhand)
  if (candidatePositionLevel > searchRoleLevel + 1) {
    // Exception: If job yacht is much bigger, this could be a step up
    const jobYachtSize = parsedReqs.yacht_size_meters;
    const yachtSizeStepUp = largestYacht && jobYachtSize && jobYachtSize > largestYacht * 1.5;

    if (!yachtSizeStepUp) {
      flags.overqualified = true;
      flags.flight_risk = true;
      const levelDiff = candidatePositionLevel - searchRoleLevel;
      suitabilityScore *= Math.max(0.2, 1 - (levelDiff * 0.25));
      reasons.push(`Position step-down: ${candidate.primary_position} applying for ${searchRole}`);
    } else {
      reasons.push(`Accepting lower role for bigger yacht (${largestYacht}m → ${jobYachtSize}m)`);
    }
  }

  // ==========================================================================
  // 2. UNDERQUALIFICATION CHECK (Experience)
  // ==========================================================================

  // Minimum experience not met
  if (parsedReqs.min_experience_months && candidateExpMonths < parsedReqs.min_experience_months) {
    flags.underqualified = true;
    const shortfall = parsedReqs.min_experience_months - candidateExpMonths;
    if (shortfall > 12) {
      suitabilityScore *= 0.4;
      reasons.push(`Underqualified: ${Math.round(candidateExpMonths/12)} years, needs ${Math.round(parsedReqs.min_experience_months/12)}`);
    } else {
      suitabilityScore *= 0.7; // Close enough, might be okay
      reasons.push(`Slightly under experience requirement`);
    }
  }

  // Position level too low for senior role
  if (parsedReqs.is_senior_role && candidatePositionLevel < searchRoleLevel - 1) {
    flags.underqualified = true;
    suitabilityScore *= 0.5;
    reasons.push(`Position level too junior for senior role`);
  }

  // ==========================================================================
  // 2b. UNDERQUALIFICATION CHECK (Yacht Size Experience)
  // ==========================================================================
  // If the search requires experience on large yachts (e.g., "100m+ experience"),
  // candidates who have never worked on yachts that size should be penalized

  if (parsedReqs.min_yacht_size_experience_meters) {
    const requiredSize = parsedReqs.min_yacht_size_experience_meters;

    if (!largestYacht) {
      // No yacht experience data - can't verify, moderate penalty
      flags.underqualified = true;
      suitabilityScore *= 0.5;
      reasons.push(`Cannot verify ${requiredSize}m+ yacht experience`);
    } else if (largestYacht < requiredSize) {
      // Candidate's largest yacht is smaller than required
      flags.underqualified = true;
      const shortfall = requiredSize - largestYacht;

      if (shortfall >= 40) {
        // Major gap (e.g., 60m experience for 100m requirement)
        suitabilityScore *= 0.2;
        reasons.push(`Underqualified: largest yacht ${largestYacht}m, needs ${requiredSize}m+ experience`);
      } else if (shortfall >= 20) {
        // Moderate gap
        suitabilityScore *= 0.4;
        reasons.push(`Limited large yacht experience: ${largestYacht}m vs ${requiredSize}m+ required`);
      } else {
        // Close enough (within 20m)
        suitabilityScore *= 0.7;
        reasons.push(`Slightly under yacht size requirement: ${largestYacht}m vs ${requiredSize}m+`);
      }
    }
  }

  // ==========================================================================
  // 3. QUALIFICATION/CERTIFICATION CHECK
  // ==========================================================================
  // This is critical - missing required certs is often a dealbreaker

  for (const certKey of parsedReqs.required_certs) {
    if (!candidateHasCert(certKey, candidate)) {
      missingCerts.push(certKey);
    }
  }

  if (missingCerts.length > 0) {
    flags.missing_qualifications = true;
    // Impact depends on which certs are missing
    const criticalMissing = missingCerts.filter(c => ['stcw', 'eng1', 'yachtmaster'].includes(c));
    const otherMissing = missingCerts.filter(c => !['stcw', 'eng1', 'yachtmaster'].includes(c));

    if (criticalMissing.length > 0) {
      suitabilityScore *= 0.3; // Critical certs missing = major issue
      reasons.push(`Missing critical certs: ${criticalMissing.map(c => c.toUpperCase()).join(', ')}`);
    }
    if (otherMissing.length > 0) {
      suitabilityScore *= Math.max(0.5, 1 - (otherMissing.length * 0.15));
      reasons.push(`Missing certs: ${otherMissing.map(c => c.toUpperCase()).join(', ')}`);
    }
  }

  // Bonus for having preferred certs
  let preferredCertsHad = 0;
  for (const certKey of parsedReqs.preferred_certs) {
    if (candidateHasCert(certKey, candidate)) {
      preferredCertsHad++;
    }
  }
  if (preferredCertsHad > 0 && parsedReqs.preferred_certs.length > 0) {
    const bonus = 1 + (preferredCertsHad / parsedReqs.preferred_certs.length) * 0.1;
    suitabilityScore *= bonus;
    reasons.push(`Has ${preferredCertsHad} preferred certs`);
  }

  // ==========================================================================
  // 4. YACHT SIZE ASSESSMENT (NUANCED)
  // ==========================================================================
  // This isn't a simple match - career trajectories matter:
  // - Deckhand on 40m taking same role on 100m = good (step up)
  // - Captain on 100m taking Captain role on 40m = unusual (step down)
  // - Chief Stew on 100m wanting 40m = might be valid (less crew management)

  if (parsedReqs.yacht_size_meters && largestYacht) {
    const jobSize = parsedReqs.yacht_size_meters;
    const sizeDiff = largestYacht - jobSize;

    if (sizeDiff > 50) {
      // They've worked on much bigger yachts
      // For entry-level roles, this is concerning (overqualified for the operation)
      if (parsedReqs.is_junior_role) {
        flags.overqualified = true;
        suitabilityScore *= 0.5;
        reasons.push(`Large yacht experience (${largestYacht}m) for ${jobSize}m job`);
      } else {
        // Senior might take smaller yacht for private program, rotation, lifestyle
        suitabilityScore *= 0.9; // Minor concern only
        reasons.push(`Used to larger yachts (${largestYacht}m vs ${jobSize}m) - may have valid reasons`);
      }
    } else if (sizeDiff > 30 && parsedReqs.is_junior_role) {
      // Moderate size difference for junior role
      suitabilityScore *= 0.75;
      reasons.push(`Worked on larger yachts (${largestYacht}m)`);
    }
    // Note: We don't penalize if job yacht is bigger - that's a career step up
  }

  // ==========================================================================
  // 5. CAREER MISMATCH CHECK
  // ==========================================================================
  // Is their career trajectory aligned with this role?

  const candidatePositions = [
    candidate.primary_position?.toLowerCase(),
    ...(candidate.positions_held || []).map(p => p.toLowerCase())
  ].filter(Boolean);

  // Check if their positions are in a different department entirely
  const searchRoleLower = searchRole.toLowerCase();
  const isDeck = ['deckhand', 'bosun', 'officer', 'captain', 'mate'].some(p => searchRoleLower.includes(p));
  const isInterior = ['stew', 'purser', 'butler', 'house'].some(p => searchRoleLower.includes(p));
  const isEngineering = ['engineer', 'eto', 'mechanic'].some(p => searchRoleLower.includes(p));
  const isGalley = ['chef', 'cook', 'galley'].some(p => searchRoleLower.includes(p));

  const candidateIsDeck = candidatePositions.some(p => ['deckhand', 'bosun', 'officer', 'captain', 'mate'].some(d => p?.includes(d)));
  const candidateIsInterior = candidatePositions.some(p => ['stew', 'purser', 'butler', 'house'].some(d => p?.includes(d)));
  const candidateIsEngineering = candidatePositions.some(p => ['engineer', 'eto', 'mechanic'].some(d => p?.includes(d)));
  const candidateIsGalley = candidatePositions.some(p => ['chef', 'cook', 'galley'].some(d => p?.includes(d)));

  // Check for department mismatch
  // IMPORTANT: Each department should only match candidates from that department
  // - Deck roles (captain, officer, bosun, deckhand) should not match engineering, interior, or galley
  // - Engineering roles should not match deck, interior, or galley
  // - Interior roles should not match deck, engineering, or galley
  // - Galley roles should not match deck, engineering, or interior
  if ((isDeck && !candidateIsDeck) ||
      (isInterior && !candidateIsInterior) ||
      (isEngineering && !candidateIsEngineering) ||
      (isGalley && !candidateIsGalley)) {
    flags.career_mismatch = true;
    suitabilityScore *= 0.2; // Stronger penalty for wrong department
    reasons.push(`Department mismatch: ${candidate.primary_position} for ${searchRole}`);
  }

  // ==========================================================================
  // 6. FLIGHT RISK ASSESSMENT
  // ==========================================================================
  // High flight risk if they're taking a significant step down

  if (flags.overqualified && candidatePositionLevel > searchRoleLevel) {
    flags.flight_risk = true;
    reasons.push(`Flight risk: likely to leave for better opportunity`);
  }

  // Also consider salary indicator
  if (parsedReqs.salary_indicator === 'low' && candidateExpMonths > 60) {
    flags.flight_risk = true;
    suitabilityScore *= 0.8;
    reasons.push(`Low salary for experienced candidate`);
  }

  // ==========================================================================
  // DETERMINE RECOMMENDATION
  // ==========================================================================

  let recommendation: RecruiterAssessment['recommendation'];

  if (suitabilityScore >= 0.85 && !flags.overqualified && !flags.underqualified && !flags.missing_qualifications) {
    recommendation = 'strong';
  } else if (suitabilityScore >= 0.65 && !flags.career_mismatch && missingCerts.length === 0) {
    recommendation = 'suitable';
  } else if (suitabilityScore >= 0.4) {
    recommendation = 'consider';
  } else {
    recommendation = 'unlikely';
  }

  return {
    suitability_score: Math.max(0.1, Math.min(1.0, suitabilityScore)), // Clamp 0.1-1.0
    recommendation,
    flags,
    missing_certs: missingCerts,
    reasoning: reasons.length > 0 ? reasons.join('; ') : 'Good match',
  };
}

// ----------------------------------------------------------------------------
// MAIN HANDLER
// ----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    let body: unknown = {};
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('[Brief Match] JSON parse error:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = briefMatchRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('[Brief Match] Validation error:', parseResult.error.flatten());
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { query, preview_mode = false, limit } = parseResult.data;

    // Use the query exactly as provided - no transformation, no reconstruction
    const searchQuery = query;
    
    // Determine result limit based on preview mode
    const resultLimit = preview_mode && limit ? Math.min(limit, MAX_RESULTS) : MAX_RESULTS;

    // Create Supabase client with service role for anonymous access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate embedding for the search query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(searchQuery);
    } catch (embeddingError) {
      console.error('[Brief Match] Embedding error:', embeddingError);
      return NextResponse.json({
        error: 'Failed to generate embedding',
        details: process.env.NODE_ENV === 'development' && embeddingError instanceof Error
          ? embeddingError.message
          : undefined
      }, { status: 500 });
    }

    // Search for matching candidates using VECTOR SIMILARITY
    // This uses pgvector's cosine distance operator to find semantically similar candidates
    // Much better than random selection - returns candidates actually relevant to the query
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    const { data: rpcResult, error: searchError } = await supabase
      .rpc('match_candidates_by_embedding', {
        query_embedding: embeddingString,
        match_threshold: 0.25, // Lower threshold to get more candidates
        match_count: 200 // Get more candidates to filter from
      });

    // If RPC doesn't exist, fall back to regular query with manual sorting
    // This is less efficient but works without the RPC function
    let candidatesWithEmbeddings = rpcResult;
    if (searchError?.code === '42883') { // Function doesn't exist
      console.log('[Brief Match] RPC not available, falling back to manual vector search');
      const { data: fallbackCandidates, error: fallbackError } = await supabase
        .from('candidates')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          primary_position,
          position_category,
          years_experience,
          nationality,
          availability_status,
          current_location,
          profile_summary,
          embedding,
          positions_held,
          cv_skills,
          languages_extracted,
          yacht_experience_extracted,
          villa_experience_extracted,
          certifications_extracted,
          licenses_extracted,
          education_extracted,
          references_extracted,
          highest_license,
          has_stcw,
          has_eng1,
          bio_full,
          bio_anonymized,
          gender
        `)
        .is('deleted_at', null)
        .not('embedding', 'is', null)
        .limit(500); // Get more candidates for manual filtering

      if (fallbackError) {
        console.error('[Brief Match] Fallback search error:', fallbackError);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
      }

      // Manual vector similarity calculation and sorting
      candidatesWithEmbeddings = (fallbackCandidates || [])
        .map(c => {
          let embedding: number[] | null = null;
          if (typeof c.embedding === 'string') {
            try { embedding = JSON.parse(c.embedding); } catch { embedding = null; }
          } else if (Array.isArray(c.embedding)) {
            embedding = c.embedding;
          }
          if (!embedding) return null;

          const similarity = cosineSimilarity(queryEmbedding, embedding);
          return { ...c, vector_similarity: similarity };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null && c.vector_similarity >= 0.25)
        .sort((a, b) => b.vector_similarity - a.vector_similarity)
        .slice(0, 200);
    }

    // Handle errors that weren't already handled by fallback
    if (searchError && searchError.code !== '42883') {
      console.error('[Brief Match] Search error:', searchError);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // Candidates from vector search (properly sorted by similarity)
    const candidates = candidatesWithEmbeddings || [];

    if (candidates.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    console.log(`[Brief Match] Vector search returned ${candidates.length} candidates`);

    // Parse requirements from the full query using simple text parsing
    // Note: We pass the full query as "requirements" since everything is in there
    const parsedRequirements = parseRequirementsText(searchQuery, '');
    console.log('[Brief Match] Parsed requirements from query:', parsedRequirements);

    // =========================================================================
    // PHASE 4: AI-ENHANCED QUERY PARSING
    // =========================================================================
    // Use AI to extract structured requirements from natural language query.
    // This helps with complex queries like "Chef for Russian cuisine who can cook for toddlers"
    // or "Captain for 100m yacht with experience hosting royalty"
    // =========================================================================

    let aiParsedQuery: AIQueryParsed | null = null;

    // Only use AI parsing for non-trivial queries (>15 chars)
    if (searchQuery.length > 15) {
      console.log('[Brief Match] Running AI query parsing...');
      const aiParseStartTime = Date.now();

      try {
        // Pass the full query as all three parameters since we don't split anymore
        aiParsedQuery = await parseQueryWithAI(searchQuery, '', '');
        if (aiParsedQuery) {
          console.log(`[Brief Match] AI query parsing completed in ${Date.now() - aiParseStartTime}ms`);
          console.log('[Brief Match] AI parsed query:', JSON.stringify(aiParsedQuery, null, 2));
        }
      } catch (error) {
        console.error('[Brief Match] AI query parsing failed:', error);
        // Continue without AI-parsed query
      }
    }

    // =========================================================================
    // PHASE 2: HARD DEPARTMENT FILTERING + STEP-UP CANDIDATE INCLUSION
    // =========================================================================
    // Filter candidates by department BEFORE vector scoring.
    // This ensures a Captain search NEVER returns an Engineer.
    // Also include "ready to step up" candidates (e.g., Chief Officer for Captain search).
    // =========================================================================

    // Extract primary role from query (use AI parsed position if available, otherwise use AI to extract from raw query)
    const primarySearchRole = aiParsedQuery?.position || await extractRoleFromQuery(searchQuery);
    const eligibleRoles = getEligibleRolesForStepUp(primarySearchRole);

    // Create search terms from the primary role for position matching
    const searchTerms = [primarySearchRole];

    // Define variables for backward compatibility with existing code
    const originalRole = primarySearchRole;
    const location = '';  // No longer extracted separately
    const timeline = '';  // No longer extracted separately
    const requirements = searchQuery;  // Use full query as requirements

    console.log(`[Brief Match] Search role: "${primarySearchRole}", Eligible roles (including step-up):`, eligibleRoles);

    // Check for gender requirement in query
    const queryLower = searchQuery.toLowerCase();
    const requiresFemale = queryLower.includes('female') ||
                          queryLower.includes('woman') ||
                          queryLower.includes('she/her');
    const requiresMale = queryLower.includes('male only') ||
                        queryLower.includes('man only') ||
                        queryLower.includes('he/him');

    if (requiresFemale || requiresMale) {
      console.log(`[Brief Match] Gender requirement detected: ${requiresFemale ? 'FEMALE' : 'MALE'} only`);
    }

    // Pre-filter candidates by department compatibility, position eligibility, and gender
    const departmentFilteredCandidates = candidates.filter((c: Record<string, unknown>) => {
      const candidatePosition = c.primary_position || '';
      const candidatePositionsHeld = c.positions_held || [];

      // HARD FILTER 0: Gender requirement (CRITICAL - cabin layouts, privacy)
      const candidateGender = typeof c.gender === 'string' ? c.gender.toLowerCase() : '';
      if (requiresFemale && candidateGender === 'male') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Brief Match] ✗ FILTERED (gender): ${c.first_name} ${c.last_name} - Male candidate, Female required`);
        }
        return false;
      }
      if (requiresMale && candidateGender === 'female') {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Brief Match] ✗ FILTERED (gender): ${c.first_name} ${c.last_name} - Female candidate, Male required`);
        }
        return false;
      }

      // HARD FILTER 1: Department compatibility
      // A deck role search should never return engineering candidates
      // Use position_category from CV extraction if available (more reliable than string inference)
      const isDepartmentCompatible = areDepartmentsCompatible(
        primarySearchRole,
        String(candidatePosition || ''),
        typeof c.position_category === 'string' ? c.position_category : undefined
      );

      if (!isDepartmentCompatible) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Brief Match] FILTERED OUT (department mismatch): ${c.first_name} ${c.last_name} - "${candidatePosition}" (category: ${c.position_category}) not compatible with search for "${primarySearchRole}"`);
        }
        return false;
      }

      // POSITION ELIGIBILITY CHECK
      // Include exact matches AND step-up candidates (e.g., Chief Officer for Captain)
      // This is a HARD filter - we don't return deckhands for captain searches
      const positionsHeldArray = Array.isArray(candidatePositionsHeld) ? candidatePositionsHeld.map(String) : [];
      const isEligible = isPositionEligible(String(candidatePosition || ''), positionsHeldArray, primarySearchRole);

      if (!isEligible) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Brief Match] FILTERED OUT (position): ${c.first_name} ${c.last_name} - "${candidatePosition}" not eligible for "${primarySearchRole}"`);
        }
        return false; // Filter out - position doesn't match search role
      }

      return true; // Passed both department and position eligibility filters
    });

    console.log(`[Brief Match] After department + position filter: ${departmentFilteredCandidates.length}/${candidates.length} candidates`);

    // =========================================================================
    // PHASE 4b: HARD REQUIREMENTS FILTERING (using AI-parsed query)
    // =========================================================================
    // If AI query parsing extracted hard requirements, apply them as filters.
    // This is a "soft" hard filter - we don't completely exclude but heavily penalize.
    // =========================================================================

    let hardRequirementsFilteredCandidates = departmentFilteredCandidates;

    if (aiParsedQuery && aiParsedQuery.hardRequirements) {
      const { hardRequirements } = aiParsedQuery;

      hardRequirementsFilteredCandidates = departmentFilteredCandidates.filter((c: Record<string, unknown>) => {
        // 1. Minimum years experience check
        if (hardRequirements.minYearsExperience !== null) {
          const candidateYears = typeof c.years_experience === 'number' ? c.years_experience : 0;
          // Allow some flexibility - 80% of requirement is okay
          if (candidateYears < hardRequirements.minYearsExperience * 0.8) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Brief Match] FILTERED (experience): ${c.first_name} ${c.last_name} - ${candidateYears} years < ${hardRequirements.minYearsExperience} required`);
            }
            return false;
          }
        }

        // 2. Minimum yacht size experience check
        if (hardRequirements.minYachtSizeMeters !== null) {
          const yachtExp = c.yacht_experience_extracted as YachtExperience[] | null;
          if (yachtExp && yachtExp.length > 0) {
            const maxYachtSize = Math.max(
              ...yachtExp
                .map((y) => y.yacht_size_meters || 0)
                .filter((size) => size > 0)
            );
            // Allow 70% of requirement (e.g., 70m experience for 100m requirement is close enough)
            if (maxYachtSize > 0 && maxYachtSize < hardRequirements.minYachtSizeMeters * 0.7) {
              if (process.env.NODE_ENV === 'development') {
                console.log(`[Brief Match] FILTERED (yacht size): ${c.first_name} ${c.last_name} - max ${maxYachtSize}m < ${hardRequirements.minYachtSizeMeters}m required`);
              }
              return false;
            }
          }
        }

        // 3. Required languages check (soft filter - at least one match)
        if (hardRequirements.languages?.length > 0) {
          const languagesExtracted = Array.isArray(c.languages_extracted) ? c.languages_extracted : [];
          const candidateLangs = languagesExtracted.map((l: { language?: string } | string) =>
            (typeof l === 'string' ? l : l.language || '').toLowerCase()
          ).filter(Boolean);
          const hasRequiredLanguage = hardRequirements.languages.some((reqLang) =>
            candidateLangs.some((candLang: string) =>
              candLang.includes(reqLang.toLowerCase()) || reqLang.toLowerCase().includes(candLang)
            )
          );
          // Only filter if looking for specific languages and candidate has language data
          if (candidateLangs.length > 0 && !hasRequiredLanguage) {
            // Don't hard filter - just log and let AI judgment decide
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Brief Match] Note (language): ${c.first_name} ${c.last_name} - missing required languages: ${hardRequirements.languages.join(', ')}`);
            }
          }
        }

        // 4. Required licenses check (HARD filter for captain/officer roles)
        if (hardRequirements.requiredLicenses && hardRequirements.requiredLicenses.length > 0) {
          const candidateLicense = (typeof c.highest_license === 'string' ? c.highest_license : '').toLowerCase();
          const candidateSecondLicense = ''; // second_license not in select, but highest_license should be enough

          const hasRequiredLicense = hardRequirements.requiredLicenses.some((reqLicense) => {
            const reqLicenseLower = reqLicense.toLowerCase();
            // Check for license variations (3000GT, 3000gt, 3000 GT, Master 3000, etc.)
            const licensePatterns = [
              reqLicenseLower,
              reqLicenseLower.replace('gt', ''),
              reqLicenseLower.replace(' ', ''),
            ];
            return licensePatterns.some(pattern =>
              candidateLicense.includes(pattern) ||
              candidateSecondLicense.includes(pattern)
            );
          });

          if (!hasRequiredLicense) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Brief Match] FILTERED (license): ${c.first_name} ${c.last_name} - has "${c.highest_license}", needs ${hardRequirements.requiredLicenses.join('/')}`);
            }
            return false;
          }
        }

        return true;
      });

      console.log(`[Brief Match] After hard requirements filter: ${hardRequirementsFilteredCandidates.length}/${departmentFilteredCandidates.length} candidates`);
    }

    // Calculate vector similarity and recruiter suitability
    const candidatesWithScoresMapped = hardRequirementsFilteredCandidates
      .map((c: unknown): EnrichedCandidate | null => {
        // Cast to VectorSearchCandidate for type safety
        const candidate = c as VectorSearchCandidate;
        // Parse embedding
        let embedding: number[] | null = null;
        if (typeof candidate.embedding === 'string') {
          try {
            embedding = JSON.parse(candidate.embedding as string);
          } catch {
            return null;
          }
        } else if (Array.isArray(candidate.embedding)) {
          embedding = candidate.embedding as number[];
        }

        if (!embedding || embedding.length === 0) return null;

        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        if (similarity < VECTOR_MATCH_THRESHOLD) return null;

        // Check if position matches any of the search terms OR eligible step-up roles
        const positionLower = candidate.primary_position?.toLowerCase() || '';
        const positionsHeldLower = (candidate.positions_held || []).map((p: string) => p.toLowerCase());
        const allPositions = [positionLower, ...positionsHeldLower];

        // Check for exact position match (uses outer searchTerms variable)
        const exactPositionMatch = searchTerms.some((term) =>
          allPositions.some((p) => p.includes(term.toLowerCase()))
        );

        // Check for step-up eligibility (e.g., Chief Officer for Captain search)
        const stepUpMatch = eligibleRoles.some((eligible) =>
          allPositions.some((p) => p.includes(eligible) || eligible.includes(p))
        );

        // Boost score based on match type
        // Exact match gets highest boost, step-up gets moderate boost
        let vectorScore = similarity;
        if (exactPositionMatch) {
          vectorScore = similarity * 1.3; // Higher boost for exact match
        } else if (stepUpMatch) {
          vectorScore = similarity * 1.15; // Moderate boost for step-up candidates
        }

        // =====================================================================
        // RECRUITER SUITABILITY ASSESSMENT
        // =====================================================================
        // This acts as an experienced recruiter, evaluating whether the candidate
        // would realistically take this job and be a good fit
        const recruiterAssessment = assessRecruiterSuitability(
          {
            years_experience: candidate.years_experience,
            primary_position: candidate.primary_position,
            positions_held: candidate.positions_held,
            yacht_experience_extracted: candidate.yacht_experience_extracted as YachtExperience[] | null,
            certifications_extracted: candidate.certifications_extracted as CertificationExtracted[] | null,
            licenses_extracted: candidate.licenses_extracted as LicenseExtracted[] | null,
            has_stcw: candidate.has_stcw,
            has_eng1: candidate.has_eng1,
          },
          parsedRequirements,
          originalRole
        );

        // =====================================================================
        // STEP-UP READINESS ASSESSMENT
        // =====================================================================
        // For candidates who are one level below the target role,
        // assess if they're ready to step up (e.g., Chief Officer → Captain)
        const stepUpReadiness = assessStepUpReadiness(
          {
            primary_position: candidate.primary_position,
            years_experience: candidate.years_experience,
            certifications_extracted: candidate.certifications_extracted as CertificationExtracted[] | null,
            licenses_extracted: candidate.licenses_extracted as LicenseExtracted[] | null,
            has_stcw: candidate.has_stcw,
            has_eng1: candidate.has_eng1,
            yacht_experience_extracted: candidate.yacht_experience_extracted as YachtExperience[] | null,
          },
          primarySearchRole,
          parsedRequirements
        );

        // Adjust score for step-up candidates who are ready
        let stepUpBonus = 0;
        if (stepUpReadiness.isStepUp && stepUpReadiness.isReady) {
          // Ready step-up candidates get a significant boost
          stepUpBonus = 0.15;
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Brief Match] STEP-UP CANDIDATE: ${candidate.first_name} ${candidate.last_name} - ${stepUpReadiness.currentLevel} → ${stepUpReadiness.targetLevel}, Qualifying: ${stepUpReadiness.qualifyingFactors.join(', ')}, Gaps: ${stepUpReadiness.gaps.join(', ') || 'none'}`);
          }
        } else if (stepUpReadiness.isStepUp && !stepUpReadiness.isReady) {
          // Step-up candidates who aren't quite ready still get a small boost
          stepUpBonus = 0.05;
        }

        // =====================================================================
        // PHASE 5: STRUCTURED SCORING WITH EXCELLENCE BONUS
        // =====================================================================
        // Calculate a transparent, weighted score with excellence bonuses
        const structuredScore = calculateStructuredScore(
          {
            primary_position: candidate.primary_position,
            positions_held: candidate.positions_held,
            years_experience: candidate.years_experience,
            yacht_experience_extracted: candidate.yacht_experience_extracted as YachtExperience[] | null,
            villa_experience_extracted: candidate.villa_experience_extracted as VillaExperience[] | null,
            certifications_extracted: candidate.certifications_extracted as CertificationExtracted[] | null,
            cv_skills: candidate.cv_skills,
            availability_status: candidate.availability_status,
            references_extracted: candidate.references_extracted as ReferenceDetail[] | null,
            profile_summary: candidate.profile_summary,
          },
          primarySearchRole,
          parsedRequirements,
          timeline,
          aiParsedQuery,
          stepUpReadiness
        );

        // USE STRUCTURED SCORE DIRECTLY
        // The structured score already incorporates all relevant factors with proper weighting:
        // - Position fit (50%), Experience (25%), Skills/Job Brief (15%), Verification (7%), Excellence (3%)
        // No need to blend with legacy vector/suitability logic which dilutes scores
        const structuredScoreNormalized = structuredScore.totalScore / 100;
        const combinedScore = Math.min(structuredScoreNormalized + stepUpBonus, 1.0);

        // Log assessments for debugging (in development)
        if (process.env.NODE_ENV === 'development') {
          const stepUpInfo = stepUpReadiness.isStepUp ? ` [STEP-UP: ${stepUpReadiness.isReady ? 'READY' : 'developing'}]` : '';
          const excellenceInfo = structuredScore.bonuses.exceedsExperience || structuredScore.bonuses.exceedsYachtSize
            ? ' [EXCELLENCE]'
            : '';
          console.log(`[Brief Match] ${candidate.first_name} ${candidate.last_name}: vector=${vectorScore.toFixed(2)}, suitability=${recruiterAssessment.suitability_score.toFixed(2)}, structured=${structuredScore.totalScore}, combined=${combinedScore.toFixed(2)}, rec=${structuredScore.recommendation}${stepUpInfo}${excellenceInfo}`);
        }

        return {
          ...candidate,
          gender: candidate.gender, // Explicitly preserve gender for AI judgment
          similarity: combinedScore, // Now includes recruiter assessment + step-up bonus + structured score
          vectorScore: Math.min(vectorScore, 1),
          recruiterAssessment,
          stepUpReadiness,
          structuredScore,
          isStepUpCandidate: stepUpReadiness.isStepUp,
          isReadyToStepUp: stepUpReadiness.isStepUp && stepUpReadiness.isReady,
          hasExcellenceBonus: structuredScore.bonuses.exceedsExperience ||
                              structuredScore.bonuses.exceedsYachtSize ||
                              structuredScore.bonuses.hasPremiumCerts,
        } as EnrichedCandidate;
      });

    // Filter out nulls and get typed array
    const validCandidates: EnrichedCandidate[] = candidatesWithScoresMapped.filter(
      (c: EnrichedCandidate | null): c is EnrichedCandidate => c !== null
    );

    // Sort by combined score (vector × suitability × structured)
    const candidatesWithScores = validCandidates
      .sort((a: EnrichedCandidate, b: EnrichedCandidate) => b.similarity - a.similarity)
      // Take more candidates initially, then filter to top results
      .slice(0, MAX_RESULTS * 2)
      // Prefer candidates with 'excellent' or 'strong' recommendations from structured scoring
      // Also give priority to candidates with excellence bonuses
      .sort((a: EnrichedCandidate, b: EnrichedCandidate) => {
        // First priority: structured score recommendation
        const structuredRecOrder = { excellent: 0, strong: 1, suitable: 2, consider: 3, unlikely: 4 };
        const structuredDiff = structuredRecOrder[a.structuredScore.recommendation] - structuredRecOrder[b.structuredScore.recommendation];
        if (structuredDiff !== 0) return structuredDiff;

        // Second priority: excellence bonus
        if (a.hasExcellenceBonus !== b.hasExcellenceBonus) {
          return a.hasExcellenceBonus ? -1 : 1;
        }

        // Third priority: combined score
        return b.similarity - a.similarity;
      });
    
    // Store total matches before limiting
    const totalMatches = candidatesWithScores.length;
    
    // Apply limit based on preview mode
    const limitedCandidates = candidatesWithScores.slice(0, resultLimit);

    // =========================================================================
    // PHASE 2.5: COHERE RERANKING
    // =========================================================================
    // Use Cohere's cross-encoder to rerank candidates based on semantic
    // relevance to the search query. This provides more accurate ranking than
    // pure vector similarity because it uses cross-attention (query sees doc).
    // =========================================================================

    let rerankedCandidates = limitedCandidates;

    if (limitedCandidates.length > 3 && process.env.COHERE_API_KEY) {
      console.log(`[Brief Match] Stage 2.5: Reranking ${limitedCandidates.length} candidates with Cohere...`);
      const rerankStartTime = Date.now();

      try {
        // Build the rerank query from search context
        const rerankQuery = [
          `Looking for: ${originalRole}`,
          location ? `Location: ${location}` : '',
          timeline ? `Timeline: ${timeline}` : '',
          requirements ? `Requirements: ${requirements}` : '',
        ].filter(Boolean).join('\n');

        // Build documents for reranking
        const documentsToRerank: RerankDocument[] = limitedCandidates.map(c => ({
          id: c.id,
          text: buildCandidateTextForRerank(c),
          metadata: { candidate: c },
        }));

        // Call Cohere rerank
        const reranked = await rerankDocuments(rerankQuery, documentsToRerank, {
          topN: limitedCandidates.length, // Keep all, just reorder
        });

        // Map back to candidates with Cohere scores
        rerankedCandidates = reranked.map(result => {
          const candidate = (result.metadata?.candidate as typeof limitedCandidates[0]);
          return {
            ...candidate,
            cohereScore: result.relevanceScore,
            // ADJUSTED: Keep structured score dominant (90%), use Cohere for minor refinement (10%)
            // Cohere is good for reranking but shouldn't override our transparent scoring
            similarity: (candidate.similarity * 0.9) + (result.relevanceScore * 0.1),
          };
        });

        // Re-sort by blended score
        rerankedCandidates.sort((a, b) => b.similarity - a.similarity);

        console.log(`[Brief Match] Cohere reranking completed in ${Date.now() - rerankStartTime}ms`);

        // Log top 5 reranked candidates in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[Brief Match] Top 5 after Cohere rerank:');
          rerankedCandidates.slice(0, 5).forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.first_name} ${c.last_name} - cohere: ${(c as any).cohereScore?.toFixed(3) || 'N/A'}, blended: ${c.similarity.toFixed(3)}`);
          });
        }
      } catch (error) {
        console.error('[Brief Match] Cohere reranking failed:', error);
        // Continue with original order
      }
    } else if (!process.env.COHERE_API_KEY) {
      console.log('[Brief Match] Skipping Cohere rerank - COHERE_API_KEY not set');
    }

    // Use reranked candidates for subsequent processing
    const candidatesForAIJudgment = rerankedCandidates;

    // =========================================================================
    // PHASE 3: AI-POWERED JUDGMENT FOR NUANCED MATCHING
    // =========================================================================
    // For searches with specific requirements (cuisine types, service styles,
    // special skills), use AI to make nuanced judgment calls.
    // This only runs when there are non-trivial requirements.
    // =========================================================================

    // Determine if we should run AI judgment
    // ALWAYS run AI judgment when we have candidates - this ensures proper filtering
    // of unqualified candidates even when requirements aren't "nuanced"
    const hasNuancedRequirements = true; // Always run AI judgment for quality control

    let aiJudgments: Map<string, AIJudgment> | null = null;

    console.log(`[Brief Match] AI Judgment check: hasNuancedRequirements=${hasNuancedRequirements}, candidates=${candidatesForAIJudgment.length}, requirements.length=${requirements?.length || 0}`);
    console.log(`[Brief Match] Candidates for AI judgment:`, candidatesForAIJudgment.map(c => `${c.first_name} ${c.last_name} (${c.primary_position})`).join(', '));

    if (hasNuancedRequirements && candidatesForAIJudgment.length > 0) {
      console.log('[Brief Match] ✓ RUNNING AI JUDGMENT for nuanced requirements...');
      const aiStartTime = Date.now();

      // Build enhanced requirements string with AI-parsed info
      let enhancedRequirements = requirements || '';
      if (aiParsedQuery && aiParsedQuery.softRequirements && aiParsedQuery.hardRequirements && aiParsedQuery.context) {
        const parsedReqParts: string[] = [];
        if (aiParsedQuery.softRequirements.cuisineTypes?.length > 0) {
          parsedReqParts.push(`Cuisine expertise: ${aiParsedQuery.softRequirements.cuisineTypes.join(', ')}`);
        }
        if (aiParsedQuery.softRequirements.serviceStyle?.length > 0) {
          parsedReqParts.push(`Service style: ${aiParsedQuery.softRequirements.serviceStyle.join(', ')}`);
        }
        if (aiParsedQuery.softRequirements.specialSkills?.length > 0) {
          parsedReqParts.push(`Special skills: ${aiParsedQuery.softRequirements.specialSkills.join(', ')}`);
        }
        if (aiParsedQuery.softRequirements.dietaryExpertise?.length > 0) {
          parsedReqParts.push(`Dietary expertise: ${aiParsedQuery.softRequirements.dietaryExpertise.join(', ')}`);
        }
        if (aiParsedQuery.context.clientType) {
          parsedReqParts.push(`Client type: ${aiParsedQuery.context.clientType}`);
        }
        if (aiParsedQuery.hardRequirements.languages?.length > 0) {
          parsedReqParts.push(`Languages required: ${aiParsedQuery.hardRequirements.languages.join(', ')}`);
        }
        if (parsedReqParts.length > 0) {
          enhancedRequirements = `${requirements || ''}\n\nParsed requirements:\n${parsedReqParts.join('\n')}`;
        }
      }

      try {
        aiJudgments = await batchAssessCandidatesWithAI(
          candidatesForAIJudgment.map(c => ({
            id: c.id,
            primary_position: c.primary_position,
            positions_held: c.positions_held,
            years_experience: c.years_experience,
            profile_summary: c.profile_summary,
            cv_skills: c.cv_skills,
            certifications_extracted: c.certifications_extracted as CertificationExtracted[] | null,
            yacht_experience_extracted: c.yacht_experience_extracted as YachtExperience[] | null,
            villa_experience_extracted: c.villa_experience_extracted as VillaExperience[] | null,
            languages_extracted: c.languages_extracted,
            gender: c.gender,
          })),
          {
            role: primarySearchRole,
            location: location || undefined,
            requirements: enhancedRequirements || undefined,
          },
          3 // Concurrency limit
        );

        console.log(`[Brief Match] AI judgment completed in ${Date.now() - aiStartTime}ms for ${aiJudgments.size} candidates`);

        // Log AI judgments in development
        if (process.env.NODE_ENV === 'development') {
          for (const [id, judgment] of aiJudgments) {
            const candidate = candidatesForAIJudgment.find(c => c.id === id);
            console.log(`[Brief Match] AI Judgment for ${candidate?.first_name} ${candidate?.last_name}: score=${judgment.matchScore}, match=${judgment.isMatch}, reasoning="${judgment.reasoning}"`);
          }
        }
      } catch (error) {
        console.error('[Brief Match] AI judgment batch failed:', error);
        // Continue without AI judgments
      }
    }

    // Re-score candidates with AI judgment if available
    const finalCandidates = aiJudgments
      ? candidatesForAIJudgment
          .map(c => {
            const aiJudgment = aiJudgments!.get(c.id);
            if (aiJudgment) {
              // AI JUDGMENT IS PRIMARY: When we have nuanced job briefs (2 pages, complex requirements),
              // AI can deeply understand context that structured scoring can't handle.
              // Use 80% AI, 20% structured as a sanity check.
              const aiScoreNormalized = aiJudgment.matchScore / 100;
              const blendedScore = (aiScoreNormalized * 0.8) + (c.similarity * 0.2);

              return {
                ...c,
                similarity: blendedScore,
                aiJudgment,
                aiMatchScore: aiJudgment.matchScore,
                aiIsMatch: aiJudgment.isMatch,
                aiReasoning: aiJudgment.reasoning,
                aiSpecialStrengths: aiJudgment.specialStrengths,
                aiConcerns: aiJudgment.concerns,
              };
            }
            return c;
          })
          // Filter out candidates that AI says are not a match
          .filter(c => {
            if ('aiJudgment' in c && c.aiJudgment) {
              const judgment = c.aiJudgment as AIJudgment;

              // STRICT: Always filter if isMatch = false (handles gender, department, critical requirements)
              if (!judgment.isMatch) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[Brief Match] ✗ FILTERED: ${c.first_name} ${c.last_name} - ${judgment.reasoning}`);
                }
                return false;
              }

              // Filter scores below minimum threshold even if isMatch = true
              // Lowered to 30 to show more candidates - display threshold handles final filtering
              if (judgment.matchScore < 30) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[Brief Match] ✗ FILTERED (low AI score): ${c.first_name} ${c.last_name} - score ${judgment.matchScore}`);
                }
                return false;
              }
            }
            return true;
          })
          // Re-sort by blended score
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, resultLimit)
      : candidatesForAIJudgment.slice(0, resultLimit);

    // =========================================================================
    // FALLBACK MATCHING - When no candidates pass strict filters
    // =========================================================================
    // For lead generation, showing relevant candidates (with honest scores) is
    // better than showing an empty state. Use simplified scoring based on
    // position fit + experience only, with a 40% minimum threshold.
    // =========================================================================
    let fallbackMode = false;
    let candidatesToProcess = finalCandidates;

    if (finalCandidates.length === 0 && departmentFilteredCandidates.length > 0) {
      console.log(`[Brief Match] No exact matches - trying fallback with ${departmentFilteredCandidates.length} department-filtered candidates`);

      // Score candidates using simplified fallback scoring
      const fallbackScored = departmentFilteredCandidates
        .map((cRaw: unknown) => {
          const c = cRaw as VectorSearchCandidate;
          const fallbackResult = calculateFallbackScore(
            {
              primary_position: c.primary_position,
              positions_held: c.positions_held,
              years_experience: c.years_experience,
            },
            originalRole
          );

          const fallbackStructuredScore: StructuredCandidateScore = {
            passesHardFilters: true,
            components: {
              positionFit: fallbackResult.score * 0.6,
              experienceQuality: fallbackResult.score * 0.4,
              skillMatch: 0,
              availability: 0,
              verification: 0,
              excellence: 0,
            },
            weights: {
              positionFit: 0.60,
              experienceQuality: 0.40,
              skillMatch: 0,
              availability: 0,
              verification: 0,
              excellence: 0,
            },
            totalScore: fallbackResult.score,
            recommendation: fallbackResult.score >= 60 ? 'suitable' :
                          fallbackResult.score >= 40 ? 'consider' : 'unlikely',
            bonuses: {
              exceedsYachtSize: false,
              exceedsExperience: false,
              hasPremiumCerts: false,
              longTenure: false,
              verifiedReferences: false,
            },
            reasoning: [fallbackResult.reasoning],
          };

          const fallbackRecruiterAssessment: RecruiterAssessment = {
            suitability_score: fallbackResult.score / 100,
            recommendation: fallbackResult.score >= 60 ? 'suitable' :
                          fallbackResult.score >= 40 ? 'consider' : 'unlikely',
            flags: {
              overqualified: false,
              underqualified: false,
              missing_qualifications: false,
              career_mismatch: false,
              flight_risk: false,
            },
            missing_certs: [],
            reasoning: fallbackResult.reasoning,
          };

          const fallbackStepUpReadiness: StepUpReadiness = {
            isStepUp: false,
            isReady: false,
            currentLevel: c.primary_position || '',
            targetLevel: originalRole,
            qualifyingFactors: [],
            gaps: [],
          };

          return {
            ...c,
            similarity: fallbackResult.score / 100, // Normalize to 0-1
            vectorScore: fallbackResult.score / 100,
            fallbackScore: fallbackResult.score,
            fallbackReasoning: fallbackResult.reasoning,
            structuredScore: fallbackStructuredScore,
            recruiterAssessment: fallbackRecruiterAssessment,
            stepUpReadiness: fallbackStepUpReadiness,
            isStepUpCandidate: false,
            isReadyToStepUp: false,
            hasExcellenceBonus: false,
          };
        })
        .filter((c: EnrichedCandidate & { fallbackScore: number }) => c.fallbackScore >= 55) // Lowered from 75 to 55 - allow more candidates in fallback mode
        .sort((a: EnrichedCandidate & { fallbackScore: number }, b: EnrichedCandidate & { fallbackScore: number }) => b.fallbackScore - a.fallbackScore)
        .slice(0, resultLimit);

      if (fallbackScored.length > 0) {
        console.log(`[Brief Match] Fallback found ${fallbackScored.length} candidates with scores: ${fallbackScored.map((c: EnrichedCandidate & { fallbackScore: number }) => c.fallbackScore).join(', ')}`);
        candidatesToProcess = fallbackScored;
        fallbackMode = true;
      } else {
        console.log('[Brief Match] Fallback found no candidates meeting 40% threshold');
      }
    }

    // Use candidatesToProcess for all subsequent operations
    // Apply minimum display threshold - lowered to 40% to show all reasonable matches
    // The AI already filtered out non-matches, so trust its judgment
    const MIN_DISPLAY_SCORE = 0.40;
    const processedCandidates = candidatesToProcess.filter(c => {
      if (c.similarity < MIN_DISPLAY_SCORE) {
        console.log(`[Brief Match] EXCLUDED (below ${MIN_DISPLAY_SCORE * 100}% threshold): ${c.first_name} ${c.last_name} at ${Math.round(c.similarity * 100)}%`);
        return false;
      }
      return true;
    });

    console.log(`[Brief Match] After minimum threshold filter: ${processedCandidates.length}/${candidatesToProcess.length} candidates`);

    // Build search context for personalized matching explanations
    const searchContext = {
      role: originalRole, // Use the original role from user input
      location: location || '',
      timeline: timeline || '',
      requirements: requirements || '',
    };

    // =========================================================================
    // AI-POWERED CANDIDATE PRESENTATIONS
    // Generate compelling, personalized descriptions using Claude
    // =========================================================================
    console.log('[Brief Match] Generating AI presentations for', processedCandidates.length, 'candidates...');
    const presentationStartTime = Date.now();

    // Generate AI presentations for all candidates in parallel
    const aiPresentations = await generateAIPresentationsForCandidates(
      processedCandidates,
      searchContext
    );

    console.log('[Brief Match] AI generation completed in', Date.now() - presentationStartTime, 'ms');

    // Anonymize results with AI-generated content
    const anonymizedResults: AnonymizedCandidate[] = processedCandidates.map((c, index) => {
      try {
        // Generate obfuscated ID (hash-like, not the real ID)
        const obfuscatedId = `match_${Date.now()}_${index}`;

        // Get AI-generated presentation for this candidate
        const aiPresentation = aiPresentations.get(c.id);

        // Extract languages
        const langs = extractLanguages(c.languages_extracted);

        // Generate key strengths based on available data
        const strengths = generateKeyStrengths(c);

        // Map availability status
        const avail = mapAvailability(c.availability_status, timeline);

        // Generate experience summary
        const experienceSummary = generateExperienceSummary(c);

        // Extract qualifications (certs/licenses, anonymized)
        const qualifications = extractQualifications(c);

        // Extract notable employers (anonymized)
        const notableEmployers = extractNotableEmployers(c.profile_summary || '', c.positions_held || []);

        // Generate partially hidden display name
        const displayName = obfuscateName(c.first_name, c.last_name);

        // Use AI-anonymized bio (preferred), fall back to regex-based anonymization during migration
        const storedBioAnonymized = c.bio_anonymized ||
          (c.bio_full
            ? anonymizeBio(
                c.bio_full,
                c.first_name || '',
                c.last_name || '',
                c.nationality || null,
                c.primary_position || null,
                c.references_extracted as ReferenceDetail[] | null,
                c.yacht_experience_extracted as YachtExperience[] | null,
                c.villa_experience_extracted as VillaExperience[] | null
              )
            : null);

        // Pattern validation as safety net (logs warnings if PII detected)
        if (storedBioAnonymized) {
          const yachtNames = (c.yacht_experience_extracted as YachtExperience[] | null)
            ?.map(y => y.yacht_name).filter((name): name is string => Boolean(name)) || [];
          const propertyNames = (c.villa_experience_extracted as VillaExperience[] | null)
            ?.map(v => v.property_name).filter((name): name is string => Boolean(name)) || [];

          validateAnonymizedBioSafe(
            storedBioAnonymized,
            c.first_name,
            c.last_name,
            yachtNames,
            propertyNames
          );
        }

        // Build anonymization options with candidate name info
        const anonymizeOpts: AnonymizeOptions = {
          yachtExperience: c.yacht_experience_extracted as YachtExperience[] | null,
          villaExperience: c.villa_experience_extracted as VillaExperience[] | null,
          firstName: c.first_name,
          lastName: c.last_name,
          position: c.primary_position,
        };

        return {
          id: obfuscatedId,
          display_name: displayName,
          avatar_url: c.avatar_url || null,
          position: c.primary_position || 'Private Staff Professional',
          experience_years: calculateExperienceYears(c),
          // Use pre-generated bio (anonymized) or fall back to AI/static generation
          rich_bio: storedBioAnonymized || anonymizeText(
            aiPresentation?.professional_summary || generateRichBio(c),
            null,
            null,
            anonymizeOpts
          ),
          career_highlights: anonymizeCareerAchievements(
            aiPresentation?.career_highlights || generateCareerHighlights(c),
            null,
            null,
            anonymizeOpts
          ),
          experience_summary: experienceSummary,
          // NOTE: work_history removed for lead gen - full history available for authenticated clients only
          languages: langs,
          nationality: c.nationality || 'International',
          availability: avail,
          match_score: c.similarity,
          key_strengths: strengths,
          qualifications: qualifications,
          notable_employers: notableEmployers,
          // AI-generated personalized content (anonymized for public display)
          why_good_fit: anonymizeText(
            aiPresentation?.why_good_fit || generateWhyGoodFit(c, searchContext),
            null,
            null,
            anonymizeOpts
          ),
          employee_qualities: anonymizeCareerAchievements(
            aiPresentation?.standout_qualities || extractEmployeeQualities(c),
            null,
            null,
            anonymizeOpts
          ),
          longevity_assessment: anonymizeText(
            aiPresentation?.longevity_assessment || generateLongevityFallback(c),
            null,
            null,
            anonymizeOpts
          ),
        };
      } catch (mapError) {
        console.error('[Brief Match] Map error for candidate:', c.id, mapError);
        throw mapError;
      }
    });

    // =========================================================================
    // PHASE 6: GRACEFUL DEGRADATION - Search Quality Assessment
    // =========================================================================
    // When perfect matches are unavailable, provide helpful information:
    // - search_quality: How well the results match the query
    // - search_notes: Explanations of what's missing
    // - alternative_suggestions: Related roles that might have more candidates
    // - fallback_mode: Whether we're showing fallback candidates
    // =========================================================================

    // Assess search quality based on candidate scores and count
    let searchQuality: 'excellent' | 'good' | 'limited' | 'no_exact_matches' = 'good';
    const searchNotes: string[] = [];
    const alternativeSuggestions: string[] = [];

    const topCandidate = processedCandidates[0];
    const avgStructuredScore = processedCandidates.length > 0
      ? processedCandidates.reduce((sum, c) => sum + (c.structuredScore?.totalScore || 0), 0) / processedCandidates.length
      : 0;

    // Determine search quality
    if (processedCandidates.length === 0) {
      searchQuality = 'no_exact_matches';
      searchNotes.push(`No candidates found matching "${originalRole}" with your specified requirements.`);

      // Suggest alternatives based on search role
      const searchDept = getDepartment(originalRole);
      if (searchDept === 'deck') {
        alternativeSuggestions.push('Consider widening yacht size requirements', 'Try searching for Chief Officers if looking for Captains');
      } else if (searchDept === 'galley') {
        alternativeSuggestions.push('Consider Sous Chefs if looking for Head Chefs', 'Try broadening cuisine requirements');
      } else if (searchDept === 'interior') {
        alternativeSuggestions.push('Consider Second Stewardesses if looking for Chief Stews', 'Try expanding location preferences');
      }
    } else if (fallbackMode) {
      // Fallback mode: showing candidates with relaxed matching
      searchQuality = 'limited';
      searchNotes.push(`Showing candidates with relevant ${originalRole} experience. Scores reflect position fit and experience level.`);
    } else if (processedCandidates.length < 3 || avgStructuredScore < 50) {
      searchQuality = 'limited';
      searchNotes.push('Limited exact matches found. Results include candidates who may need some development for this role.');

      // Check for step-up candidates
      const stepUpCount = processedCandidates.filter(c => c.isStepUpCandidate).length;
      if (stepUpCount > 0) {
        searchNotes.push(`${stepUpCount} candidate(s) are in progression toward this role and may be ready to step up.`);
      }

      // Note what's driving the limited results
      if (parsedRequirements.min_yacht_size_experience_meters && parsedRequirements.min_yacht_size_experience_meters >= 80) {
        searchNotes.push('Large yacht experience (80m+) is a specialized requirement that limits the candidate pool.');
      }
      if (aiParsedQuery?.softRequirements?.cuisineTypes?.length) {
        searchNotes.push(`Specialized cuisine requirements (${aiParsedQuery.softRequirements.cuisineTypes.join(', ')}) may limit matches.`);
      }
    } else if (topCandidate && topCandidate.structuredScore?.recommendation === 'excellent') {
      searchQuality = 'excellent';
      if (topCandidate.hasExcellenceBonus) {
        searchNotes.push('Top candidates exceed your requirements in key areas.');
      }
    }

    // Add notes about step-up candidates in the results (only for non-fallback mode)
    if (!fallbackMode) {
      const readyStepUpCount = processedCandidates.filter(c => c.isReadyToStepUp).length;
      if (readyStepUpCount > 0 && searchQuality !== 'no_exact_matches') {
        searchNotes.push(`${readyStepUpCount} candidate(s) are experienced professionals ready to step up to this role.`);
      }

      // Add notes about excellence bonus candidates
      const excellenceCount = processedCandidates.filter(c => c.hasExcellenceBonus).length;
      if (excellenceCount > 0 && searchQuality !== 'no_exact_matches') {
        searchNotes.push(`${excellenceCount} candidate(s) have demonstrated excellence in their career.`);
      }
    }

    return NextResponse.json({
      candidates: anonymizedResults,
      total_matches: fallbackMode ? processedCandidates.length : totalMatches,
      total_found: fallbackMode ? departmentFilteredCandidates.length : candidatesWithScores.length,
      search_criteria: {
        query: searchQuery,  // Preserve the full original query
        role: originalRole,
        location: location || 'Any',
        timeline: timeline || 'Flexible',
      },
      // Phase 6: Graceful degradation fields
      search_quality: searchQuality,
      search_notes: searchNotes.length > 0 ? searchNotes : undefined,
      alternative_suggestions: alternativeSuggestions.length > 0 ? alternativeSuggestions : undefined,
      fallback_mode: fallbackMode, // NEW: Indicates relaxed matching was used
      // Summary stats for debugging/transparency
      result_stats: {
        total_candidates_considered: candidates.length,
        after_department_filter: departmentFilteredCandidates.length,
        after_hard_requirements: hardRequirementsFilteredCandidates.length,
        after_vector_scoring: candidatesWithScores.length,
        final_returned: anonymizedResults.length,
        fallback_used: fallbackMode,
        step_up_candidates: processedCandidates.filter(c => c.isStepUpCandidate).length,
        excellence_bonus_candidates: processedCandidates.filter(c => c.hasExcellenceBonus).length,
        average_structured_score: Math.round(avgStructuredScore),
      },
    });
  } catch (error) {
    console.error('[Brief Match] Error:', error);
    // Return more specific error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate a simplified fallback score based on position fit + experience only.
 * Used when no candidates pass hard requirements - we still want to show
 * relevant candidates with honest scores.
 */
function calculateFallbackScore(
  candidate: {
    primary_position: string | null;
    positions_held: string[] | null;
    years_experience: number | null;
  },
  searchRole: string
): { score: number; reasoning: string } {
  let score = 0;
  const reasoning: string[] = [];

  // Position fit (60% weight in fallback)
  const positionLower = (candidate.primary_position || '').toLowerCase();
  const searchRoleLower = searchRole.toLowerCase();
  const positionsHeld = (candidate.positions_held || []).map(p => p.toLowerCase());

  if (positionLower.includes(searchRoleLower) || searchRoleLower.includes(positionLower)) {
    score += 60;
    reasoning.push('Exact position match');
  } else if (positionsHeld.some(p => p.includes(searchRoleLower) || searchRoleLower.includes(p))) {
    score += 45;
    reasoning.push('Has held related position');
  } else {
    // Check if in same general category (e.g., interior roles)
    const candidateDept = getDepartment(candidate.primary_position || '');
    const searchDept = getDepartment(searchRole);

    // Unknown department = 0 points (should have been filtered, but be safe)
    if (!candidateDept || !searchDept) {
      score += 0;
      reasoning.push('Unknown department - no position fit score');
    } else if (candidateDept === searchDept) {
      score += 30;
      reasoning.push('Same department, different role');
    } else {
      score += 15;
      reasoning.push('Different department');
    }
  }

  // Experience (40% weight in fallback)
  const yearsExp = candidate.years_experience || 0;
  if (yearsExp >= 10) {
    score += 40;
    reasoning.push('Extensive experience (10+ years)');
  } else if (yearsExp >= 7) {
    score += 35;
    reasoning.push('Strong experience (7+ years)');
  } else if (yearsExp >= 5) {
    score += 30;
    reasoning.push('Solid experience (5+ years)');
  } else if (yearsExp >= 3) {
    score += 25;
    reasoning.push('Moderate experience (3+ years)');
  } else if (yearsExp >= 1) {
    score += 20;
    reasoning.push('Some experience (1+ years)');
  } else {
    score += 10;
    reasoning.push('Entry level');
  }

  return { score, reasoning: reasoning.join('; ') };
}

// NOTE: WorkHistoryEntry and generateWorkHistory removed for lead gen
// Full work history is available for authenticated clients only

// ----------------------------------------------------------------------------
// AI-POWERED CANDIDATE PRESENTATION GENERATION
// Using Claude to create compelling, personalized candidate descriptions
// ----------------------------------------------------------------------------

const aiPresentationSchema = z.object({
  professional_summary: z.string().describe(`Write a 3-paragraph professional bio in third person. Each paragraph should be 2-3 sentences.

PARAGRAPH 1 - PERSONAL & OVERVIEW:
Start with nationality and position. Include age if known. Example: "L*** is a 32-year-old British Chief Stewardess with over 10 years in the yachting industry."

PARAGRAPH 2 - QUALIFICATIONS & EXPERIENCE:
Cover certifications (STCW, ENG1, licenses) and key experience. Include yacht sizes and tenure specifics. Example: "She holds STCW and ENG1 medical, with experience across motor yachts from 45m to 80m. Her career includes 3 years as Chief Stew on a 65m charter yacht in the Mediterranean, managing a team of 4 stewardesses."

PARAGRAPH 3 - CAREER PROGRESSION & STRENGTHS:
Highlight career progression, notable vessels, charter vs private experience, languages. Example: "Starting as Junior Stewardess on M/Y Eclipse (72m), she progressed through 2nd Stew to Chief over 6 years. Fluent in French and English, she specializes in formal service and high-end charter operations."

DO NOT use bullet points or headers - pure prose paragraphs only.`),
  why_good_fit: z.string().describe('Confident recommendation: 2-3 sentences selling why this candidate is worth interviewing. Lead with their strengths - experience level, certifications, years in industry, availability. Be positive and confident. Do NOT mention gaps, missing data, or things that need verification.'),
  career_highlights: z.array(z.string()).default([]).describe('3-4 positive achievements to highlight. Use numbers when available. Examples: "10 years as Chief Stewardess", "Holds STCW and ENG1 certifications", "Available for immediate start", "Greek nationality - Mediterranean expertise".'),
  standout_qualities: z.array(z.string()).default([]).describe('2-3 strengths that make them worth interviewing. Examples: "10 years at senior interior level", "Current certifications for commercial yachting", "Immediately available for Med season".'),
  longevity_assessment: z.string().describe('Brief positive statement about their experience. Example: "10 years in yachting demonstrates commitment to the industry." If tenure data is limited, simply state their years of experience positively.'),
});


type AICandidatePresentation = z.infer<typeof aiPresentationSchema>;

/**
 * AI-powered generation of compelling candidate presentations
 * Uses Claude to create personalized, natural-sounding descriptions
 */
async function generateAICandidatePresentation(
  candidate: {
    primary_position?: string | null;
    years_experience?: number | null;
    profile_summary?: string | null;
    nationality?: string | null;
    positions_held?: string[] | null;
    cv_skills?: string[] | null;
    yacht_experience_extracted?: YachtExperience[] | null;
    villa_experience_extracted?: VillaExperience[] | null;
    certifications_extracted?: CertificationExtracted[] | null;
    licenses_extracted?: LicenseExtracted[] | null;
    languages_extracted?: Array<{ language: string; proficiency: string }> | string[] | null;
    highest_license?: string | null;
    availability_status?: string | null;
    has_stcw?: boolean | null;
    has_eng1?: boolean | null;
    bio_full?: string | null; // Rich narrative bio with personality traits and reference feedback
  },
  searchContext: {
    role: string;
    location: string;
    timeline: string;
    requirements: string;
  }
): Promise<AICandidatePresentation> {
  // Prepare candidate data for AI
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const certs = (candidate.certifications_extracted || []) as CertificationExtracted[];
  const licenses = (candidate.licenses_extracted || []) as LicenseExtracted[];
  const langs = (candidate.languages_extracted || []) as Array<{ language: string; proficiency: string }>;

  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));
  const yachtCount = yachtExp.length;

  // Calculate tenure metrics for longevity assessment
  const allPositionDurations = [
    ...yachtExp.map(y => y.duration_months || 0),
    ...villaExp.map(v => v.duration_months || 0),
  ].filter(d => d > 0);

  const averageTenureMonths = allPositionDurations.length > 0
    ? allPositionDurations.reduce((a, b) => a + b, 0) / allPositionDurations.length
    : 0;
  const longestTenureMonths = allPositionDurations.length > 0
    ? Math.max(...allPositionDurations)
    : 0;
  const totalPositions = allPositionDurations.length;

  // Build structured candidate profile for AI
  const candidateProfile = {
    position: candidate.primary_position || 'Private Staff Professional',
    years_experience: candidate.years_experience || 0,
    summary: candidate.profile_summary || '',
    nationality: candidate.nationality || 'International',
    positions_held: candidate.positions_held || [],
    skills: candidate.cv_skills || [],
    yacht_experience: yachtExp.map(y => ({
      yacht_size: y.yacht_size_meters,
      position: y.position,
      duration_months: y.duration_months,
      type: y.yacht_type,
    })),
    villa_experience: villaExp.map(v => ({
      location: v.location,
      position: v.position,
      duration_months: v.duration_months,
      type: v.property_type,
    })),
    certifications: certs.map(c => c.name),
    licenses: licenses.map(l => l.name),
    languages: langs.map(l => `${l.language} (${l.proficiency})`),
    highest_license: candidate.highest_license,
    has_stcw: candidate.has_stcw,
    has_eng1: candidate.has_eng1,
    availability: candidate.availability_status,
    metrics: {
      largest_yacht_meters: largestYacht,
      yacht_count: yachtCount,
      villa_count: villaExp.length,
    },
    tenure_metrics: {
      average_tenure_months: Math.round(averageTenureMonths * 10) / 10,
      longest_tenure_months: longestTenureMonths,
      total_positions: totalPositions,
      average_tenure_years: Math.round((averageTenureMonths / 12) * 10) / 10,
      longest_tenure_years: Math.round((longestTenureMonths / 12) * 10) / 10,
    },
    // Rich narrative bio with personality traits, hobbies, and reference feedback
    bio_narrative: candidate.bio_full || null,
  };

  // Separate the bio from structured data for the prompt
  const { bio_narrative, ...structuredData } = candidateProfile;

  const { object } = await generateObject({
    model: presentationModel, // Using GPT-4o-mini for speed and quality
    schema: aiPresentationSchema,
    system: `You are a yacht crew recruiter presenting candidates to clients. Your job is to SELL these candidates - highlight their strengths and make the client want to interview them.

MINDSET:
- These candidates passed our screening - they're worth the client's time
- Focus on what they HAVE, not what's missing
- Your job is to get them interviews, not to second-guess your own recommendations
- If data is limited, work with what you have - don't apologize for it

TONE:
- Confident and positive - you believe in these candidates
- Professional but warm
- Third person throughout
- Include specific numbers when available (yacht sizes, years, certifications)

FOR "WHY GOOD FIT":
Lead with STRENGTHS. What makes this candidate worth interviewing?
- Their experience level and position match
- Relevant certifications they hold
- Years in the industry
- Nationality/language advantages for the region
- Availability timing

DO NOT:
- Say "difficult to recommend" or "hard to assess" - if they're being shown, recommend them
- Focus on CV gaps or missing data - work with what you have
- Undermine confidence with phrases like "would need to verify" or "can't confirm"
- Write paragraphs about what's NOT in the CV

EXAMPLES OF GOOD RECOMMENDATIONS:
- "With 10 years as Chief Stewardess and current STCW/ENG1, she has the experience and certifications for a 60m Mediterranean role. Her availability works for the season timing."
- "Greek nationality is an asset for Med operations - she'll know the ports and suppliers. 10 years at Chief Stew level shows she's established in senior interior roles."
- "14 years in yachting with proper certifications. Available now for immediate start which suits urgent placements."

EXAMPLES OF BAD RECOMMENDATIONS (DON'T DO THIS):
- "This is a difficult recommendation given sparse CV data..."
- "Without documented yacht experience, there's no way to assess..."
- "The CV lacks critical detail which makes it challenging..."`,
    prompt: `You're briefing a client about a candidate for a ${searchContext.role} position.

THE CLIENT'S BRIEF:
${searchContext.requirements ? `"${searchContext.requirements}"` : 'Looking for a ' + searchContext.role}
${searchContext.location ? `Preferred location: ${searchContext.location}` : ''}
${searchContext.timeline ? `Timeline: ${searchContext.timeline}` : ''}

CANDIDATE'S BACKGROUND (their story, personality, what references say):
${bio_narrative || 'No detailed bio available - working from CV data only.'}

CANDIDATE DATA:
${JSON.stringify(structuredData, null, 2)}

YOUR TASK - Present this candidate positively:

PROFESSIONAL SUMMARY (3 paragraphs, no headers/bullets):
Write a confident recruiter bio - 3 flowing paragraphs focusing on STRENGTHS:
1. First paragraph: Nationality, position, years in industry - presented confidently
2. Second paragraph: Certifications they HAVE (STCW, ENG1, licenses), experience highlights
3. Third paragraph: What makes them a solid candidate - languages, availability, regional knowledge

Use specifics when available. If data is limited, keep it brief and positive.
Example: "L*** is an Australian Chief Stewardess with 10 years in yachting. She holds current STCW and ENG1 certifications. Available for immediate start."

WHY GOOD FIT - SELL THE CANDIDATE:
Lead with why they're worth interviewing:
- Position and experience match
- Certifications they hold
- Years of experience
- Nationality/language advantages
- Availability timing

Keep it positive and confident. Do NOT list what's missing or apologize for limited data.`,
  });

  return object;
}

/**
 * Batch generate AI presentations for multiple candidates
 * Runs in parallel for efficiency
 */
async function generateAIPresentationsForCandidates(
  candidates: Array<{
    id: string;
    primary_position?: string | null;
    years_experience?: number | null;
    profile_summary?: string | null;
    nationality?: string | null;
    positions_held?: string[] | null;
    cv_skills?: string[] | null;
    yacht_experience_extracted?: YachtExperience[] | null;
    villa_experience_extracted?: VillaExperience[] | null;
    certifications_extracted?: CertificationExtracted[] | null;
    licenses_extracted?: LicenseExtracted[] | null;
    languages_extracted?: Array<{ language: string; proficiency: string }> | string[] | null;
    highest_license?: string | null;
    availability_status?: string | null;
    has_stcw?: boolean | null;
    has_eng1?: boolean | null;
    bio_full?: string | null; // Rich narrative bio with personality traits and reference feedback
  }>,
  searchContext: {
    role: string;
    location: string;
    timeline: string;
    requirements: string;
  }
): Promise<Map<string, AICandidatePresentation>> {
  const results = new Map<string, AICandidatePresentation>();

  // Run all AI generations in parallel
  const promises = candidates.map(async (candidate) => {
    try {
      const presentation = await generateAICandidatePresentation(candidate, searchContext);
      return { id: candidate.id, presentation, source: 'ai' as const };
    } catch (error) {
      // Log detailed error info
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      console.error(`[Brief Match] AI generation failed for candidate ${candidate.id}:`, {
        error: errorMessage,
        stack: errorStack,
        candidatePosition: candidate.primary_position,
        candidateYearsExp: candidate.years_experience,
      });
      // Return fallback
      return {
        id: candidate.id,
        presentation: generateFallbackPresentation(candidate, searchContext),
        source: 'fallback' as const,
      };
    }
  });

  const resolvedPresentations = await Promise.all(promises);

  // Log how many used AI vs fallback
  const aiCount = resolvedPresentations.filter(p => p.source === 'ai').length;
  const fallbackCount = resolvedPresentations.filter(p => p.source === 'fallback').length;
  if (fallbackCount > 0) {
    console.warn(`[Brief Match] AI success: ${aiCount}/${candidates.length}, Fallback used: ${fallbackCount}/${candidates.length}`);
  }

  for (const { id, presentation } of resolvedPresentations) {
    results.set(id, presentation);
  }

  return results;
}

/**
 * Fallback presentation if AI generation fails
 * This now uses richer candidate data to generate compelling summaries
 */
function generateFallbackPresentation(
  candidate: {
    primary_position?: string | null;
    years_experience?: number | null;
    profile_summary?: string | null;
    nationality?: string | null;
    yacht_experience_extracted?: YachtExperience[] | null;
    villa_experience_extracted?: VillaExperience[] | null;
    certifications_extracted?: CertificationExtracted[] | null;
    licenses_extracted?: LicenseExtracted[] | null;
    cv_skills?: string[] | null;
    languages_extracted?: Array<{ language: string; proficiency: string }> | string[] | null;
    has_stcw?: boolean | null;
    has_eng1?: boolean | null;
  },
  searchContext: { role: string; requirements?: string }
): AICandidatePresentation {
  const yearsExp = candidate.years_experience || 0;
  const position = candidate.primary_position || 'Private Staff Professional';
  const nationality = candidate.nationality || '';
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const certs = (candidate.certifications_extracted || []) as CertificationExtracted[];
  const skills = candidate.cv_skills || [];
  const langs = (candidate.languages_extracted || []) as Array<{ language: string; proficiency: string }>;

  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));

  // Calculate tenure for fallback
  const allDurations = [
    ...yachtExp.map(y => y.duration_months || 0),
    ...villaExp.map(v => v.duration_months || 0),
  ].filter(d => d > 0);
  const avgTenure = allDurations.length > 0 ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length : 0;
  const totalPositions = allDurations.length || yachtExp.length;
  const longestTenure = allDurations.length > 0 ? Math.max(...allDurations) : 0;

  // Extract standout certifications
  const standoutCerts: string[] = [];
  for (const cert of certs) {
    const name = cert.name.toLowerCase();
    if (name.includes('yachtmaster')) standoutCerts.push('RYA Yachtmaster');
    else if (name.includes('padi') && (name.includes('instructor') || name.includes('divemaster'))) standoutCerts.push('PADI Dive certification');
    else if (name.includes('kite') && name.includes('instructor')) standoutCerts.push('Kite Instructor');
    else if (name.includes('wset') && (name.includes('2') || name.includes('3'))) standoutCerts.push('WSET Wine qualification');
    else if (name.includes('powerboat') && name.includes('instructor')) standoutCerts.push('Powerboat Instructor');
    else if (name.includes('silver service')) standoutCerts.push('Silver Service trained');
  }
  const uniqueCerts = [...new Set(standoutCerts)].slice(0, 3);

  // Extract standout skills from cv_skills
  const standoutSkills: string[] = [];
  const skillsLower = skills.map(s => s.toLowerCase());
  if (skillsLower.some(s => s.includes('kitesurfing') || s.includes('kitesurf'))) standoutSkills.push('kitesurfing');
  if (skillsLower.some(s => s.includes('wakeboard'))) standoutSkills.push('wakeboarding');
  if (skillsLower.some(s => s.includes('waterski'))) standoutSkills.push('waterskiing');
  if (skillsLower.some(s => s.includes('diving') || s.includes('scuba'))) standoutSkills.push('diving');
  if (skillsLower.some(s => s.includes('tender') && s.includes('pilot'))) standoutSkills.push('tender operations');
  if (skillsLower.some(s => s.includes('cocktail') || s.includes('mixology'))) standoutSkills.push('cocktail service');
  if (skillsLower.some(s => s.includes('wine') && s.includes('service'))) standoutSkills.push('wine service');
  const uniqueSkills = [...new Set(standoutSkills)].slice(0, 4);

  // Build professional summary with actual details
  let summaryParts: string[] = [];

  // Opening with nationality if available
  const nationalityPrefix = nationality ? `A ${nationality} ` : 'A ';
  summaryParts.push(`${nationalityPrefix}${position} with ${yearsExp} year${yearsExp !== 1 ? 's' : ''} of experience`);

  // Yacht size experience
  if (largestYacht > 0) {
    summaryParts[0] += ` on motor yachts up to ${Math.round(largestYacht)}m`;
  }
  summaryParts[0] += '.';

  // Key certifications sentence
  if (uniqueCerts.length > 0) {
    summaryParts.push(`Holds ${uniqueCerts.join(', ')}.`);
  } else if (candidate.has_stcw && candidate.has_eng1) {
    summaryParts.push('Holds STCW and ENG1 certifications.');
  } else if (candidate.has_stcw) {
    summaryParts.push('STCW certified.');
  }

  // Skills/specializations sentence
  if (uniqueSkills.length >= 2) {
    summaryParts.push(`Skilled in ${uniqueSkills.slice(0, 3).join(', ')}.`);
  } else if (uniqueSkills.length === 1) {
    summaryParts.push(`Experienced in ${uniqueSkills[0]}.`);
  }

  // Languages if notable
  const fluentLangs = langs.filter(l =>
    ['fluent', 'native', 'proficient', 'advanced'].includes(l.proficiency?.toLowerCase() || '')
  );
  if (fluentLangs.length > 1) {
    summaryParts.push(`Speaks ${fluentLangs.map(l => l.language).join(' and ')}.`);
  }

  // Extract top yacht names for "why good fit"
  const topYachts = yachtExp
    .filter(y => y.yacht_name && y.yacht_size_meters && y.yacht_size_meters >= 40)
    .sort((a, b) => (b.yacht_size_meters || 0) - (a.yacht_size_meters || 0))
    .slice(0, 2);

  // Build why good fit with specifics
  const fitParts: string[] = [];
  fitParts.push(`This ${position} brings ${yearsExp} year${yearsExp !== 1 ? 's' : ''} of relevant experience for the ${searchContext.role} position`);

  if (topYachts.length > 0) {
    const yachtNames = topYachts.map(y => `${y.yacht_name} (${Math.round(y.yacht_size_meters || 0)}m)`).join(' and ');
    fitParts[0] += `, with previous experience on ${yachtNames}`;
  } else if (largestYacht >= 50) {
    fitParts[0] += `, including work on superyachts up to ${Math.round(largestYacht)}m`;
  }
  fitParts[0] += '.';

  // Determine department context based on position
  const isDeck = position.toLowerCase().includes('deck') || position.toLowerCase().includes('captain') || position.toLowerCase().includes('officer') || position.toLowerCase().includes('bosun');
  const isInterior = position.toLowerCase().includes('steward') || position.toLowerCase().includes('butler') || position.toLowerCase().includes('housekeeper');
  const isEngine = position.toLowerCase().includes('engineer') || position.toLowerCase().includes('eto');

  let departmentContext = 'the team';
  if (isDeck) departmentContext = 'the deck team';
  else if (isInterior) departmentContext = 'the interior team';
  else if (isEngine) departmentContext = 'the engine team';

  // Check if requirements were specified and address them
  if (searchContext.requirements) {
    const reqsLower = searchContext.requirements.toLowerCase();
    const missingReqs: string[] = [];

    // Check for specific skill requirements (cocktails, bartending, mixology, etc.)
    const skillKeywords = ['cocktail', 'bartend', 'mixolog', 'wine', 'sommelier'];
    const hasSkillReq = skillKeywords.some(kw => reqsLower.includes(kw));
    if (hasSkillReq) {
      const candidateSkillsLower = skills.map(s => s.toLowerCase()).join(' ');
      const hasCocktails = candidateSkillsLower.includes('cocktail') || candidateSkillsLower.includes('bartend') || candidateSkillsLower.includes('mixolog');
      const hasWine = candidateSkillsLower.includes('wine') || candidateSkillsLower.includes('sommelier') || uniqueCerts.some(c => c.toLowerCase().includes('wset'));

      if (reqsLower.includes('cocktail') && hasCocktails) {
        fitParts.push('Cocktail making skills match the specified requirements.');
      } else if ((reqsLower.includes('wine') || reqsLower.includes('sommelier')) && hasWine) {
        fitParts.push('Wine expertise aligns with the search requirements.');
      } else if (hasSkillReq && !hasCocktails && !hasWine) {
        const reqSkill = skillKeywords.find(kw => reqsLower.includes(kw));
        missingReqs.push(`${reqSkill} skills were requested but not evident in profile`);
      }
    }

    // If there are missing requirements, be honest about them
    if (missingReqs.length > 0) {
      fitParts.push(`Note: ${missingReqs.join(', ')}.`);
    }
  }

  // Add certification/skill context if no requirements were addressed
  if (fitParts.length === 1) {
    if (uniqueCerts.length > 0) {
      fitParts.push(`Their ${uniqueCerts[0]} qualification adds value to ${departmentContext}.`);
    } else if (uniqueSkills.length > 0) {
      fitParts.push(`Their ${uniqueSkills[0]} skills would benefit guest experiences.`);
    }
  }

  // Extract notable yacht names (largest yachts first)
  const notableYachts = yachtExp
    .filter(y => y.yacht_name && y.yacht_size_meters && y.yacht_size_meters >= 40)
    .sort((a, b) => (b.yacht_size_meters || 0) - (a.yacht_size_meters || 0))
    .slice(0, 3)
    .map(y => `${y.yacht_name} (${Math.round(y.yacht_size_meters || 0)}m)`);

  // Build career highlights with real data
  const highlights: string[] = [];
  // Lead with notable yacht names if available
  if (notableYachts.length >= 2) {
    highlights.push(`Previous yachts: ${notableYachts.slice(0, 2).join(', ')}`);
  } else if (notableYachts.length === 1) {
    highlights.push(`Previously on ${notableYachts[0]}`);
  } else if (largestYacht >= 50) {
    highlights.push(`Experience on superyachts up to ${Math.round(largestYacht)}m`);
  }
  if (yachtExp.length >= 3) highlights.push(`Worked across ${yachtExp.length} different vessels`);
  if (uniqueCerts.length > 0) highlights.push(`${uniqueCerts[0]} certified`);
  if (uniqueSkills.length >= 2) highlights.push(`Skilled in ${uniqueSkills.slice(0, 2).join(' and ')}`);
  if (certs.length >= 5) highlights.push(`${certs.length}+ professional certifications`);
  if (fluentLangs.length > 1) highlights.push(`Multilingual: ${fluentLangs.map(l => l.language).join(', ')}`);

  // Ensure at least 3 highlights
  if (highlights.length < 3) {
    if (yearsExp >= 1) highlights.push(`${yearsExp} year${yearsExp !== 1 ? 's' : ''} in yachting industry`);
    if (candidate.has_stcw) highlights.push('STCW certified');
    if (candidate.has_eng1) highlights.push('ENG1 medical certified');
  }

  // Build standout qualities
  const qualities: string[] = [];
  if (uniqueCerts.includes('Kite Instructor')) qualities.push('Can teach kitesurfing to guests');
  if (uniqueCerts.includes('PADI Dive certification')) qualities.push('Can lead guest diving excursions');
  if (uniqueCerts.includes('WSET Wine qualification')) qualities.push('Wine knowledge for guest service');
  if (uniqueSkills.includes('wakeboarding') || uniqueSkills.includes('kitesurfing')) {
    qualities.push('Water sports expertise for guest activities');
  }
  if (largestYacht >= 70) qualities.push(`Large yacht experience (${Math.round(largestYacht)}m+)`);
  if (fluentLangs.length >= 3) qualities.push(`Speaks ${fluentLangs.length} languages`);

  // Longevity assessment
  let longevityText = `Career spans ${totalPositions || 'multiple'} position${totalPositions !== 1 ? 's' : ''}.`;
  if (avgTenure > 0) {
    const avgMonths = Math.round(avgTenure);
    if (avgMonths < 6 && yearsExp <= 2) {
      longevityText = `New to the industry with ${yearsExp} year${yearsExp !== 1 ? 's' : ''} across ${totalPositions} position${totalPositions !== 1 ? 's' : ''} - typical for crew building experience.`;
    } else if (avgMonths < 6) {
      longevityText = `Short average tenure of ${avgMonths} months across ${totalPositions} positions - may indicate seasonal focus or frequent transitions.`;
    } else {
      longevityText = `Average tenure of ${avgMonths} months across ${totalPositions} position${totalPositions !== 1 ? 's' : ''}.${longestTenure > avgTenure ? ` Longest tenure: ${Math.round(longestTenure)} months.` : ''}`;
    }
  }

  return {
    professional_summary: summaryParts.join(' '),
    why_good_fit: fitParts.join(' '),
    career_highlights: highlights.slice(0, 4),
    standout_qualities: qualities.slice(0, 3),
    longevity_assessment: longevityText,
  };
}

// ----------------------------------------------------------------------------
// RICH BIO GENERATION - Creates compelling mini-resume presentations
// ----------------------------------------------------------------------------

function generateRichBio(candidate: {
  primary_position?: string | null;
  years_experience?: number | null;
  profile_summary?: string | null;
  nationality?: string | null;
  positions_held?: string[] | null;
  cv_skills?: string[] | null;
  yacht_experience_extracted?: YachtExperience[] | null;
  villa_experience_extracted?: VillaExperience[] | null;
  certifications_extracted?: CertificationExtracted[] | null;
  licenses_extracted?: LicenseExtracted[] | null;
  highest_license?: string | null;
  languages_extracted?: Array<{ language: string; proficiency: string }> | string[] | null;
}): string {
  const position = candidate.primary_position?.toLowerCase() || '';
  const yearsExp = candidate.years_experience || 0;
  const summary = candidate.profile_summary?.toLowerCase() || '';

  // Parse experience data
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const certs = (candidate.certifications_extracted || []) as CertificationExtracted[];
  const licenses = (candidate.licenses_extracted || []) as LicenseExtracted[];
  // Handle both string[] and object[] formats for languages
  const rawLangs = candidate.languages_extracted || [];
  const langs: Array<{ language: string; proficiency: string }> = rawLangs.length > 0 && typeof rawLangs[0] === 'string'
    ? (rawLangs as string[]).map(l => ({ language: l, proficiency: 'fluent' }))
    : rawLangs as Array<{ language: string; proficiency: string }>;
  const skills = candidate.cv_skills || [];

  // Calculate key metrics
  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));
  const yachtCount = yachtExp.length;
  const totalYachtMonths = yachtExp.reduce((sum, y) => sum + (y.duration_months || 0), 0);
  const hasCharterExp = yachtExp.some(y => y.yacht_type?.toLowerCase().includes('charter')) || summary.includes('charter');
  const hasPrivateExp = yachtExp.some(y => y.yacht_type?.toLowerCase().includes('private')) || summary.includes('private');

  // Identify standout qualifications
  const standoutCerts = identifyStandoutCerts(certs, licenses, position);
  const standoutSkills = identifyStandoutSkills(skills, summary, position);
  const fluentLangs = langs.filter(l => ['fluent', 'native', 'proficient', 'advanced'].includes(l.proficiency?.toLowerCase() || ''));

  // Build compelling narrative based on what makes THIS candidate unique
  return buildCompellingNarrative({
    position,
    yearsExp,
    summary,
    yachtExp,
    villaExp,
    largestYacht,
    yachtCount,
    totalYachtMonths,
    hasCharterExp,
    hasPrivateExp,
    standoutCerts,
    standoutSkills,
    fluentLangs,
    nationality: candidate.nationality,
  });
}

// Identify certifications that make a candidate stand out
function identifyStandoutCerts(
  certs: CertificationExtracted[],
  licenses: LicenseExtracted[],
  position: string
): string[] {
  const standout: string[] = [];

  // Maritime licenses (impressive for yacht crew)
  for (const lic of licenses) {
    const name = lic.name.toLowerCase();
    if (name.includes('yachtmaster') && name.includes('ocean')) {
      standout.push('RYA Yachtmaster Ocean');
    } else if (name.includes('yachtmaster') && name.includes('offshore')) {
      standout.push('RYA Yachtmaster Offshore');
    } else if (name.includes('master 3000') || name.includes('master unlimited')) {
      standout.push('Master of Yachts');
    } else if (name.includes('chief engineer') || name.includes('y4')) {
      standout.push('Chief Engineer qualification');
    }
  }

  // Standout certifications
  for (const cert of certs) {
    const name = cert.name.toLowerCase();
    if (name.includes('padi') && (name.includes('instructor') || name.includes('divemaster'))) {
      standout.push('PADI Dive Instructor');
    } else if (name.includes('wset') && (name.includes('3') || name.includes('level 3') || name.includes('advanced'))) {
      standout.push('WSET Level 3 Wine');
    } else if (name.includes('pwo') || name.includes('powerboat') && name.includes('instructor')) {
      standout.push('Powerboat Instructor');
    } else if (name.includes('jet ski') && name.includes('instructor')) {
      standout.push('Jet Ski Instructor');
    } else if (name.includes('silver service') || name.includes('butler') && name.includes('diploma')) {
      standout.push('Silver Service trained');
    }
  }

  return standout.slice(0, 3); // Max 3 to keep it readable
}

// Identify skills that set candidate apart
function identifyStandoutSkills(
  skills: string[],
  summary: string,
  position: string
): string[] {
  const standout: string[] = [];
  const skillsLower = skills.map(s => s.toLowerCase());
  const summaryLower = summary.toLowerCase();

  // Water sports (valuable for deck crew)
  const waterSports: string[] = [];
  if (skillsLower.some(s => s.includes('wakeboard')) || summaryLower.includes('wakeboard')) waterSports.push('wakeboarding');
  if (skillsLower.some(s => s.includes('waterski')) || summaryLower.includes('waterski')) waterSports.push('waterskiing');
  if (skillsLower.some(s => s.includes('kite')) || summaryLower.includes('kitesurf')) waterSports.push('kitesurfing');
  if (skillsLower.some(s => s.includes('surf')) || summaryLower.includes('surfing')) waterSports.push('surfing');
  if (skillsLower.some(s => s.includes('dive') || s.includes('scuba')) || summaryLower.includes('diving')) waterSports.push('diving');
  if (waterSports.length >= 2) {
    standout.push(`water sports (${waterSports.slice(0, 3).join(', ')})`);
  } else if (waterSports.length === 1) {
    standout.push(waterSports[0]);
  }

  // Technical skills
  if (skillsLower.some(s => s.includes('navigation') || s.includes('radar') || s.includes('ecdis'))) {
    standout.push('advanced navigation');
  }
  if (skillsLower.some(s => s.includes('tender') && s.includes('driv'))) {
    standout.push('tender driving');
  }
  if (skillsLower.some(s => s.includes('varnish') || s.includes('teak')) || summaryLower.includes('teak')) {
    standout.push('teak/varnish maintenance');
  }

  // Interior skills
  if (skillsLower.some(s => s.includes('flower') || s.includes('floral'))) {
    standout.push('floral arrangements');
  }
  if (skillsLower.some(s => s.includes('wine') || s.includes('sommelier'))) {
    standout.push('wine service');
  }
  if (skillsLower.some(s => s.includes('cocktail') || s.includes('mixolog'))) {
    standout.push('cocktail making');
  }

  return standout.slice(0, 3);
}

// Build the actual compelling narrative
function buildCompellingNarrative(data: {
  position: string;
  yearsExp: number;
  summary: string;
  yachtExp: YachtExperience[];
  villaExp: VillaExperience[];
  largestYacht: number;
  yachtCount: number;
  totalYachtMonths: number;
  hasCharterExp: boolean;
  hasPrivateExp: boolean;
  standoutCerts: string[];
  standoutSkills: string[];
  fluentLangs: Array<{ language: string; proficiency: string }>;
  nationality?: string | null;
}): string {
  const {
    position, yearsExp, summary, yachtExp, villaExp, largestYacht, yachtCount,
    totalYachtMonths, hasCharterExp, hasPrivateExp, standoutCerts, standoutSkills,
    fluentLangs, nationality,
  } = data;

  const sentences: string[] = [];

  // SENTENCE 1: Opening hook - what type of professional are they?
  sentences.push(buildOpeningHook(position, yearsExp, largestYacht, yachtCount, hasCharterExp, hasPrivateExp, summary));

  // SENTENCE 2: Experience depth - where have they worked?
  const expDepth = buildExperienceDepth(yachtExp, villaExp, yearsExp, largestYacht, yachtCount, summary);
  if (expDepth) sentences.push(expDepth);

  // SENTENCE 3: Standout qualifications/skills
  const qualifications = buildQualificationsSentence(standoutCerts, standoutSkills, position);
  if (qualifications) sentences.push(qualifications);

  // SENTENCE 4: Languages/personal touch (if we have room and something notable)
  if (sentences.length < 4) {
    const personal = buildPersonalSentence(fluentLangs, summary, nationality);
    if (personal) sentences.push(personal);
  }

  return sentences.join(' ');
}

function buildOpeningHook(
  position: string,
  yearsExp: number,
  largestYacht: number,
  yachtCount: number,
  hasCharterExp: boolean,
  hasPrivateExp: boolean,
  summary: string
): string {
  // Experience tier descriptions
  const expDesc = yearsExp >= 12 ? 'highly experienced' :
                  yearsExp >= 8 ? 'seasoned' :
                  yearsExp >= 5 ? 'experienced' :
                  yearsExp >= 3 ? 'capable' : 'motivated';

  // DECKHAND variations
  if (position.includes('deckhand') || position.includes('deck hand')) {
    if (yearsExp >= 8 && largestYacht >= 70) {
      return `A ${expDesc} deckhand who has worked on vessels up to ${Math.round(largestYacht)}m, with ${yearsExp} years mastering deck operations from tender handling to intricate yacht finishing.`;
    }
    if (yearsExp >= 5 && hasCharterExp && hasPrivateExp) {
      return `A versatile deckhand with ${yearsExp} years spanning both charter and private yachts, skilled at adapting to diverse guest expectations and vessel operations.`;
    }
    if (yearsExp >= 5 && yachtCount >= 4) {
      return `An adaptable deckhand with ${yearsExp} years across ${yachtCount} different yachts, bringing a wealth of varied experience to any deck team.`;
    }
    if (yearsExp >= 3 && largestYacht >= 50) {
      return `A ${expDesc} deckhand with ${yearsExp} years on superyachts up to ${Math.round(largestYacht)}m, developing strong expertise in professional deck operations.`;
    }
    if (yearsExp >= 3) {
      return `A ${expDesc} deckhand with ${yearsExp} years of hands-on yachting experience and a growing reputation for reliability.`;
    }
    // Junior deckhands - make them sound promising
    if (yachtCount >= 2) {
      return `An ambitious deckhand with ${yearsExp} year${yearsExp === 1 ? '' : 's'} already across ${yachtCount} yachts, demonstrating quick progression and genuine dedication to the industry.`;
    }
    return `A keen deckhand with ${yearsExp} year${yearsExp === 1 ? '' : 's'} of yacht experience, bringing fresh energy and strong work ethic to the deck team.`;
  }

  // STEWARDESS variations
  if (position.includes('steward')) {
    const isChief = position.includes('chief');
    if (isChief) {
      if (yearsExp >= 10) {
        return `A distinguished Chief Stewardess with ${yearsExp}+ years leading interior teams on prestigious superyachts to exceptional service standards.`;
      }
      return `An accomplished Chief Stewardess with ${yearsExp} years delivering five-star hospitality and managing interior operations with precision.`;
    }
    // Regular stewardess
    if (yearsExp >= 5) {
      return `A polished stewardess with ${yearsExp} years creating impeccable guest experiences, skilled in both service and housekeeping to exacting standards.`;
    }
    return `A dedicated stewardess with ${yearsExp} year${yearsExp === 1 ? '' : 's'} delivering attentive service and maintaining pristine interiors.`;
  }

  // CHEF variations
  if (position.includes('chef') || position.includes('cook')) {
    const hasMichelin = summary.includes('michelin') || summary.includes('starred');
    if (hasMichelin) {
      return `A talented chef with ${yearsExp} years including Michelin-starred experience, bringing restaurant-quality cuisine to private service.`;
    }
    if (yearsExp >= 8) {
      return `A ${expDesc} private chef with ${yearsExp}+ years creating exceptional cuisine for discerning principals and their guests.`;
    }
    return `A skilled chef with ${yearsExp} years preparing diverse menus from casual to formal dining.`;
  }

  // ENGINEER variations
  if (position.includes('engineer')) {
    const isChief = position.includes('chief') || position.includes('1st');
    if (isChief && yearsExp >= 8) {
      return `A senior engineer with ${yearsExp}+ years maintaining sophisticated yacht systems and managing technical operations with expertise.`;
    }
    if (yearsExp >= 5) {
      return `A capable engineer with ${yearsExp} years of hands-on experience across mechanical, electrical and hydraulic yacht systems.`;
    }
    return `A technical engineer with ${yearsExp} year${yearsExp === 1 ? '' : 's'} developing expertise in yacht engineering and maintenance.`;
  }

  // CAPTAIN variations
  if (position.includes('captain') || position.includes('master')) {
    if (yearsExp >= 15 && largestYacht >= 60) {
      return `An accomplished Captain with ${yearsExp}+ years commanding vessels up to ${Math.round(largestYacht)}m, with an exemplary safety record and crew leadership.`;
    }
    return `An experienced Captain with ${yearsExp} years of command experience, combining nautical expertise with strong crew management.`;
  }

  // BUTLER variations
  if (position.includes('butler')) {
    const hasRoyal = summary.includes('royal') || summary.includes('palace');
    if (hasRoyal) {
      return `A distinguished butler with ${yearsExp} years including service in royal households, bringing impeccable protocols and discretion.`;
    }
    if (yearsExp >= 10) {
      return `A highly accomplished butler with ${yearsExp}+ years providing seamless household management and personal service to elite clientele.`;
    }
    return `A professional butler with ${yearsExp} years anticipating principals' needs and maintaining exemplary household standards.`;
  }

  // Generic professional opening
  if (yearsExp >= 8) {
    return `A ${expDesc} private service professional with ${yearsExp}+ years delivering exceptional standards in luxury environments.`;
  }
  return `A dedicated professional with ${yearsExp} years of experience in high-end private service.`;
}

function buildExperienceDepth(
  yachtExp: YachtExperience[],
  villaExp: VillaExperience[],
  yearsExp: number,
  largestYacht: number,
  yachtCount: number,
  summary: string
): string | null {
  // Yacht experience - specific details
  if (yachtExp.length > 0) {
    const yachtTypes = new Set(yachtExp.map(y => y.yacht_type?.toLowerCase()).filter(Boolean));
    const hasSailing = yachtTypes.has('sailing') || summary.includes('sailing');
    const hasMotor = yachtTypes.has('motor') || summary.includes('motor yacht');

    if (yachtCount >= 5 && largestYacht >= 50) {
      return `Their CV spans ${yachtCount} yachts including vessels up to ${Math.round(largestYacht)}m, demonstrating adaptability across different programs and crew structures.`;
    }
    if (hasSailing && hasMotor && yachtCount >= 3) {
      return `Experience includes both sailing and motor yachts across ${yachtCount} vessels, offering versatility that many captains value.`;
    }
    if (largestYacht >= 70) {
      return `Has proven themselves on large superyachts up to ${Math.round(largestYacht)}m, understanding the demands of major vessel operations.`;
    }
    if (yachtCount >= 4) {
      return `Their background includes ${yachtCount} different yachts, each adding new skills and perspectives to their professional toolkit.`;
    }
    if (summary.includes('mediterranean') && summary.includes('caribbean')) {
      return `Has cruised both Mediterranean and Caribbean seasons, familiar with diverse itineraries and guest expectations.`;
    }
    if (yachtCount >= 2) {
      return `Already has experience on ${yachtCount} yachts, showing the initiative to build a genuine yachting career.`;
    }
  }

  // Villa/estate experience
  if (villaExp.length > 0) {
    const locations = [...new Set(villaExp.map(v => v.location).filter(Boolean))];
    if (locations.length >= 2) {
      return `Has managed properties in ${locations.slice(0, 2).join(' and ')}, understanding the nuances of different locations and clientele.`;
    }
    if (villaExp.length >= 2) {
      return `Their estate experience spans ${villaExp.length} properties, demonstrating trusted performance in private household environments.`;
    }
  }

  // Fallback from summary
  if (summary.includes('uhnw') || summary.includes('high net worth') || summary.includes('billionaire')) {
    return `Has served ultra-high-net-worth families, accustomed to the discretion and standards they require.`;
  }
  if (summary.includes('world cruise') || summary.includes('circumnavigation')) {
    return `Has completed extended voyages including world cruises, demonstrating commitment and endurance.`;
  }

  return null;
}

function buildQualificationsSentence(
  standoutCerts: string[],
  standoutSkills: string[],
  position: string
): string | null {
  const highlights: string[] = [];

  // Add standout certifications
  if (standoutCerts.length > 0) {
    highlights.push(...standoutCerts);
  }

  // Add standout skills if we have room
  if (standoutSkills.length > 0 && highlights.length < 3) {
    const remaining = 3 - highlights.length;
    highlights.push(...standoutSkills.slice(0, remaining));
  }

  if (highlights.length === 0) return null;

  if (highlights.length === 1) {
    return `Notably qualified in ${highlights[0]}, adding extra value to their core role.`;
  }
  if (highlights.length === 2) {
    return `Brings additional credentials including ${highlights[0]} and ${highlights[1]}.`;
  }
  return `Key qualifications include ${highlights[0]}, ${highlights[1]}, and ${highlights[2]}.`;
}

function buildPersonalSentence(
  fluentLangs: Array<{ language: string; proficiency: string }>,
  summary: string,
  nationality?: string | null
): string | null {
  const parts: string[] = [];

  // Languages (only if notable)
  if (fluentLangs.length >= 3) {
    const langNames = fluentLangs.map(l => l.language).slice(0, 4);
    parts.push(`speaks ${langNames.join(', ')}`);
  } else if (fluentLangs.length === 2 && !fluentLangs.every(l => l.language.toLowerCase() === 'english')) {
    const nonEnglish = fluentLangs.filter(l => l.language.toLowerCase() !== 'english');
    if (nonEnglish.length > 0) {
      parts.push(`bilingual with ${nonEnglish[0].language}`);
    }
  }

  // Professional qualities
  if (summary.includes('discretion') || summary.includes('confidential')) {
    parts.push('known for impeccable discretion');
  } else if (summary.includes('flexible') || summary.includes('adaptable')) {
    parts.push('highly flexible');
  } else if (summary.includes('meticulous') || summary.includes('detail')) {
    parts.push('extremely detail-oriented');
  }

  if (parts.length === 0) return null;

  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' and ') + '.';
}

function generateOpeningSentence(position: string, yearsExp: number, summary: string, yachtExp: YachtExperience[]): string {
  // Determine experience tier
  const tier = yearsExp >= 15 ? 'senior' : yearsExp >= 8 ? 'experienced' : yearsExp >= 4 ? 'established' : 'emerging';

  // Check for special qualifiers in summary
  const hasRoyal = summary.includes('royal') || summary.includes('palace');
  const hasMichelin = summary.includes('michelin') || summary.includes('starred');
  const hasUHNW = summary.includes('uhnw') || summary.includes('high net worth') || summary.includes('billionaire');
  const hasYacht = summary.includes('yacht') || summary.includes('superyacht');
  const hasFiveStar = summary.includes('five star') || summary.includes('5 star') || summary.includes('luxury hotel');

  // Parse yacht experience for variety (used by yacht crew positions)
  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));
  const yachtCount = yachtExp.length;

  // YACHT CREW POSITIONS
  if (position.includes('deckhand') || position.includes('deck hand')) {

    if (tier === 'senior' || tier === 'experienced') {
      if (largestYacht >= 70) {
        return `A seasoned deckhand with ${yearsExp} years' experience on vessels up to ${Math.round(largestYacht)}m, proficient in all deck operations from tender handling to yacht maintenance.`;
      }
      if (yachtCount >= 5) {
        return `A versatile deckhand with ${yearsExp} years across ${yachtCount} different yachts, bringing adaptability and comprehensive deck department knowledge.`;
      }
      if (hasYacht && summary.includes('charter')) {
        return `An experienced charter deckhand with ${yearsExp} years delivering exceptional guest experiences and maintaining vessels to the highest standards.`;
      }
      return `An experienced deckhand with ${yearsExp} years of hands-on superyacht experience, skilled in all aspects of deck operations.`;
    }
    if (tier === 'established') {
      if (largestYacht >= 50) {
        return `A capable deckhand with ${yearsExp} years on superyachts up to ${Math.round(largestYacht)}m, developing expertise in deck operations and yacht maintenance.`;
      }
      if (yachtCount >= 3) {
        return `A well-rounded deckhand with ${yearsExp} years across ${yachtCount} vessels, building a strong foundation in professional yacht service.`;
      }
      return `A capable deckhand with ${yearsExp} years developing expertise across multiple vessels and cruising grounds.`;
    }
    // Junior deckhands - still make them sound appealing
    if (yachtCount >= 2) {
      return `A keen deckhand with ${yearsExp} year${yearsExp === 1 ? '' : 's'} already on ${yachtCount} yachts, demonstrating quick learning and industry commitment.`;
    }
    if (summary.includes('water sport') || summary.includes('dive') || summary.includes('tender')) {
      return `An energetic deckhand with ${yearsExp} year${yearsExp === 1 ? '' : 's'} and strong water sports and tender skills - a valuable addition to any deck team.`;
    }
    return `A motivated deckhand with ${yearsExp} year${yearsExp === 1 ? '' : 's'} of yacht experience, eager to develop their career on the right vessel.`;
  }

  if (position.includes('steward')) {
    if (position.includes('chief')) {
      if (tier === 'senior') {
        return `A highly accomplished Chief Stewardess with ${yearsExp}+ years leading interior teams on prestigious superyachts.`;
      }
      return `An experienced Chief Stewardess with ${yearsExp} years managing interior operations and delivering five-star service.`;
    }
    if (tier === 'senior' || tier === 'experienced') {
      return `A polished steward${position.includes('ess') ? 'ess' : ''} with ${yearsExp} years delivering impeccable guest service on luxury yachts.`;
    }
    return `A dedicated steward${position.includes('ess') ? 'ess' : ''} with ${yearsExp} year${yearsExp === 1 ? '' : 's'} of superyacht interior experience.`;
  }

  if (position.includes('engineer')) {
    if (position.includes('chief')) {
      return `A senior Chief Engineer with ${yearsExp}+ years ensuring flawless operation of sophisticated yacht systems.`;
    }
    if (tier === 'senior' || tier === 'experienced') {
      return `A skilled marine engineer with ${yearsExp} years maintaining complex yacht machinery and systems.`;
    }
    return `A qualified engineer with ${yearsExp} year${yearsExp === 1 ? '' : 's'} of hands-on yacht engineering experience.`;
  }

  if (position.includes('captain') || position.includes('master')) {
    if (tier === 'senior') {
      return `A distinguished Captain with ${yearsExp}+ years commanding luxury yachts worldwide with an impeccable safety record.`;
    }
    return `An experienced Captain with ${yearsExp} years navigating vessels across international waters.`;
  }

  if (position.includes('officer') || position.includes('mate')) {
    if (tier === 'senior' || tier === 'experienced') {
      return `A qualified Officer with ${yearsExp} years of bridge watchkeeping and navigation experience on superyachts.`;
    }
    return `A capable Officer with ${yearsExp} year${yearsExp === 1 ? '' : 's'} progressing through yacht deck department ranks.`;
  }

  if (position.includes('bosun')) {
    if (tier === 'senior' || tier === 'experienced') {
      return `An experienced Bosun with ${yearsExp} years leading deck teams and maintaining vessels to the highest standards.`;
    }
    return `A dedicated Bosun with ${yearsExp} year${yearsExp === 1 ? '' : 's'} coordinating deck operations and crew.`;
  }

  // PRIVATE HOUSEHOLD POSITIONS
  if (position.includes('chef') || position.includes('cook')) {
    if (tier === 'senior') {
      if (hasMichelin) return `An exceptional culinary artist with ${yearsExp}+ years of experience, including time in Michelin-starred kitchens.`;
      if (hasRoyal) return `A distinguished chef of ${yearsExp}+ years, trained in the exacting standards of prestigious households.`;
      return `A master chef with over ${yearsExp} years crafting exceptional dining experiences for discerning clientele.`;
    }
    if (tier === 'experienced') {
      return `A talented chef with ${yearsExp} years of experience, known for creativity and precision in private service.`;
    }
    return `A passionate culinary professional with ${yearsExp} years honing their craft in private households.`;
  }

  if (position.includes('butler')) {
    if (tier === 'senior') {
      if (hasRoyal) return `A consummate butler with ${yearsExp}+ years of experience, trained to the highest standards of formal service.`;
      return `A distinguished butler of ${yearsExp}+ years, exemplifying discretion and impeccable service.`;
    }
    if (tier === 'experienced') {
      return `A polished butler with ${yearsExp} years ensuring seamless household operations and exceptional guest experiences.`;
    }
    return `A professionally trained butler with ${yearsExp} years of dedicated service to private households.`;
  }

  if (position.includes('nanny') || position.includes('governess')) {
    if (tier === 'senior') {
      return `A highly experienced childcare professional with ${yearsExp}+ years nurturing and educating children in private families.`;
    }
    if (tier === 'experienced') {
      return `A dedicated nanny with ${yearsExp} years of experience providing exceptional care and early education.`;
    }
    return `A warm and qualified childcare professional with ${yearsExp} years of experience with private families.`;
  }

  if (position.includes('housekeeper') || position.includes('house manager')) {
    if (tier === 'senior') {
      return `A meticulous household professional with ${yearsExp}+ years managing luxury residences to impeccable standards.`;
    }
    if (tier === 'experienced') {
      return `An accomplished housekeeper with ${yearsExp} years ensuring immaculate standards in private homes.`;
    }
    return `A detail-oriented household professional with ${yearsExp} years maintaining pristine home environments.`;
  }

  if (position.includes('estate') || position.includes('property manager')) {
    if (tier === 'senior') {
      return `A seasoned estate manager with ${yearsExp}+ years overseeing complex multi-property portfolios.`;
    }
    return `An experienced estate professional with ${yearsExp} years coordinating property operations and staff.`;
  }

  if (position.includes('chauffeur') || position.includes('driver')) {
    if (tier === 'senior') {
      return `A professional chauffeur with ${yearsExp}+ years providing secure, discreet transportation for VIP principals.`;
    }
    return `An experienced private driver with ${yearsExp} years of safe, punctual service to discerning clients.`;
  }

  // Generic professional opening
  if (tier === 'senior') {
    if (hasUHNW) return `A distinguished professional with ${yearsExp}+ years serving ultra-high-net-worth families.`;
    if (hasYacht) return `A seasoned professional with ${yearsExp}+ years of experience in luxury yachting and private service.`;
    return `A highly accomplished private staff professional with ${yearsExp}+ years of distinguished service.`;
  }
  if (tier === 'experienced') {
    return `An accomplished professional with ${yearsExp} years of experience in private household service.`;
  }
  return `A dedicated private service professional with ${yearsExp} years of relevant experience.`;
}

function generateExperienceScope(
  yachtExp: YachtExperience[],
  villaExp: VillaExperience[],
  summary: string
): string | null {
  const parts: string[] = [];

  // Analyze yacht experience
  if (yachtExp.length > 0) {
    const totalYachtMonths = yachtExp.reduce((sum, y) => sum + (y.duration_months || 0), 0);
    const largestYacht = Math.max(...yachtExp.map(y => y.yacht_size_meters || 0));
    const yachtCount = yachtExp.length;

    if (totalYachtMonths >= 60) { // 5+ years yacht experience
      if (largestYacht >= 60) {
        parts.push(`Has served aboard multiple superyachts, including vessels over ${Math.round(largestYacht)}m`);
      } else if (yachtCount >= 3) {
        parts.push(`Has extensive experience across ${yachtCount}+ yachts in various regions`);
      }
    } else if (totalYachtMonths >= 24) {
      parts.push('Has solid yachting background with experience on both charter and private vessels');
    }
  }

  // Analyze villa/estate experience
  if (villaExp.length > 0) {
    const totalVillaMonths = villaExp.reduce((sum, v) => sum + (v.duration_months || 0), 0);
    const locations = new Set(villaExp.map(v => v.location).filter(Boolean));

    if (totalVillaMonths >= 60 && locations.size >= 2) {
      parts.push(`Has managed properties across multiple international locations`);
    } else if (totalVillaMonths >= 36) {
      parts.push('Has proven track record in luxury property management');
    }
  }

  // Check summary for additional context
  if (summary.includes('private island') && !parts.some(p => p.includes('island'))) {
    parts.push('Includes experience on private island estates');
  }
  if (summary.includes('travelling') || summary.includes('traveling')) {
    parts.push('Experienced in traveling positions with global flexibility');
  }
  if ((summary.includes('europe') || summary.includes('mediterranean')) &&
      (summary.includes('caribbean') || summary.includes('america') || summary.includes('asia'))) {
    if (!parts.some(p => p.includes('international') || p.includes('global'))) {
      parts.push('Has worked across multiple continents');
    }
  }

  if (parts.length === 0) return null;
  return parts[0] + '.';
}

function generateAchievementsSentence(
  summary: string,
  certs: CertificationExtracted[],
  licenses: LicenseExtracted[],
  position: string
): string | null {
  const achievements: string[] = [];

  // Check for prestigious training/experience indicators
  if (summary.includes('buckingham') || summary.includes('royal palace')) {
    achievements.push('trained in royal household protocols');
  } else if (summary.includes('royal')) {
    achievements.push('has served in a royal household');
  }

  if (summary.includes('michelin') && position.includes('chef')) {
    achievements.push('has Michelin-starred kitchen experience');
  }

  if (summary.includes('cordon bleu') || summary.includes('culinary institute')) {
    achievements.push('classically trained at a prestigious culinary institution');
  }

  if (summary.includes('wset') || summary.includes('sommelier')) {
    achievements.push('holds professional wine qualifications');
  }

  if (summary.includes('montessori') && (position.includes('nanny') || position.includes('governess'))) {
    achievements.push('Montessori trained');
  }

  if (summary.includes('butler school') || summary.includes('butler academy') || summary.includes('ivor spencer')) {
    achievements.push('formally trained at a prestigious butler academy');
  }

  // Check certifications for impressive ones
  const hasFoodSafety = certs.some(c => c.category === 'food_safety' || c.name.toLowerCase().includes('haccp'));
  if (hasFoodSafety && position.includes('chef')) {
    if (!achievements.some(a => a.includes('culinary'))) {
      achievements.push('holds advanced food safety certifications');
    }
  }

  // Check licenses
  if (licenses.length > 0) {
    const hasAdvancedLicense = licenses.some(l =>
      l.name.toLowerCase().includes('master') ||
      l.name.toLowerCase().includes('captain') ||
      l.name.toLowerCase().includes('chief')
    );
    if (hasAdvancedLicense) {
      achievements.push('holds senior maritime qualifications');
    }
  }

  // Check for awards/recognition in summary
  if (summary.includes('award') || summary.includes('recognition') || summary.includes('commend')) {
    achievements.push('has received formal recognition for excellence');
  }

  if (achievements.length === 0) return null;

  if (achievements.length === 1) {
    return `Notably, ${achievements[0]}.`;
  }
  return `Notably, ${achievements[0]} and ${achievements[1]}.`;
}

function generatePersonalTouch(
  langs: Array<{ language: string; proficiency: string }>,
  summary: string,
  nationality?: string | null
): string | null {
  const parts: string[] = [];

  // Languages
  const fluentLangs = langs.filter(l =>
    ['fluent', 'native', 'proficient'].includes(l.proficiency.toLowerCase())
  );

  if (fluentLangs.length >= 3) {
    parts.push(`fluent in ${fluentLangs.length} languages`);
  } else if (fluentLangs.length === 2) {
    parts.push('bilingual');
  }

  // Personal qualities from summary
  if (summary.includes('discretion') || summary.includes('confidential')) {
    parts.push('known for exceptional discretion');
  } else if (summary.includes('meticulous') || summary.includes('attention to detail')) {
    parts.push('known for meticulous attention to detail');
  } else if (summary.includes('adaptable') || summary.includes('flexible')) {
    parts.push('highly adaptable');
  }

  if (parts.length === 0) return null;

  if (parts.length === 1) {
    return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} and available for new opportunities.`;
  }
  return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)}, ${parts[1]}, and available for new opportunities.`;
}

// ----------------------------------------------------------------------------
// CAREER HIGHLIGHTS - Bullet points of achievements
// ----------------------------------------------------------------------------

function generateCareerHighlights(candidate: {
  yacht_experience_extracted?: YachtExperience[] | null;
  villa_experience_extracted?: VillaExperience[] | null;
  profile_summary?: string | null;
  certifications_extracted?: CertificationExtracted[] | null;
  licenses_extracted?: LicenseExtracted[] | null;
  years_experience?: number | null;
  primary_position?: string | null;
}): string[] {
  const highlights: string[] = [];
  const summary = candidate.profile_summary?.toLowerCase() || '';
  const position = candidate.primary_position?.toLowerCase() || '';
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const certs = (candidate.certifications_extracted || []) as CertificationExtracted[];
  const yearsExp = candidate.years_experience || 0;

  // Yacht size achievements
  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));
  if (largestYacht >= 80) {
    highlights.push(`Experience on vessels up to ${Math.round(largestYacht)}m`);
  } else if (largestYacht >= 50) {
    highlights.push(`Superyacht experience (50m+)`);
  }

  // Number of vessels/properties
  if (yachtExp.length >= 5) {
    highlights.push(`${yachtExp.length}+ yacht positions held`);
  }
  if (villaExp.length >= 3) {
    highlights.push(`Multi-property experience across ${villaExp.length}+ estates`);
  }

  // Special experience from summary
  if (summary.includes('royal') || summary.includes('palace')) {
    highlights.push('Royal household experience');
  }
  if (summary.includes('uhnw') || summary.includes('billionaire') || summary.includes('high net worth')) {
    highlights.push('UHNW family experience');
  }
  if (summary.includes('michelin')) {
    highlights.push('Michelin-starred kitchen background');
  }
  if (summary.includes('private island')) {
    highlights.push('Private island estate experience');
  }
  if (summary.includes('event') && (summary.includes('large') || summary.includes('formal'))) {
    highlights.push('Large-scale event management');
  }
  if (summary.includes('team') && (summary.includes('manag') || summary.includes('lead'))) {
    highlights.push('Team leadership experience');
  }

  // Certification highlights
  const wineQuals = certs.filter(c => c.category === 'wine' || c.name.toLowerCase().includes('wset'));
  if (wineQuals.length > 0) {
    highlights.push('WSET wine qualifications');
  }

  const childcareQuals = certs.filter(c => c.category === 'childcare');
  if (childcareQuals.length > 0 && (position.includes('nanny') || position.includes('governess'))) {
    highlights.push('Certified childcare qualifications');
  }

  // Experience tenure
  if (yearsExp >= 15) {
    highlights.push(`${yearsExp}+ years in private service`);
  } else if (yearsExp >= 10) {
    highlights.push(`Over a decade of experience`);
  }

  // Return top 4 most impressive
  return highlights.slice(0, 4);
}

// ----------------------------------------------------------------------------
// EXPERIENCE SUMMARY - Brief scope of career
// ----------------------------------------------------------------------------

function generateExperienceSummary(candidate: {
  yacht_experience_extracted?: YachtExperience[] | null;
  villa_experience_extracted?: VillaExperience[] | null;
  years_experience?: number | null;
}): string {
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const yearsExp = candidate.years_experience || 0;

  const yachtCount = yachtExp.length;
  const villaCount = villaExp.length;

  if (yachtCount >= 3 && villaCount >= 2) {
    return `${yearsExp} years across ${yachtCount} yachts and ${villaCount} private estates`;
  }
  if (yachtCount >= 3) {
    return `${yearsExp} years of yachting experience across ${yachtCount} vessels`;
  }
  if (villaCount >= 3) {
    return `${yearsExp} years managing ${villaCount} private properties`;
  }
  if (yachtCount > 0 && villaCount > 0) {
    return `${yearsExp} years combining yacht and estate experience`;
  }
  if (yachtCount > 0) {
    return `${yearsExp} years in private yacht service`;
  }
  if (villaCount > 0) {
    return `${yearsExp} years in private household service`;
  }
  return `${yearsExp} years of professional experience`;
}

// ----------------------------------------------------------------------------
// QUALIFICATIONS - Key certs/licenses (anonymized)
// ----------------------------------------------------------------------------

// Normalize certification/license names to proper format
function normalizeCertName(name: string): string {
  const normalized = name.trim();
  const lower = normalized.toLowerCase();

  // Common certifications that need standardization
  if (lower === 'eng1' || lower === 'eng 1' || lower.includes('eng1 medical')) {
    return 'ENG1 Medical';
  }
  if (lower === 'stcw' || lower === 'stcw95' || lower === 'stcw 95') {
    return 'STCW Certified';
  }
  if (lower.includes('yachtmaster offshore')) {
    return 'RYA Yachtmaster Offshore';
  }
  if (lower.includes('yachtmaster coastal')) {
    return 'RYA Yachtmaster Coastal';
  }
  if (lower.includes('yachtmaster ocean')) {
    return 'RYA Yachtmaster Ocean';
  }
  if (lower === 'padi' || lower.includes('padi open water')) {
    return 'PADI Certified Diver';
  }
  if (lower.includes('powerboat level 2') || lower.includes('powerboat l2')) {
    return 'RYA Powerboat Level 2';
  }

  // Return properly cased version for unknown certs
  return normalized;
}

function extractQualifications(candidate: {
  certifications_extracted?: CertificationExtracted[] | null;
  licenses_extracted?: LicenseExtracted[] | null;
  has_stcw?: boolean | null;
  has_eng1?: boolean | null;
  highest_license?: string | null;
}): string[] {
  const quals: string[] = [];
  const seenNormalized = new Set<string>(); // Track normalized names to avoid duplicates
  const certs = (candidate.certifications_extracted || []) as CertificationExtracted[];
  const licenses = (candidate.licenses_extracted || []) as LicenseExtracted[];

  // Add highest license if present (normalized)
  if (candidate.highest_license) {
    const normalized = normalizeCertName(candidate.highest_license);
    // Skip if it's just "eng1" or "stcw" as these will be added via flags
    if (!['ENG1 Medical', 'STCW Certified'].includes(normalized)) {
      quals.push(normalized);
      seenNormalized.add(normalized.toLowerCase());
    }
  }

  // Add key maritime certs (avoid duplicates)
  if (candidate.has_stcw && !seenNormalized.has('stcw certified')) {
    quals.push('STCW Certified');
    seenNormalized.add('stcw certified');
  }
  if (candidate.has_eng1 && !seenNormalized.has('eng1 medical')) {
    quals.push('ENG1 Medical');
    seenNormalized.add('eng1 medical');
  }

  // Add notable certifications by category
  const certCategories = new Set(certs.map(c => c.category));

  if (certCategories.has('wine')) {
    quals.push('Wine Qualified');
  }
  if (certCategories.has('food_safety')) {
    quals.push('Food Safety Certified');
  }
  if (certCategories.has('hospitality')) {
    quals.push('Hospitality Trained');
  }
  if (certCategories.has('childcare')) {
    quals.push('Childcare Certified');
  }
  if (certCategories.has('diving')) {
    quals.push('Dive Qualified');
  }
  if (certCategories.has('security')) {
    quals.push('Security Trained');
  }

  // Check for specific valuable licenses
  const hasYachtmaster = licenses.some(l => l.name.toLowerCase().includes('yachtmaster'));
  if (hasYachtmaster && !quals.some(q => q.toLowerCase().includes('yachtmaster'))) {
    quals.push('Yachtmaster');
  }

  return quals.slice(0, 5);
}

function extractLanguages(
  languagesExtracted: Array<{ language: string; proficiency: string }> | string[] | null
): string[] {
  if (!languagesExtracted || languagesExtracted.length === 0) {
    return ['English'];
  }

  // Handle both formats: string[] or object[]
  if (typeof languagesExtracted[0] === 'string') {
    return (languagesExtracted as string[]).slice(0, 4);
  }

  return (languagesExtracted as Array<{ language: string; proficiency: string }>)
    .filter((l) => l.proficiency !== 'basic')
    .map((l) => l.language)
    .slice(0, 4);
}

function generateKeyStrengths(candidate: {
  cv_skills?: string[] | null;
  positions_held?: string[] | null;
  profile_summary?: string | null;
  years_experience?: number | null;
  primary_position?: string | null;
  yacht_experience_extracted?: YachtExperience[] | null;
}): string[] {
  const strengths: string[] = [];
  const summary = candidate.profile_summary?.toLowerCase() || '';
  const position = candidate.primary_position?.toLowerCase() || '';
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const isYachtCrew = position.includes('deck') || position.includes('steward') || position.includes('engineer') ||
                       position.includes('captain') || position.includes('officer') || position.includes('bosun');

  // Priority skills - YACHT CREW FOCUSED
  const yachtSkills: Array<{ keywords: string[]; label: string }> = [
    // Technical deck skills
    { keywords: ['tender', 'rib', 'jet ski'], label: 'Tender operations' },
    { keywords: ['water sport', 'wakeboard', 'kitesurf', 'diving', 'scuba'], label: 'Water sports instructor' },
    { keywords: ['paint', 'varnish', 'teak', 'woodwork'], label: 'Yacht finishing' },
    { keywords: ['navigation', 'watchkeep', 'bridge'], label: 'Navigation qualified' },
    { keywords: ['anchor', 'mooring', 'line handling'], label: 'Seamanship' },
    // Interior skills
    { keywords: ['silver service', 'formal service', 'fine dining'], label: 'Silver service trained' },
    { keywords: ['flower', 'floral', 'table setting'], label: 'Floral & tablescaping' },
    { keywords: ['wine', 'sommelier', 'wset'], label: 'Wine knowledge' },
    { keywords: ['spa', 'massage', 'wellness'], label: 'Spa & wellness' },
    { keywords: ['housekeeping', 'laundry', 'ironing'], label: 'Immaculate housekeeping' },
    // Engineering skills
    { keywords: ['mechanical', 'electrical', 'hydraulic'], label: 'Technical expertise' },
    { keywords: ['watermaker', 'generator', 'systems'], label: 'Systems management' },
    // Safety & certs
    { keywords: ['stcw', 'safety', 'firefight'], label: 'Safety certified' },
    { keywords: ['first aid', 'medical', 'efa'], label: 'Medical trained' },
    { keywords: ['padi', 'dive', 'scuba'], label: 'Dive qualified' },
    // Charter experience
    { keywords: ['charter', 'guest'], label: 'Charter experienced' },
    // Personal qualities
    { keywords: ['team', 'collaborat'], label: 'Excellent teamwork' },
    { keywords: ['detail', 'meticulous'], label: 'Meticulous attention' },
    { keywords: ['flexible', 'adaptable'], label: 'Highly adaptable' },
    { keywords: ['professional', 'present'], label: 'Professional presentation' },
  ];

  // Priority skills - PRIVATE HOUSEHOLD FOCUSED
  const householdSkills: Array<{ keywords: string[]; label: string }> = [
    // Service excellence
    { keywords: ['formal service', 'butler training', 'silver service'], label: 'Formal service trained' },
    { keywords: ['wine', 'sommelier', 'cellar'], label: 'Wine expertise' },
    { keywords: ['flower', 'floral', 'arrangement'], label: 'Floral arrangement' },
    { keywords: ['antique', 'fine art', 'art handling'], label: 'Fine art handling' },
    { keywords: ['wardrobe', 'valet', 'clothing care'], label: 'Wardrobe management' },
    // Culinary
    { keywords: ['michelin', 'starred'], label: 'Michelin experience' },
    { keywords: ['dietary', 'nutrition', 'special diet'], label: 'Dietary specialist' },
    { keywords: ['pastry', 'patisserie', 'baking'], label: 'Pastry expertise' },
    // Childcare
    { keywords: ['montessori', 'early years', 'pedagogy'], label: 'Montessori trained' },
    { keywords: ['first aid', 'pediatric', 'medical'], label: 'Pediatric first aid' },
    { keywords: ['multiple languages', 'bilingual', 'trilingual'], label: 'Multilingual' },
    // Management
    { keywords: ['event', 'entertaining', 'party'], label: 'Event management' },
    { keywords: ['vendor', 'contractor', 'staff management'], label: 'Vendor coordination' },
    { keywords: ['budget', 'financial', 'accounts'], label: 'Budget management' },
    { keywords: ['inventory', 'stock', 'household supplies'], label: 'Inventory management' },
    // Personal qualities
    { keywords: ['discretion', 'discreet', 'confidential'], label: 'Exceptional discretion' },
    { keywords: ['detail', 'meticulous', 'perfectionist'], label: 'Meticulous attention' },
    { keywords: ['flexible', 'adaptable', 'versatile'], label: 'Highly adaptable' },
  ];

  // Choose skill set based on candidate type
  const impressiveSkills = isYachtCrew ? yachtSkills : householdSkills;

  // Check summary and skills for impressive qualities
  const allText = (summary + ' ' + (candidate.cv_skills || []).join(' ')).toLowerCase();

  for (const skill of impressiveSkills) {
    if (strengths.length >= 4) break;
    if (skill.keywords.some(kw => allText.includes(kw))) {
      if (!strengths.includes(skill.label)) {
        strengths.push(skill.label);
      }
    }
  }

  // Add yacht-specific strengths based on experience
  if (isYachtCrew && strengths.length < 4) {
    const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));
    if (largestYacht >= 60) {
      strengths.push(`${Math.round(largestYacht)}m+ experience`);
    } else if (largestYacht >= 40) {
      strengths.push('Large yacht experience');
    }
    if (yachtExp.length >= 4 && strengths.length < 4) {
      strengths.push('Multi-vessel experience');
    }
  }

  // Add experience-based strength if we have room
  if (strengths.length < 4) {
    if (candidate.years_experience && candidate.years_experience >= 10) {
      strengths.push('15+ years expertise');
    } else if (candidate.years_experience && candidate.years_experience >= 5) {
      strengths.push('Solid experience');
    }
  }

  // If still not enough, add position-based defaults
  if (strengths.length < 2) {
    if (position.includes('deck')) {
      strengths.push('Deck operations');
    } else if (position.includes('steward')) {
      strengths.push('Interior service');
    } else if (position.includes('engineer')) {
      strengths.push('Technical expertise');
    } else if (position.includes('chef') || position.includes('cook')) {
      strengths.push('Culinary professional');
    } else if (position.includes('nanny') || position.includes('governess')) {
      strengths.push('Childcare specialist');
    } else if (position.includes('butler')) {
      strengths.push('Service professional');
    } else if (position.includes('housekeeper') || position.includes('house manager')) {
      strengths.push('Household management');
    } else {
      strengths.push('Private service experience');
    }
  }

  return strengths.slice(0, 4);
}

function mapAvailability(
  status: string | null,
  requestedTimeline?: string
): string {
  if (!status) return 'Available on request';

  const statusLower = status.toLowerCase();

  if (statusLower.includes('immediately') || statusLower.includes('available')) {
    return 'Available immediately';
  }
  if (statusLower.includes('notice')) {
    return 'Available with notice';
  }
  if (statusLower.includes('month')) {
    return 'Available within 1 month';
  }

  // Default based on requested timeline
  switch (requestedTimeline) {
    case 'asap':
      return 'Potentially available soon';
    case '1-month':
      return 'Available within timeframe';
    case '3-months':
      return 'Available for future start';
    default:
      return 'Availability on request';
  }
}

// ----------------------------------------------------------------------------
// NAME OBFUSCATION - Creates partially hidden names for personal touch
// ----------------------------------------------------------------------------

function obfuscateName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';

  if (!first && !last) {
    return 'Candidate';
  }

  // Show first letter, hide rest with asterisks
  const obfuscateWord = (word: string): string => {
    if (word.length <= 1) return word;
    // Show first letter, then asterisks for rest
    return word[0].toUpperCase() + '*'.repeat(Math.min(word.length - 1, 4));
  };

  const obfuscatedFirst = first ? obfuscateWord(first) : '';
  const obfuscatedLast = last ? obfuscateWord(last) : '';

  if (obfuscatedFirst && obfuscatedLast) {
    return `${obfuscatedFirst} ${obfuscatedLast}`;
  }

  return obfuscatedFirst || obfuscatedLast || 'Candidate';
}

function extractNotableEmployers(
  profileSummary: string,
  positionsHeld: string[]
): string[] {
  const employers: string[] = [];
  const summaryLower = profileSummary.toLowerCase();
  const allText = (summaryLower + ' ' + positionsHeld.join(' ')).toLowerCase();

  // Map keywords to anonymized employer types
  const employerPatterns: Array<{ keywords: string[]; label: string }> = [
    { keywords: ['royal', 'palace', 'buckingham', 'windsor', 'monarch'], label: 'Royal Household' },
    { keywords: ['embassy', 'ambassador', 'diplomatic'], label: 'Diplomatic Residence' },
    { keywords: ['five star', '5 star', '5-star', 'ritz', 'four seasons', 'mandarin'], label: '5-Star Hotel Group' },
    { keywords: ['michelin', 'starred restaurant'], label: 'Michelin-Starred Restaurant' },
    { keywords: ['yacht', 'superyacht', 'motor yacht', 'sailing yacht'], label: 'Superyacht' },
    { keywords: ['uhnw', 'billionaire', 'high net worth', 'forbes'], label: 'UHNW Family' },
    { keywords: ['estate', 'country house', 'manor', 'castle'], label: 'Private Estate' },
    { keywords: ['celebrity', 'public figure', 'entertainment'], label: 'High-Profile Principal' },
    { keywords: ['private island', 'resort'], label: 'Private Island/Resort' },
    { keywords: ['ceo', 'founder', 'entrepreneur', 'executive'], label: 'Business Executive' },
  ];

  for (const pattern of employerPatterns) {
    if (pattern.keywords.some((kw) => allText.includes(kw))) {
      if (!employers.includes(pattern.label)) {
        employers.push(pattern.label);
      }
    }
    if (employers.length >= 3) break;
  }

  return employers;
}

// ----------------------------------------------------------------------------
// WHY GOOD FIT - Personalized explanation of match to specific brief
// ----------------------------------------------------------------------------

interface SearchContext {
  role: string;
  location: string;
  timeline: string;
  requirements: string;
}

/**
 * Generates a compelling, personalized explanation of why this candidate
 * matches the SPECIFIC search criteria the user provided.
 *
 * This is THE key selling point - it should make the user think
 * "Yes, this person could be exactly what I need!"
 */
function generateWhyGoodFit(
  candidate: {
    primary_position?: string | null;
    years_experience?: number | null;
    profile_summary?: string | null;
    availability_status?: string | null;
    nationality?: string | null;
    cv_skills?: string[] | null;
    yacht_experience_extracted?: YachtExperience[] | null;
    villa_experience_extracted?: VillaExperience[] | null;
    certifications_extracted?: CertificationExtracted[] | null;
    licenses_extracted?: LicenseExtracted[] | null;
    languages_extracted?: Array<{ language: string; proficiency: string }> | string[] | null;
  },
  context: SearchContext
): string {
  // Parse all candidate data
  const position = candidate.primary_position?.toLowerCase() || '';
  const yearsExp = candidate.years_experience || 0;
  const summary = (candidate.profile_summary || '').toLowerCase();
  const skills = candidate.cv_skills || [];
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const certs = (candidate.certifications_extracted || []) as CertificationExtracted[];
  const licenses = (candidate.licenses_extracted || []) as LicenseExtracted[];
  const langs = (candidate.languages_extracted || []) as Array<{ language: string; proficiency: string }>;
  const availability = (candidate.availability_status || '').toLowerCase();

  // Parse search context
  const requestedRole = context.role.toLowerCase().replace(/-/g, ' ');
  const location = (context.location || '').toLowerCase();
  const timeline = (context.timeline || '').toLowerCase();
  const requirements = (context.requirements || '').toLowerCase();

  // Calculate candidate metrics
  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));
  const yachtCount = yachtExp.length;
  const hasCharterExp = yachtExp.some(y => y.yacht_type?.toLowerCase().includes('charter')) || summary.includes('charter');
  const hasPrivateExp = yachtExp.some(y => y.yacht_type?.toLowerCase().includes('private')) || summary.includes('private');

  // Collect all matching points
  const matchPoints: { priority: number; text: string }[] = [];

  // ===== 1. REQUIREMENTS MATCHING (Highest priority) =====
  // Parse any specific requirements mentioned by the user
  if (requirements) {
    // Check for STCW/certification requirements
    if (requirements.includes('stcw')) {
      const hasStcw = certs.some(c => c.name.toLowerCase().includes('stcw')) || summary.includes('stcw');
      if (hasStcw) {
        matchPoints.push({ priority: 10, text: 'holds full STCW certification as you require' });
      }
    }

    // Check for language requirements
    const langMatches = matchLanguageRequirements(requirements, langs);
    langMatches.forEach(m => matchPoints.push({ priority: 9, text: m }));

    // Check for experience level requirements
    if (requirements.includes('senior') || requirements.includes('experienced') || requirements.includes('5+ year') || requirements.includes('10+ year')) {
      if (yearsExp >= 8) {
        matchPoints.push({ priority: 8, text: `brings ${yearsExp}+ years of seasoned experience` });
      } else if (yearsExp >= 5) {
        matchPoints.push({ priority: 7, text: `has ${yearsExp} solid years in the industry` });
      }
    }

    // Check for yacht size requirements
    const sizeMatch = requirements.match(/(\d+)\s*m(?:eter)?/);
    if (sizeMatch) {
      const requestedSize = parseInt(sizeMatch[1]);
      if (largestYacht >= requestedSize) {
        matchPoints.push({ priority: 8, text: `has worked on ${Math.round(largestYacht)}m+ vessels, exceeding your size requirement` });
      } else if (largestYacht >= requestedSize * 0.8) {
        matchPoints.push({ priority: 6, text: `has experience on vessels up to ${Math.round(largestYacht)}m` });
      }
    }

    // Check for specific skill requirements
    const skillMatches = matchSkillRequirements(requirements, skills, summary, certs);
    skillMatches.forEach(m => matchPoints.push({ priority: 7, text: m }));

    // Check for charter/private preferences
    if (requirements.includes('charter')) {
      if (hasCharterExp) {
        matchPoints.push({ priority: 7, text: 'has direct charter yacht experience with guest-facing service' });
      }
    }
    if (requirements.includes('private')) {
      if (hasPrivateExp) {
        matchPoints.push({ priority: 7, text: 'understands the discretion and consistency expected on private yachts' });
      }
    }

    // Check for visa/travel requirements
    if (requirements.includes('b1') || requirements.includes('b2') || requirements.includes('usa') || requirements.includes('us visa')) {
      if (summary.includes('b1') || summary.includes('b2') || summary.includes('us visa')) {
        matchPoints.push({ priority: 8, text: 'holds US B1/B2 visa for Caribbean and US cruising' });
      }
    }
    if (requirements.includes('schengen')) {
      if (summary.includes('schengen') || candidate.nationality?.toLowerCase().match(/uk|gb|eu|german|french|italian|spanish|dutch/)) {
        matchPoints.push({ priority: 7, text: 'can work freely in the Schengen area' });
      }
    }
  }

  // ===== 2. LOCATION MATCHING =====
  if (location) {
    const locationMatches = matchLocationRequirements(location, summary, yachtExp, langs);
    locationMatches.forEach(m => matchPoints.push({ priority: 6, text: m }));
  }

  // ===== 3. TIMELINE MATCHING =====
  if (timeline) {
    const timelineMatch = matchTimelineRequirements(timeline, availability);
    if (timelineMatch) {
      matchPoints.push({ priority: 5, text: timelineMatch });
    }
  }

  // ===== 4. ROLE-SPECIFIC STRENGTHS =====
  // Add inherent strengths based on their profile that match the requested role
  const roleStrengths = generateRoleStrengths(requestedRole, position, yearsExp, yachtExp, villaExp, summary, certs, licenses);
  roleStrengths.forEach(s => matchPoints.push({ priority: 4, text: s }));

  // ===== COMPOSE FINAL STATEMENT =====
  // Sort by priority and take the best 2-3 points
  matchPoints.sort((a, b) => b.priority - a.priority);
  const topPoints = matchPoints.slice(0, 3).map(p => p.text);

  if (topPoints.length === 0) {
    // Fallback if no specific matches - use general fit
    return generateGeneralFitStatement(position, requestedRole, yearsExp, yachtCount, largestYacht);
  }

  // Compose naturally
  if (topPoints.length === 1) {
    return `They ${topPoints[0]} - making them a strong match for your search.`;
  }
  if (topPoints.length === 2) {
    return `They ${topPoints[0]} and ${topPoints[1]}.`;
  }
  return `They ${topPoints[0]}, ${topPoints[1]}, and ${topPoints[2]}.`;
}

// Match language requirements from the request
function matchLanguageRequirements(
  requirements: string,
  langs: Array<{ language: string; proficiency: string }>
): string[] {
  const matches: string[] = [];
  const fluentLangs = langs.filter(l => ['fluent', 'native', 'proficient', 'advanced'].includes(l.proficiency?.toLowerCase() || ''));

  const languageChecks = [
    { keywords: ['french', 'france'], language: 'french', text: 'speaks fluent French as you requested' },
    { keywords: ['spanish', 'spain'], language: 'spanish', text: 'speaks fluent Spanish as you need' },
    { keywords: ['italian', 'italy'], language: 'italian', text: 'speaks fluent Italian as specified' },
    { keywords: ['german', 'germany'], language: 'german', text: 'speaks fluent German as required' },
    { keywords: ['russian'], language: 'russian', text: 'speaks Russian which you mentioned' },
    { keywords: ['mandarin', 'chinese'], language: 'mandarin', text: 'speaks Mandarin Chinese' },
    { keywords: ['arabic'], language: 'arabic', text: 'speaks Arabic' },
  ];

  for (const check of languageChecks) {
    if (check.keywords.some(k => requirements.includes(k))) {
      const hasLang = fluentLangs.some(l => l.language.toLowerCase().includes(check.language));
      if (hasLang) {
        matches.push(check.text);
      }
    }
  }

  return matches;
}

// Match skill requirements
function matchSkillRequirements(
  requirements: string,
  skills: string[],
  summary: string,
  certs: CertificationExtracted[]
): string[] {
  const matches: string[] = [];
  const skillsLower = skills.map(s => s.toLowerCase());
  const certsLower = certs.map(c => c.name.toLowerCase());

  const skillChecks = [
    { keywords: ['dive', 'diving', 'scuba'], check: () => skillsLower.some(s => s.includes('dive')) || certsLower.some(c => c.includes('padi') || c.includes('dive')), text: 'is a qualified diver' },
    { keywords: ['water sport', 'watersport'], check: () => skillsLower.some(s => s.includes('water') || s.includes('wake') || s.includes('ski')), text: 'has water sports expertise' },
    { keywords: ['tender'], check: () => skillsLower.some(s => s.includes('tender')) || summary.includes('tender'), text: 'is experienced in tender operations' },
    { keywords: ['wine', 'sommelier'], check: () => certsLower.some(c => c.includes('wset') || c.includes('sommelier')), text: 'has professional wine qualifications' },
    { keywords: ['silver service', 'formal service'], check: () => summary.includes('silver service') || certsLower.some(c => c.includes('silver')), text: 'is trained in silver service' },
    { keywords: ['navigation', 'bridge'], check: () => skillsLower.some(s => s.includes('navigat') || s.includes('radar')), text: 'has bridge watchkeeping skills' },
    { keywords: ['varnish', 'teak', 'finishing'], check: () => skillsLower.some(s => s.includes('varnish') || s.includes('teak')), text: 'specializes in yacht finishing work' },
  ];

  for (const check of skillChecks) {
    if (check.keywords.some(k => requirements.includes(k))) {
      if (check.check()) {
        matches.push(check.text);
      }
    }
  }

  return matches;
}

// Match location requirements
function matchLocationRequirements(
  location: string,
  summary: string,
  yachtExp: YachtExperience[],
  langs: Array<{ language: string; proficiency: string }>
): string[] {
  const matches: string[] = [];
  const fluentLangs = langs.filter(l => ['fluent', 'native', 'proficient', 'advanced'].includes(l.proficiency?.toLowerCase() || ''));

  // Mediterranean locations
  if (location.match(/monaco|france|côte|cote|riviera|cannes|antibes|nice/)) {
    if (summary.includes('monaco') || summary.includes('french riviera') || summary.includes('côte')) {
      matches.push('has worked the French Riviera before and knows the area');
    } else if (fluentLangs.some(l => l.language.toLowerCase() === 'french')) {
      matches.push('speaks French which is valuable for your Monaco/France location');
    }
  }

  if (location.match(/spain|ibiza|mallorca|barcelona|palma/)) {
    if (summary.includes('spain') || summary.includes('ibiza') || summary.includes('mallorca')) {
      matches.push('has experience in Spanish waters and the Balearics');
    } else if (fluentLangs.some(l => l.language.toLowerCase() === 'spanish')) {
      matches.push('speaks Spanish which suits your Spain-based position');
    }
  }

  if (location.match(/italy|sardinia|amalfi|como|porto/)) {
    if (summary.includes('italy') || summary.includes('sardinia') || summary.includes('italian')) {
      matches.push('has worked in Italian waters before');
    } else if (fluentLangs.some(l => l.language.toLowerCase() === 'italian')) {
      matches.push('speaks Italian for your Italy-based role');
    }
  }

  // Caribbean
  if (location.match(/caribbean|bahamas|st\.?\s*barth|antigua|virgin|florida|miami|fort lauderdale/)) {
    if (summary.includes('caribbean') || summary.includes('bahamas') || summary.includes('florida')) {
      matches.push('has Caribbean/US East Coast experience matching your location');
    }
  }

  // Mediterranean general
  if (location.match(/mediterranean|med\b/)) {
    if (summary.includes('mediterranean') || summary.includes('med ')) {
      matches.push('is experienced in Mediterranean cruising');
    }
  }

  return matches;
}

// Match timeline requirements
function matchTimelineRequirements(timeline: string, availability: string): string | null {
  if (timeline === 'asap' || timeline.includes('immediate') || timeline.includes('urgent')) {
    if (availability.includes('immediate') || availability.includes('available')) {
      return 'is available immediately to start';
    }
  }
  if (timeline === '1-month' || timeline.includes('within')) {
    if (availability.includes('immediate') || availability.includes('available') || availability.includes('notice')) {
      return 'can start within your timeframe';
    }
  }
  return null;
}

// Generate role-specific strengths
function generateRoleStrengths(
  requestedRole: string,
  candidatePosition: string,
  yearsExp: number,
  yachtExp: YachtExperience[],
  villaExp: VillaExperience[],
  summary: string,
  certs: CertificationExtracted[],
  licenses: LicenseExtracted[]
): string[] {
  const strengths: string[] = [];
  const yachtCount = yachtExp.length;
  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));

  // Direct role match strengths
  if (candidatePosition.includes(requestedRole.split(' ')[0]) || requestedRole.includes(candidatePosition.split('/')[0])) {
    if (yearsExp >= 10) {
      strengths.push(`brings ${yearsExp}+ years of dedicated ${candidatePosition} experience`);
    } else if (yearsExp >= 5) {
      strengths.push(`has ${yearsExp} years specifically as a ${candidatePosition}`);
    }
  }

  // Yacht-specific strengths
  if (requestedRole.match(/deckhand|deck|bosun|captain|engineer|stew/)) {
    if (largestYacht >= 70) {
      strengths.push(`has proven themselves on large yachts up to ${Math.round(largestYacht)}m`);
    }
    if (yachtCount >= 4) {
      strengths.push(`brings diverse experience from ${yachtCount} different yachts`);
    }

    // License-based strengths
    const hasYachtmaster = licenses.some(l => l.name.toLowerCase().includes('yachtmaster'));
    if (hasYachtmaster && requestedRole.includes('deck')) {
      strengths.push('holds RYA Yachtmaster qualification');
    }
  }

  return strengths.slice(0, 2); // Max 2 to avoid overwhelming
}

// Fallback for when no specific matches found
function generateGeneralFitStatement(
  position: string,
  requestedRole: string,
  yearsExp: number,
  yachtCount: number,
  largestYacht: number
): string {
  if (position.includes(requestedRole.split(' ')[0]) || requestedRole.includes(position.split('/')[0])) {
    // Direct role match
    if (yearsExp >= 5) {
      return `With ${yearsExp} years as a ${position}, they bring the experience and reliability you need.`;
    }
    if (yachtCount >= 2) {
      return `Already working on their ${yachtCount === 2 ? 'second' : 'third'} yacht, they're building solid industry experience.`;
    }
    return `A dedicated ${position} with proven commitment to developing their career in the industry.`;
  }

  // Transferable skills
  if (yearsExp >= 8) {
    return `Their ${yearsExp}+ years of professional service experience translate well to your ${requestedRole} requirements.`;
  }
  return `Their background in ${position} provides relevant skills for your ${requestedRole} position.`;
}

function generateRoleMatchReason(
  candidatePosition: string,
  requestedRole: string,
  yearsExp: number,
  summary: string,
  yachtExp: YachtExperience[],
  villaExp: VillaExperience[]
): string {
  // Get yacht-specific details for more compelling copy
  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));
  const yachtCount = yachtExp.length;
  const hasCharterExp = summary.includes('charter');
  const hasPrivateExp = summary.includes('private');

  // Direct role match - with variety based on experience details
  if (candidatePosition.includes(requestedRole) || requestedRole.includes(candidatePosition.split('/')[0])) {
    if (yearsExp >= 10) {
      if (largestYacht >= 60) {
        return `A seasoned ${candidatePosition} with ${yearsExp}+ years and experience on vessels up to ${Math.round(largestYacht)}m - exactly the caliber needed for demanding yacht operations.`;
      }
      if (yachtCount >= 5) {
        return `With ${yearsExp}+ years across ${yachtCount} different yachts, they bring the adaptability and depth of knowledge essential for your ${requestedRole} position.`;
      }
      return `A highly experienced ${candidatePosition} with ${yearsExp}+ years - the maturity and expertise to excel in any yacht environment.`;
    }
    if (yearsExp >= 5) {
      if (hasCharterExp) {
        return `Their ${yearsExp} years of charter yacht experience means they understand guest expectations and high-pressure service delivery.`;
      }
      if (hasPrivateExp) {
        return `With ${yearsExp} years in private yacht service, they're accustomed to the discretion and consistency principals expect.`;
      }
      if (largestYacht >= 50) {
        return `Their ${yearsExp} years on superyachts up to ${Math.round(largestYacht)}m demonstrate readiness for professional-grade operations.`;
      }
      return `Their solid ${yearsExp}-year background as a ${candidatePosition} provides the reliability you need for your crew.`;
    }
    // Junior but still compelling
    if (yachtCount >= 3) {
      return `Though earlier in their career, they've already worked on ${yachtCount} yachts - showing strong commitment to the industry.`;
    }
    if (summary.includes('certif') || summary.includes('train')) {
      return `A motivated ${candidatePosition} with proper training and certifications, ready to grow with the right vessel.`;
    }
    return `An eager ${candidatePosition} with ${yearsExp} year${yearsExp === 1 ? '' : 's'} of hands-on experience and a passion for yachting.`;
  }

  // Transferable experience match
  const roleCategory = getRoleCategory(requestedRole);
  const candidateCategory = getRoleCategory(candidatePosition);

  if (roleCategory === candidateCategory) {
    return `Their background in ${candidatePosition} provides directly transferable skills for your ${requestedRole} position.`;
  }

  // Experience-based match
  if (yearsExp >= 10) {
    return `With ${yearsExp}+ years in private service, they bring mature expertise and proven reliability to your ${requestedRole} search.`;
  }

  // Property/vessel experience match
  if (villaExp.length >= 2 && (requestedRole.includes('estate') || requestedRole.includes('house') || requestedRole.includes('property'))) {
    return `Their experience managing ${villaExp.length} private properties demonstrates capability for your estate staffing needs.`;
  }

  if (yachtExp.length >= 2 && (summary.includes('interior') || summary.includes('service') || summary.includes('hospitality'))) {
    return `Their superyacht service background brings refined hospitality skills ideal for private household environments.`;
  }

  // Default
  return `Their private service background and professional training position them as a strong candidate for your ${requestedRole} needs.`;
}

function getRoleCategory(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('chef') || r.includes('cook') || r.includes('culinary')) return 'culinary';
  if (r.includes('butler') || r.includes('valet') || r.includes('steward')) return 'service';
  if (r.includes('nanny') || r.includes('governess') || r.includes('childcare')) return 'childcare';
  if (r.includes('housekeeper') || r.includes('maid') || r.includes('laundry')) return 'housekeeping';
  if (r.includes('estate') || r.includes('property') || r.includes('house manager')) return 'management';
  if (r.includes('driver') || r.includes('chauffeur')) return 'transport';
  if (r.includes('security') || r.includes('protection')) return 'security';
  return 'general';
}

function generateAvailabilityReason(
  availabilityStatus: string | null | undefined,
  requestedTimeline: string
): string | null {
  const status = (availabilityStatus || '').toLowerCase();

  if (requestedTimeline === 'asap') {
    if (status.includes('immediate') || status.includes('available')) {
      return 'They are available to start immediately, matching your urgent timeline.';
    }
  }

  if (requestedTimeline === '1-month' || requestedTimeline === 'within-month') {
    if (status.includes('immediate') || status.includes('available') || status.includes('notice')) {
      return 'Their availability aligns with your preferred start timeframe.';
    }
  }

  return null;
}

function generateSpecialFitReason(
  summary: string,
  requestedRole: string,
  location: string,
  langs: Array<{ language: string; proficiency: string }>,
  requirements: string
): string | null {
  const specialReasons: string[] = [];
  const reqLower = (requirements || '').toLowerCase();
  const locLower = (location || '').toLowerCase();

  // Check for language fit
  if (locLower.includes('france') || locLower.includes('monaco') || locLower.includes('paris')) {
    const speaksFrench = langs.some(l => l.language.toLowerCase() === 'french' && l.proficiency !== 'basic');
    if (speaksFrench) {
      specialReasons.push('Their French language skills are ideal for your location.');
    }
  }
  if (locLower.includes('spain') || locLower.includes('ibiza') || locLower.includes('mallorca')) {
    const speaksSpanish = langs.some(l => l.language.toLowerCase() === 'spanish' && l.proficiency !== 'basic');
    if (speaksSpanish) {
      specialReasons.push('Their Spanish language skills are valuable for your location.');
    }
  }
  if (locLower.includes('italy') || locLower.includes('sardinia') || locLower.includes('como')) {
    const speaksItalian = langs.some(l => l.language.toLowerCase() === 'italian' && l.proficiency !== 'basic');
    if (speaksItalian) {
      specialReasons.push('Their Italian language skills suit your location perfectly.');
    }
  }

  // Check for requirements match
  if (reqLower.includes('travel') && (summary.includes('travel') || summary.includes('rotation'))) {
    specialReasons.push('They have demonstrated flexibility for travel and rotational arrangements.');
  }
  if (reqLower.includes('family') && (summary.includes('family') || summary.includes('children'))) {
    specialReasons.push('Their experience with family environments shows appropriate discretion and adaptability.');
  }
  if (reqLower.includes('formal') && (summary.includes('formal') || summary.includes('protocol'))) {
    specialReasons.push('Their training in formal service protocols matches your requirements.');
  }
  if (reqLower.includes('discret') && summary.includes('discret')) {
    specialReasons.push('They have a proven track record of discretion with high-profile households.');
  }

  // Role-specific special fits
  if (requestedRole.includes('chef') && summary.includes('diet')) {
    specialReasons.push('Their experience with dietary requirements adds versatility to their culinary skills.');
  }
  if (requestedRole.includes('nanny') && summary.includes('education')) {
    specialReasons.push('Their educational background enriches their childcare approach.');
  }

  return specialReasons.length > 0 ? specialReasons[0] : null;
}

// ----------------------------------------------------------------------------
// EMPLOYEE QUALITIES - What makes them an exceptional employee
// ----------------------------------------------------------------------------

function extractEmployeeQualities(candidate: {
  profile_summary?: string | null;
  cv_skills?: string[] | null;
  years_experience?: number | null;
  yacht_experience_extracted?: YachtExperience[] | null;
  villa_experience_extracted?: VillaExperience[] | null;
  languages_extracted?: Array<{ language: string; proficiency: string }> | string[] | null;
  certifications_extracted?: CertificationExtracted[] | null;
}): string[] {
  // ONLY include evidence-based, quantifiable qualities - NO generic soft skills
  const qualities: string[] = [];
  const yearsExp = candidate.years_experience || 0;
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const langs = (candidate.languages_extracted || []) as Array<{ language: string; proficiency: string }>;
  const certs = (candidate.certifications_extracted || []) as CertificationExtracted[];

  // Calculate metrics
  const largestYacht = Math.max(0, ...yachtExp.map(y => y.yacht_size_meters || 0));
  const totalPositions = yachtExp.length + villaExp.length;
  const hasCharterExp = yachtExp.some(y => y.yacht_type?.toLowerCase().includes('charter'));
  const hasPrivateExp = yachtExp.some(y => y.yacht_type?.toLowerCase().includes('private'));

  // ONLY add qualities backed by specific evidence

  // Language skills (quantifiable)
  if (langs.length >= 3) {
    qualities.push(`Speaks ${langs.length} languages: ${langs.slice(0, 3).map(l => l.language).join(', ')}`);
  } else if (langs.length === 2) {
    qualities.push(`Bilingual: ${langs.map(l => l.language).join(' and ')}`);
  }

  // Large yacht experience (specific size)
  if (largestYacht >= 60) {
    qualities.push(`Large yacht experience up to ${Math.round(largestYacht)}m`);
  }

  // Experience type (specific)
  if (hasCharterExp && hasPrivateExp) {
    qualities.push('Both charter and private yacht experience');
  } else if (hasCharterExp) {
    qualities.push('Charter yacht background');
  }

  // Long tenure (quantifiable)
  if (yearsExp >= 10) {
    qualities.push(`${yearsExp}+ years in the industry`);
  }

  // Diverse experience (quantifiable)
  if (totalPositions >= 5) {
    qualities.push(`Experience across ${totalPositions} vessels`);
  }

  // Specific certifications beyond standard STCW/ENG1
  const specialCerts = certs.filter(c =>
    c.category === 'diving' ||
    c.category === 'wine' ||
    c.category === 'security' ||
    c.name.toLowerCase().includes('yachtmaster')
  );
  if (specialCerts.length > 0) {
    const certName = specialCerts[0].name;
    qualities.push(`Holds ${certName}`);
  }

  // Return only evidence-based qualities
  // NO generic fallbacks like "team player" or "strong work ethic"
  return qualities.slice(0, 3);
}

// ----------------------------------------------------------------------------
// LONGEVITY ASSESSMENT - Tenure history and reliability indicator
// ----------------------------------------------------------------------------

function generateLongevityFallback(candidate: {
  yacht_experience_extracted?: YachtExperience[] | null;
  villa_experience_extracted?: VillaExperience[] | null;
  years_experience?: number | null;
}): string {
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const yearsExp = candidate.years_experience || 0;

  // Calculate tenure metrics
  const allDurations = [
    ...yachtExp.map(y => y.duration_months || 0),
    ...villaExp.map(v => v.duration_months || 0),
  ].filter(d => d > 0);

  const totalPositions = allDurations.length;
  const avgTenureMonths = allDurations.length > 0
    ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length
    : 0;
  const longestTenure = allDurations.length > 0
    ? Math.max(...allDurations)
    : 0;

  const avgTenureYears = avgTenureMonths / 12;
  const longestYears = longestTenure / 12;

  // No work history data - provide general statement
  if (totalPositions === 0) {
    if (yearsExp >= 5) {
      return `Career history spanning ${yearsExp} years demonstrates sustained commitment to the industry.`;
    }
    return 'Professional history shows consistent engagement in the industry.';
  }

  // Single position - special case
  if (totalPositions === 1 && longestYears >= 1.5) {
    if (longestYears >= 3) {
      return `Demonstrates exceptional loyalty with ${longestYears.toFixed(1)} years in their most recent position - a strong indicator of stability and commitment.`;
    }
    return `Shows solid commitment with ${longestYears.toFixed(1)} years of tenure in their position.`;
  }

  // Multiple positions - analyze pattern HONESTLY
  const avgMonths = Math.round(avgTenureMonths);
  const longestMonths = Math.round(longestTenure);

  if (avgTenureMonths >= 24) {
    return `Strong retention with ${avgMonths} month average tenure across ${totalPositions} positions.`;
  }
  if (avgTenureMonths >= 18) {
    return `Solid stability with ${avgMonths} month average tenure across ${totalPositions} positions.`;
  }
  if (avgTenureMonths >= 12) {
    return `Average tenure of ${avgMonths} months across ${totalPositions} positions - typical for the yachting industry.`;
  }
  if (avgTenureMonths >= 6) {
    // Below average - be honest
    if (longestTenure >= 18) {
      return `Below-average tenure averaging ${avgMonths} months, though longest position was ${longestMonths} months.`;
    }
    return `Below-average tenure averaging ${avgMonths} months across ${totalPositions} positions.`;
  }

  // Very short tenure - be direct
  if (avgTenureMonths < 6 && avgTenureMonths > 0) {
    if (yearsExp >= 3) {
      return `Short tenure pattern averaging ${avgMonths} months per position despite ${yearsExp} years in the industry.`;
    }
    return `Short tenure averaging ${avgMonths} months across ${totalPositions} positions.`;
  }

  return `Career across ${totalPositions} positions with ${avgMonths} month average tenure.`;
}
