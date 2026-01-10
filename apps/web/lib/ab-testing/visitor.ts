// Visitor ID management for A/B testing - Client-side only
import { v4 as uuidv4 } from 'uuid';

export const VISITOR_ID_COOKIE = 'ab_visitor_id';

/**
 * Get visitor ID from client-side cookie
 */
export function getVisitorIdClient(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(
    new RegExp(`(^| )${VISITOR_ID_COOKIE}=([^;]+)`)
  );
  return match ? match[2] : null;
}

/**
 * Set visitor ID cookie client-side
 */
export function setVisitorIdClient(visitorId: string): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  document.cookie = `${VISITOR_ID_COOKIE}=${visitorId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Get or create visitor ID client-side
 */
export function getOrCreateVisitorIdClient(): string {
  let visitorId = getVisitorIdClient();
  if (!visitorId) {
    visitorId = uuidv4();
    setVisitorIdClient(visitorId);
  }
  return visitorId;
}

/**
 * Generate a new visitor ID (can be used server or client side)
 */
export function generateVisitorId(): string {
  return uuidv4();
}
