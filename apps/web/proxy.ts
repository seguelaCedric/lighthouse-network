import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  rateLimit,
  rateLimiters,
  getClientIp,
  createRateLimitKey,
} from "@/lib/rate-limit";

/**
 * Next.js 16 Proxy - handles rate limiting, security headers, and auth session management
 *
 * Rate limits applied:
 * - Auth endpoints: 5 requests/minute (prevent brute force)
 * - Email endpoints: 3 requests/minute (prevent email flooding)
 * - Upload endpoints: 10 requests/minute (prevent storage abuse)
 * - Public API: 30 requests/minute
 */

// Routes that need rate limiting
const RATE_LIMITED_ROUTES = {
  // Auth - strict limits
  auth: [
    "/api/auth/",
    "/api/employer/auth/",
    "/api/client/auth/",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ],

  // Email sending - prevent flooding
  email: [
    "/api/employer/auth/send-link",
    "/api/messages/email",
    "/api/employer/register", // sends welcome email
  ],

  // File uploads - prevent storage abuse
  upload: ["/api/documents/upload"],

  // Public endpoints - moderate limits
  public: ["/api/inquiries", "/api/applications", "/match"],
};

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy (disable unnecessary APIs)
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // Skip rate limiting for static assets and internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return await updateSession(request);
  }

  // Determine which rate limit config to use
  let config: { limit: number; windowSeconds: number } | null = null;
  let category = "none";

  // Check auth routes (strictest)
  if (RATE_LIMITED_ROUTES.auth.some((route) => pathname.startsWith(route))) {
    config = rateLimiters.auth;
    category = "auth";
  }
  // Check email routes
  else if (
    RATE_LIMITED_ROUTES.email.some((route) => pathname.startsWith(route))
  ) {
    config = rateLimiters.email;
    category = "email";
  }
  // Check upload routes
  else if (
    RATE_LIMITED_ROUTES.upload.some((route) => pathname.startsWith(route))
  ) {
    config = rateLimiters.upload;
    category = "upload";
  }
  // Check public API routes
  else if (
    RATE_LIMITED_ROUTES.public.some((route) => pathname.startsWith(route))
  ) {
    config = rateLimiters.public;
    category = "public";
  }
  // Rate limit all API routes
  else if (pathname.startsWith("/api/")) {
    config = rateLimiters.api;
    category = "api";
  }

  // Apply rate limit if applicable
  if (config) {
    const key = createRateLimitKey(ip, category);
    const result = rateLimit(key, config);

    if (!result.success) {
      console.warn(`Rate limit exceeded: ${ip} on ${category} (${pathname})`);

      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          retryAfter: result.resetIn,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.resetIn),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.resetIn),
          },
        }
      );
    }
  }

  // Run Supabase session update (handles auth, redirects, cookies)
  const response = await updateSession(request);

  // Add security headers to the response
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
