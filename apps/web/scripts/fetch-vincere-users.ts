#!/usr/bin/env npx tsx
/**
 * Fetch Vincere users to get the ID to name mapping
 *
 * Usage: npx tsx apps/web/scripts/fetch-vincere-users.ts
 */

import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

import { getVincereClient } from '../lib/vincere/client';

interface VincereUserSummary {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: string;
}

async function main() {
  const vincere = getVincereClient();

  console.log('Fetching all Vincere users...\n');

  try {
    const users = await vincere.get<VincereUserSummary[]>('/user/summaries/all');

    if (!users || users.length === 0) {
      console.log('No users found');
      return;
    }

    console.log(`Found ${users.length} users\n`);

    // Generate the mapping code
    console.log('// Vincere user ID to name mapping');
    console.log('const VINCERE_USER_NAMES: Record<number, string> = {');

    for (const user of users) {
      const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || `User ${user.id}`;
      console.log(`  ${user.id}: '${name}',`);
    }

    console.log('};');

    console.log('\n\nFull user details:');
    console.log(JSON.stringify(users, null, 2));

  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

main().catch(console.error);
