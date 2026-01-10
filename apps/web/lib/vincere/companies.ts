/**
 * Vincere Companies API
 *
 * Functions for fetching company details from Vincere.
 * Companies are the employers/clients in Vincere (e.g., yacht owners, management companies)
 */

import { getVincereClient, VincereClient } from './client';

/**
 * Vincere company from API
 */
export interface VincereCompany {
  id: number;
  company_name?: string;
  name?: string; // Alias for company_name
  trading_name?: string;
  company_type?: string;
  website?: string;
  phone?: string;
  fax?: string;
  note?: string;
  stage?: string;
  stage_status?: string;
  status_id?: number;
  parent_id?: number | null;
  creator_id?: number;
  external_id?: string | null;
  registration_date?: string;
  updated_timestamp?: string;
}

/**
 * Get company by Vincere ID
 * Endpoint: GET /company/{id}
 */
export async function getCompanyById(
  vincereId: number,
  client?: VincereClient
): Promise<VincereCompany | null> {
  const vincere = client ?? getVincereClient();

  try {
    return await vincere.get<VincereCompany>(`/company/${vincereId}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get multiple companies by IDs (batched for efficiency)
 * Fetches in parallel with rate limiting to avoid overwhelming the API
 */
export async function getCompaniesByIds(
  vincereIds: number[],
  client?: VincereClient
): Promise<Map<number, VincereCompany>> {
  const vincere = client ?? getVincereClient();
  const results = new Map<number, VincereCompany>();

  // Remove duplicates
  const uniqueIds = [...new Set(vincereIds)];

  // Fetch in parallel with rate limiting (10 concurrent)
  const BATCH_SIZE = 10;
  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + BATCH_SIZE);
    const companies = await Promise.all(
      batch.map((id) => getCompanyById(id, vincere).catch(() => null))
    );

    batch.forEach((id, idx) => {
      if (companies[idx]) {
        results.set(id, companies[idx]!);
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
 * Get display name for a company
 */
export function getCompanyDisplayName(company: VincereCompany): string {
  return company.company_name || company.name || company.trading_name || 'Unknown Company';
}
