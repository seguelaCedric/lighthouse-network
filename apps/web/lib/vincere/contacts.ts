/**
 * Vincere Contacts API
 *
 * Functions for fetching contact details from Vincere.
 * Contacts are the people associated with companies (e.g., Captain, Fleet Manager, Owner)
 */

import { getVincereClient, VincereClient } from './client';

/**
 * Vincere contact from API
 */
export interface VincereContact {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  company_id?: number;
  created_date?: string;
  updated_date?: string;
}

/**
 * Get contact by Vincere ID
 * Endpoint: GET /contact/{id}
 */
export async function getContactById(
  vincereId: number,
  client?: VincereClient
): Promise<VincereContact | null> {
  const vincere = client ?? getVincereClient();

  try {
    return await vincere.get<VincereContact>(`/contact/${vincereId}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get multiple contacts by IDs (batched for efficiency)
 * Fetches in parallel with rate limiting to avoid overwhelming the API
 */
export async function getContactsByIds(
  vincereIds: number[],
  client?: VincereClient
): Promise<Map<number, VincereContact>> {
  const vincere = client ?? getVincereClient();
  const results = new Map<number, VincereContact>();

  // Remove duplicates
  const uniqueIds = [...new Set(vincereIds)];

  // Fetch in parallel with rate limiting (10 concurrent)
  const BATCH_SIZE = 10;
  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + BATCH_SIZE);
    const contacts = await Promise.all(
      batch.map((id) => getContactById(id, vincere).catch(() => null))
    );

    batch.forEach((id, idx) => {
      if (contacts[idx]) {
        results.set(id, contacts[idx]!);
      }
    });

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < uniqueIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Get display name for a contact
 */
export function getContactDisplayName(contact: VincereContact): string {
  if (contact.first_name || contact.last_name) {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
  }
  return contact.name || 'Unknown Contact';
}

/**
 * Get primary phone for a contact (prefers phone over mobile)
 */
export function getContactPhone(contact: VincereContact): string | null {
  return contact.phone || contact.mobile || null;
}
