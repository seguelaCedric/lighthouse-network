import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";
import { z } from "zod";
import { sendEmail, isResendConfigured } from "@/lib/email/client";
import { clientBriefNotificationEmail } from "@/lib/email/templates";

const createBriefSchema = z.object({
  // Basic info
  position: z.string().min(1, "Position is required"),
  positionCategory: z.string().optional(),

  // Yacht details
  yachtName: z.string().optional(),
  yachtType: z.enum(["motor", "sailing", "catamaran", "explorer", "expedition", "classic"]).optional(),
  yachtSize: z.number().optional(),

  // Contract
  contractType: z.enum(["permanent", "rotational", "seasonal", "temporary"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // Salary
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default("EUR"),

  // Requirements
  requirements: z.array(z.string()).optional(),
  notes: z.string().optional(),

  // Raw text (for paste/AI parsing)
  rawText: z.string().optional(),
  inputMethod: z.enum(["form", "chat", "paste"]).default("form"),
});

/**
 * GET /api/client/briefs
 * Get all briefs submitted by the client
 */
export async function GET() {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get briefs for this client
    const { data: briefs, error } = await supabase
      .from("briefs")
      .select("*")
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch briefs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: briefs || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/briefs
 * Submit a new brief from the client portal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const supabase = await createClient();

    // Get client details for the brief
    const { data: client } = await supabase
      .from("clients")
      .select("agency_id, vessel_name, vessel_type, vessel_size")
      .eq("id", session.clientId)
      .single();

    // Create the brief
    const { data: brief, error: insertError } = await supabase
      .from("briefs")
      .insert({
        client_id: session.clientId,
        agency_id: client?.agency_id,

        // Position info
        title: briefData.position,
        position_category: briefData.positionCategory,

        // Yacht details (use client's vessel info as fallback)
        vessel_name: briefData.yachtName || client?.vessel_name,
        vessel_type: briefData.yachtType || client?.vessel_type,
        vessel_size_meters: briefData.yachtSize || client?.vessel_size,

        // Contract
        contract_type: briefData.contractType,
        start_date: briefData.startDate,
        end_date: briefData.endDate,

        // Salary
        salary_min: briefData.salaryMin,
        salary_max: briefData.salaryMax,
        salary_currency: briefData.salaryCurrency,

        // Requirements stored as JSONB
        requirements: {
          items: briefData.requirements || [],
          notes: briefData.notes,
        },

        // Raw content for AI processing
        raw_text: briefData.rawText,
        input_method: briefData.inputMethod,

        // Status
        status: "submitted",
        source: "client_portal",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json(
        { error: "Failed to create brief" },
        { status: 500 }
      );
    }

    // Send notification to agency recruiters
    if (isResendConfigured() && client?.agency_id) {
      try {
        // Get agency recruiters to notify
        const { data: recruiters } = await supabase
          .from("users")
          .select("email, full_name")
          .eq("agency_id", client.agency_id)
          .in("user_type", ["recruiter", "admin"]);

        // Get client name for the notification
        const { data: clientData } = await supabase
          .from("clients")
          .select("name, contact_name")
          .eq("id", session.clientId)
          .single();

        const clientName = clientData?.name || clientData?.contact_name || "Unknown Client";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lighthouse-careers.com";

        if (recruiters && recruiters.length > 0) {
          // Send notification to each recruiter
          await Promise.all(
            recruiters.map(async (recruiter) => {
              const emailData = clientBriefNotificationEmail({
                recruiterName: recruiter.full_name || "Team",
                clientName,
                position: briefData.position,
                vesselName: brief.vessel_name,
                vesselType: brief.vessel_type,
                vesselSize: brief.vessel_size_meters,
                contractType: brief.contract_type,
                startDate: brief.start_date,
                briefId: brief.id,
                dashboardLink: `${baseUrl}/admin/briefs/${brief.id}`,
              });

              await sendEmail({
                to: recruiter.email,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
              });
            })
          );
        }
      } catch (emailError) {
        // Log but don't fail the request
        console.error("Failed to send recruiter notifications:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: brief,
        message: "Brief submitted successfully. We'll review and send candidates within 24 hours.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
