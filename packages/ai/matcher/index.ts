// ============================================================================
// LIGHTHOUSE CREW NETWORK - Production Matching Engine
// ============================================================================
// AI Sourcer: Multi-stage matching pipeline designed for yacht/villa crew recruitment
// NOT a generic vector search - domain-specific, explainable, accurate
//
// Seven-stage pipeline:
// 0. JOB BRIEF ANALYSIS (Claude Haiku) - Extract requirements from any format
// 1. BUILD EFFECTIVE FILTERS - Merge DB + extracted + override requirements
// 2. METADATA SEARCH WITH HARD FILTERS - SQL query with filters (efficient!)
// 2.5. NATIONALITY EXCLUSION FILTER - In-memory partial matching
// 3. VECTOR SEARCH (semantic ranking) - Rank filtered candidates by similarity
// 4. SCORING - 100 points across 6 weighted categories
// 4.5. COHERE RE-RANKING - Cross-attention rerank (top 50 → top 20)
// 5. AI RE-RANKING (Claude Sonnet 4.5) - Deep candidate evaluation
//
// Key optimization: Hard filters BEFORE semantic search (not after!)
// This avoids wasting compute on candidates that will be rejected anyway.
//
// Key features:
// - Nationality EXCLUSIONS as hard filters (applied early!)
// - Certification/visa filters in SQL for efficiency
// - Yacht size experience matching (scoring, not hard filter)
// - Specific skills matching (bartending, silver service, etc.)
// - Private notes integration for AI context
// - Cohere semantic reranking for accuracy before expensive AI assessment
// ============================================================================

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject, embed } from 'ai';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { analyzeJobBriefSafe, type ExtractedRequirements, type JobBriefInput } from './job-brief-analyzer';
import { rerankCandidatesForJob, type CandidateForRerank, type JobForRerank } from '../rerank';
import { normalizeLicenseValue } from '../cv-extraction';
import { inferPositionCategory } from './normalizers';

// ============================================================================
// TYPES
// ============================================================================

interface JobRequirements {
  // Hard requirements (binary pass/fail)
  certifications_required?: string[];
  visas_required?: string[];
  experience_years_min?: number;
  non_smoker?: boolean;
  no_visible_tattoos?: boolean;
  available_by?: string; // ISO date
  license_required?: string; // e.g., "OOW 3000gt", "Master 500gt", "Y4"

  // Soft requirements (weighted scoring)
  certifications_preferred?: string[];
  languages_required?: string[];
  languages_preferred?: string[];
  experience_years_ideal?: number;
  vessel_size_min?: number;
  vessel_size_max?: number;
  nationality_preferences?: string[];
  couple_acceptable?: boolean;
}

interface Job {
  id: string;
  title: string;
  public_title?: string;
  position_category: string;
  vessel_type?: string;
  vessel_size_meters?: number;
  vessel_name?: string;
  contract_type?: string;
  start_date?: string;
  end_date?: string;
  rotation_schedule?: string;
  primary_region?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  requirements: JobRequirements;
  requirements_text?: string;
  public_description?: string;
  private_notes?: string;
  is_urgent?: boolean;
  embedding?: number[];
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  primary_position?: string;
  secondary_positions?: string[];
  years_experience?: number;
  nationality?: string;
  second_nationality?: string;
  
  // Certifications
  has_stcw: boolean;
  stcw_expiry?: string;
  has_eng1: boolean;
  eng1_expiry?: string;
  highest_license?: string;
  certifications?: Array<{ name: string; expiry_date?: string }>;
  
  // Visas
  has_schengen: boolean;
  has_b1b2: boolean;
  has_c1d: boolean;
  other_visas?: string[];
  
  // Availability
  availability_status: 'available' | 'not_looking';
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
  
  // AI fields
  profile_summary?: string;
  bio?: string;
  embedding?: number[];
  
  // Work history (for AI evaluation)
  work_history?: Array<{
    position: string;
    vessel_name: string;
    vessel_size?: number;
    vessel_type?: string;
    start_date: string;
    end_date?: string;
    reason_for_leaving?: string;
  }>;
  
  // References
  references_count?: number;
  average_reference_rating?: number;
}

interface LegacyMatchResult {
  candidate: Candidate;

  // Scores (all 0-100)
  overall_score: number;
  hard_requirements_pass: boolean;
  qualification_score: number;
  experience_score: number;
  availability_score: number;
  preference_alignment_score: number;
  verification_score: number;

  // AI evaluation
  ai_assessment: {
    fit_score: number;
    strengths: string[];
    concerns: string[];
    red_flags: string[];
    summary: string;
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  };

  // Explainability
  score_breakdown: {
    category: string;
    score: number;
    max_score: number;
    details: string;
  }[];

  // Metadata
  match_confidence: 'high' | 'medium' | 'low';
  requires_human_review: boolean;
  review_reasons?: string[];
}

// ============================================================================
// LICENSE HIERARCHY FOR FILTERING
// ============================================================================

/**
 * Canonical license hierarchy for deck positions (higher index = higher qualification)
 */
const DECK_LICENSE_HIERARCHY = [
  'powerboat_level_2',
  'day_skipper',
  'coastal_skipper',
  'yachtmaster_coastal',
  'yachtmaster_offshore',
  'yachtmaster_ocean',
  'ow_500gt',
  'ow_3000gt',
  'ow_unlimited',
  'chief_mate_500gt',
  'chief_mate_3000gt',
  'chief_mate_unlimited',
  'master_200gt',
  'master_500gt',
  'master_3000gt',
  'master_unlimited',
] as const;

/**
 * Canonical license hierarchy for engineering positions (higher index = higher qualification)
 */
const ENGINEERING_LICENSE_HIERARCHY = [
  'aec',
  'meol',
  'y4',
  'y3',
  'y2',
  'y1',
  'eoow',
  'third_engineer',
  'second_engineer_3000kw',
  'second_engineer_unlimited',
  'chief_engineer_3000kw',
  'chief_engineer_9000kw',
  'chief_engineer_unlimited',
] as const;

/**
 * Check if a candidate's license meets or exceeds the required license level
 * Uses license hierarchy to determine if candidate is qualified
 */
function licenseMeetsRequirement(
  candidateLicense: string | null,
  requiredLicense: string
): boolean {
  if (!candidateLicense) return false;

  // Exact match
  if (candidateLicense === requiredLicense) return true;

  // Check deck hierarchy
  const requiredDeckIndex = DECK_LICENSE_HIERARCHY.indexOf(requiredLicense as typeof DECK_LICENSE_HIERARCHY[number]);
  if (requiredDeckIndex >= 0) {
    const candidateDeckIndex = DECK_LICENSE_HIERARCHY.indexOf(candidateLicense as typeof DECK_LICENSE_HIERARCHY[number]);
    return candidateDeckIndex >= requiredDeckIndex;
  }

  // Check engineering hierarchy
  const requiredEngIndex = ENGINEERING_LICENSE_HIERARCHY.indexOf(requiredLicense as typeof ENGINEERING_LICENSE_HIERARCHY[number]);
  if (requiredEngIndex >= 0) {
    const candidateEngIndex = ENGINEERING_LICENSE_HIERARCHY.indexOf(candidateLicense as typeof ENGINEERING_LICENSE_HIERARCHY[number]);
    return candidateEngIndex >= requiredEngIndex;
  }

  // Not in hierarchy - exact match only
  return candidateLicense === requiredLicense;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Stage 1: Vector search
  vector_search_limit: 100,
  vector_similarity_threshold: 0.3, // Low threshold - we filter later

  // Stage 2: Hard filters
  // (no config - binary pass/fail)

  // Stage 3: Scoring weights (must sum to 100)
  weights: {
    qualification: 25,      // Certs, licenses
    experience: 25,         // Years, vessel size, quality
    availability: 15,       // When they can start
    preference_alignment: 15, // Do they WANT this job?
    verification: 10,       // Trust level
    ai_assessment: 10,      // Claude's judgment
  },

  // Stage 4.5: Cohere semantic reranking
  // Takes top 50 from scoring, narrows to best 20 using cross-attention
  cohere_rerank_input_limit: 50,  // How many candidates to send to Cohere
  cohere_rerank_output_limit: 20, // How many to keep after Cohere rerank

  // Stage 5: AI re-ranking (Claude)
  ai_rerank_limit: 15, // How many to send to Claude for deep assessment

  // Output
  final_results_limit: 10,

  // Confidence thresholds
  high_confidence_threshold: 80,
  low_confidence_threshold: 60,
};

// ============================================================================
// STAGE 1: CANDIDATE RETRIEVAL
// ============================================================================

/**
 * Build a structured embedding text for a job
 * This is NOT raw text - it's a structured representation
 */
function buildJobEmbeddingText(job: Job): string {
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
  
  // Contract
  if (job.contract_type) {
    parts.push(`CONTRACT: ${job.contract_type}`);
  }
  
  // Location
  if (job.primary_region) {
    parts.push(`REGION: ${job.primary_region}`);
  }
  
  // Requirements - structured, not prose
  const req = job.requirements;
  if (req.experience_years_min) {
    parts.push(`EXPERIENCE REQUIRED: ${req.experience_years_min}+ years`);
  }
  if (req.certifications_required?.length) {
    parts.push(`CERTIFICATIONS REQUIRED: ${req.certifications_required.join(', ')}`);
  }
  if (req.languages_required?.length) {
    parts.push(`LANGUAGES REQUIRED: ${req.languages_required.join(', ')}`);
  }
  if (req.non_smoker) {
    parts.push(`NON-SMOKER: Required`);
  }
  if (req.no_visible_tattoos) {
    parts.push(`NO VISIBLE TATTOOS: Required`);
  }
  
  return parts.join('\n');
}

/**
 * Build a structured embedding text for a candidate
 */
function buildCandidateEmbeddingText(candidate: Candidate): string {
  const parts: string[] = [];
  
  // Position
  parts.push(`POSITION: ${candidate.primary_position || 'Not specified'}`);
  if (candidate.secondary_positions?.length) {
    parts.push(`ALSO QUALIFIED: ${candidate.secondary_positions.join(', ')}`);
  }
  
  // Experience
  if (candidate.years_experience) {
    parts.push(`EXPERIENCE: ${candidate.years_experience} years`);
  }
  
  // Vessel preferences
  if (candidate.preferred_yacht_types?.length) {
    parts.push(`VESSEL TYPES: ${candidate.preferred_yacht_types.join(', ')}`);
  }
  if (candidate.preferred_yacht_size_min || candidate.preferred_yacht_size_max) {
    const min = candidate.preferred_yacht_size_min || 0;
    const max = candidate.preferred_yacht_size_max || '∞';
    parts.push(`VESSEL SIZE: ${min}m - ${max}m`);
  }
  
  // Certifications
  const certs: string[] = [];
  if (candidate.has_stcw) certs.push('STCW');
  if (candidate.has_eng1) certs.push('ENG1');
  if (candidate.highest_license) certs.push(candidate.highest_license);
  if (certs.length) {
    parts.push(`CERTIFICATIONS: ${certs.join(', ')}`);
  }
  
  // Visas
  const visas: string[] = [];
  if (candidate.has_schengen) visas.push('Schengen');
  if (candidate.has_b1b2) visas.push('B1/B2');
  if (candidate.has_c1d) visas.push('C1/D');
  if (visas.length) {
    parts.push(`VISAS: ${visas.join(', ')}`);
  }
  
  // Location preferences
  if (candidate.preferred_regions?.length) {
    parts.push(`REGIONS: ${candidate.preferred_regions.join(', ')}`);
  }
  
  // Contract preferences
  if (candidate.preferred_contract_types?.length) {
    parts.push(`CONTRACT PREFERENCE: ${candidate.preferred_contract_types.join(', ')}`);
  }
  
  // Personal
  if (candidate.is_smoker === false) {
    parts.push(`NON-SMOKER: Yes`);
  }
  if (candidate.has_visible_tattoos === false) {
    parts.push(`NO VISIBLE TATTOOS: Yes`);
  }
  if (candidate.is_couple) {
    parts.push(`COUPLE: Yes, partner is ${candidate.partner_position}`);
  }
  
  // Nationality
  if (candidate.nationality) {
    parts.push(`NATIONALITY: ${candidate.nationality}`);
  }
  
  return parts.join('\n');
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

/**
 * Stage 1: Retrieve candidates using vector similarity
 * This is intentionally broad - we filter in later stages
 */
async function retrieveCandidates(
  supabase: SupabaseClient,
  job: Job,
  jobEmbedding: number[]
): Promise<Candidate[]> {
  
  const { data, error } = await supabase.rpc('match_candidates_broad', {
    query_embedding: jobEmbedding,
    match_threshold: CONFIG.vector_similarity_threshold,
    match_count: CONFIG.vector_search_limit,
    position_category: job.position_category,
  });
  
  if (error) {
    console.error('Vector search error:', error);
    throw new Error(`Candidate retrieval failed: ${error.message}`);
  }
  
  return data || [];
}

// ============================================================================
// STAGE 2: HARD FILTERS
// ============================================================================

interface FilterResult {
  passed: boolean;
  failed_reasons: string[];
}

/**
 * Stage 2: Apply hard filters
 * These are binary pass/fail - no exceptions
 */
function applyHardFilters(candidate: Candidate, job: Job): FilterResult {
  const failed_reasons: string[] = [];
  const req = job.requirements;
  
  // 1. Required certifications
  if (req.certifications_required?.length) {
    for (const cert of req.certifications_required) {
      const certUpper = cert.toUpperCase();
      
      if (certUpper === 'STCW' && !candidate.has_stcw) {
        failed_reasons.push('Missing required STCW certification');
      } else if (certUpper === 'STCW' && candidate.stcw_expiry) {
        const expiry = new Date(candidate.stcw_expiry);
        const startDate = job.start_date ? new Date(job.start_date) : new Date();
        if (expiry < startDate) {
          failed_reasons.push('STCW certification expires before start date');
        }
      }
      
      if (certUpper === 'ENG1' && !candidate.has_eng1) {
        failed_reasons.push('Missing required ENG1 medical certificate');
      } else if (certUpper === 'ENG1' && candidate.eng1_expiry) {
        const expiry = new Date(candidate.eng1_expiry);
        const startDate = job.start_date ? new Date(job.start_date) : new Date();
        if (expiry < startDate) {
          failed_reasons.push('ENG1 medical expires before start date');
        }
      }
      
      // Check other certifications
      if (!['STCW', 'ENG1'].includes(certUpper)) {
        const hasCert = candidate.certifications?.some(
          c => c.name.toUpperCase().includes(certUpper)
        );
        if (!hasCert) {
          failed_reasons.push(`Missing required certification: ${cert}`);
        }
      }
    }
  }
  
  // 2. Required visas
  if (req.visas_required?.length) {
    for (const visa of req.visas_required) {
      const visaUpper = visa.toUpperCase();
      
      if (visaUpper.includes('SCHENGEN') && !candidate.has_schengen) {
        failed_reasons.push('Missing required Schengen visa');
      }
      if ((visaUpper.includes('B1') || visaUpper.includes('B2')) && !candidate.has_b1b2) {
        failed_reasons.push('Missing required B1/B2 visa');
      }
      if (visaUpper.includes('C1D') && !candidate.has_c1d) {
        failed_reasons.push('Missing required C1/D visa');
      }
    }
  }
  
  // 3. Minimum experience
  if (req.experience_years_min) {
    if (!candidate.years_experience || candidate.years_experience < req.experience_years_min) {
      failed_reasons.push(
        `Insufficient experience: ${candidate.years_experience || 0} years vs ${req.experience_years_min} required`
      );
    }
  }
  
  // 4. Non-smoker requirement
  if (req.non_smoker === true && candidate.is_smoker === true) {
    failed_reasons.push('Smoker - position requires non-smoker');
  }
  
  // 5. No visible tattoos requirement
  if (req.no_visible_tattoos === true && candidate.has_visible_tattoos === true) {
    failed_reasons.push('Has visible tattoos - position requires none');
  }
  
  // 6. Availability date
  if (req.available_by && candidate.available_from) {
    const requiredBy = new Date(req.available_by);
    const availableFrom = new Date(candidate.available_from);
    if (availableFrom > requiredBy) {
      failed_reasons.push(
        `Not available until ${candidate.available_from} - position needs by ${req.available_by}`
      );
    }
  }
  
  // 7. Couple restriction
  if (req.couple_acceptable === false && candidate.is_couple) {
    failed_reasons.push('Couple - position does not accept couples');
  }
  
  // 8. Availability status
  if (candidate.availability_status === 'not_looking') {
    failed_reasons.push('Candidate not currently looking');
  }
  
  return {
    passed: failed_reasons.length === 0,
    failed_reasons,
  };
}

// ============================================================================
// STAGE 3: SCORING
// ============================================================================

interface ScoreBreakdown {
  category: string;
  score: number;
  max_score: number;
  details: string;
}

interface ScoringResult {
  total_score: number;
  breakdown: ScoreBreakdown[];
}

/**
 * Stage 3: Calculate weighted scores for each candidate
 */
function calculateScores(candidate: Candidate, job: Job): ScoringResult {
  const breakdown: ScoreBreakdown[] = [];
  const req = job.requirements;
  
  // ---- QUALIFICATION SCORE (25 points) ----
  let qualScore = 0;
  const qualDetails: string[] = [];
  
  // Has STCW (5 points)
  if (candidate.has_stcw) {
    qualScore += 5;
    qualDetails.push('STCW ✓');
  }
  
  // Has ENG1 (5 points)
  if (candidate.has_eng1) {
    qualScore += 5;
    qualDetails.push('ENG1 ✓');
  }
  
  // Has relevant license (5 points)
  if (candidate.highest_license) {
    qualScore += 5;
    qualDetails.push(`License: ${candidate.highest_license}`);
  }
  
  // Preferred certifications (up to 5 points)
  if (req.certifications_preferred?.length && candidate.certifications) {
    const matchCount = req.certifications_preferred.filter(pc =>
      candidate.certifications!.some(cc => 
        cc.name.toUpperCase().includes(pc.toUpperCase())
      )
    ).length;
    const prefCertScore = Math.min(5, matchCount * 2);
    qualScore += prefCertScore;
    if (matchCount > 0) {
      qualDetails.push(`${matchCount} preferred certs`);
    }
  }
  
  // Required languages (up to 5 points)
  // (Would need language field on candidate - placeholder)
  qualScore += 5; // Assume pass for now
  
  breakdown.push({
    category: 'Qualifications',
    score: qualScore,
    max_score: CONFIG.weights.qualification,
    details: qualDetails.join(', ') || 'Basic qualifications',
  });
  
  // ---- EXPERIENCE SCORE (25 points) ----
  let expScore = 0;
  const expDetails: string[] = [];
  
  // Years of experience (up to 10 points)
  const yearsExp = candidate.years_experience || 0;
  const idealYears = req.experience_years_ideal || req.experience_years_min || 3;
  if (yearsExp >= idealYears + 3) {
    expScore += 10;
    expDetails.push(`${yearsExp} years (exceeds ideal)`);
  } else if (yearsExp >= idealYears) {
    expScore += 8;
    expDetails.push(`${yearsExp} years (meets ideal)`);
  } else if (yearsExp >= (req.experience_years_min || 0)) {
    expScore += 5;
    expDetails.push(`${yearsExp} years (meets minimum)`);
  }
  
  // Vessel size experience (up to 10 points)
  const jobSize = job.vessel_size_meters || 0;
  const candSizeMax = candidate.preferred_yacht_size_max || 100;
  const candSizeMin = candidate.preferred_yacht_size_min || 0;
  
  if (jobSize <= candSizeMax && jobSize >= candSizeMin) {
    expScore += 10;
    expDetails.push(`Size experience matches (${candSizeMin}-${candSizeMax}m)`);
  } else if (jobSize <= candSizeMax + 10) {
    expScore += 6;
    expDetails.push(`Size slightly below experience`);
  } else {
    expScore += 3;
    expDetails.push(`Size gap (job: ${jobSize}m)`);
  }
  
  // Verification tier bonus (up to 5 points)
  const tierBonus = {
    basic: 0,
    identity: 2,
    verified: 4,
    premium: 5,
  };
  expScore += tierBonus[candidate.verification_tier];
  if (candidate.verification_tier !== 'basic') {
    expDetails.push(`${candidate.verification_tier} verified`);
  }
  
  breakdown.push({
    category: 'Experience',
    score: expScore,
    max_score: CONFIG.weights.experience,
    details: expDetails.join(', ') || 'Experience evaluated',
  });
  
  // ---- AVAILABILITY SCORE (15 points) ----
  let availScore = 0;
  const availDetails: string[] = [];

  // Availability status
  if (candidate.availability_status === 'available') {
    availScore += 10;
    availDetails.push('Available now');
  }
  // 'not_looking' gets 0 points - they're not actively seeking
  
  // Start date alignment (up to 5 points)
  if (job.start_date && candidate.available_from) {
    const jobStart = new Date(job.start_date);
    const candAvail = new Date(candidate.available_from);
    const daysUntilStart = Math.ceil((jobStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const daysUntilAvail = Math.ceil((candAvail.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (candAvail <= jobStart) {
      availScore += 5;
      availDetails.push('Available before start date');
    } else if (daysUntilAvail <= daysUntilStart + 14) {
      availScore += 3;
      availDetails.push('Available within 2 weeks of start');
    }
  } else if (candidate.availability_status === 'available') {
    availScore += 5;
    availDetails.push('Immediately available');
  }
  
  breakdown.push({
    category: 'Availability',
    score: availScore,
    max_score: CONFIG.weights.availability,
    details: availDetails.join(', ') || 'Availability checked',
  });
  
  // ---- PREFERENCE ALIGNMENT SCORE (15 points) ----
  let prefScore = 0;
  const prefDetails: string[] = [];
  
  // Region match (up to 5 points)
  if (job.primary_region && candidate.preferred_regions?.length) {
    const regionMatch = candidate.preferred_regions.some(r =>
      r.toLowerCase().includes(job.primary_region!.toLowerCase()) ||
      job.primary_region!.toLowerCase().includes(r.toLowerCase())
    );
    if (regionMatch) {
      prefScore += 5;
      prefDetails.push('Region preference match');
    }
  } else {
    prefScore += 3; // Neutral
  }
  
  // Contract type match (up to 5 points)
  if (job.contract_type && candidate.preferred_contract_types?.length) {
    const contractMatch = candidate.preferred_contract_types.some(c =>
      c.toLowerCase() === job.contract_type!.toLowerCase()
    );
    if (contractMatch) {
      prefScore += 5;
      prefDetails.push('Contract type match');
    }
  } else {
    prefScore += 3; // Neutral
  }
  
  // Salary expectation alignment (up to 5 points)
  if (job.salary_min && candidate.desired_salary_min) {
    if (job.salary_min >= candidate.desired_salary_min) {
      prefScore += 5;
      prefDetails.push('Salary meets expectation');
    } else if (job.salary_min >= candidate.desired_salary_min * 0.9) {
      prefScore += 3;
      prefDetails.push('Salary close to expectation');
    } else {
      prefDetails.push('Salary below expectation');
    }
  } else {
    prefScore += 3; // Neutral
  }
  
  breakdown.push({
    category: 'Preference Alignment',
    score: prefScore,
    max_score: CONFIG.weights.preference_alignment,
    details: prefDetails.join(', ') || 'Preferences evaluated',
  });
  
  // ---- VERIFICATION SCORE (10 points) ----
  let verifyScore = 0;
  const verifyDetails: string[] = [];
  
  const tierScores = {
    basic: 2,
    identity: 5,
    verified: 8,
    premium: 10,
  };
  verifyScore = tierScores[candidate.verification_tier];
  verifyDetails.push(`Tier: ${candidate.verification_tier}`);
  
  // Reference bonus
  if (candidate.references_count && candidate.references_count >= 2) {
    verifyScore = Math.min(10, verifyScore + 2);
    verifyDetails.push(`${candidate.references_count} references`);
  }
  
  breakdown.push({
    category: 'Verification',
    score: verifyScore,
    max_score: CONFIG.weights.verification,
    details: verifyDetails.join(', '),
  });
  
  // Calculate total (AI assessment added later)
  const totalBeforeAI = breakdown.reduce((sum, b) => sum + b.score, 0);
  
  return {
    total_score: totalBeforeAI,
    breakdown,
  };
}

// ============================================================================
// STAGE 4: AI RE-RANKING
// ============================================================================

const aiAssessmentSchema = z.object({
  candidates: z.array(z.object({
    candidate_id: z.string(),
    fit_score: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    concerns: z.array(z.string()),
    red_flags: z.array(z.string()),
    summary: z.string(),
    recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']),
  })),
});

/**
 * Stage 4: AI assessment for nuanced evaluation
 */
async function getAIAssessments(
  candidates: Array<Candidate & { preliminary_score: number }>,
  job: Job
): Promise<Map<string, z.infer<typeof aiAssessmentSchema>['candidates'][0]>> {
  
  // Build detailed job context
  const jobContext = `
POSITION: ${job.title}
VESSEL: ${job.vessel_type || 'Not specified'} ${job.vessel_size_meters ? `(${job.vessel_size_meters}m)` : ''}
${job.vessel_name ? `VESSEL NAME: ${job.vessel_name}` : ''}
CONTRACT: ${job.contract_type || 'Not specified'}
START DATE: ${job.start_date || 'ASAP'}
REGION: ${job.primary_region || 'Not specified'}
SALARY: ${job.salary_min ? `€${job.salary_min}` : '?'} - ${job.salary_max ? `€${job.salary_max}` : '?'}/month

REQUIREMENTS:
${job.requirements_text || JSON.stringify(job.requirements, null, 2)}
`.trim();

  // Build candidate summaries
  const candidateSummaries = candidates.map((c, i) => `
[CANDIDATE ${i + 1}]
ID: ${c.id}
Name: ${c.first_name} ${c.last_name?.charAt(0) || ''}.
Position: ${c.primary_position || 'Not specified'}
Experience: ${c.years_experience || '?'} years
Verification: ${c.verification_tier}
Availability: ${c.availability_status}${c.available_from ? ` (from ${c.available_from})` : ''}
Preliminary Score: ${c.preliminary_score}/90

CERTIFICATIONS: ${[
  c.has_stcw ? 'STCW' : null,
  c.has_eng1 ? 'ENG1' : null,
  c.highest_license,
].filter(Boolean).join(', ') || 'None listed'}

VISAS: ${[
  c.has_schengen ? 'Schengen' : null,
  c.has_b1b2 ? 'B1/B2' : null,
  c.has_c1d ? 'C1/D' : null,
].filter(Boolean).join(', ') || 'None listed'}

PREFERENCES:
- Yacht size: ${c.preferred_yacht_size_min || '?'}m - ${c.preferred_yacht_size_max || '?'}m
- Regions: ${c.preferred_regions?.join(', ') || 'Any'}
- Contract: ${c.preferred_contract_types?.join(', ') || 'Any'}
- Salary: €${c.desired_salary_min || '?'} - €${c.desired_salary_max || '?'}

PERSONAL:
- Smoker: ${c.is_smoker === false ? 'No' : c.is_smoker === true ? 'Yes' : 'Unknown'}
- Visible tattoos: ${c.has_visible_tattoos === false ? 'No' : c.has_visible_tattoos === true ? 'Yes' : 'Unknown'}
- Couple: ${c.is_couple ? `Yes (partner: ${c.partner_position})` : 'No'}
- Nationality: ${c.nationality || 'Unknown'}

WORK HISTORY:
${c.work_history?.map(w => 
  `- ${w.position} on ${w.vessel_name} (${w.vessel_size || '?'}m ${w.vessel_type || ''}) ${w.start_date} - ${w.end_date || 'present'}`
).join('\n') || 'Not available'}

REFERENCES: ${c.references_count || 0} on file${c.average_reference_rating ? `, avg rating: ${c.average_reference_rating}/5` : ''}

PROFILE SUMMARY:
${c.profile_summary || 'No summary available'}
`.trim()).join('\n\n---\n\n');

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: aiAssessmentSchema,
    system: `You are an expert yacht crew recruitment consultant with 20 years of experience placing crew on luxury vessels worldwide.

Your job is to evaluate candidates for a specific position. You understand:
- The nuances of different yacht types (private vs charter, motor vs sail)
- How vessel size affects role complexity
- Red flags in work history (short tenures, gaps, lateral moves)
- The importance of cultural fit in confined yacht environments
- Reference quality and verification significance

BE RIGOROUS AND HONEST:
- A 90+ fit score should be exceptional (1 in 10 candidates)
- A 70-80 is a "solid candidate with minor gaps"
- Below 60 means significant concerns
- Point out red flags even if candidate otherwise looks good
- Consider what's NOT in the profile (missing info is concerning)

EVALUATE:
1. Quality of experience (not just years - WHERE did they work?)
2. Career trajectory (growing? stagnant? declining?)
3. Stability (job hopping is a red flag in yachting)
4. Verification level (premium verified = much more trustworthy)
5. Preference alignment (do they WANT this job or is it a fallback?)
6. Any red flags or concerns`,
    
    prompt: `Evaluate these candidates for the following position:

${jobContext}

---

CANDIDATES TO EVALUATE:

${candidateSummaries}

---

For each candidate, provide:
1. fit_score: 0-100 (be rigorous - 90+ is rare)
2. strengths: Specific things that make them a good fit (with evidence)
3. concerns: Things that give you pause (be specific)
4. red_flags: Serious issues that might disqualify them (empty array if none)
5. summary: One sentence assessment
6. recommendation: strong_yes / yes / maybe / no / strong_no

Return assessments for ALL candidates, ordered by fit_score descending.`,
  });

  // Convert to map for easy lookup
  const assessmentMap = new Map<string, typeof object.candidates[0]>();
  for (const assessment of object.candidates) {
    assessmentMap.set(assessment.candidate_id, assessment);
  }
  
  return assessmentMap;
}

// ============================================================================
// MAIN MATCHING FUNCTION
// ============================================================================

export interface MatchingOptions {
  job: Job;
  limit?: number;
  include_ai_assessment?: boolean;
  verification_tiers?: Array<'basic' | 'identity' | 'verified' | 'premium'>;
  exclude_candidate_ids?: string[];
}

export interface MatchingResult {
  matches: LegacyMatchResult[];
  metadata: {
    job_id: string;
    candidates_retrieved: number;
    candidates_after_filters: number;
    candidates_scored: number;
    candidates_ai_evaluated: number;
    candidates_returned: number;
    processing_time_ms: number;
    stages: {
      retrieval_ms: number;
      filtering_ms: number;
      scoring_ms: number;
      ai_assessment_ms: number;
    };
  };
}

export async function findMatchingCandidates(
  supabase: SupabaseClient,
  options: MatchingOptions
): Promise<MatchingResult> {
  const startTime = Date.now();
  const stageTimes = {
    retrieval_ms: 0,
    filtering_ms: 0,
    scoring_ms: 0,
    ai_assessment_ms: 0,
  };
  
  const { job, limit = CONFIG.final_results_limit, include_ai_assessment = true } = options;
  
  // ============ STAGE 1: RETRIEVAL ============
  const retrievalStart = Date.now();
  
  // Generate job embedding
  const jobEmbeddingText = buildJobEmbeddingText(job);
  const jobEmbedding = await generateEmbedding(jobEmbeddingText);
  
  // Retrieve candidates via vector search
  let candidates = await retrieveCandidates(supabase, job, jobEmbedding);
  
  stageTimes.retrieval_ms = Date.now() - retrievalStart;
  const candidatesRetrieved = candidates.length;
  
  console.log(`Stage 1: Retrieved ${candidates.length} candidates`);
  
  // ============ STAGE 2: HARD FILTERS ============
  const filterStart = Date.now();
  
  const filteredCandidates: Array<Candidate & { filter_result: FilterResult }> = [];
  
  for (const candidate of candidates) {
    // Skip excluded candidates
    if (options.exclude_candidate_ids?.includes(candidate.id)) {
      continue;
    }
    
    // Skip if verification tier not in allowed list
    if (options.verification_tiers && !options.verification_tiers.includes(candidate.verification_tier)) {
      continue;
    }
    
    const filterResult = applyHardFilters(candidate, job);
    
    if (filterResult.passed) {
      filteredCandidates.push({ ...candidate, filter_result: filterResult });
    }
  }
  
  stageTimes.filtering_ms = Date.now() - filterStart;
  const candidatesAfterFilters = filteredCandidates.length;
  
  console.log(`Stage 2: ${filteredCandidates.length} candidates passed hard filters`);
  
  // ============ STAGE 3: SCORING ============
  const scoringStart = Date.now();
  
  const scoredCandidates: Array<Candidate & {
    filter_result: FilterResult;
    scoring_result: ScoringResult;
    preliminary_score: number;
  }> = [];
  
  for (const candidate of filteredCandidates) {
    const scoringResult = calculateScores(candidate, job);
    scoredCandidates.push({
      ...candidate,
      scoring_result: scoringResult,
      preliminary_score: scoringResult.total_score,
    });
  }
  
  // Sort by preliminary score
  scoredCandidates.sort((a, b) => b.preliminary_score - a.preliminary_score);
  
  // Take top candidates for AI assessment
  const topCandidates = scoredCandidates.slice(0, CONFIG.ai_rerank_limit);
  
  stageTimes.scoring_ms = Date.now() - scoringStart;
  
  console.log(`Stage 3: Scored ${scoredCandidates.length} candidates, top score: ${topCandidates[0]?.preliminary_score || 0}`);
  
  // ============ STAGE 4: AI ASSESSMENT ============
  const aiStart = Date.now();
  
  let aiAssessments = new Map<string, z.infer<typeof aiAssessmentSchema>['candidates'][0]>();
  
  if (include_ai_assessment && topCandidates.length > 0) {
    try {
      aiAssessments = await getAIAssessments(topCandidates, job);
      console.log(`Stage 4: AI assessed ${aiAssessments.size} candidates`);
    } catch (error) {
      console.error('AI assessment failed:', error);
      // Continue without AI assessments
    }
  }
  
  stageTimes.ai_assessment_ms = Date.now() - aiStart;
  
  // ============ BUILD FINAL RESULTS ============
  const results: LegacyMatchResult[] = [];
  
  for (const candidate of topCandidates) {
    const aiAssessment = aiAssessments.get(candidate.id);
    
    // Calculate final score (add AI component if available)
    let aiScore = 0;
    if (aiAssessment) {
      // Convert fit_score (0-100) to our weight (0-10)
      aiScore = Math.round(aiAssessment.fit_score / 10);
    } else {
      // Default AI score based on preliminary
      aiScore = Math.round(candidate.preliminary_score / 9);
    }
    
    // Add AI score to breakdown
    const breakdown = [...candidate.scoring_result.breakdown];
    breakdown.push({
      category: 'AI Assessment',
      score: aiScore,
      max_score: CONFIG.weights.ai_assessment,
      details: aiAssessment?.summary || 'AI assessment not available',
    });
    
    const totalScore = candidate.preliminary_score + aiScore;
    
    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (totalScore >= CONFIG.high_confidence_threshold && aiAssessment?.recommendation !== 'no') {
      confidence = 'high';
    } else if (totalScore < CONFIG.low_confidence_threshold || aiAssessment?.red_flags?.length) {
      confidence = 'low';
    }
    
    // Determine if human review needed
    const requiresReview = 
      confidence === 'low' ||
      (aiAssessment?.red_flags?.length || 0) > 0 ||
      (aiAssessment?.recommendation === 'maybe');
    
    const reviewReasons: string[] = [];
    if (confidence === 'low') reviewReasons.push('Low confidence score');
    if (aiAssessment?.red_flags?.length) reviewReasons.push('AI flagged concerns');
    if (aiAssessment?.recommendation === 'maybe') reviewReasons.push('AI uncertain');
    
    results.push({
      candidate,
      overall_score: totalScore,
      hard_requirements_pass: true, // Already filtered
      qualification_score: breakdown.find(b => b.category === 'Qualifications')?.score || 0,
      experience_score: breakdown.find(b => b.category === 'Experience')?.score || 0,
      availability_score: breakdown.find(b => b.category === 'Availability')?.score || 0,
      preference_alignment_score: breakdown.find(b => b.category === 'Preference Alignment')?.score || 0,
      verification_score: breakdown.find(b => b.category === 'Verification')?.score || 0,
      ai_assessment: {
        fit_score: aiAssessment?.fit_score ?? aiScore * 10,
        strengths: aiAssessment?.strengths ?? [],
        concerns: aiAssessment?.concerns ?? [],
        red_flags: aiAssessment?.red_flags ?? [],
        summary: aiAssessment?.summary ?? 'AI assessment not available',
        recommendation: aiAssessment?.recommendation ?? 'maybe',
      },
      score_breakdown: breakdown,
      match_confidence: confidence,
      requires_human_review: requiresReview,
      review_reasons: reviewReasons.length > 0 ? reviewReasons : undefined,
    });
  }
  
  // Final sort by overall score
  results.sort((a, b) => b.overall_score - a.overall_score);
  
  // Take requested limit
  const finalResults = results.slice(0, limit);
  
  const endTime = Date.now();
  
  return {
    matches: finalResults,
    metadata: {
      job_id: job.id,
      candidates_retrieved: candidatesRetrieved,
      candidates_after_filters: candidatesAfterFilters,
      candidates_scored: scoredCandidates.length,
      candidates_ai_evaluated: aiAssessments.size,
      candidates_returned: finalResults.length,
      processing_time_ms: endTime - startTime,
      stages: stageTimes,
    },
  };
}

// ============================================================================
// DATABASE FUNCTION (add to migrations)
// ============================================================================

/*
-- Add this function to your Supabase database for Stage 1

CREATE OR REPLACE FUNCTION match_candidates_broad(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 100,
  position_category TEXT DEFAULT NULL
)
RETURNS SETOF candidates AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM candidates c
  WHERE 
    c.embedding IS NOT NULL
    AND c.deleted_at IS NULL
    AND c.availability_status != 'unavailable'
    AND (position_category IS NULL OR c.position_category::TEXT = position_category)
    AND 1 - (c.embedding <=> query_embedding) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
*/

// ============================================================================
// NEW SIMPLIFIED API - matchCandidatesForJob
// ============================================================================

/**
 * MatchResult - The standardized return type for candidate matching
 */
export interface MatchResult {
  candidateId: string;
  candidate: Candidate;
  score: number;
  breakdown: {
    qualifications: number;
    experience: number;
    availability: number;
    preferences: number;
    verification: number;
    aiAssessment: number;
  };
  strengths: string[];
  concerns: string[];
  aiSummary: string;
}

export interface MatchCandidatesOptions {
  limit?: number;
  /** Private recruiter notes for AI context (NEVER expose to clients) */
  privateNotes?: string;
  /** Raw brief text - for when the user just pastes in an email or brief */
  rawBrief?: string;
  /** Override hard filters from job.requirements */
  hardFilterOverrides?: {
    requireSTCW?: boolean;
    requireENG1?: boolean;
    visasRequired?: string[];
    minExperience?: number;
    availableBy?: string;
    /** Nationalities to EXCLUDE (hard filter) */
    excludeNationalities?: string[];
    /** Minimum yacht size experience required */
    minYachtSizeExperience?: number;
    /** Required skills (will be checked against bio/profile) */
    requiredSkills?: string[];
    /** Required license (e.g., "OOW 3000gt", "Master 500gt", "Y4") */
    requiredLicense?: string;
  };
  /** Skip AI job brief analysis (use structured data only) */
  skipBriefAnalysis?: boolean;
}

/**
 * Visa requirements based on cruising area
 */
const REGION_VISA_REQUIREMENTS: Record<string, string[]> = {
  'mediterranean': ['Schengen'],
  'caribbean': ['B1/B2', 'C1/D'],
  'usa': ['B1/B2', 'C1/D'],
  'bahamas': ['B1/B2'],
  'florida': ['B1/B2', 'C1/D'],
  'new england': ['B1/B2', 'C1/D'],
  'europe': ['Schengen'],
  'global': [],
};

/**
 * Get required visas for a region
 */
function getVisasForRegion(region: string | null | undefined): string[] {
  if (!region) return [];
  const lowerRegion = region.toLowerCase();
  for (const [key, visas] of Object.entries(REGION_VISA_REQUIREMENTS)) {
    if (lowerRegion.includes(key)) {
      return visas;
    }
  }
  return [];
}

/**
 * Check if candidate has required visa
 */
function hasRequiredVisa(candidate: Candidate, visa: string): boolean {
  const visaLower = visa.toLowerCase();
  if (visaLower.includes('schengen')) return candidate.has_schengen;
  if (visaLower.includes('b1') || visaLower.includes('b2')) return candidate.has_b1b2;
  if (visaLower.includes('c1d') || visaLower.includes('c1/d')) return candidate.has_c1d;
  return candidate.other_visas?.some(v => v.toLowerCase().includes(visaLower)) ?? false;
}

/**
 * Normalize nationality string for comparison
 * Handles variations like "South Africa", "South African", "za", "ZA", etc.
 */
function normalizeNationality(nat: string): string {
  const normalized = nat.toLowerCase().trim();

  // Common nationality mappings
  const mappings: Record<string, string> = {
    'south africa': 'south_african',
    'south african': 'south_african',
    'za': 'south_african',
    'rsa': 'south_african',
    'united kingdom': 'british',
    'uk': 'british',
    'gb': 'british',
    'great britain': 'british',
    'england': 'british',
    'english': 'british',
    'scotland': 'british',
    'scottish': 'british',
    'wales': 'british',
    'welsh': 'british',
    'united states': 'american',
    'usa': 'american',
    'us': 'american',
    'australia': 'australian',
    'aus': 'australian',
    'new zealand': 'new_zealander',
    'nz': 'new_zealander',
    'kiwi': 'new_zealander',
    'france': 'french',
    'germany': 'german',
    'italy': 'italian',
    'spain': 'spanish',
    'netherlands': 'dutch',
    'holland': 'dutch',
    'philippines': 'filipino',
    'croatia': 'croatian',
    'ukraine': 'ukrainian',
    'poland': 'polish',
  };

  return mappings[normalized] || normalized.replace(/[^a-z]/g, '_');
}

/**
 * Check if candidate has required skills (searches bio and profile)
 */
function hasRequiredSkills(
  candidate: Candidate,
  requiredSkills: string[],
  mode: 'all' | 'any' = 'any'
): { hasSkills: boolean; matchedSkills: string[]; missingSkills: string[] } {
  if (!requiredSkills.length) {
    return { hasSkills: true, matchedSkills: [], missingSkills: [] };
  }

  // Build searchable text from candidate profile
  const searchText = [
    candidate.primary_position,
    ...(candidate.secondary_positions || []),
    candidate.profile_summary,
    // Note: bio would be ideal but may not be on Candidate type
  ].filter(Boolean).join(' ').toLowerCase();

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of requiredSkills) {
    const skillLower = skill.toLowerCase();
    // Check for skill or related terms
    const skillVariants = getSkillVariants(skillLower);

    const found = skillVariants.some(variant => searchText.includes(variant));
    if (found) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const hasSkills = mode === 'all'
    ? missingSkills.length === 0
    : matchedSkills.length > 0;

  return { hasSkills, matchedSkills, missingSkills };
}

/**
 * Get skill variants for matching
 */
function getSkillVariants(skill: string): string[] {
  const variants: Record<string, string[]> = {
    'bartending': ['bartend', 'bar service', 'cocktail', 'mixology', 'bar'],
    'silver service': ['silver', 'formal service', 'fine dining service'],
    'wine': ['wine', 'sommelier', 'wine service', 'wine knowledge'],
    'floristry': ['flor', 'flower', 'floral'],
    'spa': ['spa', 'massage', 'beauty', 'treatments'],
    'watersports': ['watersport', 'water sport', 'jet ski', 'wakeboard', 'dive', 'scuba'],
    'diving': ['dive', 'scuba', 'padi', 'ssi', 'divemaster'],
    'tender': ['tender', 'rib', 'boat handling'],
    'navigation': ['navigat', 'chartwork', 'passage plan'],
  };

  return variants[skill] || [skill];
}

/**
 * AI Re-ranking schema for top candidates
 */
const aiRerankSchema = z.object({
  candidates: z.array(z.object({
    candidate_id: z.string(),
    ai_score: z.number().min(0).max(10),
    summary: z.string(),
    strengths: z.array(z.string()),
    concerns: z.array(z.string()),
  })),
});

/**
 * Stage 5: AI re-ranking for top candidates
 *
 * This is where the AI acts as an expert recruiter - comparing FULL candidate profiles
 * against ALL job requirements and recruiter notes. The AI evaluates:
 * - Experience quality (not just quantity)
 * - Work history relevance
 * - Personality/cultural fit indicators from bio/profile
 * - Reference quality if available
 * - Career trajectory and growth potential
 *
 * @param candidates - Candidates to evaluate (with full profile data)
 * @param job - Job details
 * @param privateNotes - CONFIDENTIAL recruiter notes (personality fit, client preferences, etc.)
 * @param extractedReqs - The extracted requirements from job brief analysis (for AI context)
 */
async function aiRerankTopCandidates(
  candidates: Array<{ candidate: Candidate; preliminaryScore: number }>,
  job: Job,
  privateNotes?: string,
  extractedReqs?: ExtractedRequirements | null
): Promise<Map<string, { aiScore: number; summary: string; strengths: string[]; concerns: string[] }>> {
  const results = new Map<string, { aiScore: number; summary: string; strengths: string[]; concerns: string[] }>();

  if (candidates.length === 0) return results;

  // Build FULL candidate profiles for AI evaluation
  const candidateProfiles = candidates.map((c, i) => {
    const cand = c.candidate;

    // Format work history if available
    const workHistoryStr = cand.work_history && Array.isArray(cand.work_history)
      ? cand.work_history.slice(0, 5).map((wh: Record<string, unknown>) => {
          const vessel = wh.vessel_name || 'Unknown vessel';
          const role = wh.position || wh.role || 'Unknown role';
          const size = wh.vessel_size ? `${wh.vessel_size}m` : '';
          const duration = wh.duration || wh.period || '';
          return `  - ${role} on ${vessel} ${size} ${duration}`.trim();
        }).join('\n')
      : 'No work history available';

    // Format certifications
    const certs = [
      cand.has_stcw ? 'STCW' + (cand.stcw_expiry ? ` (exp: ${cand.stcw_expiry})` : '') : null,
      cand.has_eng1 ? 'ENG1' + (cand.eng1_expiry ? ` (exp: ${cand.eng1_expiry})` : '') : null,
      cand.highest_license ? `License: ${cand.highest_license}` : null,
    ].filter(Boolean).join(', ') || 'None';

    // Format visas
    const visas = [
      cand.has_schengen ? 'Schengen' : null,
      cand.has_b1b2 ? 'B1/B2' : null,
      cand.has_c1d ? 'C1/D' : null,
      ...(cand.other_visas || []),
    ].filter(Boolean).join(', ') || 'None';

    // Personal characteristics
    const personalNotes = [
      cand.is_smoker === true ? 'Smoker' : cand.is_smoker === false ? 'Non-smoker' : null,
      cand.has_visible_tattoos === true ? 'Has visible tattoos' : cand.has_visible_tattoos === false ? 'No visible tattoos' : null,
      cand.is_couple ? `Couple (partner: ${cand.partner_position || 'unknown position'})` : null,
    ].filter(Boolean).join(', ');

    // Preferences
    const prefs = [
      cand.preferred_regions?.length ? `Regions: ${cand.preferred_regions.join(', ')}` : null,
      cand.preferred_yacht_types?.length ? `Yacht types: ${cand.preferred_yacht_types.join(', ')}` : null,
      (cand.preferred_yacht_size_min || cand.preferred_yacht_size_max)
        ? `Yacht size: ${cand.preferred_yacht_size_min || '?'}m - ${cand.preferred_yacht_size_max || '?'}m`
        : null,
      cand.preferred_contract_types?.length ? `Contracts: ${cand.preferred_contract_types.join(', ')}` : null,
      (cand.desired_salary_min || cand.desired_salary_max)
        ? `Salary expectation: ${cand.desired_salary_min || '?'} - ${cand.desired_salary_max || '?'}`
        : null,
    ].filter(Boolean).join('\n  ');

    return `
═══════════════════════════════════════════════════════════════════
CANDIDATE ${i + 1}: ${cand.first_name} ${cand.last_name}
═══════════════════════════════════════════════════════════════════
ID: ${cand.id}
Preliminary Score: ${c.preliminaryScore}/90

POSITION & EXPERIENCE
• Primary Position: ${cand.primary_position || 'Unknown'}
• Secondary Positions: ${cand.secondary_positions?.join(', ') || 'None'}
• Years of Experience: ${cand.years_experience || 0} years
• Verification Status: ${cand.verification_tier}

PERSONAL DETAILS
• Nationality: ${cand.nationality || 'Unknown'}${cand.second_nationality ? ` / ${cand.second_nationality}` : ''}
${personalNotes ? `• Notes: ${personalNotes}` : ''}

QUALIFICATIONS
• Certifications: ${certs}
• Visas: ${visas}

WORK HISTORY (Recent)
${workHistoryStr}

PROFILE / BIO
${cand.bio || cand.profile_summary || 'No bio available'}

PREFERENCES
  ${prefs || 'No preferences specified'}

AVAILABILITY
• Status: ${cand.availability_status}
${cand.available_from ? `• Available From: ${cand.available_from}` : '• Available: Immediately'}

REFERENCES
• Count: ${cand.references_count || 0}
${cand.average_reference_rating ? `• Average Rating: ${cand.average_reference_rating}/5` : ''}
`.trim();
  }).join('\n\n');

  // Build comprehensive job context
  const priorityReqs = extractedReqs?.priority_requirements?.length
    ? `\nPRIORITY REQUIREMENTS (MOST IMPORTANT):\n${extractedReqs.priority_requirements.map(r => `• ${r}`).join('\n')}`
    : '';

  const extractedSkills = extractedReqs?.skills?.required?.length
    ? `\nREQUIRED SKILLS:\n${extractedReqs.skills.required.map(s => `• ${s}`).join('\n')}`
    : '';

  const extractedPrefs = extractedReqs?.skills?.preferred?.length
    ? `\nPREFERRED SKILLS:\n${extractedReqs.skills.preferred.map(s => `• ${s}`).join('\n')}`
    : '';

  const nationalityReqs = extractedReqs?.nationality?.excluded?.length
    ? `\nNATIONALITY RESTRICTIONS:\n• Excluded: ${extractedReqs.nationality.excluded.join(', ')}`
    : '';

  const jobContext = `
╔═══════════════════════════════════════════════════════════════════╗
║                         JOB REQUIREMENTS                          ║
╚═══════════════════════════════════════════════════════════════════╝

POSITION: ${job.title}
${job.position_category ? `CATEGORY: ${job.position_category}` : ''}

VESSEL DETAILS
• Type: ${job.vessel_type || 'Not specified'}
• Size: ${job.vessel_size_meters ? `${job.vessel_size_meters}m` : 'Not specified'}
• Name: ${job.vessel_name || 'Confidential'}

LOCATION & CONTRACT
• Region: ${job.primary_region || 'Not specified'}
• Contract: ${job.contract_type || 'Not specified'}
${job.rotation_schedule ? `• Rotation: ${job.rotation_schedule}` : ''}
${job.start_date ? `• Start Date: ${job.start_date}` : ''}
${job.end_date ? `• End Date: ${job.end_date}` : ''}

COMPENSATION
${job.salary_min || job.salary_max
  ? `• Salary: ${job.salary_min || '?'} - ${job.salary_max || '?'} ${job.salary_currency || 'EUR'}`
  : '• Salary: Not specified'}
${priorityReqs}
${extractedSkills}
${extractedPrefs}
${nationalityReqs}

FULL JOB DESCRIPTION / REQUIREMENTS:
${job.requirements_text || job.public_description || JSON.stringify(job.requirements, null, 2) || 'No detailed requirements provided'}

${privateNotes ? `
╔═══════════════════════════════════════════════════════════════════╗
║     CONFIDENTIAL RECRUITER NOTES (for your assessment only)       ║
╚═══════════════════════════════════════════════════════════════════╝
${privateNotes}

IMPORTANT: Use these notes to inform your assessment (personality fit, client
preferences, budget flexibility, etc.) but NEVER mention them explicitly in
your response. The candidate must not know about these confidential notes.
` : ''}`;

  try {
    // Use Claude Sonnet 4.5 for smarter, more nuanced candidate evaluation
    // Sonnet 4.5 is excellent at understanding complex requirements and cultural fit
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20241022'),
      schema: aiRerankSchema,
      system: `You are a SENIOR YACHT CREW RECRUITER with 15+ years of experience placing crew on superyachts worldwide.

Your task is to evaluate each candidate's FIT for this specific position by comparing their COMPLETE PROFILE against ALL job requirements.

EVALUATION CRITERIA (Score 0-10):
• 9-10: EXCEPTIONAL - Perfect match. Exceeds requirements. Immediate hire recommendation.
• 7-8: STRONG - Meets all key requirements. Minor gaps that can be addressed.
• 5-6: ADEQUATE - Meets basic requirements but has notable gaps or concerns.
• 3-4: CONCERNS - Significant gaps. Would need to address issues before considering.
• 0-2: POOR FIT - Does not meet core requirements. Not recommended.

WHAT TO EVALUATE:
1. EXPERIENCE QUALITY: Not just years, but relevance. A chief stew with 5 years on 80m yachts is different from 5 years on 30m.
2. WORK HISTORY: Career progression, yacht sizes, vessel types, duration at each position.
3. PERSONALITY/CULTURAL FIT: Bio tone, career trajectory, what it reveals about work ethic.
4. CERTIFICATIONS: Are they current? Do they have what's needed?
5. AVAILABILITY: Can they start when needed?
6. GROWTH POTENTIAL: Could they grow into the role if slightly under-qualified?

${privateNotes ? `
CONFIDENTIAL ASSESSMENT: The recruiter has provided private notes about client preferences,
personality requirements, or other sensitive criteria. Use these to inform your assessment
but NEVER reveal or hint at these notes in your response.
` : ''}

Be SPECIFIC in your assessment. Don't just say "good experience" - say "7 years chief stew
experience on 60m+ motor yachts, including M/Y [vessel name], demonstrates exactly the
large yacht experience this role requires."

Return your assessment for EACH candidate.`,
      prompt: `EVALUATE THESE CANDIDATES FOR THE POSITION BELOW.

Compare each candidate's full profile against the job requirements and rank them by fit.

${jobContext}

═══════════════════════════════════════════════════════════════════════════════
                              CANDIDATES TO EVALUATE
═══════════════════════════════════════════════════════════════════════════════

${candidateProfiles}

═══════════════════════════════════════════════════════════════════════════════

For each candidate, provide:
1. ai_score (0-10): How well they fit THIS specific job
2. summary: 1-2 sentence assessment explaining the score
3. strengths: Specific things that make them a good fit
4. concerns: Specific issues or gaps

Remember: You're acting as an expert recruiter. Be direct and specific.`,
    });

    for (const assessment of object.candidates) {
      results.set(assessment.candidate_id, {
        aiScore: assessment.ai_score,
        summary: assessment.summary,
        strengths: assessment.strengths,
        concerns: assessment.concerns,
      });
    }
  } catch (error) {
    console.error('AI reranking failed:', error);
    // Return default scores on failure
    for (const c of candidates) {
      results.set(c.candidate.id, {
        aiScore: 5,
        summary: 'AI assessment unavailable',
        strengths: [],
        concerns: [],
      });
    }
  }

  return results;
}

/**
 * Main matching function - matchCandidatesForJob
 *
 * AI SOURCER - Seven-stage pipeline (optimal for large candidate pools):
 * 0. JOB BRIEF ANALYSIS: Extract ALL requirements from any brief format
 * 1. BUILD EFFECTIVE FILTERS: Merge DB + extracted + override requirements
 * 2. METADATA SEARCH WITH HARD FILTERS: SQL query with filters (efficient!)
 * 2.5. NATIONALITY EXCLUSION FILTER: In-memory partial matching
 * 3. VECTOR SEARCH: Rank filtered candidates by semantic similarity
 * 4. SCORING: 100 points across 6 weighted categories (including skills)
 * 4.5. COHERE RE-RANKING: Semantic rerank with cross-attention (top 50 → top 20)
 * 5. AI RE-RANKING: Claude Sonnet 4.5 evaluates top 15 for nuanced assessment
 *
 * Key optimization: Hard filters BEFORE semantic search (not after!)
 * This avoids wasting compute on candidates that will be rejected anyway.
 *
 * Handles briefs of ANY format:
 * - "Chief stew, 5 years, 70m+, no South Africans, needs bartending"
 * - Detailed multi-page specs
 * - Mix of structured DB fields and free-form notes
 */
export async function matchCandidatesForJob(
  supabase: SupabaseClient,
  jobId: string,
  options?: MatchCandidatesOptions
): Promise<MatchResult[]> {
  const limit = options?.limit ?? 10;
  const { privateNotes, rawBrief, hardFilterOverrides, skipBriefAnalysis } = options || {};

  console.log(`[Matcher] Starting AI Sourcer pipeline for job ${jobId}`);

  // ============ FETCH JOB ============
  // Note: private_notes is fetched but ONLY used internally for AI matching
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .is('deleted_at', null)
    .single();

  if (jobError || !job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  // Use private notes from options if provided, otherwise use job.private_notes
  const effectivePrivateNotes = privateNotes ?? job.private_notes;

  // ============ STAGE 0: JOB BRIEF ANALYSIS ============
  // Parse the job brief (any format) to extract ALL requirements
  // This is the AI sourcer's "brain" - it understands natural language briefs
  let extractedReqs: ExtractedRequirements | null = null;

  if (!skipBriefAnalysis) {
    console.log(`[Stage 0] Analyzing job brief...`);

    const briefInput: JobBriefInput = {
      title: job.title,
      public_title: job.public_title,
      position_category: job.position_category,
      vessel_name: job.vessel_name,
      vessel_type: job.vessel_type,
      vessel_size_meters: job.vessel_size_meters,
      contract_type: job.contract_type,
      start_date: job.start_date,
      end_date: job.end_date,
      primary_region: job.primary_region,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      rotation_schedule: job.rotation_schedule,
      is_urgent: job.is_urgent,
      requirements_text: job.requirements_text,
      public_description: job.public_description,
      requirements: job.requirements,
      private_notes: effectivePrivateNotes,
      raw_brief: rawBrief,
    };

    extractedReqs = await analyzeJobBriefSafe(briefInput);

    console.log(`[Stage 0] Extracted requirements:`);
    console.log(`  - Priority: ${extractedReqs.priority_requirements.join(', ')}`);
    console.log(`  - Nationality exclusions: ${extractedReqs.nationality.excluded?.join(', ') || 'none'}`);
    console.log(`  - Skills required: ${extractedReqs.skills.required.join(', ') || 'none'}`);
    console.log(`  - Yacht size experience: ${extractedReqs.experience.yacht_size_min || 'not specified'}m+`);
    console.log(`  - Confidence: ${(extractedReqs.parsing.confidence * 100).toFixed(0)}%`);
  }

  // ============ STAGE 1: BUILD EFFECTIVE FILTERS ============
  // Merge job requirements with extracted requirements and overrides
  // Priority: overrides > extracted requirements > DB requirements
  // This happens FIRST so we can apply filters in SQL queries
  const req = job.requirements || {};
  const regionVisas = getVisasForRegion(job.primary_region);

  const effectiveFilters = {
    certifications_required: [
      ...(req.certifications_required || []),
      ...(extractedReqs?.certifications.required || []),
    ],
    visas_required: [
      ...(req.visas_required || []),
      ...(extractedReqs?.visas.required || []),
    ],
    experience_years_min: extractedReqs?.experience.years_min ?? req.experience_years_min,
    // Nationality exclusions (CRITICAL hard filter)
    nationality_exclusions: [
      ...(req.nationality_exclusions || []),
      ...(extractedReqs?.nationality.excluded || []),
    ] as string[],
    // Yacht size experience requirement (for scoring, not hard filter)
    yacht_size_min: extractedReqs?.experience.yacht_size_min ?? req.yacht_size_experience,
    // Required skills (for scoring)
    required_skills: [
      ...(req.skills_required || []),
      ...(extractedReqs?.skills.required || []),
    ] as string[],
    // Personal requirements
    non_smoker: extractedReqs?.personal.non_smoker ?? req.non_smoker,
    no_visible_tattoos: extractedReqs?.personal.no_visible_tattoos ?? req.no_visible_tattoos,
    // License requirement (e.g., OOW 3000gt, Master 500gt, Y4)
    license_required: req.license_required as string | undefined,
  };

  // Override with explicit filter settings (highest priority)
  if (hardFilterOverrides) {
    if (hardFilterOverrides.requireSTCW !== undefined) {
      if (hardFilterOverrides.requireSTCW && !effectiveFilters.certifications_required.includes('STCW')) {
        effectiveFilters.certifications_required = [...effectiveFilters.certifications_required, 'STCW'];
      } else if (!hardFilterOverrides.requireSTCW) {
        effectiveFilters.certifications_required = effectiveFilters.certifications_required.filter((c: string) => c.toUpperCase() !== 'STCW');
      }
    }
    if (hardFilterOverrides.requireENG1 !== undefined) {
      if (hardFilterOverrides.requireENG1 && !effectiveFilters.certifications_required.includes('ENG1')) {
        effectiveFilters.certifications_required = [...effectiveFilters.certifications_required, 'ENG1'];
      } else if (!hardFilterOverrides.requireENG1) {
        effectiveFilters.certifications_required = effectiveFilters.certifications_required.filter((c: string) => c.toUpperCase() !== 'ENG1');
      }
    }
    if (hardFilterOverrides.visasRequired) {
      effectiveFilters.visas_required = hardFilterOverrides.visasRequired;
    }
    if (hardFilterOverrides.minExperience !== undefined) {
      effectiveFilters.experience_years_min = hardFilterOverrides.minExperience;
    }
    if (hardFilterOverrides.excludeNationalities?.length) {
      effectiveFilters.nationality_exclusions = [
        ...effectiveFilters.nationality_exclusions,
        ...hardFilterOverrides.excludeNationalities,
      ];
    }
    if (hardFilterOverrides.minYachtSizeExperience !== undefined) {
      effectiveFilters.yacht_size_min = hardFilterOverrides.minYachtSizeExperience;
    }
    if (hardFilterOverrides.requiredSkills?.length) {
      effectiveFilters.required_skills = [
        ...effectiveFilters.required_skills,
        ...hardFilterOverrides.requiredSkills,
      ];
    }
    if (hardFilterOverrides.requiredLicense) {
      effectiveFilters.license_required = hardFilterOverrides.requiredLicense;
    }
  }

  // Dedupe and normalize arrays
  effectiveFilters.certifications_required = [...new Set(effectiveFilters.certifications_required.map(c => c.toUpperCase()))];
  effectiveFilters.visas_required = [...new Set(effectiveFilters.visas_required.map(v => v.toLowerCase()))];
  effectiveFilters.nationality_exclusions = [...new Set(effectiveFilters.nationality_exclusions.map(n => n.toLowerCase()))];
  effectiveFilters.required_skills = [...new Set(effectiveFilters.required_skills.map(s => s.toLowerCase()))];

  // Determine position filters from job + extracted requirements
  const positionCategory = job.position_category || extractedReqs?.position.category;
  const positionTitle = job.title || extractedReqs?.position.title;
  const alternativePositions = extractedReqs?.position.alternative_titles || [];

  console.log(`[Stage 1] Built effective filters:`);
  console.log(`  - Position: ${positionTitle} (${positionCategory || 'any category'})`);
  console.log(`  - Alternative positions: ${alternativePositions.join(', ') || 'none'}`);
  console.log(`  - Certifications: ${effectiveFilters.certifications_required.join(', ') || 'none'}`);
  console.log(`  - Nationality exclusions: ${effectiveFilters.nationality_exclusions.join(', ') || 'none'}`);
  console.log(`  - Min experience: ${effectiveFilters.experience_years_min || 'none'} years`);
  console.log(`  - Visas required: ${[...effectiveFilters.visas_required, ...regionVisas].join(', ') || 'none'}`);

  // ============ STAGE 2: METADATA SEARCH WITH HARD FILTERS ============
  // Apply hard filters at the database level for efficiency
  // This is the most efficient approach - filter BEFORE fetching
  // CRITICAL: Position filtering is the most important filter!
  console.log(`[Stage 2] Fetching candidates with hard filters in SQL...`);

  let metadataQuery = supabase
    .from('candidates')
    .select('*')
    .is('deleted_at', null)
    .eq('availability_status', 'available');

  // CRITICAL: Position category filter - we don't want deckhands for a stew job!
  // This is the MOST important filter - must be applied first
  if (positionCategory) {
    metadataQuery = metadataQuery.eq('position_category', positionCategory);
    console.log(`  - Filtering by position_category: ${positionCategory}`);
  }

  // Build list of acceptable positions for in-memory filtering
  // (Can't do complex OR with ilike in Supabase without breaking other filters)
  const acceptablePositions = [
    positionTitle,
    ...alternativePositions,
  ].filter(Boolean).map(p => p!.toLowerCase());

  // Apply certification filters in SQL
  const requiresSTCW = effectiveFilters.certifications_required.includes('STCW');
  const requiresENG1 = effectiveFilters.certifications_required.includes('ENG1');
  if (requiresSTCW) {
    metadataQuery = metadataQuery.eq('has_stcw', true);
  }
  if (requiresENG1) {
    metadataQuery = metadataQuery.eq('has_eng1', true);
  }

  // Apply visa filters in SQL
  const allRequiredVisas = [...effectiveFilters.visas_required, ...regionVisas];
  for (const visa of allRequiredVisas) {
    const visaLower = visa.toLowerCase();
    if (visaLower.includes('schengen')) {
      metadataQuery = metadataQuery.eq('has_schengen', true);
    }
    if (visaLower.includes('b1') || visaLower.includes('b2') || visaLower.includes('b1/b2')) {
      metadataQuery = metadataQuery.eq('has_b1b2', true);
    }
    if (visaLower.includes('c1') || visaLower.includes('c1/d')) {
      metadataQuery = metadataQuery.eq('has_c1d', true);
    }
  }

  // Apply minimum experience filter in SQL
  if (effectiveFilters.experience_years_min) {
    metadataQuery = metadataQuery.gte('years_experience', effectiveFilters.experience_years_min);
  }

  // Apply personal requirement filters in SQL
  if (effectiveFilters.non_smoker) {
    metadataQuery = metadataQuery.or('is_smoker.is.null,is_smoker.eq.false');
  }
  if (effectiveFilters.no_visible_tattoos) {
    metadataQuery = metadataQuery.or('has_visible_tattoos.is.null,has_visible_tattoos.eq.false');
  }

  // Apply license filter in SQL if specified
  // NOTE: License values are now normalized in the database (snake_case canonical form)
  // This filter will be applied in-memory after the SQL query for flexibility
  // since we need to check license hierarchy (e.g., Master 3000gt covers OOW requirement)
  const normalizedLicenseRequired = effectiveFilters.license_required
    ? normalizeLicenseValue(effectiveFilters.license_required)
    : null;

  if (normalizedLicenseRequired) {
    console.log(`  - License required: ${normalizedLicenseRequired} (normalized from ${effectiveFilters.license_required})`);
  }

  // Limit results - we'll further filter and rank
  metadataQuery = metadataQuery.limit(1000);

  const { data: metadataResults, error: metadataError } = await metadataQuery;

  if (metadataError) {
    console.error(`[Stage 2] Metadata search failed: ${metadataError.message}`);
    return [];
  }

  let candidates: Candidate[] = metadataResults || [];
  console.log(`[Stage 2] SQL query returned ${candidates.length} candidates after hard filters`);

  // ============ STAGE 2.5: NATIONALITY EXCLUSION FILTER ============
  // This can't be done efficiently in SQL (partial matching, multiple nationalities)
  // So we filter in memory after the SQL query
  if (effectiveFilters.nationality_exclusions.length > 0) {
    const beforeNationalityFilter = candidates.length;

    candidates = candidates.filter((candidate: Candidate) => {
      const candidateNationalities = [
        candidate.nationality?.toLowerCase(),
        candidate.second_nationality?.toLowerCase(),
      ].filter(Boolean);

      for (const excluded of effectiveFilters.nationality_exclusions) {
        for (const candNat of candidateNationalities) {
          // Check for partial matches (e.g., "south african" matches "South Africa", "South African")
          if (candNat && (
            candNat.includes(excluded) ||
            excluded.includes(candNat) ||
            normalizeNationality(candNat) === normalizeNationality(excluded)
          )) {
            return false;
          }
        }
      }
      return true;
    });

    console.log(`[Stage 2.5] Nationality filter: ${beforeNationalityFilter} → ${candidates.length} candidates`);
  }

  // ============ STAGE 2.6: LICENSE FILTER ============
  // Filter by required license using hierarchy (e.g., Master 3000gt covers OOW requirement)
  // This is done in memory because we need to check the license hierarchy
  if (normalizedLicenseRequired) {
    const beforeLicenseFilter = candidates.length;

    candidates = candidates.filter((candidate: Candidate) => {
      if (!candidate.highest_license) return false;

      const candidateLicense = normalizeLicenseValue(candidate.highest_license);
      if (!candidateLicense) return false;

      // Check if candidate's license meets or exceeds requirement using hierarchy
      return licenseMeetsRequirement(candidateLicense, normalizedLicenseRequired);
    });

    console.log(`[Stage 2.6] License filter (${normalizedLicenseRequired}): ${beforeLicenseFilter} → ${candidates.length} candidates`);
  }

  // ============ STAGE 2.7: POSITION CATEGORY INFERENCE ============
  // Infer position_category from primary_position for candidates with NULL category
  // This ensures we don't exclude candidates just because their category wasn't set
  if (positionCategory) {
    const beforeInference = candidates.length;
    let inferred = 0;

    candidates = candidates.filter((candidate: Candidate) => {
      // If candidate has matching position_category, keep them
      if ((candidate as { position_category?: string }).position_category === positionCategory) {
        return true;
      }

      // If candidate has no position_category, try to infer from primary_position
      const inferredCategory = inferPositionCategory(candidate.primary_position);
      if (inferredCategory === positionCategory) {
        inferred++;
        return true;
      }

      // Candidate's inferred category doesn't match - exclude
      return false;
    });

    if (inferred > 0) {
      console.log(`[Stage 2.7] Inferred position_category for ${inferred} candidates`);
    }
    console.log(`[Stage 2.7] Position inference: ${beforeInference} → ${candidates.length} candidates`);
  }

  if (candidates.length === 0) {
    console.log(`[Stage 2] No candidates passed hard filters`);
    return [];
  }

  // ============ STAGE 3: VECTOR SEARCH (semantic ranking) ============
  // Now do vector search on the FILTERED candidates to rank by semantic similarity
  // This is more efficient than filtering after vector search
  let vectorRankedCandidates: Candidate[] = [];

  if (job.embedding && candidates.length > 0) {
    console.log(`[Stage 3] Running vector search on ${candidates.length} filtered candidates...`);

    // Get candidate IDs that passed hard filters
    const filteredCandidateIds = candidates.map(c => c.id);

    // Use vector search RPC with candidate ID filter if available
    // Otherwise, we'll calculate similarity manually
    const { data: vectorResults, error: vectorError } = await supabase.rpc(
      'search_candidates_vector',
      {
        p_query_embedding: job.embedding,
        p_limit: 300,
        p_threshold: 0.20,  // Lower threshold since we've already filtered
        p_position_category: job.position_category || null,
      }
    );

    if (vectorError) {
      console.warn(`[Stage 3] Vector search failed, using metadata order: ${vectorError.message}`);
      vectorRankedCandidates = candidates;
    } else {
      // Filter vector results to only include candidates that passed hard filters
      const filteredIdSet = new Set(filteredCandidateIds);
      const vectorCandidateIds = new Set<string>();

      for (const vc of (vectorResults || [])) {
        if (filteredIdSet.has(vc.id)) {
          vectorCandidateIds.add(vc.id);
          // Find full candidate data from our filtered set
          const fullCandidate = candidates.find(c => c.id === vc.id);
          if (fullCandidate) {
            vectorRankedCandidates.push(fullCandidate);
          }
        }
      }

      // Add any candidates that weren't in vector results (no embedding or low similarity)
      for (const c of candidates) {
        if (!vectorCandidateIds.has(c.id)) {
          vectorRankedCandidates.push(c);
        }
      }

      console.log(`[Stage 3] Vector ranking: ${vectorRankedCandidates.length} candidates (${vectorCandidateIds.size} from vector search)`);
    }
  } else {
    console.log(`[Stage 3] No job embedding, using metadata order`);
    vectorRankedCandidates = candidates;
  }

  // Use the vector-ranked candidates for the rest of the pipeline
  const passedHardFilters = vectorRankedCandidates;

  console.log(`[Stage 3] ${passedHardFilters.length} candidates passed hard filters (from ${candidates.length})`);

  if (passedHardFilters.length === 0) {
    return [];
  }

  // ============ STAGE 4: SCORING (100 points total) ============
  // Updated to use extracted requirements for better scoring
  console.log(`[Stage 4] Scoring ${passedHardFilters.length} candidates...`);

  const idealYearsFromExtraction = extractedReqs?.experience.years_ideal ?? extractedReqs?.experience.years_min;
  const requiredYachtSize = effectiveFilters.yacht_size_min || 0;
  const requiredSkills = effectiveFilters.required_skills;

  const scoredCandidates = passedHardFilters.map((candidate: Candidate) => {
    const breakdown = {
      qualifications: 0,  // 20 pts
      experience: 0,      // 25 pts (includes yacht size)
      skills: 0,          // 10 pts (NEW)
      availability: 0,    // 15 pts
      preferences: 0,     // 15 pts
      verification: 0,    // 5 pts
      aiAssessment: 0,    // 10 pts (filled in stage 5)
    };
    const strengths: string[] = [];
    const concerns: string[] = [];

    // ---- QUALIFICATIONS (20 points) ----
    // STCW (5 pts)
    if (candidate.has_stcw) {
      breakdown.qualifications += 5;
      strengths.push('STCW certified');
    }
    // ENG1 (5 pts)
    if (candidate.has_eng1) {
      breakdown.qualifications += 5;
      strengths.push('ENG1 medical');
    }
    // License (5 pts)
    if (candidate.highest_license) {
      breakdown.qualifications += 5;
      strengths.push(`License: ${candidate.highest_license}`);
    }
    // Visas (5 pts) - has useful visas for the region
    const hasSchengen = candidate.has_schengen;
    const hasUSVisas = candidate.has_b1b2 || candidate.has_c1d;
    if (hasSchengen && hasUSVisas) {
      breakdown.qualifications += 5;
      strengths.push('Full visa coverage');
    } else if (hasSchengen || hasUSVisas) {
      breakdown.qualifications += 3;
    }

    // ---- EXPERIENCE (25 points) ----
    const yearsExp = candidate.years_experience || 0;
    const idealYears = idealYearsFromExtraction || req.experience_years_ideal || req.experience_years_min || 3;

    // Years of experience (15 pts)
    if (yearsExp >= idealYears + 3) {
      breakdown.experience += 15;
      strengths.push(`${yearsExp} years experience (exceeds requirements)`);
    } else if (yearsExp >= idealYears) {
      breakdown.experience += 12;
      strengths.push(`${yearsExp} years experience`);
    } else if (yearsExp >= (effectiveFilters.experience_years_min || 0)) {
      breakdown.experience += 8;
    } else {
      concerns.push(`Limited experience (${yearsExp} years)`);
    }

    // Yacht size experience (10 pts)
    // This is scoring - not hard filter. A 50m candidate can grow into 70m.
    const jobSize = requiredYachtSize || job.vessel_size_meters || 0;
    const candSizeMax = candidate.preferred_yacht_size_max || 0;

    if (jobSize > 0 && candSizeMax > 0) {
      if (candSizeMax >= jobSize) {
        // Candidate has worked on yachts this size or larger - excellent!
        breakdown.experience += 10;
        strengths.push(`${candSizeMax}m yacht experience (matches/exceeds ${jobSize}m requirement)`);
      } else if (candSizeMax >= jobSize * 0.8) {
        // Within 80% - good, can likely adapt
        breakdown.experience += 7;
        strengths.push(`${candSizeMax}m yacht experience (close to ${jobSize}m requirement)`);
      } else if (candSizeMax >= jobSize * 0.6) {
        // Within 60% - possible but a stretch
        breakdown.experience += 4;
        concerns.push(`Yacht size experience (${candSizeMax}m) may be smaller than ideal (${jobSize}m)`);
      } else {
        // Significant gap
        breakdown.experience += 2;
        concerns.push(`Limited large yacht experience (${candSizeMax}m vs ${jobSize}m required)`);
      }
    } else if (candSizeMax > 0) {
      // No job size specified, give partial credit
      breakdown.experience += 5;
    } else {
      // No yacht size data - give some credit
      breakdown.experience += 3;
    }

    // ---- SKILLS (10 points - NEW) ----
    if (requiredSkills.length > 0) {
      const skillsResult = hasRequiredSkills(candidate, requiredSkills, 'any');

      if (skillsResult.matchedSkills.length > 0) {
        // Score based on how many skills match
        const skillMatchRatio = skillsResult.matchedSkills.length / requiredSkills.length;
        breakdown.skills = Math.round(skillMatchRatio * 10);
        strengths.push(`Skills: ${skillsResult.matchedSkills.join(', ')}`);

        if (skillsResult.missingSkills.length > 0) {
          concerns.push(`Missing skills: ${skillsResult.missingSkills.join(', ')}`);
        }
      } else {
        concerns.push(`Missing required skills: ${requiredSkills.join(', ')}`);
      }
    } else {
      // No specific skills required - give base points
      breakdown.skills = 5;
    }

    // ---- AVAILABILITY (15 points) ----
    if (candidate.availability_status === 'available') {
      breakdown.availability += 10;
      strengths.push('Immediately available');
    } else {
      breakdown.availability += 2;
      concerns.push('Not currently looking');
    }

    // Start date alignment (5 pts)
    if (job.start_date && candidate.available_from) {
      const jobStart = new Date(job.start_date);
      const candAvail = new Date(candidate.available_from);
      if (candAvail <= jobStart) {
        breakdown.availability += 5;
      } else {
        const daysLate = Math.ceil((candAvail.getTime() - jobStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLate <= 14) {
          breakdown.availability += 3;
        } else {
          concerns.push(`Available ${daysLate} days after start date`);
        }
      }
    } else {
      breakdown.availability += 5; // No specific date requirements
    }

    // ---- PREFERENCES (15 points) ----
    // Region match (5 pts)
    if (job.primary_region && candidate.preferred_regions?.length) {
      const regionMatch = candidate.preferred_regions.some((r: string) =>
        r.toLowerCase().includes(job.primary_region!.toLowerCase()) ||
        job.primary_region!.toLowerCase().includes(r.toLowerCase())
      );
      if (regionMatch) {
        breakdown.preferences += 5;
        strengths.push('Region preference match');
      }
    } else {
      breakdown.preferences += 3;
    }

    // Contract type match (5 pts)
    if (job.contract_type && candidate.preferred_contract_types?.length) {
      const contractMatch = candidate.preferred_contract_types.some((c: string) =>
        c.toLowerCase() === job.contract_type!.toLowerCase()
      );
      if (contractMatch) {
        breakdown.preferences += 5;
        strengths.push('Contract type match');
      }
    } else {
      breakdown.preferences += 3;
    }

    // Salary alignment (5 pts)
    if (job.salary_min && candidate.desired_salary_min) {
      if (job.salary_min >= candidate.desired_salary_min) {
        breakdown.preferences += 5;
        strengths.push('Salary meets expectations');
      } else if (job.salary_min >= candidate.desired_salary_min * 0.9) {
        breakdown.preferences += 3;
      } else {
        concerns.push('Salary below expectations');
      }
    } else {
      breakdown.preferences += 3;
    }

    // ---- VERIFICATION (10 points) ----
    // Tier basic/identity/verified/premium maps to 2, 5, 8, 10 points
    const tierScores: Record<string, number> = {
      'basic': 2,
      'identity': 5,
      'verified': 8,
      'premium': 10
    };
    breakdown.verification = tierScores[candidate.verification_tier] ?? 2;
    const identityVerifiedTiers = new Set(['identity', 'verified', 'premium']);
    if (identityVerifiedTiers.has(candidate.verification_tier)) {
      strengths.push(`${candidate.verification_tier} verified`);
    }

    const preliminaryScore =
      breakdown.qualifications +
      breakdown.experience +
      breakdown.availability +
      breakdown.preferences +
      breakdown.verification;

    return {
      candidate,
      breakdown,
      strengths,
      concerns,
      preliminaryScore,
    };
  });

  // Sort by preliminary score
  scoredCandidates.sort((a, b) => b.preliminaryScore - a.preliminaryScore);

  console.log(`[Stage 4] Top score: ${scoredCandidates[0]?.preliminaryScore || 0}/90`);

  // ============ STAGE 4.5: COHERE SEMANTIC RE-RANKING ============
  // Cohere rerank-v3.5 uses cross-attention (query sees document) for more accurate ranking
  // This narrows down the pool before expensive Claude assessment
  const topForCohere = scoredCandidates.slice(0, CONFIG.cohere_rerank_input_limit);

  console.log(`[Stage 4.5] Cohere re-ranking top ${topForCohere.length} candidates...`);

  // Convert to Cohere format
  const cohereJob: JobForRerank = {
    title: job.title,
    description: job.public_description || job.requirements_text,
    requirements: effectivePrivateNotes
      ? `${job.requirements_text || ''}\n\nAdditional requirements:\n${effectivePrivateNotes}`
      : job.requirements_text,
    position_category: job.position_category,
    vessel_type: job.vessel_type,
    vessel_size_meters: job.vessel_size_meters,
    vessel_name: job.vessel_name,
    primary_region: job.primary_region,
    contract_type: job.contract_type,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
  };

  const cohereCandidates: CandidateForRerank[] = topForCohere.map(c => ({
    id: c.candidate.id,
    first_name: c.candidate.first_name,
    last_name: c.candidate.last_name,
    primary_position: c.candidate.primary_position,
    secondary_positions: c.candidate.secondary_positions,
    years_experience: c.candidate.years_experience,
    nationality: c.candidate.nationality,
    has_stcw: c.candidate.has_stcw,
    has_eng1: c.candidate.has_eng1,
    highest_license: c.candidate.highest_license,
    has_schengen: c.candidate.has_schengen,
    has_b1b2: c.candidate.has_b1b2,
    has_c1d: c.candidate.has_c1d,
    preferred_yacht_types: c.candidate.preferred_yacht_types,
    preferred_yacht_size_min: c.candidate.preferred_yacht_size_min,
    preferred_yacht_size_max: c.candidate.preferred_yacht_size_max,
    preferred_regions: c.candidate.preferred_regions,
    is_smoker: c.candidate.is_smoker,
    has_visible_tattoos: c.candidate.has_visible_tattoos,
    is_couple: c.candidate.is_couple,
    partner_position: c.candidate.partner_position,
    profile_summary: c.candidate.profile_summary,
    verification_tier: c.candidate.verification_tier,
    availability_status: c.candidate.availability_status,
  }));

  // Rerank with Cohere
  let rerankedCandidateIds: Set<string>;
  try {
    const cohereResults = await rerankCandidatesForJob(cohereJob, cohereCandidates, {
      topN: CONFIG.cohere_rerank_output_limit,
    });

    rerankedCandidateIds = new Set(cohereResults.map(r => r.id));

    console.log(`[Stage 4.5] Cohere narrowed ${topForCohere.length} to ${cohereResults.length} candidates`);

    // Log top Cohere scores for debugging
    const topThree = cohereResults.slice(0, 3);
    console.log(`[Stage 4.5] Top 3 by Cohere: ${topThree.map(r => `${r.first_name} ${r.last_name} (${(r.relevanceScore * 100).toFixed(1)}%)`).join(', ')}`);
  } catch (error) {
    console.warn(`[Stage 4.5] Cohere rerank failed, using preliminary scores:`, error);
    // Fallback: just use the top by preliminary score
    rerankedCandidateIds = new Set(topForCohere.slice(0, CONFIG.cohere_rerank_output_limit).map(c => c.candidate.id));
  }

  // Filter scored candidates to only those that passed Cohere reranking
  const afterCohereRerank = scoredCandidates.filter(c => rerankedCandidateIds.has(c.candidate.id));

  // ============ STAGE 5: AI RE-RANKING FOR TOP 15 ============
  const topForAI = afterCohereRerank.slice(0, CONFIG.ai_rerank_limit);

  console.log(`[Stage 5] AI re-ranking top ${topForAI.length} candidates...`);

  // Pass private notes AND extracted requirements to AI for context
  // AI compares full candidate profiles against all job requirements
  const aiResults = await aiRerankTopCandidates(
    topForAI.map(c => ({ candidate: c.candidate, preliminaryScore: c.preliminaryScore })),
    job as Job,
    effectivePrivateNotes,
    extractedReqs
  );

  // Build final results
  const results: MatchResult[] = topForAI.map(scored => {
    const ai = aiResults.get(scored.candidate.id) || {
      aiScore: 5,
      summary: 'AI assessment unavailable',
      strengths: [],
      concerns: [],
    };

    // AI assessment is 10 points
    scored.breakdown.aiAssessment = ai.aiScore;

    const totalScore =
      scored.breakdown.qualifications +
      scored.breakdown.experience +
      scored.breakdown.skills +
      scored.breakdown.availability +
      scored.breakdown.preferences +
      scored.breakdown.verification +
      scored.breakdown.aiAssessment;

    return {
      candidateId: scored.candidate.id,
      candidate: scored.candidate,
      score: totalScore,
      breakdown: scored.breakdown,
      strengths: [...scored.strengths, ...ai.strengths],
      concerns: [...scored.concerns, ...ai.concerns],
      aiSummary: ai.summary,
    };
  });

  // Final sort by total score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  buildJobEmbeddingText,
  buildCandidateEmbeddingText,
  generateEmbedding,
  applyHardFilters,
  calculateScores,
  getAIAssessments,
  CONFIG as MATCHING_CONFIG,
};

// Re-export candidate-job-matcher for AI-powered job matching
export * from "./candidate-job-matcher";

// Re-export job brief analyzer for parsing any format of job brief
export {
  analyzeJobBrief,
  analyzeJobBriefSafe,
  type ExtractedRequirements,
  type JobBriefInput,
} from "./job-brief-analyzer";