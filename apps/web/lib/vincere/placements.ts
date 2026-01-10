/**
 * Vincere Placements API
 *
 * Functions for fetching placement data from Vincere.
 */

import { getVincereClient, VincereClient } from './client';

/**
 * Placement reference from position endpoint
 */
export interface VincerePlacementRef {
  placement_id: number;
  candidate_id: number;
  placed_date: string;
  placed_by: string;
  offer_date: string | null;
  placement_date: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string; // e.g., "placement_active", "finished", "placement_starting"
  application_id: number;
}

/**
 * Full placement details from Vincere
 */
export interface VincerePlacement {
  id: number;
  position_id: number;
  application_source_id: number; // Not the actual candidate ID
  application_id: number;
  currency: string;
  annual_salary: number | null;
  salary_rate_per_month: number | null;
  salary_type: string; // e.g., "MONTHLY", "ANNUAL"
  profit: number | null; // Fee/revenue
  fee_model_type: string | null; // e.g., "FIXED_FEE", "PERCENTAGE"
  fee_model_fee_rate: number | null;
  fee_model_fixed_fee_amount: number | null;
  fee_model_fixed_fee_currency: string | null;
  job_type: string; // e.g., "PERMANENT", "CONTRACT"
  employment_type: string; // e.g., "FULL_TIME", "PART_TIME"
  placement_status: number; // 1 = active
  start_date: string | null;
  end_date: string | null;
  insert_timestamp: string;
  placed_by: number;
  is_latest: number;
  // Formatted display values
  formatted_annual_salary: string;
  formatted_profit: string;
  formatted_fee_model_fixed_fee_amount: string | null;
}

/**
 * Placement with enriched context
 */
export interface VincerePlacementWithContext extends VincerePlacement {
  _candidate_id: number; // Actual candidate vincere_id
  _job_id?: number;
  _company_id?: number;
}

/**
 * Get placement by ID
 */
export async function getPlacementById(
  placementId: number,
  client?: VincereClient
): Promise<VincerePlacement | null> {
  const vincere = client || getVincereClient();

  try {
    const placement = await vincere.get<VincerePlacement>(`/placement/${placementId}`);
    return placement;
  } catch (error) {
    console.error(`[Vincere] Failed to fetch placement ${placementId}:`, error);
    return null;
  }
}

/**
 * Get placements for a position/job
 */
export async function getPlacementsForJob(
  jobId: number,
  client?: VincereClient
): Promise<VincerePlacementRef[]> {
  const vincere = client || getVincereClient();

  try {
    const placements = await vincere.get<VincerePlacementRef[]>(`/position/${jobId}/placements`);
    return placements || [];
  } catch (error) {
    console.error(`[Vincere] Failed to fetch placements for job ${jobId}:`, error);
    return [];
  }
}

/**
 * Get full placement details with candidate context
 *
 * The full placement details don't include the actual candidate_id,
 * so we need to get it from the placement reference on the job.
 */
export async function getPlacementWithContext(
  placementId: number,
  client?: VincereClient
): Promise<VincerePlacementWithContext | null> {
  const vincere = client || getVincereClient();

  try {
    // Get full placement details
    const placement = await getPlacementById(placementId, vincere);
    if (!placement) return null;

    // Get candidate_id from the job's placement reference
    const jobId = placement.position_id;
    const placementRefs = await getPlacementsForJob(jobId, vincere);
    const placementRef = placementRefs.find((p) => p.placement_id === placementId);

    if (!placementRef) {
      console.warn(`[Vincere] Could not find placement reference for ${placementId} on job ${jobId}`);
    }

    return {
      ...placement,
      _candidate_id: placementRef?.candidate_id || 0,
      _job_id: jobId,
    };
  } catch (error) {
    console.error(`[Vincere] Failed to fetch placement with context ${placementId}:`, error);
    return null;
  }
}

/**
 * Map Vincere placement status to our status
 */
export function mapPlacementStatus(vincereStatus: number | string): string {
  // Numeric status from placement details
  if (typeof vincereStatus === 'number') {
    switch (vincereStatus) {
      case 1:
        return 'active';
      case 2:
        return 'completed';
      case 3:
        return 'cancelled';
      default:
        return 'active';
    }
  }

  // String status from placement reference
  switch (vincereStatus) {
    case 'placement_active':
      return 'active';
    case 'placement_starting':
      return 'active';
    case 'finished':
      return 'completed';
    case 'cancelled':
    case 'terminated':
      return 'cancelled';
    default:
      return 'active';
  }
}

/**
 * Calculate fee from placement data
 * Prefers profit, then fixed fee amount
 */
export function getPlacementFee(placement: VincerePlacement): number | null {
  return placement.profit || placement.fee_model_fixed_fee_amount || null;
}
