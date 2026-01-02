/**
 * WordPress SEO Landing Pages Migration Script
 *
 * This script imports WordPress SEO landing pages into Supabase.
 * Handles hundreds of thousands of pages efficiently via batch processing.
 *
 * Usage:
 *   npx tsx scripts/migrate-wordpress-pages.ts --file=./wordpress-export.csv
 *   npx tsx scripts/migrate-wordpress-pages.ts --file=./wordpress-export.csv --batch=500 --dry-run
 *
 * CSV Format Expected:
 *   url_path,post_title,meta_title,meta_description,content
 *   hire-a-butler-australia/new-south-wale/sydney-2,Hire a Butler Sydney,...
 *
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as readline from "readline";
import { parseArgs } from "util";

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    file: { type: "string", short: "f" },
    batch: { type: "string", short: "b", default: "100" },
    "dry-run": { type: "boolean", short: "d", default: false },
    skip: { type: "string", short: "s", default: "0" },
    limit: { type: "string", short: "l" },
  },
});

const CSV_FILE = values.file;
const BATCH_SIZE = parseInt(values.batch || "100", 10);
const DRY_RUN = values["dry-run"];
const SKIP = parseInt(values.skip || "0", 10);
const LIMIT = values.limit ? parseInt(values.limit, 10) : undefined;

if (!CSV_FILE) {
  console.error("Usage: npx tsx scripts/migrate-wordpress-pages.ts --file=./wordpress-export.csv");
  console.error("Options:");
  console.error("  --file, -f     Path to CSV file (required)");
  console.error("  --batch, -b    Batch size for inserts (default: 100)");
  console.error("  --dry-run, -d  Preview without inserting (default: false)");
  console.error("  --skip, -s     Skip first N rows (default: 0)");
  console.error("  --limit, -l    Process only N rows");
  process.exit(1);
}

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ParsedPage {
  position: string;
  position_slug: string;
  country: string;
  country_slug: string;
  state: string | null;
  state_slug: string | null;
  city: string | null;
  city_slug: string | null;
  original_url_path: string;
  meta_title: string;
  meta_description: string;
  hero_headline: string;
  hero_subheadline: string | null;
  intro_content: string | null;
  is_active: boolean;
}

/**
 * Parse WordPress URL pattern into components
 * Example: hire-a-butler-australia/new-south-wale/sydney-2
 */
function parseWordPressUrl(urlPath: string): Partial<ParsedPage> | null {
  // Remove leading/trailing slashes
  const cleanPath = urlPath.replace(/^\/|\/$/g, "");
  const parts = cleanPath.split("/");

  if (parts.length === 0) return null;

  // First segment: "hire-a-butler-australia" -> extract position and country
  const firstPart = parts[0];
  const match = firstPart.match(/^hire-a-(.+)-([a-z-]+)$/i);

  if (!match) {
    console.warn(`Could not parse URL pattern: ${urlPath}`);
    return null;
  }

  const positionSlug = match[1]; // "butler"
  const countrySlug = match[2]; // "australia"

  // Convert slugs to display names
  const position = slugToTitle(positionSlug);
  const country = slugToTitle(countrySlug);

  // State and city from remaining parts
  const stateSlug = parts[1] || null;
  const citySlug = parts[2] || null;

  return {
    position,
    position_slug: positionSlug,
    country,
    country_slug: countrySlug,
    state: stateSlug ? slugToTitle(stateSlug) : null,
    state_slug: stateSlug,
    city: citySlug ? slugToTitle(citySlug) : null,
    city_slug: citySlug,
    original_url_path: cleanPath,
  };
}

/**
 * Convert slug to title case
 * "new-south-wale" -> "New South Wale"
 * "sydney-2" -> "Sydney"
 */
function slugToTitle(slug: string): string {
  // Remove trailing numbers (like sydney-2)
  const cleaned = slug.replace(/-\d+$/, "");

  return cleaned
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Parse CSV line (handles quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Generate hero headline from position and location
 */
function generateHeadline(parsed: Partial<ParsedPage>): string {
  const location = parsed.city || parsed.state || parsed.country;
  return `Hire a ${parsed.position} in ${location}`;
}

/**
 * Process CSV file and import pages
 */
async function importPages() {
  console.log(`\nWordPress SEO Pages Migration`);
  console.log(`=============================`);
  console.log(`File: ${CSV_FILE}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Skip: ${SKIP}`);
  console.log(`Limit: ${LIMIT || "none"}`);
  console.log("");

  if (!fs.existsSync(CSV_FILE!)) {
    console.error(`File not found: ${CSV_FILE}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(CSV_FILE!);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let lineNumber = 0;
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let batch: ParsedPage[] = [];

  for await (const line of rl) {
    lineNumber++;

    // First line is headers
    if (lineNumber === 1) {
      headers = parseCSVLine(line).map((h) => h.toLowerCase().trim());
      console.log(`CSV Headers: ${headers.join(", ")}`);
      continue;
    }

    // Skip rows if requested
    if (lineNumber <= SKIP + 1) {
      skippedCount++;
      continue;
    }

    // Check limit
    if (LIMIT && processedCount >= LIMIT) {
      console.log(`\nReached limit of ${LIMIT} rows`);
      break;
    }

    // Parse line
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    // Find URL column (might be named differently)
    const urlPath =
      row.url_path ||
      row.post_name ||
      row.url ||
      row.path ||
      row.permalink ||
      "";

    if (!urlPath) {
      console.warn(`Line ${lineNumber}: No URL path found, skipping`);
      errorCount++;
      continue;
    }

    // Parse URL into components
    const parsed = parseWordPressUrl(urlPath);

    if (!parsed) {
      errorCount++;
      continue;
    }

    // Build full page object
    const page: ParsedPage = {
      ...(parsed as ParsedPage),
      meta_title:
        row.meta_title ||
        row.title ||
        row.post_title ||
        generateHeadline(parsed),
      meta_description:
        row.meta_description ||
        row.description ||
        row.excerpt ||
        `Find vetted ${parsed.position} professionals in ${parsed.city || parsed.state || parsed.country}. Lighthouse Careers - 20+ years experience, 22,000+ candidates.`,
      hero_headline:
        row.hero_headline || row.h1 || row.headline || generateHeadline(parsed),
      hero_subheadline:
        row.hero_subheadline || row.subheadline || row.subtitle || null,
      intro_content: row.intro_content || row.content || row.body || null,
      is_active: true,
    };

    batch.push(page);
    processedCount++;

    // Insert batch when full
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch, DRY_RUN!);
      batch = [];
      process.stdout.write(`\rProcessed: ${processedCount} rows...`);
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    await insertBatch(batch, DRY_RUN!);
  }

  console.log(`\n\nMigration Complete!`);
  console.log(`==================`);
  console.log(`Total lines: ${lineNumber}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

/**
 * Insert batch of pages into Supabase
 */
async function insertBatch(pages: ParsedPage[], dryRun: boolean) {
  if (dryRun) {
    console.log(`\n[DRY RUN] Would insert ${pages.length} pages:`);
    pages.slice(0, 3).forEach((p) => {
      console.log(`  - ${p.original_url_path}`);
    });
    if (pages.length > 3) {
      console.log(`  ... and ${pages.length - 3} more`);
    }
    return;
  }

  const { error } = await supabase
    .from("seo_landing_pages")
    .upsert(pages, {
      onConflict: "original_url_path",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error(`\nBatch insert error:`, error.message);

    // Try inserting one by one to find problem rows
    for (const page of pages) {
      const { error: singleError } = await supabase
        .from("seo_landing_pages")
        .upsert(page, { onConflict: "original_url_path" });

      if (singleError) {
        console.error(`  Failed: ${page.original_url_path} - ${singleError.message}`);
      }
    }
  }
}

// Run migration
importPages().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
