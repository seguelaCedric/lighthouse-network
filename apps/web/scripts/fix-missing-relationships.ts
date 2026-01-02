/**
 * Fix Missing Agency Relationships
 *
 * This script creates agency relationships for candidates that were synced
 * from Vincere but don't have relationships (causing them to be hidden by RLS).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("🔍 Finding candidates with vincere_id but no agency relationship...\n");

  // Get all candidates with vincere_id
  const { data: candidates, error: candError } = await db
    .from("candidates")
    .select("id, vincere_id, first_name, last_name")
    .not("vincere_id", "is", null);

  if (candError) {
    console.error("Failed to fetch candidates:", candError.message);
    process.exit(1);
  }

  if (!candidates || candidates.length === 0) {
    console.log("No candidates with vincere_id found.");
    return;
  }

  console.log(`Found ${candidates.length} candidates with vincere_id`);

  // Get existing relationships
  const { data: existingRels, error: relError } = await db
    .from("candidate_agency_relationships")
    .select("candidate_id")
    .eq("agency_id", DEFAULT_ORG_ID);

  if (relError) {
    console.error("Failed to fetch relationships:", relError.message);
    process.exit(1);
  }

  const existingCandidateIds = new Set((existingRels || []).map(r => r.candidate_id));
  const missingCandidates = candidates.filter(c => !existingCandidateIds.has(c.id));

  console.log(`${existingRels?.length || 0} already have relationships`);
  console.log(`${missingCandidates.length} need relationships created\n`);

  if (missingCandidates.length === 0) {
    console.log("✅ All candidates already have agency relationships!");
    return;
  }

  // Create missing relationships
  let created = 0;
  let failed = 0;

  for (const candidate of missingCandidates) {
    const { error } = await db
      .from("candidate_agency_relationships")
      .insert({
        candidate_id: candidate.id,
        agency_id: DEFAULT_ORG_ID,
        relationship_type: "vincere_sync",
        is_exclusive: false,
        agency_candidate_id: candidate.vincere_id,
      });

    if (error) {
      console.log(`❌ ${candidate.first_name} ${candidate.last_name}: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${candidate.first_name} ${candidate.last_name}`);
      created++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(console.error);
