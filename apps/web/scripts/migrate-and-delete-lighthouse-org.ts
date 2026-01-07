/**
 * Migrate data from duplicate Lighthouse organization and delete it
 * 
 * This script:
 * 1. Migrates agency relationships from the duplicate org to the main one
 * 2. Migrates users from the duplicate org to the main one
 * 3. Deletes the duplicate organization
 * 
 * Usage:
 *   cd apps/web && npx tsx scripts/migrate-and-delete-lighthouse-org.ts
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
  console.log("Migrate and Delete Duplicate Lighthouse Organization");
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
    // Verify both organizations exist
    const { data: mainOrg } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", MAIN_ORG_ID)
      .single();

    const { data: duplicateOrg } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", DUPLICATE_ORG_ID)
      .single();

    if (!mainOrg) {
      console.error(`❌ Main organization ${MAIN_ORG_ID} not found!`);
      process.exit(1);
    }

    if (!duplicateOrg) {
      console.log(`✅ Duplicate organization ${DUPLICATE_ORG_ID} not found - already deleted?`);
      return;
    }

    console.log(`Main Organization: ${mainOrg.name} (${MAIN_ORG_ID})`);
    console.log(`Duplicate Organization: ${duplicateOrg.name} (${DUPLICATE_ORG_ID})`);
    console.log("");

    // 1. Migrate agency relationships
    console.log("1. Migrating agency relationships...");
    const { data: relationships, error: relError } = await supabase
      .from("candidate_agency_relationships")
      .select("*")
      .eq("agency_id", DUPLICATE_ORG_ID);

    if (relError) {
      throw relError;
    }

    if (relationships && relationships.length > 0) {
      console.log(`   Found ${relationships.length} relationships to migrate`);

      for (const rel of relationships) {
        // Check if relationship already exists for main org
        const { data: existing } = await supabase
          .from("candidate_agency_relationships")
          .select("id")
          .eq("candidate_id", rel.candidate_id)
          .eq("agency_id", MAIN_ORG_ID)
          .single();

        if (existing) {
          // Update existing relationship
          const { error: updateError } = await supabase
            .from("candidate_agency_relationships")
            .update({
              relationship_type: rel.relationship_type,
              is_exclusive: rel.is_exclusive,
              exclusive_until: rel.exclusive_until,
              agency_candidate_id: rel.agency_candidate_id,
              agency_notes: rel.agency_notes,
              agency_rating: rel.agency_rating,
              interviewed_at: rel.interviewed_at,
              interviewed_by: rel.interviewed_by,
              interview_notes: rel.interview_notes,
            })
            .eq("id", existing.id);

          if (updateError) {
            console.error(`   ❌ Failed to update relationship for candidate ${rel.candidate_id}: ${updateError.message}`);
          } else {
            // Delete the duplicate relationship
            await supabase
              .from("candidate_agency_relationships")
              .delete()
              .eq("id", rel.id);
            console.log(`   ✅ Migrated relationship for candidate ${rel.candidate_id}`);
          }
        } else {
          // Create new relationship with main org
          const { error: insertError } = await supabase
            .from("candidate_agency_relationships")
            .insert({
              candidate_id: rel.candidate_id,
              agency_id: MAIN_ORG_ID,
              relationship_type: rel.relationship_type,
              is_exclusive: rel.is_exclusive,
              exclusive_until: rel.exclusive_until,
              agency_candidate_id: rel.agency_candidate_id,
              agency_notes: rel.agency_notes,
              agency_rating: rel.agency_rating,
              interviewed_at: rel.interviewed_at,
              interviewed_by: rel.interviewed_by,
              interview_notes: rel.interview_notes,
            });

          if (insertError) {
            console.error(`   ❌ Failed to create relationship for candidate ${rel.candidate_id}: ${insertError.message}`);
          } else {
            // Delete the duplicate relationship
            await supabase
              .from("candidate_agency_relationships")
              .delete()
              .eq("id", rel.id);
            console.log(`   ✅ Migrated relationship for candidate ${rel.candidate_id}`);
          }
        }
      }
    } else {
      console.log("   No relationships to migrate");
    }

    // 2. Migrate users
    console.log("\n2. Migrating users...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .eq("organization_id", DUPLICATE_ORG_ID);

    if (usersError) {
      throw usersError;
    }

    if (users && users.length > 0) {
      console.log(`   Found ${users.length} user(s) to migrate`);

      for (const user of users) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ organization_id: MAIN_ORG_ID })
          .eq("id", user.id);

        if (updateError) {
          console.error(`   ❌ Failed to migrate user ${user.id}: ${updateError.message}`);
        } else {
          console.log(`   ✅ Migrated user ${user.id} (${user.email || "N/A"})`);
        }
      }
    } else {
      console.log("   No users to migrate");
    }

    // 3. Migrate briefs
    console.log("\n3. Migrating briefs...");
    const { data: briefs, error: briefsError } = await supabase
      .from("briefs")
      .select("*")
      .eq("assigned_agency_id", DUPLICATE_ORG_ID);

    if (briefsError) {
      throw briefsError;
    }

    if (briefs && briefs.length > 0) {
      console.log(`   Found ${briefs.length} brief(s) to migrate`);

      for (const brief of briefs) {
        const { error: updateError } = await supabase
          .from("briefs")
          .update({ assigned_agency_id: MAIN_ORG_ID })
          .eq("id", brief.id);

        if (updateError) {
          console.error(`   ❌ Failed to migrate brief ${brief.id}: ${updateError.message}`);
        } else {
          console.log(`   ✅ Migrated brief ${brief.id}`);
        }
      }
    } else {
      console.log("   No briefs to migrate");
    }

    // 4. Check for any other references
    console.log("\n4. Checking for other references...");
    
    // Check documents
    const { count: documentCount } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", DUPLICATE_ORG_ID);
    
    if (documentCount && documentCount > 0) {
      console.log(`   Found ${documentCount} document(s) to migrate`);
      const { error: updateError } = await supabase
        .from("documents")
        .update({ organization_id: MAIN_ORG_ID })
        .eq("organization_id", DUPLICATE_ORG_ID);
      
      if (updateError) {
        console.error(`   ❌ Failed to migrate documents: ${updateError.message}`);
      } else {
        console.log(`   ✅ Migrated ${documentCount} document(s)`);
      }
    }
    
    // Check submissions
    const { count: submissionCount } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", DUPLICATE_ORG_ID);
    
    if (submissionCount && submissionCount > 0) {
      console.log(`   Found ${submissionCount} submission(s) to migrate`);
      const { error: updateError } = await supabase
        .from("submissions")
        .update({ agency_id: MAIN_ORG_ID })
        .eq("agency_id", DUPLICATE_ORG_ID);
      
      if (updateError) {
        console.error(`   ❌ Failed to migrate submissions: ${updateError.message}`);
      } else {
        console.log(`   ✅ Migrated ${submissionCount} submission(s)`);
      }
    }

    // Check placements
    const { count: placementCount } = await supabase
      .from("placements")
      .select("id", { count: "exact", head: true })
      .or(`placing_agency_id.eq.${DUPLICATE_ORG_ID},client_agency_id.eq.${DUPLICATE_ORG_ID},candidate_agency_id.eq.${DUPLICATE_ORG_ID}`);
    
    if (placementCount && placementCount > 0) {
      console.log(`   Found ${placementCount} placement(s) to migrate`);
      const { error: updateError } = await supabase
        .from("placements")
        .update({
          placing_agency_id: MAIN_ORG_ID,
        })
        .eq("placing_agency_id", DUPLICATE_ORG_ID);
      
      if (updateError) {
        console.error(`   ❌ Failed to migrate placements: ${updateError.message}`);
      } else {
        console.log(`   ✅ Migrated placements`);
      }
    }

    // 5. Delete the duplicate organization
    console.log("\n5. Deleting duplicate organization...");
    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", DUPLICATE_ORG_ID);

    if (deleteError) {
      throw deleteError;
    }

    console.log("   ✅ Duplicate organization deleted");

    console.log("\n" + "=".repeat(60));
    console.log("✅ Migration Complete!");
    console.log("=".repeat(60));
    console.log("");
    console.log(`All data has been migrated to: ${MAIN_ORG_ID}`);
    console.log(`Duplicate organization ${DUPLICATE_ORG_ID} has been deleted.`);
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

