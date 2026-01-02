// ============================================================================
// V4 AGENTIC SEARCH - Agentic Judge
// ============================================================================
// Uses Claude Haiku to evaluate candidates with REAL reasoning.
// This is Stage 4 of the V4 pipeline - the "brain" that decides fit.
// ============================================================================

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { AgenticExplanation, CandidateProfile, ParsedQuery, Verdict } from './types';

// ----------------------------------------------------------------------------
// SCHEMA FOR STRUCTURED OUTPUT
// ----------------------------------------------------------------------------

const agenticExplanationSchema = z.object({
  fitScore: z.number().min(0).max(100).describe('Overall fit score from 0-100'),
  verdict: z.enum(['strong_match', 'good_match', 'partial_match', 'weak_match', 'no_match']),
  reasoning: z.object({
    strengths: z.array(z.string()).describe('2-4 points about what makes this a good fit'),
    concerns: z.array(z.string()).describe('0-3 potential concerns or gaps'),
    summary: z.string().describe('One sentence overall assessment'),
  }),
});

// ----------------------------------------------------------------------------
// SYSTEM PROMPT
// ----------------------------------------------------------------------------

const AGENTIC_JUDGE_PROMPT = `You are an expert yacht and villa crew recruiter evaluating candidate fit.

## Your Task
Given search requirements and a candidate profile, evaluate how well they match.

## Scoring Guidelines
- 90-100 (strong_match): Exceptional match, exceeds requirements
- 80-89 (strong_match): Strong match, meets all key requirements
- 70-79 (good_match): Good match, meets most requirements
- 60-69 (good_match): Decent match, minor gaps
- 50-59 (partial_match): Acceptable, some notable gaps but workable
- 40-49 (partial_match): Marginal match, significant gaps
- 30-39 (weak_match): Poor match, major gaps
- 20-29 (weak_match): Very poor match, few alignments
- 0-19 (no_match): Not a match at all

## Critical Rules
1. BE HONEST. Don't inflate scores. A 90+ should be rare.
2. Position match is CRITICAL:
   - A "Deckhand" is NOT a match for "Stewardess" - different departments entirely
   - "Chief Stewardess" is a senior role; don't match juniors to senior positions
   - IMPORTANT: Check "All Positions Held" - candidates may have relevant experience even if current position differs
   - If no relevant position in their history, max score is 30
3. Certifications matter:
   - If STCW/ENG1 is required and missing, note it as a concern
   - Required certifications should impact the score significantly
4. Experience requirements:
   - "5+ years required" means 4 years is NOT a match
   - Exceeding experience is a strength
   - Review "Yacht Experience" section for detailed vessel history
5. Language skills:
   - Note relevant language abilities (especially for interior/service roles)
   - "Native" or "Fluent" in requested languages is a strength
6. Be specific in reasoning:
   - Don't say "good experience" - say "8 years Chief Stew experience exceeds 5 year requirement"
   - Don't say "missing certs" - say "Missing required STCW certification"
   - Reference specific yacht names/sizes when relevant

## Response Format
Provide:
1. fitScore: 0-100 number
2. verdict: One of strong_match, good_match, partial_match, weak_match, no_match
3. reasoning with:
   - strengths: 2-4 specific positive points
   - concerns: 0-3 specific concerns (can be empty if perfect match)
   - summary: One sentence overall assessment`;

// ----------------------------------------------------------------------------
// MAIN FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Evaluate a single candidate against search requirements.
 *
 * @param parsedQuery - The parsed search requirements
 * @param candidate - The candidate profile to evaluate
 * @returns Agentic explanation with fit score, verdict, and reasoning
 */
export async function evaluateCandidate(
  parsedQuery: ParsedQuery,
  candidate: CandidateProfile
): Promise<AgenticExplanation> {
  const userPrompt = buildEvaluationPrompt(parsedQuery, candidate);

  const { object } = await generateObject({
    model: anthropic('claude-3-5-haiku-20241022'),
    schema: agenticExplanationSchema,
    system: AGENTIC_JUDGE_PROMPT,
    prompt: userPrompt,
    temperature: 0.1, // Slight variation for natural language, but mostly deterministic
  });

  return {
    fitScore: object.fitScore,
    verdict: object.verdict as Verdict,
    reasoning: {
      strengths: object.reasoning.strengths,
      concerns: object.reasoning.concerns,
      summary: object.reasoning.summary,
    },
  };
}

/**
 * Evaluate multiple candidates in parallel with concurrency control.
 *
 * @param parsedQuery - The parsed search requirements
 * @param candidates - Array of candidate profiles to evaluate
 * @param concurrency - Max concurrent evaluations (default: 5)
 * @returns Map of candidate_id → AgenticExplanation
 */
export async function evaluateCandidates(
  parsedQuery: ParsedQuery,
  candidates: CandidateProfile[],
  concurrency: number = 5
): Promise<Map<string, AgenticExplanation>> {
  const results = new Map<string, AgenticExplanation>();

  // Process in batches to control concurrency
  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);

    const evaluations = await Promise.all(
      batch.map(async (candidate) => {
        try {
          const evaluation = await evaluateCandidate(parsedQuery, candidate);
          return { candidate_id: candidate.candidate_id, evaluation };
        } catch (error) {
          console.error(`Failed to evaluate candidate ${candidate.candidate_id}:`, error);
          // Return a fallback evaluation on error
          return {
            candidate_id: candidate.candidate_id,
            evaluation: createFallbackEvaluation(),
          };
        }
      })
    );

    // Store results
    for (const { candidate_id, evaluation } of evaluations) {
      results.set(candidate_id, evaluation);
    }
  }

  return results;
}

/**
 * Evaluate candidates with safe fallback on complete failure.
 */
export async function evaluateCandidatesSafe(
  parsedQuery: ParsedQuery,
  candidates: CandidateProfile[],
  concurrency: number = 5
): Promise<Map<string, AgenticExplanation>> {
  try {
    return await evaluateCandidates(parsedQuery, candidates, concurrency);
  } catch (error) {
    console.error('Batch evaluation failed completely:', error);
    // Return fallback evaluations for all candidates
    const results = new Map<string, AgenticExplanation>();
    for (const candidate of candidates) {
      results.set(candidate.candidate_id, createFallbackEvaluation());
    }
    return results;
  }
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Build the evaluation prompt for a single candidate.
 */
function buildEvaluationPrompt(parsedQuery: ParsedQuery, candidate: CandidateProfile): string {
  const lines: string[] = ['## SEARCH REQUIREMENTS'];

  // Original query
  lines.push(`Original query: "${parsedQuery.originalQuery}"`);

  // Position
  if (parsedQuery.position) {
    lines.push(`Looking for: ${parsedQuery.position}`);
  }
  if (parsedQuery.hardFilters.positions?.length) {
    lines.push(`Acceptable positions: ${parsedQuery.hardFilters.positions.join(', ')}`);
  }

  // Hard requirements
  const hardReqs: string[] = [];
  if (parsedQuery.hardFilters.require_stcw) hardReqs.push('STCW certification required');
  if (parsedQuery.hardFilters.require_eng1) hardReqs.push('ENG1 medical required');
  if (parsedQuery.hardFilters.require_schengen) hardReqs.push('Schengen visa required');
  if (parsedQuery.hardFilters.require_b1b2) hardReqs.push('B1/B2 US visa required');
  if (parsedQuery.hardFilters.min_experience) {
    hardReqs.push(`Minimum ${parsedQuery.hardFilters.min_experience} years experience required`);
  }
  if (parsedQuery.hardFilters.max_experience) {
    hardReqs.push(`Maximum ${parsedQuery.hardFilters.max_experience} years experience (entry-level preferred)`);
  }

  if (hardReqs.length > 0) {
    lines.push('\n### Hard Requirements (MUST have):');
    hardReqs.forEach((req) => lines.push(`- ${req}`));
  }

  // Soft preferences
  const softPrefs: string[] = [];
  if (parsedQuery.softPreferences.region) softPrefs.push(`Preferred region: ${parsedQuery.softPreferences.region}`);
  if (parsedQuery.softPreferences.yacht_type)
    softPrefs.push(`Preferred yacht type: ${parsedQuery.softPreferences.yacht_type}`);
  if (parsedQuery.softPreferences.contract_type)
    softPrefs.push(`Preferred contract: ${parsedQuery.softPreferences.contract_type}`);

  if (softPrefs.length > 0) {
    lines.push('\n### Nice to Have:');
    softPrefs.forEach((pref) => lines.push(`- ${pref}`));
  }

  // Candidate profile
  lines.push('\n## CANDIDATE PROFILE');
  lines.push(`Name: ${candidate.first_name} ${candidate.last_name}`);
  lines.push(`Current Position: ${candidate.primary_position || 'Not specified'}`);
  lines.push(`Total Experience: ${candidate.years_experience ?? 'Not specified'} years`);

  // All positions held (from CV extraction)
  if (candidate.positions_held && candidate.positions_held.length > 0) {
    lines.push(`All Positions Held: ${candidate.positions_held.join(', ')}`);
  }

  if (candidate.certifications.length > 0) {
    lines.push(`Certifications & Licenses: ${candidate.certifications.join(', ')}`);
  } else {
    lines.push('Certifications: None listed');
  }

  // Languages (from CV extraction)
  if (candidate.languages && candidate.languages.length > 0) {
    const langStrings = candidate.languages.map(
      (l) => `${l.language} (${l.proficiency})`
    );
    lines.push(`Languages: ${langStrings.join(', ')}`);
  }

  if (candidate.skills.length > 0) {
    // Limit skills to avoid overly long prompts
    const displaySkills = candidate.skills.slice(0, 20);
    lines.push(`Skills: ${displaySkills.join(', ')}${candidate.skills.length > 20 ? '...' : ''}`);
  }

  if (candidate.nationality) {
    lines.push(`Nationality: ${candidate.nationality}`);
  }

  if (candidate.current_location) {
    lines.push(`Location: ${candidate.current_location}`);
  }

  // Yacht experience (from CV extraction)
  if (candidate.yacht_experience && candidate.yacht_experience.length > 0) {
    lines.push('\nYacht Experience:');
    // Show top 5 most recent/relevant
    const topExperience = candidate.yacht_experience.slice(0, 5);
    topExperience.forEach((exp) => {
      const parts: string[] = [];
      parts.push(`  - ${exp.position}`);
      if (exp.yacht_name) parts.push(`on ${exp.yacht_name}`);
      if (exp.yacht_size_meters) parts.push(`(${exp.yacht_size_meters}m)`);
      if (exp.duration_months) {
        const years = Math.floor(exp.duration_months / 12);
        const months = exp.duration_months % 12;
        const duration = years > 0 ? `${years}y${months > 0 ? ` ${months}mo` : ''}` : `${months}mo`;
        parts.push(`- ${duration}`);
      }
      lines.push(parts.join(' '));
    });
    if (candidate.yacht_experience.length > 5) {
      lines.push(`  ... and ${candidate.yacht_experience.length - 5} more positions`);
    }
  }

  if (candidate.bio) {
    lines.push(`\nBio: ${candidate.bio}`);
  }

  lines.push('\n## TASK');
  lines.push('Evaluate how well this candidate matches the search requirements.');

  return lines.join('\n');
}

/**
 * Create a fallback evaluation when LLM fails.
 */
function createFallbackEvaluation(): AgenticExplanation {
  return {
    fitScore: 50,
    verdict: 'partial_match',
    reasoning: {
      strengths: [],
      concerns: ['Could not complete full evaluation'],
      summary: 'Evaluation incomplete - review manually',
    },
  };
}

/**
 * Convert a fit score to the corresponding verdict.
 */
export function scoreToVerdict(score: number): Verdict {
  if (score >= 80) return 'strong_match';
  if (score >= 60) return 'good_match';
  if (score >= 40) return 'partial_match';
  if (score >= 20) return 'weak_match';
  return 'no_match';
}

/**
 * Get color/style hints for a verdict (for frontend use).
 */
export function getVerdictStyle(verdict: Verdict): {
  color: string;
  bgColor: string;
  icon: string;
} {
  const styles: Record<Verdict, { color: string; bgColor: string; icon: string }> = {
    strong_match: { color: 'text-green-600', bgColor: 'bg-green-50', icon: 'check-circle' },
    good_match: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: 'thumbs-up' },
    partial_match: { color: 'text-amber-600', bgColor: 'bg-amber-50', icon: 'alert-circle' },
    weak_match: { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: 'alert-triangle' },
    no_match: { color: 'text-red-600', bgColor: 'bg-red-50', icon: 'x-circle' },
  };
  return styles[verdict];
}
