/**
 * Generate AI content for pending SEO pages
 *
 * Run: cd apps/web && npx tsx scripts/generate-pending-seo-content.ts
 *
 * Options:
 *   --limit=N    Process only N pages (default: 5)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load env
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

// CLI args
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : undefined;
}

const limit = getArg("limit") ? parseInt(getArg("limit")!, 10) : 5;

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("=".repeat(60));
  console.log("Generate AI Content for Pending SEO Pages");
  console.log("=".repeat(60));
  console.log(`Limit: ${limit} pages\n`);

  // Get pending pages
  const { data: pendingPages, error: fetchError } = await supabase
    .from("seo_landing_pages")
    .select("id, position, country, state, city, original_url_path")
    .eq("ai_generation_status", "pending")
    .limit(limit);

  if (fetchError) {
    console.error("Failed to fetch pending pages:", fetchError);
    process.exit(1);
  }

  if (!pendingPages || pendingPages.length === 0) {
    console.log("No pending pages found.");
    process.exit(0);
  }

  console.log(`Found ${pendingPages.length} pending pages\n`);

  // Import AI module
  const { generateLandingPageContent } = await import("@lighthouse/ai");

  let successCount = 0;
  let failCount = 0;

  for (const page of pendingPages) {
    console.log(`\nProcessing: ${page.position} in ${page.city || page.state || page.country}`);
    console.log(`  URL: /${page.original_url_path}/`);

    // Mark as processing
    await supabase
      .from("seo_landing_pages")
      .update({ ai_generation_status: "processing" })
      .eq("id", page.id);

    try {
      console.log("  Generating content...");
      const generatedContent = await generateLandingPageContent({
        position: page.position,
        country: page.country,
        state: page.state,
        city: page.city,
      });

      // Update page with generated content
      const { error: updateError } = await supabase
        .from("seo_landing_pages")
        .update({
          about_position: generatedContent.about_position,
          location_info: generatedContent.location_info,
          service_description: generatedContent.service_description,
          process_details: generatedContent.process_details,
          faq_content: generatedContent.faq_content,
          primary_keywords: generatedContent.primary_keywords,
          secondary_keywords: generatedContent.secondary_keywords,
          ai_generation_status: "completed",
        })
        .eq("id", page.id);

      if (updateError) {
        throw updateError;
      }

      console.log("  ✓ Content generated successfully");
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed:`, error instanceof Error ? error.message : error);

      // Mark as failed
      await supabase
        .from("seo_landing_pages")
        .update({ ai_generation_status: "failed" })
        .eq("id", page.id);

      failCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("COMPLETE");
  console.log("=".repeat(60));
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  // Show remaining count
  const { count: remainingPending } = await supabase
    .from("seo_landing_pages")
    .select("id", { count: "exact", head: true })
    .eq("ai_generation_status", "pending");

  console.log(`Remaining pending: ${remainingPending || 0}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
