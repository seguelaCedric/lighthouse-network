/**
 * Delete all candidates from the database
 *
 * Run: cd apps/web && npx tsx scripts/delete-all-candidates.ts
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
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Try multiple locations for .env.local
const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"),
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const db = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=".repeat(60));
  console.log("Deleting all candidates from database");
  console.log("=".repeat(60));

  // First, check how many candidates exist
  const { count: beforeCount, error: countError } = await db
    .from("candidates")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error counting candidates:", countError.message);
    process.exit(1);
  }

  console.log(`\nFound ${beforeCount} candidates to delete\n`);

  // Delete candidate_agency_relationships first (foreign key constraint)
  console.log("1. Deleting candidate_agency_relationships...");
  const { error: relError } = await db
    .from("candidate_agency_relationships")
    .delete()
    .neq("candidate_id", "00000000-0000-0000-0000-000000000000"); // Matches all rows

  if (relError) {
    console.error("Error deleting relationships:", relError.message);
  } else {
    console.log("   ✅ Relationships deleted");
  }

  // Delete all candidates
  console.log("2. Deleting all candidates...");
  const { error: deleteError } = await db
    .from("candidates")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Matches all rows

  if (deleteError) {
    console.error("Error deleting candidates:", deleteError.message);
    process.exit(1);
  }

  // Verify deletion
  const { count: afterCount } = await db
    .from("candidates")
    .select("*", { count: "exact", head: true });

  console.log(`   ✅ Candidates deleted`);
  console.log(`\n📊 Result: ${beforeCount} → ${afterCount} candidates`);
  console.log("=".repeat(60));
  console.log("Done!");
  console.log("=".repeat(60));
}

main().catch(console.error);
