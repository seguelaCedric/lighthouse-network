import { NextResponse } from "next/server";
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
    .select("id, organization_id, role")
    .eq("auth_id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { error: NextResponse.json({ error: "No organization found" }, { status: 404 }) };
  }

  if (!userData.role || !["owner", "admin"].includes(userData.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, organizationId: userData.organization_id, currentUserId: userData.id };
}

export async function GET() {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;

    const { supabase, organizationId, currentUserId } = result;

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, role, avatar_url, is_active, last_login_at, created_at"
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch team users:", error);
      return NextResponse.json({ error: "Failed to fetch team users" }, { status: 500 });
    }

    const users = (data || []).map((member) => ({
      ...member,
      is_current_user: member.id === currentUserId,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Team users GET error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
