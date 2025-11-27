import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";

/**
 * GET /api/client/jobs/[id]/shortlist
 * Get shortlisted candidates for a job (privacy-protected view)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;
    const supabase = await createClient();

    // Verify the job belongs to this client
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, client_id, vessel_name, status")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.client_id !== session.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get shortlisted submissions with candidate info (privacy-protected)
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select(`
        id,
        status,
        submitted_at,
        cover_note,
        match_score,
        match_reasoning,
        client_viewed_at,
        client_feedback_rating,
        client_feedback_notes,
        candidate_id,
        candidates (
          id,
          first_name,
          last_name,
          primary_position,
          years_experience,
          current_location,
          current_country,
          verification_tier,
          profile_summary,
          preferred_yacht_types,
          yacht_size_min,
          yacht_size_max
        )
      `)
      .eq("job_id", jobId)
      .in("status", ["shortlisted", "interviewing", "offer"])
      .order("match_score", { ascending: false });

    if (submissionsError) {
      console.error("Database error:", submissionsError);
      return NextResponse.json(
        { error: "Failed to fetch shortlist" },
        { status: 500 }
      );
    }

    // Transform data for client view (privacy-protected)
    const candidates = (submissions || []).map((submission) => {
      const candidate = submission.candidates as Record<string, unknown> | null;

      return {
        submissionId: submission.id,
        candidateId: submission.candidate_id,
        // Privacy: Only show first name and last initial
        firstName: candidate?.first_name || "Unknown",
        lastInitial: candidate?.last_name
          ? (candidate.last_name as string).charAt(0)
          : "",
        primaryPosition: candidate?.primary_position || "Unknown",
        yearsExperience: candidate?.years_experience || 0,
        currentLocation: candidate?.current_location || candidate?.current_country || "Unknown",
        verificationTier: candidate?.verification_tier || "basic",
        profileSummary: candidate?.profile_summary || "",
        matchScore: submission.match_score || 0,
        matchReasoning: submission.match_reasoning || "",
        coverNote: submission.cover_note || "",
        status: submission.status,
        submittedAt: submission.submitted_at,
        viewedAt: submission.client_viewed_at,
        feedback: submission.client_feedback_rating
          ? {
              rating: submission.client_feedback_rating,
              notes: submission.client_feedback_notes,
            }
          : null,
      };
    });

    // Mark submissions as viewed
    const unviewedIds = (submissions || [])
      .filter((s) => !s.client_viewed_at)
      .map((s) => s.id);

    if (unviewedIds.length > 0) {
      await supabase
        .from("submissions")
        .update({ client_viewed_at: new Date().toISOString() })
        .in("id", unviewedIds);
    }

    return NextResponse.json({
      data: {
        job: {
          id: job.id,
          title: job.title,
          vesselName: job.vessel_name,
          status: job.status,
        },
        candidates,
        totalCount: candidates.length,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
