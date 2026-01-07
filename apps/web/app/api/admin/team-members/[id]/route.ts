import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitizeText(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("auth_id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { error: NextResponse.json({ error: "No organization found" }, { status: 404 }) };
  }

  if (!userData.role || !["owner", "admin"].includes(userData.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, organizationId: userData.organization_id };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;

    const { supabase, organizationId } = result;
    const payload = await request.json();
    const targetId =
      params?.id && params.id !== "undefined" ? params.id : payload?.id;

    if (!targetId) {
      return NextResponse.json({ error: "Invalid team member id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    const nextFirstName = payload?.first_name !== undefined ? sanitizeText(payload?.first_name) : undefined;
    const nextLastName = payload?.last_name !== undefined ? sanitizeText(payload?.last_name) : undefined;

    if (nextFirstName !== undefined) updates.first_name = nextFirstName;
    if (nextLastName !== undefined) updates.last_name = nextLastName;
    if (payload?.role !== undefined) updates.role = sanitizeText(payload?.role);
    if (payload?.bio !== undefined) updates.bio = sanitizeText(payload?.bio);
    if (payload?.languages !== undefined) updates.languages = sanitizeText(payload?.languages);
    if (payload?.email !== undefined) updates.email = sanitizeText(payload?.email);
    if (payload?.phone_number !== undefined) updates.phone_number = sanitizeText(payload?.phone_number);
    if (payload?.image_url !== undefined) updates.image_url = sanitizeText(payload?.image_url);
    if (payload?.linkedin_url !== undefined) updates.linkedin_url = sanitizeText(payload?.linkedin_url);
    if (payload?.facebook_url !== undefined) updates.facebook_url = sanitizeText(payload?.facebook_url);
    if (payload?.is_active !== undefined) updates.is_active = payload?.is_active;

    if (nextFirstName !== undefined || nextLastName !== undefined) {
      if (!nextFirstName || !nextLastName) {
        return NextResponse.json(
          { error: "First name and last name are required" },
          { status: 400 }
        );
      }

      const combined = `${nextFirstName} ${nextLastName}`.trim();
      updates.name = combined;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", targetId)
      .eq("organization_id", organizationId)
      .select(
        "id, name, first_name, last_name, role, bio, languages, email, phone_number, image_url, linkedin_url, facebook_url, sort_order, is_active"
      )
      .single();

    if (error) {
      console.error("Failed to update team member:", error);
      return NextResponse.json(
        { error: "Failed to update team member", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ teamMember: data });
  } catch (error) {
    console.error("Team members PATCH error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;

    const { supabase, organizationId } = result;

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", params.id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Failed to delete team member:", error);
      return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team members DELETE error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
