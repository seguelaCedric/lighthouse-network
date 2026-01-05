import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get employer enquiry stats for candidate
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the users table record first (links auth.users to our app users)
  const { data: dbUser, error: dbUserError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (dbUserError || !dbUser) {
    return NextResponse.json(
      { error: "User profile not found" },
      { status: 404 }
    );
  }

  // Get candidate ID using the users.id
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: "Candidate profile not found" },
      { status: 404 }
    );
  }

  // Get stats using RPC function (may not exist if migration not applied)
  let stats = null;
  try {
    const { data, error: statsError } = await supabase.rpc(
      "get_employer_enquiry_stats",
      { p_candidate_id: candidate.id }
    );
    if (!statsError) {
      stats = data;
    } else {
      console.error("Error fetching stats:", statsError);
    }
  } catch (e) {
    console.error("RPC get_employer_enquiry_stats not available:", e);
  }

  // Get eligibility
  let eligibility = null;
  try {
    const { data, error: eligibilityError } = await supabase.rpc(
      "can_submit_employer_enquiry",
      { p_candidate_id: candidate.id }
    );
    if (!eligibilityError) {
      eligibility = data;
    } else {
      console.error("Error checking eligibility:", eligibilityError);
    }
  } catch (e) {
    console.error("RPC can_submit_employer_enquiry not available:", e);
  }

  // Get program settings
  let settings = null;
  try {
    const { data } = await supabase
      .from("employer_enquiry_settings")
      .select("*")
      .single();
    settings = data;
  } catch (e) {
    console.error("employer_enquiry_settings table not available:", e);
  }

  return NextResponse.json({
    stats: stats?.[0] || {
      total_enquiries: 0,
      submitted: 0,
      under_review: 0,
      verified: 0,
      invalid: 0,
      total_jobs_created: 0,
      total_placements: 0,
      pending_rewards: 0,
      approved_rewards: 0,
      total_earned: 0,
    },
    eligibility: eligibility?.[0] || {
      can_submit: true,
      enquiries_this_month: 0,
      monthly_limit: 10,
    },
    program: settings || {
      program_active: true,
      placement_reward: 20000,
      max_enquiries_per_month: 10,
    },
  });
}
