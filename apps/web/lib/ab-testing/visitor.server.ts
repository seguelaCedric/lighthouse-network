// Visitor ID management for A/B testing - Server-side only
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const VISITOR_ID_COOKIE = 'ab_visitor_id';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Get visitor ID from cookie (server-side)
 */
export async function getVisitorId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(VISITOR_ID_COOKIE)?.value ?? null;
}

/**
 * Get or create visitor ID (server-side)
 * Note: Setting cookies requires being in a route handler or server action
 */
export async function getOrCreateVisitorId(): Promise<string> {
  const existing = await getVisitorId();
  if (existing) {
    return existing;
  }
  return uuidv4();
}

/**
 * Set visitor ID cookie (server-side, for route handlers)
 */
export async function setVisitorIdCookie(visitorId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(VISITOR_ID_COOKIE, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}
