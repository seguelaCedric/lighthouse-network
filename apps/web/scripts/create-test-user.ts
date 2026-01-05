import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Create auth user with admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "testcandidate@example.com",
    password: "TestPassword123!",
    email_confirm: true,
    user_metadata: {
      first_name: "Test",
      last_name: "Candidate",
    }
  });

  if (authError) {
    console.error("Auth error:", authError);
    process.exit(1);
  }

  console.log("Auth user created:", authData.user.id);

  // Create users record
  // All candidates belong to Lighthouse Careers organization
  const DEFAULT_LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";

  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert({
      auth_id: authData.user.id,
      email: "testcandidate@example.com",
      user_type: "candidate",
      organization_id: DEFAULT_LIGHTHOUSE_ORG_ID,
    })
    .select()
    .single();

  if (userError) {
    console.error("User error:", userError);
    process.exit(1);
  }

  console.log("User record created:", userData.id);

  // Create candidate record
  const { data: candidateData, error: candidateError } = await supabase
    .from("candidates")
    .insert({
      user_id: userData.id,
      first_name: "Test",
      last_name: "Candidate",
      email: "testcandidate@example.com",
      primary_position: "chief_stewardess",
      availability_status: "available",
      years_experience: 5,
      nationality: "British",
    })
    .select()
    .single();

  if (candidateError) {
    console.error("Candidate error:", candidateError);
    process.exit(1);
  }

  console.log("Candidate record created:", candidateData.id);
  console.log("\nTest user created successfully!");
  console.log("Email: testcandidate@example.com");
  console.log("Password: TestPassword123!");
}

main();
