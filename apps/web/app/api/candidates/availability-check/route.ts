import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAvailabilityCheck } from "@/lib/twilio/whatsapp";
import { z } from "zod";

const availabilityCheckSchema = z.object({
  candidateIds: z.array(z.string().uuid()).min(1).max(50),
  position: z.string().optional(),
  startDate: z.string().optional(),
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

    // Get user info
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

    // Parse request body
    const body = await request.json();
    const parseResult = availabilityCheckSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { candidateIds, position, startDate } = parseResult.data;

    // Fetch candidates with WhatsApp numbers
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select("id, first_name, last_name, phone, whatsapp")
      .in("id", candidateIds);

    if (candidatesError) {
      console.error("Failed to fetch candidates:", candidatesError);
      return NextResponse.json(
        { error: "Failed to fetch candidates" },
        { status: 500 }
      );
    }

    const results: {
      candidateId: string;
      candidateName: string;
      success: boolean;
      error?: string;
    }[] = [];

    // Send availability checks
    for (const candidate of candidates || []) {
      const phone = candidate.whatsapp || candidate.phone;
      const name = candidate.first_name || "there";

      if (!phone) {
        results.push({
          candidateId: candidate.id,
          candidateName: `${candidate.first_name} ${candidate.last_name}`,
          success: false,
          error: "No phone number available",
        });
        continue;
      }

      const result = await sendAvailabilityCheck({
        candidatePhone: phone,
        candidateName: name,
        position,
        startDate,
      });

      results.push({
        candidateId: candidate.id,
        candidateName: `${candidate.first_name} ${candidate.last_name}`,
        success: result.success,
        error: result.error,
      });

      // Log the activity
      if (result.success) {
        await supabase.from("activity_logs").insert({
          activity_type: "availability_check_sent",
          entity_type: "candidate",
          entity_id: candidate.id,
          user_id: userData.id,
          organization_id: userData.organization_id,
          metadata: {
            position,
            start_date: startDate,
            message_sid: result.sid,
          },
        });

        // Update candidate record to mark availability check sent
        await supabase
          .from("candidates")
          .update({
            last_availability_check: new Date().toISOString(),
          })
          .eq("id", candidate.id);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} availability checks (${failCount} failed)`,
      results,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get availability check status for candidates
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

    // Parse query params
    const candidateIds = request.nextUrl.searchParams.get("candidate_ids");

    if (!candidateIds) {
      return NextResponse.json(
        { error: "candidate_ids parameter is required" },
        { status: 400 }
      );
    }

    const ids = candidateIds.split(",");

    // Get last availability check for each candidate
    const { data, error } = await supabase
      .from("candidates")
      .select(
        "id, first_name, last_name, availability_status, last_availability_check"
      )
      .in("id", ids);

    if (error) {
      console.error("Failed to fetch candidates:", error);
      return NextResponse.json(
        { error: "Failed to fetch candidates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
