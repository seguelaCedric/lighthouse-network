/**
 * Backfill recruiter activities for the last N days
 *
 * Usage: npx tsx scripts/backfill-activities.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use the same auth approach as the existing Vincere client
const AUTH_URL = 'https://id.vincere.io/oauth2/token';
const API_BASE_URL = 'https://lighthouse-careers.vincere.io/api/v2';

interface TokenResponse {
  id_token: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

interface VincereActivity {
  id: number;
  activity_type: string; // PLACEMENT, APPLICATION, etc.
  insert_timestamp?: string;
  creator?: {
    id: number;
    full_name?: string;
  };
}

interface ActivitiesSearchResponse {
  content?: VincereActivity[];
  slice_index: number;
  num_of_elements: number;
  last: boolean;
}

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
};

function getUserName(userId: number, apiName?: string): string {
  return VINCERE_USER_NAMES[userId] || apiName || `User ${userId}`;
}

let idToken: string | null = null;

async function authenticate(): Promise<string> {
  const body = new URLSearchParams({
    client_id: process.env.VINCERE_CLIENT_ID!,
    grant_type: 'refresh_token',
    refresh_token: process.env.VINCERE_REFRESH_TOKEN!,
  });

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Auth failed: ${response.status} ${errorText}`);
  }

  const data: TokenResponse = await response.json();
  if (!data.id_token) {
    throw new Error('No id_token in auth response');
  }

  idToken = data.id_token;
  return idToken;
}

async function getToken(): Promise<string> {
  if (!idToken) {
    await authenticate();
  }
  return idToken!;
}

async function vincereGet<T>(endpoint: string): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'accept': 'application/json',
      'id-token': token,
      'x-api-key': process.env.VINCERE_API_KEY!,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${endpoint} failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function vincerePost<T>(endpoint: string, data: object): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'id-token': token,
      'x-api-key': process.env.VINCERE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POST ${endpoint} failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function getAllActivities(): Promise<VincereActivity[]> {
  const allActivities: VincereActivity[] = [];
  let index = 0;
  let isLast = false;

  console.log('Fetching all activities from Vincere...');

  while (!isLast) {
    const response = await vincerePost<ActivitiesSearchResponse>(
      '/user/activities',
      { index }
    );

    if (response.content && Array.isArray(response.content)) {
      allActivities.push(...response.content);
    }

    isLast = response.last;
    index++;

    if (index % 10 === 0) {
      console.log(`  Fetched ${allActivities.length} activities so far...`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));

    // Safety limit
    if (index > 200) {
      console.warn('Reached pagination limit');
      break;
    }
  }

  console.log(`Total activities fetched: ${allActivities.length}`);
  return allActivities;
}

async function backfillActivities(days: number = 30) {
  console.log(`\n🔄 Backfilling activities for the last ${days} days...\n`);

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .limit(1)
    .single();

  if (orgError || !org) {
    console.error("No organization found:", orgError);
    return;
  }

  // Authenticate first
  console.log("🔐 Authenticating with Vincere...");
  await authenticate();
  console.log("✅ Authenticated\n");

  // Fetch ALL activities first (more efficient than per-day queries)
  const allActivities = await getAllActivities();

  // Get all Vincere users
  const users = await vincereGet<Array<{ id: number; name?: string; first_name?: string; last_name?: string }>>(
    '/user/summaries/all'
  );

  console.log(`\nFound ${users.length} Vincere users\n`);

  // Group activities by date and user
  const activitiesByDateAndUser = new Map<string, Map<number, { placements: number; applications: number; name: string }>>();

  for (const activity of allActivities) {
    if (!activity.insert_timestamp || !activity.creator?.id) continue;

    const activityDate = activity.insert_timestamp.split('T')[0]; // YYYY-MM-DD
    const userId = activity.creator.id;

    if (!activitiesByDateAndUser.has(activityDate)) {
      activitiesByDateAndUser.set(activityDate, new Map());
    }

    const dateMap = activitiesByDateAndUser.get(activityDate)!;
    if (!dateMap.has(userId)) {
      dateMap.set(userId, {
        placements: 0,
        applications: 0,
        name: getUserName(userId, activity.creator.full_name),
      });
    }

    const userCounts = dateMap.get(userId)!;
    if (activity.activity_type === 'PLACEMENT') {
      userCounts.placements++;
    } else if (activity.activity_type === 'APPLICATION') {
      userCounts.applications++;
    }
  }

  // Calculate date range
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  // Process each day
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset - 1);
    const activityDate = date.toISOString().split('T')[0];

    console.log(`\n📅 Processing ${activityDate}...`);

    const dateMap = activitiesByDateAndUser.get(activityDate) || new Map();

    // Create records for all users (including those with 0 activities)
    const records: Array<{
      organization_id: string;
      vincere_user_id: number;
      user_name: string;
      activity_date: string;
      placements_count: number;
      applications_count: number;
      synced_at: string;
    }> = [];

    for (const user of users) {
      const userName = VINCERE_USER_NAMES[user.id] ||
        user.name ||
        `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
        `User ${user.id}`;

      const userCounts = dateMap.get(user.id);

      records.push({
        organization_id: org.id,
        vincere_user_id: user.id,
        user_name: userName,
        activity_date: activityDate,
        placements_count: userCounts?.placements || 0,
        applications_count: userCounts?.applications || 0,
        synced_at: new Date().toISOString(),
      });
    }

    // Log users with activities
    for (const [userId, counts] of dateMap.entries()) {
      if (counts.placements > 0 || counts.applications > 0) {
        console.log(`  ✅ ${counts.name}: ${counts.placements} placements, ${counts.applications} applications`);
      }
    }

    // Upsert to database
    const { error: upsertError } = await supabase
      .from("recruiter_activities")
      .upsert(records, {
        onConflict: "organization_id,vincere_user_id,activity_date",
      });

    if (upsertError) {
      console.error(`Failed to upsert for ${activityDate}:`, upsertError);
    } else {
      const totalPlacements = records.reduce((sum, r) => sum + r.placements_count, 0);
      const totalApplications = records.reduce((sum, r) => sum + r.applications_count, 0);
      if (totalPlacements > 0 || totalApplications > 0) {
        console.log(`  📊 Total: ${totalPlacements} placements, ${totalApplications} applications`);
      }
    }
  }

  console.log("\n✅ Backfill complete!\n");
}

// Run - backfill last 30 days to get good data coverage
backfillActivities(30).catch(console.error);
