/**
 * Quick import script for a single page
 * Run with: node scripts/import-page-now.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "./apps/web/.env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables. Please check apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseWordPressUrl(url) {
  const urlObj = new URL(url);
  const urlPath = urlObj.pathname.replace(/^\/|\/$/g, "");
  const parts = urlPath.split("/");

  const firstPart = parts[0];
  const match = firstPart.match(/^hire-a-(.+)-([a-z-]+)$/i);
  if (!match) return null;

  const positionSlug = match[1];
  const countrySlug = match[2];
  const stateSlug = parts[1] || null;
  const citySlug = parts[2] || null;

  function slugToTitle(slug) {
    return slug
      .replace(/-\d+$/, "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return {
    position: slugToTitle(positionSlug),
    position_slug: positionSlug,
    country: slugToTitle(countrySlug),
    country_slug: countrySlug,
    state: stateSlug ? slugToTitle(stateSlug) : null,
    state_slug: stateSlug,
    city: citySlug ? slugToTitle(citySlug) : null,
    city_slug: citySlug,
    original_url_path: urlPath,
  };
}

async function importPage() {
  const url = "https://www.lighthouse-careers.com/hire-a-butler-australia/new-south-wale/sydney-2/";
  
  console.log("Importing page:", url);
  
  const parsed = parseWordPressUrl(url);
  if (!parsed) {
    console.error("Failed to parse URL");
    process.exit(1);
  }

  const page = {
    ...parsed,
    meta_title: "Hire a butler Sydney",
    meta_description: "Find vetted Butler professionals in Sydney. Lighthouse Careers - 500+ satisfied clients, 300+ placements per year.",
    hero_headline: "Hire a butler Sydney",
    hero_subheadline: null,
    intro_content: "With more than 2 decades of experience assigning high calibre butlers on luxury yachts, the idea to transition yacht crew into private households came from growing demand from both yacht owners looking for the same high standards of service on their private estates, and an increasing number of candidates wishing to settle down and move ashore.",
    benefits: [
      "Exclusive Talent Pool: Access to over 32,000 top-quality candidates across yachting and private household industries.",
      "Trusted by the Elite: Our clients include some of the world's most influential individuals and organizations.",
      "Success Fee Model: No placement, no fee – only pay when we deliver the perfect candidate",
      "Confidential & Discreet: Ensuring complete privacy and discretion for our high-profile, international clients.",
    ],
    form_heading: "Ready to hire your next rare talent?",
    cta_text: "Receive candidates today",
    is_active: true,
  };

  console.log("\nPage data:");
  console.log(JSON.stringify(page, null, 2));

  const { data, error } = await supabase
    .from("seo_landing_pages")
    .upsert(page, { onConflict: "original_url_path" })
    .select()
    .single();

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("\n✅ Page imported successfully!");
  console.log(`   ID: ${data.id}`);
  console.log(`   URL: ${data.original_url_path}`);
  console.log(`   Title: ${data.hero_headline}`);
}

importPage().catch(console.error);
