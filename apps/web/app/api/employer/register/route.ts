import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sendEmail, isResendConfigured } from "@/lib/email/client";
import { employerWelcomeEmail } from "@/lib/email/templates";

// Validation schema
const registerSchema = z.object({
  contact_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  hiring_for: z.enum(["yacht", "household", "both"]),
  vessel_name: z.string().nullable().optional(),
  vessel_type: z.enum(["motor", "sail", "explorer", "catamaran", "other"]).nullable().optional(),
  vessel_size_meters: z.number().nullable().optional(),
  property_type: z.enum(["estate", "villa", "apartment", "townhouse", "chalet", "other"]).nullable().optional(),
  property_location: z.string().nullable().optional(),
  positions_needed: z.array(z.string()).min(1, "At least one position is required"),
  timeline: z.enum(["immediate", "1-2_weeks", "1_month", "exploring"]).nullable().optional(),
  additional_notes: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if email already exists
    const { data: existingAccount } = await supabase
      .from("employer_accounts")
      .select("id")
      .eq("email", data.email)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Get source tracking from headers/cookies
    const sourceUrl = request.headers.get("referer") || null;

    // Create the employer account
    const { data: newAccount, error: insertError } = await supabase
      .from("employer_accounts")
      .insert({
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        company_name: data.company_name,
        hiring_for: data.hiring_for,
        vessel_name: data.vessel_name,
        vessel_type: data.vessel_type,
        vessel_size_meters: data.vessel_size_meters,
        property_type: data.property_type,
        property_location: data.property_location,
        positions_needed: data.positions_needed,
        timeline: data.timeline,
        additional_notes: data.additional_notes,
        source_url: sourceUrl,
        tier: "basic",
        vetting_status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating employer account:", insertError);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    // Generate magic token using the database function
    const { data: tokenResult, error: tokenError } = await supabase
      .rpc("generate_employer_magic_token", { p_employer_id: newAccount.id });

    if (tokenError) {
      console.error("Error generating magic token:", tokenError);
      // Account created but token failed - still return success
      // User can request a new magic link from login page
    }

    // Send welcome email with magic link
    if (tokenResult) {
      const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://lighthouse-careers.com"}/employer/auth/verify?token=${tokenResult}`;

      if (isResendConfigured()) {
        const emailData = employerWelcomeEmail({
          contactName: data.contact_name,
          email: data.email,
          magicLink,
          hiringFor: data.hiring_for,
          companyName: data.company_name || undefined,
        });

        const emailResult = await sendEmail({
          to: data.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        if (!emailResult.success) {
          console.error("Failed to send employer welcome email:", emailResult.error);
        }
      } else {
        // Log for development
        console.log(`[DEV] Magic link for ${data.email}: ${magicLink}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Check your email for the login link.",
    });
  } catch (error) {
    console.error("Employer registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
