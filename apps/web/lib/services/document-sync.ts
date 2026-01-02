/**
 * Document Sync Service
 *
 * Syncs ALL documents for a candidate from Vincere, not just CVs.
 * Uses the document classifier to properly categorize files.
 *
 * Processing flow:
 * - CV: Full pipeline (download → extract text → generate embedding → store)
 * - Photo: Upload to avatars bucket → update candidate avatar_url
 * - Other docs: Just store the file (no text extraction, no embedding)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { VincereClient, getCandidateFiles, downloadFile, getFileExtension, VincereFile } from '../vincere';
import {
  classifyDocument,
  ClassificationResult,
  DocumentType,
  summarizeClassifications,
  ClassificationSummary,
} from '../vincere/document-classifier';
import { extractText, truncateForEmbedding, getFileTypeLabel, isExtractable } from './text-extraction';
import { generateEmbedding } from '@lighthouse/ai';

/**
 * Result of processing a single document
 */
export interface DocumentProcessingResult {
  file: VincereFile;
  classification: ClassificationResult;
  success: boolean;
  documentId?: string;
  error?: string;
  warning?: string;
}

/**
 * Result of syncing all documents for a candidate
 */
export interface DocumentSyncResult {
  candidateId: string;
  vincereId: number;
  files: DocumentProcessingResult[];
  summary: ClassificationSummary & {
    successCount: number;
    errorCount: number;
  };
}

/**
 * Sync ALL documents for a candidate from Vincere
 *
 * Classifies each file and processes appropriately:
 * - CV: Full text extraction + embedding
 * - Photo: Upload to avatars bucket
 * - Other: Just store (no text extraction)
 */
export async function syncCandidateDocuments(
  vincereId: number,
  candidateId: string,
  organizationId: string,
  vincereClient: VincereClient,
  supabase: SupabaseClient
): Promise<DocumentSyncResult> {
  const results: DocumentProcessingResult[] = [];

  try {
    // Fetch all files for candidate from Vincere
    console.log(`    Fetching files for candidate ${vincereId}...`);
    const files = await getCandidateFiles(vincereId, vincereClient);

    if (files.length === 0) {
      return {
        candidateId,
        vincereId,
        files: [],
        summary: {
          total: 0,
          byType: {},
          byConfidence: {},
          byMethod: {},
          successCount: 0,
          errorCount: 0,
        },
      };
    }

    console.log(`    Found ${files.length} files to classify and sync`);

    // Classify all files
    const classifications = new Map<number, ClassificationResult>();
    for (const file of files) {
      const classification = classifyDocument(file);
      classifications.set(file.id, classification);
      console.log(
        `      ${file.file_name || 'Unknown'} → ${classification.type} (${classification.confidence}, ${classification.method})`
      );
    }

    // Process each file based on classification
    for (const file of files) {
      const classification = classifications.get(file.id)!;

      try {
        let result: DocumentProcessingResult;

        if (classification.type === 'cv') {
          // Full CV processing: download, extract text, generate embedding
          result = await processCVDocument(
            file,
            classification,
            vincereId,
            candidateId,
            organizationId,
            vincereClient,
            supabase
          );
        } else if (classification.type === 'photo') {
          // Photo processing: upload to avatars bucket
          result = await processPhotoDocument(
            file,
            classification,
            vincereId,
            candidateId,
            vincereClient,
            supabase
          );
        } else {
          // Other documents: just store without text extraction
          result = await processGenericDocument(
            file,
            classification,
            vincereId,
            candidateId,
            organizationId,
            vincereClient,
            supabase
          );
        }

        results.push(result);
      } catch (error) {
        results.push({
          file,
          classification,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Generate summary
    const classificationSummary = summarizeClassifications(classifications);
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return {
      candidateId,
      vincereId,
      files: results,
      summary: {
        ...classificationSummary,
        successCount,
        errorCount,
      },
    };
  } catch (error) {
    console.error(`    Error syncing documents for candidate ${vincereId}:`, error);
    return {
      candidateId,
      vincereId,
      files: results,
      summary: {
        total: 0,
        byType: {},
        byConfidence: {},
        byMethod: {},
        successCount: 0,
        errorCount: 1,
      },
    };
  }
}

/**
 * Process a CV document with full text extraction and embedding
 */
async function processCVDocument(
  file: VincereFile,
  classification: ClassificationResult,
  vincereId: number,
  candidateId: string,
  organizationId: string,
  vincereClient: VincereClient,
  supabase: SupabaseClient
): Promise<DocumentProcessingResult> {
  try {
    // Download the file
    console.log(`      Downloading CV: ${file.file_name}...`);
    const fileBuffer = await downloadFile(vincereId, file.id, vincereClient, file.url);

    // Upload to storage
    const ext = getFileExtension(file);
    const storagePath = `candidates/${candidateId}/cv/${file.id}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, Buffer.from(fileBuffer), {
        contentType: file.content_type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      return {
        file,
        classification,
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    // Extract text
    let extractedText = '';
    let textWarning: string | undefined;
    const contentType = file.content_type || '';
    const originalFilename = file.file_name || '';

    if (isExtractable(contentType, originalFilename)) {
      console.log(`      Extracting text from CV...`);
      const extractionResult = await extractText(fileBuffer, contentType, originalFilename);

      if (extractionResult.error) {
        textWarning = extractionResult.error;
        console.log(`      Warning: ${extractionResult.error}`);
      } else {
        extractedText = extractionResult.text;
        if (extractionResult.warning) {
          textWarning = extractionResult.warning;
        }
        console.log(`      Extracted ${extractedText.length} characters`);
      }
    }

    // Generate embedding if we have text
    let embedding: number[] | null = null;
    if (extractedText.length > 50) {
      console.log(`      Generating embedding...`);
      try {
        const textForEmbedding = truncateForEmbedding(extractedText);
        embedding = await generateEmbedding(textForEmbedding);
        console.log(`      Generated ${embedding.length}-dimension embedding`);
      } catch (embeddingError) {
        console.log(`      Warning: Embedding generation failed`);
      }
    }

    // Create document record
    const { data: doc, error: insertError } = await supabase
      .from('documents')
      .insert({
        entity_type: 'candidate',
        entity_id: candidateId,
        type: 'cv',
        name: file.file_name || 'CV',
        file_url: fileUrl,
        file_path: storagePath,
        file_size: file.size || fileBuffer.byteLength,
        mime_type: contentType || 'application/octet-stream',
        status: 'approved',
        is_latest_version: true,
        organization_id: organizationId,
        extracted_text: extractedText || null,
        embedding: embedding,
        expiry_date: file.expiry_date || null,
        metadata: {
          vincere_file_id: file.id,
          vincere_candidate_id: vincereId,
          original_filename: file.file_name,
          classification_confidence: classification.confidence,
          classification_method: classification.method,
          extraction_warning: textWarning,
          issued_date: file.issued_date,
        },
      })
      .select('id')
      .single();

    if (insertError) {
      return {
        file,
        classification,
        success: false,
        error: `Insert failed: ${insertError.message}`,
      };
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

    return {
      file,
      classification,
      success: true,
      documentId: doc.id,
      warning: textWarning,
    };
  } catch (error) {
    return {
      file,
      classification,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process a photo document - upload to avatars bucket
 */
async function processPhotoDocument(
  file: VincereFile,
  classification: ClassificationResult,
  vincereId: number,
  candidateId: string,
  vincereClient: VincereClient,
  supabase: SupabaseClient
): Promise<DocumentProcessingResult> {
  try {
    // Download the photo
    console.log(`      Downloading photo: ${file.file_name}...`);
    const fileBuffer = await downloadFile(vincereId, file.id, vincereClient, file.url);

    // Upload to avatars bucket
    const ext = getFileExtension(file);
    const storagePath = `candidates/${candidateId}/photo/${file.id}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(storagePath, Buffer.from(fileBuffer), {
        contentType: file.content_type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return {
        file,
        classification,
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
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

    return {
      file,
      classification,
      success: true,
    };
  } catch (error) {
    return {
      file,
      classification,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process a generic document - just store without text extraction
 * Used for certifications, passports, visas, medical docs, references, contracts, etc.
 */
async function processGenericDocument(
  file: VincereFile,
  classification: ClassificationResult,
  vincereId: number,
  candidateId: string,
  organizationId: string,
  vincereClient: VincereClient,
  supabase: SupabaseClient
): Promise<DocumentProcessingResult> {
  try {
    // Download the file
    console.log(`      Downloading ${classification.type}: ${file.file_name}...`);
    const fileBuffer = await downloadFile(vincereId, file.id, vincereClient, file.url);

    // Upload to storage
    const ext = getFileExtension(file);
    const storagePath = `candidates/${candidateId}/${classification.type}/${file.id}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, Buffer.from(fileBuffer), {
        contentType: file.content_type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      return {
        file,
        classification,
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    // Create document record (NO text extraction, NO embedding)
    const { data: doc, error: insertError } = await supabase
      .from('documents')
      .insert({
        entity_type: 'candidate',
        entity_id: candidateId,
        type: classification.type,
        name: file.file_name || `${classification.type}_document`,
        file_url: fileUrl,
        file_path: storagePath,
        file_size: file.size || fileBuffer.byteLength,
        mime_type: file.content_type || 'application/octet-stream',
        status: 'approved',
        is_latest_version: true,
        organization_id: organizationId,
        expiry_date: file.expiry_date || null,
        metadata: {
          vincere_file_id: file.id,
          vincere_candidate_id: vincereId,
          original_filename: file.file_name,
          classification_confidence: classification.confidence,
          classification_method: classification.method,
          matched_pattern: classification.matchedPattern,
          issued_date: file.issued_date,
        },
      })
      .select('id')
      .single();

    if (insertError) {
      return {
        file,
        classification,
        success: false,
        error: `Insert failed: ${insertError.message}`,
      };
    }

    return {
      file,
      classification,
      success: true,
      documentId: doc.id,
    };
  } catch (error) {
    return {
      file,
      classification,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Print a summary of the sync results
 */
export function printSyncSummary(result: DocumentSyncResult): void {
  console.log(`\n    Document Sync Summary for candidate ${result.vincereId}:`);
  console.log(`      Total files: ${result.summary.total}`);
  console.log(`      Successful: ${result.summary.successCount}`);
  console.log(`      Errors: ${result.summary.errorCount}`);
  console.log(`      By type:`);

  const types: DocumentType[] = [
    'cv',
    'certification',
    'medical',
    'passport',
    'visa',
    'reference',
    'contract',
    'photo',
    'other',
  ];

  for (const type of types) {
    const count = result.summary.byType[type] || 0;
    if (count > 0) {
      console.log(`        - ${type}: ${count}`);
    }
  }
}
