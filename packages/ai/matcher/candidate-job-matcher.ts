// ============================================================================
// CANDIDATE-JOB MATCHER - AI-Powered Job Matching for Candidates
// ============================================================================
// Matches candidates against jobs (reverse of job-to-candidate matching)
// Supports BOTH yacht crew AND household/land-based positions
// ============================================================================

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { embed, generateObject } from 'ai';
import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { normalizePosition } from './position-normalization';

// ============================================================================
// TYPES
// ============================================================================

export type JobIndustry = 'yacht' | 'household';

export interface CandidateProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;

  // Positions (dual-track)
  primary_position?: string;
  yacht_primary_position?: string;
  yacht_secondary_positions?: string[];
  household_primary_position?: string;
  household_secondary_positions?: string[];
  secondary_positions?: string[];

  // Experience
  years_experience?: number;

  // Yacht preferences
  preferred_yacht_types?: string[];
  preferred_yacht_size_min?: number;
  preferred_yacht_size_max?: number;
  preferred_regions?: string[];
  preferred_contract_types?: string[];
  preferred_leave_package?: string;

  // Household preferences
  household_locations?: string[];
  living_arrangement?: 'live_in' | 'live_out' | 'flexible';

  // Salary
  desired_salary_min?: number;
  desired_salary_max?: number;
  salary_currency?: string;

  // Availability
  availability_status?: 'available' | 'looking' | 'employed' | 'unavailable';
  available_from?: string;

  // Certifications
  has_stcw?: boolean;
  stcw_expiry?: string;
  has_eng1?: boolean;
  eng1_expiry?: string;
  highest_license?: string;
  certifications?: Array<{ name: string; expiry_date?: string }>;

  // Visas
  has_schengen?: boolean;
  has_b1b2?: boolean;
  has_c1d?: boolean;
  other_visas?: string[];

  // Personal
  nationality?: string;
  second_nationality?: string;
  is_smoker?: boolean;
  has_visible_tattoos?: boolean;
  is_couple?: boolean;
  partner_position?: string;
  languages?: string[];
  has_driving_license?: boolean;

  // Verification
  verification_tier?: 'basic' | 'identity' | 'verified' | 'premium';

  // AI fields
  embedding?: number[];
  profile_summary?: string;
  bio?: string;
}

export interface PublicJob {
  id: string;
  title: string;
  description?: string;
  position_category?: string;

  // Vessel (yacht jobs)
  vessel_type?: string;
  vessel_size_meters?: number;
  vessel_name?: string;

  // Location
  primary_region?: string;
  location?: string;

  // Contract
  contract_type?: string;
  start_date?: string;
  rotation?: string;

  // Salary
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;  // 'monthly' | 'yearly'

  // Requirements
  requirements?: string[];
  requirements_text?: string;
  experience_years_min?: number;
  certifications_required?: string[];
  visas_required?: string[];
  languages_required?: string[];
  non_smoker?: boolean;
  no_visible_tattoos?: boolean;
  couple_acceptable?: boolean;

  // Household specific
  living_arrangement?: string;

  // Status
  status?: string;
  is_public?: boolean;
}

export interface JobMatchResult {
  job: PublicJob;
  matchScore: number; // 0-100
  breakdown: MatchScoreBreakdown;
  strengths: string[];
  concerns: string[];
  aiSummary?: string;
  canQuickApply: boolean;
  hasApplied: boolean;
  industry: JobIndustry;
}

export interface MatchScoreBreakdown {
  position: number;      // 25 points max
  experience: number;    // 20 points max
  preferences: number;   // 25 points max
  availability: number;  // 15 points max
  qualifications: number; // 15 points max
}

export interface CandidateJobMatchOptions {
  limit?: number;
  minScore?: number;
  includeAISummary?: boolean;
  industry?: JobIndustry | 'both';
  candidateId: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Scoring weights (must sum to 100)
  weights: {
    position: 25,
    experience: 20,
    preferences: 25,
    availability: 15,
    qualifications: 15,
  },

  // Vector search
  vectorSearchLimit: 100,
  vectorSimilarityThreshold: 0.25,

  // AI re-ranking
  aiRerankLimit: 20,

  // Output
  defaultResultsLimit: 10,
  defaultMinScore: 30,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse PostgreSQL array string format (e.g., "{value1,value2}") to array
 */
function parsePostgresArray(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  // Handle "{value1,value2}" format from PostgreSQL
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    const inner = value.slice(1, -1);
    if (!inner) return [];
    return inner.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [value];
}

/**
 * Extract the core position from complex job titles
 * Examples:
 * - "Experienced stew - service" → "stewardess"
 * - "Junior Deckhand - Caribbean" → "deckhand"
 * - "Head Chef - Rotational" → "chef"
 * - "Second stew / Lead stew" → "stewardess" (takes first valid position)
 */
function extractPositionFromTitle(title: string): string {
  if (!title) return '';

  // Known positions for validation
  const knownPositions = new Set([
    'stewardess', 'deckhand', 'chef', 'captain', 'engineer', 'bosun', 'purser', 'cook',
    'chief_stewardess', 'second_stewardess', 'third_stewardess',
    'chief_engineer', 'second_engineer', 'third_engineer',
    'first_officer', 'second_officer', 'third_officer',
    'head_chef', 'sous_chef', 'private_chef',
    'butler', 'housekeeper', 'head_housekeeper', 'nanny', 'personal_assistant',
    'chauffeur', 'security', 'gardener', 'estate_manager', 'house_manager',
    'eto', 'lead_deckhand', 'governess', 'laundress', 'maintenance'
  ]);

  let cleaned = title
    .toLowerCase()
    // Remove experience level prefixes
    .replace(/^(experienced|junior|senior|lead|sole|relief|trainee|assistant|head|chief|1st|2nd|3rd|first|second|third)\s+/i, '')
    // Remove suffixes after dash/hyphen (location, contract type, etc.)
    .replace(/\s*[-–—]\s*(land\s*based|service|yacht|rotation|rotational|permanent|temporary|seasonal|live[\s-]?(in|out)|based.*|caribbean|med.*|worldwide|uae|europe.*)$/i, '')
    // Remove parenthetical content
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim();

  // Handle titles with "/" separator (e.g., "Second stew / Lead stew", "Yoga / Pilates / Stew")
  // Try each part and return the first one that normalizes to a known position
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').map(p => p.trim());
    for (const part of parts) {
      // Clean each part of experience prefixes
      const cleanedPart = part
        .replace(/^(experienced|junior|senior|lead|sole|relief|trainee|assistant|head|chief|1st|2nd|3rd|first|second|third)\s+/i, '')
        .trim();
      const normalized = normalizePosition(cleanedPart);
      // Check if it's a recognized position
      if (knownPositions.has(normalized)) {
        return normalized;
      }
    }
  }

  return normalizePosition(cleaned);
}

/**
 * Region groups for semantic matching
 * Allows "Nice" to match "Med" and "South Africa" to match "Africa/Worldwide"
 */
const REGION_GROUPS: Record<string, string[]> = {
  mediterranean: [
    'med', 'mediterranean', 'france', 'french riviera', 'spain', 'spanish', 'italy', 'italian',
    'greece', 'greek', 'croatia', 'croatian', 'monaco', 'nice', 'antibes', 'cannes', 'saint tropez',
    'palma', 'mallorca', 'ibiza', 'sardinia', 'amalfi', 'capri', 'sicily', 'cote d\'azur',
    'south of france', 'balearic', 'adriatic', 'aegean', 'turkey', 'turkish riviera',
    'montenegro', 'malta', 'cyprus', 'eastern med', 'western med'
  ],
  caribbean: [
    'caribbean', 'bahamas', 'st barts', 'saint barts', 'antigua', 'virgin islands', 'bvi', 'usvi',
    'st martin', 'saint martin', 'turks', 'caicos', 'jamaica', 'barbados', 'grenada',
    'st lucia', 'saint lucia', 'martinique', 'guadeloupe', 'aruba', 'curacao', 'bonaire',
    'cayman', 'puerto rico', 'dominican', 'florida', 'miami', 'fort lauderdale', 'palm beach'
  ],
  usa: [
    'usa', 'united states', 'america', 'american', 'florida', 'miami', 'fort lauderdale',
    'newport', 'new england', 'seattle', 'san diego', 'los angeles', 'california',
    'east coast', 'west coast', 'pacific northwest'
  ],
  middle_east: [
    'uae', 'dubai', 'abu dhabi', 'qatar', 'doha', 'saudi', 'bahrain', 'oman', 'muscat',
    'middle east', 'arabian', 'gulf', 'red sea', 'persian gulf'
  ],
  asia_pacific: [
    'asia', 'pacific', 'thailand', 'phuket', 'indonesia', 'bali', 'malaysia', 'singapore',
    'hong kong', 'japan', 'australia', 'new zealand', 'fiji', 'tahiti', 'maldives',
    'seychelles', 'indian ocean', 'far east', 'south east asia'
  ],
  northern_europe: [
    'uk', 'united kingdom', 'britain', 'england', 'scotland', 'wales', 'ireland',
    'netherlands', 'holland', 'amsterdam', 'germany', 'norway', 'norwegian', 'sweden',
    'denmark', 'baltic', 'north sea', 'scandinavia', 'northern europe', 'europe'
  ],
  africa: [
    'africa', 'south africa', 'cape town', 'durban', 'namibia', 'mozambique',
    'kenya', 'tanzania', 'zanzibar', 'mauritius', 'madagascar'
  ]
};

/**
 * Check if job region matches any of candidate's preferred regions
 * Uses semantic grouping for better matching (e.g., "Nice" matches "Med Based")
 */
function regionsMatch(jobRegion: string | null | undefined, candidateRegions: string[] | null | undefined): boolean {
  if (!jobRegion || !candidateRegions || candidateRegions.length === 0) return false;

  const jobNorm = jobRegion.toLowerCase();
  const candidateNorms = candidateRegions.map(r => r.toLowerCase());

  // "Worldwide" or "Dual season" jobs match any candidate preference
  if (jobNorm.includes('worldwide') || jobNorm.includes('dual season') || jobNorm.includes('global')) {
    return true;
  }

  // Direct substring match (e.g., "Caribbean" in "Caribbean based")
  if (candidateNorms.some(r => jobNorm.includes(r) || r.includes(jobNorm))) {
    return true;
  }

  // Semantic group matching
  for (const keywords of Object.values(REGION_GROUPS)) {
    const jobInGroup = keywords.some(k => jobNorm.includes(k));
    const candidateInGroup = candidateNorms.some(cr => keywords.some(k => cr.includes(k)));
    if (jobInGroup && candidateInGroup) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// INDUSTRY DETECTION
// ============================================================================

const YACHT_POSITIONS = [
  'captain', 'officer', 'mate', 'bosun', 'deckhand', 'deck',
  'engineer', 'eto',
  'steward', 'stew', 'chief_stew', 'purser', 'interior',
  'chef', 'cook', 'galley',
];

const HOUSEHOLD_POSITIONS = [
  'butler', 'housekeeper', 'nanny', 'estate_manager', 'house_manager',
  'chauffeur', 'driver', 'personal_assistant', 'pa', 'governess',
  'estate_couple', 'household_couple', 'gardener', 'security', 'bodyguard',
];

export function detectJobIndustry(job: PublicJob): JobIndustry {
  // Explicit vessel info = yacht
  if (job.vessel_type || job.vessel_size_meters || job.vessel_name) {
    return 'yacht';
  }

  const category = (job.position_category || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const combined = `${category} ${title}`;

  // Check for household positions
  if (HOUSEHOLD_POSITIONS.some(p => combined.includes(p))) {
    return 'household';
  }

  // Check for yacht positions
  if (YACHT_POSITIONS.some(p => combined.includes(p))) {
    return 'yacht';
  }

  // Default to yacht (the primary business)
  return 'yacht';
}

// ============================================================================
// POSITION MATCHING
// ============================================================================

function getCandidatePositions(candidate: CandidateProfile, industry: JobIndustry): string[] {
  const positions: string[] = [];

  if (industry === 'yacht') {
    if (candidate.yacht_primary_position) {
      positions.push(candidate.yacht_primary_position);
    }
    if (candidate.yacht_secondary_positions?.length) {
      positions.push(...candidate.yacht_secondary_positions);
    }
  } else {
    if (candidate.household_primary_position) {
      positions.push(candidate.household_primary_position);
    }
    if (candidate.household_secondary_positions?.length) {
      positions.push(...candidate.household_secondary_positions);
    }
  }

  // Fallback to generic positions
  if (positions.length === 0) {
    if (candidate.primary_position) {
      positions.push(candidate.primary_position);
    }
    if (candidate.secondary_positions?.length) {
      positions.push(...candidate.secondary_positions);
    }
  }

  return positions;
}

function scorePositionMatch(candidate: CandidateProfile, job: PublicJob, industry: JobIndustry): { score: number; details: string[] } {
  const candidatePositions = getCandidatePositions(candidate, industry);
  // Use extractPositionFromTitle to handle complex job titles like "Experienced stew - service"
  const jobPosition = extractPositionFromTitle(job.position_category || job.title);
  const details: string[] = [];

  if (candidatePositions.length === 0) {
    return { score: 0, details: ['No position specified in profile'] };
  }

  // Normalize all candidate positions
  const normalizedCandidatePositions = candidatePositions.map(normalizePosition);

  // Exact primary position match = full points
  if (normalizedCandidatePositions[0] === jobPosition) {
    details.push(`Primary position matches: ${candidatePositions[0]}`);
    return { score: CONFIG.weights.position, details };
  }

  // Check if any normalized candidate position matches the job position
  if (normalizedCandidatePositions.includes(jobPosition)) {
    const matchIndex = normalizedCandidatePositions.indexOf(jobPosition);
    if (matchIndex === 0) {
      details.push(`Primary position matches: ${candidatePositions[0]}`);
      return { score: CONFIG.weights.position, details };
    } else {
      // Secondary position match = 70% points
      details.push(`Secondary position matches: ${job.position_category || job.title}`);
      return { score: Math.round(CONFIG.weights.position * 0.7), details };
    }
  }

  // Same department = 40% points
  const departments = {
    deck: ['captain', 'officer', 'mate', 'bosun', 'deckhand', 'deck', 'first_officer', 'second_officer', 'third_officer', 'lead_deckhand'],
    interior: ['steward', 'stew', 'chief_stew', 'chief_stewardess', 'purser', 'interior', 'stewardess', 'second_stewardess', 'third_stewardess'],
    engineering: ['engineer', 'eto', 'engine', 'chief_engineer', 'second_engineer', 'third_engineer'],
    galley: ['chef', 'cook', 'galley', 'head_chef', 'sous_chef', 'private_chef'],
    household: ['butler', 'housekeeper', 'nanny', 'house_manager', 'estate_manager', 'head_housekeeper', 'personal_assistant', 'chauffeur', 'security', 'gardener', 'governess'],
  };

  for (const [dept, positions] of Object.entries(departments)) {
    const candidateInDept = normalizedCandidatePositions.some(p =>
      positions.some(dp => p.includes(dp) || dp.includes(p))
    );
    const jobInDept = positions.some(dp => jobPosition.includes(dp) || dp.includes(jobPosition));

    if (candidateInDept && jobInDept) {
      details.push(`Same department: ${dept}`);
      return { score: Math.round(CONFIG.weights.position * 0.4), details };
    }
  }

  details.push('Position does not match');
  return { score: 0, details };
}

// ============================================================================
// EXPERIENCE SCORING
// ============================================================================

function scoreExperience(candidate: CandidateProfile, job: PublicJob, industry: JobIndustry): { score: number; details: string[] } {
  const details: string[] = [];
  let score = 0;

  const candidateYears = candidate.years_experience || 0;
  const requiredYears = job.experience_years_min || 0;

  // Years of experience (12 points)
  if (requiredYears > 0) {
    if (candidateYears >= requiredYears) {
      score += 12;
      if (candidateYears >= requiredYears + 3) {
        details.push(`Exceeds experience requirement: ${candidateYears} years (${requiredYears}+ required)`);
      } else {
        details.push(`Meets experience requirement: ${candidateYears} years`);
      }
    } else if (candidateYears >= requiredYears - 1) {
      score += 6;
      details.push(`Close to experience requirement: ${candidateYears} years (${requiredYears} required)`);
    } else {
      details.push(`Below experience requirement: ${candidateYears} years (${requiredYears} required)`);
    }
  } else {
    // No requirement - give partial credit based on experience
    score += Math.min(8, Math.floor(candidateYears / 2));
    if (candidateYears > 0) {
      details.push(`${candidateYears} years experience`);
    }
  }

  // Yacht-specific: vessel size experience (8 points)
  if (industry === 'yacht' && job.vessel_size_meters) {
    const minSize = candidate.preferred_yacht_size_min || 0;
    const maxSize = candidate.preferred_yacht_size_max || 999;

    if (job.vessel_size_meters >= minSize && job.vessel_size_meters <= maxSize) {
      score += 8;
      details.push(`Vessel size within preference: ${job.vessel_size_meters}m`);
    } else if (job.vessel_size_meters >= minSize - 15 && job.vessel_size_meters <= maxSize + 15) {
      score += 4;
      details.push(`Vessel size close to preference: ${job.vessel_size_meters}m`);
    }
  } else if (industry === 'household') {
    // Household: give points for relevant experience type
    score += 8; // Full points if household candidate
    details.push('Household/land-based experience applicable');
  }

  return { score: Math.min(score, CONFIG.weights.experience), details };
}

// ============================================================================
// PREFERENCES SCORING
// ============================================================================

function scorePreferences(candidate: CandidateProfile, job: PublicJob, industry: JobIndustry): { score: number; details: string[] } {
  const details: string[] = [];
  let score = 0;
  let factorsChecked = 0;
  let factorsMatched = 0;

  // --- REGION/LOCATION (7 points) ---
  if (industry === 'yacht' && job.primary_region) {
    factorsChecked++;
    // Use semantic region matching for better results
    const candidateRegions = parsePostgresArray(candidate.preferred_regions);

    if (regionsMatch(job.primary_region, candidateRegions)) {
      score += 7;
      factorsMatched++;
      details.push(`Region matches: ${job.primary_region}`);
    }
  } else if (industry === 'household' && job.location) {
    factorsChecked++;
    // Use semantic region matching for household locations too
    const candidateLocations = parsePostgresArray(candidate.household_locations);

    if (regionsMatch(job.location, candidateLocations)) {
      score += 7;
      factorsMatched++;
      details.push(`Location matches: ${job.location}`);
    }
  }

  // --- CONTRACT TYPE (5 points) ---
  // Parse contract types handling PostgreSQL array format
  const candidateContracts = parsePostgresArray(candidate.preferred_contract_types);
  if (job.contract_type && candidateContracts.length > 0) {
    factorsChecked++;
    const jobContract = job.contract_type.toLowerCase();
    const normalizedContracts = candidateContracts.map(c => c.toLowerCase());

    if (normalizedContracts.includes(jobContract) ||
        normalizedContracts.some(c => jobContract.includes(c) || c.includes(jobContract))) {
      score += 5;
      factorsMatched++;
      details.push(`Contract type matches: ${job.contract_type}`);
    }
  }

  // --- SALARY (8 points) ---
  if (job.salary_min || job.salary_max) {
    factorsChecked++;
    const jobMin = job.salary_min || 0;
    const jobMax = job.salary_max || Infinity;
    const candMin = candidate.desired_salary_min || 0;
    const candMax = candidate.desired_salary_max || Infinity;

    // Check salary overlap
    if (jobMax >= candMin && jobMin <= candMax) {
      score += 8;
      factorsMatched++;
      details.push('Salary within expectations');
    } else if (jobMax >= candMin * 0.85) {
      score += 4;
      factorsMatched += 0.5;
      details.push('Salary slightly below expectations');
    } else {
      details.push('Salary below expectations');
    }
  }

  // --- VESSEL TYPE (yacht only, 3 points) ---
  const candidateVessels = parsePostgresArray(candidate.preferred_yacht_types);
  if (industry === 'yacht' && job.vessel_type && candidateVessels.length > 0) {
    factorsChecked++;
    const jobVessel = job.vessel_type.toLowerCase();
    const normalizedVessels = candidateVessels.map(v => v.toLowerCase());

    if (normalizedVessels.some(v => jobVessel.includes(v) || v.includes(jobVessel))) {
      score += 3;
      factorsMatched++;
      details.push(`Vessel type preferred: ${job.vessel_type}`);
    }
  }

  // --- LIVING ARRANGEMENT (household only, 3 points) ---
  if (industry === 'household' && job.living_arrangement && candidate.living_arrangement) {
    factorsChecked++;
    if (
      candidate.living_arrangement === 'flexible' ||
      candidate.living_arrangement === job.living_arrangement
    ) {
      score += 3;
      factorsMatched++;
      details.push(`Living arrangement compatible: ${job.living_arrangement}`);
    }
  }

  // --- ROTATION/LEAVE (yacht only, 2 points) ---
  if (industry === 'yacht' && job.rotation && candidate.preferred_leave_package) {
    // Basic match check
    factorsChecked++;
    score += 2; // Give points for having preference set
    factorsMatched++;
  }

  // If no factors to compare, give higher partial credit (70% instead of 50%)
  // "No data to compare" should not heavily penalize the score
  if (factorsChecked === 0) {
    score = Math.round(CONFIG.weights.preferences * 0.7);
    details.push('Limited preference data available');
  }

  return { score: Math.min(score, CONFIG.weights.preferences), details };
}

// ============================================================================
// AVAILABILITY SCORING
// ============================================================================

function scoreAvailability(candidate: CandidateProfile, job: PublicJob): { score: number; details: string[] } {
  const details: string[] = [];
  let score = 0;

  // Availability status (10 points)
  const status = candidate.availability_status;
  if (status === 'available') {
    score += 10;
    details.push('Immediately available');
  } else if (status === 'looking') {
    score += 8;
    details.push('Actively looking');
  } else if (status === 'employed') {
    score += 4;
    details.push('Currently employed but open');
  } else {
    details.push('Not currently available');
  }

  // Start date alignment (5 points)
  if (job.start_date && candidate.available_from) {
    const jobStart = new Date(job.start_date);
    const candAvailable = new Date(candidate.available_from);

    if (candAvailable <= jobStart) {
      score += 5;
      details.push('Available by start date');
    } else {
      const daysLate = Math.floor((candAvailable.getTime() - jobStart.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLate <= 14) {
        score += 3;
        details.push(`Available within 2 weeks of start`);
      } else if (daysLate <= 30) {
        score += 1;
        details.push('Available within month of start');
      } else {
        details.push('Not available by start date');
      }
    }
  } else if (!job.start_date) {
    // No specific start date requirement
    score += 3;
  }

  return { score: Math.min(score, CONFIG.weights.availability), details };
}

// ============================================================================
// QUALIFICATIONS SCORING
// ============================================================================

function scoreQualifications(candidate: CandidateProfile, job: PublicJob, industry: JobIndustry): { score: number; details: string[] } {
  const details: string[] = [];
  let score = 0;

  if (industry === 'yacht') {
    // STCW (4 points)
    if (job.certifications_required?.some(c => c.toUpperCase().includes('STCW'))) {
      if (candidate.has_stcw) {
        score += 4;
        details.push('Has required STCW');
      } else {
        details.push('Missing required STCW');
      }
    } else if (candidate.has_stcw) {
      score += 3;
      details.push('Has STCW certification');
    }

    // ENG1 (4 points)
    if (job.certifications_required?.some(c => c.toUpperCase().includes('ENG1'))) {
      if (candidate.has_eng1) {
        score += 4;
        details.push('Has required ENG1');
      } else {
        details.push('Missing required ENG1');
      }
    } else if (candidate.has_eng1) {
      score += 3;
      details.push('Has ENG1 medical');
    }

    // License (3 points)
    if (candidate.highest_license) {
      score += 3;
      details.push(`License: ${candidate.highest_license}`);
    }

    // Visas (4 points)
    if (job.visas_required?.length) {
      let visaScore = 0;
      for (const visa of job.visas_required) {
        const visaUpper = visa.toUpperCase();
        if (visaUpper.includes('SCHENGEN') && candidate.has_schengen) visaScore += 2;
        if ((visaUpper.includes('B1') || visaUpper.includes('B2')) && candidate.has_b1b2) visaScore += 2;
      }
      score += Math.min(visaScore, 4);
      if (visaScore > 0) {
        details.push('Has required visas');
      }
    }
  } else {
    // Household qualifications
    // Languages (5 points)
    if (job.languages_required?.length && candidate.languages?.length) {
      const candidateLangs = candidate.languages.map(l => l.toLowerCase());
      const requiredLangs = job.languages_required.map(l => l.toLowerCase());
      const matchedLangs = requiredLangs.filter(l =>
        candidateLangs.some(cl => cl.includes(l) || l.includes(cl))
      );
      if (matchedLangs.length === requiredLangs.length) {
        score += 5;
        details.push('Speaks all required languages');
      } else if (matchedLangs.length > 0) {
        score += 3;
        details.push(`Speaks ${matchedLangs.length}/${requiredLangs.length} required languages`);
      }
    } else if (candidate.languages?.length) {
      score += 3;
      details.push(`Languages: ${candidate.languages.slice(0, 3).join(', ')}`);
    }

    // Driving license (3 points for household)
    if (candidate.has_driving_license) {
      score += 3;
      details.push('Has driving license');
    }

    // Verification tier (4 points)
    if (candidate.verification_tier === 'premium') {
      score += 4;
      details.push('Premium verified');
    } else if (candidate.verification_tier === 'verified') {
      score += 3;
      details.push('Identity verified');
    } else if (candidate.verification_tier === 'identity') {
      score += 2;
    }
  }

  return { score: Math.min(score, CONFIG.weights.qualifications), details };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

export function calculateJobMatchScore(
  candidate: CandidateProfile,
  job: PublicJob
): { score: number; breakdown: MatchScoreBreakdown; strengths: string[]; concerns: string[] } {
  const industry = detectJobIndustry(job);

  const positionResult = scorePositionMatch(candidate, job, industry);
  const experienceResult = scoreExperience(candidate, job, industry);
  const preferencesResult = scorePreferences(candidate, job, industry);
  const availabilityResult = scoreAvailability(candidate, job);
  const qualificationsResult = scoreQualifications(candidate, job, industry);

  const breakdown: MatchScoreBreakdown = {
    position: positionResult.score,
    experience: experienceResult.score,
    preferences: preferencesResult.score,
    availability: availabilityResult.score,
    qualifications: qualificationsResult.score,
  };

  const totalScore =
    breakdown.position +
    breakdown.experience +
    breakdown.preferences +
    breakdown.availability +
    breakdown.qualifications;

  // Collect strengths (positive details)
  const strengths: string[] = [];
  const concerns: string[] = [];

  const allDetails = [
    ...positionResult.details,
    ...experienceResult.details,
    ...preferencesResult.details,
    ...availabilityResult.details,
    ...qualificationsResult.details,
  ];

  for (const detail of allDetails) {
    const lowerDetail = detail.toLowerCase();
    if (
      lowerDetail.includes('matches') ||
      lowerDetail.includes('meets') ||
      lowerDetail.includes('exceeds') ||
      lowerDetail.includes('has ') ||
      lowerDetail.includes('available') ||
      lowerDetail.includes('verified') ||
      lowerDetail.includes('speaks')
    ) {
      strengths.push(detail);
    } else if (
      lowerDetail.includes('missing') ||
      lowerDetail.includes('below') ||
      lowerDetail.includes('not ') ||
      lowerDetail.includes('does not')
    ) {
      concerns.push(detail);
    }
  }

  return {
    score: Math.round(totalScore),
    breakdown,
    strengths: strengths.slice(0, 5),
    concerns: concerns.slice(0, 3),
  };
}

// ============================================================================
// AI RE-RANKING
// ============================================================================

const jobMatchRankingSchema = z.object({
  rankings: z.array(z.object({
    jobId: z.string(),
    aiScore: z.number().min(0).max(100),
    summary: z.string(),
    additionalStrengths: z.array(z.string()),
    additionalConcerns: z.array(z.string()),
  })),
});

async function aiRerankJobMatches(
  candidate: CandidateProfile,
  jobs: Array<{ job: PublicJob; preliminaryScore: number }>,
): Promise<Map<string, { aiScore: number; summary: string; strengths: string[]; concerns: string[] }>> {
  const candidateSummary = `
Position: ${candidate.yacht_primary_position || candidate.household_primary_position || candidate.primary_position || 'Not specified'}
Experience: ${candidate.years_experience || 0} years
Availability: ${candidate.availability_status}
${candidate.preferred_regions?.length ? `Preferred regions: ${candidate.preferred_regions.join(', ')}` : ''}
${candidate.household_locations?.length ? `Preferred locations: ${candidate.household_locations.join(', ')}` : ''}
${candidate.bio ? `Bio: ${candidate.bio.substring(0, 500)}...` : ''}
  `.trim();

  const jobsSummary = jobs.map((j, i) => `
[${i + 1}] ID: ${j.job.id}
Title: ${j.job.title}
${j.job.vessel_type ? `Vessel: ${j.job.vessel_type} ${j.job.vessel_size_meters ? `(${j.job.vessel_size_meters}m)` : ''}` : ''}
${j.job.primary_region ? `Region: ${j.job.primary_region}` : ''}
${j.job.location ? `Location: ${j.job.location}` : ''}
Contract: ${j.job.contract_type || 'Not specified'}
Salary: ${j.job.salary_min ? `${j.job.salary_min}-${j.job.salary_max}` : 'Not specified'}
Preliminary score: ${j.preliminaryScore}
`).join('\n');

  try {
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-20250514'),
      schema: jobMatchRankingSchema,
      system: `You are an expert yacht and household crew recruitment specialist.
Evaluate how well these jobs match this candidate's profile and preferences.
Consider not just hard requirements but also career fit, lifestyle alignment, and growth potential.
Be realistic - a 90+ score should only be for exceptional matches.`,
      prompt: `Candidate Profile:
${candidateSummary}

Jobs to evaluate:
${jobsSummary}

For each job, provide:
1. An AI score (0-100) based on overall fit
2. A 1-2 sentence summary explaining why this is/isn't a good match
3. Any additional strengths or concerns not captured in the preliminary score`,
    });

    const results = new Map<string, { aiScore: number; summary: string; strengths: string[]; concerns: string[] }>();
    for (const ranking of object.rankings) {
      results.set(ranking.jobId, {
        aiScore: ranking.aiScore,
        summary: ranking.summary,
        strengths: ranking.additionalStrengths,
        concerns: ranking.additionalConcerns,
      });
    }
    return results;
  } catch (error) {
    console.error('AI re-ranking failed:', error);
    return new Map();
  }
}

// ============================================================================
// MAIN MATCHING FUNCTION
// ============================================================================

export async function matchJobsForCandidate(
  supabase: SupabaseClient,
  options: CandidateJobMatchOptions
): Promise<{
  matches: JobMatchResult[];
  metadata: {
    totalJobsAnalyzed: number;
    processingTimeMs: number;
    candidateId: string;
  };
}> {
  const startTime = Date.now();
  const { candidateId, limit = CONFIG.defaultResultsLimit, minScore = CONFIG.defaultMinScore, includeAISummary = true, industry = 'both' } = options;

  // 1. Fetch candidate profile
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select(`
      id, first_name, last_name, email,
      primary_position, yacht_primary_position, yacht_secondary_positions,
      household_primary_position, household_secondary_positions, secondary_positions,
      years_experience,
      preferred_yacht_types, preferred_yacht_size_min, preferred_yacht_size_max,
      preferred_regions, preferred_contract_types,
      household_locations, living_arrangement,
      desired_salary_min, desired_salary_max, salary_currency,
      availability_status, available_from,
      has_stcw, stcw_expiry, has_eng1, eng1_expiry, highest_license,
      has_schengen, has_b1b2, has_c1d,
      nationality, second_nationality,
      is_smoker, has_visible_tattoos, is_couple, partner_position,
      verification_tier, embedding
    `)
    .eq('id', candidateId)
    .single();

  if (candidateError || !candidate) {
    throw new Error(`Candidate not found: ${candidateId}`);
  }

  // 2. Fetch public jobs (public_jobs table already contains only published public jobs)
  let jobsQuery = supabase
    .from('public_jobs')
    .select('*')
    .limit(CONFIG.vectorSearchLimit);

  const { data: jobs, error: jobsError } = await jobsQuery;

  if (jobsError || !jobs) {
    console.error('Error fetching jobs:', jobsError);
    return {
      matches: [],
      metadata: {
        totalJobsAnalyzed: 0,
        processingTimeMs: Date.now() - startTime,
        candidateId,
      },
    };
  }

  // 3. Check for existing applications
  const { data: applications } = await supabase
    .from('applications')
    .select('job_id')
    .eq('candidate_id', candidateId);

  const appliedJobIds = new Set((applications || []).map(a => a.job_id));

  // 4. Calculate match scores for each job
  const scoredJobs: Array<{
    job: PublicJob;
    score: number;
    breakdown: MatchScoreBreakdown;
    strengths: string[];
    concerns: string[];
    industry: JobIndustry;
    hasApplied: boolean;
  }> = [];

  for (const job of jobs) {
    const jobIndustry = detectJobIndustry(job);

    // Filter by industry if specified
    if (industry !== 'both' && jobIndustry !== industry) {
      continue;
    }

    const { score, breakdown, strengths, concerns } = calculateJobMatchScore(candidate as CandidateProfile, job);

    if (score >= minScore) {
      scoredJobs.push({
        job,
        score,
        breakdown,
        strengths,
        concerns,
        industry: jobIndustry,
        hasApplied: appliedJobIds.has(job.id),
      });
    }
  }

  // 5. Sort by score
  scoredJobs.sort((a, b) => b.score - a.score);

  // 6. AI re-ranking for top matches (if enabled)
  let aiResults = new Map<string, { aiScore: number; summary: string; strengths: string[]; concerns: string[] }>();

  if (includeAISummary && scoredJobs.length > 0) {
    const topJobs = scoredJobs.slice(0, CONFIG.aiRerankLimit);
    aiResults = await aiRerankJobMatches(
      candidate as CandidateProfile,
      topJobs.map(j => ({ job: j.job, preliminaryScore: j.score }))
    );

    // Re-sort based on combined score (50% rule-based, 50% AI)
    for (const job of topJobs) {
      const aiResult = aiResults.get(job.job.id);
      if (aiResult) {
        job.score = Math.round((job.score + aiResult.aiScore) / 2);
        job.strengths = [...job.strengths, ...aiResult.strengths].slice(0, 5);
        job.concerns = [...job.concerns, ...aiResult.concerns].slice(0, 3);
      }
    }

    topJobs.sort((a, b) => b.score - a.score);

    // Merge back
    for (let i = 0; i < Math.min(topJobs.length, scoredJobs.length); i++) {
      scoredJobs[i] = topJobs[i];
    }
  }

  // 7. Build final results
  const matches: JobMatchResult[] = scoredJobs.slice(0, limit).map(j => {
    const aiResult = aiResults.get(j.job.id);
    return {
      job: j.job,
      matchScore: j.score,
      breakdown: j.breakdown,
      strengths: j.strengths,
      concerns: j.concerns,
      aiSummary: aiResult?.summary,
      canQuickApply: true, // Will be validated by the API
      hasApplied: j.hasApplied,
      industry: j.industry,
    };
  });

  return {
    matches,
    metadata: {
      totalJobsAnalyzed: jobs.length,
      processingTimeMs: Date.now() - startTime,
      candidateId,
    },
  };
}

// ============================================================================
// PROFILE COMPLETENESS CHECK
// ============================================================================

export interface ProfileCompletenessResult {
  completeness: number; // 0-100
  canQuickApply: boolean;
  missingFields: string[];
  requiredFields: string[];
}

export function checkProfileCompleteness(candidate: CandidateProfile): ProfileCompletenessResult {
  // Match the same fields and scoring as calculateProfileCompletion
  // Core required fields for job matching
  const missingFields: string[] = [];
  let score = 0;

  // Personal Info (20%): 4% per field (5 fields = 20%)
  const personalFields = [
    { field: 'first_name', label: 'first name', points: 4 },
    { field: 'last_name', label: 'last name', points: 4 },
    { field: 'email', label: 'email', points: 4 },
    { field: 'phone', label: 'phone', points: 4 },
    { field: 'nationality', label: 'nationality', points: 4 },
  ];

  personalFields.forEach(({ field, label, points }) => {
    const value = (candidate as any)[field];
    if (value && (typeof value === 'string' ? value.trim().length > 0 : true)) {
      score += points;
    } else {
      missingFields.push(label);
    }
  });

  // Professional Info (25%): candidateType (10%), position (15%)
  // Note: candidateType not in CandidateProfile interface, so we check position only
  // Position check (15%)
  const hasPosition = 
    (candidate.primary_position && candidate.primary_position.trim().length > 0) ||
    (candidate.yacht_primary_position && candidate.yacht_primary_position.trim().length > 0) ||
    (candidate.household_primary_position && candidate.household_primary_position.trim().length > 0);
  
  if (hasPosition) {
    score += 15;
  } else {
    missingFields.push('primary position');
  }

  // We can't check candidateType here, so we give 10% if position exists
  // This is a limitation of the CandidateProfile interface
  if (hasPosition) {
    score += 10; // Assume candidateType is set if position exists
  }

  // Availability (10%): availability_status
  if (candidate.availability_status && candidate.availability_status.trim().length > 0) {
    score += 10;
  } else {
    missingFields.push('availability status');
  }

  // Documents (20%): CV - not checked here, handled separately
  // Enhancement Fields (10%): dateOfBirth, currentLocation, avatarUrl - not critical for matching
  // Certifications (10%): STCW/ENG1 - not critical for matching
  // Preferences (15%): industryPreference - not critical for matching

  // Cap at 100%
  score = Math.min(100, score);

  // Calculate completeness percentage
  // Core required: Personal (20) + Professional (25) + Availability (10) + Documents (20) + Certifications (10) + Preferences (15) = 100%
  const completeness = Math.round(score);

  return {
    completeness,
    canQuickApply: completeness >= 70,
    missingFields,
    requiredFields: ['first_name', 'last_name', 'email', 'phone', 'nationality', 'position', 'availability_status'],
  };
}

// ============================================================================
// EXPORTED UTILITIES
// ============================================================================

/**
 * Exported region groups for semantic matching
 * Can be used by UI components for region selection and filtering
 */
export { REGION_GROUPS };

/**
 * Check if two regions match using semantic grouping
 * @param jobRegion - The job's primary region
 * @param candidateRegions - The candidate's preferred regions
 * @returns true if the regions match semantically
 */
export { regionsMatch };

/**
 * Parse PostgreSQL array string format
 * @param value - The value to parse (can be "{value1,value2}" format or array)
 * @returns Parsed array of strings
 */
export { parsePostgresArray };

/**
 * Extract the core position from a complex job title
 * @param title - The job title (e.g., "Experienced stew - service")
 * @returns Normalized position (e.g., "stewardess")
 */
export { extractPositionFromTitle };
