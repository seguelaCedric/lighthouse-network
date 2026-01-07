import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { candidateHasCV } from "@/lib/utils/candidate-cv";

/**
 * GET /api/utils/candidate-cv
 * Check if a candidate has a CV
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      );
    }

    const hasCV = await candidateHasCV(supabase, candidateId);

    return NextResponse.json({ hasCV });
  } catch (error) {
    console.error("Error checking CV:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

