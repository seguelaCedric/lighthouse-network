/**
 * Vincere Owners API
 *
 * Functions for fetching job/position owners from Vincere.
 * Primary owners are typically BD/sales who brought the enquiry.
 * Secondary owners are recruiters assigned to fill the position.
 */

import { getVincereClient, VincereClient } from './client';

/**
 * Vincere owner from the /position/{id}/owners endpoint
 */
export interface VincereOwner {
  id: number;
  email: string;
  full_name: string;
  phone_number: string | null;
  timezone?: string;
  user_location?: string;
  photo_url?: string;
  is_primary: boolean;
  deactivated?: boolean;
}

/**
 * Parsed job owners with primary and secondary separated
 */
export interface JobOwners {
  /** Primary owner - BD/sales who brought the enquiry */
  primary: VincereOwner | null;
  /** Secondary owner - Recruiter assigned to fill the job */
  secondary: VincereOwner | null;
  /** All owners returned from the API */
  all: VincereOwner[];
}

/**
 * Fetch owners for a job/position from Vincere
 *
 * The Vincere API returns an array of owners, each with an `is_primary` flag.
 * Primary owner = BD/sales who brought the enquiry
 * Secondary owner = Recruiter assigned to fill the position
 *
 * @param positionId - Vincere position/job ID
 * @param client - Optional VincereClient instance (for reuse in bulk operations)
 * @returns JobOwners with primary and secondary owners parsed
 */
export async function getJobOwners(
  positionId: number,
  client?: VincereClient
): Promise<JobOwners> {
  const vincere = client ?? getVincereClient();

  try {
    const owners = await vincere.get<VincereOwner[]>(`/position/${positionId}/owners`);

    if (!owners || !Array.isArray(owners)) {
      return { primary: null, secondary: null, all: [] };
    }

    // Filter out deactivated users
    const activeOwners = owners.filter((o) => !o.deactivated);

    // Find primary owner (is_primary = true)
    const primary = activeOwners.find((o) => o.is_primary) || null;

    // Find secondary owner (first non-primary - the assigned recruiter)
    const secondary = activeOwners.find((o) => !o.is_primary) || null;

    return { primary, secondary, all: activeOwners };
  } catch (error) {
    // Log but don't crash - owners are not critical for job sync
    console.error(
      `[Vincere] Failed to fetch owners for position ${positionId}:`,
      error instanceof Error ? error.message : error
    );
    return { primary: null, secondary: null, all: [] };
  }
}

/**
 * Extract owner data for database storage
 *
 * Returns a flat object suitable for database upsert operations
 */
export function extractOwnerDataForDb(owners: JobOwners): {
  primary_owner_id: number | null;
  primary_owner_name: string | null;
  primary_owner_email: string | null;
  assigned_recruiter_id: number | null;
  assigned_recruiter_name: string | null;
  assigned_recruiter_email: string | null;
  owners_synced_at: string;
} {
  return {
    primary_owner_id: owners.primary?.id ?? null,
    primary_owner_name: owners.primary?.full_name ?? null,
    primary_owner_email: owners.primary?.email ?? null,
    assigned_recruiter_id: owners.secondary?.id ?? null,
    assigned_recruiter_name: owners.secondary?.full_name ?? null,
    assigned_recruiter_email: owners.secondary?.email ?? null,
    owners_synced_at: new Date().toISOString(),
  };
}
