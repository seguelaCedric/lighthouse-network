import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";
import { z } from "zod";

const feedbackSchema = z.object({
  submissionId: z.string().uuid(),
  rating: z.enum(["interested", "maybe", "not_suitable"]),
  notes: z.string().optional(),
  rejectionReason: z
    .enum(["experience", "skills", "availability", "salary", "location", "other"])
    .optional(),
});

/**
 * POST /api/client/jobs/[id]/feedback
 * Submit feedback on a candidate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = feedbackSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { submissionId, rating, notes, rejectionReason } = parseResult.data;

    const supabase = await createClient();

    // Verify the job belongs to this client
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, client_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.client_id !== session.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the submission belongs to this job
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, job_id, candidate_id")
      .eq("id", submissionId)
      .eq("job_id", jobId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Update the submission with feedback
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        client_feedback_rating: rating,
        client_feedback_notes: notes || null,
        client_feedback_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    // Also save to client_candidate_feedback table for detailed tracking
    const { error: feedbackError } = await supabase
      .from("client_candidate_feedback")
      .upsert(
        {
          client_id: session.clientId,
          submission_id: submissionId,
          job_id: jobId,
          candidate_id: submission.candidate_id,
          rating,
          notes: notes || null,
          rejection_reason: rating === "not_suitable" ? rejectionReason : null,
        },
        {
          onConflict: "client_id,submission_id",
        }
      );

    if (feedbackError) {
      console.error("Feedback table error:", feedbackError);
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      message: "Feedback saved successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
