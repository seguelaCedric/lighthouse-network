// ============================================================================
// CV EXTRACTION MODULE
// ============================================================================
// AI-powered structured data extraction from CV text using GPT-4o-mini
// ============================================================================

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import {
  cvExtractionResultSchema,
  type CVExtractionResult,
  type CVExtractionRequest,
  type CVExtractionResponse,
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

  return object;
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
