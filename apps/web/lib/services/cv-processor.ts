/**
 * CV Processor Service
 *
 * Full pipeline for processing candidate CVs from Vincere:
 * 1. Download CV from Vincere
 * 2. Upload to Supabase storage
 * 3. Extract text from document
 * 4. Generate embedding for semantic search
 * 5. Store document record with extracted text and embedding
 *
 * This enables AI-powered "talk to the database" search that's better
 * than Vincere's keyword matching.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { VincereClient, getCandidateFiles, downloadFile, getFileExtension, isPDF, VincereFile } from '../vincere';
import { extractText, truncateForEmbedding, getFileTypeLabel, isExtractable } from './text-extraction';
import { generateEmbedding } from '@lighthouse/ai';

/**
 * Result of CV processing
 */
export interface CVProcessingResult {
  success: boolean;
  documentId?: string;
  error?: string;
  warning?: string;
  extractedTextLength?: number;
  embeddingGenerated?: boolean;
}

/**
 * Process a candidate's CV from Vincere
 *
 * Downloads the CV, uploads to storage, extracts text, generates embedding,
 * and creates a document record.
 */
export async function processCandidateCV(
  vincereId: number,
  candidateId: string, // Our internal candidate ID
  organizationId: string,
  vincereClient: VincereClient,
  supabase: SupabaseClient
): Promise<CVProcessingResult> {
  try {
    // 1. Get candidate's files from Vincere
    console.log(`    Fetching files for Vincere candidate ${vincereId}...`);
    const files = await getCandidateFiles(vincereId, vincereClient);

    // Find CV file using original_cv flag (correct Vincere schema)
    const cvFile = files.find(f => f.original_cv === true);
    if (!cvFile) {
      return {
        success: false,
        error: 'No CV file found in Vincere',
      };
    }

    // 2. Download the CV (use temporary URL if available)
    console.log(`    Downloading CV: ${cvFile.file_name || cvFile.name || cvFile.original_file_name}...`);
    const fileBuffer = await downloadFile(vincereId, cvFile.id, vincereClient, cvFile.url);

    // 3. Upload to Supabase storage
    const extension = getFileExtension(cvFile);
    const filename = `${vincereId}_cv_${Date.now()}.${extension}`;
    const storagePath = `candidates/${candidateId}/cv/${filename}`;

    console.log(`    Uploading to storage: ${storagePath}...`);
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, Buffer.from(fileBuffer), {
        contentType: cvFile.content_type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        error: `Failed to upload CV to storage: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // 4. Extract text from CV
    let extractedText = '';
    let textExtractionWarning: string | undefined;

    const contentType = cvFile.content_type || '';
    // Use file_name from new schema, with fallbacks to legacy fields
    const originalFilename = cvFile.file_name || cvFile.original_file_name || cvFile.name || '';

    if (isExtractable(contentType, originalFilename)) {
      console.log(`    Extracting text from ${getFileTypeLabel(contentType, originalFilename)}...`);
      const extractionResult = await extractText(fileBuffer, contentType, originalFilename);

      if (extractionResult.error) {
        textExtractionWarning = extractionResult.error;
        console.log(`    ⚠️ Text extraction warning: ${extractionResult.error}`);
      } else {
        extractedText = extractionResult.text;
        if (extractionResult.warning) {
          textExtractionWarning = extractionResult.warning;
        }
        console.log(`    ✓ Extracted ${extractedText.length} characters of text`);
      }
    } else {
      textExtractionWarning = `Cannot extract text from ${getFileTypeLabel(contentType, originalFilename)} files`;
      console.log(`    ⚠️ ${textExtractionWarning}`);
    }

    // 5. Generate embedding if we have extracted text
    let embedding: number[] | null = null;

    if (extractedText.length > 50) {
      console.log(`    Generating embedding...`);
      try {
        // Truncate text if needed to fit embedding model limits
        const textForEmbedding = truncateForEmbedding(extractedText);
        embedding = await generateEmbedding(textForEmbedding);
        console.log(`    ✓ Generated ${embedding.length}-dimension embedding`);
      } catch (embeddingError) {
        console.log(`    ⚠️ Embedding generation failed: ${embeddingError}`);
        // Continue without embedding - we can still store the document
      }
    }

    // 6. Create document record
    console.log(`    Creating document record...`);
    const documentData = {
      entity_type: 'candidate' as const,
      entity_id: candidateId,
      type: 'cv' as const,
      name: cvFile.file_name || cvFile.name || cvFile.original_file_name || 'CV',
      file_url: fileUrl,
      file_path: storagePath,
      file_size: cvFile.size || fileBuffer.byteLength,
      mime_type: contentType || 'application/octet-stream',
      status: 'approved' as const, // Auto-approve synced CVs
      is_latest_version: true,
      organization_id: organizationId,
      extracted_text: extractedText || null,
      embedding: embedding,
      metadata: {
        vincere_file_id: cvFile.id,
        vincere_candidate_id: vincereId,
        original_filename: cvFile.file_name || cvFile.original_file_name,
        extraction_warning: textExtractionWarning,
      },
    };

    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert(documentData)
      .select('id')
      .single();

    if (insertError) {
      return {
        success: false,
        error: `Failed to create document record: ${insertError.message}`,
      };
    }

    // 7. Update candidate with CV reference
    // Note: cv_status must be one of: 'not_uploaded' | 'pending' | 'approved' | 'rejected'
    // Since we're syncing from Vincere (trusted source), mark as 'approved'
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        cv_document_id: document.id,
        cv_url: fileUrl,
        cv_status: 'approved',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (updateError) {
      console.log(`    ⚠️ Failed to update candidate CV reference: ${updateError.message}`);
    }

    return {
      success: true,
      documentId: document.id,
      extractedTextLength: extractedText.length,
      embeddingGenerated: embedding !== null,
      warning: textExtractionWarning,
    };
  } catch (error) {
    console.error('CV processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during CV processing',
    };
  }
}

/**
 * Process candidate's profile photo from Vincere
 */
export async function processCandidatePhoto(
  vincereId: number,
  candidateId: string,
  organizationId: string,
  vincereClient: VincereClient,
  supabase: SupabaseClient
): Promise<{ success: boolean; photoUrl?: string; error?: string }> {
  try {
    // Get candidate's files from Vincere
    const files = await getCandidateFiles(vincereId, vincereClient);

    // Find photo file by extension (Vincere doesn't have a dedicated photo flag)
    const photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const photoFile = files.find(f => {
      const filename = f.file_name || '';
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      return photoExtensions.includes(ext) && !f.original_cv;
    });
    if (!photoFile) {
      return {
        success: false,
        error: 'No photo file found in Vincere',
      };
    }

    // Download the photo (use temporary URL if available)
    const fileBuffer = await downloadFile(vincereId, photoFile.id, vincereClient, photoFile.url);

    // Upload to Supabase storage
    const extension = getFileExtension(photoFile);
    const filename = `${vincereId}_photo_${Date.now()}.${extension}`;
    const storagePath = `candidates/${candidateId}/photo/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(storagePath, Buffer.from(fileBuffer), {
        contentType: photoFile.content_type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        error: `Failed to upload photo: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(storagePath);

    const photoUrl = urlData.publicUrl;

    // Update candidate with photo URL
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        avatar_url: photoUrl,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (updateError) {
      console.log(`  ⚠️ Failed to update candidate photo: ${updateError.message}`);
    }

    return {
      success: true,
      photoUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during photo processing',
    };
  }
}

/**
 * List files available for a candidate in Vincere
 */
export async function listCandidateFiles(
  vincereId: number,
  vincereClient: VincereClient
): Promise<{
  files: VincereFile[];
  hasCV: boolean;
  hasPhoto: boolean;
}> {
  const files = await getCandidateFiles(vincereId, vincereClient);

  // Detect photo by extension
  const photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const hasPhoto = files.some(f => {
    const filename = f.file_name || '';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return photoExtensions.includes(ext) && !f.original_cv;
  });

  return {
    files,
    hasCV: files.some(f => f.original_cv === true),
    hasPhoto,
  };
}
