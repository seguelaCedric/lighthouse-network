import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for updating contacts
const updateContactSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  is_primary: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id: clientId, contactId } = await params;
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

    // Fetch contact with client verification
    const { data: contact, error } = await supabase
      .from("client_contacts")
      .select("*, client:clients!inner(id, agency_id)")
      .eq("id", contactId)
      .eq("client_id", clientId)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify client belongs to agency
    if (contact.client?.agency_id !== userData.organization_id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Remove client join from response
    const { client: _, ...contactData } = contact;

    return NextResponse.json({ data: contactData });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id: clientId, contactId } = await params;
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
    const parseResult = updateContactSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = parseResult.data;

    // If setting as primary, unset other primary contacts first
    if (updateData.is_primary) {
      await supabase
        .from("client_contacts")
        .update({ is_primary: false })
        .eq("client_id", clientId)
        .eq("is_primary", true)
        .neq("id", contactId);
    }

    // Update contact
    const { data, error } = await supabase
      .from("client_contacts")
      .update(updateData)
      .eq("id", contactId)
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id: clientId, contactId } = await params;
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

    // Soft delete contact (set is_active = false)
    const { error } = await supabase
      .from("client_contacts")
      .update({ is_active: false })
      .eq("id", contactId)
      .eq("client_id", clientId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to delete contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
