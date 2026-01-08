/**
 * Fetch Vincere Webhooks
 *
 * This script fetches all webhooks configured in Vincere.
 *
 * Run with: npx tsx apps/web/scripts/fetch-vincere-webhooks.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

async function main() {
  console.log('Fetching Vincere webhooks...\n');

  const { getVincereClient } = await import('../lib/vincere/client');
  const client = getVincereClient();

  // Authenticate
  await client.authenticate();
  console.log('Authenticated successfully\n');

  // Fetch all webhooks
  try {
    const webhooks = await client.get<unknown[]>('/webhooks');
    console.log('=== VINCERE WEBHOOKS ===');
    console.log(JSON.stringify(webhooks, null, 2));
  } catch (e) {
    console.error('Error fetching webhooks:', e);
  }
}

main().catch(console.error);
