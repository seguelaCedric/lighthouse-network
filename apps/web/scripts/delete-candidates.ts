/**
 * Delete all candidates and relationships
 * Run: cd apps/web && npx tsx scripts/delete-candidates.ts
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
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex);
      let value = trimmed.slice(eqIndex + 1);
      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAll() {
  console.log("Deleting candidate_agency_relationships...");
  const { error: relError } = await supabase
    .from("candidate_agency_relationships")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (relError) {
    console.error("Relationship delete error:", relError.message);
  } else {
    console.log("Relationships deleted");
  }

  console.log("Deleting candidates...");
  const { error: candError } = await supabase
    .from("candidates")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (candError) {
    console.error("Candidate delete error:", candError.message);
  } else {
    console.log("Candidates deleted");
  }

  // Count remaining
  const { count } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true });

  console.log("Remaining candidates:", count);
}

deleteAll().catch(console.error);
