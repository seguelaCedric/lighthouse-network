import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import { sendEmail, isResendConfigured } from "@/lib/email/client";
import { employerBriefReceivedEmail } from "@/lib/email/templates";

// Validation schema for creating a brief
const createBriefSchema = z.object({
  hiring_for: z.enum(["yacht", "household", "both"]),
  title: z.string().optional(),
  vessel_name: z.string().optional(),
  vessel_type: z.string().optional(),
  vessel_size: z.string().optional(),
  property_type: z.string().optional(),
  property_location: z.string().optional(),
  positions_needed: z.array(z.string()).min(1, "At least one position is required"),
  experience_years: z.string().optional(),
  additional_requirements: z.string().optional(),
  timeline: z.string().optional(),
  contract_type: z.enum(["permanent", "rotational", "seasonal", "temporary", ""]).optional(),
  notes: z.string().optional(),
});

// Helper to get employer session
async function getEmployerSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("employer_session")?.value;

  if (!sessionToken) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .rpc("validate_employer_session", { p_session_token: sessionToken });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

// GET - List briefs for the current employer
export async function GET() {
  try {
    const session = await getEmployerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch briefs for this employer
    const { data: briefs, error } = await supabase
      .from("employer_briefs")
      .select("*")
      .eq("employer_id", session.employer_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching briefs:", error);
      return NextResponse.json(
        { error: "Failed to fetch briefs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ briefs: briefs || [] });
  } catch (error) {
    console.error("Error in GET /api/employer/briefs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new brief
export async function POST(request: NextRequest) {
  try {
    const session = await getEmployerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createBriefSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate title if not provided
    const title = data.title || `${data.positions_needed[0]}${data.positions_needed.length > 1 ? ` +${data.positions_needed.length - 1} more` : ""}`;

    // Create the brief
    const { data: brief, error } = await supabase
      .from("employer_briefs")
      .insert({
        employer_id: session.employer_id,
        title,
        hiring_for: data.hiring_for,
        vessel_name: data.vessel_name || null,
        vessel_type: data.vessel_type || null,
        vessel_size_meters: data.vessel_size ? parseInt(data.vessel_size, 10) : null,
        property_type: data.property_type || null,
        property_location: data.property_location || null,
        positions_needed: data.positions_needed,
        experience_years_min: data.experience_years ? parseInt(data.experience_years, 10) : null,
        additional_requirements: data.additional_requirements || null,
        timeline: data.timeline || null,
        contract_type: data.contract_type || null,
        notes: data.notes || null,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating brief:", error);
      return NextResponse.json(
        { error: "Failed to create brief" },
        { status: 500 }
      );
    }

    // Send confirmation email to employer
    if (isResendConfigured()) {
      // Get employer email
      const { data: employer } = await supabase
        .from("employer_accounts")
        .select("email, contact_name")
        .eq("id", session.employer_id)
        .single();

      if (employer) {
        const emailData = employerBriefReceivedEmail({
          contactName: employer.contact_name,
          briefTitle: title,
          positions: data.positions_needed,
          hiringFor: data.hiring_for,
          vesselName: data.vessel_name || undefined,
          propertyLocation: data.property_location || undefined,
          timeline: data.timeline || undefined,
        });

        const emailResult = await sendEmail({
          to: employer.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        if (!emailResult.success) {
          console.error("Failed to send brief received email:", emailResult.error);
        }
      }
    }

    return NextResponse.json({ brief }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/employer/briefs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
