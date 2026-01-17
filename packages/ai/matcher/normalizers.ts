/**
 * Data Normalization Utilities for AI Matcher
 *
 * Handles the messy reality of database values:
 * - License names have multiple formats (snake_case, Title Case, abbreviations)
 * - Position categories may be NULL but can be inferred from primary_position
 * - Job requirements may use different terminology than candidate data
 */

// ============================================================================
// POSITION CATEGORY MAPPING
// ============================================================================

/**
 * Maps primary_position strings to position_category enum values
 * Used when candidate.position_category is NULL
 */
export const POSITION_TO_CATEGORY: Record<string, string> = {
  // DECK positions
  captain: 'deck',
  'chief officer': 'deck',
  'first officer': 'deck',
  'second officer': 'deck',
  'third officer': 'deck',
  'officer of the watch': 'deck',
  oow: 'deck',
  bosun: 'deck',
  deckhand: 'deck',
  'junior deckhand': 'deck',
  'lead deckhand': 'deck',
  'senior deckhand': 'deck',
  'deck/stew': 'deck',
  'deck stew': 'deck',

  // INTERIOR positions
  stewardess: 'interior',
  steward: 'interior',
  'chief stewardess': 'interior',
  'head stewardess': 'interior',
  'second stewardess': 'interior',
  'junior stewardess': 'interior',
  'third stewardess': 'interior',
  butler: 'interior',
  purser: 'interior',
  'chief purser': 'interior',
  waiter: 'interior',
  waitress: 'interior',
  laundress: 'interior',
  'laundry stewardess': 'interior',
  'stew/deck': 'interior',
  'stew deck': 'interior',

  // ENGINEERING positions
  'chief engineer': 'engineering',
  engineer: 'engineering',
  'first engineer': 'engineering',
  'second engineer': 'engineering',
  'third engineer': 'engineering',
  'junior engineer': 'engineering',
  eto: 'engineering',
  'electro-technical officer': 'engineering',
  'av engineer': 'engineering',
  'av/eto': 'engineering',
  'electrician': 'engineering',

  // GALLEY positions
  chef: 'galley',
  'head chef': 'galley',
  'executive chef': 'galley',
  'sous chef': 'galley',
  'junior chef': 'galley',
  cook: 'galley',
  'ship\'s cook': 'galley',
  'galley stewardess': 'galley',
  baker: 'galley',
  pastry: 'galley',
  'pastry chef': 'galley',

  // MANAGEMENT positions
  'yacht manager': 'management',
  'fleet manager': 'management',
  'operations manager': 'management',
  pa: 'management',
  'personal assistant': 'management',
  'executive assistant': 'management',
  administrator: 'management',

  // SECURITY positions
  'security officer': 'security',
  sso: 'security',
  'ship security officer': 'security',
  bodyguard: 'security',
  'close protection': 'security',

  // CHILDCARE positions
  nanny: 'childcare',
  governess: 'childcare',
  tutor: 'childcare',
  au_pair: 'childcare',
  'au pair': 'childcare',

  // WELLNESS positions
  masseuse: 'wellness',
  'massage therapist': 'wellness',
  'yoga instructor': 'wellness',
  'fitness instructor': 'wellness',
  'personal trainer': 'wellness',
  'spa therapist': 'wellness',

  // MEDICAL positions
  nurse: 'medical',
  'medical officer': 'medical',
  paramedic: 'medical',
  'ship\'s doctor': 'medical',
  doctor: 'medical',
  'emt': 'medical',

  // VILLA/HOUSEHOLD positions
  housekeeper: 'villa',
  'head housekeeper': 'villa',
  'house manager': 'villa',
  'estate manager': 'villa',
  houseman: 'villa',
  caretaker: 'villa',
  gardener: 'villa',
  groundskeeper: 'villa',
  driver: 'villa',
  chauffeur: 'villa',
  'household staff': 'villa',
  'household manager': 'villa',
};

/**
 * Infer position_category from primary_position
 */
export function inferPositionCategory(primaryPosition: string | null | undefined): string | null {
  if (!primaryPosition) return null;

  const normalized = primaryPosition.toLowerCase().trim();

  // Direct match
  if (POSITION_TO_CATEGORY[normalized]) {
    return POSITION_TO_CATEGORY[normalized];
  }

  // Partial match - check if any key is contained in the position
  for (const [key, category] of Object.entries(POSITION_TO_CATEGORY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }

  return null;
}

// ============================================================================
// LICENSE NORMALIZATION
// ============================================================================

/**
 * Canonical license hierarchy (higher index = higher qualification)
 * Used for "at least this license" filtering
 */
export const LICENSE_HIERARCHY = {
  // DECK LICENSES (from lowest to highest)
  deck: [
    'powerboat_level_2',
    'day_skipper',
    'coastal_skipper',
    'yacht_master_offshore',
    'yacht_master_ocean',
    'oow_500gt',
    'oow_3000gt',
    'oow_unlimited',
    'chief_mate_500gt',
    'chief_mate_3000gt',
    'chief_mate_unlimited',
    'master_200gt',
    'master_500gt',
    'master_3000gt',
    'master_unlimited',
  ],

  // ENGINEERING LICENSES (from lowest to highest)
  engineering: [
    'aec', // Approved Engine Course
    'meol', // Marine Engine Operator License
    'y4',
    'y3',
    'y2',
    'y1',
    'third_engineer',
    'second_engineer_3000kw',
    'second_engineer_unlimited',
    'chief_engineer_3000kw',
    'chief_engineer_9000kw',
    'chief_engineer_unlimited',
  ],
};

/**
 * Maps various license string formats to canonical form
 */
export const LICENSE_ALIASES: Record<string, string> = {
  // Powerboat variations
  'power boat 2': 'powerboat_level_2',
  'powerboat level 2': 'powerboat_level_2',
  'powerboat_level_2': 'powerboat_level_2',
  'pb2': 'powerboat_level_2',
  'rya powerboat level 2': 'powerboat_level_2',

  // Day skipper
  'day skipper': 'day_skipper',
  'day_skipper': 'day_skipper',
  'rya day skipper': 'day_skipper',

  // Coastal skipper
  'coastal skipper': 'coastal_skipper',
  'coastal_skipper': 'coastal_skipper',
  'rya coastal skipper': 'coastal_skipper',

  // Yachtmaster Offshore
  'yacht master offshore': 'yacht_master_offshore',
  'yacht_master_offshore': 'yacht_master_offshore',
  'yachtmaster offshore': 'yacht_master_offshore',
  'rya yachtmaster offshore': 'yacht_master_offshore',
  'rya yacht master offshore': 'yacht_master_offshore',

  // Yachtmaster Ocean
  'yacht master ocean': 'yacht_master_ocean',
  'yacht_master_ocean': 'yacht_master_ocean',
  'yachtmaster ocean': 'yacht_master_ocean',
  'rya yachtmaster ocean': 'yacht_master_ocean',

  // OOW (Officer of the Watch)
  'oow': 'oow_3000gt',
  'oow 3000': 'oow_3000gt',
  'oow 3000gt': 'oow_3000gt',
  'oow_3000gt': 'oow_3000gt',
  'oow unlimited': 'oow_unlimited',
  'oow_unlimited': 'oow_unlimited',
  'mca oow': 'oow_3000gt',
  'mca_oow': 'oow_3000gt',
  'officer of the watch': 'oow_3000gt',

  // Chief Mate
  'chief mate': 'chief_mate_unlimited',
  'chief mate 3000': 'chief_mate_3000gt',
  'chief mate 3000gt': 'chief_mate_3000gt',
  'chief_mate_3000gt': 'chief_mate_3000gt',
  'chief mate unlimited': 'chief_mate_unlimited',
  'chief_mate_unlimited': 'chief_mate_unlimited',
  'chief officer': 'chief_mate_unlimited',
  'chief officer unlimited': 'chief_mate_unlimited',
  'mca chief mate': 'chief_mate_unlimited',
  'mca_chief_mate': 'chief_mate_unlimited',

  // Master 200GT
  'master 200': 'master_200gt',
  'master 200gt': 'master_200gt',
  'master_200gt': 'master_200gt',
  'master_200': 'master_200gt',
  'master of yachts 200gt': 'master_200gt',

  // Master 500GT
  'master 500': 'master_500gt',
  'master 500gt': 'master_500gt',
  'master_500gt': 'master_500gt',
  'master_500': 'master_500gt',
  'master of yachts 500gt': 'master_500gt',

  // Master 3000GT
  'master 3000': 'master_3000gt',
  'master  3000': 'master_3000gt', // Note: double space in data
  'master 3000gt': 'master_3000gt',
  'master_3000gt': 'master_3000gt',
  'master_3000': 'master_3000gt',

  // Master Unlimited
  'master unlimited': 'master_unlimited',
  'master_unlimited': 'master_unlimited',
  'unlimited master': 'master_unlimited',

  // Yacht Rating (basic deck)
  'yacht rating': 'yacht_rating',
  'yacht_rating': 'yacht_rating',

  // Engineering - AEC
  'aec': 'aec',
  'approved engine course': 'aec',
  'approved_engine_course': 'aec',

  // Engineering - MEOL
  'meol': 'meol',
  'marine engine operator': 'meol',

  // Engineering - Y4/Y3/Y2/Y1
  'y4': 'y4',
  'y3': 'y3',
  'y2': 'y2',
  'y1': 'y1',

  // Engineering - Third Engineer
  'third engineer': 'third_engineer',
  'third_engineer': 'third_engineer',
  '3rd engineer': 'third_engineer',

  // Engineering - Second Engineer
  'second engineer': 'second_engineer_unlimited',
  'second_engineer': 'second_engineer_unlimited',
  '2nd engineer': 'second_engineer_unlimited',
  'second engineer unlimited': 'second_engineer_unlimited',
  'second_engineer_unlimited': 'second_engineer_unlimited',
  'sv 2nd engineer': 'second_engineer_3000kw',

  // Engineering - Chief Engineer
  'chief engineer': 'chief_engineer_unlimited',
  'chief_engineer': 'chief_engineer_unlimited',
  'chief engineer unlimited': 'chief_engineer_unlimited',
  'chief_engineer_unlimited': 'chief_engineer_unlimited',
  'chief engineer 3000kw': 'chief_engineer_3000kw',
  'sv chief engineer 3000kw': 'chief_engineer_3000kw',
  'sv chief engineer 9000kw': 'chief_engineer_9000kw',
  'chief engineer 9000kw': 'chief_engineer_9000kw',

  // EOOW
  'eoow': 'y3',
  'eoow unlimited': 'second_engineer_unlimited',
};

/**
 * Normalize a license string to canonical form
 */
export function normalizeLicense(license: string | null | undefined): string | null {
  if (!license) return null;

  const normalized = license.toLowerCase().trim();

  // Direct alias match
  if (LICENSE_ALIASES[normalized]) {
    return LICENSE_ALIASES[normalized];
  }

  // Check if already in canonical form
  const allCanonical = [
    ...LICENSE_HIERARCHY.deck,
    ...LICENSE_HIERARCHY.engineering,
    'yacht_rating',
    'eng1',
    'stcw',
  ];
  if (allCanonical.includes(normalized)) {
    return normalized;
  }

  // Try to find partial matches
  for (const [alias, canonical] of Object.entries(LICENSE_ALIASES)) {
    if (normalized.includes(alias)) {
      return canonical;
    }
  }

  // Return as-is if no match found (might be a non-standard license)
  return license;
}

/**
 * Check if a candidate's license meets or exceeds the required license level
 */
export function licenseMeetsRequirement(
  candidateLicense: string | null | undefined,
  requiredLicense: string
): boolean {
  if (!candidateLicense) return false;

  const normalizedCandidate = normalizeLicense(candidateLicense);
  const normalizedRequired = normalizeLicense(requiredLicense);

  if (!normalizedCandidate || !normalizedRequired) return false;

  // Exact match
  if (normalizedCandidate === normalizedRequired) return true;

  // Check deck hierarchy
  const deckIndex = LICENSE_HIERARCHY.deck.indexOf(normalizedRequired);
  if (deckIndex >= 0) {
    const candidateDeckIndex = LICENSE_HIERARCHY.deck.indexOf(normalizedCandidate);
    return candidateDeckIndex >= deckIndex;
  }

  // Check engineering hierarchy
  const engIndex = LICENSE_HIERARCHY.engineering.indexOf(normalizedRequired);
  if (engIndex >= 0) {
    const candidateEngIndex = LICENSE_HIERARCHY.engineering.indexOf(normalizedCandidate);
    return candidateEngIndex >= engIndex;
  }

  return false;
}

/**
 * Get licenses that meet or exceed a requirement
 * Returns array of canonical license names for SQL IN clause
 */
export function getLicensesMeetingRequirement(requiredLicense: string): string[] {
  const normalizedRequired = normalizeLicense(requiredLicense);
  if (!normalizedRequired) return [];

  const result: string[] = [];

  // Check deck hierarchy
  const deckIndex = LICENSE_HIERARCHY.deck.indexOf(normalizedRequired);
  if (deckIndex >= 0) {
    result.push(...LICENSE_HIERARCHY.deck.slice(deckIndex));
  }

  // Check engineering hierarchy
  const engIndex = LICENSE_HIERARCHY.engineering.indexOf(normalizedRequired);
  if (engIndex >= 0) {
    result.push(...LICENSE_HIERARCHY.engineering.slice(engIndex));
  }

  // If not in hierarchy, just return the normalized value
  if (result.length === 0) {
    result.push(normalizedRequired);
  }

  return result;
}

/**
 * Get all raw license values that map to a set of canonical licenses
 * For use in SQL queries where we need to match the actual database values
 */
export function getRawLicenseValues(canonicalLicenses: string[]): string[] {
  const result = new Set<string>();

  for (const canonical of canonicalLicenses) {
    // Add the canonical form
    result.add(canonical);

    // Add all aliases that map to this canonical form
    for (const [alias, target] of Object.entries(LICENSE_ALIASES)) {
      if (target === canonical) {
        result.add(alias);
        // Also add common case variations
        result.add(alias.replace(/_/g, ' '));
        result.add(alias.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    }
  }

  return Array.from(result);
}

// ============================================================================
// CERTIFICATION NORMALIZATION
// ============================================================================

/**
 * Standard yacht industry certifications
 */
export const CERTIFICATIONS = {
  stcw: ['stcw', 'stcw95', 'stcw 95', 'stcw basic', 'stcw basic safety'],
  eng1: ['eng1', 'eng 1', 'eng-1', 'eng1 medical', 'mca eng1'],
  food_safety: ['food safety', 'food hygiene', 'ship\'s cook', 'level 2 food safety'],
  pdsd: ['pdsd', 'proficiency in designated security duties'],
  sso: ['sso', 'ship security officer'],
  gmdss: ['gmdss', 'gmdss goc', 'goc'],
  ecdis: ['ecdis'],
  arpa: ['arpa', 'radar arpa'],
  btm: ['btm', 'bridge team management'],
  erm: ['erm', 'engine room management'],
} as const;

/**
 * Check if candidate has a required certification
 */
export function hasCertification(
  candidateCerts: string[] | null | undefined,
  requiredCert: keyof typeof CERTIFICATIONS
): boolean {
  if (!candidateCerts || candidateCerts.length === 0) return false;

  const validVariants = CERTIFICATIONS[requiredCert];
  const normalizedCandidateCerts = candidateCerts.map(c => c.toLowerCase().trim());

  return validVariants.some(variant =>
    normalizedCandidateCerts.some(cert => cert.includes(variant))
  );
}

// ============================================================================
// AVAILABILITY NORMALIZATION
// ============================================================================

export const AVAILABILITY_STATUS_MAP: Record<string, string[]> = {
  available: ['available', 'immediately_available', 'actively_looking', 'open'],
  available_soon: ['available_soon', 'available soon', 'notice_period', 'finishing_contract'],
  not_available: ['not_available', 'employed', 'busy', 'on_contract'],
};

/**
 * Check if candidate availability status indicates they are available
 */
export function isAvailable(status: string | null | undefined): boolean {
  if (!status) return true; // Assume available if not specified

  const normalized = status.toLowerCase().trim();
  return AVAILABILITY_STATUS_MAP.available.includes(normalized) ||
         AVAILABILITY_STATUS_MAP.available_soon.includes(normalized);
}
