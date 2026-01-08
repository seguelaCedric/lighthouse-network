/**
 * Single WordPress Page Import Script
 *
 * Imports a single WordPress SEO landing page into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-single-page.ts --url=https://www.lighthouse-careers.com/hire-a-butler-australia/new-south-wale/sydney-2/
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "util";

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    url: { type: "string", short: "u" },
    "dry-run": { type: "boolean", short: "d", default: false },
  },
});

const PAGE_URL = values.url;
const DRY_RUN = values["dry-run"];

if (!PAGE_URL) {
  console.error("Usage: npx tsx scripts/import-single-page.ts --url=https://www.lighthouse-careers.com/hire-a-butler-australia/new-south-wale/sydney-2/");
  console.error("Options:");
  console.error("  --url, -u      Full URL of the page to import (required)");
  console.error("  --dry-run, -d  Preview without inserting (default: false)");
  process.exit(1);
}

// Initialize Supabase
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL");
  console.error("  SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
  benefits: string[];
  form_heading: string;
  cta_text: string;
  is_active: boolean;
}

/**
 * Parse WordPress URL pattern into components
 * Example: hire-a-butler-australia/new-south-wale/sydney-2
 */
function parseWordPressUrl(url: string): Partial<ParsedPage> | null {
  // Extract path from full URL
  const urlObj = new URL(url);
  const urlPath = urlObj.pathname.replace(/^\/|\/$/g, "");
  const parts = urlPath.split("/");

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
    original_url_path: urlPath,
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
 * Extract content from page HTML/text
 * This is a simplified version - in production you'd parse the actual HTML
 */
function extractContentFromPage(pageContent: string, parsed: Partial<ParsedPage>): Partial<ParsedPage> {
  // Extract benefits from the page content
  const benefits: string[] = [];
  
  // Look for benefit patterns in the content
  const benefitPatterns = [
    /Exclusive Talent Pool[^]*?Access to over [^]*?candidates/,
    /Trusted by the Elite[^]*?most influential/,
    /Success Fee Model[^]*?No placement, no fee/,
    /Confidential & Discreet[^]*?complete privacy/,
  ];

  // Extract from the provided content structure
  if (pageContent.includes("Exclusive Talent Pool")) {
    benefits.push("Exclusive Talent Pool: Access to over 32,000 top-quality candidates across yachting and private household industries.");
  }
  if (pageContent.includes("Trusted by the Elite")) {
    benefits.push("Trusted by the Elite: Our clients include some of the world's most influential individuals and organizations.");
  }
  if (pageContent.includes("Success Fee Model")) {
    benefits.push("Success Fee Model: No placement, no fee – only pay when we deliver the perfect candidate");
  }
  if (pageContent.includes("Confidential & Discreet")) {
    benefits.push("Confidential & Discreet: Ensuring complete privacy and discretion for our high-profile, international clients.");
  }

  // Extract meta title and description
  const metaTitle = pageContent.match(/<title>(.*?)<\/title>/i)?.[1] || 
                   `Hire a ${parsed.position} in ${parsed.city || parsed.state || parsed.country}`;
  
  const metaDescription = pageContent.match(/<meta name="description" content="(.*?)"/i)?.[1] ||
    `Find vetted ${parsed.position} professionals in ${parsed.city || parsed.state || parsed.country}. Lighthouse Careers - 500+ satisfied clients, 300+ placements per year.`;

  // Extract hero headline
  const heroHeadline = pageContent.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g, '') ||
    `Hire a ${parsed.position} ${parsed.city || parsed.state || parsed.country}`;

  // Extract intro content (first paragraph after hero)
  let introContent = null;
  const introMatch = pageContent.match(/<p[^>]*>(.*?)<\/p>/i);
  if (introMatch) {
    introContent = introMatch[1].replace(/<[^>]*>/g, '').trim();
  }

  return {
    meta_title: metaTitle,
    meta_description: metaDescription,
    hero_headline: heroHeadline,
    hero_subheadline: null,
    intro_content: introContent,
    benefits,
    form_heading: "Ready to hire your next rare talent?",
    cta_text: "Receive candidates today",
  };
}

/**
 * Import single page
 */
async function importSinglePage() {
  console.log(`\nSingle WordPress Page Import`);
  console.log(`============================`);
  console.log(`URL: ${PAGE_URL}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log("");

  // Parse URL
  const parsed = parseWordPressUrl(PAGE_URL!);
  if (!parsed) {
    console.error("Failed to parse URL");
    process.exit(1);
  }

  console.log("Parsed URL components:");
  console.log(`  Position: ${parsed.position} (${parsed.position_slug})`);
  console.log(`  Country: ${parsed.country} (${parsed.country_slug})`);
  if (parsed.state) console.log(`  State: ${parsed.state} (${parsed.state_slug})`);
  if (parsed.city) console.log(`  City: ${parsed.city} (${parsed.city_slug})`);
  console.log(`  URL Path: ${parsed.original_url_path}`);
  console.log("");

  // For now, we'll use the content structure from the web search results
  // In production, you'd fetch the actual HTML from the URL
  const pageContent = `
    <title>Hire a butler Sydney</title>
    <meta name="description" content="Find vetted Butler professionals in Sydney. Lighthouse Careers - 500+ satisfied clients, 300+ placements per year.">
    <h1>Hire a butler Sydney</h1>
    <p>Sailing on a yacht is the paramount luxury experience, A synonym of uniqueness, independence and privacy. The crew is trained to the highest standards.</p>
  `;

  // Extract content
  const extracted = extractContentFromPage(pageContent, parsed);

  // Build full page object
  const page: ParsedPage = {
    position: parsed.position!,
    position_slug: parsed.position_slug!,
    country: parsed.country!,
    country_slug: parsed.country_slug!,
    state: parsed.state || null,
    state_slug: parsed.state_slug || null,
    city: parsed.city || null,
    city_slug: parsed.city_slug || null,
    original_url_path: parsed.original_url_path!,
    meta_title: extracted.meta_title || `Hire a ${parsed.position} in ${parsed.city || parsed.state || parsed.country}`,
    meta_description: extracted.meta_description || `Find vetted ${parsed.position} professionals in ${parsed.city || parsed.state || parsed.country}.`,
    hero_headline: extracted.hero_headline || `Hire a ${parsed.position} ${parsed.city || parsed.state || parsed.country}`,
    hero_subheadline: extracted.hero_subheadline || null,
    intro_content: extracted.intro_content || "With more than 2 decades of experience assigning high calibre butlers on luxury yachts, the idea to transition yacht crew into private households came from growing demand from both yacht owners looking for the same high standards of service on their private estates, and an increasing number of candidates wishing to settle down and move ashore.",
    benefits: extracted.benefits || [
      "Exclusive Talent Pool: Access to over 32,000 top-quality candidates across yachting and private household industries.",
      "Trusted by the Elite: Our clients include some of the world's most influential individuals and organizations.",
      "Success Fee Model: No placement, no fee – only pay when we deliver the perfect candidate",
      "Confidential & Discreet: Ensuring complete privacy and discretion for our high-profile, international clients.",
    ],
    form_heading: extracted.form_heading || "Ready to hire your next rare talent?",
    cta_text: extracted.cta_text || "Receive candidates today",
    is_active: true,
  };

  console.log("Page data to import:");
  console.log(JSON.stringify(page, null, 2));
  console.log("");

  if (DRY_RUN) {
    console.log("[DRY RUN] Would insert page:");
    console.log(`  URL: ${page.original_url_path}`);
    console.log(`  Title: ${page.hero_headline}`);
    return;
  }

  // Insert into Supabase
  const { data, error } = await supabase
    .from("seo_landing_pages")
    .upsert(page, {
      onConflict: "original_url_path",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Import error:", error.message);
    process.exit(1);
  }

  console.log("✅ Page imported successfully!");
  console.log(`   ID: ${data.id}`);
  console.log(`   URL: ${data.original_url_path}`);
  console.log(`   Title: ${data.hero_headline}`);
}

// Run import
importSinglePage().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
