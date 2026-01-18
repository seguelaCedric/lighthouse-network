import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createErrorLogger, extractRequestContext, type ErrorSeverity } from "@/lib/error-logger";

// Types for API handler
export interface ApiContext {
  request: NextRequest;
  params?: Record<string, string>;
  user?: {
    id: string;
    authId: string;
    organizationId: string;
    role: string;
  };
  logger: ReturnType<typeof createErrorLogger>;
}

export interface ApiHandlerOptions {
  // Require authentication
  requireAuth?: boolean;
  // Require specific roles (implies requireAuth)
  requireRoles?: string[];
  // Log all requests (not just errors)
  logAllRequests?: boolean;
  // Custom error transformer
  transformError?: (error: unknown) => { message: string; status: number };
}

type ApiHandler = (context: ApiContext) => Promise<NextResponse>;

/**
 * Wrap an API route handler with automatic error logging and auth
 *
 * @example
 * ```ts
 * export const GET = withApiHandler(async ({ request, user, logger }) => {
 *   const data = await fetchData();
 *   return NextResponse.json({ data });
 * }, { requireAuth: true });
 * ```
 */
export function withApiHandler(handler: ApiHandler, options: ApiHandlerOptions = {}) {
  return async (request: NextRequest, { params }: { params?: Promise<Record<string, string>> } = {}) => {
    const requestContext = extractRequestContext(request);
    let userId: string | undefined;
    let authId: string | undefined;
    let organizationId: string | undefined;

    // Create logger with request context
    const logger = createErrorLogger(requestContext);

    try {
      // Resolve params if they're a promise (Next.js 15 async params)
      const resolvedParams = params ? await params : undefined;

      // Handle authentication if required
      let user: ApiContext["user"] | undefined;

      if (options.requireAuth || options.requireRoles) {
        const supabase = await createClient();

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          await logger.warn("Unauthorized access attempt", {
            reason: "No authenticated user",
          });
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        authId = authUser.id;

        // Get user details
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, organization_id, role")
          .eq("auth_id", authUser.id)
          .single();

        if (userError || !userData) {
          await logger.warn("User not found in database", {
            authId: authUser.id,
            error: userError?.message,
          });
          return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        userId = userData.id;
        organizationId = userData.organization_id;

        // Check role requirements
        if (options.requireRoles && !options.requireRoles.includes(userData.role)) {
          await logger.warn("Access denied - insufficient role", {
            userId: userData.id,
            userRole: userData.role,
            requiredRoles: options.requireRoles,
          });
          return NextResponse.json(
            { error: `Access denied. Required role: ${options.requireRoles.join(" or ")}` },
            { status: 403 }
          );
        }

        user = {
          id: userData.id,
          authId: authUser.id,
          organizationId: userData.organization_id,
          role: userData.role,
        };

        // Update logger with user context
        Object.assign(requestContext, {
          userId: userData.id,
          authId: authUser.id,
          organizationId: userData.organization_id,
        });
      }

      // Log request if enabled
      if (options.logAllRequests) {
        await logger.info("API request received", {
          userId,
          params: resolvedParams,
        });
      }

      // Execute the handler
      const response = await handler({
        request,
        params: resolvedParams,
        user,
        logger,
      });

      return response;
    } catch (error) {
      // Determine error details
      const isError = error instanceof Error;
      const errorMessage = isError ? error.message : String(error);
      const errorStack = isError ? error.stack : undefined;

      // Determine status code
      let statusCode = 500;
      let severity: ErrorSeverity = "error";

      // Check for known error types
      if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
        statusCode = 429;
        severity = "warning";
      } else if (errorMessage.includes("not found")) {
        statusCode = 404;
        severity = "warning";
      } else if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
        statusCode = 400;
        severity = "warning";
      }

      // Use custom transformer if provided
      if (options.transformError) {
        const transformed = options.transformError(error);
        statusCode = transformed.status;
      }

      // Parse request body for logging (if available)
      let requestBody: Record<string, unknown> | undefined;
      try {
        if (request.method !== "GET" && request.method !== "HEAD") {
          const clonedRequest = request.clone();
          const contentType = request.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            requestBody = await clonedRequest.json();
          }
        }
      } catch {
        // Ignore body parsing errors
      }

      // Log the error
      await logger.error(error instanceof Error ? error : new Error(errorMessage), {
        statusCode,
        metadata: {
          severity,
          errorType: isError ? error.constructor.name : "Unknown",
        },
        requestBody,
      });

      // Also log to console for immediate visibility
      console.error(`[API Error] ${requestContext.method} ${requestContext.path}:`, error);

      // Return error response
      return NextResponse.json(
        {
          error: "Internal server error",
          // Include request ID for correlation
          requestId: requestContext.requestId,
        },
        { status: statusCode }
      );
    }
  };
}

/**
 * Admin route handler wrapper - requires admin/owner role
 */
export function withAdminHandler(handler: ApiHandler, options: Omit<ApiHandlerOptions, "requireAuth" | "requireRoles"> = {}) {
  return withApiHandler(handler, {
    ...options,
    requireAuth: true,
    requireRoles: ["admin", "owner"],
  });
}

/**
 * Authenticated route handler wrapper
 */
export function withAuthHandler(handler: ApiHandler, options: Omit<ApiHandlerOptions, "requireAuth"> = {}) {
  return withApiHandler(handler, {
    ...options,
    requireAuth: true,
  });
}
