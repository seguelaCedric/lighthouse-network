/**
 * Vincere Activities Service
 *
 * Fetches recruiter activities (tasks and meetings) from Vincere API
 * for CEO visibility into team performance.
 *
 * API Endpoints:
 * - POST /user/activities - Search activities linked to a user
 * - GET /report/statistics - Get user statistics for a period
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
  type: 'TASK' | 'MEETING';
  subject?: string;
  content?: string;
  due_date?: string;
  completed?: boolean;
  assignee_id?: number;
  creator_id?: number;
  created_date?: string;
  insert_timestamp?: string;
}

/**
 * Response from POST /user/activities
 */
interface ActivitiesSearchResponse {
  result?: VincereActivity[];
  index: number;
  is_last_slice: boolean;
}

/**
 * User statistics from GET /report/statistics
 */
export interface VincereUserStatistics {
  consultant_id: number;
  period: string;
  // Add more fields as needed based on API response
  placements_count?: number;
  submissions_count?: number;
  interviews_count?: number;
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
  tasksCount: number;
  meetingsCount: number;
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
 * Search activities for a user within a date range
 *
 * Uses POST /user/activities with pagination (max 25 per slice)
 */
export async function getUserActivities(
  userId: number,
  fromDate: Date,
  toDate: Date,
  options?: {
    includeTasks?: boolean;
    includeMeetings?: boolean;
    completedOnly?: boolean;
  },
  client?: VincereClient
): Promise<VincereActivity[]> {
  const vincere = client ?? getVincereClient();
  const allActivities: VincereActivity[] = [];

  const {
    includeTasks = true,
    includeMeetings = true,
    completedOnly = false,
  } = options ?? {};

  let index = 0;
  let isLastSlice = false;

  while (!isLastSlice) {
    const response = await vincere.post<ActivitiesSearchResponse>(
      '/user/activities',
      {
        assignee_id: userId,
        include_task: includeTasks,
        include_meeting: includeMeetings,
        completed: completedOnly ? true : null,
        from_date: fromDate.toISOString(),
        to_date: toDate.toISOString(),
        index,
      }
    );

    if (response.result && Array.isArray(response.result)) {
      allActivities.push(...response.result);
    }

    isLastSlice = response.is_last_slice;
    index++;

    // Safety limit to prevent infinite loops
    if (index > 100) {
      console.warn(`[activities] Reached pagination limit for user ${userId}`);
      break;
    }
  }

  return allActivities;
}

/**
 * Get user statistics for a period
 */
export async function getUserStatistics(
  userId: number,
  period: 'CURRENT_MONTH' | 'LAST_MONTH',
  client?: VincereClient
): Promise<VincereUserStatistics | null> {
  const vincere = client ?? getVincereClient();

  try {
    const stats = await vincere.get<VincereUserStatistics>(
      `/report/statistics?consultant_id=${userId}&period=${period}`
    );
    return stats;
  } catch (error) {
    console.error(`[activities] Failed to get statistics for user ${userId}:`, error);
    return null;
  }
}

/**
 * Count activities by type for a user within a date range
 */
export async function countUserActivities(
  userId: number,
  userName: string,
  fromDate: Date,
  toDate: Date,
  client?: VincereClient
): Promise<UserActivityCounts> {
  const activities = await getUserActivities(userId, fromDate, toDate, {}, client);

  let tasksCount = 0;
  let meetingsCount = 0;

  for (const activity of activities) {
    if (activity.type === 'TASK') {
      tasksCount++;
    } else if (activity.type === 'MEETING') {
      meetingsCount++;
    }
  }

  return {
    vincereUserId: userId,
    userName,
    tasksCount,
    meetingsCount,
    totalCount: tasksCount + meetingsCount,
  };
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

  // Get all Vincere users
  const users = await getAllVincereUsers(vincere);

  if (users.length === 0) {
    console.log('[activities] No Vincere users found');
    return [];
  }

  console.log(`[activities] Syncing activities for ${users.length} users from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

  const results: UserActivityCounts[] = [];

  for (const user of users) {
    try {
      // Use the mapping for proper names, fallback to API response
      const apiName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const userName = getUserName(user.id, apiName || undefined);

      const counts = await countUserActivities(
        user.id,
        userName,
        fromDate,
        toDate,
        vincere
      );

      results.push(counts);

      // Rate limiting - 100ms between API calls to avoid hitting limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[activities] Failed to sync activities for user ${user.id}:`, error);
      // Continue with other users even if one fails
    }
  }

  console.log(`[activities] Synced activities for ${results.length} users`);

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
