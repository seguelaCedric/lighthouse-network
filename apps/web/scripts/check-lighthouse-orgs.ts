/**
 * Check Lighthouse Organizations in Database
 * 
 * This script identifies which Lighthouse organization is actually being used
 * and which one should be deleted.
 * 
 * Usage:
 *   cd apps/web && npx tsx scripts/check-lighthouse-orgs.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Manually load .env.local since tsx doesn't do it automatically
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Try multiple locations for .env.local
const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "..", ".env.local"),
  resolve(process.cwd(), "../..", ".env.local"),
];

for (const p of possiblePaths) {
  if (existsSync(p)) {
    loadEnvFile(p);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Lighthouse Organizations Analysis");
  console.log("=".repeat(60));
  console.log("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓" : "✗");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Find all Lighthouse organizations
    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .or("name.ilike.%lighthouse%,slug.ilike.%lighthouse%")
      .order("created_at", { ascending: true });

    if (orgError) {
      throw orgError;
    }

    if (!orgs || orgs.length === 0) {
      console.log("No Lighthouse organizations found.");
      return;
    }

    console.log(`Found ${orgs.length} Lighthouse organization(s):\n`);

    // Analyze each organization
    for (const org of orgs) {
      console.log(`Organization: ${org.name}`);
      console.log(`  ID: ${org.id}`);
      console.log(`  Slug: ${org.slug || "N/A"}`);
      console.log(`  Type: ${org.type}`);
      console.log(`  Created: ${org.created_at}`);

      // Count candidates
      const { count: candidateCount } = await supabase
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id);

      // Count jobs
      const { count: jobCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("created_by_agency_id", org.id);

      // Count agency relationships
      const { count: relationshipCount } = await supabase
        .from("candidate_agency_relationships")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", org.id);

      // Count users
      const { count: userCount } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id);

      console.log(`  Candidates: ${candidateCount || 0}`);
      console.log(`  Jobs: ${jobCount || 0}`);
      console.log(`  Agency Relationships: ${relationshipCount || 0}`);
      console.log(`  Users: ${userCount || 0}`);

      const totalUsage = (candidateCount || 0) + (jobCount || 0) + (relationshipCount || 0) + (userCount || 0);
      console.log(`  Total Usage: ${totalUsage}`);
      console.log("");
    }

    // Determine which one to keep
    const orgsWithUsage = orgs.map((org) => {
      return supabase
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .then(({ count: candidateCount }) => {
          return supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .eq("created_by_agency_id", org.id)
            .then(({ count: jobCount }) => {
              return supabase
                .from("candidate_agency_relationships")
                .select("id", { count: "exact", head: true })
                .eq("agency_id", org.id)
                .then(({ count: relationshipCount }) => {
                  return supabase
                    .from("users")
                    .select("id", { count: "exact", head: true })
                    .eq("organization_id", org.id)
                    .then(({ count: userCount }) => {
                      const totalUsage =
                        (candidateCount || 0) +
                        (jobCount || 0) +
                        (relationshipCount || 0) +
                        (userCount || 0);
                      return { org, totalUsage };
                    });
                });
            });
        });
    });

    const results = await Promise.all(orgsWithUsage);
    results.sort((a, b) => b.totalUsage - a.totalUsage);

    console.log("=".repeat(60));
    console.log("Recommendation:");
    console.log("=".repeat(60));
    console.log("");

    if (results.length >= 2) {
      const [keep, remove] = results;
      console.log(`✅ KEEP: ${keep.org.name} (ID: ${keep.org.id})`);
      console.log(`   Usage: ${keep.totalUsage} records`);
      console.log("");
      console.log(`❌ DELETE: ${remove.org.name} (ID: ${remove.org.id})`);
      console.log(`   Usage: ${remove.totalUsage} records`);
      console.log("");

      // Check if the one to delete has any data
      if (remove.totalUsage > 0) {
        console.log("⚠️  WARNING: The organization to delete has some usage!");
        console.log("   You may need to migrate data first.");
      } else {
        console.log("✅ Safe to delete - no usage found.");
      }
    } else {
      console.log("Only one organization found - no action needed.");
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

