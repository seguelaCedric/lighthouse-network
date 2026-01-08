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

import { getVincereClient } from '../lib/vincere/client';

interface FunctionalExpertise {
  id: number;
  name: string;
  parent_id?: number;
  parent_name?: string;
}

async function main() {
  console.log('Fetching Vincere functional expertises...\n');

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

  // Group by parent
  const grouped = new Map<string, FunctionalExpertise[]>();
  const topLevel: FunctionalExpertise[] = [];

  for (const exp of expertises) {
    if (!exp.parent_id) {
      topLevel.push(exp);
    } else {
      const parentKey = exp.parent_name || `Parent ${exp.parent_id}`;
      if (!grouped.has(parentKey)) {
        grouped.set(parentKey, []);
      }
      grouped.get(parentKey)!.push(exp);
    }
  }

  // Print top-level first
  if (topLevel.length > 0) {
    console.log('Top-Level Expertises:');
    for (const exp of topLevel.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  ${exp.id}: '${exp.name}'`);
    }
    console.log();
  }

  // Print grouped
  for (const [parent, items] of Array.from(grouped.entries()).sort()) {
    console.log(`${parent}:`);
    for (const exp of items.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  ${exp.id}: '${exp.name}'`);
    }
    console.log();
  }

  // Output as TypeScript constant format
  console.log('\n// TypeScript constant format:');
  console.log('export const VINCERE_FUNCTIONAL_EXPERTISE_IDS: Record<string, number> = {');
  for (const exp of expertises.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  '${exp.name}': ${exp.id},`);
  }
  console.log('};');
}

main().catch(console.error);
