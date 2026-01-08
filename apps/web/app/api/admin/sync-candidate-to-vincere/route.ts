import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncCandidateCreation } from "@/lib/vincere/sync-service";
import { searchByEmail } from "@/lib/vincere/candidates";
import { getVincereClient } from "@/lib/vincere/client";

/**
 * Admin endpoint to manually trigger Vincere sync for a candidate
 * POST /api/admin/sync-candidate-to-vincere
 * Body: { candidateId: string }
 *
 * Also supports GET for testing Vincere connectivity
 * GET /api/admin/sync-candidate-to-vincere?email=test@example.com
 */
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

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.role !== "admin" && userData?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Check Vincere configuration
    const vincereConfig = {
      VINCERE_CLIENT_ID: !!process.env.VINCERE_CLIENT_ID,
      VINCERE_API_KEY: !!process.env.VINCERE_API_KEY,
      VINCERE_REFRESH_TOKEN: !!process.env.VINCERE_REFRESH_TOKEN,
      allConfigured: !!(
        process.env.VINCERE_CLIENT_ID &&
        process.env.VINCERE_API_KEY &&
        process.env.VINCERE_REFRESH_TOKEN
      ),
    };

    // If email is provided, try to search for candidate in Vincere
    const email = request.nextUrl.searchParams.get("email");
    let vincereSearchResult = null;
    let vincereError = null;

    if (email && vincereConfig.allConfigured) {
      try {
        const client = getVincereClient();
        vincereSearchResult = await searchByEmail(email, client);
      } catch (err) {
        vincereError = err instanceof Error ? err.message : "Unknown error";
      }
    }

    return NextResponse.json({
      vincereConfig,
      searchEmail: email || null,
      vincereSearchResult,
      vincereError,
      message: vincereConfig.allConfigured
        ? "Vincere is configured. Use POST to sync a candidate."
        : "Vincere is NOT configured. Please set VINCERE_CLIENT_ID, VINCERE_API_KEY, and VINCERE_REFRESH_TOKEN environment variables.",
    });
  } catch (error) {
    console.error("[SyncCandidateToVincere] GET Error:", error);
    return NextResponse.json(
      {
        error: "Config check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.role !== "admin" && userData?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      );
    }

    // Check Vincere configuration
    const vincereConfig = {
      VINCERE_CLIENT_ID: !!process.env.VINCERE_CLIENT_ID,
      VINCERE_API_KEY: !!process.env.VINCERE_API_KEY,
      VINCERE_REFRESH_TOKEN: !!process.env.VINCERE_REFRESH_TOKEN,
      allConfigured: !!(
        process.env.VINCERE_CLIENT_ID &&
        process.env.VINCERE_API_KEY &&
        process.env.VINCERE_REFRESH_TOKEN
      ),
    };

    console.log("[SyncCandidateToVincere] Config check:", vincereConfig);

    if (!vincereConfig.allConfigured) {
      return NextResponse.json({
        success: false,
        error: "Vincere is not configured",
        vincereConfig,
        message: "Please set VINCERE_CLIENT_ID, VINCERE_API_KEY, and VINCERE_REFRESH_TOKEN environment variables.",
      });
    }

    // Attempt sync
    console.log("[SyncCandidateToVincere] Starting sync for candidate:", candidateId);

    const result = await syncCandidateCreation(candidateId);

    console.log("[SyncCandidateToVincere] Sync result:", result);

    return NextResponse.json({
      success: result.success,
      vincereId: result.vincereId,
      error: result.error,
      queued: result.queued,
      vincereConfig,
    });
  } catch (error) {
    console.error("[SyncCandidateToVincere] Error:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
