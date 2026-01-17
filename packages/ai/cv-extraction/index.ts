// ============================================================================
// CV EXTRACTION MODULE
// ============================================================================
// AI-powered structured data extraction from CV text using GPT-4o-mini
// ============================================================================

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import {
  cvExtractionResultSchema,
  licenseTypeSchema,
  type CVExtractionResult,
  type CVExtractionRequest,
  type CVExtractionResponse,
  type LicenseType,
} from './types';
import { normalizePosition, getAllStandardPositions, POSITION_TAXONOMY } from './position-taxonomy';

// ----------------------------------------------------------------------------
// MODEL CONFIGURATION
// ----------------------------------------------------------------------------

// Using GPT-4o-mini for structured extraction - fast and cheap
const extractionModel = openai('gpt-4o-mini');

// ----------------------------------------------------------------------------
// EXTRACTION PROMPT
// ----------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT = `You are an expert yacht and villa crew recruitment specialist. Your task is to extract structured data from CV/resume text.

## Your Expertise
- Deep knowledge of yacht crew positions (Captain, Chief Officer, Chief Engineer, Bosun, Chief Stewardess, etc.)
- Villa/estate staff positions (Estate Manager, Butler, Private Chef, Housekeeper, etc.)
- Maritime certifications and licenses (STCW, ENG1, MCA/USCG CoCs, Yachtmaster, etc.)
- Industry terminology and abbreviations

## Position Normalization
Normalize all positions to standard forms. Examples:
- "head stew" → "Chief Stewardess"
- "chief eng" → "Chief Engineer"
- "2nd stew" → "Second Stewardess"
- "bosun" → "Bosun"

## Standard Position Categories - MUST ALWAYS ASSIGN ONE (never null)
- deck: Captain, Officers (Chief Officer, First Officer, Second Officer), Bosun, Deckhands, Navigation Officer, Watch Officer
- interior: Stewardesses (all levels), Purser, Housekeeping, Laundry, Interior crew
- engineering: ALL engineers (Chief Engineer, Second Engineer, Third Engineer, Junior Engineer, ETO, Electrician, AV Tech, IT)
- galley: Chefs (all levels), Cooks, Sous Chef, CDP
- villa: Estate Manager, Butler, Housekeeper, Chauffeur, Gardener, PA, House Manager
- childcare: Nanny, Governess, Au Pair, Tutor
- security: Security Officer, CPO, Bodyguard
- medical: Nurse, Medic, Doctor
- management: Yacht Manager, Fleet Manager, Shore-based Manager
- wellness: Spa Therapist, Massage Therapist, Beauty Therapist, Aesthetician, Fitness Trainer, Personal Trainer, Yoga Instructor, Pilates Instructor
- other: ONLY use for positions that truly don't fit ANY above category (e.g., Dive Instructor, Marketing, Sales, etc.)

IMPORTANT: You MUST assign a position_category. Never return null. When in doubt, use "other".

## License Hierarchy (highest to lowest)
Master Unlimited > Master 3000GT > Master 500GT > Chief Mate > OOW > Yachtmaster Ocean > Yachtmaster Offshore > Yachtmaster Coastal
For engineers: Chief Engineer Unlimited > Chief Engineer 3000kW > Second Engineer > EOOW > AEC

## Certification Categories (MUST use one of these exact values)
- stcw: All STCW modules (BST, PSCRB, AFA, SSO, etc.)
- eng1: ENG1 medical certificate
- food_safety: Food hygiene/safety certificates (HACCP, etc.)
- medical: First aid, ship's medic courses
- yachtmaster: RYA/MCA yachtmaster qualifications
- powerboat: RYA powerboat certificates
- diving: PADI, SSI diving qualifications
- wine: WSET, sommelier certificates
- hospitality: Silver service, butler courses
- security: Security certificates (SSO, ISPS, etc.)
- childcare: Childcare qualifications
- maritime: General maritime certs (AEC, SRC radio, GMDSS, etc.)
- engineering: Engineering certificates (Y1-Y4, AEC, etc.)
- other: Anything else not fitting above categories

## Experience Calculation
Calculate total years of relevant professional experience by:
1. Summing up work history durations
2. Accounting for overlapping periods
3. Only counting positions in the relevant industry (yacht/villa/hospitality)

## Reference Extraction
Extract any reference contacts mentioned, including:
- Name and position
- Company/yacht name
- Phone and email if provided
- Their relationship to the candidate

## Yacht Type Classification (MUST use one of these exact values)
- motor: Motor yachts (M/Y, MY)
- sail: Sailing yachts (S/Y, SY)
- catamaran: Catamarans
- explorer: Explorer/expedition yachts
- classic: Classic/vintage yachts
- superyacht: 50m+ yachts
- charter: Charter vessels
- private: Private/owner use vessels
- commercial: Commercial vessels
- cruise: Cruise ships
- expedition: Expedition vessels
- other: Any other type

## Yacht Size Extraction - CRITICAL
Yacht sizes are extremely important and must be accurate:
- Look for explicit size mentions like "60m MY", "180ft yacht", "55 meter"
- Convert feet to meters: multiply by 0.3048 (e.g., 180ft = 55m)
- Common superyacht sizes: 30-50m (small), 50-70m (medium), 70-100m (large), 100m+ (megayacht)
- If the CV mentions a known yacht name but NO size, leave yacht_size_meters as null
- NEVER guess or estimate sizes - only extract explicitly stated sizes
- If size is given in feet, convert to meters
- Double-check your conversion: 100ft ≈ 30m, 200ft ≈ 61m, 300ft ≈ 91m

## Extraction Rules
1. Be precise - don't infer information not present
2. Use ISO date format (YYYY-MM-DD) where possible
3. Convert yacht sizes to meters (1ft = 0.3048m) - BE VERY CAREFUL WITH CONVERSION
4. If confidence is low for any field, note it in extraction_notes
5. For positions, provide BOTH the raw text AND normalized form
6. Mark the most recent/primary position with is_primary: true
7. Extract ALL licenses and certificates mentioned
8. Include reference contact details when available
9. If yacht size is not explicitly stated in CV, set yacht_size_meters to null`;

// ----------------------------------------------------------------------------
// EXTRACTION FUNCTION
// ----------------------------------------------------------------------------

/**
 * Extract structured data from CV text using AI
 * Returns normalized extraction with canonical license values
 */
export async function extractFromCV(cvText: string): Promise<CVExtractionResult> {
  const { object } = await generateObject({
    model: extractionModel,
    schema: cvExtractionResultSchema,
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: `Extract structured data from this CV:

<cv_text>
${cvText}
</cv_text>

Extract all available information including:
- Total years of experience (calculate from work history)
- All positions held (with raw text AND normalized form)
- Primary/most recent position
- All certifications and their details
- All maritime licenses with numbers and expiry dates
- Languages and proficiency levels
- Skills and searchable keywords
- Yacht experience (names, sizes, types, durations)
- Villa/estate experience if any
- Education details
- Reference contacts (names, positions, phone, email)

Be thorough but accurate. Only include information actually present in the CV.`,
    temperature: 0, // Deterministic for consistency
  });

  // CRITICAL: Normalize licenses to canonical form before returning
  // This ensures consistent highest_license values in the database
  return normalizeExtractionLicenses(object);
}

/**
 * Safe wrapper that handles errors and returns a response object
 */
export async function extractFromCVSafe(
  request: CVExtractionRequest
): Promise<CVExtractionResponse> {
  const startTime = Date.now();

  try {
    const extraction = await extractFromCV(request.cv_text);

    return {
      success: true,
      extraction,
      processing_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      extraction: null,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      processing_time_ms: Date.now() - startTime,
    };
  }
}

// ----------------------------------------------------------------------------
// LICENSE NORMALIZATION & HIERARCHY
// ----------------------------------------------------------------------------

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
 * Maps various license string formats to canonical snake_case form
 * This handles the messy reality of AI extraction and database values
 */
const LICENSE_NORMALIZATION_MAP: Record<string, string> = {
  // Powerboat variations
  'power boat 2': 'powerboat_level_2',
  'powerboat level 2': 'powerboat_level_2',
  'powerboat_level_2': 'powerboat_level_2',
  'pb2': 'powerboat_level_2',
  'rya powerboat level 2': 'powerboat_level_2',
  'powerboat': 'powerboat_level_2',

  // Day skipper
  'day skipper': 'day_skipper',
  'day_skipper': 'day_skipper',
  'rya day skipper': 'day_skipper',

  // Coastal skipper
  'coastal skipper': 'coastal_skipper',
  'coastal_skipper': 'coastal_skipper',
  'rya coastal skipper': 'coastal_skipper',

  // Yachtmaster Coastal
  'yachtmaster coastal': 'yachtmaster_coastal',
  'yachtmaster_coastal': 'yachtmaster_coastal',
  'rya yachtmaster coastal': 'yachtmaster_coastal',
  'yacht master coastal': 'yachtmaster_coastal',

  // Yachtmaster Offshore
  'yachtmaster offshore': 'yachtmaster_offshore',
  'yachtmaster_offshore': 'yachtmaster_offshore',
  'yacht master offshore': 'yachtmaster_offshore',
  'yacht_master_offshore': 'yachtmaster_offshore',
  'rya yachtmaster offshore': 'yachtmaster_offshore',
  'rya yacht master offshore': 'yachtmaster_offshore',

  // Yachtmaster Ocean
  'yachtmaster ocean': 'yachtmaster_ocean',
  'yachtmaster_ocean': 'yachtmaster_ocean',
  'yacht master ocean': 'yachtmaster_ocean',
  'yacht_master_ocean': 'yachtmaster_ocean',
  'rya yachtmaster ocean': 'yachtmaster_ocean',

  // Yacht Rating (basic deck)
  'yacht rating': 'yacht_rating',
  'yacht_rating': 'yacht_rating',

  // OOW (Officer of the Watch)
  'oow': 'ow_3000gt',
  'oow 3000': 'ow_3000gt',
  'oow 3000gt': 'ow_3000gt',
  'ow_3000gt': 'ow_3000gt',
  'oow_3000gt': 'ow_3000gt',
  'oow unlimited': 'ow_unlimited',
  'ow_unlimited': 'ow_unlimited',
  'oow_unlimited': 'ow_unlimited',
  'mca oow': 'ow_3000gt',
  'mca_oow': 'ow_3000gt',
  'officer of the watch': 'ow_3000gt',

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

  // Engineering - EOOW
  'eoow': 'eoow',
  'eoow unlimited': 'eoow',

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
  'second engineer 3000kw': 'second_engineer_3000kw',

  // Engineering - Chief Engineer
  'chief engineer': 'chief_engineer_unlimited',
  'chief_engineer': 'chief_engineer_unlimited',
  'chief engineer unlimited': 'chief_engineer_unlimited',
  'chief_engineer_unlimited': 'chief_engineer_unlimited',
  'chief engineer 3000kw': 'chief_engineer_3000kw',
  'sv chief engineer 3000kw': 'chief_engineer_3000kw',
  'sv chief engineer 9000kw': 'chief_engineer_9000kw',
  'chief engineer 9000kw': 'chief_engineer_9000kw',

  // Medical/Safety certs (often confused with licenses)
  'eng1': 'eng1',
  'eng 1': 'eng1',
  'eng-1': 'eng1',
  'eng1 medical': 'eng1',
  'mca eng1': 'eng1',
  'stcw': 'stcw',
};

/**
 * Normalize a license string to canonical snake_case form
 */
export function normalizeLicenseValue(license: string | null | undefined): string | null {
  if (!license) return null;

  const normalized = license.toLowerCase().trim();

  // Direct match in normalization map
  if (LICENSE_NORMALIZATION_MAP[normalized]) {
    return LICENSE_NORMALIZATION_MAP[normalized];
  }

  // Try partial matches for common patterns
  for (const [pattern, canonical] of Object.entries(LICENSE_NORMALIZATION_MAP)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return canonical;
    }
  }

  // Already in canonical form (snake_case)
  if (normalized.includes('_') && !normalized.includes(' ')) {
    return normalized;
  }

  // Return snake_case version of original
  return license.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Determine the highest license from an array of licenses
 * Returns the canonical license_type value
 */
export function determineHighestLicense(
  licenses: Array<{ license_type?: string | null; name: string }>
): string | null {
  if (!licenses || licenses.length === 0) return null;

  let highestDeckIndex = -1;
  let highestDeckLicense: string | null = null;
  let highestEngIndex = -1;
  let highestEngLicense: string | null = null;

  for (const license of licenses) {
    // Use license_type if available, otherwise normalize from name
    const licenseType = license.license_type
      ? normalizeLicenseValue(license.license_type)
      : normalizeLicenseValue(license.name);

    if (!licenseType) continue;

    // Check deck hierarchy
    const deckIndex = DECK_LICENSE_HIERARCHY.indexOf(licenseType as typeof DECK_LICENSE_HIERARCHY[number]);
    if (deckIndex > highestDeckIndex) {
      highestDeckIndex = deckIndex;
      highestDeckLicense = licenseType;
    }

    // Check engineering hierarchy
    const engIndex = ENGINEERING_LICENSE_HIERARCHY.indexOf(licenseType as typeof ENGINEERING_LICENSE_HIERARCHY[number]);
    if (engIndex > highestEngIndex) {
      highestEngIndex = engIndex;
      highestEngLicense = licenseType;
    }
  }

  // Return the higher of deck or engineering license
  // Deck licenses generally trump engineering for overall "highest"
  if (highestDeckIndex >= 0 && highestDeckIndex > highestEngIndex) {
    return highestDeckLicense;
  }
  if (highestEngIndex >= 0) {
    return highestEngLicense;
  }

  // Fallback: return normalized version of first license
  return normalizeLicenseValue(licenses[0].name);
}

/**
 * Convert a normalized license string to a valid LicenseType enum value
 * Falls back to 'other' if the value is not a valid LicenseType
 */
function toValidLicenseType(value: string | null | undefined): LicenseType | null {
  if (!value) return null;

  // Check if the value is a valid LicenseType
  const result = licenseTypeSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }

  // If not valid, return 'other'
  return 'other';
}

/**
 * Post-process extraction result to normalize all licenses
 */
export function normalizeExtractionLicenses(extraction: CVExtractionResult): CVExtractionResult {
  // Normalize licenses array
  const normalizedLicenses = extraction.licenses.map((license) => ({
    ...license,
    license_type: toValidLicenseType(normalizeLicenseValue(license.license_type || license.name)),
  }));

  // Determine highest license from normalized licenses
  const highestLicense = determineHighestLicense(normalizedLicenses);

  return {
    ...extraction,
    licenses: normalizedLicenses,
    highest_license: highestLicense,
  };
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Derive boolean flags from extraction result
 * Useful for backwards compatibility with existing candidate filters
 */
export function deriveBooleanFlags(extraction: CVExtractionResult): {
  has_stcw: boolean;
  has_eng1: boolean;
  has_yachtmaster: boolean;
  has_powerboat: boolean;
  has_schengen: boolean;
  has_b1b2: boolean;
} {
  const certNames = extraction.certifications.map((c) => c.name.toLowerCase());
  const licenseNames = extraction.licenses.map((l) => l.name.toLowerCase());
  const allCreds = [...certNames, ...licenseNames];

  return {
    has_stcw: extraction.has_stcw || allCreds.some((c) => c.includes('stcw')),
    has_eng1: extraction.has_eng1 || allCreds.some((c) => c.includes('eng1')),
    has_yachtmaster:
      extraction.has_yachtmaster ||
      allCreds.some((c) => c.includes('yachtmaster') || c.includes('yacht master')),
    has_powerboat:
      extraction.has_powerboat ||
      allCreds.some((c) => c.includes('powerboat') || c.includes('power boat')),
    // These would need visa info from CV - usually not present
    has_schengen: false,
    has_b1b2: false,
  };
}

/**
 * Get searchable keywords from extraction
 */
export function buildSearchKeywords(extraction: CVExtractionResult): string[] {
  const keywords = new Set<string>();

  // Add skills
  extraction.skills.forEach((s) => keywords.add(s.toLowerCase()));

  // Add positions (both raw and normalized)
  extraction.positions_held.forEach((p) => {
    keywords.add(p.normalized.toLowerCase());
    keywords.add(p.raw_title.toLowerCase());
  });

  // Add certification names
  extraction.certifications.forEach((c) => keywords.add(c.name.toLowerCase()));

  // Add license names
  extraction.licenses.forEach((l) => keywords.add(l.name.toLowerCase()));

  // Add yacht names
  extraction.yacht_experience.forEach((y) => {
    if (y.yacht_name) keywords.add(y.yacht_name.toLowerCase());
  });

  // Add languages
  extraction.languages.forEach((l) => keywords.add(l.language.toLowerCase()));

  return Array.from(keywords);
}

/**
 * Calculate the total months of experience from work history
 */
export function calculateTotalExperienceMonths(extraction: CVExtractionResult): number {
  let totalMonths = 0;

  // Sum yacht experience
  extraction.yacht_experience.forEach((y) => {
    totalMonths += y.duration_months || 0;
  });

  // Sum villa experience
  extraction.villa_experience.forEach((v) => {
    totalMonths += v.duration_months || 0;
  });

  return totalMonths;
}

// ----------------------------------------------------------------------------
// RE-EXPORTS
// ----------------------------------------------------------------------------

export * from './types';
export { normalizePosition, getAllStandardPositions, POSITION_TAXONOMY } from './position-taxonomy';
