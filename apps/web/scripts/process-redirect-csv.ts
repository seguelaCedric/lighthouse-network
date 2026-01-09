/**
 * WordPress URL Redirect CSV Processor
 *
 * Parses a CSV file containing old WordPress URLs and determines
 * the appropriate new URL destinations based on pattern matching.
 *
 * Run: cd apps/web && npx tsx scripts/process-redirect-csv.ts --file=scripts/data/wordpress-redirects.csv
 *
 * Options:
 *   --file=<path>     Path to CSV file with old URLs (required)
 *   --dry-run         Analyze URLs without inserting into database
 *   --verbose         Show detailed logging
 *   --clear           Clear existing redirects before importing
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createReadStream } from "fs";
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

const csvFilePath = getArg("file");
const dryRun = hasFlag("dry-run");
const verbose = hasFlag("verbose");
const clearExisting = hasFlag("clear");

if (!csvFilePath) {
  console.error("Error: --file=<path> is required");
  console.error("Usage: npx tsx scripts/process-redirect-csv.ts --file=scripts/data/wordpress-redirects.csv");
  process.exit(1);
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// STATIC PAGE MAPPINGS
// ============================================================================

const STATIC_PAGE_MAPPINGS: Record<string, string> = {
  "about-us": "/about",
  "about": "/about",
  "contact-us": "/contact",
  "contact": "/contact",
  "privacy-policy": "/privacy",
  "privacy": "/privacy",
  "terms-of-service": "/terms",
  "terms": "/terms",
  "terms-and-conditions": "/terms",
  "careers": "/careers",
  "faq": "/faq",
  "services": "/services",
};

// ============================================================================
// URL ANALYSIS & PATTERN MATCHING
// ============================================================================

interface RedirectMapping {
  oldUrl: string;
  newUrl: string | null;
  contentType: "landing_page" | "blog_post" | "static_page" | "other";
  matched: boolean;
  matchReason: string;
}

function normalizeUrl(url: string): string {
  // Remove domain if present
  let path = url
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();

  // Remove trailing numbers (WordPress pagination artifacts like sydney-2)
  // But keep numbers that are part of dates or meaningful content
  path = path.replace(/-\d+$/, "");

  return path;
}

async function findLandingPageMatch(
  supabase: SupabaseClient,
  path: string
): Promise<{ newUrl: string; matchType: string } | null> {
  // Try exact match first
  const { data: exactMatch } = await supabase
    .from("seo_landing_pages")
    .select("id, original_url_path, position_slug, country_slug, state_slug, city_slug")
    .eq("original_url_path", path)
    .eq("is_active", true)
    .single();

  if (exactMatch) {
    return {
      newUrl: `/${exactMatch.original_url_path}`,
      matchType: "exact_match",
    };
  }

  // Try matching by components
  // Pattern: hire-a-[position]-[country]/[state]/[city]
  const hireMatch = path.match(/^hire-a-([\w-]+)-([\w-]+)(?:\/([\w-]+))?(?:\/([\w-]+))?$/);
  if (hireMatch) {
    const [, position, country, state, city] = hireMatch;

    // Try to find a matching page
    let query = supabase
      .from("seo_landing_pages")
      .select("id, original_url_path")
      .eq("is_active", true)
      .ilike("position_slug", position)
      .ilike("country_slug", country);

    if (state) {
      query = query.ilike("state_slug", state);
    }
    if (city) {
      query = query.ilike("city_slug", city);
    }

    const { data: componentMatch } = await query.limit(1).single();

    if (componentMatch) {
      return {
        newUrl: `/${componentMatch.original_url_path}`,
        matchType: "component_match",
      };
    }
  }

  return null;
}

async function findBlogMatch(
  supabase: SupabaseClient,
  path: string
): Promise<{ newUrl: string; matchType: string } | null> {
  // Extract potential slug from various WordPress blog URL patterns
  let slug: string | null = null;

  // Pattern: blog/slug or 2024/01/slug
  const blogMatch = path.match(/^(?:blog\/|20\d{2}\/\d{2}\/)([\w-]+)$/);
  if (blogMatch) {
    slug = blogMatch[1];
  } else if (!path.includes("/")) {
    // Could be just a slug
    slug = path;
  }

  if (!slug) return null;

  // Try to find matching blog post
  const { data: blogPost } = await supabase
    .from("blog_posts")
    .select("id, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (blogPost) {
    return {
      newUrl: `/blog/${blogPost.slug}`,
      matchType: "blog_slug_match",
    };
  }

  // Try partial match (slug might have been shortened)
  const { data: partialMatch } = await supabase
    .from("blog_posts")
    .select("id, slug")
    .ilike("slug", `%${slug}%`)
    .eq("status", "published")
    .limit(1)
    .single();

  if (partialMatch) {
    return {
      newUrl: `/blog/${partialMatch.slug}`,
      matchType: "blog_partial_match",
    };
  }

  return null;
}

async function analyzeUrl(supabase: SupabaseClient, rawUrl: string): Promise<RedirectMapping> {
  const path = normalizeUrl(rawUrl);

  // Check static page mappings first
  if (STATIC_PAGE_MAPPINGS[path]) {
    return {
      oldUrl: path,
      newUrl: STATIC_PAGE_MAPPINGS[path],
      contentType: "static_page",
      matched: true,
      matchReason: "static_page_mapping",
    };
  }

  // Check for landing pages (hire-a-* pattern)
  if (path.startsWith("hire-a-")) {
    const landingMatch = await findLandingPageMatch(supabase, path);
    if (landingMatch) {
      return {
        oldUrl: path,
        newUrl: landingMatch.newUrl,
        contentType: "landing_page",
        matched: true,
        matchReason: landingMatch.matchType,
      };
    }

    // No match found but it's a landing page pattern
    return {
      oldUrl: path,
      newUrl: null,
      contentType: "landing_page",
      matched: false,
      matchReason: "no_landing_page_match",
    };
  }

  // Check for blog posts
  if (path.startsWith("blog/") || path.match(/^20\d{2}\//)) {
    const blogMatch = await findBlogMatch(supabase, path);
    if (blogMatch) {
      return {
        oldUrl: path,
        newUrl: blogMatch.newUrl,
        contentType: "blog_post",
        matched: true,
        matchReason: blogMatch.matchType,
      };
    }

    return {
      oldUrl: path,
      newUrl: null,
      contentType: "blog_post",
      matched: false,
      matchReason: "no_blog_match",
    };
  }

  // Try blog match for other paths (might be old slug format)
  const blogMatch = await findBlogMatch(supabase, path);
  if (blogMatch) {
    return {
      oldUrl: path,
      newUrl: blogMatch.newUrl,
      contentType: "blog_post",
      matched: true,
      matchReason: blogMatch.matchType,
    };
  }

  // Unknown pattern
  return {
    oldUrl: path,
    newUrl: null,
    contentType: "other",
    matched: false,
    matchReason: "unknown_pattern",
  };
}

// ============================================================================
// CSV PARSING
// ============================================================================

interface CSVRow {
  url: string;
  post_name?: string;
  post_title?: string;
  seo_title?: string;
  meta_description?: string;
  post_type?: string;
}

async function parseCSV(filePath: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CSVRow[] = [];
    const fullPath = filePath.startsWith("/") ? filePath : `${process.cwd()}/${filePath}`;

    if (!existsSync(fullPath)) {
      reject(new Error(`File not found: ${fullPath}`));
      return;
    }

    createReadStream(fullPath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })
      )
      .on("data", (row: Record<string, string>) => {
        // Support various column names for URL
        const url = row.old_url || row.url || row.URL || row.path || row.Path || Object.values(row)[0];
        if (url && url.trim()) {
          rows.push({
            url: url.trim(),
            post_name: row.post_name,
            post_title: row.post_title,
            seo_title: row.seo_title,
            meta_description: row.meta_description,
            post_type: row.post_type,
          });
        }
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("WordPress URL Redirect Processor");
  console.log("=".repeat(60));
  console.log(`File: ${csvFilePath}`);
  console.log(`Dry run: ${dryRun}`);
  console.log("");

  // Parse CSV
  console.log("Parsing CSV file...");
  const rows = await parseCSV(csvFilePath);
  console.log(`Found ${rows.length} URLs to process\n`);

  if (rows.length === 0) {
    console.log("No URLs found in CSV. Make sure the file has an 'old_url' or 'url' column.");
    process.exit(0);
  }

  // Show sample rows
  console.log("Sample rows from CSV:");
  rows.slice(0, 3).forEach((row, i) => {
    console.log(`  ${i + 1}. URL: ${row.url}`);
    if (row.post_title) console.log(`     Title: ${row.post_title}`);
    if (row.post_name) console.log(`     Slug: ${row.post_name}`);
  });
  console.log("");

  // Clear existing redirects if requested
  if (clearExisting && !dryRun) {
    console.log("Clearing existing redirects...");
    const { error } = await supabase
      .from("url_redirects")
      .delete()
      .eq("source", "wordpress_migration");

    if (error) {
      console.error("Error clearing redirects:", error);
    } else {
      console.log("Existing redirects cleared.\n");
    }
  }

  // Analyze each URL
  console.log("Analyzing URLs and finding matches...\n");

  const results: RedirectMapping[] = [];
  const stats = {
    total: rows.length,
    matched: 0,
    unmatched: 0,
    byType: {
      landing_page: 0,
      blog_post: 0,
      static_page: 0,
      other: 0,
    },
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = await analyzeUrl(supabase, row.url);
    results.push(result);

    stats.byType[result.contentType]++;
    if (result.matched) {
      stats.matched++;
    } else {
      stats.unmatched++;
    }

    if (verbose || (i + 1) % 100 === 0) {
      console.log(`[${i + 1}/${rows.length}] ${result.oldUrl} → ${result.newUrl || "NO MATCH"} (${result.matchReason})`);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total URLs: ${stats.total}`);
  console.log(`Matched: ${stats.matched} (${((stats.matched / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Unmatched: ${stats.unmatched} (${((stats.unmatched / stats.total) * 100).toFixed(1)}%)`);
  console.log("");
  console.log("By content type:");
  console.log(`  Landing pages: ${stats.byType.landing_page}`);
  console.log(`  Blog posts: ${stats.byType.blog_post}`);
  console.log(`  Static pages: ${stats.byType.static_page}`);
  console.log(`  Other: ${stats.byType.other}`);

  // Show unmatched URLs
  const unmatched = results.filter((r) => !r.matched);
  if (unmatched.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("UNMATCHED URLs (need manual review)");
    console.log("=".repeat(60));
    unmatched.slice(0, 50).forEach((r) => {
      console.log(`  ${r.oldUrl} [${r.contentType}] - ${r.matchReason}`);
    });
    if (unmatched.length > 50) {
      console.log(`  ... and ${unmatched.length - 50} more`);
    }
  }

  // Insert into database if not dry run
  if (!dryRun) {
    console.log("\n" + "=".repeat(60));
    console.log("INSERTING REDIRECTS INTO DATABASE");
    console.log("=".repeat(60));

    const matchedResults = results.filter((r) => r.matched && r.newUrl);
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < matchedResults.length; i += batchSize) {
      const batch = matchedResults.slice(i, i + batchSize).map((r) => ({
        old_url_path: r.oldUrl,
        new_url_path: r.newUrl!,
        redirect_type: 301,
        content_type: r.contentType,
        source: "wordpress_migration",
        is_active: true,
      }));

      const { error } = await supabase.from("url_redirects").upsert(batch, {
        onConflict: "old_url_path",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        errors++;
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} redirects`);
      }
    }

    console.log(`\nTotal inserted: ${inserted}`);
    if (errors > 0) {
      console.log(`Batches with errors: ${errors}`);
    }
  } else {
    console.log("\n[DRY RUN] No changes made to database.");
    console.log("Run without --dry-run to insert redirects.");
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
