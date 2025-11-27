import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";
import { createPlacementFee } from "@/lib/stripe/placement-fees";
import { trackReferralPlacement } from "@/lib/referrals";
import { z } from "zod";

const confirmPlacementSchema = z.object({
  submissionId: z.string().uuid(),
  jobId: z.string().uuid(),
  startDate: z.string().optional(),
  salary: z.number().optional(),
  salaryCurrency: z.string().optional(),
  salaryPeriod: z.enum(["monthly", "weekly", "daily", "annual"]).optional(),
  placementValue: z.number().optional(), // Total placement value in cents for fee calculation
  notes: z.string().optional(),
});

/**
 * GET /api/client/placements
 * Get all placements for the client
 */
export async function GET() {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get placements for this client
    const { data: placements, error } = await supabase
      .from("placements")
      .select(`
        id,
        start_date,
        salary,
        salary_currency,
        salary_period,
        status,
        notes,
        created_at,
        job_id,
        submission_id,
        candidate_id,
        jobs (
          id,
          title,
          vessel_name
        ),
        candidates (
          id,
          first_name,
          last_name,
          primary_position,
          verification_tier
        )
      `)
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch placements" },
        { status: 500 }
      );
    }

    // Transform data
    const transformedPlacements = (placements || []).map((placement) => {
      const job = placement.jobs as Record<string, unknown> | null;
      const candidate = placement.candidates as Record<string, unknown> | null;

      return {
        id: placement.id,
        startDate: placement.start_date,
        salary: placement.salary,
        salaryCurrency: placement.salary_currency,
        salaryPeriod: placement.salary_period,
        status: placement.status,
        notes: placement.notes,
        createdAt: placement.created_at,
        job: {
          id: job?.id,
          title: job?.title,
          vesselName: job?.vessel_name,
        },
        candidate: {
          id: candidate?.id,
          firstName: candidate?.first_name,
          lastInitial: candidate?.last_name
            ? (candidate.last_name as string).charAt(0)
            : "",
          position: candidate?.primary_position,
          verificationTier: candidate?.verification_tier,
        },
      };
    });

    return NextResponse.json({ data: transformedPlacements });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/placements
 * Confirm a placement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = confirmPlacementSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { submissionId, jobId, startDate, salary, salaryCurrency, salaryPeriod, placementValue, notes } =
      parseResult.data;

    const supabase = await createClient();

    // Verify the job belongs to this client
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, client_id, agency_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.client_id !== session.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the submission belongs to this job and get candidate_id
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, job_id, candidate_id, status")
      .eq("id", submissionId)
      .eq("job_id", jobId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if placement already exists
    const { data: existingPlacement } = await supabase
      .from("placements")
      .select("id")
      .eq("submission_id", submissionId)
      .single();

    if (existingPlacement) {
      return NextResponse.json(
        { error: "Placement already confirmed for this candidate" },
        { status: 400 }
      );
    }

    // Create placement record
    const { data: placement, error: insertError } = await supabase
      .from("placements")
      .insert({
        client_id: session.clientId,
        agency_id: job.agency_id,
        job_id: jobId,
        submission_id: submissionId,
        candidate_id: submission.candidate_id,
        start_date: startDate || null,
        salary: salary || null,
        salary_currency: salaryCurrency || null,
        salary_period: salaryPeriod || null,
        notes: notes || null,
        status: "confirmed",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json(
        { error: "Failed to confirm placement" },
        { status: 500 }
      );
    }

    // Update submission status to placed
    await supabase
      .from("submissions")
      .update({ status: "placed" })
      .eq("id", submissionId);

    // Update job status to filled
    await supabase
      .from("jobs")
      .update({ status: "filled", filled_at: new Date().toISOString() })
      .eq("id", jobId);

    // Update candidate availability
    await supabase
      .from("candidates")
      .update({
        availability_status: "placed",
        current_placement_id: placement.id,
      })
      .eq("id", submission.candidate_id);

    // Update client total placements
    await supabase.rpc("increment_client_placements", {
      client_uuid: session.clientId,
    });

    // Create placement fee record for the agency
    // Calculate placement value: use provided value, or estimate from annual salary
    let feeValue = placementValue;
    if (!feeValue && salary) {
      // Estimate annual value based on salary period
      switch (salaryPeriod) {
        case "monthly":
          feeValue = salary * 12; // Annual salary
          break;
        case "weekly":
          feeValue = salary * 52;
          break;
        case "daily":
          feeValue = salary * 260; // ~260 working days
          break;
        case "annual":
          feeValue = salary;
          break;
        default:
          feeValue = salary * 12; // Default to monthly assumption
      }
    }

    // Only create fee if we have a value to charge on
    if (feeValue && feeValue > 0) {
      try {
        await createPlacementFee(placement.id, job.agency_id, feeValue);
      } catch (feeError) {
        // Log error but don't fail the placement - fee can be created manually
        console.error("Failed to create placement fee:", feeError);
      }
    }

    // Track referral milestone if candidate was referred
    try {
      await trackReferralPlacement(submission.candidate_id);
    } catch (referralError) {
      // Non-critical - log and continue
      console.error("Failed to track referral placement:", referralError);
    }

    // Update agency subscription placements count
    try {
      await supabase.rpc("increment_agency_placements", {
        p_agency_id: job.agency_id,
      });
    } catch (subError) {
      // Non-critical - log and continue
      console.error("Failed to update subscription placements count:", subError);
    }

    // Create activity log
    await supabase.from("activity_logs").insert({
      activity_type: "placement_confirmed",
      entity_type: "job",
      entity_id: jobId,
      organization_id: job.agency_id,
      metadata: {
        placement_id: placement.id,
        submission_id: submissionId,
        candidate_id: submission.candidate_id,
        client_id: session.clientId,
        confirmed_by: "client",
      },
    });

    // TODO: Trigger notification to recruiter

    return NextResponse.json(
      {
        success: true,
        data: placement,
        message: "Placement confirmed successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
