import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use anonymous/service client for public access
function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getPublicClient();

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const position = searchParams.get("position");
    const region = searchParams.get("region");
    const contractType = searchParams.get("contract_type");
    const minSalary = searchParams.get("min_salary");
    const maxSalary = searchParams.get("max_salary");
    const vesselType = searchParams.get("vessel_type");
    const sortBy = searchParams.get("sort_by") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const offset = (page - 1) * limit;

    // Build query using the public_jobs view
    let query = supabase
      .from("public_jobs")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (position) {
      query = query.eq("position_category", position);
    }

    if (region) {
      query = query.eq("primary_region", region);
    }

    if (contractType) {
      query = query.eq("contract_type", contractType);
    }

    if (vesselType) {
      query = query.eq("vessel_type", vesselType);
    }

    if (minSalary) {
      query = query.gte("salary_min", parseInt(minSalary));
    }

    if (maxSalary) {
      query = query.lte("salary_max", parseInt(maxSalary));
    }

    // Apply sorting
    switch (sortBy) {
      case "salary_high":
        query = query.order("salary_max", { ascending: false, nullsFirst: false });
        break;
      case "salary_low":
        query = query.order("salary_min", { ascending: true, nullsFirst: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    // Get filter options (distinct values for filters)
    const [positionsResult, regionsResult, vesselTypesResult] = await Promise.all([
      supabase
        .from("public_jobs")
        .select("position_category")
        .not("position_category", "is", null),
      supabase
        .from("public_jobs")
        .select("primary_region")
        .not("primary_region", "is", null),
      supabase
        .from("public_jobs")
        .select("vessel_type")
        .not("vessel_type", "is", null),
    ]);

    const positions = [...new Set(positionsResult.data?.map((r) => r.position_category))];
    const regions = [...new Set(regionsResult.data?.map((r) => r.primary_region))];
    const vesselTypes = [...new Set(vesselTypesResult.data?.map((r) => r.vessel_type))];

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: {
        positions: positions.filter(Boolean).sort(),
        regions: regions.filter(Boolean).sort(),
        vesselTypes: vesselTypes.filter(Boolean).sort(),
        contractTypes: ["permanent", "rotational", "seasonal", "temporary"],
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
