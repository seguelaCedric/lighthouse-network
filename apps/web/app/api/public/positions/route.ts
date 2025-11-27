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
 * GET /api/public/positions
 *
 * Returns distinct position categories from public jobs.
 * Used for filter dropdowns on the public job board.
 *
 * Response: { positions: string[] }
 */
export async function GET() {
  try {
    const supabase = getPublicClient();

    // Get distinct position categories from public jobs
    const { data, error } = await supabase
      .from("public_jobs")
      .select("position_category")
      .not("position_category", "is", null);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch positions" },
        { status: 500 }
      );
    }

    // Extract unique values and sort
    const positions = [...new Set(data?.map((r) => r.position_category))]
      .filter(Boolean)
      .sort();

    // Map position categories to display labels
    const positionLabels: Record<string, string> = {
      deck: "Deck",
      interior: "Interior",
      engineering: "Engineering",
      galley: "Galley",
      captain: "Captain",
      medical: "Medical",
      childcare: "Childcare",
      security: "Security",
      management: "Management",
      other: "Other",
    };

    const positionsWithLabels = positions.map((p) => ({
      value: p,
      label: positionLabels[p] || p,
    }));

    return NextResponse.json({
      positions: positionsWithLabels,
      // Also return raw values for simpler use cases
      values: positions,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
