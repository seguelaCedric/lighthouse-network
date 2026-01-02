import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const sendLinkSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = sendLinkSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if employer account exists
    const { data: account, error: fetchError } = await supabase
      .from("employer_accounts")
      .select("id, contact_name")
      .eq("email", email)
      .single();

    if (fetchError || !account) {
      // Don't reveal if account exists or not for security
      // But still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a login link.",
      });
    }

    // Generate magic token using the database function
    const { data: token, error: tokenError } = await supabase
      .rpc("generate_employer_magic_token", { p_employer_id: account.id });

    if (tokenError) {
      console.error("Error generating magic token:", tokenError);
      return NextResponse.json(
        { error: "Failed to generate login link. Please try again." },
        { status: 500 }
      );
    }

    // TODO: Send email with magic link
    // For now, log the token (in production, this would send an email)
    console.log(`Magic link for ${email}: /employer/auth/verify?token=${token}`);

    // In production, send email here:
    // await sendEmployerMagicLinkEmail(email, account.contact_name, token);

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a login link.",
    });
  } catch (error) {
    console.error("Send magic link error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
