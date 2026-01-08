/**
 * Vincere Sync Service
 *
 * Fire-and-forget sync functions for pushing local candidate actions to Vincere.
 * Local actions always succeed; sync failures are queued for retry.
 */

import { createClient } from '@supabase/supabase-js';
import { getVincereClient, VincereApiError } from './client';
import {
  searchByEmail,
  createCandidate,
  updateCandidate,
  updateCustomFields,
  setFunctionalExpertises,
} from './candidates';
import { uploadCandidateCV, uploadCandidateCertificate, uploadCandidatePhoto } from './files';
import { addCandidateToJob, VINCERE_APPLICATION_STAGES } from './jobs';
import { mapCandidateToVincere } from './sync';
import { VINCERE_FIELD_KEYS, getVincereFunctionalExpertiseId } from './constants';
import type { Candidate } from '../../../../packages/database/types';

// ============================================================================
// TYPES
// ============================================================================

export type SyncType = 'create' | 'update' | 'document' | 'application' | 'availability';

export interface SyncQueueItem {
  id: string;
  candidate_id: string;
  sync_type: SyncType;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'abandoned';
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SyncResult {
  success: boolean;
  vincereId?: number;
  error?: string;
  queued?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RETRY_DELAYS = [
  5 * 60 * 1000,      // 5 minutes
  30 * 60 * 1000,     // 30 minutes
  2 * 60 * 60 * 1000, // 2 hours
];

/**
 * Check if Vincere is configured (used to skip sync in dev environments)
 */
function isVincereConfigured(): boolean {
  return !!(
    process.env.VINCERE_CLIENT_ID &&
    process.env.VINCERE_API_KEY &&
    process.env.VINCERE_REFRESH_TOKEN
  );
}

/**
 * Get Supabase client for database operations
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof VincereApiError) {
    // Rate limited or server errors are retryable
    if (error.statusCode === 429 || error.statusCode >= 500) {
      return true;
    }
    // 401 might be retryable after token refresh (handled by client)
    if (error.statusCode === 401) {
      return true;
    }
    // 400, 404, etc. are not retryable
    return false;
  }

  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * Log sync error with structured context
 */
function logSyncError(
  syncType: SyncType,
  candidateId: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const logContext = {
    syncType,
    candidateId,
    error: errorMessage,
    ...(errorStack && { stack: errorStack }),
    ...context,
    timestamp: new Date().toISOString(),
  };
  
  console.error(`[VincereSync] ${syncType} failed:`, JSON.stringify(logContext, null, 2));
}

/**
 * Queue a failed sync operation for retry
 */
async function queueForRetry(
  candidateId: string,
  syncType: SyncType,
  payload: Record<string, unknown>,
  error: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const nextRetryAt = new Date(Date.now() + RETRY_DELAYS[0]).toISOString();

  try {
    await supabase.from('vincere_sync_queue').insert({
      candidate_id: candidateId,
      sync_type: syncType,
      payload,
      status: 'pending',
      attempts: 1,
      last_error: error,
      next_retry_at: nextRetryAt,
    });
    
    logSyncError(syncType, candidateId, new Error(error), { queued: true, nextRetryAt });
  } catch (queueError) {
    // If we can't even queue the retry, log it as a critical error
    console.error('[VincereSync] CRITICAL: Failed to queue retry:', {
      candidateId,
      syncType,
      originalError: error,
      queueError: queueError instanceof Error ? queueError.message : 'Unknown error',
    });
  }
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Sync a newly created candidate to Vincere
 *
 * This handles:
 * 1. Deduplication by email (searches first to avoid duplicates)
 * 2. Creates new candidate if not found
 * 3. Updates our database with vincere_id
 */
export async function syncCandidateCreation(
  candidateId: string
): Promise<SyncResult> {
  if (!isVincereConfigured()) {
    console.log('[VincereSync] Skipping sync - Vincere not configured');
    return { success: true };
  }

  const supabase = getSupabaseClient();

  try {
    // Fetch candidate from database
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      console.error('[VincereSync] Candidate not found:', candidateId);
      return { success: false, error: 'Candidate not found' };
    }

    // If already has vincere_id, nothing to do
    if (candidate.vincere_id) {
      return { success: true, vincereId: parseInt(candidate.vincere_id) };
    }

    const vincere = getVincereClient();
    let vincereId: number;

    // Search for existing candidate by email to avoid duplicates
    const existingCandidate = await searchByEmail(candidate.email, vincere);

    if (existingCandidate) {
      // Link to existing Vincere candidate
      vincereId = existingCandidate.id;
      console.log(`[VincereSync] Found existing Vincere candidate ${vincereId} for email ${candidate.email}`);
    } else {
      // Create new candidate in Vincere with all available basic data
      const result = await createCandidate(
        {
          firstName: candidate.first_name,
          lastName: candidate.last_name,
          email: candidate.email,
          phone: candidate.phone || undefined,
          mobile: candidate.whatsapp || undefined,
          dateOfBirth: candidate.date_of_birth || undefined,
          gender: candidate.gender || undefined,
          nationality: candidate.nationality || undefined,
          currentLocation: candidate.current_location || undefined,
          jobTitle: candidate.primary_position || undefined,
          summary: candidate.profile_summary || undefined,
        },
        vincere
      );

      vincereId = result.id;
      console.log(`[VincereSync] Created Vincere candidate ${vincereId} for ${candidate.email}`);

      // After creation, update custom fields if any are available
      // This ensures all custom field data is synced during registration
      const { basicData: _, customFields } = mapCandidateToVincere(candidate);
      console.log(`[VincereSync] Candidate data keys with values:`,
        Object.entries(candidate)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k]) => k)
      );
      console.log(`[VincereSync] Custom fields to sync:`,
        customFields.map(cf => ({
          fieldKey: cf.fieldKey.substring(0, 8) + '...',
          hasFieldValue: cf.fieldValue !== undefined,
          hasFieldValues: cf.fieldValues !== undefined,
          hasDateValue: cf.dateValue !== undefined,
        }))
      );
      if (customFields.length > 0) {
        await updateCustomFields(vincereId, customFields, vincere);
        console.log(`[VincereSync] Updated ${customFields.length} custom fields for new candidate ${vincereId}`);
      } else {
        console.log(`[VincereSync] No custom fields to sync for candidate ${vincereId}`);
      }

      // Set functional expertise based on position
      const expertiseId = getVincereFunctionalExpertiseId(candidate.primary_position);
      if (expertiseId) {
        try {
          await setFunctionalExpertises(vincereId, [expertiseId], vincere);
          console.log(`[VincereSync] Set functional expertise ${expertiseId} for candidate ${vincereId} (position: ${candidate.primary_position})`);
        } catch (err) {
          // Log but don't fail the whole sync for functional expertise errors
          console.error(`[VincereSync] Failed to set functional expertise for candidate ${vincereId}:`, err);
        }
      }
    }

    // Update our database with vincere_id
    await supabase
      .from('candidates')
      .update({ vincere_id: vincereId.toString(), last_synced_at: new Date().toISOString() })
      .eq('id', candidateId);

    return { success: true, vincereId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSyncError('create', candidateId, error);

    if (isRetryableError(error)) {
      await queueForRetry(candidateId, 'create', {}, errorMessage);
      return { success: false, error: errorMessage, queued: true };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Sync candidate profile updates to Vincere
 */
export async function syncCandidateUpdate(
  candidateId: string,
  changedFields?: Partial<Candidate>
): Promise<SyncResult> {
  if (!isVincereConfigured()) {
    console.log('[VincereSync] Skipping sync - Vincere not configured');
    return { success: true };
  }

  const supabase = getSupabaseClient();

  try {
    // Fetch candidate from database
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      console.error('[VincereSync] Candidate not found:', candidateId);
      return { success: false, error: 'Candidate not found' };
    }

    // If no vincere_id, try to create first
    if (!candidate.vincere_id) {
      const createResult = await syncCandidateCreation(candidateId);
      if (!createResult.success) {
        return createResult;
      }
      // Re-fetch to get vincere_id
      const { data: refreshedCandidate } = await supabase
        .from('candidates')
        .select('vincere_id')
        .eq('id', candidateId)
        .single();

      if (!refreshedCandidate?.vincere_id) {
        return { success: false, error: 'Failed to get vincere_id after creation' };
      }
      candidate.vincere_id = refreshedCandidate.vincere_id;
    }

    const vincereId = parseInt(candidate.vincere_id);
    const vincere = getVincereClient();

    // Use provided changed fields or the full candidate
    const fieldsToSync = changedFields || candidate;

    // Map to Vincere format
    const { basicData, customFields } = mapCandidateToVincere(fieldsToSync);

    // Update basic data if any
    if (Object.keys(basicData).length > 0) {
      await updateCandidate(vincereId, {
        firstName: basicData.first_name as string | undefined,
        lastName: basicData.last_name as string | undefined,
        email: basicData.primary_email as string | undefined,
        phone: basicData.phone as string | undefined,
        mobile: basicData.mobile as string | undefined,
        dateOfBirth: basicData.date_of_birth as string | undefined,
        gender: basicData.gender as string | undefined,
        nationality: basicData.nationality as string | undefined,
        currentLocation: basicData.current_location as string | undefined,
        jobTitle: basicData.job_title as string | undefined,
        summary: basicData.summary as string | undefined,
      }, vincere);
    }

    // Update custom fields if any
    if (customFields.length > 0) {
      await updateCustomFields(vincereId, customFields, vincere);
    }

    // Update last_synced_at
    await supabase
      .from('candidates')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', candidateId);

    console.log(`[VincereSync] Updated Vincere candidate ${vincereId}`);
    return { success: true, vincereId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSyncError('update', candidateId, error, { changedFields });

    if (isRetryableError(error)) {
      await queueForRetry(candidateId, 'update', { changedFields }, errorMessage);
      return { success: false, error: errorMessage, queued: true };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a document upload to Vincere
 *
 * @param candidateId - Our candidate ID
 * @param documentUrl - URL to download the document from (Supabase storage)
 * @param fileName - Original filename
 * @param mimeType - MIME type of the document
 * @param documentType - Type of document: 'cv', 'certificate', 'photo', 'other'
 */
export async function syncDocumentUpload(
  candidateId: string,
  documentUrl: string,
  fileName: string,
  mimeType: string,
  documentType: 'cv' | 'certificate' | 'photo' | 'other'
): Promise<SyncResult> {
  if (!isVincereConfigured()) {
    console.log('[VincereSync] Skipping sync - Vincere not configured');
    return { success: true };
  }

  const supabase = getSupabaseClient();

  try {
    // Fetch candidate's vincere_id
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('vincere_id')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      console.error('[VincereSync] Candidate not found:', candidateId);
      return { success: false, error: 'Candidate not found' };
    }

    // If no vincere_id, try to create first
    if (!candidate.vincere_id) {
      const createResult = await syncCandidateCreation(candidateId);
      if (!createResult.success) {
        return createResult;
      }
      // Re-fetch to get vincere_id
      const { data: refreshedCandidate } = await supabase
        .from('candidates')
        .select('vincere_id')
        .eq('id', candidateId)
        .single();

      if (!refreshedCandidate?.vincere_id) {
        return { success: false, error: 'Failed to get vincere_id after creation' };
      }
      candidate.vincere_id = refreshedCandidate.vincere_id;
    }

    const vincereId = parseInt(candidate.vincere_id);
    const vincere = getVincereClient();

    // Download the document from URL
    const response = await fetch(documentUrl);
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status}`);
    }
    const fileBuffer = await response.arrayBuffer();

    // Upload to Vincere based on document type
    if (documentType === 'cv') {
      await uploadCandidateCV(vincereId, fileBuffer, fileName, mimeType, vincere);
      console.log(`[VincereSync] Uploaded CV for candidate ${vincereId}`);
    } else if (documentType === 'certificate') {
      // Certificate type ID 1 is generic - could be enhanced with specific types
      await uploadCandidateCertificate(vincereId, fileBuffer, fileName, mimeType, 1, vincere);
      console.log(`[VincereSync] Uploaded certificate for candidate ${vincereId}`);
    } else if (documentType === 'photo') {
      // Vincere photo endpoint uses URL reference, not file upload
      // Max size: 800KB - if photo is larger, Vincere will reject it
      await uploadCandidatePhoto(vincereId, documentUrl, fileName, vincere);
      console.log(`[VincereSync] Uploaded photo for candidate ${vincereId}`);
    } else {
      // Generic document upload - use certificate endpoint with generic type
      await uploadCandidateCertificate(vincereId, fileBuffer, fileName, mimeType, 1, vincere);
      console.log(`[VincereSync] Uploaded document for candidate ${vincereId}`);
    }

    return { success: true, vincereId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSyncError('document', candidateId, error, { documentType, fileName });

    if (isRetryableError(error)) {
      await queueForRetry(candidateId, 'document', { documentUrl, fileName, mimeType, documentType }, errorMessage);
      return { success: false, error: errorMessage, queued: true };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a job application to Vincere
 *
 * This adds the candidate to the job's shortlist in Vincere.
 * Only works for jobs that came from Vincere (have external_source='vincere').
 */
export async function syncJobApplication(
  candidateId: string,
  jobId: string
): Promise<SyncResult> {
  if (!isVincereConfigured()) {
    console.log('[VincereSync] Skipping sync - Vincere not configured');
    return { success: true };
  }

  const supabase = getSupabaseClient();

  try {
    // Fetch candidate's vincere_id
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('vincere_id')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      console.error('[VincereSync] Candidate not found:', candidateId);
      return { success: false, error: 'Candidate not found' };
    }

    // Fetch job to check if it's from Vincere
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('external_id, external_source')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('[VincereSync] Job not found:', jobId);
      return { success: false, error: 'Job not found' };
    }

    // Only sync if job is from Vincere
    if (job.external_source !== 'vincere' || !job.external_id) {
      console.log(`[VincereSync] Skipping application sync - job ${jobId} is not from Vincere`);
      return { success: true };
    }

    // If candidate doesn't have vincere_id, try to create first
    if (!candidate.vincere_id) {
      const createResult = await syncCandidateCreation(candidateId);
      if (!createResult.success) {
        return createResult;
      }
      // Re-fetch to get vincere_id
      const { data: refreshedCandidate } = await supabase
        .from('candidates')
        .select('vincere_id')
        .eq('id', candidateId)
        .single();

      if (!refreshedCandidate?.vincere_id) {
        return { success: false, error: 'Failed to get vincere_id after creation' };
      }
      candidate.vincere_id = refreshedCandidate.vincere_id;
    }

    const candidateVincereId = parseInt(candidate.vincere_id);
    const jobVincereId = parseInt(job.external_id);
    const vincere = getVincereClient();

    // Add candidate to job shortlist (use SHORTLIST stage as per requirements)
    await addCandidateToJob(jobVincereId, candidateVincereId, VINCERE_APPLICATION_STAGES.SHORTLIST, vincere);

    console.log(`[VincereSync] Added candidate ${candidateVincereId} to job ${jobVincereId}`);
    return { success: true, vincereId: candidateVincereId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSyncError('application', candidateId, error, { jobId });

    if (isRetryableError(error)) {
      await queueForRetry(candidateId, 'application', { jobId }, errorMessage);
      return { success: false, error: errorMessage, queued: true };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Sync availability updates to Vincere
 *
 * Updates the candidate's availability custom fields in Vincere.
 */
export async function syncAvailabilityUpdate(
  candidateId: string,
  status: string,
  availableFrom: string | null
): Promise<SyncResult> {
  if (!isVincereConfigured()) {
    console.log('[VincereSync] Skipping sync - Vincere not configured');
    return { success: true };
  }

  const supabase = getSupabaseClient();

  try {
    // Fetch candidate's vincere_id
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('vincere_id')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      console.error('[VincereSync] Candidate not found:', candidateId);
      return { success: false, error: 'Candidate not found' };
    }

    // If no vincere_id, try to create first
    if (!candidate.vincere_id) {
      const createResult = await syncCandidateCreation(candidateId);
      if (!createResult.success) {
        return createResult;
      }
      // Re-fetch to get vincere_id
      const { data: refreshedCandidate } = await supabase
        .from('candidates')
        .select('vincere_id')
        .eq('id', candidateId)
        .single();

      if (!refreshedCandidate?.vincere_id) {
        return { success: false, error: 'Failed to get vincere_id after creation' };
      }
      candidate.vincere_id = refreshedCandidate.vincere_id;
    }

    const vincereId = parseInt(candidate.vincere_id);
    const vincere = getVincereClient();

    // Build custom fields update
    const customFields: Array<{
      fieldKey: string;
      fieldValue?: string;
      dateValue?: string;
    }> = [];

    // Update start date if available_from is provided
    if (availableFrom) {
      customFields.push({
        fieldKey: VINCERE_FIELD_KEYS.startDate,
        dateValue: new Date(availableFrom).toISOString(),
      });
    }

    // Update custom fields if any
    if (customFields.length > 0) {
      await updateCustomFields(vincereId, customFields, vincere);
    }

    // Update last_synced_at
    await supabase
      .from('candidates')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', candidateId);

    console.log(`[VincereSync] Updated availability for candidate ${vincereId}`);
    return { success: true, vincereId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logSyncError('availability', candidateId, error, { status, availableFrom });

    if (isRetryableError(error)) {
      await queueForRetry(candidateId, 'availability', { status, availableFrom }, errorMessage);
      return { success: false, error: errorMessage, queued: true };
    }

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// RETRY PROCESSING
// ============================================================================

/**
 * Process pending items in the sync queue
 * Called by cron job
 */
export async function processRetryQueue(limit: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  abandoned: number;
}> {
  const supabase = getSupabaseClient();

  // Fetch pending items that are due for retry
  const { data: items, error } = await supabase
    .from('vincere_sync_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(limit);

  if (error || !items || items.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, abandoned: 0 };
  }

  let succeeded = 0;
  let failed = 0;
  let abandoned = 0;

  for (const item of items as SyncQueueItem[]) {
    // Mark as processing
    await supabase
      .from('vincere_sync_queue')
      .update({ status: 'processing' })
      .eq('id', item.id);

    try {
      let result: SyncResult;

      switch (item.sync_type) {
        case 'create':
          result = await syncCandidateCreation(item.candidate_id);
          break;
        case 'update':
          result = await syncCandidateUpdate(item.candidate_id, item.payload.changedFields as Partial<Candidate> | undefined);
          break;
        case 'document':
          result = await syncDocumentUpload(
            item.candidate_id,
            item.payload.documentUrl as string,
            item.payload.fileName as string,
            item.payload.mimeType as string,
            item.payload.documentType as 'cv' | 'certificate' | 'photo' | 'other'
          );
          break;
        case 'application':
          result = await syncJobApplication(item.candidate_id, item.payload.jobId as string);
          break;
        case 'availability':
          result = await syncAvailabilityUpdate(
            item.candidate_id,
            item.payload.status as string,
            item.payload.availableFrom as string | null
          );
          break;
        default:
          result = { success: false, error: `Unknown sync type: ${item.sync_type}` };
      }

      if (result.success) {
        // Mark as completed
        await supabase
          .from('vincere_sync_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        succeeded++;
      } else if (result.queued) {
        // Already re-queued by the sync function, just clean up this entry
        await supabase
          .from('vincere_sync_queue')
          .delete()
          .eq('id', item.id);
        failed++;
      } else {
        // Permanent failure - mark as failed
        await supabase
          .from('vincere_sync_queue')
          .update({
            status: 'failed',
            last_error: result.error || 'Unknown error',
          })
          .eq('id', item.id);
        failed++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const attempts = item.attempts + 1;

      if (attempts >= item.max_attempts) {
        // Max attempts reached - abandon
        await supabase
          .from('vincere_sync_queue')
          .update({
            status: 'abandoned',
            attempts,
            last_error: errorMessage,
          })
          .eq('id', item.id);
        abandoned++;
      } else {
        // Schedule next retry with exponential backoff
        const delay = RETRY_DELAYS[Math.min(attempts, RETRY_DELAYS.length - 1)];
        await supabase
          .from('vincere_sync_queue')
          .update({
            status: 'pending',
            attempts,
            last_error: errorMessage,
            next_retry_at: new Date(Date.now() + delay).toISOString(),
          })
          .eq('id', item.id);
        failed++;
      }
    }
  }

  return {
    processed: items.length,
    succeeded,
    failed,
    abandoned,
  };
}
