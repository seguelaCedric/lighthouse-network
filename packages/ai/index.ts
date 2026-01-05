// ============================================================================
// LIGHTHOUSE CREW NETWORK - AI Configuration
// ============================================================================
// Using Vercel AI SDK for unified AI provider access
// Direct integration with Anthropic Claude - no middleman needed
// ============================================================================

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { generateText, generateObject, streamText, embed, embedMany } from 'ai';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// MODEL CONFIGURATION
// ----------------------------------------------------------------------------

export const models = {
  // Primary reasoning model - for brief parsing, ranking, complex decisions
  reasoning: anthropic('claude-sonnet-4-20250514'),
  
  // Fast model - for simple extractions, classifications
  fast: anthropic('claude-haiku-4-20250514'),
  
  // Embeddings - OpenAI still best price/performance for vectors
  embedding: openai.embedding('text-embedding-3-small'),
} as const;

// ----------------------------------------------------------------------------
// BRIEF PARSING
// ----------------------------------------------------------------------------

const parsedBriefSchema = z.object({
  position: z.string().describe('Standardized position title'),
  position_category: z.enum([
    'deck', 'interior', 'engineering', 'galley', 
    'medical', 'childcare', 'security', 'management', 'other'
  ]),
  
  vessel: z.object({
    name: z.string().optional(),
    type: z.enum(['Motor', 'Sailing']).optional(),
    size_min: z.number().optional(),
    size_max: z.number().optional(),
  }).optional(),
  
  contract: z.object({
    type: z.enum(['permanent', 'rotational', 'seasonal', 'temporary', 'freelance']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    rotation: z.string().optional(),
  }).optional(),
  
  location: z.object({
    region: z.string().optional(),
    itinerary: z.string().optional(),
  }).optional(),
  
  compensation: z.object({
    salary_min: z.number().optional(),
    salary_max: z.number().optional(),
    currency: z.string().default('EUR'),
    benefits: z.string().optional(),
  }).optional(),
  
  requirements: z.object({
    experience_years_min: z.number().optional(),
    certifications_required: z.array(z.string()).optional(),
    certifications_preferred: z.array(z.string()).optional(),
    visas_required: z.array(z.string()).optional(),
    languages_required: z.array(z.string()).optional(),
    languages_preferred: z.array(z.string()).optional(),
    non_smoker: z.boolean().optional(),
    no_visible_tattoos: z.boolean().optional(),
    nationality_preferences: z.array(z.string()).optional(),
    couple_acceptable: z.boolean().optional(),
  }).optional(),
  
  confidence: z.number().min(0).max(1),
  ambiguities: z.array(z.string()),
  inferred: z.array(z.string()),
});

export type ParsedBrief = z.infer<typeof parsedBriefSchema>;

export async function parseBrief(
  briefContent: string,
  clientContext?: {
    name?: string;
    vessel_name?: string;
    vessel_type?: string;
    vessel_size?: number;
    past_preferences?: Record<string, unknown>;
  }
): Promise<ParsedBrief> {
  const { object } = await generateObject({
    model: models.reasoning,
    schema: parsedBriefSchema,
    system: `You are an expert yacht and villa crew recruitment specialist. 
Parse job briefs into structured requirements.

You have deep knowledge of:
- Yacht crew positions (Captain, Chief Officer, Chief Engineer, Bosun, Chief Stew, etc.)
- Villa/estate staff positions (Estate Manager, Butler, Chef, etc.)
- Industry certifications (STCW, ENG1, yacht licenses)
- Contract types and typical arrangements
- Geographic cruising areas
- Typical salary ranges by position and vessel size

Rules:
- Standardize position titles (e.g., "chief stew" → "Chief Stewardess")
- Convert salary to monthly EUR if given in other formats
- Always include STCW and ENG1 in certifications_required for sea-going positions
- Flag anything ambiguous
- Be conservative - don't assume requirements not mentioned`,
    prompt: `Parse this job brief:

<brief>
${briefContent}
</brief>

${clientContext ? `
<client_context>
Client: ${clientContext.name || 'Unknown'}
Vessel: ${clientContext.vessel_name || 'Not specified'}
Type: ${clientContext.vessel_type || 'Not specified'}
Size: ${clientContext.vessel_size ? `${clientContext.vessel_size}m` : 'Not specified'}
</client_context>
` : ''}

Extract all information and return structured requirements.`,
  });

  return object;
}

// ----------------------------------------------------------------------------
// CANDIDATE RANKING
// ----------------------------------------------------------------------------

const candidateRankingSchema = z.object({
  rankings: z.array(z.object({
    candidate_id: z.string(),
    match_score: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    concerns: z.array(z.string()),
    summary: z.string(),
  })),
});

export type CandidateRanking = z.infer<typeof candidateRankingSchema>['rankings'][0];

export async function rankCandidates(
  jobDescription: string,
  requirements: Record<string, unknown>,
  candidates: Array<{
    id: string;
    name: string;
    position: string;
    experience_years: number;
    certifications: string[];
    visas: string[];
    nationality: string;
    availability: string;
    is_smoker?: boolean;
    has_tattoos?: boolean;
    verification_tier: string;
    similarity_score: number;
  }>
): Promise<CandidateRanking[]> {
  const { object } = await generateObject({
    model: models.reasoning,
    schema: candidateRankingSchema,
    system: `You are an expert yacht crew recruiter. Rank candidates against job requirements.

Scoring guidelines:
- 90-100: Exceptional match, exceeds requirements
- 80-89: Strong match, meets all key requirements
- 70-79: Good match, minor gaps
- 60-69: Acceptable, notable gaps but workable
- Below 60: Poor match, significant issues

Be rigorous. A 90+ should be rare and exceptional.

Consider:
- Hard requirements are MUST-HAVEs
- Verification tier (premium/verified = more trustworthy)
- Experience quality, not just quantity
- Geographic and cultural fit`,
    prompt: `Rank these candidates for the position:

<job>
${jobDescription}
</job>

<requirements>
${JSON.stringify(requirements, null, 2)}
</requirements>

<candidates>
${candidates.map((c, i) => `
[${i + 1}] ID: ${c.id}
Name: ${c.name}
Position: ${c.position}
Experience: ${c.experience_years} years
Certifications: ${c.certifications.join(', ') || 'None listed'}
Visas: ${c.visas.join(', ') || 'None listed'}
Nationality: ${c.nationality}
Availability: ${c.availability}
Smoker: ${c.is_smoker === false ? 'No' : c.is_smoker === true ? 'Yes' : 'Unknown'}
Visible tattoos: ${c.has_tattoos === false ? 'No' : c.has_tattoos === true ? 'Yes' : 'Unknown'}
Verification: ${c.verification_tier}
Vector similarity: ${(c.similarity_score * 100).toFixed(1)}%
`).join('\n')}
</candidates>

Rank from best to worst match. Be specific about strengths and concerns.`,
  });

  return object.rankings;
}

// ----------------------------------------------------------------------------
// CANDIDATE SUMMARY GENERATION
// ----------------------------------------------------------------------------

export async function generateCandidateSummary(
  candidate: {
    name: string;
    position: string;
    experience_years: number;
    work_history?: Array<{ role: string; vessel: string; period: string }>;
    certifications?: string[];
    languages?: string[];
    nationality: string;
  }
): Promise<string> {
  const { text } = await generateText({
    model: models.fast,
    system: `You write concise, professional candidate summaries for yacht crew recruitment.
Keep summaries to 2-3 sentences. Focus on what makes this candidate stand out.
Be factual and specific. No fluff.`,
    prompt: `Write a brief professional summary for:

Name: ${candidate.name}
Position: ${candidate.position}
Experience: ${candidate.experience_years} years
${candidate.work_history ? `Recent roles:\n${candidate.work_history.map(w => `- ${w.role} on ${w.vessel} (${w.period})`).join('\n')}` : ''}
${candidate.certifications?.length ? `Certifications: ${candidate.certifications.join(', ')}` : ''}
${candidate.languages?.length ? `Languages: ${candidate.languages.join(', ')}` : ''}
Nationality: ${candidate.nationality}`,
  });

  return text;
}

// ----------------------------------------------------------------------------
// STREAMING RESPONSES (for chat/interactive features)
// ----------------------------------------------------------------------------

export async function* streamBriefClarification(
  brief: string,
  ambiguities: string[]
) {
  const { textStream } = await streamText({
    model: models.fast,
    system: `You are a helpful recruitment assistant. Ask clarifying questions about job briefs.
Be conversational but efficient. Ask only what's needed.`,
    prompt: `This brief needs clarification:

"${brief}"

Ambiguities identified:
${ambiguities.map(a => `- ${a}`).join('\n')}

Ask 2-3 focused questions to clarify the most important missing information.`,
  });

  for await (const chunk of textStream) {
    yield chunk;
  }
}

// ----------------------------------------------------------------------------
// EMBEDDINGS
// ----------------------------------------------------------------------------

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: models.embedding,
    value: text,
  });
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: models.embedding,
    values: texts,
  });
  return embeddings;
}

// Build embedding text for a candidate
export function buildCandidateEmbeddingText(candidate: {
  primary_position?: string | null;
  secondary_positions?: string[] | null;
  years_experience?: number | null;
  preferred_yacht_types?: string[] | null;
  preferred_yacht_size_min?: number | null;
  preferred_yacht_size_max?: number | null;
  preferred_contract_types?: string[] | null;
  preferred_regions?: string[] | null;
  has_stcw?: boolean | null;
  has_eng1?: boolean | null;
  highest_license?: string | null;
  has_schengen?: boolean | null;
  has_b1b2?: boolean | null;
  nationality?: string | null;
  is_smoker?: boolean | null;
  has_visible_tattoos?: boolean | null;
}): string {
  const parts: string[] = [];

  if (candidate.primary_position) {
    parts.push(`Position: ${candidate.primary_position}`);
  }
  if (candidate.secondary_positions?.length) {
    parts.push(`Also: ${candidate.secondary_positions.join(', ')}`);
  }
  if (candidate.years_experience) {
    parts.push(`${candidate.years_experience} years experience`);
  }
  if (candidate.preferred_yacht_types?.length) {
    parts.push(`Yacht types: ${candidate.preferred_yacht_types.join(', ')}`);
  }
  if (candidate.preferred_yacht_size_min || candidate.preferred_yacht_size_max) {
    parts.push(`Size: ${candidate.preferred_yacht_size_min || 0}m - ${candidate.preferred_yacht_size_max || '∞'}m`);
  }
  if (candidate.preferred_regions?.length) {
    parts.push(`Regions: ${candidate.preferred_regions.join(', ')}`);
  }

  const certs: string[] = [];
  if (candidate.has_stcw) certs.push('STCW');
  if (candidate.has_eng1) certs.push('ENG1');
  if (candidate.highest_license) certs.push(candidate.highest_license);
  if (certs.length) parts.push(`Certifications: ${certs.join(', ')}`);

  const visas: string[] = [];
  if (candidate.has_schengen) visas.push('Schengen');
  if (candidate.has_b1b2) visas.push('B1/B2');
  if (visas.length) parts.push(`Visas: ${visas.join(', ')}`);

  if (candidate.nationality) parts.push(`Nationality: ${candidate.nationality}`);
  if (candidate.is_smoker === false) parts.push('Non-smoker');
  if (candidate.has_visible_tattoos === false) parts.push('No visible tattoos');

  return parts.join('\n');
}

// Build embedding text for a job
export function buildJobEmbeddingText(job: {
  title: string;
  vessel_type?: string;
  vessel_size_meters?: number;
  contract_type?: string;
  primary_region?: string;
  requirements?: {
    experience_years_min?: number;
    certifications_required?: string[];
    languages_required?: string[];
    non_smoker?: boolean;
    no_visible_tattoos?: boolean;
  };
}): string {
  const parts: string[] = [];

  parts.push(`Position: ${job.title}`);
  if (job.vessel_type) parts.push(`Vessel: ${job.vessel_type}`);
  if (job.vessel_size_meters) parts.push(`Size: ${job.vessel_size_meters}m`);
  if (job.contract_type) parts.push(`Contract: ${job.contract_type}`);
  if (job.primary_region) parts.push(`Region: ${job.primary_region}`);

  const req = job.requirements;
  if (req) {
    if (req.experience_years_min) parts.push(`Experience: ${req.experience_years_min}+ years`);
    if (req.certifications_required?.length) {
      parts.push(`Required certs: ${req.certifications_required.join(', ')}`);
    }
    if (req.languages_required?.length) {
      parts.push(`Languages: ${req.languages_required.join(', ')}`);
    }
    if (req.non_smoker) parts.push('Non-smoker required');
    if (req.no_visible_tattoos) parts.push('No visible tattoos');
  }

  return parts.join('\n');
}

// ----------------------------------------------------------------------------
// EXPORTS (all exported inline above)
// ----------------------------------------------------------------------------

// Re-export from submodules for compatibility
export { parseBrief as parseBriefFromModule, BriefParseError, BriefParser, type BriefParsedData as BriefParsedDataFromModule, type ClientContext, briefParsedDataSchema } from './brief-parser/index';
export { matchCandidatesForJob, type MatchResult, type MatchCandidatesOptions, type MatchingOptions, type MatchingResult, findMatchingCandidates, MATCHING_CONFIG } from './matcher/index';

// Re-export new modules (with aliases to avoid conflicts with existing exports)
export {
  buildCandidateEmbeddingText as buildUnifiedCandidateEmbeddingText,
  buildClientSafeEmbeddingText,
  buildJobEmbeddingText as buildUnifiedJobEmbeddingText,
  estimateTokens,
  isWithinTokenLimit,
  type CandidateProfile,
  type CandidateDocument,
  type CandidateInterviewNote,
  type CandidateReference,
  type JobProfile,
  type Visibility,
} from './embedding/build-candidate-text';

export {
  rerankDocuments,
  rerankCandidatesForJob,
  batchRerankCandidates,
  type RerankDocument,
  type RerankResult,
  type RerankOptions,
  type CandidateForRerank,
  type JobForRerank,
} from './rerank/index';

export {
  sanitizeMatchResult,
  sanitizeMatchResults,
  simplifyBreakdown,
  breakdownToPercentages,
} from './matcher/sanitize';

export {
  type RecruiterMatchResult,
  type ClientMatchResult,
  type PublicMatchResult,
  type CandidateData,
  type JobData,
  type MatchBreakdown,
  type UserType,
  type MatchingMetadata,
} from './matcher/types';

// NOTE: CV chunking was deprecated in migration 035_deprecate_cv_chunks.sql
// The architecture uses unified embeddings: 1 candidate = 1 embedding
// See /docs/ai-matching-system.md for details

// ----------------------------------------------------------------------------
// V4 AGENTIC SEARCH (Query Parser + Agentic Judge)
// ----------------------------------------------------------------------------
export {
  // Types
  type ParsedQuery,
  type AgenticExplanation,
  type CandidateProfile as AgenticCandidateProfile,
  type Verdict,
  type V4SearchResult,
  type V4SearchResponse,
  type V4SearchRequest,
  type PipelineStats,
  // Query Parser
  parseQuery,
  parseQuerySafe,
  // Agentic Judge
  evaluateCandidate,
  evaluateCandidates,
  evaluateCandidatesSafe,
  scoreToVerdict,
  getVerdictStyle,
} from './agentic-search';

// ----------------------------------------------------------------------------
// CV EXTRACTION (AI-powered structured data extraction from CVs)
// ----------------------------------------------------------------------------
export {
  // Main extraction function
  extractFromCV,
  extractFromCVSafe,
  // Helpers
  deriveBooleanFlags,
  buildSearchKeywords,
  calculateTotalExperienceMonths,
  // Position taxonomy
  normalizePosition,
  getAllStandardPositions,
  POSITION_TAXONOMY,
  // Types
  type CVExtractionResult,
  type CVExtractionRequest,
  type CVExtractionResponse,
  type CVExtractionQueueItem,
  type PositionExtracted,
  type PositionCategory,
  type CertificationDetail,
  type CertificationCategory,
  type LicenseDetail,
  type LicenseType,
  type LanguageDetail,
  type LanguageProficiency,
  type YachtExperience,
  type VillaExperience,
  type EducationDetail,
  type ReferenceDetail,
  // Schemas (for validation)
  cvExtractionResultSchema,
  positionCategorySchema,
} from './cv-extraction';

// ----------------------------------------------------------------------------
// BIO GENERATION (AI-powered candidate bio generation)
// ----------------------------------------------------------------------------
export {
  // Main generation function
  generateCandidateBio,
  generateCandidateBioSafe,
  // AI-powered anonymization (NEW)
  aiAnonymizeBio,
  aiAnonymizeBiosBatch,
  // Pattern validation (NEW - defense in depth)
  validateAnonymizedBio,
  validateAnonymizedBioSafe,
  bioNeedsAnonymization,
  // Legacy anonymization utilities (regex-based, kept for fallback)
  anonymizeBio,
  anonymizeCareerAchievements,
  anonymizeText,
  obfuscateName,
  bioContainsName,
  // Prompts (for customization)
  BIO_GENERATION_SYSTEM_PROMPT,
  buildBioGenerationPrompt,
  // Types
  type BioGenerationRequest,
  type BioGenerationResult,
  type BioGenerationCandidate,
  type AnonymizeOptions,
  // Version constant
  BIO_GENERATION_VERSION,
} from './bio-generation';

// ----------------------------------------------------------------------------
// CANDIDATE-JOB MATCHING (AI-powered job matching for candidates)
// ----------------------------------------------------------------------------
export {
  // Main matching function
  matchJobsForCandidate,
  // Score calculation
  calculateJobMatchScore,
  // Industry detection
  detectJobIndustry,
  // Profile completeness check
  checkProfileCompleteness,
  // Types
  type CandidateProfile as CandidateJobMatchProfile,
  type PublicJob,
  type JobMatchResult,
  type MatchScoreBreakdown,
  type CandidateJobMatchOptions,
  type ProfileCompletenessResult,
  type JobIndustry,
} from './matcher/candidate-job-matcher';
