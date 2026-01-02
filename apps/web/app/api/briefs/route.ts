import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { briefQuerySchema, createBriefSchema } from "@/lib/validations/brief";
import type { Brief, PaginatedResponse } from "@lighthouse/database";

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
    const parseResult = briefQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      search,
      status,
      source,
      client_id,
      agency_id,
      page,
      limit,
      sortBy,
      sortOrder,
    } = parseResult.data;

    // Build query
    let query = supabase.from("briefs").select("*", { count: "exact" });

    // Filter by agency (default to user's agency)
    const filterAgencyId = agency_id || userData?.organization_id;
    if (filterAgencyId) {
      query = query.eq("assigned_agency_id", filterAgencyId);
    }

    // Apply filters
    if (search) {
      query = query.ilike("raw_content", `%${search}%`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (source) {
      query = query.eq("source", source);
    }

    if (client_id) {
      query = query.eq("client_id", client_id);
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
        { error: "Failed to fetch briefs" },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<Brief> = {
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
        { error: "User must belong to an organization to create briefs" },
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
    const parseResult = createBriefSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const briefData = parseResult.data;

    // Insert brief with agency context
    const { data, error } = await supabase
      .from("briefs")
      .insert({
        ...briefData,
        assigned_agency_id: userData.organization_id,
        assigned_user_id: briefData.assigned_user_id || userData.id,
        received_at: briefData.received_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create brief" },
        { status: 500 }
      );
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
