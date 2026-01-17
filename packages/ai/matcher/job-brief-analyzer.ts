// ============================================================================
// JOB BRIEF ANALYZER - AI Sourcer for Natural Language Job Briefs
// ============================================================================
// This is the "brain" of the AI sourcer. It understands job briefs of ANY format:
//
// SHORT BRIEF: "Chief stew, 5 years, 70m+, no South Africans, needs bartending"
// DETAILED BRIEF: Multi-page document with history, client preferences, etc.
// EMAIL FORWARD: Casual message from client with scattered requirements
// STRUCTURED: Clean bullet points with clear requirements
//
// The AI extracts EVERYTHING a human recruiter would consider, including:
// - Hard requirements (must-haves)
// - Soft preferences (nice-to-haves)
// - Deal breakers (exclusions)
// - Cultural fit indicators
// - Anything between the lines
// ============================================================================

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

// ============================================================================
// SCHEMA FOR EXTRACTED REQUIREMENTS
// ============================================================================

export const extractedRequirementsSchema = z.object({
  // Position requirements
  position: z.object({
    title: z.string().describe('Standardized position title'),
    category: z.enum(['deck', 'interior', 'engineering', 'galley', 'medical', 'childcare', 'security', 'management', 'other']),
    seniority_level: z.enum(['junior', 'mid', 'senior', 'head']).optional(),
    alternative_titles: z.array(z.string()).optional().describe('Other acceptable position titles'),
  }),

  // Experience requirements
  experience: z.object({
    years_min: z.number().optional(),
    years_ideal: z.number().optional(),
    years_max: z.number().optional().describe('Max years (e.g., for junior roles)'),
    yacht_size_min: z.number().optional().describe('Must have worked on yachts of at least this size in meters'),
    yacht_size_ideal: z.number().optional().describe('Ideal yacht size experience'),
    specific_vessel_types: z.array(z.string()).optional().describe('e.g., Motor yacht, Sailing yacht, Explorer'),
    charter_experience_required: z.boolean().optional(),
    private_yacht_experience_required: z.boolean().optional(),
    busy_charter_experience: z.boolean().optional().describe('High-volume charter program experience'),
    large_crew_experience: z.boolean().optional().describe('Experience managing/working in large crews'),
  }),

  // Nationality requirements (CRITICAL for matching)
  nationality: z.object({
    required: z.array(z.string()).optional().describe('Nationalities explicitly required'),
    preferred: z.array(z.string()).optional().describe('Nationalities preferred but not required'),
    excluded: z.array(z.string()).optional().describe('Nationalities explicitly EXCLUDED - hard filter'),
    notes: z.string().optional().describe('Any context about nationality preferences'),
  }),

  // Certifications
  certifications: z.object({
    required: z.array(z.string()).describe('MUST have these certs'),
    preferred: z.array(z.string()).optional().describe('Nice to have certs'),
  }),

  // Visas (inferred from cruising area if not explicit)
  visas: z.object({
    required: z.array(z.string()).describe('Required visas for the cruising area'),
    notes: z.string().optional(),
  }),

  // Languages
  languages: z.object({
    required: z.array(z.object({
      language: z.string(),
      level: z.enum(['basic', 'conversational', 'fluent', 'native']).optional(),
    })).optional(),
    preferred: z.array(z.object({
      language: z.string(),
      level: z.enum(['basic', 'conversational', 'fluent', 'native']).optional(),
    })).optional(),
  }),

  // Specific skills (CRITICAL - these are what clients often really care about)
  skills: z.object({
    required: z.array(z.string()).describe('Skills explicitly required - hard filter'),
    preferred: z.array(z.string()).optional().describe('Skills that would be nice to have'),
    deal_breakers: z.array(z.string()).optional().describe('Lack of these skills is a deal breaker'),
  }),

  // Personal requirements
  personal: z.object({
    non_smoker: z.boolean().optional(),
    no_visible_tattoos: z.boolean().optional(),
    couple_acceptable: z.boolean().optional(),
    couples_preferred: z.boolean().optional().describe('Looking specifically for a couple'),
    gender_preference: z.enum(['male', 'female', 'no_preference']).optional(),
    age_range: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    personality_traits: z.array(z.string()).optional().describe('e.g., "discrete", "energetic", "professional"'),
    appearance_notes: z.string().optional().describe('Any specific appearance requirements'),
  }),

  // Availability
  availability: z.object({
    start_date: z.string().optional(),
    start_asap: z.boolean().optional(),
    latest_start_date: z.string().optional().describe('Must start by this date'),
    flexibility: z.string().optional().describe('Notes about timing flexibility'),
  }),

  // Contract details
  contract: z.object({
    type: z.enum(['permanent', 'rotational', 'seasonal', 'temporary', 'freelance']).optional(),
    rotation_schedule: z.string().optional(),
    duration_months: z.number().optional(),
    trial_period: z.string().optional(),
  }),

  // Salary/compensation
  compensation: z.object({
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    currency: z.string().optional(),
    benefits_mentioned: z.array(z.string()).optional(),
    negotiable: z.boolean().optional(),
  }),

  // Location/region
  location: z.object({
    cruising_areas: z.array(z.string()).optional(),
    home_port: z.string().optional(),
    itinerary_notes: z.string().optional(),
    travel_required: z.boolean().optional(),
  }),

  // Red flags to avoid (from private notes or between-the-lines reading)
  red_flags: z.array(z.string()).optional().describe('Things that would disqualify a candidate'),

  // Green flags to prioritize
  green_flags: z.array(z.string()).optional().describe('Things that would make a candidate stand out'),

  // Additional context
  context: z.object({
    vessel_name: z.string().optional(),
    vessel_size: z.number().optional(),
    vessel_type: z.string().optional(),
    client_notes: z.string().optional().describe('Any relevant client context'),
    urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    replacement_reason: z.string().optional().describe('Why the position is open'),
    team_dynamics: z.string().optional().describe('Notes about existing crew/team fit'),
  }),

  // The "real" requirements (what the client actually cares most about)
  priority_requirements: z.array(z.string()).describe('The 3-5 MOST important things for this role'),

  // Confidence and parsing notes
  parsing: z.object({
    confidence: z.number().min(0).max(1).describe('Confidence in the extraction'),
    ambiguities: z.array(z.string()).describe('Anything unclear that may need clarification'),
    inferred: z.array(z.string()).describe('Requirements that were inferred, not explicit'),
    brief_quality: z.enum(['minimal', 'basic', 'detailed', 'comprehensive']).describe('How much info was provided'),
  }),
});

export type ExtractedRequirements = z.infer<typeof extractedRequirementsSchema>;

// ============================================================================
// SYSTEM PROMPT FOR EXTRACTION
// ============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are a senior yacht crew recruiter with 20 years of experience working with HNW clients and superyachts.

Your job is to read job briefs - which can be ANYTHING from a one-line message to a detailed document - and extract what actually matters for finding the right candidate. You read between the lines like an experienced sourcer would.

## BRIEF FORMATS YOU'LL SEE

1. ONE-LINER: "Chief stew, 5 years, 70m+, no South Africans, needs bartending"
2. EMAIL FORWARD: "Client just called, needs a deckhand ASAP, EU passport, watersports instructor, young and fit"
3. DETAILED SPEC: Multi-page document with every requirement spelled out
4. INFORMAL NOTE: "The captain is looking for someone like James who just left - great with guests, wine expert, 50m+ experience"
5. MIXED: Some structured fields plus free-form notes and requirements

## YOUR DOMAIN EXPERTISE

### Position Hierarchy & Titles
Interior: Chief Stewardess > 2nd Stewardess > 3rd Stewardess > Junior Stew
- "Chief stew" = Chief Stewardess
- "2nd stew" = 2nd Stewardess
- "Purser" = different from stewardess (admin/accounting focus)

Deck: Captain > Chief Officer > 2nd Officer > 3rd Officer > Bosun > Lead Deckhand > Deckhand
- "Mate" usually = Chief Officer
- "Junior officer" = 2nd or 3rd Officer

Engineering: Chief Engineer > 2nd Engineer > 3rd Engineer > ETO
- "ETO" = Electrical/Electronic Technical Officer

Galley: Head Chef > Sous Chef > Sole Chef > Crew Chef
- "Private chef" = usually sole chef for owners
- "Charter chef" = high-volume, varied cuisine

### Yacht Sizes (CRITICAL for experience matching)
- 30-40m: Small yacht, starter experience
- 40-50m: Mid-size, growing complexity
- 50-70m: Large yacht - this is where it gets serious
- 70-90m: Very large - need proven track record at this level
- 90m+: Mega yacht - elite crew only

If a job is on a 70m yacht, the client wants someone who has WORKED on 60m+ yachts before.
"70m experience" means their LARGEST yacht should be around 70m or bigger.

### Cruising Areas → Automatic Visa Requirements
- Mediterranean/Europe → Schengen visa REQUIRED
- Caribbean/USA/Bahamas/Florida → B1/B2 visa REQUIRED
- Worldwide cruising → Need BOTH
- Australia/NZ → Australian working visa often needed

### Nationality - READ CAREFULLY
Clients often have preferences (or exclusions) for reasons like:
- Owner nationality (British owner may prefer British crew)
- Language requirements (French crew for French owner)
- Visa implications (EU passport easier for Med cruising)
- Past experiences (negative experience with specific nationalities)

EXCLUSIONS are HARD FILTERS. If a brief says "no South Africans" or "no Australians" - this is non-negotiable. Extract these carefully.

### Skills by Department
Interior: Silver service, wine service, bar service/cocktails, floristry, table settings, laundry (pressing), spa treatments, housekeeping to 5-star standard, inventory management, event planning
Deck: Watersports (jet ski, wakeboard, diving), tender driving, navigation, fishing, yacht maintenance, painting, varnishing
Galley: Fine dining, Mediterranean cuisine, Asian cuisine, dietary restrictions (vegan, kosher, halal), provisioning, food styling
All: Languages, first aid, guest interaction, discretion

### What "Experience" Really Means
- "5 years experience" = 5 years in yachting specifically
- "Senior" = usually 5+ years and has held positions of responsibility
- "Junior" = 0-2 years, learning role
- "Large yacht experience" = 50m+ typically
- "Charter experience" = handled charter guests (different from private)
- "Busy program" = yacht that cruises a lot, not dock-sitting

## EXTRACTION RULES

1. **Read EVERYTHING** - especially private/confidential notes which have the real requirements
2. **Nationality exclusions are CRITICAL** - these are HARD FILTERS, candidates will be rejected
3. **Infer what's obvious** - Mediterranean cruising = needs Schengen visa
4. **Note what's unusual** - "no couples" or "male only" are specific requirements
5. **Skills matter** - if they mention "bartending" specifically, it's important
6. **Size experience matters** - a 70m yacht needs 60m+ experience
7. **Read between lines** - "like James who just left" means they want similar qualities
8. **Urgency clues** - "ASAP", "urgent", "yesterday" = high urgency

## PRIORITY REQUIREMENTS

After extracting everything, identify the 3-5 things that ACTUALLY MATTER MOST.
Ask yourself: "If I had to filter 1000 candidates to 10, what would I filter on FIRST?"

Usually it's some combination of:
- Position match (Chief Stew, not just any stew)
- Experience level (5+ years, 70m+ yacht size)
- Hard exclusions (no X nationality, must have Y visa)
- Critical skills (bartending, languages)
- Availability (must start by X date)`;

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

export interface JobBriefInput {
  // Job data (structured fields from database)
  title: string;
  position_category?: string;
  vessel_name?: string;
  vessel_type?: string;
  vessel_size_meters?: number;
  contract_type?: string;
  start_date?: string;
  end_date?: string;
  primary_region?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  rotation_schedule?: string;
  is_urgent?: boolean;

  // Text content (natural language - could be ANY format)
  requirements_text?: string;
  public_description?: string;
  public_title?: string;

  // Structured requirements (from DB JSONB field)
  requirements?: {
    experience_years_min?: number;
    experience_years_ideal?: number;
    certifications_required?: string[];
    certifications_preferred?: string[];
    visas_required?: string[];
    languages_required?: string[];
    languages_preferred?: string[];
    non_smoker?: boolean;
    no_visible_tattoos?: boolean;
    nationality_preferences?: string[];
    nationality_exclusions?: string[];
    couple_acceptable?: boolean;
    skills_required?: string[];
    skills_preferred?: string[];
    yacht_size_experience?: number;
  };

  // CONFIDENTIAL - for AI matching only, NEVER expose in responses
  // This is where the real requirements often are
  private_notes?: string;

  // Raw brief text - for when the user just pastes in an email or brief
  raw_brief?: string;
}

/**
 * Analyze a job brief and extract all requirements.
 *
 * This is the AI sourcer's "brain" - it reads briefs of ANY format:
 * - One-liner: "Chief stew, 5 years, 70m+, no South Africans, needs bartending"
 * - Email forward: casual client message with scattered requirements
 * - Detailed spec: multi-page document with structured requirements
 * - Mixed: some structured DB fields plus free-form notes
 *
 * The extracted requirements are used for:
 * 1. Hard filtering (nationality exclusions, certifications, experience)
 * 2. Scoring (yacht size experience, skills match, preferences)
 * 3. AI re-ranking context (personality, cultural fit, green/red flags)
 */
export async function analyzeJobBrief(
  job: JobBriefInput
): Promise<ExtractedRequirements> {
  // Build the brief content for analysis - handle any format
  const briefContent = buildBriefContent(job);

  // Determine if this is a minimal or comprehensive brief
  const briefLength = briefContent.length;
  const hasPrivateNotes = !!job.private_notes;
  const hasStructuredReqs = !!job.requirements && Object.keys(job.requirements).length > 0;

  const { object } = await generateObject({
    model: anthropic('claude-3-5-haiku-20241022'),
    schema: extractedRequirementsSchema,
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: `Analyze this job brief and extract ALL requirements.

${job.raw_brief ? `
<raw_brief>
This is the original brief as provided (could be an email, message, or document):
${job.raw_brief}
</raw_brief>
` : ''}

<structured_job_data>
${briefContent}
</structured_job_data>

${job.private_notes ? `
<confidential_notes>
IMPORTANT - RECRUITER'S PRIVATE NOTES (contains the REAL requirements):
${job.private_notes}
</confidential_notes>
` : ''}

INSTRUCTIONS:
1. Extract EVERY requirement, preference, and deal-breaker
2. Nationality EXCLUSIONS are HARD FILTERS - extract them carefully
3. Infer visa requirements from cruising area if not stated
4. Skills mentioned specifically (like "bartending") are important
5. Yacht size experience: if job is 70m, candidate should have 60m+ experience
6. Read between the lines - what does the client REALLY want?
7. Identify the 3-5 PRIORITY requirements that matter most

Brief quality assessment:
- Length: ${briefLength} chars
- Has private notes: ${hasPrivateNotes}
- Has structured requirements: ${hasStructuredReqs}`,
    temperature: 0.1, // Low temperature for consistency
  });

  // Merge with existing structured requirements (DB takes precedence for explicit values)
  return mergeWithStructuredRequirements(object, job);
}

/**
 * Build brief content for analysis from structured DB fields.
 * The AI will also receive raw_brief and private_notes separately.
 */
function buildBriefContent(job: JobBriefInput): string {
  const parts: string[] = [];

  // Position info
  parts.push(`POSITION: ${job.public_title || job.title}`);
  if (job.position_category) {
    parts.push(`DEPARTMENT: ${job.position_category}`);
  }

  // Vessel info (critical for experience matching)
  if (job.vessel_name || job.vessel_type || job.vessel_size_meters) {
    parts.push('\nVESSEL:');
    if (job.vessel_name) parts.push(`  Name: ${job.vessel_name}`);
    if (job.vessel_type) parts.push(`  Type: ${job.vessel_type}`);
    if (job.vessel_size_meters) parts.push(`  Size: ${job.vessel_size_meters}m`);
  }

  // Contract info
  if (job.contract_type || job.start_date || job.end_date || job.rotation_schedule) {
    parts.push('\nCONTRACT:');
    if (job.contract_type) parts.push(`  Type: ${job.contract_type}`);
    if (job.start_date) parts.push(`  Start: ${job.start_date}`);
    if (job.end_date) parts.push(`  End: ${job.end_date}`);
    if (job.rotation_schedule) parts.push(`  Rotation: ${job.rotation_schedule}`);
  }

  // Location (critical for visa requirements)
  if (job.primary_region) {
    parts.push(`\nCRUISING AREA: ${job.primary_region}`);
  }

  // Compensation
  if (job.salary_min || job.salary_max) {
    const currency = job.salary_currency || 'EUR';
    const salary = job.salary_min && job.salary_max
      ? `${currency} ${job.salary_min} - ${job.salary_max}/month`
      : job.salary_min
        ? `From ${currency} ${job.salary_min}/month`
        : `Up to ${currency} ${job.salary_max}/month`;
    parts.push(`\nSALARY: ${salary}`);
  }

  // Urgency indicator
  if (job.is_urgent) {
    parts.push(`\nURGENCY: URGENT`);
  }

  // Natural language requirements text
  if (job.requirements_text) {
    parts.push(`\nREQUIREMENTS TEXT:\n${job.requirements_text}`);
  }

  // Public description
  if (job.public_description) {
    parts.push(`\nJOB DESCRIPTION:\n${job.public_description}`);
  }

  // Include structured requirements from JSONB field
  if (job.requirements) {
    const req = job.requirements;
    const structuredParts: string[] = [];

    if (req.experience_years_min) {
      structuredParts.push(`Minimum experience: ${req.experience_years_min} years`);
    }
    if (req.experience_years_ideal) {
      structuredParts.push(`Ideal experience: ${req.experience_years_ideal} years`);
    }
    if (req.yacht_size_experience) {
      structuredParts.push(`Yacht size experience required: ${req.yacht_size_experience}m+`);
    }
    if (req.certifications_required?.length) {
      structuredParts.push(`Required certifications: ${req.certifications_required.join(', ')}`);
    }
    if (req.certifications_preferred?.length) {
      structuredParts.push(`Preferred certifications: ${req.certifications_preferred.join(', ')}`);
    }
    if (req.visas_required?.length) {
      structuredParts.push(`Required visas: ${req.visas_required.join(', ')}`);
    }
    if (req.languages_required?.length) {
      structuredParts.push(`Required languages: ${req.languages_required.join(', ')}`);
    }
    if (req.languages_preferred?.length) {
      structuredParts.push(`Preferred languages: ${req.languages_preferred.join(', ')}`);
    }
    if (req.skills_required?.length) {
      structuredParts.push(`Required skills: ${req.skills_required.join(', ')}`);
    }
    if (req.skills_preferred?.length) {
      structuredParts.push(`Preferred skills: ${req.skills_preferred.join(', ')}`);
    }
    if (req.non_smoker) {
      structuredParts.push('Non-smoker required');
    }
    if (req.no_visible_tattoos) {
      structuredParts.push('No visible tattoos');
    }
    if (req.nationality_preferences?.length) {
      structuredParts.push(`Nationality preferences: ${req.nationality_preferences.join(', ')}`);
    }
    if (req.nationality_exclusions?.length) {
      structuredParts.push(`EXCLUDED NATIONALITIES: ${req.nationality_exclusions.join(', ')}`);
    }
    if (req.couple_acceptable !== undefined) {
      structuredParts.push(req.couple_acceptable ? 'Couples acceptable' : 'No couples');
    }

    if (structuredParts.length > 0) {
      parts.push(`\nSTRUCTURED REQUIREMENTS:\n${structuredParts.join('\n')}`);
    }
  }

  return parts.join('\n');
}

/**
 * Merge AI-extracted requirements with database structured requirements
 * Database explicit values take precedence for any overlap
 */
function mergeWithStructuredRequirements(
  extracted: ExtractedRequirements,
  job: JobBriefInput
): ExtractedRequirements {
  const req = job.requirements || {};

  // ---- EXPERIENCE ----
  if (req.experience_years_min !== undefined) {
    extracted.experience.years_min = req.experience_years_min;
  }
  if (req.experience_years_ideal !== undefined) {
    extracted.experience.years_ideal = req.experience_years_ideal;
  }
  if (req.yacht_size_experience !== undefined) {
    extracted.experience.yacht_size_min = req.yacht_size_experience;
  }

  // If job has vessel size, use it for context and infer experience requirement
  if (job.vessel_size_meters) {
    extracted.context.vessel_size = job.vessel_size_meters;
    // If no yacht size experience was extracted/set, infer from job
    if (!extracted.experience.yacht_size_min && !req.yacht_size_experience) {
      // For large yachts, require experience on similar size
      if (job.vessel_size_meters >= 50) {
        extracted.experience.yacht_size_min = Math.max(
          Math.floor(job.vessel_size_meters * 0.7), // At least 70% of job size
          40 // Minimum 40m for any larger yacht
        );
        extracted.parsing.inferred.push(
          `Inferred yacht size experience (${extracted.experience.yacht_size_min}m+) from vessel size (${job.vessel_size_meters}m)`
        );
      }
    }
  }

  // ---- CERTIFICATIONS ----
  if (req.certifications_required?.length) {
    const dbCerts = new Set(req.certifications_required.map(c => c.toUpperCase()));
    const extractedRequired = extracted.certifications.required.filter(
      c => !dbCerts.has(c.toUpperCase())
    );
    extracted.certifications.required = [
      ...req.certifications_required,
      ...extractedRequired,
    ];
  }
  if (req.certifications_preferred?.length) {
    extracted.certifications.preferred = [
      ...(extracted.certifications.preferred || []),
      ...req.certifications_preferred.filter(c =>
        !extracted.certifications.preferred?.includes(c)
      ),
    ];
  }

  // ---- VISAS ----
  if (req.visas_required?.length) {
    const existing = new Set(extracted.visas.required.map(v => v.toLowerCase()));
    for (const visa of req.visas_required) {
      if (!existing.has(visa.toLowerCase())) {
        extracted.visas.required.push(visa);
      }
    }
  }

  // ---- SKILLS ----
  if (req.skills_required?.length) {
    const existing = new Set(extracted.skills.required.map(s => s.toLowerCase()));
    for (const skill of req.skills_required) {
      if (!existing.has(skill.toLowerCase())) {
        extracted.skills.required.push(skill);
      }
    }
  }
  if (req.skills_preferred?.length) {
    extracted.skills.preferred = [
      ...(extracted.skills.preferred || []),
      ...req.skills_preferred.filter(s =>
        !extracted.skills.preferred?.map(sp => sp.toLowerCase()).includes(s.toLowerCase())
      ),
    ];
  }

  // ---- PERSONAL REQUIREMENTS ----
  if (req.non_smoker !== undefined) {
    extracted.personal.non_smoker = req.non_smoker;
  }
  if (req.no_visible_tattoos !== undefined) {
    extracted.personal.no_visible_tattoos = req.no_visible_tattoos;
  }
  if (req.couple_acceptable !== undefined) {
    extracted.personal.couple_acceptable = req.couple_acceptable;
  }

  // ---- NATIONALITY ----
  // Preferences from DB
  if (req.nationality_preferences?.length) {
    extracted.nationality.preferred = [
      ...(extracted.nationality.preferred || []),
      ...req.nationality_preferences.filter(n =>
        !extracted.nationality.preferred?.map(np => np.toLowerCase()).includes(n.toLowerCase())
      ),
    ];
  }
  // Exclusions from DB (CRITICAL - these are hard filters)
  if (req.nationality_exclusions?.length) {
    extracted.nationality.excluded = [
      ...(extracted.nationality.excluded || []),
      ...req.nationality_exclusions.filter(n =>
        !extracted.nationality.excluded?.map(ne => ne.toLowerCase()).includes(n.toLowerCase())
      ),
    ];
  }

  // ---- LANGUAGES ----
  if (req.languages_required?.length) {
    const existing = new Set(
      extracted.languages.required?.map(l => l.language.toLowerCase()) || []
    );
    for (const lang of req.languages_required) {
      if (!existing.has(lang.toLowerCase())) {
        extracted.languages.required = [
          ...(extracted.languages.required || []),
          { language: lang },
        ];
      }
    }
  }
  if (req.languages_preferred?.length) {
    const existing = new Set(
      extracted.languages.preferred?.map(l => l.language.toLowerCase()) || []
    );
    for (const lang of req.languages_preferred) {
      if (!existing.has(lang.toLowerCase())) {
        extracted.languages.preferred = [
          ...(extracted.languages.preferred || []),
          { language: lang },
        ];
      }
    }
  }

  // ---- CONTEXT FROM JOB ----
  if (job.vessel_name) extracted.context.vessel_name = job.vessel_name;
  if (job.vessel_type) extracted.context.vessel_type = job.vessel_type;
  if (job.is_urgent) extracted.context.urgency = 'urgent';

  // ---- CONTRACT ----
  if (job.contract_type) {
    extracted.contract.type = job.contract_type as ExtractedRequirements['contract']['type'];
  }
  if (job.rotation_schedule) {
    extracted.contract.rotation_schedule = job.rotation_schedule;
  }

  // ---- COMPENSATION ----
  if (job.salary_min) extracted.compensation.salary_min = job.salary_min;
  if (job.salary_max) extracted.compensation.salary_max = job.salary_max;
  if (job.salary_currency) extracted.compensation.currency = job.salary_currency;

  // ---- AVAILABILITY ----
  if (job.start_date) {
    extracted.availability.start_date = job.start_date;
  }

  // ---- LOCATION ----
  if (job.primary_region) {
    extracted.location.cruising_areas = extracted.location.cruising_areas || [];
    if (!extracted.location.cruising_areas.map(r => r.toLowerCase()).includes(job.primary_region.toLowerCase())) {
      extracted.location.cruising_areas.unshift(job.primary_region);
    }
  }

  return extracted;
}

/**
 * Safe version with fallback on error
 */
export async function analyzeJobBriefSafe(
  job: JobBriefInput
): Promise<ExtractedRequirements> {
  try {
    return await analyzeJobBrief(job);
  } catch (error) {
    console.error('Job brief analysis failed:', error);
    // Return minimal requirements from structured data
    return createFallbackRequirements(job);
  }
}

/**
 * Create fallback requirements from structured data only
 * Used when AI extraction fails
 */
function createFallbackRequirements(job: JobBriefInput): ExtractedRequirements {
  const req = job.requirements || {};

  // Infer yacht size experience from vessel size
  let yachtSizeMin: number | undefined;
  if (job.vessel_size_meters && job.vessel_size_meters >= 50) {
    yachtSizeMin = Math.max(Math.floor(job.vessel_size_meters * 0.7), 40);
  }

  return {
    position: {
      title: job.public_title || job.title,
      category: (job.position_category as ExtractedRequirements['position']['category']) || 'other',
    },
    experience: {
      years_min: req.experience_years_min,
      years_ideal: req.experience_years_ideal,
      yacht_size_min: req.yacht_size_experience || yachtSizeMin,
    },
    nationality: {
      required: undefined,
      preferred: req.nationality_preferences,
      excluded: req.nationality_exclusions,
    },
    certifications: {
      required: req.certifications_required || ['STCW', 'ENG1'],
      preferred: req.certifications_preferred || [],
    },
    visas: {
      required: req.visas_required || [],
    },
    languages: {
      required: req.languages_required?.map(l => ({ language: l })),
      preferred: req.languages_preferred?.map(l => ({ language: l })),
    },
    skills: {
      required: req.skills_required || [],
      preferred: req.skills_preferred || [],
    },
    personal: {
      non_smoker: req.non_smoker,
      no_visible_tattoos: req.no_visible_tattoos,
      couple_acceptable: req.couple_acceptable,
    },
    availability: {
      start_date: job.start_date,
      start_asap: job.is_urgent,
    },
    contract: {
      type: job.contract_type as ExtractedRequirements['contract']['type'],
      rotation_schedule: job.rotation_schedule,
    },
    compensation: {
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      currency: job.salary_currency,
    },
    location: {
      cruising_areas: job.primary_region ? [job.primary_region] : [],
    },
    red_flags: [],
    green_flags: [],
    context: {
      vessel_name: job.vessel_name,
      vessel_size: job.vessel_size_meters,
      vessel_type: job.vessel_type,
      urgency: job.is_urgent ? 'urgent' : undefined,
    },
    priority_requirements: [
      `Position: ${job.public_title || job.title}`,
      ...(req.experience_years_min ? [`${req.experience_years_min}+ years experience`] : []),
      ...(yachtSizeMin ? [`${yachtSizeMin}m+ yacht experience`] : []),
    ],
    parsing: {
      confidence: 0.5,
      ambiguities: ['Full brief analysis unavailable - using structured data only'],
      inferred: yachtSizeMin ? [`Yacht size experience inferred from vessel size (${job.vessel_size_meters}m)`] : [],
      brief_quality: 'minimal',
    },
  };
}
