import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";

/**
 * GET /api/client/jobs
 * Get all jobs for the authenticated client with application counts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get jobs for this client with submission counts
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        position_category,
        vessel_name,
        vessel_type,
        vessel_size_meters,
        contract_type,
        start_date,
        end_date,
        primary_region,
        status,
        is_urgent,
        created_at,
        published_at,
        submissions_count,
        views_count
      `)
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    // Get submission stats for each job
    const jobsWithStats = await Promise.all(
      (jobs || []).map(async (job) => {
        const { data: submissions } = await supabase
          .from("submissions")
          .select("id, status")
          .eq("job_id", job.id);

        const submissionStats = {
          total: submissions?.length || 0,
          shortlisted: submissions?.filter((s) => s.status === "shortlisted").length || 0,
          interviewing: submissions?.filter((s) => s.status === "interviewing").length || 0,
          offered: submissions?.filter((s) => s.status === "offer").length || 0,
        };

        return {
          ...job,
          submission_stats: submissionStats,
        };
      })
    );

    return NextResponse.json({ data: jobsWithStats });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
