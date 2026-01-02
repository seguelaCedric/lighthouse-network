/**
 * Apply RLS Fix for candidate_agency_relationships table
 *
 * This script adds the missing RLS policy that allows users to see
 * their agency's relationships in RLS subqueries.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("🔧 Applying RLS fix for candidate_agency_relationships...\n");

  // Drop existing policies if they exist and create new ones
  const sql = `
    -- Allow agencies to see their own relationships
    DROP POLICY IF EXISTS car_agency_access ON candidate_agency_relationships;
    CREATE POLICY car_agency_access ON candidate_agency_relationships
      FOR SELECT
      USING (
        agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
      );

    -- Allow agencies to manage relationships for their own candidates
    DROP POLICY IF EXISTS car_agency_manage ON candidate_agency_relationships;
    CREATE POLICY car_agency_manage ON candidate_agency_relationships
      FOR ALL
      USING (
        agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
      )
      WITH CHECK (
        agency_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
      );
  `;

  // Execute using rpc if available, or try direct SQL
  const { error } = await db.rpc('exec_sql', { sql_string: sql });

  if (error) {
    // Try using raw SQL query instead
    console.log("RPC not available, trying alternative approach...");

    // We can't execute raw SQL via the JS client directly
    // Let's check what policies exist
    const { data: policies, error: policyError } = await db
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'candidate_agency_relationships');

    if (policyError) {
      console.log("Cannot query policies directly. The SQL needs to be run manually.");
      console.log("\n📋 Please run this SQL in Supabase SQL Editor:\n");
      console.log(sql);
      console.log("\n🔗 Dashboard: https://supabase.com/dashboard/project/ozcuponldhepkdjmemvm/sql");
    } else {
      console.log("Existing policies:", policies);
    }
  } else {
    console.log("✅ RLS policies applied successfully!");
  }
}

main().catch(console.error);
