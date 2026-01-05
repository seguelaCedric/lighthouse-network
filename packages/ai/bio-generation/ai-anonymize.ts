// ============================================================================
// AI-POWERED BIO ANONYMIZATION
// ============================================================================
// Uses Claude Haiku to intelligently remove ALL PII from candidate bios.
// Much more robust than regex patterns - handles yacht names, company names,
// property names, and any other entities we don't explicitly track.
// ============================================================================

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const ANONYMIZATION_PROMPT = `You are anonymizing a professional bio to remove ALL personally identifiable information (PII) while preserving qualifications and experience.

CRITICAL RULES - REMOVE these (replace with generic descriptors):

1. Person names → "This candidate", "they", "the professional"
   - Replace ALL occurrences of the candidate's name
   - Replace reference names with "a former supervisor", "a previous employer"

2. Yacht/vessel names → "a [size]m [type] yacht" or "a luxury yacht"
   - Examples:
     - "M/Y VICTORIA (85m)" → "a 85m motor yacht"
     - "M/V DAWN" → "a luxury motor yacht"
     - "M.Y. ANTELOPE IV (43m)" → "a 43m motor yacht"
     - "S/Y SERENITY" → "a sailing yacht"

3. Property/estate names → "a [type] in [location]" or "a [type]"
   - Examples:
     - "Villa Ephrussi in Monaco" → "a private villa in Monaco"
     - "Buckingham Palace" → "a palace"
     - "Château de Versailles" → "a château in France"

4. Company names → "a [industry] company" or "a [type] organization"
   - Examples:
     - "Microsoft" → "a technology company"
     - "AIT (Advanced Integrated Technology)" → "a maritime services company"
     - "The Ritz-Carlton" → "a luxury hotel chain"
     - "Goldman Sachs" → "a financial services firm"
     - Be smart about context - infer industry from role/position

5. School/University names → "a [type] institution" or "a university"
   - Examples:
     - "Harvard University" → "a prestigious university"
     - "Le Cordon Bleu" → "a culinary school"

PRESERVE (keep these - they're not PII):
- Position titles: "Chief Steward", "Deckhand", "Chef de Partie", "Captain"
- Experience duration: "5 years", "41 months", "2015-2018"
- Vessel specifications: sizes (85m, 163m), types (motor yacht, sailing yacht, superyacht)
- Geographic locations: countries, cities, regions, seas ("Mediterranean", "Monaco", "Caribbean")
- Certifications and licenses: "STCW", "MCA ENG1", "Master 500GT", "HACCP"
- Skills: "navigation", "maintenance", "culinary arts"
- Responsibilities and achievements: "managed 12-person crew", "maintained 5-star standards"
- Nationalities: "British", "French", "American" (useful for visa/work permit context)
- Languages: "fluent in English and French"

IMPORTANT FORMATTING:
- Maintain paragraph structure
- Keep professional tone
- Use third-person perspective
- Preserve bullet points if present
- Keep the bio's narrative flow and readability

OUTPUT:
Return ONLY the anonymized bio text. Do not include any preamble, explanation, or additional commentary.`;

/**
 * Use AI to anonymize a candidate bio by removing all PII.
 *
 * This is much more robust than regex patterns because:
 * - Understands context (knows "Microsoft" is a company, "VICTORIA" is a yacht)
 * - Handles entities we don't track (companies, schools, etc.)
 * - Preserves natural language flow
 * - Adapts to varying bio formats
 *
 * @param bioFull - The complete bio with all names
 * @param firstName - Candidate's first name to remove
 * @param lastName - Candidate's last name to remove
 * @returns Anonymized bio with all PII removed
 *
 * @example
 * const bioFull = 'John Smith worked on M/Y ECLIPSE and at Microsoft.';
 * const anonymized = await aiAnonymizeBio(bioFull, 'John', 'Smith');
 * // Returns: "This candidate worked on a superyacht and at a technology company."
 */
export async function aiAnonymizeBio(
  bioFull: string,
  firstName: string,
  lastName: string
): Promise<string> {
  if (!bioFull || bioFull.trim().length === 0) {
    return '';
  }

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-5-haiku-20241022'), // Fast & cheap
      prompt: `${ANONYMIZATION_PROMPT}

Bio to anonymize:
${bioFull}

Candidate name to remove: ${firstName} ${lastName}

Anonymized bio:`,
      temperature: 0.3, // Low temperature for consistency
      maxTokens: 2000, // Bios are typically 500-1000 tokens
    });

    return text.trim();
  } catch (error) {
    console.error('[AI Anonymization] Error:', error);
    // On error, return empty string - better than potentially leaking PII
    // Calling code can fall back to regex-based anonymization
    return '';
  }
}

/**
 * Batch anonymize multiple bios for efficiency.
 * Useful for backfill scripts.
 *
 * @param bios - Array of bio objects to anonymize
 * @param concurrency - How many to process in parallel (default: 5)
 * @returns Array of anonymized bios
 */
export async function aiAnonymizeBiosBatch(
  bios: Array<{
    bioFull: string;
    firstName: string;
    lastName: string;
    id?: string; // For logging
  }>,
  concurrency: number = 5
): Promise<Array<{ id?: string; bioAnonymized: string; error?: string }>> {
  const results: Array<{ id?: string; bioAnonymized: string; error?: string }> = [];

  // Process in chunks to respect rate limits
  for (let i = 0; i < bios.length; i += concurrency) {
    const chunk = bios.slice(i, i + concurrency);

    const chunkResults = await Promise.all(
      chunk.map(async (bio) => {
        try {
          const bioAnonymized = await aiAnonymizeBio(
            bio.bioFull,
            bio.firstName,
            bio.lastName
          );
          return {
            id: bio.id,
            bioAnonymized,
          };
        } catch (error) {
          return {
            id: bio.id,
            bioAnonymized: '',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    results.push(...chunkResults);

    // Small delay between batches to avoid rate limiting
    if (i + concurrency < bios.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
