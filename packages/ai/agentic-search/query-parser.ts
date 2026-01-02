// ============================================================================
// V4 AGENTIC SEARCH - Query Parser
// ============================================================================
// Uses gpt-4o-mini to extract structured requirements from natural language.
// This is Stage 1 of the V4 pipeline.
// ============================================================================

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { ParsedQuery } from './types';

// ----------------------------------------------------------------------------
// SCHEMA FOR STRUCTURED OUTPUT
// ----------------------------------------------------------------------------

const parsedQuerySchema = z.object({
  position: z.string().nullable().describe('Exact position name extracted, or null if not specified'),
  hardFilters: z.object({
    require_stcw: z.boolean().nullable(),
    require_eng1: z.boolean().nullable(),
    require_schengen: z.boolean().nullable(),
    require_b1b2: z.boolean().nullable(),
    min_experience: z.number().nullable(),
    max_experience: z.number().nullable(),
    positions: z.array(z.string()).nullable().describe('Array of position synonyms to match'),
  }),
  softPreferences: z.object({
    region: z.string().nullable(),
    yacht_type: z.string().nullable(),
    contract_type: z.string().nullable(),
  }),
  searchIntent: z.enum(['role-based', 'skill-based', 'availability-based', 'general']),
});

// ----------------------------------------------------------------------------
// SYSTEM PROMPT
// ----------------------------------------------------------------------------

const QUERY_PARSER_PROMPT = `You are a query parser for a yacht and villa crew recruitment platform.
Extract structured requirements from the search query.

## Position Mappings (use these for the positions array):
Interior Department:
- "stew", "stewardess" → ["Stewardess", "Chief Stewardess", "2nd Stewardess", "3rd Stewardess", "Junior Stewardess"]
- "chief stew" → ["Chief Stewardess"]
- "interior" → ["Stewardess", "Chief Stewardess", "2nd Stewardess", "3rd Stewardess", "Head Housekeeper", "Butler"]
- "housekeeper" → ["Head Housekeeper", "Housekeeper"]

Deck Department:
- "deck", "deckhand" → ["Deckhand", "Lead Deckhand", "Junior Deckhand"]
- "bosun" → ["Bosun"]
- "officer", "mate" → ["1st Officer", "2nd Officer", "3rd Officer", "Chief Officer"]
- "captain" → ["Captain"]

Engineering:
- "engineer", "engineering" → ["Engineer", "Chief Engineer", "2nd Engineer", "3rd Engineer", "Electrical Engineer"]
- "eto" → ["ETO", "Electrical Engineer"]

Galley:
- "chef", "cook" → ["Chef", "Head Chef", "Sous Chef", "Crew Chef", "Cook"]
- "head chef" → ["Head Chef", "Executive Chef"]

Admin/Purser:
- "purser" → ["Purser", "Senior Purser", "Junior Purser"]
- "admin", "administration" → ["Purser", "Administrator", "PA"]
- "pa", "personal assistant" → ["PA", "Personal Assistant"]

Other:
- "nanny", "childcare" → ["Nanny", "Governess"]
- "massage", "spa" → ["Massage Therapist", "Spa Therapist", "Beauty Therapist"]
- "fitness" → ["Fitness Instructor", "Personal Trainer"]
- "security" → ["Security Officer", "Security Guard"]
- "beauty", "beautician" → ["Beauty Therapist", "Hair Stylist"]

## Certification Keywords:
- "STCW", "safety cert", "basic safety" → require_stcw: true
- "ENG1", "medical", "medical cert" → require_eng1: true
- "Schengen", "EU work", "work in EU" → require_schengen: true
- "B1/B2", "B1B2", "US visa", "work in US" → require_b1b2: true

## Experience Patterns:
- "5+ years", "5 years experience", "five years" → min_experience: 5
- "senior" (implies 5+ years) → min_experience: 5
- "experienced" (implies 3+ years) → min_experience: 3
- "junior", "entry level", "green" → max_experience: 2, min_experience: null
- "X-Y years" → min_experience: X, max_experience: Y

## Region Keywords:
- "med", "mediterranean" → region: "Mediterranean"
- "caribbean", "carib" → region: "Caribbean"
- "florida", "ft lauderdale", "miami" → region: "Florida"
- "pacific", "south pacific" → region: "Pacific"
- "worldwide", "global" → region: "Worldwide"

## Contract Keywords:
- "permanent", "perm" → contract_type: "permanent"
- "rotational", "rotation" → contract_type: "rotational"
- "seasonal", "season" → contract_type: "seasonal"
- "temp", "temporary" → contract_type: "temporary"
- "day work", "freelance" → contract_type: "freelance"

## Search Intent:
- role-based: Looking for a specific position/role
- skill-based: Looking for specific skills/certifications
- availability-based: Looking for available candidates
- general: Broad search without specific criteria

## Rules:
1. If no specific requirements are mentioned, return null for that field
2. Be conservative - don't assume requirements not mentioned
3. Always try to map informal terms to standard positions
4. If someone says "stew" they mean Stewardess roles
5. Extract ALL relevant positions as synonyms when applicable`;

// ----------------------------------------------------------------------------
// MAIN FUNCTION
// ----------------------------------------------------------------------------

/**
 * Parse a natural language search query into structured requirements.
 *
 * @param query - The user's search query
 * @returns Parsed query with hard filters, soft preferences, and search intent
 *
 * @example
 * ```ts
 * const parsed = await parseQuery("Chief Stewardess with STCW and 5+ years for Med season");
 * // Returns:
 * // {
 * //   position: "Chief Stewardess",
 * //   hardFilters: { require_stcw: true, min_experience: 5, positions: ["Chief Stewardess"] },
 * //   softPreferences: { region: "Mediterranean", contract_type: "seasonal" },
 * //   searchIntent: "role-based"
 * // }
 * ```
 */
export async function parseQuery(query: string): Promise<ParsedQuery> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: parsedQuerySchema,
    system: QUERY_PARSER_PROMPT,
    prompt: `Parse this search query: "${query}"`,
    temperature: 0, // Deterministic output
  });

  return {
    originalQuery: query,
    position: object.position ?? undefined,
    hardFilters: {
      require_stcw: object.hardFilters.require_stcw ?? undefined,
      require_eng1: object.hardFilters.require_eng1 ?? undefined,
      require_schengen: object.hardFilters.require_schengen ?? undefined,
      require_b1b2: object.hardFilters.require_b1b2 ?? undefined,
      min_experience: object.hardFilters.min_experience ?? undefined,
      max_experience: object.hardFilters.max_experience ?? undefined,
      positions: object.hardFilters.positions ?? undefined,
    },
    softPreferences: {
      region: object.softPreferences.region ?? undefined,
      yacht_type: object.softPreferences.yacht_type ?? undefined,
      contract_type: object.softPreferences.contract_type ?? undefined,
    },
    searchIntent: object.searchIntent,
  };
}

/**
 * Parse query with fallback for errors.
 * Returns a minimal parsed query if LLM fails.
 */
export async function parseQuerySafe(query: string): Promise<ParsedQuery> {
  try {
    return await parseQuery(query);
  } catch (error) {
    console.error('Query parsing failed, using fallback:', error);
    return {
      originalQuery: query,
      hardFilters: {},
      softPreferences: {},
      searchIntent: 'general',
    };
  }
}
