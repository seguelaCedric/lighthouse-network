/**
 * Cohere Rerank Integration
 *
 * Uses Cohere's rerank-v3.5 model to reorder candidates based on
 * semantic relevance to a job description. This provides more accurate
 * ranking than pure vector similarity because it:
 *
 * 1. Considers the full context of both query and documents
 * 2. Uses cross-attention (query sees document) vs bi-encoder (separate embeddings)
 * 3. Better handles nuanced requirements and preferences
 *
 * Usage pattern:
 * 1. Get top 50-100 candidates from hybrid vector search
 * 2. Rerank with Cohere to get best 10-20
 * 3. Apply AI assessment (Claude) to top 10
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RerankDocument {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface RerankResult {
  id: string;
  relevanceScore: number;
  originalIndex: number;
  metadata?: Record<string, unknown>;
}

export interface RerankOptions {
  topN?: number;           // How many results to return (default: 10)
  returnDocuments?: boolean; // Include document text in results
  maxChunksPerDoc?: number;  // Max chunks for long documents
}

// ============================================================================
// COHERE CLIENT
// ============================================================================

const COHERE_API_URL = 'https://api.cohere.com/v1/rerank';
const COHERE_MODEL = 'rerank-v3.5';
const MAX_DOCUMENTS = 1000; // Cohere limit
const MAX_QUERY_TOKENS = 2048;

/**
 * Rerank documents using Cohere's rerank-v3.5 model
 *
 * @param query - The job description or search query
 * @param documents - Candidate documents to rank
 * @param options - Reranking options
 * @returns Ranked documents with relevance scores
 */
export async function rerankDocuments(
  query: string,
  documents: RerankDocument[],
  options: RerankOptions = {}
): Promise<RerankResult[]> {
  const apiKey = process.env.COHERE_API_KEY;

  if (!apiKey) {
    console.warn('COHERE_API_KEY not set, skipping rerank');
    // Return documents in original order with default scores
    return documents.map((doc, index) => ({
      id: doc.id,
      relevanceScore: 1 - index * 0.01, // Decreasing scores
      originalIndex: index,
      metadata: doc.metadata,
    }));
  }

  const {
    topN = 10,
    returnDocuments = false,
    maxChunksPerDoc = 10,
  } = options;

  // Validate inputs
  if (documents.length === 0) {
    return [];
  }

  if (documents.length > MAX_DOCUMENTS) {
    console.warn(`Truncating documents from ${documents.length} to ${MAX_DOCUMENTS}`);
    documents = documents.slice(0, MAX_DOCUMENTS);
  }

  // Truncate query if needed
  const truncatedQuery = truncateToTokens(query, MAX_QUERY_TOKENS);

  // Prepare documents for Cohere API
  const cohereDocuments = documents.map(doc => ({
    text: doc.text,
  }));

  try {
    const response = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: COHERE_MODEL,
        query: truncatedQuery,
        documents: cohereDocuments,
        top_n: Math.min(topN, documents.length),
        return_documents: returnDocuments,
        max_chunks_per_doc: maxChunksPerDoc,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere rerank failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as CohereRerankResponse;

    // Map results back to our format
    return data.results.map(result => ({
      id: documents[result.index].id,
      relevanceScore: result.relevance_score,
      originalIndex: result.index,
      metadata: documents[result.index].metadata,
    }));
  } catch (error) {
    console.error('Cohere rerank error:', error);

    // Fallback: return original order with default scores
    return documents.slice(0, topN).map((doc, index) => ({
      id: doc.id,
      relevanceScore: 1 - index * 0.01,
      originalIndex: index,
      metadata: doc.metadata,
    }));
  }
}

// ============================================================================
// CANDIDATE-SPECIFIC RERANKING
// ============================================================================

export interface CandidateForRerank {
  id: string;
  first_name: string;
  last_name: string;
  primary_position?: string;
  secondary_positions?: string[];
  years_experience?: number;
  nationality?: string;
  has_stcw?: boolean;
  has_eng1?: boolean;
  highest_license?: string;
  has_schengen?: boolean;
  has_b1b2?: boolean;
  has_c1d?: boolean;
  preferred_yacht_types?: string[];
  preferred_yacht_size_min?: number;
  preferred_yacht_size_max?: number;
  preferred_regions?: string[];
  is_smoker?: boolean;
  has_visible_tattoos?: boolean;
  is_couple?: boolean;
  partner_position?: string;
  profile_summary?: string;
  embedding_text?: string;
  verification_tier?: string;
  availability_status?: string;
}

export interface JobForRerank {
  title: string;
  description?: string;
  requirements?: string;
  position_category?: string;
  vessel_type?: string;
  vessel_size_meters?: number;
  vessel_name?: string;
  primary_region?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
}

/**
 * Rerank candidates for a specific job
 *
 * This builds optimized document representations for each candidate
 * that highlight the most relevant matching criteria.
 */
export async function rerankCandidatesForJob(
  job: JobForRerank,
  candidates: CandidateForRerank[],
  options: RerankOptions = {}
): Promise<Array<CandidateForRerank & { relevanceScore: number }>> {
  if (candidates.length === 0) {
    return [];
  }

  // Build query from job
  const query = buildJobQuery(job);

  // Build documents from candidates
  const documents: RerankDocument[] = candidates.map(candidate => ({
    id: candidate.id,
    text: buildCandidateDocument(candidate),
    metadata: { candidate },
  }));

  // Rerank
  const results = await rerankDocuments(query, documents, {
    ...options,
    topN: options.topN || candidates.length,
  });

  // Map back to candidates with scores
  return results.map(result => ({
    ...(result.metadata?.candidate as CandidateForRerank),
    relevanceScore: result.relevanceScore,
  }));
}

/**
 * Build a query string from a job for reranking
 */
function buildJobQuery(job: JobForRerank): string {
  const parts: string[] = [];

  parts.push(`Position: ${job.title}`);

  if (job.position_category) {
    parts.push(`Department: ${job.position_category}`);
  }

  if (job.vessel_type) {
    parts.push(`Vessel type: ${job.vessel_type}`);
  }

  if (job.vessel_size_meters) {
    parts.push(`Vessel size: ${job.vessel_size_meters}m`);
  }

  if (job.primary_region) {
    parts.push(`Region: ${job.primary_region}`);
  }

  if (job.contract_type) {
    parts.push(`Contract: ${job.contract_type}`);
  }

  if (job.description) {
    parts.push(`\nDescription: ${truncateToTokens(job.description, 500)}`);
  }

  if (job.requirements) {
    parts.push(`\nRequirements: ${truncateToTokens(job.requirements, 500)}`);
  }

  return parts.join('\n');
}

/**
 * Build a document string from a candidate for reranking
 */
function buildCandidateDocument(candidate: CandidateForRerank): string {
  // If we have embedding_text, use that as it's comprehensive
  if (candidate.embedding_text) {
    return truncateToTokens(candidate.embedding_text, 1500);
  }

  // Otherwise build from structured data
  const parts: string[] = [];

  parts.push(`${candidate.first_name} ${candidate.last_name}`);

  if (candidate.primary_position) {
    parts.push(`Position: ${candidate.primary_position}`);
  }

  if (candidate.secondary_positions?.length) {
    parts.push(`Also qualified: ${candidate.secondary_positions.join(', ')}`);
  }

  if (candidate.years_experience) {
    parts.push(`Experience: ${candidate.years_experience} years`);
  }

  // Certifications
  const certs: string[] = [];
  if (candidate.has_stcw) certs.push('STCW');
  if (candidate.has_eng1) certs.push('ENG1');
  if (candidate.highest_license) certs.push(candidate.highest_license);
  if (certs.length) {
    parts.push(`Certifications: ${certs.join(', ')}`);
  }

  // Visas
  const visas: string[] = [];
  if (candidate.has_schengen) visas.push('Schengen');
  if (candidate.has_b1b2) visas.push('B1/B2');
  if (candidate.has_c1d) visas.push('C1/D');
  if (visas.length) {
    parts.push(`Visas: ${visas.join(', ')}`);
  }

  if (candidate.nationality) {
    parts.push(`Nationality: ${candidate.nationality}`);
  }

  if (candidate.preferred_yacht_types?.length) {
    parts.push(`Yacht types: ${candidate.preferred_yacht_types.join(', ')}`);
  }

  if (candidate.preferred_yacht_size_min || candidate.preferred_yacht_size_max) {
    parts.push(`Yacht size experience: ${candidate.preferred_yacht_size_min || 0}m - ${candidate.preferred_yacht_size_max || '∞'}m`);
  }

  if (candidate.preferred_regions?.length) {
    parts.push(`Regions: ${candidate.preferred_regions.join(', ')}`);
  }

  if (candidate.is_smoker === false) {
    parts.push('Non-smoker');
  }

  if (candidate.has_visible_tattoos === false) {
    parts.push('No visible tattoos');
  }

  if (candidate.is_couple) {
    parts.push(`Couple (partner: ${candidate.partner_position || 'various'})`);
  }

  if (candidate.verification_tier) {
    parts.push(`Verified: ${candidate.verification_tier}`);
  }

  if (candidate.profile_summary) {
    parts.push(`\nSummary: ${candidate.profile_summary}`);
  }

  return parts.join('\n');
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Rough token truncation (4 chars ~= 1 token)
 */
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;

  // Find last space before limit
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace);
  }

  return truncated;
}

// ============================================================================
// COHERE API TYPES
// ============================================================================

interface CohereRerankResponse {
  id: string;
  results: Array<{
    index: number;
    relevance_score: number;
    document?: {
      text: string;
    };
  }>;
  meta: {
    api_version: {
      version: string;
    };
    billed_units: {
      search_units: number;
    };
  };
}

// ============================================================================
// BATCH RERANKING (for multiple jobs)
// ============================================================================

/**
 * Rerank the same candidates for multiple jobs
 * More efficient than calling rerankCandidatesForJob multiple times
 */
export async function batchRerankCandidates(
  jobs: Array<{ id: string; job: JobForRerank }>,
  candidates: CandidateForRerank[],
  options: RerankOptions = {}
): Promise<Map<string, Array<CandidateForRerank & { relevanceScore: number }>>> {
  const results = new Map<string, Array<CandidateForRerank & { relevanceScore: number }>>();

  // Process jobs in parallel (with rate limiting)
  const batchSize = 5; // Process 5 jobs at a time

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async ({ id, job }) => {
        const ranked = await rerankCandidatesForJob(job, candidates, options);
        return { id, ranked };
      })
    );

    for (const { id, ranked } of batchResults) {
      results.set(id, ranked);
    }

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
