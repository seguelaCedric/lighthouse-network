import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVincereClient } from "@/lib/vincere/client";
import {
  getUpdatedSince,
  getCandidateWithCustomFields,
} from "@/lib/vincere/candidates";
import { mapVincereToCandidate, getInterviewNotes } from "@/lib/vincere/sync";
import { z } from "zod";

const syncRequestSchema = z.object({
  sinceDate: z.string().datetime().optional(),
  vincereIds: z.array(z.number()).optional(),
  fullSync: z.boolean().optional(),
});

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

    // Get user's info - must be admin or have vincere access
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id, role")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parseResult = syncRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { sinceDate, vincereIds, fullSync } = parseResult.data;

    // Check if Vincere is configured
    if (
      !process.env.VINCERE_API_URL ||
      !process.env.VINCERE_CLIENT_ID ||
      !process.env.VINCERE_API_KEY
    ) {
      return NextResponse.json(
        { error: "Vincere integration is not configured" },
        { status: 400 }
      );
    }

    let vincere;
    try {
      vincere = getVincereClient();
    } catch {
      return NextResponse.json(
        { error: "Failed to initialize Vincere client" },
        { status: 500 }
      );
    }

    const results = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: 0,
      errorDetails: [] as string[],
    };

    // Determine which candidates to sync
    let vincereCandidates: number[] = [];

    if (vincereIds && vincereIds.length > 0) {
      // Sync specific candidates
      vincereCandidates = vincereIds;
    } else if (sinceDate || !fullSync) {
      // Sync candidates updated since a date (or last sync)
      const since = sinceDate
        ? new Date(sinceDate)
        : (() => {
            // Get last sync date from organization settings
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() - 7); // Default to 7 days ago
            return defaultDate;
          })();

      try {
        const updatedCandidates = await getUpdatedSince(since, 100, vincere);
        vincereCandidates = updatedCandidates.map((c) => c.id);
      } catch (error) {
        console.error("Failed to get updated candidates from Vincere:", error);
        return NextResponse.json(
          { error: "Failed to fetch candidates from Vincere" },
          { status: 500 }
        );
      }
    }

    // Process each candidate
    for (const vincereId of vincereCandidates) {
      try {
        // Get candidate data from Vincere
        const vincereData = await getCandidateWithCustomFields(
          vincereId,
          vincere
        );

        if (!vincereData) {
          results.errors++;
          results.errorDetails.push(`Candidate ${vincereId} not found`);
          continue;
        }

        // Map Vincere data to our schema
        const candidateData = mapVincereToCandidate(
          vincereData.candidate,
          vincereData.customFields
        );

        // Add organization ID
        candidateData.organization_id = userData.organization_id;

        // Check if candidate exists in our database
        const { data: existingCandidate } = await supabase
          .from("candidates")
          .select("id")
          .eq("vincere_id", vincereId.toString())
          .eq("organization_id", userData.organization_id)
          .single();

        if (existingCandidate) {
          // Update existing candidate
          const { error: updateError } = await supabase
            .from("candidates")
            .update(candidateData)
            .eq("id", existingCandidate.id);

          if (updateError) {
            results.errors++;
            results.errorDetails.push(
              `Failed to update candidate ${vincereId}: ${updateError.message}`
            );
          } else {
            results.updated++;
          }
        } else {
          // Create new candidate
          const { data: newCandidate, error: createError } = await supabase
            .from("candidates")
            .insert(candidateData)
            .select("id")
            .single();

          if (createError) {
            results.errors++;
            results.errorDetails.push(
              `Failed to create candidate ${vincereId}: ${createError.message}`
            );
          } else {
            results.created++;

            // If there are interview notes, add them as a note
            const interviewNotes = getInterviewNotes(vincereData.customFields);
            if (interviewNotes && newCandidate) {
              await supabase.from("candidate_notes").insert({
                candidate_id: newCandidate.id,
                content: interviewNotes,
                created_by: userData.id,
                note_type: "interview",
              });
            }
          }
        }

        results.synced++;
      } catch (error) {
        results.errors++;
        results.errorDetails.push(
          `Error processing candidate ${vincereId}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Update last sync timestamp for the organization
    await supabase
      .from("organizations")
      .update({
        vincere_last_sync: new Date().toISOString(),
      })
      .eq("id", userData.organization_id);

    // Log the sync activity
    await supabase.from("activity_logs").insert({
      activity_type: "vincere_sync",
      entity_type: "candidate",
      user_id: userData.id,
      organization_id: userData.organization_id,
      metadata: {
        synced: results.synced,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Synced ${results.synced} candidates (${results.created} created, ${results.updated} updated, ${results.errors} errors)`,
      results,
    });
  } catch (error) {
    console.error("Unexpected error during Vincere sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET() {
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

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Get organization's last sync timestamp
    const { data: org } = await supabase
      .from("organizations")
      .select("vincere_last_sync")
      .eq("id", userData.organization_id)
      .single();

    // Get count of synced candidates
    const { count: syncedCount } = await supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", userData.organization_id)
      .not("vincere_id", "is", null);

    // Check if Vincere is configured
    const isConfigured = Boolean(
      process.env.VINCERE_API_URL &&
        process.env.VINCERE_CLIENT_ID &&
        process.env.VINCERE_API_KEY
    );

    return NextResponse.json({
      isConfigured,
      lastSync: org?.vincere_last_sync || null,
      syncedCandidates: syncedCount || 0,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
