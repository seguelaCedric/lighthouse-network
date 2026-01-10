import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for creating/updating contacts
const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  is_primary: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
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

    // Verify client belongs to agency
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("agency_id", userData.organization_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch contacts
    const { data: contacts, error } = await supabase
      .from("client_contacts")
      .select("*")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: contacts ?? [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
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

    // Verify client belongs to agency
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("agency_id", userData.organization_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const parseResult = contactSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const contactData = parseResult.data;

    // If this contact is set as primary, unset other primary contacts first
    if (contactData.is_primary) {
      await supabase
        .from("client_contacts")
        .update({ is_primary: false })
        .eq("client_id", clientId)
        .eq("is_primary", true);
    }

    // Insert contact
    const { data, error } = await supabase
      .from("client_contacts")
      .insert({
        ...contactData,
        client_id: clientId,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
