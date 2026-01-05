import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96Y3Vwb25sZGhlcGtkam1lbXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5Njg4ODEsImV4cCI6MjA1MzU0NDg4MX0._O2u9tsG50EWCAfYexGN_pJClRY7ggth1n6x5qWSWKY";

async function testRLS() {
  // Create an anon client to simulate what the app does
  const anonClient = createClient(supabaseUrl, anonKey);

  // Sign in as test user
  const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
    email: "testcandidate@example.com",
    password: "TestPassword123!"
  });

  if (authErr) {
    console.log("Auth error:", authErr.message);
    return;
  }

  const user = authData.user;
  if (!user) {
    console.log("No user returned");
    return;
  }

  console.log("1. Signed in as:", user.email, "auth_id:", user.id);

  // Test users lookup
  const { data: userData, error: userErr } = await anonClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  console.log("2. Users lookup:", userData, userErr?.message || "OK");

  // Test candidate by user_id
  if (userData) {
    const { data: candByUserId, error: candErr1 } = await anonClient
      .from("candidates")
      .select("id, email, first_name")
      .eq("user_id", userData.id)
      .maybeSingle();
    console.log("3. Candidate by user_id:", candByUserId, candErr1?.message || "OK");
  }

  // Test candidate by email
  const { data: candByEmail, error: candErr2 } = await anonClient
    .from("candidates")
    .select("id, email, first_name")
    .eq("email", user.email || "")
    .maybeSingle();
  console.log("4. Candidate by email:", candByEmail, candErr2?.message || "OK");

  // Test get_current_user_id function
  const { data: funcResult, error: funcErr } = await anonClient.rpc("get_current_user_id");
  console.log("5. get_current_user_id():", funcResult, funcErr?.message || "OK");

  // Test get_current_user_email function
  const { data: emailResult, error: emailErr } = await anonClient.rpc("get_current_user_email");
  console.log("6. get_current_user_email():", emailResult, emailErr?.message || "OK");
}

testRLS();
