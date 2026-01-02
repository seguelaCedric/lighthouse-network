// ============================================================================
// CV EXTRACTION SERVICE
// ============================================================================
// Handles AI-powered CV extraction and database updates
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  extractFromCV,
  extractFromCVSafe,
  buildSearchKeywords,
  type CVExtractionResult,
} from '@lighthouse/ai';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface ExtractAndUpdateResult {
  success: boolean;
  candidate_id: string;
  document_id: string;
  extraction?: CVExtractionResult;
  error?: string;
  processing_time_ms: number;
}

interface QueueItem {
  id: string;
  candidate_id: string;
  document_id: string;
  status: string;
  attempts: number;
}

// ----------------------------------------------------------------------------
// SERVICE CLASS
// ----------------------------------------------------------------------------

export class CVExtractionService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Extract structured data from a CV and update the candidate record
   */
  async extractAndUpdateCandidate(
    candidateId: string,
    documentId: string
  ): Promise<ExtractAndUpdateResult> {
    const startTime = Date.now();

    try {
      // 1. Get the document with extracted text
      const { data: document, error: docError } = await this.supabase
        .from('documents')
        .select('id, extracted_text, created_at')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      if (!document.extracted_text) {
        throw new Error('Document has no extracted text');
      }

      // 2. Extract structured data using AI
      const extractionResponse = await extractFromCVSafe({
        cv_text: document.extracted_text,
        candidate_id: candidateId,
        document_id: documentId,
      });

      if (!extractionResponse.success || !extractionResponse.extraction) {
        throw new Error(extractionResponse.error || 'Extraction failed');
      }

      const extraction = extractionResponse.extraction;

      // 3. Build search keywords
      const searchKeywords = buildSearchKeywords(extraction);

      // 4. Update candidate record with extracted data
      const updatePayload = {
        // Core fields
        years_experience: extraction.years_experience,
        primary_position: extraction.primary_position,
        position_category: extraction.position_category,
        highest_license: extraction.highest_license,

        // Boolean flags (derived from extraction)
        has_stcw: extraction.has_stcw,
        has_eng1: extraction.has_eng1,

        // Extracted arrays
        positions_held: extraction.positions_held.map((p) => p.normalized),
        positions_extracted: extraction.positions_held,
        licenses_extracted: extraction.licenses,
        languages_extracted: extraction.languages,
        cv_skills: searchKeywords,
        yacht_experience_extracted: extraction.yacht_experience,
        villa_experience_extracted: extraction.villa_experience,
        education_extracted: extraction.education,
        references_extracted: extraction.references,
        certifications_extracted: extraction.certifications,

        // Extraction metadata
        cv_extracted_at: new Date().toISOString(),
        cv_extraction_version: 1,
        extraction_confidence: extraction.extraction_confidence,
        extraction_notes: extraction.extraction_notes,

        // Update search keywords if not already set
        search_keywords: searchKeywords,
      };

      const { error: updateError } = await this.supabase
        .from('candidates')
        .update(updatePayload)
        .eq('id', candidateId);

      if (updateError) {
        throw new Error(`Failed to update candidate: ${updateError.message}`);
      }

      return {
        success: true,
        candidate_id: candidateId,
        document_id: documentId,
        extraction,
        processing_time_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        candidate_id: candidateId,
        document_id: documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Get the latest CV document for a candidate
   */
  async getLatestCVDocument(candidateId: string): Promise<{
    id: string;
    extracted_text: string;
    created_at: string;
  } | null> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('id, extracted_text, created_at')
      .eq('entity_type', 'candidate')
      .eq('entity_id', candidateId)
      .eq('type', 'cv')
      .not('extracted_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Check if a candidate needs CV extraction
   * Returns true if:
   * - Never extracted, OR
   * - CV document is newer than last extraction
   */
  async needsExtraction(candidateId: string): Promise<{
    needs_extraction: boolean;
    reason?: string;
    document_id?: string;
  }> {
    // Get candidate's extraction timestamp
    const { data: candidate, error: candError } = await this.supabase
      .from('candidates')
      .select('cv_extracted_at')
      .eq('id', candidateId)
      .single();

    if (candError) {
      return { needs_extraction: false, reason: 'Candidate not found' };
    }

    // Get latest CV document
    const latestCV = await this.getLatestCVDocument(candidateId);

    if (!latestCV) {
      return { needs_extraction: false, reason: 'No CV document found' };
    }

    // Never extracted
    if (!candidate.cv_extracted_at) {
      return {
        needs_extraction: true,
        reason: 'Never extracted',
        document_id: latestCV.id,
      };
    }

    // CV is newer than extraction
    const cvDate = new Date(latestCV.created_at);
    const extractedDate = new Date(candidate.cv_extracted_at);

    if (cvDate > extractedDate) {
      return {
        needs_extraction: true,
        reason: 'CV newer than extraction',
        document_id: latestCV.id,
      };
    }

    return { needs_extraction: false, reason: 'Already extracted' };
  }

  /**
   * Queue a CV for extraction
   */
  async queueForExtraction(candidateId: string, documentId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('cv_extraction_queue')
      .upsert(
        {
          candidate_id: candidateId,
          document_id: documentId,
          status: 'pending',
          attempts: 0,
        },
        {
          onConflict: 'candidate_id,document_id',
        }
      )
      .select('id')
      .single();

    if (error) {
      console.error('Failed to queue CV for extraction:', error);
      return null;
    }

    return data?.id || null;
  }

  /**
   * Get pending items from the extraction queue
   */
  async getPendingQueueItems(limit: number = 10): Promise<QueueItem[]> {
    const { data, error } = await this.supabase
      .from('cv_extraction_queue')
      .select('id, candidate_id, document_id, status, attempts')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to get pending queue items:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update queue item status
   */
  async updateQueueStatus(
    queueId: string,
    status: 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const update: Record<string, unknown> = {
      status,
      processed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    };

    if (status === 'failed') {
      update.error_message = errorMessage;
      // Increment attempts
      const { data } = await this.supabase
        .from('cv_extraction_queue')
        .select('attempts')
        .eq('id', queueId)
        .single();

      update.attempts = (data?.attempts || 0) + 1;
    }

    await this.supabase.from('cv_extraction_queue').update(update).eq('id', queueId);
  }

  /**
   * Process a single queue item
   */
  async processQueueItem(item: QueueItem): Promise<ExtractAndUpdateResult> {
    // Mark as processing
    await this.updateQueueStatus(item.id, 'processing');

    // Extract and update
    const result = await this.extractAndUpdateCandidate(item.candidate_id, item.document_id);

    // Update queue status based on result
    if (result.success) {
      await this.updateQueueStatus(item.id, 'completed');
    } else {
      await this.updateQueueStatus(item.id, 'failed', result.error);
    }

    return result;
  }

  /**
   * Process multiple queue items with concurrency control
   */
  async processQueue(
    limit: number = 10,
    concurrency: number = 5
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: ExtractAndUpdateResult[];
  }> {
    const items = await this.getPendingQueueItems(limit);

    if (items.length === 0) {
      return { processed: 0, successful: 0, failed: 0, results: [] };
    }

    const results: ExtractAndUpdateResult[] = [];

    // Process in batches for concurrency control
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map((item) => this.processQueueItem(item)));
      results.push(...batchResults);
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      processed: results.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get candidates that need extraction (for backfill)
   */
  async getCandidatesNeedingExtraction(limit: number = 100): Promise<
    Array<{
      candidate_id: string;
      document_id: string;
    }>
  > {
    // Get candidates with CV documents but no extraction
    const { data, error } = await this.supabase
      .from('candidates')
      .select(
        `
        id,
        cv_extracted_at,
        documents!inner (
          id,
          type,
          extracted_text,
          created_at
        )
      `
      )
      .is('cv_extracted_at', null)
      .eq('documents.type', 'cv')
      .not('documents.extracted_text', 'is', null)
      .is('deleted_at', null)
      .limit(limit);

    if (error || !data) {
      console.error('Failed to get candidates needing extraction:', error);
      return [];
    }

    // For each candidate, find the latest CV document
    const results: Array<{ candidate_id: string; document_id: string }> = [];

    for (const candidate of data) {
      const documents = candidate.documents as Array<{
        id: string;
        created_at: string;
      }>;

      if (documents && documents.length > 0) {
        // Sort by created_at descending and take the first one
        const latestDoc = documents.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        results.push({
          candidate_id: candidate.id,
          document_id: latestDoc.id,
        });
      }
    }

    return results;
  }
}

// ----------------------------------------------------------------------------
// SINGLETON INSTANCE
// ----------------------------------------------------------------------------

let serviceInstance: CVExtractionService | null = null;

export function getCVExtractionService(): CVExtractionService {
  if (!serviceInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for CV extraction service');
    }

    serviceInstance = new CVExtractionService(supabaseUrl, supabaseKey);
  }

  return serviceInstance;
}

// ----------------------------------------------------------------------------
// EXPORTS
// ----------------------------------------------------------------------------

export { extractFromCV, extractFromCVSafe } from '@lighthouse/ai';
