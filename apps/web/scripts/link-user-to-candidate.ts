import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error("Usage: npx tsx scripts/link-user-to-candidate.ts <email>");
    process.exit(1);
  }

  console.log(`Looking for auth user with email: ${userEmail}`);

  // Get auth user
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error("Auth error:", authError);
    process.exit(1);
  }

  const authUser = authData.users.find(u => u.email === userEmail);

  if (!authUser) {
    console.error(`No auth user found with email: ${userEmail}`);
    process.exit(1);
  }

  console.log(`Found auth user: ${authUser.id}`);

  // Check if users record exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  let userId: string;

  if (!existingUser) {
    console.log("Creating users record...");

    // All candidates belong to Lighthouse Careers organization
    const DEFAULT_LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";

    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        auth_id: authUser.id,
        email: userEmail,
        user_type: "candidate",
        organization_id: DEFAULT_LIGHTHOUSE_ORG_ID,
        full_name: authUser.user_metadata?.full_name || null,
      })
      .select()
      .single();

    if (userError) {
      console.error("User creation error:", userError);
      process.exit(1);
    }

    userId = newUser.id;
    console.log(`Created user record: ${userId}`);
  } else {
    userId = existingUser.id;
    console.log(`User record already exists: ${userId}`);
  }

  // Find candidate by email
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, email, user_id")
    .eq("email", userEmail)
    .single();

  if (candidateError || !candidate) {
    console.error(`No candidate found with email: ${userEmail}`);
    console.error("You may need to create a candidate record first.");
    process.exit(1);
  }

  console.log(`Found candidate: ${candidate.id} (${candidate.first_name} ${candidate.last_name})`);

  if (candidate.user_id) {
    console.log(`Candidate already linked to user: ${candidate.user_id}`);

    if (candidate.user_id === userId) {
      console.log("✅ Already correctly linked!");
    } else {
      console.log("⚠️  Candidate is linked to a DIFFERENT user!");
      console.log("This might be a duplicate. Please investigate.");
    }
    return;
  }

  // Link candidate to user
  console.log(`Linking candidate ${candidate.id} to user ${userId}...`);

  const { error: updateError } = await supabase
    .from("candidates")
    .update({ user_id: userId })
    .eq("id", candidate.id);

  if (updateError) {
    console.error("Link error:", updateError);
    process.exit(1);
  }

  console.log("✅ Successfully linked candidate to user!");
  console.log(`\nYou can now log in as: ${userEmail}`);
}

main().catch(console.error);
