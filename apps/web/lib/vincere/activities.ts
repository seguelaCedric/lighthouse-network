/**
 * Vincere Activities Service
 *
 * Fetches recruiter activities (placements and applications) from Vincere API
 * for CEO visibility into team performance.
 *
 * API Endpoints:
 * - POST /user/activities - Search activities linked to a user
 */

import { getVincereClient, VincereClient } from './client';

/**
 * Vincere user ID to name mapping
 * Used to display proper names in the dashboard
 */
const VINCERE_USER_NAMES: Record<number, string> = {
  28955: 'Milica Seguela',
  28957: 'Catherine Coulibaly',
  28959: 'Admin',
  28960: 'Kiera Cavanagh',
  28961: 'Francesca Zanfagna',
  28963: 'Kate Burns',
  28964: 'Debbie Blazy',
  28965: 'Ivana Novakovic',
  28966: 'Tracy Gueli',
  28967: 'Sonia Szostok',
  28968: 'Laura Cubie',
  28969: 'Kaoutar Zahouane',
  28970: 'Charles Cartledge',
  28971: 'Pamela Moyes',
  28973: 'Marc Stevens',
  28974: 'Shelley Viljoen',
  28975: 'Ornela Grmusa',
  28976: 'Phil Richards',
  28977: 'India Thomson-Virtue',
  28978: 'Joaneen Botha',
  29011: 'Laura Hayes',
  29044: 'Britt McBride',
  29077: 'Tiffany Hutton',
  29110: 'Waldi Coetzee',
  29143: 'Svetlana Blake',
  [-1]: 'Company Admin',
  [-10]: 'System Admin',
};

/**
 * Get user name from ID, using the mapping or falling back to API response
 */
function getUserName(userId: number, apiName?: string): string {
  return VINCERE_USER_NAMES[userId] || apiName || `User ${userId}`;
}

/**
 * Activity from Vincere API
 */
export interface VincereActivity {
  id: number;
  activity_type: 'PLACEMENT' | 'APPLICATION' | 'TASK' | 'MEETING' | string;
  subject?: string;
  content?: string;
  insert_timestamp?: string;
  creator?: {
    id: number;
    email?: string;
    full_name?: string;
  };
  assignee?: {
    id: number;
    email?: string;
    full_name?: string;
  } | null;
  main_entity_type?: string;
  main_candidate_id?: number;
  main_position_id?: number;
  completed?: boolean;
}

/**
 * Response from POST /user/activities
 */
interface ActivitiesSearchResponse {
  content?: VincereActivity[];
  slice_index: number;
  num_of_elements: number;
  last: boolean;
}

/**
 * Vincere user summary
 */
export interface VincereUserSummary {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
}

/**
 * Activity counts for a user
 */
export interface UserActivityCounts {
  vincereUserId: number;
  userName: string;
  placementsCount: number;
  applicationsCount: number;
  totalCount: number;
}

/**
 * Fetch all Vincere users
 */
export async function getAllVincereUsers(
  client?: VincereClient
): Promise<VincereUserSummary[]> {
  const vincere = client ?? getVincereClient();
  const users = await vincere.get<VincereUserSummary[]>('/user/summaries/all');
  return users || [];
}

/**
 * Search activities within a date range
 *
 * Uses POST /user/activities with pagination (max 25 per slice)
 * Filters by creator_id to get activities created by a specific user
 */
export async function getActivitiesInRange(
  fromDate: Date,
  toDate: Date,
  client?: VincereClient
): Promise<VincereActivity[]> {
  const vincere = client ?? getVincereClient();
  const allActivities: VincereActivity[] = [];

  let index = 0;
  let isLast = false;

  while (!isLast) {
    const response = await vincere.post<ActivitiesSearchResponse>(
      '/user/activities',
      {
        index,
      }
    );

    if (response.content && Array.isArray(response.content)) {
      // Filter by date on client side since API doesn't seem to support date filtering reliably
      const filtered = response.content.filter((activity) => {
        if (!activity.insert_timestamp) return false;
        const activityDate = new Date(activity.insert_timestamp);
        return activityDate >= fromDate && activityDate <= toDate;
      });
      allActivities.push(...filtered);
    }

    isLast = response.last;
    index++;

    // Safety limit to prevent infinite loops
    if (index > 100) {
      console.warn(`[activities] Reached pagination limit`);
      break;
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return allActivities;
}

/**
 * Count activities by type and user within a date range
 */
export async function countActivitiesByUser(
  fromDate: Date,
  toDate: Date,
  client?: VincereClient
): Promise<UserActivityCounts[]> {
  const vincere = client ?? getVincereClient();

  // Get all activities in range
  const activities = await getActivitiesInRange(fromDate, toDate, vincere);

  // Group by creator
  const userCounts: Record<number, { placements: number; applications: number; name: string }> = {};

  for (const activity of activities) {
    // Use creator as the person who did the activity
    const creatorId = activity.creator?.id;
    if (!creatorId) continue;

    if (!userCounts[creatorId]) {
      const apiName = activity.creator?.full_name;
      userCounts[creatorId] = {
        placements: 0,
        applications: 0,
        name: getUserName(creatorId, apiName),
      };
    }

    if (activity.activity_type === 'PLACEMENT') {
      userCounts[creatorId].placements++;
    } else if (activity.activity_type === 'APPLICATION') {
      userCounts[creatorId].applications++;
    }
  }

  // Convert to array
  const results: UserActivityCounts[] = Object.entries(userCounts).map(([id, counts]) => ({
    vincereUserId: parseInt(id),
    userName: counts.name,
    placementsCount: counts.placements,
    applicationsCount: counts.applications,
    totalCount: counts.placements + counts.applications,
  }));

  return results;
}

/**
 * Sync activities for all users within a date range
 *
 * Returns activity counts per user, ready for database upsert
 */
export async function syncAllUserActivities(
  fromDate: Date,
  toDate: Date,
  client?: VincereClient
): Promise<UserActivityCounts[]> {
  const vincere = client ?? getVincereClient();

  console.log(`[activities] Syncing activities from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

  const results = await countActivitiesByUser(fromDate, toDate, vincere);

  console.log(`[activities] Found activities for ${results.length} users`);

  // Also get all users to include those with 0 activities
  const allUsers = await getAllVincereUsers(vincere);

  // Add users with 0 activities
  const existingUserIds = new Set(results.map(r => r.vincereUserId));

  for (const user of allUsers) {
    if (!existingUserIds.has(user.id)) {
      const apiName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      results.push({
        vincereUserId: user.id,
        userName: getUserName(user.id, apiName || undefined),
        placementsCount: 0,
        applicationsCount: 0,
        totalCount: 0,
      });
    }
  }

  return results;
}

/**
 * Get date range for previous day (used for daily cron)
 */
export function getPreviousDayRange(): { fromDate: Date; toDate: Date } {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Start of yesterday (00:00:00)
  const fromDate = new Date(yesterday);
  fromDate.setHours(0, 0, 0, 0);

  // End of yesterday (23:59:59.999)
  const toDate = new Date(yesterday);
  toDate.setHours(23, 59, 59, 999);

  return { fromDate, toDate };
}
