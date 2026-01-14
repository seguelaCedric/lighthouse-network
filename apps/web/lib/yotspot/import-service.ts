/**
 * Yotspot Import Service
 * Orchestrates the full import pipeline: scraping, CV extraction, candidate creation, matching
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { YotspotScraper } from './scraper';
import {
  YotspotImportQueueItem,
  ScrapedCandidate,
  ImportResult,
  ImportErrorCode,
  YotspotJobMapping,
} from './types';
import {
  YOTSPOT_RETRY,
  MATCH_THRESHOLDS,
  calculateNextRetryAt,
} from './constants';
import { extractText } from '@/lib/services/text-extraction';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get Supabase client for database operations
 */
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ============================================================================
// IMPORT SERVICE CLASS
// ============================================================================

export class YotspotImportService {
  private supabase: SupabaseClient;
  private scraper: YotspotScraper | null = null;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || getSupabaseClient();
  }

  // --------------------------------------------------------------------------
  // Main Processing Functions
  // --------------------------------------------------------------------------

  /**
   * Process a batch of pending imports from the queue
   */
  async processPendingImports(maxItems = 5): Promise<ImportResult[]> {
    console.log(`[YotspotImportService] Processing up to ${maxItems} pending imports...`);

    // Get pending items ready for processing
    const { data: items, error } = await this.supabase
      .from('yotspot_import_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .lt('attempts', YOTSPOT_RETRY.MAX_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(maxItems);

    if (error) {
      console.error('[YotspotImportService] Failed to fetch pending items:', error);
      return [];
    }

    if (!items || items.length === 0) {
      console.log('[YotspotImportService] No pending items to process');
      return [];
    }

    console.log(`[YotspotImportService] Found ${items.length} items to process`);

    const results: ImportResult[] = [];

    // Initialize scraper once for batch processing
    this.scraper = new YotspotScraper();
    await this.scraper.initialize();

    try {
      for (const item of items) {
        const result = await this.processImport(item as YotspotImportQueueItem);
        results.push(result);
      }
    } finally {
      // Always close the browser
      await this.scraper.close();
      this.scraper = null;
    }

    const successful = results.filter((r) => r.success).length;
    console.log(`[YotspotImportService] Processed ${results.length} items, ${successful} successful`);

    return results;
  }

  /**
   * Process a single import by queue ID (for real-time processing)
   */
  async processSingleImportById(queueId: string): Promise<ImportResult> {
    console.log(`[YotspotImportService] Processing single import immediately: ${queueId}`);

    // Get the queue item
    const { data: item, error } = await this.supabase
      .from('yotspot_import_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (error || !item) {
      console.error('[YotspotImportService] Queue item not found:', queueId);
      return {
        success: false,
        queueId,
        error: 'Queue item not found',
        errorCode: 'UNKNOWN_ERROR',
      };
    }

    // Initialize scraper for single use
    this.scraper = new YotspotScraper();
    await this.scraper.initialize();

    try {
      return await this.processImport(item as YotspotImportQueueItem);
    } finally {
      await this.scraper.close();
      this.scraper = null;
    }
  }

  /**
   * Process a single import from the queue
   */
  async processImport(item: YotspotImportQueueItem): Promise<ImportResult> {
    console.log(`[YotspotImportService] Processing import ${item.id}: ${item.applicant_url}`);

    // Update status to scraping
    await this.updateQueueStatus(item.id, 'scraping');

    try {
      // Step 1: Scrape candidate from Yotspot
      const scraped = await this.scrapeCandidate(item);
      if (!scraped) {
        throw new ImportError('Failed to scrape candidate', 'SCRAPE_FAILED');
      }

      // Update with scraped data
      await this.supabase
        .from('yotspot_import_queue')
        .update({
          scraped_at: new Date().toISOString(),
          candidate_name: scraped.fullName,
          candidate_email: scraped.email,
          candidate_phone: scraped.phone,
          scraped_data: scraped,
        })
        .eq('id', item.id);

      // Update status to processing
      await this.updateQueueStatus(item.id, 'processing');

      // Step 2: Check for duplicate by email
      if (scraped.email) {
        const existingCandidate = await this.findExistingCandidate(scraped.email);
        if (existingCandidate) {
          console.log(
            `[YotspotImportService] Duplicate found - existing candidate ${existingCandidate.id}`
          );

          // Link to existing candidate and run matching
          const matchResult = await this.scoreCandidate(existingCandidate.id, item.job_id);

          await this.completeImport(item.id, {
            candidate_id: existingCandidate.id,
            match_score: matchResult?.score ?? null,
            match_assessment: matchResult?.assessment ?? null,
            status: 'duplicate',
          });

          return {
            success: true,
            queueId: item.id,
            candidateId: existingCandidate.id,
            candidateName: scraped.fullName,
            isDuplicate: true,
            matchScore: matchResult?.score,
            matchAssessment: matchResult?.assessment,
          };
        }
      }

      // Step 3: Download and process CV
      let cvText = '';
      let cvUrl: string | null = null;

      if (scraped.cvDownloadUrl && this.scraper) {
        try {
          const cvBuffer = await this.scraper.downloadCV(scraped.cvDownloadUrl);
          const filename = this.extractFilenameFromUrl(scraped.cvDownloadUrl) || 'cv.pdf';
          const contentType = this.getContentType(filename);

          // Extract text from CV
          const arrayBuffer = cvBuffer.buffer.slice(
            cvBuffer.byteOffset,
            cvBuffer.byteOffset + cvBuffer.byteLength
          ) as ArrayBuffer;
          const textResult = await extractText(arrayBuffer, contentType, filename);
          cvText = textResult.text;

          // Upload CV to storage
          cvUrl = await this.uploadCVToStorage(item.id, cvBuffer, filename);
        } catch (cvError) {
          console.warn('[YotspotImportService] Failed to process CV:', cvError);
          // Continue without CV - we still have scraped data
        }
      }

      // Step 4: Create candidate record
      const candidateId = await this.createCandidate(scraped, cvText);

      // Step 5: Run match scoring if we have a job
      let matchScore: number | undefined;
      let matchAssessment: string | undefined;

      if (item.job_id) {
        const matchResult = await this.scoreCandidate(candidateId, item.job_id);
        matchScore = matchResult?.score;
        matchAssessment = matchResult?.assessment;
      }

      // Step 6: Complete the import
      await this.completeImport(item.id, {
        candidate_id: candidateId,
        cv_url: cvUrl,
        match_score: matchScore ?? null,
        match_assessment: matchAssessment ?? null,
        status: 'completed',
      });

      return {
        success: true,
        queueId: item.id,
        candidateId,
        candidateName: scraped.fullName,
        isDuplicate: false,
        matchScore,
        matchAssessment,
      };
    } catch (error) {
      console.error(`[YotspotImportService] Import ${item.id} failed:`, error);

      const errorCode =
        error instanceof ImportError ? error.code : 'UNKNOWN_ERROR';
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Handle retry logic
      const attempts = item.attempts + 1;
      if (attempts < YOTSPOT_RETRY.MAX_ATTEMPTS) {
        // Queue for retry
        await this.supabase
          .from('yotspot_import_queue')
          .update({
            status: 'pending',
            attempts,
            last_error: errorMessage,
            next_retry_at: calculateNextRetryAt(attempts).toISOString(),
          })
          .eq('id', item.id);
      } else {
        // Mark as failed
        await this.supabase
          .from('yotspot_import_queue')
          .update({
            status: 'failed',
            attempts,
            last_error: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }

      return {
        success: false,
        queueId: item.id,
        error: errorMessage,
        errorCode,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Scraping
  // --------------------------------------------------------------------------

  /**
   * Scrape a candidate from Yotspot
   */
  private async scrapeCandidate(
    item: YotspotImportQueueItem
  ): Promise<ScrapedCandidate | null> {
    if (!this.scraper) {
      this.scraper = new YotspotScraper();
      await this.scraper.initialize();
    }

    try {
      await this.scraper.login();
      return await this.scraper.scrapeCandidate(item.applicant_url);
    } catch (error) {
      console.error('[YotspotImportService] Scraping failed:', error);
      throw new ImportError(
        `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SCRAPE_FAILED'
      );
    }
  }

  // --------------------------------------------------------------------------
  // Candidate Management
  // --------------------------------------------------------------------------

  /**
   * Find an existing candidate by email
   */
  private async findExistingCandidate(
    email: string
  ): Promise<{ id: string } | null> {
    const { data } = await this.supabase
      .from('candidates')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    return data;
  }

  /**
   * Create a new candidate from scraped data
   */
  private async createCandidate(
    scraped: ScrapedCandidate,
    cvText: string
  ): Promise<string> {
    // Map scraped data to candidate record
    const candidateData = {
      first_name: scraped.firstName,
      last_name: scraped.lastName,
      email: scraped.email?.toLowerCase() || null,
      phone: scraped.phone,
      nationality: scraped.nationality,
      date_of_birth: scraped.dateOfBirth,

      // Position
      primary_position: scraped.primaryPosition,
      yacht_primary_position: scraped.primaryPosition,
      years_experience: scraped.yearsExperience,

      // Availability
      availability_status: this.mapAvailabilityStatus(scraped.availabilityStatus),
      available_from: scraped.availableFrom,

      // Certifications
      has_stcw: scraped.hasStcw,
      has_eng1: scraped.hasEng1,

      // Visas
      has_schengen: scraped.hasSchengen,
      has_b1b2: scraped.hasB1B2,

      // Personal
      is_smoker: scraped.isSmoker,
      has_visible_tattoos: scraped.hasVisibleTattoos,
      languages: scraped.languages,

      // Source tracking
      source: 'yotspot',

      // Profile
      bio: scraped.profileSummary,

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('candidates')
      .insert(candidateData)
      .select('id')
      .single();

    if (error) {
      console.error('[YotspotImportService] Failed to create candidate:', error);
      throw new ImportError(
        `Failed to create candidate: ${error.message}`,
        'CANDIDATE_CREATE_FAILED'
      );
    }

    console.log(`[YotspotImportService] Created candidate ${data.id}`);
    return data.id;
  }

  // --------------------------------------------------------------------------
  // Match Scoring
  // --------------------------------------------------------------------------

  /**
   * Score a candidate against a job
   */
  private async scoreCandidate(
    candidateId: string,
    jobId: string | null
  ): Promise<{ score: number; assessment: string } | null> {
    if (!jobId) return null;

    try {
      // Get candidate and job data
      const { data: candidate } = await this.supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      const { data: job } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!candidate || !job) {
        console.warn('[YotspotImportService] Could not find candidate or job for scoring');
        return null;
      }

      // For now, use a simple rule-based scoring
      // TODO: Integrate with the full AI matcher
      const score = this.calculateBasicMatchScore(candidate, job);
      const assessment = this.generateBasicAssessment(candidate, job, score);

      return { score, assessment };
    } catch (error) {
      console.error('[YotspotImportService] Match scoring failed:', error);
      return null;
    }
  }

  /**
   * Basic rule-based match scoring
   */
  private calculateBasicMatchScore(
    candidate: Record<string, unknown>,
    job: Record<string, unknown>
  ): number {
    let score = 50; // Start at 50%

    // Position match (+20)
    const candidatePosition = (candidate.primary_position as string || '').toLowerCase();
    const jobTitle = (job.title as string || '').toLowerCase();
    if (candidatePosition && jobTitle.includes(candidatePosition)) {
      score += 20;
    }

    // Experience match (+15)
    const candidateExp = candidate.years_experience as number || 0;
    const requiredExp = job.experience_years_min as number || 0;
    if (candidateExp >= requiredExp) {
      score += 15;
    }

    // Certifications (+10)
    if (candidate.has_stcw) score += 5;
    if (candidate.has_eng1) score += 5;

    // Availability (+5)
    if (candidate.availability_status === 'available') {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Generate a basic match assessment
   */
  private generateBasicAssessment(
    candidate: Record<string, unknown>,
    job: Record<string, unknown>,
    score: number
  ): string {
    const strengths: string[] = [];
    const concerns: string[] = [];

    // Check position
    const candidatePosition = candidate.primary_position as string;
    if (candidatePosition) {
      strengths.push(`Has ${candidatePosition} experience`);
    }

    // Check experience
    const candidateExp = candidate.years_experience as number || 0;
    const requiredExp = job.experience_years_min as number || 0;
    if (candidateExp >= requiredExp) {
      strengths.push(`${candidateExp} years of experience`);
    } else if (requiredExp > 0) {
      concerns.push(`Only ${candidateExp} years experience (${requiredExp} required)`);
    }

    // Check certifications
    if (candidate.has_stcw) strengths.push('STCW certified');
    if (candidate.has_eng1) strengths.push('ENG1 valid');

    // Check availability
    if (candidate.availability_status === 'available') {
      strengths.push('Immediately available');
    } else if (candidate.availability_status === 'unavailable') {
      concerns.push('Currently unavailable');
    }

    let assessment = '';
    if (strengths.length > 0) {
      assessment += `Strengths: ${strengths.join(', ')}. `;
    }
    if (concerns.length > 0) {
      assessment += `Concerns: ${concerns.join(', ')}.`;
    }

    return assessment || 'Basic profile match.';
  }

  // --------------------------------------------------------------------------
  // Storage
  // --------------------------------------------------------------------------

  /**
   * Upload CV to Supabase storage
   */
  private async uploadCVToStorage(
    queueId: string,
    cvBuffer: Buffer,
    filename: string
  ): Promise<string> {
    const storagePath = `yotspot-imports/${queueId}/${filename}`;

    const { data, error } = await this.supabase.storage
      .from('documents')
      .upload(storagePath, cvBuffer, {
        contentType: this.getContentType(filename),
        upsert: true,
      });

    if (error) {
      console.error('[YotspotImportService] Failed to upload CV:', error);
      throw new Error(`CV upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  }

  // --------------------------------------------------------------------------
  // Queue Management
  // --------------------------------------------------------------------------

  /**
   * Update queue item status
   */
  private async updateQueueStatus(
    id: string,
    status: YotspotImportQueueItem['status']
  ): Promise<void> {
    await this.supabase
      .from('yotspot_import_queue')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  /**
   * Complete an import with final data
   */
  private async completeImport(
    id: string,
    data: {
      candidate_id: string | null;
      cv_url?: string | null;
      match_score: number | null;
      match_assessment: string | null;
      status: YotspotImportQueueItem['status'];
    }
  ): Promise<void> {
    await this.supabase
      .from('yotspot_import_queue')
      .update({
        ...data,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  /**
   * Map Yotspot availability status to our enum
   */
  private mapAvailabilityStatus(
    status: string | null
  ): 'available' | 'looking' | 'employed' | 'unavailable' | null {
    if (!status) return null;

    const lower = status.toLowerCase();
    if (lower.includes('available') || lower.includes('immediately')) {
      return 'available';
    }
    if (lower.includes('looking') || lower.includes('seeking')) {
      return 'looking';
    }
    if (lower.includes('employed') || lower.includes('working')) {
      return 'employed';
    }
    if (lower.includes('unavailable') || lower.includes('not available')) {
      return 'unavailable';
    }
    return 'looking'; // Default
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      const parts = pathname.split('/');
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  }

  /**
   * Get content type from filename
   */
  private getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc':
        return 'application/msword';
      default:
        return 'application/octet-stream';
    }
  }
}

// ============================================================================
// ERROR CLASS
// ============================================================================

class ImportError extends Error {
  constructor(
    message: string,
    public code: ImportErrorCode
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Process pending Yotspot imports (for use in cron jobs)
 */
export async function processPendingYotspotImports(
  maxItems = 5
): Promise<ImportResult[]> {
  const service = new YotspotImportService();
  return service.processPendingImports(maxItems);
}

/**
 * Process a single import immediately (for real-time processing)
 */
export async function processYotspotImportById(
  queueId: string
): Promise<ImportResult> {
  const service = new YotspotImportService();
  return service.processSingleImportById(queueId);
}
