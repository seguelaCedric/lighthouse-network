#!/usr/bin/env npx tsx
// ============================================================================
// CV TEXT EXTRACTION SCRIPT
// ============================================================================
// Downloads CV PDFs from storage and extracts text content.
// This is a prerequisite for CV data extraction and embedding.
//
// Usage:
//   npx tsx scripts/extract-cv-text.ts --limit=200
//   npx tsx scripts/extract-cv-text.ts --limit=50 --concurrency=5
//   npx tsx scripts/extract-cv-text.ts --dry-run
//
// Environment variables required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { extractText } from '../lib/services/text-extraction';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg?.split('=')[1];
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const CONFIG = {
  limit: parseInt(getArg('limit') || '200', 10),
  concurrency: parseInt(getArg('concurrency') || '3', 10),
  dryRun: hasFlag('dry-run'),
  verbose: hasFlag('verbose'),
};

// ----------------------------------------------------------------------------
// SUPABASE CLIENT
// ----------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function logError(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
  if (error && CONFIG.verbose) {
    console.error(error);
  }
}

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface CVDocument {
  id: string;
  name: string;
  file_url: string;
  entity_id: string;
}

interface ProcessResult {
  doc_id: string;
  doc_name: string;
  success: boolean;
  text_length: number;
  error?: string;
}

// ----------------------------------------------------------------------------
// GET CV DOCUMENTS NEEDING TEXT EXTRACTION
// ----------------------------------------------------------------------------

async function getCVDocumentsNeedingExtraction(): Promise<CVDocument[]> {
  log(`Fetching CV documents needing text extraction (limit: ${CONFIG.limit})...`);

  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, name, file_url, entity_id')
    .eq('type', 'cv')
    .eq('entity_type', 'candidate')
    .or('extracted_text.is.null,extracted_text.eq.')
    .not('file_url', 'is', null)
    .limit(CONFIG.limit);

  if (error) {
    logError('Failed to fetch documents', error);
    return [];
  }

  log(`Found ${docs?.length || 0} CV documents needing text extraction`);
  return docs || [];
}

// ----------------------------------------------------------------------------
// DOWNLOAD AND EXTRACT TEXT
// ----------------------------------------------------------------------------

function extractStoragePath(fileUrl: string): { bucket: string; path: string } | null {
  // Extract bucket and path from Supabase storage URL
  // Format: https://xxx.supabase.co/storage/v1/object/public/BUCKET/PATH (public)
  //      or https://xxx.supabase.co/storage/v1/object/BUCKET/PATH (private)
  const publicMatch = fileUrl.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (publicMatch) {
    return { bucket: publicMatch[1], path: decodeURIComponent(publicMatch[2]) };
  }
  const privateMatch = fileUrl.match(/storage\/v1\/object\/([^/]+)\/(.+)$/);
  if (privateMatch) {
    return { bucket: privateMatch[1], path: decodeURIComponent(privateMatch[2]) };
  }
  return null;
}

async function downloadAndExtractText(doc: CVDocument): Promise<ProcessResult> {
  const result: ProcessResult = {
    doc_id: doc.id,
    doc_name: doc.name,
    success: false,
    text_length: 0,
  };

  try {
    if (CONFIG.dryRun) {
      log(`[DRY RUN] Would process: ${doc.name}`);
      result.success = true;
      return result;
    }

    // Extract storage path from URL
    const storagePath = extractStoragePath(doc.file_url);
    if (!storagePath) {
      throw new Error(`Invalid storage URL format: ${doc.file_url}`);
    }

    // Download using Supabase storage client (handles auth for private buckets)
    log(`  Downloading: ${doc.name}`);
    const { data, error: downloadError } = await supabase.storage
      .from(storagePath.bucket)
      .download(storagePath.path);

    if (downloadError || !data) {
      throw new Error(`Storage download failed: ${downloadError?.message || 'No data returned'}`);
    }

    const buffer = await data.arrayBuffer();
    const contentType = data.type || 'application/pdf';

    // Extract text
    log(`  Extracting text from: ${doc.name}`);
    const extraction = await extractText(buffer, contentType, doc.name);

    if (extraction.error) {
      throw new Error(extraction.error);
    }

    if (!extraction.text || extraction.text.length < 50) {
      throw new Error(`Insufficient text extracted (${extraction.text?.length || 0} chars)`);
    }

    // Update document with extracted text
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: extraction.text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id);

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    result.success = true;
    result.text_length = extraction.text.length;
    log(`  ✓ Extracted ${extraction.text.length} chars from ${doc.name}`);

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logError(`  ✗ Failed: ${doc.name} - ${result.error}`);
  }

  return result;
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('CV TEXT EXTRACTION');
  console.log('========================================');
  console.log(`Config: limit=${CONFIG.limit}, concurrency=${CONFIG.concurrency}`);
  if (CONFIG.dryRun) console.log('MODE: DRY RUN');
  console.log('========================================\n');

  const startTime = Date.now();

  // Get documents to process
  const documents = await getCVDocumentsNeedingExtraction();

  if (documents.length === 0) {
    log('No CV documents need text extraction. Done!');
    return;
  }

  // Process in batches
  const results: ProcessResult[] = [];

  for (let i = 0; i < documents.length; i += CONFIG.concurrency) {
    const batch = documents.slice(i, i + CONFIG.concurrency);
    const batchNum = Math.floor(i / CONFIG.concurrency) + 1;
    const totalBatches = Math.ceil(documents.length / CONFIG.concurrency);

    log(`\n--- Batch ${batchNum}/${totalBatches} ---`);

    const batchResults = await Promise.all(batch.map(downloadAndExtractText));
    results.push(...batchResults);

    // Progress
    const progress = Math.round(((i + batch.length) / documents.length) * 100);
    const successCount = results.filter((r) => r.success).length;
    log(`Progress: ${progress}% | Success: ${successCount}/${results.length}`);

    // Small delay between batches
    if (i + CONFIG.concurrency < documents.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Summary
  const totalTime = Date.now() - startTime;
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalChars = successful.reduce((sum, r) => sum + r.text_length, 0);

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total processed: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total text extracted: ${totalChars.toLocaleString()} chars`);
  console.log(`Total time: ${Math.round(totalTime / 1000)}s`);
  console.log('========================================\n');

  if (failed.length > 0 && failed.length <= 20) {
    console.log('Failed documents:');
    failed.forEach((r) => {
      console.log(`  - ${r.doc_name}: ${r.error}`);
    });
    console.log('');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
