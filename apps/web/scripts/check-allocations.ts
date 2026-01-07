/**
 * Check where staff members, about content, and candidates are allocated
 * 
 * Usage:
 *   cd apps/web && npx tsx scripts/check-allocations.ts
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

const MAIN_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DUPLICATE_ORG_ID = "c4e1e6ff-b71a-4fbd-bb31-dd282d981436";

async function main() {
  console.log("=".repeat(60));
  console.log("Allocation Check: Staff, About, Candidates");
  console.log("=".repeat(60));
  console.log("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Check Team Members (Staff)
    console.log("1. TEAM MEMBERS (Staff):");
    console.log("   Table: team_members");
    console.log("   Allocation field: organization_id");
    console.log("");

    const { data: teamMembers, error: tmError } = await supabase
      .from("team_members")
      .select("id, name, organization_id")
      .order("created_at", { ascending: true });

    if (tmError) throw tmError;

    if (!teamMembers || teamMembers.length === 0) {
      console.log("   No team members found.");
    } else {
      const byOrg = teamMembers.reduce((acc, member) => {
        const orgId = member.organization_id;
        if (!acc[orgId]) acc[orgId] = [];
        acc[orgId].push(member);
        return acc;
      }, {} as Record<string, typeof teamMembers>);

      for (const [orgId, members] of Object.entries(byOrg)) {
        const orgName = orgId === MAIN_ORG_ID ? "✅ Main (Lighthouse)" : orgId === DUPLICATE_ORG_ID ? "❌ Duplicate (deleted)" : "⚠️  Other";
        console.log(`   ${orgName}: ${members.length} member(s)`);
        if (members.length <= 5) {
          members.forEach(m => console.log(`      - ${m.name}`));
        } else {
          members.slice(0, 3).forEach(m => console.log(`      - ${m.name}`));
          console.log(`      ... and ${members.length - 3} more`);
        }
      }
    }

    // 2. Check About Page Content
    console.log("\n2. ABOUT PAGE CONTENT:");
    console.log("   Uses: getPrimaryAgencyId() function");
    console.log("   This function selects the primary agency based on:");
    console.log("     - Slug = 'lighthouse'");
    console.log("     - Most team members");
    console.log("     - Oldest created_at");
    console.log("");

    const { data: agencies } = await supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .eq("type", "agency");

    if (agencies && agencies.length > 0) {
      const lighthouseAgencies = agencies.filter(a => a.slug === "lighthouse");
      const candidates = lighthouseAgencies.length > 0 ? lighthouseAgencies : agencies;

      const counts = await Promise.all(
        candidates.map(async (agency) => {
          const { count } = await supabase
            .from("team_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", agency.id);
          return {
            id: agency.id,
            name: agency.name,
            slug: agency.slug,
            created_at: agency.created_at,
            team_count: count ?? 0,
          };
        })
      );

      counts.sort((a, b) => {
        if (b.team_count !== a.team_count) return b.team_count - a.team_count;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const primary = counts[0];
      console.log(`   Primary Agency: ${primary.name} (${primary.id})`);
      console.log(`   Team Members: ${primary.team_count}`);
      console.log(`   Slug: ${primary.slug || "N/A"}`);
      console.log("");
      console.log("   All agencies:");
      counts.forEach((a, i) => {
        const marker = i === 0 ? "✅" : "  ";
        console.log(`   ${marker} ${a.name} (${a.id}) - ${a.team_count} team members`);
      });
    }

    // 3. Check Candidates
    console.log("\n3. CANDIDATES:");
    console.log("   Table: candidates");
    console.log("   Allocation: via candidate_agency_relationships table");
    console.log("   Note: Candidates are linked to agencies through relationships");
    console.log("");

    const { count: totalCandidates } = await supabase
      .from("candidates")
      .select("id", { count: "exact", head: true });

    // Check relationships instead
    const { count: mainRelationships } = await supabase
      .from("candidate_agency_relationships")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", MAIN_ORG_ID);

    const { count: duplicateRelationships } = await supabase
      .from("candidate_agency_relationships")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", DUPLICATE_ORG_ID);

    const { data: otherRelationships } = await supabase
      .from("candidate_agency_relationships")
      .select("agency_id")
      .neq("agency_id", MAIN_ORG_ID)
      .neq("agency_id", DUPLICATE_ORG_ID);

    const otherOrgCounts = otherRelationships?.reduce((acc, r) => {
      const orgId = r.agency_id;
      if (orgId) acc[orgId] = (acc[orgId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Check candidates without relationships
    const { data: candidatesWithRels } = await supabase
      .from("candidate_agency_relationships")
      .select("candidate_id");

    const relCandidateIds = new Set(candidatesWithRels?.map(r => r.candidate_id) || []);
    const { count: candidatesWithoutRels } = await supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .not("id", "in", `(${Array.from(relCandidateIds).join(",")})`);

    console.log(`   Total Candidates: ${totalCandidates || 0}`);
    console.log(`   ✅ Main Org Relationships: ${mainRelationships || 0}`);
    console.log(`   ❌ Duplicate Org Relationships: ${duplicateRelationships || 0}`);
    console.log(`   ⚠️  Candidates without relationships: ${candidatesWithoutRels || 0}`);
    if (Object.keys(otherOrgCounts).length > 0) {
      console.log(`   ⚠️  Other organizations:`);
      for (const [orgId, count] of Object.entries(otherOrgCounts)) {
        console.log(`      - ${orgId}: ${count} relationships`);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log("");
    console.log(`Main Organization ID: ${MAIN_ORG_ID}`);
    console.log("");
    
    const needsMigration: string[] = [];
    if ((duplicateRelationships || 0) > 0) needsMigration.push(`${duplicateRelationships} candidate relationships`);
    if ((candidatesWithoutRels || 0) > 0) needsMigration.push(`${candidatesWithoutRels} candidates without relationships`);
    if (Object.keys(otherOrgCounts).length > 0) needsMigration.push(`candidate relationships in other orgs`);

    const teamMembersInWrongOrg = teamMembers?.filter(tm => 
      tm.organization_id !== MAIN_ORG_ID && tm.organization_id !== DUPLICATE_ORG_ID
    ) || [];
    if (teamMembersInWrongOrg.length > 0) {
      needsMigration.push(`${teamMembersInWrongOrg.length} team members`);
    }

    if (needsMigration.length > 0) {
      console.log("⚠️  Items that may need migration:");
      needsMigration.forEach(item => console.log(`   - ${item}`));
    } else {
      console.log("✅ All items are properly allocated to the main organization!");
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

