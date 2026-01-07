import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  applicationQuerySchema,
  createApplicationSchema,
} from "@/lib/validations/job";
import { trackReferralApplication } from "@/lib/referrals";
import { candidateHasCV } from "@/lib/utils/candidate-cv";
import type {
  ApplicationWithDetails,
  PaginatedResponse,
} from "@lighthouse/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    // Check job exists
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .is("deleted_at", null)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = applicationQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { stage, source, page, limit, sortBy, sortOrder } = parseResult.data;

    // Build query - fetch applications with candidate details
    let query = supabase
      .from("applications")
      .select(
        `
        *,
        candidate:candidates (
          id,
          first_name,
          last_name,
          email,
          phone,
          photo_url,
          primary_position,
          secondary_position,
          years_experience,
          nationality,
          availability_status,
          available_from,
          verification_tier,
          has_stcw,
          has_eng1,
          has_schengen,
          has_b1b2,
          has_c1d
        )
      `,
        { count: "exact" }
      )
      .eq("job_id", jobId);

    // Apply stage filter
    if (stage) {
      query = query.eq("stage", stage);
    }

    // Apply source filter
    if (source) {
      query = query.eq("source", source);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<ApplicationWithDetails> = {
      data: data ?? [],
      total,
      page,
      per_page: limit,
      total_pages: totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Check job exists
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .is("deleted_at", null)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = createApplicationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const applicationData = parseResult.data;

    // Check candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", applicationData.candidate_id)
      .is("deleted_at", null)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if candidate has a CV (required for applications)
    const hasCV = await candidateHasCV(supabase, applicationData.candidate_id);
    if (!hasCV) {
      return NextResponse.json(
        {
          error: "Candidate must have a CV before applying to jobs. Please ensure the candidate has uploaded a CV.",
        },
        { status: 403 }
      );
    }

    // Check if application already exists
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_id", applicationData.candidate_id)
      .single();

    if (existingApp) {
      return NextResponse.json(
        { error: "Candidate already has an application for this job" },
        { status: 409 }
      );
    }

    // Create application
    const { data, error } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        agency_id: userData.organization_id,
        applied_at: new Date().toISOString(),
        ...applicationData,
      })
      .select(
        `
        *,
        candidate:candidates (
          id,
          first_name,
          last_name,
          email,
          primary_position,
          verification_tier
        )
      `
      )
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create application" },
        { status: 500 }
      );
    }

    // Track referral milestone if this candidate was referred
    // This runs async in background, doesn't block response
    trackReferralApplication(applicationData.candidate_id).catch((err) => {
      console.error("Failed to track referral application:", err);
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
