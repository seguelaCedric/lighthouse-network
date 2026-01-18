import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin/owner
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("auth_id", user.id)
      .single();

    if (!userData || !["owner", "admin"].includes(userData.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient();

    // Fetch the error log with full details
    const { data: log, error: queryError } = await serviceClient
      .from("error_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (queryError) {
      console.error("Error fetching error log:", queryError);
      if (queryError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Error log not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch error log" },
        { status: 500 }
      );
    }

    // Fetch related user info if user_id exists
    let userInfo = null;
    if (log.user_id) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, role")
        .eq("id", log.user_id)
        .single();

      if (userRecord) {
        userInfo = {
          id: userRecord.id,
          name: `${userRecord.first_name || ""} ${userRecord.last_name || ""}`.trim(),
          email: userRecord.email,
          role: userRecord.role,
        };
      }
    }

    // Fetch similar errors (same fingerprint)
    let similarErrors: Array<{ id: string; created_at: string }> = [];
    if (log.fingerprint) {
      const { data: similar } = await serviceClient
        .from("error_logs")
        .select("id, created_at")
        .eq("fingerprint", log.fingerprint)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      similarErrors = similar || [];
    }

    return NextResponse.json({
      log,
      user: userInfo,
      similar_errors: similarErrors,
      similar_count: similarErrors.length,
    });
  } catch (error) {
    console.error("Error in error-log detail API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a specific error log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner (only owners can delete individual logs)
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("auth_id", user.id)
      .single();

    if (!userData || userData.role !== "owner") {
      return NextResponse.json(
        { error: "Owner access required" },
        { status: 403 }
      );
    }

    // Use service role client
    const serviceClient = createServiceRoleClient();

    const { error: deleteError } = await serviceClient
      .from("error_logs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting error log:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete error log" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in error-log DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
