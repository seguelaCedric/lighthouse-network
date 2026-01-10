import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { jobQuerySchema, createJobSchema } from "@/lib/validations/job";
import { processJobAlerts } from "@/lib/services/job-alert-service";
import type { Job, PaginatedResponse } from "@lighthouse/database";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("auth_id", user.id)
      .single();

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = jobQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      search,
      status,
      agency_id,
      client_id,
      position_category,
      contract_type,
      page,
      limit,
      sortBy,
      sortOrder,
    } = parseResult.data;

    // Build query - include client relationship
    let query = supabase
      .from("jobs")
      .select("*, client:clients(id, name, primary_contact_name, primary_contact_email)", { count: "exact" })
      .is("deleted_at", null);

    // Filter by agency (default to user's agency)
    const filterAgencyId = agency_id || userData?.organization_id;
    if (filterAgencyId) {
      query = query.eq("created_by_agency_id", filterAgencyId);
    }

    // Apply filters
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,vessel_name.ilike.%${search}%,requirements_text.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (client_id) {
      query = query.eq("client_id", client_id);
    }

    if (position_category) {
      query = query.eq("position_category", position_category);
    }

    if (contract_type) {
      query = query.eq("contract_type", contract_type);
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
        { error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<Job> = {
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization to create jobs" },
        { status: 403 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = createJobSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const jobData = parseResult.data;

    // Insert job with agency and user context
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        ...jobData,
        created_by_agency_id: userData.organization_id,
        created_by_user_id: userData.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create job" },
        { status: 500 }
      );
    }

    // Trigger job alerts if job is created with "open" status
    // This sends notifications to candidates whose positions match the job title
    if (data && jobData.status === "open") {
      // Process job alerts in the background (don't wait for it)
      processJobAlerts(data.id).catch((err) => {
        console.error("Error processing job alerts:", err);
      });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
