import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function main() {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check total candidates
  const { data: all, count: totalCount } = await db
    .from("candidates")
    .select("id, first_name, last_name, vincere_id, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(30);

  console.log(`Total candidates in database: ${totalCount}`);
  console.log("\nRecent candidates:");
  all?.forEach((c) => {
    const source = c.vincere_id ? `vincere:${c.vincere_id}` : "seed";
    console.log(`  ${c.first_name} ${c.last_name} - ${source} - ${c.created_at}`);
  });

  // Check relationships
  const { count: relCount } = await db
    .from("candidate_agency_relationships")
    .select("*", { count: "exact" });
  console.log(`\nTotal agency relationships: ${relCount}`);

  // Check which candidates have relationships for org
  const ORG_ID = "00000000-0000-0000-0000-000000000001";
  const { data: withRel } = await db
    .from("candidate_agency_relationships")
    .select("candidate_id")
    .eq("agency_id", ORG_ID);

  const relCandidateIds = new Set((withRel || []).map((r) => r.candidate_id));

  console.log(`\nCandidates with relationship to Lighthouse org: ${relCandidateIds.size}`);

  // Check candidates without relationship
  const withoutRel = all?.filter((c) => !relCandidateIds.has(c.id)) || [];
  console.log(`Candidates WITHOUT relationship (won't show on frontend): ${withoutRel.length}`);
  if (withoutRel.length > 0) {
    console.log("  Missing relationships for:");
    withoutRel.slice(0, 10).forEach((c) => {
      console.log(`    - ${c.first_name} ${c.last_name}`);
    });
  }
}

main().catch(console.error);
