import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      .from("signature_settings")
      .select("id, logo_url, logo_width, template")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch signature settings:", error);
      return NextResponse.json({ error: "Failed to fetch signature settings" }, { status: 500 });
    }

    return NextResponse.json({
      settings: data ?? {
        logo_url: null,
        logo_width: 140,
        template: "classic",
      },
    });
  } catch (error) {
    console.error("Signature settings GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;

    const { supabase, organizationId } = result;
    const payload = await request.json();

    const updates = {
      organization_id: organizationId,
      logo_url: payload?.logo_url?.trim() || null,
      logo_width: payload?.logo_width ? Number(payload.logo_width) : 140,
      template: payload?.template?.trim() || "classic",
    };

    const { data, error } = await supabase
      .from("signature_settings")
      .upsert(updates, { onConflict: "organization_id" })
      .select("id, logo_url, logo_width, template")
      .single();

    if (error) {
      console.error("Failed to update signature settings:", error);
      return NextResponse.json({ error: "Failed to update signature settings" }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Signature settings PATCH error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
