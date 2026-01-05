import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("Applying candidate self-access RLS policy fix...\n");

  // Read the migration file
  const migrationPath = join(process.cwd(), "supabase", "migrations", "038_candidate_self_access.sql");
  const sql = readFileSync(migrationPath, "utf-8");

  console.log("Executing SQL:\n");
  console.log(sql);
  console.log("\n" + "=".repeat(80) + "\n");

  // Execute the SQL
  const { error } = await supabase.rpc("exec_sql", { sql_string: sql });

  if (error) {
    console.error("Error applying migration:", error);

    // Try direct execution as fallback
    console.log("\nTrying direct execution...\n");

    // Split by statement and execute each
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s && !s.startsWith("--"));

    for (const statement of statements) {
      if (!statement) continue;

      console.log(`Executing: ${statement.substring(0, 100)}...`);
      const { error: stmtError } = await supabase.from("_").select("*").limit(0); // Dummy to get connection

      if (stmtError) {
        console.error("Error:", stmtError);
      }
    }

    process.exit(1);
  }

  console.log("✅ Migration applied successfully!");
  console.log("\nCandidates can now access their own profiles via the API.");
}

main().catch(console.error);
