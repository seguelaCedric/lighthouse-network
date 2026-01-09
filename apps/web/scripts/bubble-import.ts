/**
 * Bubble CSV Import Script
 *
 * Imports candidates from Bubble CSV export into Supabase database,
 * linking to existing Vincere records via email matching.
 *
 * Run: cd apps/web && npx tsx scripts/bubble-import.ts --candidates=path/to/candidates.csv
 *
 * Options:
 *   --candidates=<path>   Path to Bubble candidates CSV (required)
 *   --documents=<path>    Path to Bubble documents CSV (optional)
 *   --vincere-csv=<path>  Path to Vincere candidates CSV export (for email→ID mapping)
 *   --skip-vincere-map    Skip Vincere mapping phase (use existing map file)
 *   --skip-documents      Skip document download/upload phase
 *   --resume              Resume from last progress checkpoint
 *   --dry-run             Validate CSV without importing
 *   --limit=N             Process only first N candidates
 *   --batch-size=N        Candidates per batch (default: 100)
 *   --verbose             Show detailed logging
 *
 * Environment variables (from .env.local):
 * - VINCERE_CLIENT_ID
 * - VINCERE_API_KEY
 * - VINCERE_REFRESH_TOKEN
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { VincereClient } from "../lib/vincere/client";
import {
  VINCERE_INDUSTRY_IDS,
  POSITION_MAPPING,
  VINCERE_LICENSE_IDS,
} from "../lib/vincere/constants";

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

const candidatesCsvPath = getArg("candidates");
const documentsCsvPath = getArg("documents");
const vincereCsvPath = getArg("vincere-csv");
const skipVincereMap = hasFlag("skip-vincere-map");
const skipDocuments = hasFlag("skip-documents");
const shouldResume = hasFlag("resume");
const dryRun = hasFlag("dry-run");
const verbose = hasFlag("verbose");
const limit = getArg("limit") ? parseInt(getArg("limit")!, 10) : undefined;
const batchSize = getArg("batch-size") ? parseInt(getArg("batch-size")!, 10) : 100;

// Validate required arguments
if (!candidatesCsvPath) {
  console.error("Error: --candidates=<path> is required");
  console.error("\nUsage: npx tsx scripts/bubble-import.ts --candidates=path/to/candidates.csv");
  process.exit(1);
}

if (!existsSync(candidatesCsvPath)) {
  console.error(`Error: Candidates CSV file not found: ${candidatesCsvPath}`);
  process.exit(1);
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_ORG_ID = process.env.VINCERE_ORG_ID || "c4e1e6ff-b71a-4fbd-bb31-dd282d981436";
const PROGRESS_FILE = resolve(__dirname, ".bubble-import-progress.json");
const VINCERE_MAP_FILE = resolve(__dirname, ".bubble-import-vincere-map.json");

// ============================================================================
// TYPES
// ============================================================================

interface BubbleCandidate {
  nameFirst: string;
  nameLast: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  nationality2: string;
  phone: string;
  maritalStatus: string;
  smoker: string;
  tattoos: string;
  tattooLocation: string;
  highestLicence: string;
  secondLicence: string;
  stcw: string;
  eng1: string;
  b1b2Visa: string;
  schengenVisa: string;
  positions: string;
  desiredLocation: string;
  desiredMonthlySalary: string;
  preferedContractType: string;
  preferedYachtSize: string;
  preferedYachtType: string;
  partnerName: string;
  partnerPosition: string;
  couplePosition: string;
  startDate: string;
  candidateStatus: string;
  avatar: string;
  cvFile: string;
  bubbleId: string;
  createdDate: string;
  modifiedDate: string;
}

interface ImportProgress {
  startedAt: string;
  csvPath: string;
  totalRows: number;
  vincereMapComplete: boolean;
  vincereTotalCandidates: number;
  lastProcessedRow: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  documentsProcessed: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

interface VincereSearchResult {
  result: {
    items: Array<{
      id: number;
      primary_email?: string;
    }>;
    total: number;
  };
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

function loadProgress(): ImportProgress | null {
  if (!existsSync(PROGRESS_FILE)) return null;
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function saveProgress(progress: ImportProgress): void {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function loadVincereMap(): Map<string, string> | null {
  if (!existsSync(VINCERE_MAP_FILE)) return null;
  try {
    const data = JSON.parse(readFileSync(VINCERE_MAP_FILE, "utf-8"));
    return new Map(Object.entries(data));
  } catch {
    return null;
  }
}

function saveVincereMap(map: Map<string, string>): void {
  writeFileSync(VINCERE_MAP_FILE, JSON.stringify(Object.fromEntries(map), null, 2));
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeBubbleUrl(url: string): string {
  if (!url) return "";
  url = url.trim();
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  return url;
}

function parseBoolean(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === "yes" || lower === "true" || lower === "1";
}

function parseDate(value: string): string | null {
  if (!value) return null;

  // Try various date formats
  const formats = [
    // "Sep 2, 1994 8:30 PM" - Bubble format
    /^(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
    // ISO format
    /^(\d{4})-(\d{2})-(\d{2})/,
    // US format MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  // Try Bubble format first: "Sep 2, 1994 8:30 PM"
  const bubbleMatch = value.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (bubbleMatch) {
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const monthNum = months[bubbleMatch[1].toLowerCase().substring(0, 3)];
    if (monthNum) {
      const day = bubbleMatch[2].padStart(2, "0");
      return `${bubbleMatch[3]}-${monthNum}-${day}`;
    }
  }

  // Try ISO format
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Try US format
  const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const month = usMatch[1].padStart(2, "0");
    const day = usMatch[2].padStart(2, "0");
    return `${usMatch[3]}-${month}-${day}`;
  }

  return null;
}

function parseSalaryRange(value: string): { min: number | null; max: number | null } {
  if (!value) return { min: null, max: null };

  // Remove currency symbols and text
  const cleaned = value.replace(/[€$£]|euro|eur|usd/gi, "").trim();

  // Handle "k" notation: 5k -> 5000
  const withK = cleaned.replace(/(\d+)k/gi, (_, num) => String(parseInt(num) * 1000));

  // Try to find numbers
  const numbers = withK.match(/\d+/g);
  if (!numbers) return { min: null, max: null };

  if (numbers.length === 1) {
    const value = parseInt(numbers[0]);
    return { min: value, max: value };
  }

  return {
    min: parseInt(numbers[0]),
    max: parseInt(numbers[1]),
  };
}

function parseYachtSizeRange(value: string): { min: number | null; max: number | null } {
  if (!value) return { min: null, max: null };

  // Remove "m" suffix and other text
  const cleaned = value.replace(/m|meters?|ft|feet/gi, "").trim();

  const numbers = cleaned.match(/\d+/g);
  if (!numbers) return { min: null, max: null };

  if (numbers.length === 1) {
    const size = parseInt(numbers[0]);
    return { min: size, max: size };
  }

  return {
    min: parseInt(numbers[0]),
    max: parseInt(numbers[1]),
  };
}

function normalizePosition(value: string): { position: string; category: string } | null {
  if (!value) return null;

  const lower = value.toLowerCase().trim();
  const mapping = POSITION_MAPPING[lower];

  if (mapping) {
    return { position: mapping.standard, category: mapping.category };
  }

  // Try partial matching
  for (const [key, val] of Object.entries(POSITION_MAPPING)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { position: val.standard, category: val.category };
    }
  }

  // Return as-is if no mapping found
  return { position: value.trim(), category: "other" };
}

function normalizeLicense(value: string): string | null {
  if (!value) return null;

  const lower = value.toLowerCase().trim();

  // Direct mappings for common Bubble values
  const licenseMap: Record<string, string> = {
    // Deck licenses
    "master unlimited": "master_unlimited",
    "master 3000": "master_3000gt",
    "master 3000gt": "master_3000gt",
    "master (3000)": "master_3000gt",
    "master 500": "master_500gt",
    "master 500gt": "master_500gt",
    "master (500)": "master_500gt",
    "chief officer": "chief_officer",
    "oow": "oow",
    "officer of the watch": "oow",
    "ow unlimited": "oow_unlimited",

    // Engineering licenses
    "chief engineer unlimited": "chief_engineer_unlimited",
    "chief engineer y1/y2": "chief_engineer_y1y2",
    "second engineer unlimited": "second_engineer_unlimited",
    "2nd engineer unlimited": "second_engineer_unlimited",
    "third engineer": "third_engineer",
    "3rd engineer": "third_engineer",
    "eoow": "third_engineer",
    "electro technical officer": "eto",
    "eto": "eto",
    "aec": "aec",
    "approved engine course": "aec",

    // Yacht licenses
    "y1": "y1",
    "y2": "y2",
    "y3": "y3",
    "y4": "y4",
    "yacht master": "yacht_master",
    "yacht master offshore": "yacht_master_offshore",
    "yacht master ocean": "yacht_master_ocean",

    // Day skipper etc
    "day skipper": "day_skipper",
    "coastal skipper": "coastal_skipper",
  };

  // Try exact match
  if (licenseMap[lower]) {
    return licenseMap[lower];
  }

  // Try partial match
  for (const [key, val] of Object.entries(licenseMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      return val;
    }
  }

  // Return original if no mapping
  return value.trim();
}

function normalizeContractTypes(value: string): string[] {
  if (!value) return [];

  const lower = value.toLowerCase();
  const types: string[] = [];

  if (lower.includes("permanent") || lower.includes("perm")) types.push("permanent");
  if (lower.includes("rotational") || lower.includes("rotation")) types.push("rotational");
  if (lower.includes("seasonal") || lower.includes("season")) types.push("seasonal");
  if (lower.includes("temporary") || lower.includes("temp")) types.push("temporary");
  if (lower.includes("freelance") || lower.includes("free")) types.push("freelance");

  return types;
}

function normalizeYachtTypes(value: string): string[] {
  if (!value) return [];

  const lower = value.toLowerCase();
  const types: string[] = [];

  if (lower.includes("motor")) types.push("motor");
  if (lower.includes("sail")) types.push("sailing");

  return types;
}

function normalizeAvailabilityStatus(value: string): string {
  if (!value) return "unknown";

  const lower = value.toLowerCase().trim();

  if (lower.includes("available") || lower === "yes" || lower === "active") {
    return "available";
  }
  if (lower.includes("notice")) {
    return "notice_period";
  }
  if (lower.includes("not looking") || lower === "no") {
    return "not_looking";
  }
  if (lower.includes("contract") || lower.includes("employed")) {
    return "on_contract";
  }

  return "unknown";
}

// ============================================================================
// CSV PARSING
// ============================================================================

function transformBubbleRecord(record: Record<string, string>): BubbleCandidate {
  return {
    nameFirst: record["Name First"] || "",
    nameLast: record["Name Last"] || "",
    email: record["email"] || "",
    dateOfBirth: record["Date of Birth"] || "",
    gender: record["Gender"] || "",
    nationality: record["Nationality"] || "",
    nationality2: record["Nationality 2"] || "",
    phone: record["Contact Phone"] || "",
    maritalStatus: record["Marital Status"] || "",
    smoker: record["Smoker"] || "",
    tattoos: record["Tatoos"] || record["Tattoos"] || "",
    tattooLocation: record["Tatoo Location"] || record["Tattoo Location"] || "",
    highestLicence: record["Highest Licence"] || record["Highest License"] || "",
    secondLicence: record["Second Licence"] || record["Second License"] || "",
    stcw: record["STCW"] || "",
    eng1: record["ENG 1"] || record["ENG1"] || "",
    b1b2Visa: record["B1/B2 Visa"] || "",
    schengenVisa: record["Shengen Visa"] || record["Schengen Visa"] || "",
    positions: record["Positions"] || "",
    desiredLocation: record["Desired Location"] || "",
    desiredMonthlySalary: record["Desired Monthly Salary"] || "",
    preferedContractType: record["Prefered Contrat Type"] || record["Preferred Contract Type"] || "",
    preferedYachtSize: record["Prefered Yacht Size"] || record["Preferred Yacht Size"] || "",
    preferedYachtType: record["Prefered Yacht Type"] || record["Preferred Yacht Type"] || "",
    partnerName: record["Partner's Name"] || "",
    partnerPosition: record["Partner's position"] || "",
    couplePosition: record["Partner's position Couple's position"] || record["Couple's position"] || "",
    startDate: record["Start Date"] || "",
    candidateStatus: record["Candidate Status"] || "",
    avatar: record["Avatar"] || "",
    cvFile: record["CV file"] || record["CV File"] || "",
    bubbleId: record["unique id"] || "",
    createdDate: record["Creation Date"] || "",
    modifiedDate: record["Modified Date"] || "",
  };
}

async function* streamCSV(csvPath: string): AsyncGenerator<{ row: number; candidate: BubbleCandidate }> {
  let rowNumber = 0;

  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    })
  );

  for await (const record of parser) {
    rowNumber++;
    yield { row: rowNumber, candidate: transformBubbleRecord(record) };
  }
}

async function countCSVRows(csvPath: string): Promise<number> {
  let count = 0;
  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    })
  );

  for await (const _ of parser) {
    count++;
  }

  return count;
}

// ============================================================================
// VINCERE EMAIL MAPPING
// ============================================================================

async function loadVincereMapFromCsv(csvPath: string): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();

  log(`Loading Vincere email → ID mapping from CSV: ${csvPath}`);

  return new Promise((resolve, reject) => {
    const parser = createReadStream(csvPath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      })
    );

    parser.on("data", (row: Record<string, string>) => {
      // CSV headers: candidate_id, name, primary_email, ...
      const email = row.primary_email?.toLowerCase().trim();
      const id = row.candidate_id?.trim();

      if (email && id) {
        emailMap.set(email, id);
      }
    });

    parser.on("end", () => {
      log(`Loaded ${emailMap.size} email → ID mappings from CSV`);
      resolve(emailMap);
    });

    parser.on("error", (err) => {
      logError(`Error parsing Vincere CSV: ${err}`);
      reject(err);
    });
  });
}

async function fetchRecentVincereCandidates(client: VincereClient, existingMap: Map<string, string>): Promise<number> {
  // Fetch candidates from the last year that may not be in the CSV export
  const PAGE_SIZE = 100;
  const MAX_OFFSET = 9900;
  let added = 0;

  log("Fetching recent Vincere candidates from API (last year)...");

  // Use sort by created_date desc to get newest candidates first
  let offset = 0;

  while (offset <= MAX_OFFSET) {
    try {
      const url = `/candidate/search/fl=id,primary_email;sort=created_date desc?start=${offset}&limit=${PAGE_SIZE}`;

      const result = await client.get<VincereSearchResult>(url);
      const items = result?.result?.items ?? [];

      if (items.length === 0) {
        break;
      }

      let newThisBatch = 0;
      for (const item of items) {
        if (item.primary_email) {
          const email = item.primary_email.toLowerCase().trim();
          if (!existingMap.has(email)) {
            existingMap.set(email, item.id.toString());
            added++;
            newThisBatch++;
          }
        }
      }

      offset += PAGE_SIZE;

      // Rate limit: ~1 request per second
      await sleep(1000);

      if (offset % 1000 === 0) {
        log(`Progress: offset=${offset}, added ${added} new emails`);
      }

      // If we're not finding any new emails, we've likely caught up with the CSV
      if (newThisBatch === 0 && offset > 1000) {
        log("No new emails found in last batch, stopping API fetch");
        break;
      }

      // If we got fewer items than PAGE_SIZE, we've reached the end
      if (items.length < PAGE_SIZE) {
        break;
      }
    } catch (error) {
      logError(`Vincere API error at offset ${offset}: ${error}`);
      await sleep(5000);
    }
  }

  log(`Added ${added} new email mappings from API`);
  return added;
}

async function buildVincereEmailMap(client: VincereClient): Promise<Map<string, string>> {
  let emailMap = new Map<string, string>();

  // Step 1: Load from Vincere CSV if provided
  if (vincereCsvPath && existsSync(vincereCsvPath)) {
    emailMap = await loadVincereMapFromCsv(vincereCsvPath);
    log(`Initial map size from CSV: ${emailMap.size}`);

    // Step 2: Supplement with API calls for recent candidates
    await fetchRecentVincereCandidates(client, emailMap);
  } else {
    // Original API-only approach if no CSV provided
    const PAGE_SIZE = 100;
    const MAX_OFFSET = 9900;

    log("Building Vincere email → ID mapping from API only...");

    const sortStrategies = [
      "id asc",
      "id desc",
      "created_date asc",
      "created_date desc",
      "last_update desc",
    ];

    let estimatedTotal = 0;

    for (const sortOrder of sortStrategies) {
      let offset = 0;

      log(`Fetching with sort: ${sortOrder}...`);

      while (offset <= MAX_OFFSET) {
        try {
          const url = `/candidate/search/fl=id,primary_email;sort=${sortOrder}?start=${offset}&limit=${PAGE_SIZE}`;

          const result = await client.get<VincereSearchResult>(url);

          if (estimatedTotal === 0) {
            estimatedTotal = result?.result?.total ?? 0;
            log(`Total candidates in Vincere: ${estimatedTotal}`);
          }

          const items = result?.result?.items ?? [];

          if (items.length === 0) {
            break;
          }

          for (const item of items) {
            if (item.primary_email) {
              emailMap.set(item.primary_email.toLowerCase().trim(), item.id.toString());
            }
          }

          offset += PAGE_SIZE;
          await sleep(1000);

          if (offset % 1000 === 0) {
            log(`Progress: offset=${offset}, unique emails=${emailMap.size}`);
          }

          if (items.length < PAGE_SIZE) {
            break;
          }
        } catch (error) {
          logError(`Vincere API error at offset ${offset}: ${error}`);
          await sleep(5000);
        }
      }

      log(`After "${sortOrder}": ${emailMap.size} unique emails mapped`);

      if (emailMap.size >= estimatedTotal * 0.99) {
        log("Got 99%+ of candidates, stopping early");
        break;
      }
    }
  }

  log(`Vincere mapping complete: ${emailMap.size} unique emails`);
  return emailMap;
}

// ============================================================================
// CANDIDATE MAPPING
// ============================================================================

function mapBubbleToCandidate(bubble: BubbleCandidate, vincereId: string | null): Record<string, unknown> {
  const positionInfo = normalizePosition(bubble.positions);
  const salaryRange = parseSalaryRange(bubble.desiredMonthlySalary);
  const yachtSizeRange = parseYachtSizeRange(bubble.preferedYachtSize);

  const hasPartner = !!(bubble.partnerName || bubble.partnerPosition || bubble.couplePosition);

  return {
    first_name: bubble.nameFirst.trim(),
    last_name: bubble.nameLast.trim(),
    email: bubble.email ? bubble.email.toLowerCase().trim() : null,
    phone: bubble.phone ? bubble.phone.replace(/\s+/g, "") : null,
    date_of_birth: parseDate(bubble.dateOfBirth),
    gender: bubble.gender ? bubble.gender.toLowerCase() : null,
    nationality: bubble.nationality || null,
    second_nationality: bubble.nationality2 || null,
    marital_status: bubble.maritalStatus ? bubble.maritalStatus.toLowerCase() : null,

    // Professional
    primary_position: positionInfo?.position || null,
    position_category: positionInfo?.category || null,

    // Preferences
    preferred_regions: bubble.desiredLocation ? bubble.desiredLocation.split(",").map((s) => s.trim()).filter(Boolean) : [],
    preferred_contract_types: normalizeContractTypes(bubble.preferedContractType),
    preferred_yacht_types: normalizeYachtTypes(bubble.preferedYachtType),
    preferred_yacht_size_min: yachtSizeRange.min,
    preferred_yacht_size_max: yachtSizeRange.max,

    // Salary
    desired_salary_min: salaryRange.min,
    desired_salary_max: salaryRange.max,
    salary_currency: "EUR",

    // Certifications
    has_stcw: parseBoolean(bubble.stcw),
    has_eng1: parseBoolean(bubble.eng1),
    highest_license: normalizeLicense(bubble.highestLicence),
    second_license: normalizeLicense(bubble.secondLicence),

    // Visas
    has_b1b2: parseBoolean(bubble.b1b2Visa),
    has_schengen: parseBoolean(bubble.schengenVisa),

    // Personal
    is_smoker: parseBoolean(bubble.smoker),
    has_visible_tattoos: parseBoolean(bubble.tattoos),
    tattoo_description: bubble.tattooLocation || null,

    // Couple
    is_couple: hasPartner,
    partner_name: bubble.partnerName || null,
    partner_position: bubble.partnerPosition || null,
    couple_position: bubble.couplePosition || null,

    // Availability
    availability_status: normalizeAvailabilityStatus(bubble.candidateStatus),
    available_from: parseDate(bubble.startDate),

    // External
    vincere_id: vincereId,

    // Metadata
    source: "bubble_import",
    internal_notes: bubble.bubbleId ? `Bubble ID: ${bubble.bubbleId}` : null,
    last_synced_at: new Date().toISOString(),
  };
}

// ============================================================================
// DOCUMENT HANDLING
// ============================================================================

async function downloadAndUploadDocument(
  url: string,
  candidateId: string,
  type: "avatar" | "cv",
  supabase: SupabaseClient
): Promise<{ success: boolean; url?: string; documentId?: string; error?: string }> {
  const normalizedUrl = normalizeBubbleUrl(url);
  if (!normalizedUrl) {
    return { success: false, error: "Empty URL" };
  }

  try {
    // Download from Bubble CDN
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(normalizedUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const buffer = await response.arrayBuffer();

    // Determine file extension from URL or content type
    const urlPath = new URL(normalizedUrl).pathname;
    let ext = urlPath.split(".").pop()?.toLowerCase() || "bin";
    if (ext.length > 5) ext = "bin"; // Invalid extension

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    if (type === "avatar") {
      // Upload to avatars bucket
      const storagePath = `candidates/${candidateId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(storagePath, Buffer.from(buffer), {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(storagePath);

      return { success: true, url: urlData.publicUrl };
    } else {
      // Upload CV to documents bucket
      const filename = `cv_${Date.now()}.${ext}`;
      const storagePath = `candidate/${candidateId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, Buffer.from(buffer), {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(storagePath);

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          entity_type: "candidate",
          entity_id: candidateId,
          type: "cv",
          name: filename,
          file_url: urlData.publicUrl,
          file_path: storagePath,
          file_size: buffer.byteLength,
          mime_type: contentType,
          status: "approved",
          is_latest_version: true,
          organization_id: DEFAULT_ORG_ID,
          metadata: {
            source: "bubble_import",
            original_url: normalizedUrl,
          },
        })
        .select("id")
        .single();

      if (docError) {
        return { success: false, error: docError.message };
      }

      return { success: true, url: urlData.publicUrl, documentId: doc.id };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Download timeout" };
    }
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("BUBBLE CSV IMPORT");
  console.log("=".repeat(60));
  console.log(`Candidates CSV: ${candidatesCsvPath}`);
  if (documentsCsvPath) console.log(`Documents CSV: ${documentsCsvPath}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Skip Vincere map: ${skipVincereMap}`);
  console.log(`Skip documents: ${skipDocuments}`);
  console.log(`Resume: ${shouldResume}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log("=".repeat(60));

  // Initialize progress
  let progress: ImportProgress = shouldResume && loadProgress()
    ? loadProgress()!
    : {
        startedAt: new Date().toISOString(),
        csvPath: candidatesCsvPath,
        totalRows: 0,
        vincereMapComplete: false,
        vincereTotalCandidates: 0,
        lastProcessedRow: 0,
        importedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        documentsProcessed: 0,
        errors: [],
      };

  // Count total rows
  if (!progress.totalRows) {
    log("Counting CSV rows...");
    progress.totalRows = await countCSVRows(candidatesCsvPath);
    log(`Total rows in CSV: ${progress.totalRows}`);
    saveProgress(progress);
  }

  // -------------------------------------------------------------------------
  // PHASE 1: Build Vincere Email Map
  // -------------------------------------------------------------------------
  let emailToVincereMap: Map<string, string>;

  if (skipVincereMap) {
    const existingMap = loadVincereMap();
    if (existingMap) {
      emailToVincereMap = existingMap;
      log(`Loaded existing Vincere map with ${emailToVincereMap.size} entries`);
    } else {
      logError("No existing Vincere map found. Run without --skip-vincere-map first.");
      process.exit(1);
    }
  } else if (progress.vincereMapComplete && loadVincereMap()) {
    emailToVincereMap = loadVincereMap()!;
    log(`Using cached Vincere map with ${emailToVincereMap.size} entries`);
  } else {
    const vincereClient = new VincereClient();
    emailToVincereMap = await buildVincereEmailMap(vincereClient);
    saveVincereMap(emailToVincereMap);
    progress.vincereMapComplete = true;
    progress.vincereTotalCandidates = emailToVincereMap.size;
    saveProgress(progress);
  }

  if (dryRun) {
    log("Dry run mode - skipping database operations");
    log("Validating CSV structure...");

    let validCount = 0;
    let invalidCount = 0;
    let withName = 0;
    let withoutName = 0;
    let linkedToVincere = 0;

    for await (const { row, candidate } of streamCSV(candidatesCsvPath)) {
      if (limit && row > limit) break;

      if (!candidate.email) {
        logError(`Row ${row}: Missing email`);
        invalidCount++;
      } else {
        validCount++;
        const vincereId = emailToVincereMap.get(candidate.email.toLowerCase().trim());
        if (vincereId) linkedToVincere++;

        if (candidate.nameFirst && candidate.nameLast) {
          withName++;
        } else {
          withoutName++;
        }

        logVerbose(
          `Row ${row}: ${candidate.nameFirst || "(no first)"} ${candidate.nameLast || "(no last)"} <${candidate.email}> → Vincere: ${vincereId || "NOT LINKED"}`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("DRY RUN SUMMARY");
    console.log("=".repeat(60));
    console.log(`Valid candidates (have email): ${validCount}`);
    console.log(`  - With name: ${withName}`);
    console.log(`  - Without name: ${withoutName}`);
    console.log(`Invalid candidates (no email): ${invalidCount}`);
    console.log(`Will be linked to Vincere: ${linkedToVincere}`);
    console.log(`New candidates (no Vincere match): ${validCount - linkedToVincere}`);
    console.log(`Vincere emails in map: ${emailToVincereMap.size}`);
    return;
  }

  // -------------------------------------------------------------------------
  // PHASE 2: Import Candidates
  // -------------------------------------------------------------------------
  const db = getSupabaseClient();

  log("Starting candidate import...");

  let currentBatch: Array<{ row: number; candidate: BubbleCandidate }> = [];

  for await (const item of streamCSV(candidatesCsvPath)) {
    // Skip already processed rows when resuming
    if (shouldResume && item.row <= progress.lastProcessedRow) {
      continue;
    }

    // Check limit
    if (limit && item.row > limit) {
      break;
    }

    // Validate required fields - email is required (name is optional)
    if (!item.candidate.email) {
      progress.errors.push({
        row: item.row,
        email: "N/A",
        error: "Missing email",
      });
      progress.errorCount++;
      progress.skippedCount++;
      continue;
    }

    currentBatch.push(item);

    // Process batch when full
    if (currentBatch.length >= batchSize) {
      await processBatch(currentBatch, emailToVincereMap, db, progress, skipDocuments);
      currentBatch = [];
      saveProgress(progress);
    }
  }

  // Process remaining batch
  if (currentBatch.length > 0) {
    await processBatch(currentBatch, emailToVincereMap, db, progress, skipDocuments);
    saveProgress(progress);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("IMPORT COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total rows: ${progress.totalRows}`);
  console.log(`Imported (new): ${progress.importedCount}`);
  console.log(`Updated (existing): ${progress.updatedCount}`);
  console.log(`Skipped: ${progress.skippedCount}`);
  console.log(`Errors: ${progress.errorCount}`);
  console.log(`Documents processed: ${progress.documentsProcessed}`);

  if (progress.errors.length > 0) {
    console.log("\nFirst 10 errors:");
    for (const err of progress.errors.slice(0, 10)) {
      console.log(`  Row ${err.row} (${err.email}): ${err.error}`);
    }
  }
}

async function processBatch(
  batch: Array<{ row: number; candidate: BubbleCandidate }>,
  emailToVincereMap: Map<string, string>,
  db: SupabaseClient,
  progress: ImportProgress,
  skipDocuments: boolean
): Promise<void> {
  log(`Processing batch of ${batch.length} candidates (rows ${batch[0].row}-${batch[batch.length - 1].row})...`);

  for (const { row, candidate } of batch) {
    try {
      // Lookup vincere_id
      const vincereId = candidate.email
        ? emailToVincereMap.get(candidate.email.toLowerCase().trim()) || null
        : null;

      // Map to Supabase schema
      const candidateData = mapBubbleToCandidate(candidate, vincereId);

      // Check for existing candidate by email
      let existingId: string | null = null;
      if (candidate.email) {
        const { data: existing } = await db
          .from("candidates")
          .select("id")
          .ilike("email", candidate.email.trim())
          .is("deleted_at", null)
          .single();

        existingId = existing?.id || null;
      }

      let candidateId: string;

      if (existingId) {
        // Update existing
        const { error } = await db
          .from("candidates")
          .update(candidateData)
          .eq("id", existingId);

        if (error) throw error;
        candidateId = existingId;
        progress.updatedCount++;
        logVerbose(`Row ${row}: Updated ${candidate.nameFirst} ${candidate.nameLast} (${candidateId})`);
      } else {
        // Insert new
        const { data, error } = await db
          .from("candidates")
          .insert(candidateData)
          .select("id")
          .single();

        if (error) throw error;
        candidateId = data.id;
        progress.importedCount++;
        logVerbose(`Row ${row}: Created ${candidate.nameFirst} ${candidate.nameLast} (${candidateId})`);
      }

      // Create/update agency relationship
      await db
        .from("candidate_agency_relationships")
        .upsert(
          {
            candidate_id: candidateId,
            agency_id: DEFAULT_ORG_ID,
            relationship_type: "registered",
            is_exclusive: false,
            agency_candidate_id: candidate.bubbleId || null,
            agency_notes: "Imported from Bubble",
          },
          { onConflict: "candidate_id,agency_id" }
        );

      // Process documents (if not skipped)
      if (!skipDocuments) {
        // Avatar
        if (candidate.avatar) {
          const avatarResult = await downloadAndUploadDocument(
            candidate.avatar,
            candidateId,
            "avatar",
            db
          );
          if (avatarResult.success && avatarResult.url) {
            await db
              .from("candidates")
              .update({ avatar_url: avatarResult.url })
              .eq("id", candidateId);
            progress.documentsProcessed++;
          } else if (avatarResult.error) {
            logVerbose(`Row ${row}: Avatar upload failed: ${avatarResult.error}`);
          }
        }

        // CV
        if (candidate.cvFile) {
          const cvResult = await downloadAndUploadDocument(
            candidate.cvFile,
            candidateId,
            "cv",
            db
          );
          if (cvResult.success && cvResult.documentId) {
            await db
              .from("candidates")
              .update({
                cv_document_id: cvResult.documentId,
                cv_status: "approved",
              })
              .eq("id", candidateId);
            progress.documentsProcessed++;
          } else if (cvResult.error) {
            logVerbose(`Row ${row}: CV upload failed: ${cvResult.error}`);
          }
        }
      }

      progress.lastProcessedRow = row;
    } catch (error) {
      progress.errors.push({
        row,
        email: candidate.email || "N/A",
        error: String(error),
      });
      progress.errorCount++;
      logError(`Row ${row}: ${error}`);
    }
  }
}

// Run main
main().catch((error) => {
  logError(`Fatal error: ${error}`);
  process.exit(1);
});
