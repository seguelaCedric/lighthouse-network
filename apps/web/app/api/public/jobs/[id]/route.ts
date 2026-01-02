import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getPublicClient();

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Fetch job from public_jobs view
    const { data: job, error } = await supabase
      .from("public_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch job" },
        { status: 500 }
      );
    }

    // Increment view count (fire and forget)
    supabase.rpc("increment_job_views", { p_job_id: id }).then(() => {}, (err) => {
      console.error("Failed to increment views:", err);
    });

    // Fetch similar jobs (same position category, excluding this job)
    const { data: similarJobs } = await supabase
      .from("public_jobs")
      .select("id, title, primary_region, salary_min, salary_max, salary_currency, vessel_type, contract_type, created_at")
      .eq("position_category", job.position_category)
      .neq("id", id)
      .limit(3);

    return NextResponse.json({
      data: job,
      similarJobs: similarJobs || [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
