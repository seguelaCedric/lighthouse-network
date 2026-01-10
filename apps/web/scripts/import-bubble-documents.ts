/**
 * Bubble Documents Import Script
 *
 * Imports candidate documents from Bubble CSV export into Supabase Storage,
 * linking them to existing candidates by email.
 *
 * Run: cd apps/web && npx tsx scripts/import-bubble-documents.ts
 *
 * Options:
 *   --documents=<path>    Path to Bubble documents CSV (default: ./scripts/data/bubble-documents.csv)
 *   --dry-run             Validate without importing
 *   --resume              Resume from last checkpoint
 *   --reset               Reset checkpoint and start fresh
 *   --limit=N             Process only first N documents
 *   --verbose             Show detailed logging
 *
 * Environment variables (from .env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import { createReadStream } from "fs";
import { resolve } from "path";
import { parse } from "csv-parse";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// ENV LOADING
// ============================================================================

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"),
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

// ============================================================================
// CLI ARGUMENTS
// ============================================================================

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : undefined;
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const documentsCsvPath = getArg("documents") || resolve(__dirname, "data/bubble-documents.csv");
const dryRun = hasFlag("dry-run");
const shouldResume = hasFlag("resume");
const shouldReset = hasFlag("reset");
const verbose = hasFlag("verbose");
const cvOnly = hasFlag("cv-only");
const concurrency = getArg("concurrency") ? parseInt(getArg("concurrency")!, 10) : 1;
const limit = getArg("limit") ? parseInt(getArg("limit")!, 10) : undefined;

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001"; // Lighthouse Careers
const CHECKPOINT_FILE = resolve(__dirname, ".bubble-docs-checkpoint.json");
const ERROR_LOG_FILE = resolve(__dirname, ".bubble-docs-errors.json");
const CHECKPOINT_INTERVAL = 50; // Save checkpoint every N documents
const REQUEST_TIMEOUT = 60000; // 60s timeout for downloads

// Document type mapping - maps Bubble types to normalized categories
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  // CV/Resume
  "cv/resume": "cv",
  "cv": "cv",
  "resume": "cv",
  "cover letter": "cv",

  // ID/Passport
  "passport/id": "id",
  "passport": "id",
  "id": "id",
  "seaman's discharge book": "id",

  // Medical
  "medical certificate": "medical",
  "eng1": "medical",
  "eng 1": "medical",
  "covid19 vaccine": "medical",

  // STCW certificates
  "stcw": "stcw",
  "stcw first aid": "stcw",
  "stcw fire prevention and fire fighting": "stcw",
  "stcw pdsd": "stcw",
  "stcw security awareness": "stcw",
  "stcw pssr": "stcw",
  "stcw pst": "stcw",
  "stcw refresher": "stcw",
  "stcw refresher 2": "stcw",
  "stcw advanced fire fighting": "stcw",
  "stcw pscrb": "stcw",
  "stcw proficiency in fast rescue boats": "stcw",

  // Licenses
  "licence": "license",
  "license": "license",
  "power boat ii": "license",
  "power boat ii ce": "license",
  "pwc": "license",
  "short range": "license",
  "yachtmaster offshore": "license",
  "yacht rating": "license",
  "helm": "license",
  "driving license": "license",

  // Food/Galley
  "food safety certificate": "food_safety",
  "ships cook certificate": "food_safety",
  "sample menu": "food_safety",
  "food photos": "photo",

  // Diving
  "padi": "diving",
  "divemaster": "diving",
  "open water scuba instructor": "diving",

  // Visas
  "b1/b2": "visa",
  "b1 visa": "visa",
  "schengen visa": "visa",
  "visa": "visa",

  // References
  "written reference": "reference",

  // Photos
  "photo": "photo",
  "full length photo": "photo",
  "tattoo photo": "photo",

  // Security/Radio
  "sso": "security",
  "aec": "certificate",

  // Checks
  "coc check": "certificate",
  "cec check": "certificate",

  // Other
  "additional documents": "other",
  "other docs": "other",
  "other": "other",
  "": "other",
};

// ============================================================================
// TYPES
// ============================================================================

interface ImportProgress {
  lastProcessedRow: number;
  uploadedCount: number;
  skippedCount: number;
  errorCount: number;
  startedAt: string;
  updatedAt?: string;
  completedAt?: string;
  skippedNoCandidateEmail: number;
  skippedNoUrl: number;
  skippedExpiredS3: number;
  skippedCandidateNotFound: number;
}

interface ImportError {
  row: number;
  email?: string;
  url?: string;
  error: string;
}

interface BubbleDocument {
  candidateEmail: string;
  documentUrl: string;
  documentType: string;
  fileName: string;
  indexed: string;
  note: string;
  creationDate: string;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return supabase;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

function loadProgress(): ImportProgress {
  if (existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(readFileSync(CHECKPOINT_FILE, "utf-8"));
    } catch {
      // Ignore parse errors
    }
  }
  return {
    lastProcessedRow: 0,
    uploadedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    startedAt: new Date().toISOString(),
    skippedNoCandidateEmail: 0,
    skippedNoUrl: 0,
    skippedExpiredS3: 0,
    skippedCandidateNotFound: 0,
  };
}

function saveProgress(progress: ImportProgress): void {
  progress.updatedAt = new Date().toISOString();
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(progress, null, 2));
}

function loadErrors(): ImportError[] {
  if (existsSync(ERROR_LOG_FILE)) {
    try {
      return JSON.parse(readFileSync(ERROR_LOG_FILE, "utf-8"));
    } catch {
      // Ignore parse errors
    }
  }
  return [];
}

function saveErrors(errors: ImportError[]): void {
  writeFileSync(ERROR_LOG_FILE, JSON.stringify(errors, null, 2));
}

// ============================================================================
// LOGGING
// ============================================================================

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logVerbose(message: string): void {
  if (verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

function logError(message: string): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
}

// ============================================================================
// UTILITIES
// ============================================================================

function normalizeUrl(url: string): string {
  if (!url) return "";
  url = url.trim();
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  return url;
}

function getFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname);
    let filename = path.split("/").pop() || "";
    // Remove query params from filename
    if (filename.includes("?")) {
      filename = filename.split("?")[0];
    }
    return filename || `document_${Date.now()}`;
  } catch {
    return `document_${Date.now()}`;
  }
}

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    txt: "text/plain",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

function normalizeDocumentType(docType: string): string {
  if (!docType) return "other";
  const lower = docType.toLowerCase().trim();
  return DOCUMENT_TYPE_MAP[lower] || "other";
}

// ============================================================================
// CANDIDATE LOOKUP CACHE
// ============================================================================

const candidateCache = new Map<string, string | null>();

async function getCandidateByEmail(
  db: SupabaseClient,
  email: string
): Promise<string | null> {
  const emailLower = email.toLowerCase().trim();

  if (candidateCache.has(emailLower)) {
    return candidateCache.get(emailLower) || null;
  }

  try {
    const { data, error } = await db
      .from("candidates")
      .select("id")
      .ilike("email", emailLower)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      candidateCache.set(emailLower, null);
      return null;
    }

    candidateCache.set(emailLower, data.id);
    return data.id;
  } catch {
    candidateCache.set(emailLower, null);
    return null;
  }
}

// ============================================================================
// DOCUMENT UPLOAD
// ============================================================================

async function downloadFile(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      logVerbose(`  Download failed: HTTP ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logVerbose(`  Download timeout`);
    } else {
      logVerbose(`  Download error: ${error}`);
    }
    return null;
  }
}

async function uploadToStorage(
  db: SupabaseClient,
  bucket: string,
  path: string,
  content: Buffer,
  contentType: string
): Promise<boolean> {
  try {
    // Check if file already exists
    const dirPath = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
    const filename = path.includes("/") ? path.substring(path.lastIndexOf("/") + 1) : path;

    try {
      const { data: existing } = await db.storage.from(bucket).list(dirPath);
      if (existing?.some((f) => f.name === filename)) {
        logVerbose(`  File already exists: ${path}`);
        return true;
      }
    } catch {
      // List may fail if directory doesn't exist, that's fine
    }

    const { error } = await db.storage.from(bucket).upload(path, content, {
      contentType,
      upsert: true,
    });

    if (error) {
      if (error.message?.includes("already exists") || error.message?.includes("Duplicate")) {
        return true;
      }
      logVerbose(`  Upload error: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    logVerbose(`  Upload error: ${error}`);
    return false;
  }
}

async function createDocumentRecord(
  db: SupabaseClient,
  candidateId: string,
  docType: string,
  storagePath: string,
  originalFilename: string,
  fileSize: number,
  mimeType: string
): Promise<boolean> {
  try {
    // Check if document record already exists
    const { data: existing } = await db
      .from("documents")
      .select("id")
      .eq("entity_id", candidateId)
      .eq("file_path", storagePath)
      .single();

    if (existing) {
      logVerbose(`  Document record already exists`);
      return true;
    }

    // Get storage URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/documents/${storagePath}`;

    const { error } = await db.from("documents").insert({
      entity_type: "candidate",
      entity_id: candidateId,
      organization_id: DEFAULT_ORG_ID,
      type: docType,
      name: originalFilename,
      file_url: fileUrl,
      file_path: storagePath,
      file_size: fileSize,
      mime_type: mimeType,
      status: "approved", // Auto-approve imported docs
      is_processed: false,
      is_latest_version: true,
      version: 1,
      metadata: { source: "bubble_import" },
    });

    if (error) {
      if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
        return true;
      }
      logVerbose(`  DB error: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    logVerbose(`  DB error: ${error}`);
    return false;
  }
}

// ============================================================================
// CSV PARSING
// ============================================================================

function transformRecord(record: Record<string, string>): BubbleDocument {
  return {
    candidateEmail: record["Candidate"] || "",
    documentUrl: record["Document File"] || "",
    documentType: record["Document Type"] || "",
    fileName: record["File Name"] || "",
    indexed: record["Indexed"] || "",
    note: record["Note"] || "",
    creationDate: record["Creation Date"] || "",
  };
}

async function* streamCSV(csvPath: string): AsyncGenerator<{ row: number; doc: BubbleDocument }> {
  let rowNumber = 0;

  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      bom: true,
    })
  );

  for await (const record of parser) {
    rowNumber++;
    yield { row: rowNumber, doc: transformRecord(record) };
  }
}

async function countCSVRows(csvPath: string): Promise<number> {
  let count = 0;
  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
    })
  );

  for await (const _ of parser) {
    count++;
  }

  return count;
}

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("BUBBLE DOCUMENTS IMPORT");
  console.log("=".repeat(60));
  console.log(`Documents CSV: ${documentsCsvPath}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Resume: ${shouldResume}`);
  console.log(`Reset: ${shouldReset}`);
  console.log(`CV only: ${cvOnly}`);
  console.log(`Concurrency: ${concurrency}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log("=".repeat(60));

  // Check CSV exists
  if (!existsSync(documentsCsvPath)) {
    logError(`Documents CSV not found: ${documentsCsvPath}`);
    process.exit(1);
  }

  // Handle reset
  if (shouldReset) {
    if (existsSync(CHECKPOINT_FILE)) {
      unlinkSync(CHECKPOINT_FILE);
      log("Checkpoint reset");
    }
    if (existsSync(ERROR_LOG_FILE)) {
      unlinkSync(ERROR_LOG_FILE);
      log("Error log reset");
    }
  }

  // Initialize progress
  let progress: ImportProgress = shouldResume ? loadProgress() : {
    lastProcessedRow: 0,
    uploadedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    startedAt: new Date().toISOString(),
    skippedNoCandidateEmail: 0,
    skippedNoUrl: 0,
    skippedExpiredS3: 0,
    skippedCandidateNotFound: 0,
  };

  let errors: ImportError[] = shouldResume ? loadErrors() : [];

  // Count total rows
  log("Counting CSV rows...");
  const totalRows = await countCSVRows(documentsCsvPath);
  log(`Total rows in CSV: ${totalRows}`);
  log(`Starting from row: ${progress.lastProcessedRow}`);

  const effectiveTotal = limit ? Math.min(totalRows, progress.lastProcessedRow + limit) : totalRows;

  // Get Supabase client (unless dry run)
  const db = dryRun ? null : getSupabaseClient();

  let processed = 0;

  for await (const { row, doc } of streamCSV(documentsCsvPath)) {
    // Skip already processed rows
    if (row <= progress.lastProcessedRow) {
      continue;
    }

    // Check limit
    if (limit && processed >= limit) {
      break;
    }

    processed++;

    // Validate candidate email
    if (!doc.candidateEmail) {
      progress.skippedNoCandidateEmail++;
      progress.skippedCount++;
      progress.lastProcessedRow = row;
      continue;
    }

    // Validate document URL
    const documentUrl = normalizeUrl(doc.documentUrl);
    if (!documentUrl) {
      progress.skippedNoUrl++;
      progress.skippedCount++;
      progress.lastProcessedRow = row;
      continue;
    }

    // Skip expired Vincere S3 signed URLs
    if (documentUrl.includes("s3.eu-central-1.amazonaws.com")) {
      progress.skippedExpiredS3++;
      progress.skippedCount++;
      progress.lastProcessedRow = row;
      continue;
    }

    const docType = normalizeDocumentType(doc.documentType);

    // If --cv-only flag, skip non-CV documents
    if (cvOnly && docType !== "cv") {
      progress.skippedCount++;
      progress.lastProcessedRow = row;
      continue;
    }

    const originalFilename = getFilenameFromUrl(documentUrl) || doc.fileName || `document_${row}`;

    if (dryRun) {
      logVerbose(`Row ${row}: ${doc.candidateEmail} -> ${docType} (${originalFilename})`);
      progress.uploadedCount++;
    } else {
      // Look up candidate
      const candidateId = await getCandidateByEmail(db!, doc.candidateEmail);
      if (!candidateId) {
        progress.skippedCandidateNotFound++;
        progress.skippedCount++;
        errors.push({
          row,
          email: doc.candidateEmail,
          error: "Candidate not found in database",
        });
        progress.lastProcessedRow = row;
        continue;
      }

      // Download file
      const content = await downloadFile(documentUrl);
      if (!content) {
        progress.errorCount++;
        errors.push({
          row,
          email: doc.candidateEmail,
          url: documentUrl,
          error: "Failed to download file",
        });
        progress.lastProcessedRow = row;
        continue;
      }

      // Upload to storage
      const storagePath = `${candidateId}/${docType}/${originalFilename}`;
      const contentType = getContentType(originalFilename);

      if (!(await uploadToStorage(db!, "documents", storagePath, content, contentType))) {
        progress.errorCount++;
        errors.push({
          row,
          email: doc.candidateEmail,
          error: "Failed to upload to storage",
        });
        progress.lastProcessedRow = row;
        continue;
      }

      // Create document record
      if (!(await createDocumentRecord(db!, candidateId, docType, storagePath, originalFilename, content.length, contentType))) {
        progress.errorCount++;
        errors.push({
          row,
          email: doc.candidateEmail,
          error: "Failed to create document record",
        });
        progress.lastProcessedRow = row;
        continue;
      }

      progress.uploadedCount++;
      logVerbose(`Row ${row}: Uploaded ${docType} for ${doc.candidateEmail}`);
    }

    progress.lastProcessedRow = row;

    // Save checkpoint periodically
    if (row % CHECKPOINT_INTERVAL === 0) {
      saveProgress(progress);
      saveErrors(errors);

      const pct = ((row / effectiveTotal) * 100).toFixed(1);
      log(
        `Progress: ${row}/${effectiveTotal} (${pct}%) - ` +
        `Uploaded: ${progress.uploadedCount}, Skipped: ${progress.skippedCount}, Errors: ${progress.errorCount}`
      );
    }
  }

  // Final save
  progress.completedAt = new Date().toISOString();
  saveProgress(progress);
  saveErrors(errors);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DOCUMENTS IMPORT COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total processed: ${progress.lastProcessedRow}`);
  console.log(`Uploaded: ${progress.uploadedCount}`);
  console.log(`Skipped: ${progress.skippedCount}`);
  console.log(`  - No candidate email: ${progress.skippedNoCandidateEmail}`);
  console.log(`  - No document URL: ${progress.skippedNoUrl}`);
  console.log(`  - Expired S3 URLs: ${progress.skippedExpiredS3}`);
  console.log(`  - Candidate not found: ${progress.skippedCandidateNotFound}`);
  console.log(`Errors: ${progress.errorCount}`);
  console.log("=".repeat(60));

  if (errors.length > 0) {
    console.log(`\nErrors saved to: ${ERROR_LOG_FILE}`);
    console.log("\nFirst 10 errors:");
    for (const err of errors.slice(0, 10)) {
      console.log(`  Row ${err.row} (${err.email}): ${err.error}`);
    }
  }
}

// Run
main().catch((error) => {
  logError(`Fatal error: ${error}`);
  process.exit(1);
});
