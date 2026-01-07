import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureJobWebhook, DEFAULT_JOB_WEBHOOK_EVENTS } from "@/lib/vincere";

/**
 * POST /api/vincere/webhooks/register
 * 
 * Convenience endpoint to register the job webhook.
 * Automatically uses the current domain to construct the webhook URL.
 * 
 * This endpoint will:
 * 1. Check for existing webhook with the same URL
 * 2. Delete it if found (to update it)
 * 3. Register a new webhook with job events
 */
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

    // Get the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const webhookUrl = `${baseUrl}/api/webhooks/vincere`;

    // Register the webhook
    const webhook = await ensureJobWebhook(
      webhookUrl,
      DEFAULT_JOB_WEBHOOK_EVENTS
    );

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
      },
      message: "Webhook registered successfully",
    });
  } catch (error) {
    console.error("Error registering webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to register webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

