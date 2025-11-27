import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, clientPortalInviteEmail, isResendConfigured } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's agency
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User not associated with an agency" },
        { status: 403 }
      );
    }

    // Get client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, portal_email, portal_enabled, primary_contact_name")
      .eq("id", id)
      .eq("agency_id", userData.organization_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!client.portal_email) {
      return NextResponse.json(
        { error: "Client has no portal email set" },
        { status: 400 }
      );
    }

    if (!client.portal_enabled) {
      return NextResponse.json(
        { error: "Portal access is not enabled for this client" },
        { status: 400 }
      );
    }

    // Generate magic link token
    const { data: token, error: tokenError } = await supabase.rpc(
      "generate_client_magic_link",
      { p_client_id: client.id }
    );

    if (tokenError) {
      console.error("Error generating magic link:", tokenError);
      return NextResponse.json(
        { error: "Failed to generate invitation link" },
        { status: 500 }
      );
    }

    // Build magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const magicLink = `${baseUrl}/client/auth/verify?token=${token}`;

    // Send email if Resend is configured
    if (isResendConfigured()) {
      const emailContent = clientPortalInviteEmail({
        clientName: client.name,
        contactName: client.primary_contact_name || undefined,
        magicLink,
        expiresIn: "24 hours",
      });

      const emailResult = await sendEmail({
        to: client.portal_email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (!emailResult.success) {
        console.error("Failed to send invitation email:", emailResult.error);
        return NextResponse.json(
          { error: "Failed to send invitation email. Please try again." },
          { status: 500 }
        );
      }

      console.log(`Invitation email sent to ${client.portal_email} (ID: ${emailResult.id})`);
    } else {
      // Development fallback - log the link
      console.log("=== Client Portal Invitation (dev mode - no email configured) ===");
      console.log(`Email: ${client.portal_email}`);
      console.log(`Client: ${client.name}`);
      console.log(`Contact: ${client.primary_contact_name || "N/A"}`);
      console.log(`Link: ${magicLink}`);
      console.log("================================================================");
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
