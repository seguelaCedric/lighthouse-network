import { createServiceRoleClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

// Error severity levels
export type ErrorSeverity = "debug" | "info" | "warning" | "error" | "critical";

// Error log data structure
export interface ErrorLogData {
  message: string;
  stack?: string;
  errorCode?: string;
  severity?: ErrorSeverity;

  // Request context
  path: string;
  method: string;
  statusCode?: number;
  requestId?: string;

  // User context
  userId?: string;
  authId?: string;
  organizationId?: string;

  // Additional context
  metadata?: Record<string, unknown>;
  requestBody?: Record<string, unknown>;
  requestHeaders?: Record<string, string>;
  queryParams?: Record<string, string>;
}

// Sensitive fields to redact from logs
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "api_key",
  "apikey",
  "authorization",
  "cookie",
  "session",
  "credit_card",
  "creditcard",
  "card_number",
  "cvv",
  "ssn",
  "social_security",
];

// Redact sensitive data from objects
function redactSensitive(obj: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!obj) return undefined;

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));

    if (isSensitive) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

// Generate a fingerprint for grouping similar errors
function generateFingerprint(message: string, path: string, method: string): string {
  // Normalize the message by removing variable parts (IDs, timestamps, etc.)
  const normalizedMessage = message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[UUID]")
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, "[TIMESTAMP]")
    .replace(/\d+/g, "[N]");

  const fingerprintSource = `${method}:${path}:${normalizedMessage}`;
  return createHash("sha256").update(fingerprintSource).digest("hex").slice(0, 16);
}

// Sanitize headers - remove sensitive ones
function sanitizeHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;

  const sensitiveHeaders = ["authorization", "cookie", "x-api-key", "x-auth-token"];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log an error to the database
 * Uses service role client to bypass RLS
 */
export async function logError(data: ErrorLogData): Promise<void> {
  try {
    const supabase = createServiceRoleClient();

    const fingerprint = generateFingerprint(data.message, data.path, data.method);

    const { error: insertError } = await supabase.from("error_logs").insert({
      message: data.message,
      stack_trace: data.stack?.slice(0, 10000), // Limit stack trace size
      error_code: data.errorCode,
      severity: data.severity || "error",
      path: data.path,
      method: data.method,
      status_code: data.statusCode,
      request_id: data.requestId,
      user_id: data.userId,
      auth_id: data.authId,
      organization_id: data.organizationId,
      metadata: redactSensitive(data.metadata),
      request_body: redactSensitive(data.requestBody),
      request_headers: sanitizeHeaders(data.requestHeaders),
      query_params: data.queryParams,
      environment: process.env.NODE_ENV || "development",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
      fingerprint,
    });

    if (insertError) {
      // Fallback to console if database insert fails
      console.error("[ErrorLogger] Failed to insert error log:", insertError);
      console.error("[ErrorLogger] Original error:", data.message);
    }
  } catch (logError) {
    // Fallback to console if anything fails
    console.error("[ErrorLogger] Failed to log error:", logError);
    console.error("[ErrorLogger] Original error:", data.message);
  }
}

/**
 * Create an error logger with pre-filled context
 * Useful for route handlers to capture request context upfront
 */
export function createErrorLogger(context: {
  path: string;
  method: string;
  requestId?: string;
  userId?: string;
  authId?: string;
  organizationId?: string;
  requestHeaders?: Record<string, string>;
  queryParams?: Record<string, string>;
}) {
  return {
    /**
     * Log a debug message
     */
    debug(message: string, metadata?: Record<string, unknown>) {
      return logError({
        ...context,
        message,
        metadata,
        severity: "debug",
      });
    },

    /**
     * Log an info message
     */
    info(message: string, metadata?: Record<string, unknown>) {
      return logError({
        ...context,
        message,
        metadata,
        severity: "info",
      });
    },

    /**
     * Log a warning
     */
    warn(message: string, metadata?: Record<string, unknown>) {
      return logError({
        ...context,
        message,
        metadata,
        severity: "warning",
      });
    },

    /**
     * Log an error
     */
    error(
      error: Error | string,
      options?: {
        statusCode?: number;
        metadata?: Record<string, unknown>;
        requestBody?: Record<string, unknown>;
      }
    ) {
      const isError = error instanceof Error;
      return logError({
        ...context,
        message: isError ? error.message : error,
        stack: isError ? error.stack : undefined,
        statusCode: options?.statusCode,
        metadata: options?.metadata,
        requestBody: options?.requestBody,
        severity: "error",
      });
    },

    /**
     * Log a critical error
     */
    critical(
      error: Error | string,
      options?: {
        statusCode?: number;
        metadata?: Record<string, unknown>;
        requestBody?: Record<string, unknown>;
      }
    ) {
      const isError = error instanceof Error;

      // Also log to console for immediate visibility
      console.error("[CRITICAL ERROR]", isError ? error : new Error(error));

      return logError({
        ...context,
        message: isError ? error.message : error,
        stack: isError ? error.stack : undefined,
        statusCode: options?.statusCode,
        metadata: options?.metadata,
        requestBody: options?.requestBody,
        severity: "critical",
      });
    },
  };
}

/**
 * Extract request context from NextRequest for logging
 */
export function extractRequestContext(request: Request) {
  const url = new URL(request.url);

  // Extract headers (only non-sensitive ones for default context)
  const headers: Record<string, string> = {};
  const headersToCapture = [
    "user-agent",
    "referer",
    "x-forwarded-for",
    "x-real-ip",
    "content-type",
    "accept",
  ];

  headersToCapture.forEach((header) => {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  });

  // Extract query params
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  // Generate a request ID if not present
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  return {
    path: url.pathname,
    method: request.method,
    requestId,
    requestHeaders: headers,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  };
}
