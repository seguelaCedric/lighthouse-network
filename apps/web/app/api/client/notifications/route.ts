import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";

/**
 * GET /api/client/notifications
 * Get notifications for the authenticated client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get notifications for this client
    let query = supabase
      .from("client_notifications")
      .select("*")
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("client_notifications")
      .select("id", { count: "exact", head: true })
      .eq("client_id", session.clientId)
      .eq("read", false);

    const transformedNotifications = (notifications || []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      actionUrl: n.action_url,
      actionLabel: n.action_label,
      metadata: n.metadata,
      read: n.read,
      readAt: n.read_at,
      createdAt: n.created_at,
    }));

    return NextResponse.json({
      data: {
        notifications: transformedNotifications,
        unreadCount: unreadCount || 0,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { notificationIds?: string[]; markAllRead?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const supabase = await createClient();

    if (body.markAllRead) {
      // Mark all notifications as read
      const { error } = await supabase
        .from("client_notifications")
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq("client_id", session.clientId)
        .eq("read", false);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (body.notificationIds && body.notificationIds.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from("client_notifications")
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq("client_id", session.clientId)
        .in("id", body.notificationIds);

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Notifications marked as read",
      });
    }

    return NextResponse.json(
      { error: "No notifications specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
