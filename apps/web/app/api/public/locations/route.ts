import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use anonymous client for public access
function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * GET /api/public/locations
 *
 * Returns distinct cruising areas/regions from public jobs.
 * Used for location filter dropdown on the public job board.
 *
 * Response: { locations: string[] }
 */
export async function GET() {
  try {
    const supabase = getPublicClient();

    // Get distinct primary_region values from public jobs
    const { data, error } = await supabase
      .from("public_jobs")
      .select("primary_region")
      .not("primary_region", "is", null);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch locations" },
        { status: 500 }
      );
    }

    // Extract unique values and sort
    const locations = [...new Set(data?.map((r) => r.primary_region))]
      .filter(Boolean)
      .sort();

    // Common yacht cruising regions for reference
    const commonRegions = [
      "Mediterranean",
      "Caribbean",
      "Bahamas",
      "Florida",
      "Pacific Northwest",
      "New England",
      "South Pacific",
      "Southeast Asia",
      "Indian Ocean",
      "Middle East",
      "Northern Europe",
      "Worldwide",
    ];

    // Sort locations: common regions first, then alphabetically
    const sortedLocations = locations.sort((a, b) => {
      const aIndex = commonRegions.indexOf(a);
      const bIndex = commonRegions.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return NextResponse.json({
      locations: sortedLocations,
      // Also return as value/label pairs for select components
      options: sortedLocations.map((loc) => ({
        value: loc,
        label: loc,
      })),
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
