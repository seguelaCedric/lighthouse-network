/**
 * Shortlist API Endpoints
 * Manage shortlisted candidates for a job
 *
 * GET    /api/jobs/{id}/shortlist - Get shortlist for a job
 * POST   /api/jobs/{id}/shortlist - Add candidates to shortlist
 * PUT    /api/jobs/{id}/shortlist - Reorder shortlist
 * DELETE /api/jobs/{id}/shortlist - Remove candidate from shortlist
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schemas
const addToShortlistSchema = z.object({
  candidates: z.array(
    z.object({
      candidateId: z.string().uuid(),
      source: z.enum(["internal", "yotspot"]),
      yotspotUrl: z.string().url().optional(),
      matchScore: z.number().min(0).max(100).optional(),
      matchReasoning: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
});

const reorderShortlistSchema = z.object({
  applicationIds: z.array(z.string().uuid()),
});

const removeFromShortlistSchema = z.object({
  candidateId: z.string().uuid(),
});

/**
 * GET /api/jobs/{id}/shortlist
 * Fetch shortlisted candidates for a job with full candidate details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Verify job exists and user has access
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, created_by_agency_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Fetch shortlisted candidates with full details
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select(
        `
        id,
        candidate_id,
        stage,
        shortlist_rank,
        shortlist_notes,
        match_score,
        ai_match_reasoning,
        candidate_source,
        yotspot_profile_url,
        shortlisted_at,
        shortlisted_by,
        candidate:candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          photo_url,
          primary_position,
          years_experience,
          nationality,
          availability_status,
          available_from,
          verification_tier,
          has_stcw,
          has_eng1,
          has_schengen,
          has_b1b2
        )
      `
      )
      .eq("job_id", jobId)
      .eq("stage", "shortlisted")
      .order("shortlist_rank", { ascending: true, nullsFirst: false })
      .order("match_score", { ascending: false, nullsFirst: true });

    if (appsError) {
      console.error("Error fetching shortlist:", appsError);
      return NextResponse.json(
        { error: "Failed to fetch shortlist" },
        { status: 500 }
      );
    }

    // Format response
    const shortlist = (applications || []).map((app, index) => ({
      applicationId: app.id,
      candidateId: app.candidate_id,
      rank: app.shortlist_rank ?? index + 1,
      notes: app.shortlist_notes,
      matchScore: app.match_score,
      matchReasoning: app.ai_match_reasoning,
      source: app.candidate_source || "internal",
      yotspotUrl: app.yotspot_profile_url,
      shortlistedAt: app.shortlisted_at,
      shortlistedBy: app.shortlisted_by,
      candidate: app.candidate,
    }));

    return NextResponse.json({
      data: {
        jobId,
        jobTitle: job.title,
        candidates: shortlist,
        totalCount: shortlist.length,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /shortlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/{id}/shortlist
 * Add one or more candidates to the shortlist
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details for agency_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = addToShortlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { candidates } = validation.data;

    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get current max rank
    const { data: maxRankResult } = await supabase
      .from("applications")
      .select("shortlist_rank")
      .eq("job_id", jobId)
      .eq("stage", "shortlisted")
      .order("shortlist_rank", { ascending: false })
      .limit(1)
      .single();

    let nextRank = (maxRankResult?.shortlist_rank ?? 0) + 1;

    const results: Array<{ candidateId: string; applicationId: string; success: boolean; error?: string }> = [];

    for (const candidate of candidates) {
      try {
        // Check if application already exists
        const { data: existingApp } = await supabase
          .from("applications")
          .select("id, stage")
          .eq("job_id", jobId)
          .eq("candidate_id", candidate.candidateId)
          .eq("agency_id", userData.organization_id)
          .single();

        if (existingApp) {
          // Update existing application to shortlisted
          const { data: updatedApp, error: updateError } = await supabase
            .from("applications")
            .update({
              stage: "shortlisted",
              stage_changed_at: new Date().toISOString(),
              stage_changed_by: userData.id,
              shortlist_rank: nextRank,
              shortlist_notes: candidate.notes,
              match_score: candidate.matchScore,
              ai_match_reasoning: candidate.matchReasoning,
              candidate_source: candidate.source,
              yotspot_profile_url: candidate.yotspotUrl,
              shortlisted_at: new Date().toISOString(),
              shortlisted_by: userData.id,
            })
            .eq("id", existingApp.id)
            .select("id")
            .single();

          if (updateError) {
            results.push({
              candidateId: candidate.candidateId,
              applicationId: existingApp.id,
              success: false,
              error: updateError.message,
            });
          } else {
            results.push({
              candidateId: candidate.candidateId,
              applicationId: updatedApp?.id || existingApp.id,
              success: true,
            });
            nextRank++;
          }
        } else {
          // Create new application
          const { data: newApp, error: insertError } = await supabase
            .from("applications")
            .insert({
              job_id: jobId,
              candidate_id: candidate.candidateId,
              agency_id: userData.organization_id,
              stage: "shortlisted",
              stage_changed_at: new Date().toISOString(),
              stage_changed_by: userData.id,
              shortlist_rank: nextRank,
              shortlist_notes: candidate.notes,
              match_score: candidate.matchScore,
              ai_match_reasoning: candidate.matchReasoning,
              candidate_source: candidate.source,
              yotspot_profile_url: candidate.yotspotUrl,
              shortlisted_at: new Date().toISOString(),
              shortlisted_by: userData.id,
              source: candidate.source === "yotspot" ? "yotspot_import" : "ai_match",
            })
            .select("id")
            .single();

          if (insertError) {
            results.push({
              candidateId: candidate.candidateId,
              applicationId: "",
              success: false,
              error: insertError.message,
            });
          } else {
            results.push({
              candidateId: candidate.candidateId,
              applicationId: newApp?.id || "",
              success: true,
            });
            nextRank++;
          }
        }
      } catch (err) {
        results.push({
          candidateId: candidate.candidateId,
          applicationId: "",
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      data: {
        added: successCount,
        total: candidates.length,
        results,
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /shortlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/{id}/shortlist
 * Reorder shortlist by providing application IDs in desired order
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = reorderShortlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { applicationIds } = validation.data;

    // Update ranks in order
    const updates = applicationIds.map((appId, index) =>
      supabase
        .from("applications")
        .update({ shortlist_rank: index + 1 })
        .eq("id", appId)
        .eq("job_id", jobId)
        .eq("stage", "shortlisted")
    );

    await Promise.all(updates);

    return NextResponse.json({
      data: {
        success: true,
        reordered: applicationIds.length,
      },
    });
  } catch (error) {
    console.error("Unexpected error in PUT /shortlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/{id}/shortlist
 * Remove a candidate from the shortlist
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    // Parse request body
    const body = await request.json();
    const validation = removeFromShortlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { candidateId } = validation.data;

    // Update application to remove from shortlist (move back to screening)
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        stage: "screening",
        stage_changed_at: new Date().toISOString(),
        stage_changed_by: userData?.id,
        shortlist_rank: null,
        shortlisted_at: null,
        shortlisted_by: null,
      })
      .eq("job_id", jobId)
      .eq("candidate_id", candidateId)
      .eq("stage", "shortlisted");

    if (updateError) {
      console.error("Error removing from shortlist:", updateError);
      return NextResponse.json(
        { error: "Failed to remove from shortlist" },
        { status: 500 }
      );
    }

    // Re-rank remaining shortlisted candidates
    const { data: remaining } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("stage", "shortlisted")
      .order("shortlist_rank", { ascending: true });

    if (remaining && remaining.length > 0) {
      const reranks = remaining.map((app, index) =>
        supabase
          .from("applications")
          .update({ shortlist_rank: index + 1 })
          .eq("id", app.id)
      );
      await Promise.all(reranks);
    }

    return NextResponse.json({
      data: {
        success: true,
        removed: candidateId,
      },
    });
  } catch (error) {
    console.error("Unexpected error in DELETE /shortlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
