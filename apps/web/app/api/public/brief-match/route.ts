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
import { generateEmbedding, anonymizeBio, type ReferenceDetail } from '@lighthouse/ai';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// Fast model for generating candidate presentations (GPT-4o-mini - fast and high quality)
const presentationModel = openai('gpt-4o-mini');

// ----------------------------------------------------------------------------
// REQUEST VALIDATION
// ----------------------------------------------------------------------------

const briefMatchRequestSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  location: z.string().optional(),
  timeline: z.enum(['asap', '1-month', '3-months', 'flexible', '']).optional(),
  requirements: z.string().optional(),
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
  experience_years: number;
  rich_bio: string; // Detailed 3-5 sentence mini-resume (anonymized)
  career_highlights: string[]; // 3-4 bullet points of impressive achievements
  experience_summary: string; // Brief summary of work history scope
  // Structured work history (yacht + household positions)
  work_history: Array<{
    employer: string;      // Yacht name or property name
    position: string;
    duration: string;      // e.g., "18 months"
    dates: string;         // e.g., "Jan 2023 - Jun 2024"
    details?: string;      // e.g., "102m motor yacht" or "Private estate, Monaco"
  }>;
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
const MAX_RESULTS = 5;

// ----------------------------------------------------------------------------
// TYPE DEFINITIONS (moved up for use in recruiter assessment)
// ----------------------------------------------------------------------------

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

  // Parse yacht size
  let yachtSize: number | null = null;
  const sizePatterns = [
    /(\d+)\s*m\s*(?:\+|yacht|boat|vessel)?/i,
    /(\d+)\s*meter/i,
    /up to (\d+)\s*m/i,
    /(\d+)m\s*(?:motor|sail|vessel)/i,
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
  if ((isDeck && !candidateIsDeck && (candidateIsInterior || candidateIsGalley)) ||
      (isInterior && !candidateIsInterior && (candidateIsDeck || candidateIsEngineering)) ||
      (isEngineering && !candidateIsEngineering) ||
      (isGalley && !candidateIsGalley && (candidateIsDeck || candidateIsInterior))) {
    flags.career_mismatch = true;
    suitabilityScore *= 0.4;
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

    const { role, location, timeline, requirements } = parseResult.data;

    // Build search query for embedding
    const searchTerms = ROLE_SEARCH_TERMS[role] || [role.replace(/-/g, ' ')];
    const queryParts = [
      `Looking for: ${searchTerms[0]}`,
      location ? `Location: ${location}` : '',
      timeline ? `Timeline: ${timeline}` : '',
      requirements ? `Requirements: ${requirements}` : '',
    ].filter(Boolean);

    const searchQuery = queryParts.join('\n');

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

    // Search for matching candidates
    // We search by primary_position and use vector similarity
    // Query rich extracted data for compelling candidate descriptions
    const { data: candidates, error: searchError } = await supabase
      .from('candidates')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        primary_position,
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
        bio_full
      `)
      .is('deleted_at', null)
      .not('embedding', 'is', null)
      .limit(100); // Get a pool of candidates to filter

    if (searchError) {
      console.error('[Brief Match] Search error:', searchError);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Parse requirements for recruiter assessment
    const parsedRequirements = parseRequirementsText(requirements || '', searchTerms[0]);
    console.log('[Brief Match] Parsed requirements:', parsedRequirements);

    // Calculate vector similarity and recruiter suitability
    const candidatesWithScores = candidates
      .map((c) => {
        // Parse embedding
        let embedding: number[] | null = null;
        if (typeof c.embedding === 'string') {
          try {
            embedding = JSON.parse(c.embedding);
          } catch {
            return null;
          }
        } else if (Array.isArray(c.embedding)) {
          embedding = c.embedding;
        }

        if (!embedding || embedding.length === 0) return null;

        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        if (similarity < VECTOR_MATCH_THRESHOLD) return null;

        // Check if position matches any of the search terms
        const positionLower = c.primary_position?.toLowerCase() || '';
        const positionsHeldLower = (c.positions_held || []).map((p: string) => p.toLowerCase());
        const allPositions = [positionLower, ...positionsHeldLower];

        const positionMatch = searchTerms.some((term) =>
          allPositions.some((p) => p.includes(term.toLowerCase()))
        );

        // Boost score if position matches
        const vectorScore = positionMatch ? similarity * 1.2 : similarity;

        // =====================================================================
        // RECRUITER SUITABILITY ASSESSMENT
        // =====================================================================
        // This acts as an experienced recruiter, evaluating whether the candidate
        // would realistically take this job and be a good fit
        const recruiterAssessment = assessRecruiterSuitability(
          {
            years_experience: c.years_experience,
            primary_position: c.primary_position,
            positions_held: c.positions_held,
            yacht_experience_extracted: c.yacht_experience_extracted as YachtExperience[] | null,
            certifications_extracted: c.certifications_extracted as CertificationExtracted[] | null,
            licenses_extracted: c.licenses_extracted as LicenseExtracted[] | null,
            has_stcw: c.has_stcw,
            has_eng1: c.has_eng1,
          },
          parsedRequirements,
          searchTerms[0]
        );

        // Combine vector similarity with recruiter suitability
        // The suitability score acts as a multiplier (0.1-1.0)
        const combinedScore = Math.min(vectorScore, 1) * recruiterAssessment.suitability_score;

        // Log assessments for debugging (in development)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Brief Match] ${c.first_name} ${c.last_name}: vector=${vectorScore.toFixed(2)}, suitability=${recruiterAssessment.suitability_score.toFixed(2)}, combined=${combinedScore.toFixed(2)}, recommendation=${recruiterAssessment.recommendation}, reasoning="${recruiterAssessment.reasoning}"`);
        }

        return {
          ...c,
          similarity: combinedScore, // Now includes recruiter assessment
          vectorScore: Math.min(vectorScore, 1),
          recruiterAssessment,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      // Sort by combined score (vector × suitability)
      .sort((a, b) => b.similarity - a.similarity)
      // Take more candidates initially, then filter to top results
      .slice(0, MAX_RESULTS * 2)
      // Prefer candidates with 'strong' or 'suitable' recommendations
      .sort((a, b) => {
        const recOrder = { strong: 0, suitable: 1, consider: 2, unlikely: 3 };
        const recDiff = recOrder[a.recruiterAssessment.recommendation] - recOrder[b.recruiterAssessment.recommendation];
        if (recDiff !== 0) return recDiff;
        return b.similarity - a.similarity;
      })
      .slice(0, MAX_RESULTS);

    // Build search context for personalized matching explanations
    const searchContext = {
      role: searchTerms[0], // Use the normalized role from search terms
      location: location || '',
      timeline: timeline || '',
      requirements: requirements || '',
    };

    // =========================================================================
    // AI-POWERED CANDIDATE PRESENTATIONS
    // Generate compelling, personalized descriptions using Claude
    // =========================================================================
    console.log('[Brief Match] Generating AI presentations for', candidatesWithScores.length, 'candidates...');
    const aiStartTime = Date.now();

    // Generate AI presentations for all candidates in parallel
    const aiPresentations = await generateAIPresentationsForCandidates(
      candidatesWithScores,
      searchContext
    );

    console.log('[Brief Match] AI generation completed in', Date.now() - aiStartTime, 'ms');

    // Anonymize results with AI-generated content
    const anonymizedResults: AnonymizedCandidate[] = candidatesWithScores.map((c, index) => {
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

        // Generate structured work history
        const workHistory = generateWorkHistory(
          c.yacht_experience_extracted as YachtExperience[] | null,
          c.villa_experience_extracted as VillaExperience[] | null
        );

        // Use stored bio (anonymized) when available, otherwise fall back to AI generation
        const storedBioAnonymized = c.bio_full
          ? anonymizeBio(
              c.bio_full,
              c.first_name,
              c.last_name,
              c.nationality,
              c.primary_position,
              c.references_extracted as ReferenceDetail[] | null
            )
          : null;

        return {
          id: obfuscatedId,
          display_name: displayName,
          avatar_url: c.avatar_url || null,
          position: c.primary_position || 'Private Staff Professional',
          experience_years: c.years_experience || 0,
          // Use pre-generated bio (anonymized) or fall back to AI/static generation
          rich_bio: storedBioAnonymized || aiPresentation?.professional_summary || generateRichBio(c),
          career_highlights: aiPresentation?.career_highlights || generateCareerHighlights(c),
          experience_summary: experienceSummary,
          // Structured work history (yacht + household)
          work_history: workHistory,
          languages: langs,
          nationality: c.nationality || 'International',
          availability: avail,
          match_score: c.similarity,
          key_strengths: strengths,
          qualifications: qualifications,
          notable_employers: notableEmployers,
          // AI-generated personalized content
          why_good_fit: aiPresentation?.why_good_fit || generateWhyGoodFit(c, searchContext),
          employee_qualities: aiPresentation?.standout_qualities || extractEmployeeQualities(c),
          longevity_assessment: aiPresentation?.longevity_assessment || generateLongevityFallback(c),
        };
      } catch (mapError) {
        console.error('[Brief Match] Map error for candidate:', c.id, mapError);
        throw mapError;
      }
    });

    return NextResponse.json({
      candidates: anonymizedResults,
      total_found: candidatesWithScores.length,
      search_criteria: {
        role: searchTerms[0],
        location: location || 'Any',
        timeline: timeline || 'Flexible',
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
  if (a.length !== b.length) return 0;

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

// Unified work history entry for display
interface WorkHistoryEntry {
  employer: string;        // Yacht name or property name
  position: string;
  duration: string;        // e.g., "18 months" or "2 years"
  dates: string;           // e.g., "Jan 2023 - Jun 2024" or "2023"
  details?: string;        // e.g., "102m motor yacht" or "Private estate, Monaco"
}

// ----------------------------------------------------------------------------
// WORK HISTORY GENERATION
// Creates structured work history from yacht and villa experience
// ----------------------------------------------------------------------------

function formatDuration(months: number | null | undefined): string {
  if (!months || months <= 0) return '';
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}

function formatDateRange(startDate: string | null | undefined, endDate: string | null | undefined): string {
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return '';
    }
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (!start && !end) return '';
  if (!end || endDate === null) return start ? `${start} - Present` : '';
  if (!start) return end;
  return `${start} - ${end}`;
}

function generateWorkHistory(
  yachtExperience: YachtExperience[] | null | undefined,
  villaExperience: VillaExperience[] | null | undefined
): WorkHistoryEntry[] {
  const history: WorkHistoryEntry[] = [];

  // Process yacht experience
  const yachts = (yachtExperience || []) as YachtExperience[];
  for (const yacht of yachts) {
    const entry: WorkHistoryEntry = {
      employer: yacht.yacht_name || 'Yacht (name confidential)',
      position: yacht.position || 'Crew',
      duration: formatDuration(yacht.duration_months),
      dates: formatDateRange(yacht.start_date, yacht.end_date),
    };

    // Build details string
    const details: string[] = [];
    if (yacht.yacht_size_meters && yacht.yacht_size_meters > 0) {
      details.push(`${Math.round(yacht.yacht_size_meters)}m`);
    }
    if (yacht.yacht_type) {
      const typeMap: Record<string, string> = {
        'motor': 'motor yacht',
        'sail': 'sailing yacht',
        'catamaran': 'catamaran',
        'other': 'vessel'
      };
      details.push(typeMap[yacht.yacht_type] || yacht.yacht_type);
    }
    if (details.length > 0) {
      entry.details = details.join(' ');
    }

    history.push(entry);
  }

  // Process villa/household experience
  const villas = (villaExperience || []) as VillaExperience[];
  for (const villa of villas) {
    const entry: WorkHistoryEntry = {
      employer: villa.property_name || 'Private residence',
      position: villa.position || 'Household Staff',
      duration: formatDuration(villa.duration_months),
      dates: formatDateRange(villa.start_date, villa.end_date),
    };

    // Build details string
    const details: string[] = [];
    if (villa.property_type) {
      const typeMap: Record<string, string> = {
        'villa': 'Private villa',
        'estate': 'Estate',
        'private_residence': 'Private residence',
        'palace': 'Palace',
        'castle': 'Castle',
      };
      details.push(typeMap[villa.property_type] || villa.property_type);
    }
    if (villa.location && villa.location !== 'Not specified') {
      details.push(villa.location);
    }
    if (details.length > 0) {
      entry.details = details.join(', ');
    }

    history.push(entry);
  }

  // Sort by start date (most recent first)
  history.sort((a, b) => {
    // Extract year from dates string for sorting
    const getYear = (dates: string): number => {
      const match = dates.match(/(\d{4})/);
      return match ? parseInt(match[1]) : 0;
    };
    return getYear(b.dates) - getYear(a.dates);
  });

  return history;
}

// ----------------------------------------------------------------------------
// AI-POWERED CANDIDATE PRESENTATION GENERATION
// Using Claude to create compelling, personalized candidate descriptions
// ----------------------------------------------------------------------------

const aiPresentationSchema = z.object({
  professional_summary: z.string().describe('A factual 3-4 sentence professional summary in THIRD PERSON. State their experience level, yacht sizes worked, and key qualifications. Be specific with numbers and facts. NO superlatives like "exceptional", "outstanding", "impressive", "remarkable". Let the facts speak. Example: "A British deckhand with 5 years of experience across motor yachts up to 54m. Holds RYA Yachtmaster Offshore and STCW certifications. Previously served on charter yachts in the Mediterranean with responsibility for tender operations and guest water sports."'),
  why_good_fit: z.string().describe('A specific 2-3 sentence explanation of why THIS candidate matches the search criteria. Reference the exact role searched and how their experience aligns. Be concrete, not generic. Avoid phrases like "perfectly aligns" or "ideal candidate" - instead explain the specific match.'),
  career_highlights: z.array(z.string()).default([]).describe('3-4 bullet points of QUANTIFIABLE achievements. Each must include a number, size, duration, or specific outcome. Bad: "Worked on prestigious yachts" Good: "Managed tender operations for 45m yacht with 3 RIBs". Bad: "Excellent track record" Good: "4-year tenure on single vessel through 2 Med seasons".'),
  standout_qualities: z.array(z.string()).default([]).describe('2-3 SPECIFIC qualities backed by evidence from their CV. NOT generic phrases like "team player" or "strong work ethic". Each quality must reference something concrete. Example: "Trained 2 junior deckhands during last position" or "Speaks French and Italian fluently - valuable for Med charters" or "PADI Divemaster - can lead guest diving excursions".'),
  longevity_assessment: z.string().describe('1-2 factual sentences about tenure patterns. State the average and longest tenure with numbers. Be honest: short tenures are common in seasonal yachting. Example: "Average tenure of 14 months across 4 positions, with longest stint of 2 years on a 60m charter yacht." If tenure is short, note if positions were seasonal or daywork.'),
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
    languages_extracted?: Array<{ language: string; proficiency: string }> | null;
    highest_license?: string | null;
    availability_status?: string | null;
    has_stcw?: boolean;
    has_eng1?: boolean;
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
  };

  const { object } = await generateObject({
    model: presentationModel, // Using GPT-4o-mini for speed and quality
    schema: aiPresentationSchema,
    system: `You are a factual recruitment consultant presenting candidate profiles. Write in a professional, understated tone - let credentials and experience speak for themselves.

CRITICAL RULES:
1. ALWAYS use THIRD PERSON ("This deckhand has..." NOT "I am pleased to introduce...")
2. NEVER use superlatives: exceptional, outstanding, impressive, remarkable, excellent, stellar, exemplary, standout, premier
3. NEVER use filler phrases: "perfectly aligns", "ideal candidate", "strong work ethic", "team player", "passionate", "dedicated"
4. ALWAYS include specific numbers: yacht sizes (54m), tenure lengths (18 months), years (5 years)
5. INCLUDE yacht names - they are industry credentials (e.g., "M/Y Quattroelle (86m)", "M/Y Symphony (102m)"). Name-dropping recognized yachts adds credibility.
6. NEVER assume or state the candidate's location - yacht crew are typically willing to relocate worldwide. Do NOT mention the search location as if the candidate is there.

CONTENT GUIDELINES:
- Professional Summary: Factual overview. Position + years + yacht sizes + key certifications. No sales language.
- Why Good Fit: Explain the specific match to search criteria. "Searched for deckhand → this candidate has 5 years deckhand experience on similar size vessels"
- Career Highlights: Quantifiable achievements only. Numbers, sizes, durations, outcomes.
- Standout Qualities: Evidence-based traits only. "Speaks 3 languages" not "great communicator". "Trained 2 juniors" not "natural leader".

LONGEVITY ASSESSMENT - BE HONEST, NOT PROMOTIONAL:
State tenure facts first, then assess honestly. Employers need accurate data.

TENURE THRESHOLDS (apply strictly):
- Average 24+ months = "Demonstrates strong retention with X month average tenure"
- Average 18-24 months = "Shows solid stability with X month average tenure"
- Average 12-18 months = "Tenure averaging X months is typical for yachting"
- Average 6-12 months = "Below-average tenure of X months - may indicate seasonal focus or frequent transitions"
- Average under 6 months = "Short tenure pattern (X month average) warrants discussion - frequent position changes"

HONESTY RULES:
- DO NOT use euphemisms like "gaining diverse experience" or "strategic moves" for short tenures
- DO NOT excuse short tenures for crew with 3+ years total experience
- ALWAYS state the actual average tenure number from tenure_metrics
- If longest tenure is significantly better than average, mention both facts
- For crew with mostly sub-3-month positions, state this directly`,
    prompt: `Generate a factual candidate profile for a "${searchContext.role}" search.
${searchContext.location ? `Location preference: ${searchContext.location}` : ''}
${searchContext.timeline ? `Timeline: ${searchContext.timeline}` : ''}
${searchContext.requirements ? `Requirements: ${searchContext.requirements}` : ''}

CANDIDATE DATA:
${JSON.stringify(candidateProfile, null, 2)}

INSTRUCTIONS:
- Write in third person only
- Use specific numbers from the data (years, yacht sizes, tenure months)
- No superlatives or sales language
- For "why_good_fit": reference the "${searchContext.role}" search and explain the match factually
- For "standout_qualities": only include traits backed by specific evidence in their profile
- Include yacht names with sizes - they're industry credentials that add credibility`,
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
    languages_extracted?: Array<{ language: string; proficiency: string }> | null;
    highest_license?: string | null;
    availability_status?: string | null;
    has_stcw?: boolean;
    has_eng1?: boolean;
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
    languages_extracted?: Array<{ language: string; proficiency: string }> | null;
    has_stcw?: boolean;
    has_eng1?: boolean;
  },
  searchContext: { role: string }
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

  if (uniqueCerts.length > 0) {
    fitParts.push(`Their ${uniqueCerts[0]} qualification adds value to any deck team.`);
  } else if (uniqueSkills.length > 0) {
    fitParts.push(`Their ${uniqueSkills[0]} skills would benefit guest experiences.`);
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
  languages_extracted?: Array<{ language: string; proficiency: string }> | null;
}): string {
  const position = candidate.primary_position?.toLowerCase() || '';
  const yearsExp = candidate.years_experience || 0;
  const summary = candidate.profile_summary?.toLowerCase() || '';

  // Parse experience data
  const yachtExp = (candidate.yacht_experience_extracted || []) as YachtExperience[];
  const villaExp = (candidate.villa_experience_extracted || []) as VillaExperience[];
  const certs = (candidate.certifications_extracted || []) as CertificationExtracted[];
  const licenses = (candidate.licenses_extracted || []) as LicenseExtracted[];
  const langs = (candidate.languages_extracted || []) as Array<{ language: string; proficiency: string }>;
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
  has_stcw?: boolean;
  has_eng1?: boolean;
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
  languagesExtracted: Array<{ language: string; proficiency: string }> | null
): string[] {
  if (!languagesExtracted || languagesExtracted.length === 0) {
    return ['English'];
  }

  return languagesExtracted
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
    languages_extracted?: Array<{ language: string; proficiency: string }> | null;
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
  languages_extracted?: Array<{ language: string; proficiency: string }> | null;
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
