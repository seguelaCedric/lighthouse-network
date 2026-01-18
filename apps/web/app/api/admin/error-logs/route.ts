import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

// Query params validation schema
const querySchema = z.object({
  severity: z.enum(["debug", "info", "warning", "error", "critical"]).optional(),
  path: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  user_id: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// Stats for the error logs
interface ErrorLogStats {
  total: number;
  by_severity: Record<string, number>;
  last_24h: number;
  last_7d: number;
  top_paths: Array<{ path: string; count: number }>;
}

export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const validationResult = querySchema.safeParse({
      severity: searchParams.get("severity") || undefined,
      path: searchParams.get("path") || undefined,
      method: searchParams.get("method") || undefined,
      search: searchParams.get("search") || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      user_id: searchParams.get("user_id") || undefined,
      limit: searchParams.get("limit") || 50,
      offset: searchParams.get("offset") || 0,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // Use service role client to bypass RLS for error logs
    const serviceClient = createServiceRoleClient();

    // Build the query
    let query = serviceClient
      .from("error_logs")
      .select(
        `
        id,
        message,
        stack_trace,
        error_code,
        severity,
        path,
        method,
        status_code,
        request_id,
        user_id,
        auth_id,
        organization_id,
        metadata,
        query_params,
        environment,
        fingerprint,
        created_at
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (params.severity) {
      query = query.eq("severity", params.severity);
    }

    if (params.path) {
      query = query.ilike("path", `%${params.path}%`);
    }

    if (params.method) {
      query = query.eq("method", params.method);
    }

    if (params.search) {
      query = query.or(
        `message.ilike.%${params.search}%,path.ilike.%${params.search}%,error_code.ilike.%${params.search}%`
      );
    }

    if (params.date_from) {
      query = query.gte("created_at", params.date_from);
    }

    if (params.date_to) {
      query = query.lte("created_at", params.date_to);
    }

    if (params.user_id) {
      query = query.eq("user_id", params.user_id);
    }

    // Apply pagination
    query = query.range(params.offset, params.offset + params.limit - 1);

    const { data: logs, count, error: queryError } = await query;

    if (queryError) {
      console.error("Error fetching error logs:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch error logs" },
        { status: 500 }
      );
    }

    // Fetch stats
    const stats = await calculateStats(serviceClient);

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      stats,
      limit: params.limit,
      offset: params.offset,
    });
  } catch (error) {
    console.error("Error in error-logs API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function calculateStats(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<ErrorLogStats> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Run all queries in parallel
  const [
    totalResult,
    last24hResult,
    last7dResult,
    severityResult,
    topPathsResult,
  ] = await Promise.all([
    // Total count
    supabase.from("error_logs").select("id", { count: "exact", head: true }),

    // Last 24 hours
    supabase
      .from("error_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneDayAgo),

    // Last 7 days
    supabase
      .from("error_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),

    // By severity
    supabase.from("error_logs").select("severity"),

    // Top paths (last 7 days)
    supabase
      .from("error_logs")
      .select("path")
      .gte("created_at", sevenDaysAgo),
  ]);

  // Calculate severity counts
  const by_severity: Record<string, number> = {
    debug: 0,
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };

  if (severityResult.data) {
    for (const log of severityResult.data) {
      if (log.severity && by_severity[log.severity] !== undefined) {
        by_severity[log.severity]++;
      }
    }
  }

  // Calculate top paths
  const pathCounts: Record<string, number> = {};
  if (topPathsResult.data) {
    for (const log of topPathsResult.data) {
      if (log.path) {
        pathCounts[log.path] = (pathCounts[log.path] || 0) + 1;
      }
    }
  }

  const top_paths = Object.entries(pathCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  return {
    total: totalResult.count || 0,
    by_severity,
    last_24h: last24hResult.count || 0,
    last_7d: last7dResult.count || 0,
    top_paths,
  };
}

// DELETE endpoint to clear old logs
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner (only owners can delete logs)
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("older_than_days") || "30", 10);

    if (olderThanDays < 1) {
      return NextResponse.json(
        { error: "older_than_days must be at least 1" },
        { status: 400 }
      );
    }

    // Use service role client
    const serviceClient = createServiceRoleClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { error: deleteError, count } = await serviceClient
      .from("error_logs")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate.toISOString());

    if (deleteError) {
      console.error("Error deleting error logs:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete error logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted_count: count || 0,
      cutoff_date: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("Error in error-logs DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
