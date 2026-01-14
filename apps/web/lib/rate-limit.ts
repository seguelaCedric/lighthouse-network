/**
 * Simple in-memory rate limiter for Vercel serverless
 *
 * Note: This works for single-instance deployments but resets on redeploy.
 * For production at scale, consider upgrading to Upstash Redis:
 * https://upstash.com/docs/oss/sdks/ts/ratelimit/overview
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store - resets on serverless cold start
const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

/**
 * Check rate limit for a given identifier (usually IP + endpoint)
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = store.get(identifier);

  // No existing entry or window expired - create new entry
  if (!entry || entry.resetTime < now) {
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
    };
  }

  // Increment count
  entry.count += 1;

  // Check if over limit
  if (entry.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Auth endpoints - strict limits to prevent brute force
  auth: { limit: 5, windowSeconds: 60 }, // 5 attempts per minute

  // Magic link / password reset - prevent email flooding
  email: { limit: 3, windowSeconds: 60 }, // 3 emails per minute

  // File uploads - prevent storage abuse
  upload: { limit: 10, windowSeconds: 60 }, // 10 uploads per minute

  // General API - reasonable limits
  api: { limit: 60, windowSeconds: 60 }, // 60 requests per minute

  // Public endpoints - stricter for unauthenticated
  public: { limit: 30, windowSeconds: 60 }, // 30 requests per minute
};

/**
 * Get client IP from request headers (works with Vercel)
 */
export function getClientIp(request: Request): string {
  // Vercel's forwarded IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the chain (client's real IP)
    return forwardedFor.split(",")[0].trim();
  }

  // Vercel's real IP header
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return "127.0.0.1";
}

/**
 * Create a rate limit key from IP and endpoint
 */
export function createRateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}

/**
 * Helper to check rate limit and return error response if exceeded
 */
export function checkRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; response: Response } {
  const ip = getClientIp(request);
  const key = createRateLimitKey(ip, endpoint);
  const result = rateLimit(key, config);

  if (!result.success) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "Too many requests",
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
      ),
    };
  }

  return { allowed: true };
}
