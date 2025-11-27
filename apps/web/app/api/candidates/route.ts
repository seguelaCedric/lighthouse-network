import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  candidateQuerySchema,
  createCandidateSchema,
} from "@/lib/validations/candidate";
import type { Candidate, PaginatedResponse } from "../../../../../packages/database/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = candidateQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      search,
      position,
      availability,
      verification,
      minExperience,
      page,
      limit,
      sortBy,
      sortOrder,
    } = parseResult.data;

    // Build query
    let query = supabase
      .from("candidates")
      .select("*", { count: "exact" })
      .is("deleted_at", null);

    // Apply filters
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,primary_position.ilike.%${search}%`
      );
    }

    if (position) {
      query = query.or(
        `primary_position.ilike.%${position}%,secondary_position.ilike.%${position}%`
      );
    }

    if (availability) {
      query = query.eq("availability_status", availability);
    }

    if (verification !== undefined) {
      query = query.eq("verification_tier", verification);
    }

    if (minExperience !== undefined) {
      query = query.gte("years_experience", minExperience);
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
        { error: "Failed to fetch candidates" },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<Candidate> = {
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate input
    const parseResult = createCandidateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const candidateData = parseResult.data;

    // Insert candidate
    const { data, error } = await supabase
      .from("candidates")
      .insert(candidateData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

      // Handle unique constraint violations
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A candidate with this email already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create candidate" },
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
