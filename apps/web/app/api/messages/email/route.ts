import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const sendEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  entityType: z.enum(["candidate", "client"]).optional(),
  entityId: z.string().uuid().optional(),
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
      .select("id, first_name, last_name, email, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = sendEmailSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const emailData = parseResult.data;

    // Create HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="white-space: pre-wrap; line-height: 1.6;">${emailData.body}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #666; font-size: 14px;">
          Sent by ${userData.first_name} ${userData.last_name}<br />
          Lighthouse Crew Network
        </p>
      </div>
    `;

    // Send email
    const result = await sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      html: htmlBody,
      text: emailData.body,
      replyTo: userData.email,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Log communication (optional - if communications table exists)
    try {
      await supabase.from("communications").insert({
        type: "email",
        direction: "outbound",
        subject: emailData.subject,
        content: emailData.body,
        recipient_email: emailData.to,
        entity_type: emailData.entityType || null,
        entity_id: emailData.entityId || null,
        sent_by: userData.id,
        organization_id: userData.organization_id,
        external_id: result.id,
        status: "sent",
      });
    } catch (e) {
      // Communications table may not exist yet, ignore error
      console.log("Could not log communication:", e);
    }

    return NextResponse.json({
      data: {
        success: true,
        messageId: result.id,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
