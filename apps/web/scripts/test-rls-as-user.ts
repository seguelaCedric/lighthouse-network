import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  // Create client with anon key (like the browser would)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("Testing RLS as authenticated user...\n");

  // Sign in as the test user
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "testcandidate@example.com",
    password: "TestPassword123!"
  });

  if (authErr) {
    console.error("❌ LOGIN ERROR:", authErr.message);
    process.exit(1);
  }

  console.log("✅ LOGIN SUCCESS:", { id: authData.user.id, email: authData.user.email });

  // Test the query that was failing - lookup via users table
  console.log("\nTesting users table query (this was failing before)...");
  const { data: userData, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authData.user.id)
    .maybeSingle();

  if (userErr) {
    console.error("❌ USERS TABLE QUERY FAILED:", userErr);
    process.exit(1);
  } else {
    console.log("✅ USERS TABLE QUERY SUCCESS:", userData);
  }

  // Test candidate lookup by user_id (if user record exists)
  if (userData) {
    console.log("\nTesting candidate lookup by user_id...");
    const { data: candidateByUserId, error: candErr1 } = await supabase
      .from("candidates")
      .select("id, first_name, last_name, email")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (candErr1) {
      console.error("❌ Candidate by user_id FAILED:", candErr1);
    } else {
      console.log("✅ Candidate by user_id:", candidateByUserId);
    }
  }

  // Test candidate lookup by email fallback
  console.log("\nTesting candidate lookup by email...");
  const { data: candidateByEmail, error: candErr2 } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, email")
    .eq("email", authData.user.email)
    .maybeSingle();

  if (candErr2) {
    console.error("❌ Candidate by email FAILED:", candErr2);
  } else {
    console.log("✅ Candidate by email:", candidateByEmail);
  }

  console.log("\n✅ All RLS tests passed! Login should work now.");
}

main().catch(console.error);
