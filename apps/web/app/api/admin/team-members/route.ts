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

export async function GET() {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;

    const { supabase, organizationId } = result;

    const { data, error } = await supabase
      .from("team_members")
      .select(
        "id, name, first_name, last_name, role, bio, languages, email, phone_number, image_url, linkedin_url, facebook_url, sort_order, is_active"
      )
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch team members:", error);
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
    }

    return NextResponse.json({ teamMembers: data ?? [] });
  } catch (error) {
    console.error("Team members GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;

    const { supabase, organizationId } = result;
    const payload = await request.json();

    const firstName = payload?.first_name?.trim();
    const lastName = payload?.last_name?.trim();
    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    const role = payload?.role?.trim();
    const bio = payload?.bio?.trim();
    const imageUrl = sanitizeText(payload?.image_url);

    if (!firstName || !lastName || !role || !bio || !imageUrl) {
      return NextResponse.json(
        { error: "First name, last name, role, bio, and image are required" },
        { status: 400 }
      );
    }

    const { data: lastMember } = await supabase
      .from("team_members")
      .select("sort_order")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastMember?.sort_order ?? 0) + 1;

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        organization_id: organizationId,
        name,
        first_name: firstName,
        last_name: lastName,
        role,
        bio,
        languages: sanitizeText(payload?.languages),
        email: sanitizeText(payload?.email),
        phone_number: sanitizeText(payload?.phone_number),
        image_url: imageUrl,
        linkedin_url: sanitizeText(payload?.linkedin_url),
        facebook_url: sanitizeText(payload?.facebook_url),
        sort_order: nextOrder,
        is_active: payload?.is_active ?? true,
      })
      .select(
        "id, name, first_name, last_name, role, bio, languages, email, phone_number, image_url, linkedin_url, facebook_url, sort_order, is_active"
      )
      .single();

    if (error) {
      console.error("Failed to create team member:", error);
      return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
    }

    return NextResponse.json({ teamMember: data }, { status: 201 });
  } catch (error) {
    console.error("Team members POST error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
