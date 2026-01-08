/**
 * Fetch Vincere Functional Expertises
 *
 * This script fetches all functional expertises from Vincere to get the correct IDs
 * for updating VINCERE_FUNCTIONAL_EXPERTISE_IDS in constants.ts
 *
 * Run with: npx tsx apps/web/scripts/fetch-vincere-functional-expertises.ts
 *
 * Required environment variables:
 * - VINCERE_CLIENT_ID
 * - VINCERE_API_KEY
 * - VINCERE_REFRESH_TOKEN
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

interface FunctionalExpertise {
  id?: number;
  name?: string;
  value?: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
}

async function main() {
  console.log('Fetching Vincere functional expertises...\n');

  const { getVincereClient } = await import('../lib/vincere/client');
  const client = getVincereClient();

  // Authenticate
  await client.authenticate();
  console.log('Authenticated successfully\n');

  // Fetch all functional expertises
  // The endpoint might be /functionalexpertise (singular) or /functionalexpertises (plural)
  // Try both
  let expertises: FunctionalExpertise[] = [];

  try {
    expertises = await client.get<FunctionalExpertise[]>('/functionalexpertise');
  } catch (e) {
    console.log('Trying /functionalexpertises endpoint...');
    try {
      expertises = await client.get<FunctionalExpertise[]>('/functionalexpertises');
    } catch (e2) {
      console.error('Could not fetch functional expertises from either endpoint');
      console.error(e2);
      process.exit(1);
    }
  }

  if (!expertises || expertises.length === 0) {
    console.log('No functional expertises found');
    process.exit(0);
  }

  console.log(`Found ${expertises.length} functional expertises:\n`);

  // Debug: show first few raw entries
  console.log('=== RAW DATA (first 5) ===');
  console.log(JSON.stringify(expertises.slice(0, 5), null, 2));
  console.log();

  // Normalize entries - API returns {value, description} not {id, name}
  const normalized = expertises.map(e => ({
    id: e.id ?? parseInt(e.value || '0', 10),
    name: e.name ?? e.description ?? '',
  })).filter(e => e.name && e.id);

  // Output as simple list first
  console.log('=== ALL EXPERTISES (ID: Name) ===');
  for (const exp of normalized.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${exp.id}: '${exp.name}'`);
  }

  // Output as TypeScript constant format
  console.log('\n\n// TypeScript constant format:');
  console.log('export const VINCERE_FUNCTIONAL_EXPERTISE_IDS: Record<string, number> = {');
  for (const exp of normalized.sort((a, b) => a.name.localeCompare(b.name))) {
    // Escape single quotes in name and trim whitespace
    const safeName = exp.name.trim().replace(/'/g, "\\'");
    console.log(`  '${safeName}': ${exp.id},`);
  }
  console.log('};');
}

main().catch(console.error);
