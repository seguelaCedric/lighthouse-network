/**
 * On-Login Vincere Hydration Service
 *
 * Hydrates candidate data from Vincere when a candidate logs in.
 * This is used for "email stub" candidates - candidates imported from Vincere
 * by email only, who haven't yet logged in.
 *
 * On first login, we:
 * 1. Search Vincere by email to get vincere_id
 * 2. Fetch basic candidate data + ALL custom fields
 * 3. Fetch latest CV (original_cv: true)
 * 4. Fetch photo
 * 5. Run CV text extraction and embedding generation
 *
 * This allows the candidate to immediately see their profile data from Vincere.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  searchByEmail,
  getFullCandidateData,
  VincereExtendedCandidateData,
} from './candidates';
import {
  getCandidateCVFile,
  getCandidatePhotoFile,
  downloadFile,
  getFileExtension,
  VincereFile,
} from './files';
import { shouldExcludeDocument } from './document-classifier';
import { mapVincereToCandidate } from './sync';
import { getVincereClient, VincereClient } from './client';
import { extractText, truncateForEmbedding, isExtractable } from '../services/text-extraction';
import { generateEmbedding } from '@lighthouse/ai';

/**
 * Result of hydration attempt
 */
export interface HydrationResult {
  success: boolean;
  hydrated: boolean; // true if data was fetched from Vincere
  vincereId?: number;
  cvProcessed?: boolean;
  photoProcessed?: boolean;
  error?: string;
  fieldsUpdated?: string[];
}

/**
 * Check if a candidate needs hydration from Vincere
 * Returns true if:
 * - Candidate has an email but no first_name (email stub)
 * - Candidate has never been synced from Vincere (no vincere_id)
 */
export async function needsVincereHydration(
  candidateId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, email, first_name, vincere_id, last_synced_at')
    .eq('id', candidateId)
    .single();

  if (!candidate || !candidate.email) {
    return false;
  }

  // Email stub: has email but no name
  const isEmailStub = !candidate.first_name;

  // Never synced from Vincere
  const neverSynced = !candidate.vincere_id && !candidate.last_synced_at;

  return isEmailStub || neverSynced;
}

/**
 * Hydrate a candidate's data from Vincere on login
 *
 * This is the main function to call when a candidate logs in.
 * It will:
 * 1. Search Vincere by email
 * 2. Fetch and update all candidate data + custom fields
 * 3. Download and process CV (with text extraction + embedding)
 * 4. Download and set photo
 */
export async function hydrateFromVincere(
  candidateId: string,
  email: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<HydrationResult> {
  console.log(`[VincereHydration] Starting hydration for candidate ${candidateId} (${email})`);

  try {
    const vincereClient = getVincereClient();

    // Step 1: Search Vincere by email
    console.log(`[VincereHydration] Searching Vincere for email: ${email}`);
    const vincereCandidate = await searchByEmail(email, vincereClient);

    if (!vincereCandidate) {
      console.log(`[VincereHydration] No candidate found in Vincere for email: ${email}`);
      return {
        success: true,
        hydrated: false,
        error: 'No matching candidate found in Vincere',
      };
    }

    const vincereId = vincereCandidate.id;
    console.log(`[VincereHydration] Found Vincere candidate ID: ${vincereId}`);

    // Step 2: Get full candidate data including custom fields
    console.log(`[VincereHydration] Fetching full candidate data from Vincere...`);
    const fullData = await getFullCandidateData(vincereId, vincereClient);

    if (!fullData) {
      return {
        success: false,
        hydrated: false,
        vincereId,
        error: 'Failed to fetch full candidate data from Vincere',
      };
    }

    // Step 3: Map Vincere data to our candidate format
    const mappedData = mapVincereToCandidate(
      fullData.candidate,
      fullData.customFields,
      {
        functionalExpertises: fullData.functionalExpertises,
        currentLocation: fullData.currentLocation,
        candidateStatus: fullData.candidateStatus,
      }
    );

    // Track which fields were updated
    const fieldsUpdated: string[] = [];

    // Step 4: Update candidate record with Vincere data
    // Only update fields that have values (don't overwrite existing data with null)
    const updatePayload: Record<string, unknown> = {
      vincere_id: vincereId.toString(),
      last_synced_at: new Date().toISOString(),
    };

    // Add all non-null mapped fields
    for (const [key, value] of Object.entries(mappedData)) {
      if (value !== null && value !== undefined) {
        updatePayload[key] = value;
        fieldsUpdated.push(key);
      }
    }

    console.log(`[VincereHydration] Updating candidate with ${fieldsUpdated.length} fields`);

    const { error: updateError } = await supabase
      .from('candidates')
      .update(updatePayload)
      .eq('id', candidateId);

    if (updateError) {
      console.error(`[VincereHydration] Failed to update candidate:`, updateError);
      return {
        success: false,
        hydrated: false,
        vincereId,
        error: `Failed to update candidate: ${updateError.message}`,
      };
    }

    // Step 5: Process CV (if available)
    let cvProcessed = false;
    try {
      cvProcessed = await processCVFromVincere(
        vincereId,
        candidateId,
        organizationId,
        vincereClient,
        supabase
      );
    } catch (cvError) {
      console.error(`[VincereHydration] CV processing failed:`, cvError);
      // Don't fail the whole hydration if CV fails
    }

    // Step 6: Process photo (if available)
    let photoProcessed = false;
    try {
      photoProcessed = await processPhotoFromVincere(
        vincereId,
        candidateId,
        vincereClient,
        supabase
      );
    } catch (photoError) {
      console.error(`[VincereHydration] Photo processing failed:`, photoError);
      // Don't fail the whole hydration if photo fails
    }

    console.log(`[VincereHydration] Hydration complete for candidate ${candidateId}`);

    return {
      success: true,
      hydrated: true,
      vincereId,
      cvProcessed,
      photoProcessed,
      fieldsUpdated,
    };
  } catch (error) {
    console.error(`[VincereHydration] Error during hydration:`, error);
    return {
      success: false,
      hydrated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process the candidate's CV from Vincere
 * - Downloads the latest CV (original_cv: true)
 * - Uploads to Supabase storage
 * - Extracts text
 * - Generates embedding
 * - Updates candidate record
 */
async function processCVFromVincere(
  vincereId: number,
  candidateId: string,
  organizationId: string,
  vincereClient: VincereClient,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log(`[VincereHydration] Processing CV for candidate ${vincereId}...`);

  // Get CV file metadata
  const cvFile = await getCandidateCVFile(vincereId, vincereClient);

  if (!cvFile) {
    console.log(`[VincereHydration] No CV found for candidate ${vincereId}`);
    return false;
  }

  // Check if this document should be excluded (verbal ref, logo CV, etc.)
  const exclusion = shouldExcludeDocument(cvFile);
  if (exclusion.excluded) {
    console.log(`[VincereHydration] CV excluded: ${exclusion.reason}`);
    return false;
  }

  console.log(`[VincereHydration] Downloading CV: ${cvFile.file_name}...`);

  // Download the file
  const fileBuffer = await downloadFile(vincereId, cvFile.id, vincereClient, cvFile.url);

  // Upload to storage
  const ext = getFileExtension(cvFile);
  const storagePath = `candidates/${candidateId}/cv/${cvFile.id}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, Buffer.from(fileBuffer), {
      contentType: cvFile.content_type || 'application/octet-stream',
      upsert: true,
    });

  if (uploadError) {
    console.error(`[VincereHydration] CV upload failed:`, uploadError);
    return false;
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
  const fileUrl = urlData.publicUrl;

  // Extract text
  let extractedText = '';
  const contentType = cvFile.content_type || '';
  const originalFilename = cvFile.file_name || '';

  if (isExtractable(contentType, originalFilename)) {
    console.log(`[VincereHydration] Extracting text from CV...`);
    const extractionResult = await extractText(fileBuffer, contentType, originalFilename);

    if (!extractionResult.error) {
      extractedText = extractionResult.text;
      console.log(`[VincereHydration] Extracted ${extractedText.length} characters`);
    } else {
      console.log(`[VincereHydration] Text extraction warning: ${extractionResult.error}`);
    }
  }

  // Generate embedding if we have enough text
  let embedding: number[] | null = null;
  if (extractedText.length > 50) {
    console.log(`[VincereHydration] Generating embedding...`);
    try {
      const textForEmbedding = truncateForEmbedding(extractedText);
      embedding = await generateEmbedding(textForEmbedding);
      console.log(`[VincereHydration] Generated ${embedding.length}-dimension embedding`);
    } catch (embeddingError) {
      console.log(`[VincereHydration] Embedding generation failed:`, embeddingError);
    }
  }

  // Create document record
  const { data: doc, error: insertError } = await supabase
    .from('documents')
    .insert({
      entity_type: 'candidate',
      entity_id: candidateId,
      type: 'cv',
      name: cvFile.file_name || 'CV',
      file_url: fileUrl,
      file_path: storagePath,
      file_size: cvFile.size || fileBuffer.byteLength,
      mime_type: contentType || 'application/octet-stream',
      status: 'approved',
      is_latest_version: true,
      organization_id: organizationId,
      extracted_text: extractedText || null,
      embedding: embedding,
      metadata: {
        vincere_file_id: cvFile.id,
        vincere_candidate_id: vincereId,
        original_filename: cvFile.file_name,
        source: 'vincere_hydration',
      },
    })
    .select('id')
    .single();

  if (insertError) {
    console.error(`[VincereHydration] Document insert failed:`, insertError);
    return false;
  }

  // Update candidate with CV reference
  await supabase
    .from('candidates')
    .update({
      cv_document_id: doc.id,
      cv_url: fileUrl,
      cv_status: 'approved',
      embedding_text: extractedText || null,
      embedding: embedding,
    })
    .eq('id', candidateId);

  console.log(`[VincereHydration] CV processed successfully`);
  return true;
}

/**
 * Process the candidate's photo from Vincere
 * - Downloads the photo file
 * - Uploads to avatars bucket
 * - Updates candidate avatar_url
 */
async function processPhotoFromVincere(
  vincereId: number,
  candidateId: string,
  vincereClient: VincereClient,
  supabase: SupabaseClient
): Promise<boolean> {
  console.log(`[VincereHydration] Processing photo for candidate ${vincereId}...`);

  // Get photo file metadata
  const photoFile = await getCandidatePhotoFile(vincereId, vincereClient);

  if (!photoFile) {
    console.log(`[VincereHydration] No photo found for candidate ${vincereId}`);
    return false;
  }

  console.log(`[VincereHydration] Downloading photo: ${photoFile.file_name}...`);

  // Download the file
  const fileBuffer = await downloadFile(vincereId, photoFile.id, vincereClient, photoFile.url);

  // Upload to avatars bucket
  const ext = getFileExtension(photoFile);
  const storagePath = `candidates/${candidateId}/photo/${photoFile.id}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, Buffer.from(fileBuffer), {
      contentType: photoFile.content_type || 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error(`[VincereHydration] Photo upload failed:`, uploadError);
    return false;
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  const photoUrl = urlData.publicUrl;

  // Update candidate avatar
  await supabase
    .from('candidates')
    .update({
      avatar_url: photoUrl,
    })
    .eq('id', candidateId);

  console.log(`[VincereHydration] Photo processed successfully`);
  return true;
}

/**
 * Trigger hydration for a candidate if needed
 * This is a convenience function that checks if hydration is needed
 * and performs it if so.
 *
 * Should be called after successful login.
 */
export async function triggerHydrationIfNeeded(
  candidateId: string,
  email: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<HydrationResult | null> {
  // Check if hydration is needed
  const needsHydration = await needsVincereHydration(candidateId, supabase);

  if (!needsHydration) {
    console.log(`[VincereHydration] Candidate ${candidateId} does not need hydration`);
    return null;
  }

  console.log(`[VincereHydration] Candidate ${candidateId} needs hydration, starting...`);
  return hydrateFromVincere(candidateId, email, organizationId, supabase);
}
