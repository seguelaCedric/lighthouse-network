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

export async function PATCH(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;

    const { supabase, organizationId } = result;
    const payload = await request.json();
    const orderedIds = Array.isArray(payload?.orderedIds)
      ? payload.orderedIds
      : [];

    if (orderedIds.length === 0) {
      return NextResponse.json({ error: "No order provided" }, { status: 400 });
    }

    const updates = orderedIds.map((id: string, index: number) =>
      supabase
        .from("team_members")
        .update({ sort_order: index + 1 })
        .eq("id", id)
        .eq("organization_id", organizationId)
    );

    const results = await Promise.all(updates);

    const failed = results.find((res) => res.error);
    if (failed?.error) {
      console.error("Failed to reorder team members:", failed.error);
      return NextResponse.json({ error: "Failed to reorder team members" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team members reorder error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
