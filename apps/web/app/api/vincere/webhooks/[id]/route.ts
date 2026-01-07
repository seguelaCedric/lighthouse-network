import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVincereClient, updateWebhook, deleteWebhook } from "@/lib/vincere";
import { z } from "zod";

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  active: z.boolean().optional(),
  secret: z.string().optional(),
});

/**
 * PUT /api/vincere/webhooks/[id]
 * Update an existing webhook
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const webhookId = parseInt(id, 10);

    if (isNaN(webhookId)) {
      return NextResponse.json(
        { error: "Invalid webhook ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = updateWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const vincere = getVincereClient();
    const webhook = await updateWebhook(webhookId, parseResult.data, vincere);

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to update webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vincere/webhooks/[id]
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const webhookId = parseInt(id, 10);

    if (isNaN(webhookId)) {
      return NextResponse.json(
        { error: "Invalid webhook ID" },
        { status: 400 }
      );
    }

    const vincere = getVincereClient();
    await deleteWebhook(webhookId, vincere);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to delete webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

