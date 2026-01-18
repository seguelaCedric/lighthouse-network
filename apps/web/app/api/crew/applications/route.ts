import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createErrorLogger, extractRequestContext } from "@/lib/error-logger";

// Query params schema for listing applications
const querySchema = z.object({
  status: z
    .enum(["all", "active", "rejected", "placed"])
    .default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * GET /api/crew/applications
 *
 * Get the authenticated candidate's job applications.
 * Requires the user to be logged in and have a linked candidate profile.
 */
export async function GET(request: NextRequest) {
  const logger = createErrorLogger(extractRequestContext(request));

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to view your applications" },
        { status: 401 }
      );
    }

    // Get the user record
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get candidate linked to this user
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", userData.id)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "No candidate profile found. Please complete your profile first." },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = querySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { status, page, limit } = parseResult.data;
    const offset = (page - 1) * limit;

    // Build query for applications with job details
    let query = supabase
      .from("applications")
      .select(
        `
        id,
        stage,
        source,
        match_score,
        applied_at,
        created_at,
        interview_scheduled_at,
        placed_at,
        rejection_reason,
        withdrawn_reason,
        job:jobs (
          id,
          title,
          vessel_type,
          vessel_size_meters,
          primary_region,
          contract_type,
          salary_min,
          salary_max,
          salary_currency,
          start_date,
          status,
          is_public,
          created_by_agency:organizations!jobs_created_by_agency_id_fkey (
            id,
            name
          )
        )
      `,
        { count: "exact" }
      )
      .eq("candidate_id", candidate.id)
      .order("applied_at", { ascending: false });

    // Apply status filter
    if (status === "active") {
      query = query.in("stage", ["applied", "screening", "shortlisted", "submitted", "interview", "offer"]);
    } else if (status === "rejected") {
      query = query.eq("stage", "rejected");
    } else if (status === "placed") {
      query = query.eq("stage", "placed");
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    // Get counts by status for the tabs
    const { data: statusCounts } = await supabase
      .from("applications")
      .select("stage")
      .eq("candidate_id", candidate.id);

    const counts = {
      all: statusCounts?.length || 0,
      active: statusCounts?.filter((a) =>
        ["applied", "screening", "shortlisted", "submitted", "interview", "offer"].includes(a.stage)
      ).length || 0,
      rejected: statusCounts?.filter((a) => a.stage === "rejected").length || 0,
      placed: statusCounts?.filter((a) => a.stage === "placed").length || 0,
    };

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      counts,
    });
  } catch (error) {
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: "crew/applications", operation: "list" },
    });
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
