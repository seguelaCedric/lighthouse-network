/**
 * Embedding Worker Service
 *
 * Processes the embedding queue to generate embeddings for candidates and jobs.
 * This runs as a background job, polling the queue for pending items.
 *
 * Architecture:
 * 1. Poll embedding_queue for pending items
 * 2. For each item, build unified embedding text
 * 3. Generate embedding using OpenAI text-embedding-3-small
 * 4. Update the entity with the new embedding
 * 5. Mark queue item as completed
 *
 * Error handling:
 * - Items are marked as 'processing' while being worked on
 * - Failed items are retried up to max_attempts times
 * - Items failing all retries are marked 'failed' for manual review
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  generateEmbedding,
  generateEmbeddings,
  chunkCVText,
  buildUnifiedCandidateEmbeddingText as buildCandidateEmbeddingText,
  buildUnifiedJobEmbeddingText as buildJobEmbeddingText,
} from '@lighthouse/ai';

// Types inlined since @lighthouse/ai doesn't export .d.ts files
interface CandidateProfile {
  first_name: string;
  last_name: string;
  primary_position?: string;
  secondary_positions?: string[];
  years_experience?: number;
  nationality?: string;
  second_nationality?: string;
  current_location?: string;
  has_stcw?: boolean;
  stcw_expiry?: string;
  has_eng1?: boolean;
  eng1_expiry?: string;
  highest_license?: string;
  has_schengen?: boolean;
  has_b1b2?: boolean;
  has_c1d?: boolean;
  other_visas?: string[];
  preferred_yacht_types?: string[];
  preferred_yacht_size_min?: number;
  preferred_yacht_size_max?: number;
  preferred_regions?: string[];
  preferred_contract_types?: string[];
  is_smoker?: boolean;
  has_visible_tattoos?: boolean;
  is_couple?: boolean;
  partner_position?: string;
  profile_summary?: string;
  search_keywords?: string[];
}

interface CandidateDocument {
  type: 'cv' | 'certificate' | 'written_reference' | 'id_document' | 'other';
  name?: string;
  extracted_text?: string;
  visibility: 'public' | 'client' | 'recruiter';
}

interface CandidateInterviewNote {
  note_type: 'interview' | 'verbal_reference' | 'phone_screen' | 'client_feedback' | 'general';
  title?: string;
  content: string;
  summary?: string;
  visibility: 'public' | 'client' | 'recruiter';
  include_in_embedding: boolean;
}

interface CandidateReference {
  referee_name?: string;
  relationship?: string;
  reference_text?: string;
  voice_summary?: string;
  overall_rating?: number;
  would_rehire?: boolean;
  is_verified: boolean;
}

interface JobProfile {
  title: string;
  description?: string;
  requirements?: string;
  position_category?: string;
  vessel_type?: string;
  vessel_size_meters?: number;
  vessel_name?: string;
  contract_type?: string;
  start_date?: string;
  primary_region?: string;
  salary_min?: number;
  salary_max?: number;
  job_requirements?: Record<string, unknown>;
}

// ============================================================================
// TYPES
// ============================================================================

interface QueueItem {
  id: string;
  entity_type: 'candidate' | 'job' | 'cv_document';
  entity_id: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface ProcessingResult {
  success: boolean;
  embeddingLength?: number;
  textLength?: number;
  error?: string;
}

interface WorkerStats {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  startTime: Date;
}

// ============================================================================
// WORKER CLASS
// ============================================================================

export class EmbeddingWorker {
  private supabase: SupabaseClient;
  private batchSize: number;
  private pollingIntervalMs: number;
  private isRunning: boolean = false;
  private stats: WorkerStats;

  constructor(
    supabase: SupabaseClient,
    options: {
      batchSize?: number;
      pollingIntervalMs?: number;
    } = {}
  ) {
    this.supabase = supabase;
    this.batchSize = options.batchSize || 10;
    this.pollingIntervalMs = options.pollingIntervalMs || 5000;
    this.stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
    };
  }

  /**
   * Start the worker - runs until stopped
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Worker already running');
      return;
    }

    console.log('🚀 Embedding worker starting...');
    this.isRunning = true;
    this.stats.startTime = new Date();

    while (this.isRunning) {
      try {
        const processed = await this.processBatch();

        if (processed === 0) {
          // No items to process, wait before polling again
          await this.sleep(this.pollingIntervalMs);
        }
      } catch (error) {
        console.error('Worker batch error:', error);
        await this.sleep(this.pollingIntervalMs);
      }
    }

    console.log('🛑 Embedding worker stopped');
    this.logStats();
  }

  /**
   * Stop the worker gracefully
   */
  stop(): void {
    console.log('Stopping worker...');
    this.isRunning = false;
  }

  /**
   * Process a single batch of queue items
   */
  async processBatch(): Promise<number> {
    // Claim items from queue
    const items = await this.claimItems();

    if (items.length === 0) {
      return 0;
    }

    console.log(`📦 Processing batch of ${items.length} items`);

    // Process each item
    for (const item of items) {
      try {
        const result = await this.processItem(item);

        if (result.success) {
          await this.markCompleted(item.id);
          this.stats.succeeded++;
          console.log(`  ✅ ${item.entity_type} ${item.entity_id}: ${result.embeddingLength} dims from ${result.textLength} chars`);
        } else {
          await this.markFailed(item, result.error || 'Unknown error');
          this.stats.failed++;
          console.log(`  ❌ ${item.entity_type} ${item.entity_id}: ${result.error}`);
        }
      } catch (error) {
        await this.markFailed(item, error instanceof Error ? error.message : 'Unknown error');
        this.stats.failed++;
        console.log(`  ❌ ${item.entity_type} ${item.entity_id}: ${error}`);
      }

      this.stats.processed++;
    }

    return items.length;
  }

  /**
   * Claim pending items from queue
   */
  private async claimItems(): Promise<QueueItem[]> {
    // Get pending items ordered by priority
    const { data: items, error } = await this.supabase
      .from('embedding_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(this.batchSize);

    if (error) {
      console.error('Failed to fetch queue items:', error);
      return [];
    }

    if (!items || items.length === 0) {
      return [];
    }

    // Mark items as processing
    const itemIds = items.map(i => i.id);
    const { error: updateError } = await this.supabase
      .from('embedding_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .in('id', itemIds);

    if (updateError) {
      console.error('Failed to claim items:', updateError);
      return [];
    }

    return items;
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: QueueItem): Promise<ProcessingResult> {
    if (item.entity_type === 'candidate') {
      return this.processCandidate(item.entity_id);
    } else if (item.entity_type === 'job') {
      return this.processJob(item.entity_id);
    } else if (item.entity_type === 'cv_document') {
      return this.processCVDocument(item.entity_id);
    }

    return { success: false, error: `Unknown entity type: ${item.entity_type}` };
  }

  /**
   * Process a candidate embedding
   */
  private async processCandidate(candidateId: string): Promise<ProcessingResult> {
    // Fetch candidate data
    const { data: candidate, error: candidateError } = await this.supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return { success: false, error: `Candidate not found: ${candidateError?.message}` };
    }

    // Fetch documents
    const { data: documents } = await this.supabase
      .from('documents')
      .select('type, name, extracted_text, visibility')
      .eq('entity_type', 'candidate')
      .eq('entity_id', candidateId)
      .eq('is_latest_version', true)
      .is('deleted_at', null);

    // Fetch interview notes
    const { data: notes } = await this.supabase
      .from('candidate_interview_notes')
      .select('note_type, title, content, summary, visibility, include_in_embedding')
      .eq('candidate_id', candidateId)
      .eq('include_in_embedding', true);

    // Fetch references
    const { data: references } = await this.supabase
      .from('candidate_references')
      .select('referee_name, relationship, reference_text, voice_summary, overall_rating, would_rehire, is_verified')
      .eq('candidate_id', candidateId)
      .eq('is_verified', true);

    // Build embedding text
    const profile: CandidateProfile = {
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      primary_position: candidate.primary_position,
      secondary_positions: candidate.secondary_positions,
      years_experience: candidate.years_experience,
      nationality: candidate.nationality,
      second_nationality: candidate.second_nationality,
      current_location: candidate.current_location,
      has_stcw: candidate.has_stcw,
      stcw_expiry: candidate.stcw_expiry,
      has_eng1: candidate.has_eng1,
      eng1_expiry: candidate.eng1_expiry,
      highest_license: candidate.highest_license,
      has_schengen: candidate.has_schengen,
      has_b1b2: candidate.has_b1b2,
      has_c1d: candidate.has_c1d,
      other_visas: candidate.other_visas,
      preferred_yacht_types: candidate.preferred_yacht_types,
      preferred_yacht_size_min: candidate.preferred_yacht_size_min,
      preferred_yacht_size_max: candidate.preferred_yacht_size_max,
      preferred_regions: candidate.preferred_regions,
      preferred_contract_types: candidate.preferred_contract_types,
      is_smoker: candidate.is_smoker,
      has_visible_tattoos: candidate.has_visible_tattoos,
      is_couple: candidate.is_couple,
      partner_position: candidate.partner_position,
      profile_summary: candidate.profile_summary,
      search_keywords: candidate.search_keywords,
    };

    const embeddingText = buildCandidateEmbeddingText(
      profile,
      (documents || []) as CandidateDocument[],
      (notes || []) as CandidateInterviewNote[],
      (references || []) as CandidateReference[],
      'recruiter' // Full content for embedding
    );

    if (embeddingText.length < 50) {
      return { success: false, error: 'Insufficient text for embedding' };
    }

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    // Update candidate
    const { error: updateError } = await this.supabase
      .from('candidates')
      .update({
        embedding: embedding,
        embedding_text: embeddingText,
        embedding_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (updateError) {
      return { success: false, error: `Failed to update candidate: ${updateError.message}` };
    }

    return {
      success: true,
      embeddingLength: embedding.length,
      textLength: embeddingText.length,
    };
  }

  /**
   * Process a job embedding
   */
  private async processJob(jobId: string): Promise<ProcessingResult> {
    // Fetch job data
    const { data: job, error: jobError } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: `Job not found: ${jobError?.message}` };
    }

    // Build embedding text
    const jobProfile: JobProfile = {
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      position_category: job.position_category,
      vessel_type: job.vessel_type,
      vessel_size_meters: job.vessel_size_meters,
      vessel_name: job.vessel_name,
      contract_type: job.contract_type,
      start_date: job.start_date,
      primary_region: job.primary_region,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      job_requirements: job.requirements ? JSON.parse(job.requirements) : undefined,
    };

    const embeddingText = buildJobEmbeddingText(jobProfile);

    if (embeddingText.length < 50) {
      return { success: false, error: 'Insufficient text for embedding' };
    }

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    // Update job
    const { error: updateError } = await this.supabase
      .from('jobs')
      .update({
        embedding: embedding,
        embedding_text: embeddingText,
        embedding_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      return { success: false, error: `Failed to update job: ${updateError.message}` };
    }

    return {
      success: true,
      embeddingLength: embedding.length,
      textLength: embeddingText.length,
    };
  }

  /**
   * Process a CV document into chunks with embeddings
   */
  private async processCVDocument(documentId: string): Promise<ProcessingResult> {
    // Fetch document
    const { data: document, error: docError } = await this.supabase
      .from('documents')
      .select('id, entity_id, entity_type, type, extracted_text')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return { success: false, error: `Document not found: ${docError?.message}` };
    }

    // Validate document type
    if (document.type !== 'cv' || !document.extracted_text) {
      return { success: false, error: 'Document is not a CV or has no extracted text' };
    }

    const text = document.extracted_text;
    if (text.length < 100) {
      return { success: false, error: 'CV text too short for chunking' };
    }

    // Generate chunks
    const chunks = chunkCVText(text, {
      maxChunkSize: 3200,
      minChunkSize: 400,
      overlapSize: 250,
      maxChunks: 5,
    });

    if (chunks.length === 0) {
      return { success: false, error: 'No chunks generated from CV' };
    }

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(c => c.text);
    let embeddings: number[][] = [];

    try {
      embeddings = await generateEmbeddings(chunkTexts);
    } catch (embeddingError) {
      return {
        success: false,
        error: `Embedding generation failed: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`,
      };
    }

    // Delete existing chunks for this document
    await this.supabase.from('cv_chunks').delete().eq('document_id', documentId);

    // Insert new chunks
    const chunkRecords = chunks.map((chunk, idx) => ({
      document_id: documentId,
      candidate_id: document.entity_id,
      chunk_index: chunk.chunkIndex,
      chunk_text: chunk.text,
      chunk_start_offset: chunk.startOffset,
      chunk_end_offset: chunk.endOffset,
      section_type: chunk.sectionType,
      section_weight: chunk.sectionWeight,
      embedding: embeddings[idx] ? JSON.stringify(embeddings[idx]) : null,
    }));

    const { error: insertError } = await this.supabase.from('cv_chunks').insert(chunkRecords);

    if (insertError) {
      return { success: false, error: `Failed to insert chunks: ${insertError.message}` };
    }

    return {
      success: true,
      embeddingLength: embeddings[0]?.length || 0,
      textLength: text.length,
    };
  }

  /**
   * Mark queue item as completed
   */
  private async markCompleted(itemId: string): Promise<void> {
    await this.supabase
      .from('embedding_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);
  }

  /**
   * Mark queue item as failed (or retry if attempts remaining)
   */
  private async markFailed(item: QueueItem, errorMessage: string): Promise<void> {
    const newAttempts = item.attempts + 1;
    const shouldRetry = newAttempts < item.max_attempts;

    await this.supabase
      .from('embedding_queue')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        attempts: newAttempts,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);
  }

  /**
   * Get current stats
   */
  getStats(): WorkerStats {
    return { ...this.stats };
  }

  /**
   * Log stats summary
   */
  private logStats(): void {
    const elapsed = Date.now() - this.stats.startTime.getTime();
    const elapsedMin = Math.round(elapsed / 60000);

    console.log(`
📊 Worker Stats:
   Processed: ${this.stats.processed}
   Succeeded: ${this.stats.succeeded}
   Failed: ${this.stats.failed}
   Skipped: ${this.stats.skipped}
   Runtime: ${elapsedMin} minutes
   Rate: ${(this.stats.processed / (elapsed / 1000)).toFixed(2)}/sec
`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// ONE-TIME PROCESSING (for backfill)
// ============================================================================

/**
 * Process all candidates without embeddings
 */
export async function backfillCandidateEmbeddings(
  supabase: SupabaseClient,
  options: { limit?: number; batchSize?: number } = {}
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const { limit = 1000, batchSize = 10 } = options;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  console.log(`🔄 Starting candidate embedding backfill (limit: ${limit})`);

  // Get candidates without embeddings
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id')
    .is('embedding', null)
    .is('deleted_at', null)
    .limit(limit);

  if (error || !candidates) {
    console.error('Failed to fetch candidates:', error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  console.log(`Found ${candidates.length} candidates without embeddings`);

  // Queue all candidates
  const queueItems = candidates.map(c => ({
    entity_type: 'candidate' as const,
    entity_id: c.id,
    priority: 5,
    status: 'pending' as const,
  }));

  // Insert in batches to avoid query size limits
  for (let i = 0; i < queueItems.length; i += 100) {
    const batch = queueItems.slice(i, i + 100);
    await supabase.from('embedding_queue').upsert(batch, {
      onConflict: 'entity_type,entity_id,status',
      ignoreDuplicates: true,
    });
  }

  // Process queue
  const worker = new EmbeddingWorker(supabase, { batchSize });

  // Process until queue is empty or limit reached
  while (processed < limit) {
    const batchProcessed = await worker.processBatch();
    if (batchProcessed === 0) break;

    processed += batchProcessed;
    const stats = worker.getStats();
    succeeded = stats.succeeded;
    failed = stats.failed;

    console.log(`Progress: ${processed}/${candidates.length}`);
  }

  console.log(`✅ Backfill complete: ${succeeded} succeeded, ${failed} failed`);

  return { processed, succeeded, failed };
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * Process queue items - call this from an API route or cron job
 */
export async function processEmbeddingQueue(
  supabase: SupabaseClient,
  options: { maxItems?: number; batchSize?: number } = {}
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const { maxItems = 100, batchSize = 10 } = options;

  const worker = new EmbeddingWorker(supabase, { batchSize });
  let totalProcessed = 0;

  while (totalProcessed < maxItems) {
    const processed = await worker.processBatch();
    if (processed === 0) break;
    totalProcessed += processed;
  }

  const stats = worker.getStats();
  return {
    processed: totalProcessed,
    succeeded: stats.succeeded,
    failed: stats.failed,
  };
}
