#!/usr/bin/env npx tsx
// ============================================================================
// TEST BATCH: 200 CANDIDATES END-TO-END
// ============================================================================
// This script runs the full pipeline on 200 candidates from Bubble CVs:
// 1. Import CVs from Bubble CSV
// 2. Extract text from PDFs
// 3. Run AI CV extraction
// 4. Generate embeddings
// 5. Output verification report with names for manual checking
//
// Usage:
//   npx tsx scripts/test-batch-200.ts
//   npx tsx scripts/test-batch-200.ts --dry-run
//   npx tsx scripts/test-batch-200.ts --skip-import  # Skip if already imported
//   npx tsx scripts/test-batch-200.ts --report-only  # Just generate report
//
// Environment variables required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OPENAI_API_KEY
// ============================================================================

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import {
  extractFromCV,
  buildSearchKeywords,
  generateEmbedding,
  buildUnifiedCandidateEmbeddingText,
} from '@lighthouse/ai';
import { extractText } from '../lib/services/text-extraction';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const BATCH_SIZE = 200;
const CHECKPOINT_FILE = path.resolve(__dirname, '.test-batch-200-checkpoint.json');
const REPORT_FILE = path.resolve(__dirname, '.test-batch-200-report.json');

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const CONFIG = {
  dryRun: hasFlag('dry-run'),
  skipImport: hasFlag('skip-import'),
  reportOnly: hasFlag('report-only'),
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

if (!process.env.OPENAI_API_KEY && !CONFIG.reportOnly) {
  console.error('Missing OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface Checkpoint {
  phase: 'import' | 'text_extract' | 'cv_extract' | 'embedding' | 'complete';
  processedEmails: string[];
  importedCount: number;
  textExtractedCount: number;
  cvExtractedCount: number;
  embeddedCount: number;
  errors: Array<{ email: string; phase: string; error: string }>;
  startedAt: string;
  updatedAt: string;
}

interface CandidateReport {
  email: string;
  name: string;
  candidateId: string;
  documentId?: string;
  cvImported: boolean;
  textExtracted: boolean;
  textLength?: number;
  cvExtracted: boolean;
  extractionConfidence?: number;
  primaryPosition?: string;
  positionCategory?: string;
  yearsExperience?: number;
  positionsCount?: number;
  certificationsCount?: number;
  yachtExperienceCount?: number;
  hasEmbedding: boolean;
  embeddingTextLength?: number;
  errors: string[];
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function logError(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
}

function loadCheckpoint(): Checkpoint {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
  }
  return {
    phase: 'import',
    processedEmails: [],
    importedCount: 0,
    textExtractedCount: 0,
    cvExtractedCount: 0,
    embeddedCount: 0,
    errors: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  checkpoint.updatedAt = new Date().toISOString();
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

// ----------------------------------------------------------------------------
// STEP 1: IMPORT CVs FROM BUBBLE CSV
// ----------------------------------------------------------------------------

interface BubbleCV {
  email: string;
  url: string;
  fileName: string;
}

function loadBubbleCVs(): BubbleCV[] {
  const csvPath = path.resolve(__dirname, 'data/bubble-cvs-only.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const cvs: BubbleCV[] = [];
  for (const record of records) {
    const email = record['Candidate']?.trim();
    let url = record['Document File']?.trim();

    if (!email || !url) continue;

    // Normalize URL
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }

    // Skip expired S3 URLs
    if (url.includes('s3.eu-central-1.amazonaws.com')) continue;

    cvs.push({
      email,
      url,
      fileName: url.split('/').pop()?.split('?')[0] || `cv_${Date.now()}.pdf`,
    });
  }

  return cvs.slice(0, BATCH_SIZE);
}

async function importCVsFromBubble(checkpoint: Checkpoint): Promise<string[]> {
  log('=== STEP 1: Import CVs from Bubble ===');

  const cvs = loadBubbleCVs();
  log(`Loaded ${cvs.length} CVs from Bubble CSV`);

  const importedEmails: string[] = [];

  for (let i = 0; i < cvs.length; i++) {
    const cv = cvs[i];

    if (checkpoint.processedEmails.includes(cv.email)) {
      importedEmails.push(cv.email);
      continue;
    }

    try {
      // Find candidate by email
      const { data: candidate } = await supabase
        .from('candidates')
        .select('id, first_name, last_name')
        .ilike('email', cv.email)
        .is('deleted_at', null)
        .single();

      if (!candidate) {
        checkpoint.errors.push({ email: cv.email, phase: 'import', error: 'Candidate not found' });
        continue;
      }

      if (CONFIG.dryRun) {
        log(`[DRY RUN] Would import CV for ${candidate.first_name} ${candidate.last_name}`);
        importedEmails.push(cv.email);
        continue;
      }

      // Download CV
      const response = await fetch(cv.url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'application/pdf';

      // Sanitize filename - remove special chars that cause storage issues
      const sanitizedFileName = cv.fileName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9._-]/g, '_'); // Replace special chars with underscore

      // Upload to Supabase Storage
      const storagePath = `${candidate.id}/cv/${sanitizedFileName}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, { contentType, upsert: true });

      if (uploadError && !uploadError.message.includes('already exists')) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create document record - first check if exists
      const fileUrl = `${supabaseUrl}/storage/v1/object/public/documents/${storagePath}`;

      // Check if document already exists for this candidate
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('id')
        .eq('entity_type', 'candidate')
        .eq('entity_id', candidate.id)
        .eq('type', 'cv')
        .single();

      if (!existingDoc) {
        const { error: dbError } = await supabase.from('documents').insert({
          entity_type: 'candidate',
          entity_id: candidate.id,
          type: 'cv',
          name: cv.fileName,
          file_url: fileUrl,
          file_path: storagePath,
          file_size: buffer.length,
          mime_type: contentType,
          status: 'approved',
          is_latest_version: true,
          version: 1,
          metadata: { source: 'bubble_test_batch' },
        });

        if (dbError) {
          throw new Error(`DB insert failed: ${dbError.message}`);
        }
      }

      importedEmails.push(cv.email);
      checkpoint.importedCount++;
      checkpoint.processedEmails.push(cv.email);

      if ((i + 1) % 20 === 0) {
        log(`  Progress: ${i + 1}/${cvs.length} imported`);
        saveCheckpoint(checkpoint);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      checkpoint.errors.push({ email: cv.email, phase: 'import', error: msg });
      logError(`  Failed ${cv.email}: ${msg}`);
    }
  }

  checkpoint.phase = 'text_extract';
  saveCheckpoint(checkpoint);

  log(`  Imported ${checkpoint.importedCount} CVs`);
  return importedEmails;
}

// ----------------------------------------------------------------------------
// STEP 2: EXTRACT TEXT FROM PDFs
// ----------------------------------------------------------------------------

async function extractTextFromCVs(emails: string[], checkpoint: Checkpoint): Promise<void> {
  log('=== STEP 2: Extract text from PDFs ===');

  // Get documents needing text extraction
  const { data: docs } = await supabase
    .from('documents')
    .select(`
      id, name, file_url, entity_id,
      candidates!inner(email)
    `)
    .eq('type', 'cv')
    .eq('entity_type', 'candidate')
    .or('extracted_text.is.null,extracted_text.eq.')
    .not('file_url', 'is', null);

  if (!docs || docs.length === 0) {
    log('  No documents need text extraction');
    checkpoint.phase = 'cv_extract';
    saveCheckpoint(checkpoint);
    return;
  }

  // Filter to our batch emails
  const emailSet = new Set(emails.map((e) => e.toLowerCase()));
  const docsToProcess = docs.filter((d) => {
    const email = (d.candidates as any)?.email?.toLowerCase();
    return email && emailSet.has(email);
  });

  log(`  Found ${docsToProcess.length} documents needing text extraction`);

  for (let i = 0; i < docsToProcess.length; i++) {
    const doc = docsToProcess[i];
    const email = (doc.candidates as any)?.email;

    try {
      if (CONFIG.dryRun) {
        log(`[DRY RUN] Would extract text from ${doc.name}`);
        checkpoint.textExtractedCount++;
        continue;
      }

      // Extract storage path
      const match = doc.file_url.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (!match) {
        throw new Error('Invalid storage URL');
      }

      const { data, error: downloadError } = await supabase.storage
        .from(match[1])
        .download(decodeURIComponent(match[2]));

      if (downloadError || !data) {
        throw new Error(`Download failed: ${downloadError?.message}`);
      }

      const buffer = await data.arrayBuffer();
      const extraction = await extractText(buffer, data.type || 'application/pdf', doc.name);

      if (extraction.error || !extraction.text || extraction.text.length < 50) {
        throw new Error(extraction.error || 'Insufficient text extracted');
      }

      await supabase
        .from('documents')
        .update({ extracted_text: extraction.text })
        .eq('id', doc.id);

      checkpoint.textExtractedCount++;

      if ((i + 1) % 20 === 0) {
        log(`  Progress: ${i + 1}/${docsToProcess.length} extracted`);
        saveCheckpoint(checkpoint);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      checkpoint.errors.push({ email, phase: 'text_extract', error: msg });
    }
  }

  checkpoint.phase = 'cv_extract';
  saveCheckpoint(checkpoint);
  log(`  Extracted text from ${checkpoint.textExtractedCount} documents`);
}

// ----------------------------------------------------------------------------
// STEP 3: CV DATA EXTRACTION
// ----------------------------------------------------------------------------

async function extractCVData(emails: string[], checkpoint: Checkpoint): Promise<void> {
  log('=== STEP 3: AI CV Data Extraction ===');

  const emailSet = new Set(emails.map((e) => e.toLowerCase()));

  // Get candidates with CVs but no extraction
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, email, first_name, last_name')
    .is('cv_extracted_at', null)
    .is('deleted_at', null);

  if (!candidates) {
    log('  No candidates found');
    checkpoint.phase = 'embedding';
    saveCheckpoint(checkpoint);
    return;
  }

  const candidatesToProcess = candidates.filter((c) => emailSet.has(c.email?.toLowerCase()));
  log(`  Found ${candidatesToProcess.length} candidates needing CV extraction`);

  for (let i = 0; i < candidatesToProcess.length; i++) {
    const candidate = candidatesToProcess[i];

    try {
      // Get best CV document
      const { data: docs } = await supabase
        .from('documents')
        .select('id, name, extracted_text')
        .eq('entity_type', 'candidate')
        .eq('entity_id', candidate.id)
        .eq('type', 'cv')
        .not('extracted_text', 'is', null);

      const validDocs = (docs || []).filter(
        (d) => d.extracted_text && d.extracted_text.length >= 100 && !d.name?.toLowerCase().includes('logo')
      );

      if (validDocs.length === 0) {
        checkpoint.errors.push({ email: candidate.email, phase: 'cv_extract', error: 'No valid CV text' });
        continue;
      }

      validDocs.sort((a, b) => (b.extracted_text?.length || 0) - (a.extracted_text?.length || 0));
      const cvText = validDocs[0].extracted_text!;

      if (CONFIG.dryRun) {
        log(`[DRY RUN] Would extract CV for ${candidate.first_name} ${candidate.last_name}`);
        checkpoint.cvExtractedCount++;
        continue;
      }

      // Extract structured data
      const extraction = await extractFromCV(cvText);
      const searchKeywords = buildSearchKeywords(extraction);

      // Update candidate
      await supabase
        .from('candidates')
        .update({
          years_experience: extraction.years_experience ? Math.round(extraction.years_experience) : null,
          primary_position: extraction.primary_position,
          position_category: extraction.position_category || 'other',
          highest_license: extraction.highest_license,
          has_stcw: extraction.has_stcw,
          has_eng1: extraction.has_eng1,
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
          cv_extracted_at: new Date().toISOString(),
          cv_extraction_version: 1,
          extraction_confidence: extraction.extraction_confidence,
          extraction_notes: extraction.extraction_notes,
          search_keywords: searchKeywords,
        })
        .eq('id', candidate.id);

      checkpoint.cvExtractedCount++;

      if ((i + 1) % 10 === 0) {
        log(`  Progress: ${i + 1}/${candidatesToProcess.length} extracted`);
        saveCheckpoint(checkpoint);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      checkpoint.errors.push({ email: candidate.email, phase: 'cv_extract', error: msg });
      logError(`  Failed ${candidate.email}: ${msg}`);
    }
  }

  checkpoint.phase = 'embedding';
  saveCheckpoint(checkpoint);
  log(`  Extracted CV data for ${checkpoint.cvExtractedCount} candidates`);
}

// ----------------------------------------------------------------------------
// STEP 4: GENERATE EMBEDDINGS
// ----------------------------------------------------------------------------

async function generateEmbeddings(emails: string[], checkpoint: Checkpoint): Promise<void> {
  log('=== STEP 4: Generate Embeddings ===');

  const emailSet = new Set(emails.map((e) => e.toLowerCase()));

  // Get candidates without embeddings
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, email, first_name, last_name')
    .is('embedding', null)
    .is('deleted_at', null);

  if (!candidates) {
    log('  No candidates found');
    checkpoint.phase = 'complete';
    saveCheckpoint(checkpoint);
    return;
  }

  const candidatesToProcess = candidates.filter((c) => emailSet.has(c.email?.toLowerCase()));
  log(`  Found ${candidatesToProcess.length} candidates needing embeddings`);

  for (let i = 0; i < candidatesToProcess.length; i++) {
    const candidate = candidatesToProcess[i];

    try {
      if (CONFIG.dryRun) {
        log(`[DRY RUN] Would generate embedding for ${candidate.first_name} ${candidate.last_name}`);
        checkpoint.embeddedCount++;
        continue;
      }

      // Fetch full candidate data
      const { data: candidateData } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidate.id)
        .single();

      if (!candidateData) continue;

      // Fetch documents
      const { data: documents } = await supabase
        .from('documents')
        .select('type, name, extracted_text, visibility')
        .eq('entity_type', 'candidate')
        .eq('entity_id', candidate.id)
        .eq('is_latest_version', true);

      // Build profile for embedding
      const profile = {
        first_name: candidateData.first_name,
        last_name: candidateData.last_name,
        primary_position: candidateData.primary_position,
        secondary_positions: candidateData.secondary_positions,
        years_experience: candidateData.years_experience,
        nationality: candidateData.nationality,
        current_location: candidateData.current_location,
        has_stcw: candidateData.has_stcw,
        has_eng1: candidateData.has_eng1,
        highest_license: candidateData.highest_license,
        has_schengen: candidateData.has_schengen,
        has_b1b2: candidateData.has_b1b2,
        search_keywords: candidateData.search_keywords,
      };

      const embeddingText = buildUnifiedCandidateEmbeddingText(
        profile as any,
        (documents || []) as any,
        [],
        [],
        'recruiter'
      );

      if (embeddingText.length < 50) {
        checkpoint.errors.push({ email: candidate.email, phase: 'embedding', error: 'Insufficient text' });
        continue;
      }

      const embedding = await generateEmbedding(embeddingText);

      await supabase
        .from('candidates')
        .update({
          embedding,
          embedding_text: embeddingText.substring(0, 10000),
          embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', candidate.id);

      checkpoint.embeddedCount++;

      if ((i + 1) % 10 === 0) {
        log(`  Progress: ${i + 1}/${candidatesToProcess.length} embedded`);
        saveCheckpoint(checkpoint);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      checkpoint.errors.push({ email: candidate.email, phase: 'embedding', error: msg });
      logError(`  Failed ${candidate.email}: ${msg}`);
    }
  }

  checkpoint.phase = 'complete';
  saveCheckpoint(checkpoint);
  log(`  Generated embeddings for ${checkpoint.embeddedCount} candidates`);
}

// ----------------------------------------------------------------------------
// STEP 5: GENERATE VERIFICATION REPORT
// ----------------------------------------------------------------------------

async function generateReport(emails: string[]): Promise<CandidateReport[]> {
  log('=== STEP 5: Generate Verification Report ===');

  const reports: CandidateReport[] = [];
  const emailSet = new Set(emails.map((e) => e.toLowerCase()));

  // Get all candidates for our batch
  const { data: candidates } = await supabase
    .from('candidates')
    .select(`
      id, email, first_name, last_name,
      primary_position, position_category, years_experience,
      positions_held, certifications_extracted, yacht_experience_extracted,
      cv_extracted_at, extraction_confidence,
      embedding, embedding_text
    `)
    .is('deleted_at', null);

  if (!candidates) {
    log('  No candidates found');
    return [];
  }

  const batchCandidates = candidates.filter((c) => emailSet.has(c.email?.toLowerCase()));

  for (const candidate of batchCandidates) {
    // Get CV document
    const { data: docs } = await supabase
      .from('documents')
      .select('id, extracted_text')
      .eq('entity_type', 'candidate')
      .eq('entity_id', candidate.id)
      .eq('type', 'cv')
      .limit(1);

    const doc = docs?.[0];

    const report: CandidateReport = {
      email: candidate.email,
      name: `${candidate.first_name} ${candidate.last_name}`,
      candidateId: candidate.id,
      documentId: doc?.id,
      cvImported: !!doc,
      textExtracted: !!(doc?.extracted_text && doc.extracted_text.length > 0),
      textLength: doc?.extracted_text?.length,
      cvExtracted: !!candidate.cv_extracted_at,
      extractionConfidence: candidate.extraction_confidence,
      primaryPosition: candidate.primary_position,
      positionCategory: candidate.position_category,
      yearsExperience: candidate.years_experience,
      positionsCount: candidate.positions_held?.length || 0,
      certificationsCount: candidate.certifications_extracted?.length || 0,
      yachtExperienceCount: candidate.yacht_experience_extracted?.length || 0,
      hasEmbedding: !!candidate.embedding,
      embeddingTextLength: candidate.embedding_text?.length,
      errors: [],
    };

    reports.push(report);
  }

  // Save full report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(reports, null, 2));

  return reports;
}

function printReport(reports: CandidateReport[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION REPORT - 200 CANDIDATE TEST BATCH');
  console.log('='.repeat(80));

  // Summary stats
  const cvImported = reports.filter((r) => r.cvImported).length;
  const textExtracted = reports.filter((r) => r.textExtracted).length;
  const cvExtracted = reports.filter((r) => r.cvExtracted).length;
  const hasEmbedding = reports.filter((r) => r.hasEmbedding).length;

  console.log('\nSUMMARY:');
  console.log(`  Total candidates: ${reports.length}`);
  console.log(`  CV imported: ${cvImported} (${Math.round((cvImported / reports.length) * 100)}%)`);
  console.log(`  Text extracted: ${textExtracted} (${Math.round((textExtracted / reports.length) * 100)}%)`);
  console.log(`  CV data extracted: ${cvExtracted} (${Math.round((cvExtracted / reports.length) * 100)}%)`);
  console.log(`  Has embedding: ${hasEmbedding} (${Math.round((hasEmbedding / reports.length) * 100)}%)`);

  // Position category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const r of reports) {
    if (r.positionCategory) {
      categoryBreakdown[r.positionCategory] = (categoryBreakdown[r.positionCategory] || 0) + 1;
    }
  }

  console.log('\nPOSITION CATEGORIES:');
  for (const [cat, count] of Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  // Print first 50 candidates for manual verification
  console.log('\n' + '-'.repeat(80));
  console.log('SAMPLE CANDIDATES (first 50 for manual verification):');
  console.log('-'.repeat(80));
  console.log(
    'Name'.padEnd(30) +
      'Position'.padEnd(25) +
      'Yrs'.padEnd(5) +
      'Cat'.padEnd(12) +
      'CV'.padEnd(4) +
      'Txt'.padEnd(5) +
      'Ext'.padEnd(5) +
      'Emb'
  );
  console.log('-'.repeat(80));

  for (const r of reports.slice(0, 50)) {
    const name = r.name.substring(0, 28).padEnd(30);
    const position = (r.primaryPosition || '-').substring(0, 23).padEnd(25);
    const years = (r.yearsExperience?.toString() || '-').padEnd(5);
    const category = (r.positionCategory || '-').substring(0, 10).padEnd(12);
    const cv = r.cvImported ? '✓' : '✗';
    const txt = r.textExtracted ? '✓' : '✗';
    const ext = r.cvExtracted ? '✓' : '✗';
    const emb = r.hasEmbedding ? '✓' : '✗';

    console.log(`${name}${position}${years}${category}${cv.padEnd(4)}${txt.padEnd(5)}${ext.padEnd(5)}${emb}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Full report saved to: ${REPORT_FILE}`);
  console.log('='.repeat(80) + '\n');
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('TEST BATCH: 200 CANDIDATES END-TO-END');
  console.log('='.repeat(60));
  if (CONFIG.dryRun) console.log('MODE: DRY RUN');
  if (CONFIG.skipImport) console.log('MODE: SKIP IMPORT');
  if (CONFIG.reportOnly) console.log('MODE: REPORT ONLY');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();
  let checkpoint = loadCheckpoint();

  // Load emails from CSV
  const csvEmails = loadBubbleCVs().map((cv) => cv.email);
  log(`Loaded ${csvEmails.length} emails from Bubble CSV`);

  if (CONFIG.reportOnly) {
    const reports = await generateReport(csvEmails);
    printReport(reports);
    return;
  }

  // STEP 1: Import CVs
  let processedEmails: string[];
  if (CONFIG.skipImport || checkpoint.phase !== 'import') {
    processedEmails = csvEmails;
    log('Skipping import phase');
  } else {
    processedEmails = await importCVsFromBubble(checkpoint);
  }

  // STEP 2: Extract text
  if (checkpoint.phase === 'text_extract' || checkpoint.phase === 'import') {
    await extractTextFromCVs(processedEmails, checkpoint);
  }

  // STEP 3: CV data extraction
  if (checkpoint.phase === 'cv_extract' || checkpoint.phase === 'text_extract') {
    await extractCVData(processedEmails, checkpoint);
  }

  // STEP 4: Generate embeddings
  if (checkpoint.phase === 'embedding' || checkpoint.phase === 'cv_extract') {
    await generateEmbeddings(processedEmails, checkpoint);
  }

  // STEP 5: Generate report
  const reports = await generateReport(processedEmails);
  printReport(reports);

  // Final summary
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\nTotal time: ${totalTime}s`);
  console.log(`Errors: ${checkpoint.errors.length}`);

  if (checkpoint.errors.length > 0 && checkpoint.errors.length <= 20) {
    console.log('\nErrors:');
    for (const err of checkpoint.errors) {
      console.log(`  [${err.phase}] ${err.email}: ${err.error}`);
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
