// ============================================================================
// LIGHTHOUSE CREW NETWORK - Brief Parser
// ============================================================================
// Parses raw job briefs (from WhatsApp, email, etc.) into structured
// job requirements using GPT-4o with structured JSON output.
// ============================================================================

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// TYPES (matches packages/database/types.ts BriefParsedData)
// ----------------------------------------------------------------------------

export interface BriefParsedData {
  position: string;
  positionCategory: 'deck' | 'interior' | 'galley' | 'engineering' | 'captain' | 'other';
  vessel: {
    name: string | null;
    type: 'motor' | 'sailing' | 'catamaran' | 'explorer' | null;
    sizeMeters: number | null;
  };
  contract: {
    type: 'permanent' | 'rotational' | 'seasonal' | 'temporary' | null;
    rotation: string | null;
    startDate: string | null;
  };
  compensation: {
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
  };
  requirements: {
    minExperience: number | null;
    minYachtSize: number | null;
    certifications: string[];
    languages: string[];
    other: string[];
  };
  location: {
    cruisingAreas: string[];
    base: string | null;
  };
  ambiguities: Array<{
    field: string;
    issue: string;
    suggestedQuestion: string;
  }>;
  confidence: number;
}

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const GPT_MODEL = 'gpt-4o';

// ----------------------------------------------------------------------------
// SCHEMA
// ----------------------------------------------------------------------------

const briefParsedDataSchema = z.object({
  position: z.string().describe('Standardized position title (e.g., "Chief Stewardess", "Bosun", "Head Chef")'),
  positionCategory: z.enum(['deck', 'interior', 'galley', 'engineering', 'captain', 'other'])
    .describe('Category of the position'),
  vessel: z.object({
    name: z.union([z.string(), z.null()]).describe('Vessel name if mentioned, null otherwise'),
    type: z.union([z.enum(['motor', 'sailing', 'catamaran', 'explorer']), z.null()])
      .describe('Type of yacht, null if unknown'),
    sizeMeters: z.union([z.number(), z.null()]).describe('Yacht size in meters, null if not mentioned'),
  }),
  contract: z.object({
    type: z.union([z.enum(['permanent', 'rotational', 'seasonal', 'temporary']), z.null()])
      .describe('Contract type, null if not specified'),
    rotation: z.union([z.string(), z.null()]).describe('Rotation schedule if mentioned (e.g., "8 weeks on/off"), null otherwise'),
    startDate: z.union([z.string(), z.null()]).describe('Start date in ISO format if mentioned, or "asap" if urgent, null otherwise'),
  }),
  compensation: z.object({
    salaryMin: z.union([z.number(), z.null()]).describe('Minimum monthly salary in the specified currency, null if not mentioned'),
    salaryMax: z.union([z.number(), z.null()]).describe('Maximum monthly salary in the specified currency, null if not mentioned'),
    currency: z.string().describe('Currency code (EUR, USD, GBP) - default to EUR if not specified'),
  }),
  requirements: z.object({
    minExperience: z.union([z.number(), z.null()]).describe('Minimum years of experience required, null if not specified'),
    minYachtSize: z.union([z.number(), z.null()]).describe('Minimum yacht size experience required in meters, null if not specified'),
    certifications: z.array(z.string()).describe('Required certifications (STCW, ENG1, WSET, OOW, MCA, PYA, RYA, etc.)'),
    languages: z.array(z.string()).describe('Required languages'),
    other: z.array(z.string()).describe('Other specific requirements mentioned'),
  }),
  location: z.object({
    cruisingAreas: z.array(z.string()).describe('Cruising regions (Mediterranean, Caribbean, Bahamas, etc.)'),
    base: z.union([z.string(), z.null()]).describe('Home port or base location if mentioned, null otherwise'),
  }),
  ambiguities: z.array(z.object({
    field: z.string().describe('The field that is ambiguous'),
    issue: z.string().describe('Description of what is unclear'),
    suggestedQuestion: z.string().describe('A question to ask the client for clarification'),
  })).describe('List of ambiguous items that need clarification'),
  confidence: z.number().describe('Confidence score from 0-100'),
});

// ----------------------------------------------------------------------------
// SYSTEM PROMPT
// ----------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert yacht and superyacht crew recruitment specialist with deep industry knowledge.

## Your Expertise

### Position Names & Categories
- **Deck**: Captain, Chief Officer (1st Mate), Second Officer, Third Officer, Bosun (Boatswain), Lead Deckhand, Deckhand, Junior Deckhand
- **Interior**: Chief Stewardess (Chief Stew), Second Stewardess, Third Stewardess, Junior Stewardess, Head of Service, Butler, Purser, Laundress
- **Galley**: Head Chef, Executive Chef, Sole Chef, Second Chef (Sous Chef), Crew Chef
- **Engineering**: Chief Engineer, Second Engineer, Third Engineer, ETO (Electro-Technical Officer), Junior Engineer
- **Captain**: Captain, Master, Skipper (implies command)
- **Other**: Nanny, Governess, Nurse, Security Officer, Dive Instructor, Water Sports Instructor, Spa Therapist, Personal Trainer

### Contract Types
- **Permanent**: Long-term employment, typically 11 months on / 1 month off or similar
- **Rotational**: Equal time on/off (e.g., 6 weeks on / 6 weeks off, 8/8, 10/10)
- **Seasonal**: Summer season (Med: May-October) or Winter season (Caribbean: November-April)
- **Temporary**: Short-term cover, delivery trips, or specific charter periods

### Yacht Sizes (in meters)
- 24-35m: Small yacht, typically 4-8 crew
- 35-50m: Medium yacht, typically 8-12 crew
- 50-70m: Large yacht, typically 12-18 crew
- 70-100m: Superyacht, typically 18-30 crew
- 100m+: Megayacht, 30+ crew

### Common Certifications
- **STCW**: Standards of Training, Certification and Watchkeeping (mandatory for all sea-going crew)
- **ENG1**: UK seafarer medical certificate (standard requirement)
- **WSET**: Wine & Spirit Education Trust (for interior, levels 1-4)
- **OOW**: Officer of the Watch (deck officers)
- **MCA**: Maritime and Coastguard Agency certifications
- **PYA**: Professional Yachting Association
- **RYA**: Royal Yachting Association (Yachtmaster, Day Skipper, etc.)
- **PADI/SSI**: Dive certifications
- **Food Safety Level 2/3**: For galley crew
- **Silver Service**: For interior crew
- **Ship Security Officer (SSO)**: Security certification

### Cruising Regions
- **Mediterranean (Med)**: West Med (Spain, France, Italy), East Med (Greece, Turkey, Croatia)
- **Caribbean**: BVI, USVI, St. Barts, Bahamas, Turks & Caicos
- **Americas**: Florida, New England, Pacific Northwest, Mexico
- **Other**: Red Sea, Indian Ocean, Southeast Asia, Australia, Pacific Islands

### Salary Benchmarks (Monthly EUR, approximate)
- Deckhand: €2,500-3,500
- Stewardess: €2,800-4,000
- Chef (sole): €5,000-8,000
- Chief Stew: €5,000-8,000
- Bosun: €4,000-5,500
- Engineer: €5,500-9,000
- Captain: €10,000-25,000+

## Parsing Instructions

1. **Extract all explicit information** from the brief
2. **Standardize position titles** (e.g., "chief stew" → "Chief Stewardess", "eng" → "Engineer")
3. **Infer reasonable defaults** based on industry standards:
   - Always include STCW and ENG1 in certifications for sea-going positions unless explicitly stated otherwise
   - Infer vessel type from context (55m motor, 40m sailing, etc.)
4. **Convert salary** to monthly amount in the specified currency
   - "6k" or "€6k" = 6000 EUR monthly
   - "$80k/year" = ~6667 USD monthly
5. **Parse dates flexibly**: "asap" = "asap", "summer" = approximate month, specific dates in ISO format
6. **Flag ambiguities** with helpful clarifying questions
7. **Score confidence** based on completeness:
   - 90-100: All key fields clear
   - 70-89: Most fields clear, minor gaps
   - 50-69: Several important fields missing
   - Below 50: Too vague, needs significant clarification

## Common Abbreviations
- M/Y = Motor Yacht
- S/Y = Sailing Yacht
- LOA = Length Overall
- Med = Mediterranean
- Carib = Caribbean
- Perm = Permanent
- Temp = Temporary
- Rota = Rotational
- ASAP = As Soon As Possible`;

// ----------------------------------------------------------------------------
// CLIENT CONTEXT
// ----------------------------------------------------------------------------

interface ClientContext {
  name?: string;
  vessel_name?: string;
  vessel_type?: string;
  vessel_size?: number;
  past_preferences?: Record<string, unknown>;
}

function buildClientContextPrompt(context?: ClientContext): string {
  if (!context) return '';

  const lines: string[] = ['<client_context>'];
  if (context.name) lines.push(`Client: ${context.name}`);
  if (context.vessel_name) lines.push(`Known vessel: ${context.vessel_name}`);
  if (context.vessel_type) lines.push(`Vessel type: ${context.vessel_type}`);
  if (context.vessel_size) lines.push(`Vessel size: ${context.vessel_size}m`);
  lines.push('</client_context>');

  return lines.join('\n');
}

// ----------------------------------------------------------------------------
// ERROR TYPES
// ----------------------------------------------------------------------------

export class BriefParseError extends Error {
  constructor(
    message: string,
    public readonly code: 'API_ERROR' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'RATE_LIMITED',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'BriefParseError';
  }
}

// ----------------------------------------------------------------------------
// MAIN FUNCTION
// ----------------------------------------------------------------------------

/**
 * Parse a raw job brief into structured BriefParsedData
 *
 * @param rawContent - The raw brief text (from WhatsApp, email, phone notes, etc.)
 * @param clientContext - Optional context about the client for better parsing
 * @returns Structured BriefParsedData with confidence score and ambiguities
 * @throws BriefParseError on API or parsing failures
 *
 * @example
 * ```ts
 * const result = await parseBrief(
 *   "Need chief stew for 55m motor, Med summer, 5+ years, French speaker, €6k budget, asap"
 * );
 * console.log(result.position); // "Chief Stewardess"
 * console.log(result.confidence); // 75
 * ```
 */
export async function parseBrief(
  rawContent: string,
  clientContext?: ClientContext
): Promise<BriefParsedData> {
  if (!rawContent || rawContent.trim().length === 0) {
    throw new BriefParseError(
      'Brief content cannot be empty',
      'VALIDATION_ERROR'
    );
  }

  try {
    const clientContextPrompt = buildClientContextPrompt(clientContext);

    const { object } = await generateObject({
      model: openai(GPT_MODEL, { structuredOutputs: true }),
      schema: briefParsedDataSchema,
      system: SYSTEM_PROMPT,
      prompt: `Parse this job brief into structured requirements:

<brief>
${rawContent}
</brief>

${clientContextPrompt}

Extract all information and return structured data. Be thorough in identifying ambiguities that would need clarification from the client.`,
    });

    // Post-process to ensure proper types
    return {
      position: object.position,
      positionCategory: object.positionCategory,
      vessel: {
        name: object.vessel.name,
        type: object.vessel.type,
        sizeMeters: object.vessel.sizeMeters,
      },
      contract: {
        type: object.contract.type,
        rotation: object.contract.rotation,
        startDate: object.contract.startDate,
      },
      compensation: {
        salaryMin: object.compensation.salaryMin,
        salaryMax: object.compensation.salaryMax,
        currency: object.compensation.currency || 'EUR',
      },
      requirements: {
        minExperience: object.requirements.minExperience,
        minYachtSize: object.requirements.minYachtSize,
        certifications: object.requirements.certifications || [],
        languages: object.requirements.languages || [],
        other: object.requirements.other || [],
      },
      location: {
        cruisingAreas: object.location.cruisingAreas || [],
        base: object.location.base,
      },
      ambiguities: object.ambiguities || [],
      confidence: object.confidence,
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('rate limit') || message.includes('429')) {
        throw new BriefParseError(
          'API rate limit exceeded. Please try again in a moment.',
          'RATE_LIMITED',
          error
        );
      }

      if (message.includes('api') || message.includes('fetch') || message.includes('network')) {
        throw new BriefParseError(
          'Failed to connect to AI service. Please check your API key and try again.',
          'API_ERROR',
          error
        );
      }

      if (message.includes('parse') || message.includes('json') || message.includes('schema')) {
        throw new BriefParseError(
          'Failed to parse AI response. The brief may be too unusual.',
          'PARSE_ERROR',
          error
        );
      }
    }

    throw new BriefParseError(
      'An unexpected error occurred while parsing the brief.',
      'API_ERROR',
      error
    );
  }
}

// ----------------------------------------------------------------------------
// LEGACY COMPATIBILITY - BriefParser class
// ----------------------------------------------------------------------------

/**
 * @deprecated Use the parseBrief function directly instead
 */
export class BriefParser {
  async parse(
    briefContent: string,
    clientContext?: ClientContext
  ): Promise<BriefParsedData> {
    return parseBrief(briefContent, clientContext);
  }
}

// ----------------------------------------------------------------------------
// EXPORTS
// ----------------------------------------------------------------------------

export type { ClientContext };
export { briefParsedDataSchema };
