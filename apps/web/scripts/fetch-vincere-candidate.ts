/**
 * Fetch Vincere Candidate Data
 *
 * Fetches a candidate from Vincere by email to see their custom fields
 * and functional expertises.
 *
 * Run with: npx tsx apps/web/scripts/fetch-vincere-candidate.ts <email>
 *
 * Example: npx tsx apps/web/scripts/fetch-vincere-candidate.ts seguelac+33334@gmail.com
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

// Need to set env vars before importing vincere modules
const args = process.argv.slice(2);
const email = args[0];

if (!email) {
  console.error('Usage: npx tsx apps/web/scripts/fetch-vincere-candidate.ts <email>');
  process.exit(1);
}

async function main() {
  // Dynamic import after env is loaded
  const { getVincereClient } = await import('../lib/vincere/client');
  const { searchByEmail, getCustomFields, getFunctionalExpertises } = await import('../lib/vincere/candidates');
  const { VINCERE_FIELD_KEYS } = await import('../lib/vincere/constants');

  console.log(`Fetching Vincere candidate: ${email}\n`);

  const client = getVincereClient();

  // Authenticate
  await client.authenticate();
  console.log('Authenticated successfully\n');

  // Search for candidate
  const candidate = await searchByEmail(email, client);

  if (!candidate) {
    console.log('Candidate not found in Vincere');
    process.exit(0);
  }

  console.log('=== BASIC CANDIDATE DATA ===');
  console.log(JSON.stringify(candidate, null, 2));
  console.log();

  // Get custom fields
  console.log('=== CUSTOM FIELDS ===');
  const customFields = await getCustomFields(candidate.id, client);

  // Create reverse lookup for field keys
  const fieldKeyToName: Record<string, string> = {};
  for (const [name, key] of Object.entries(VINCERE_FIELD_KEYS)) {
    fieldKeyToName[key] = name;
  }

  for (const [key, field] of Object.entries(customFields)) {
    const fieldName = fieldKeyToName[key] || 'UNKNOWN';
    console.log(`${fieldName} (${key}):`);
    console.log(`  name: ${field.name}`);
    if (field.field_value !== undefined) console.log(`  field_value: ${field.field_value}`);
    if (field.field_values !== undefined) console.log(`  field_values: ${JSON.stringify(field.field_values)}`);
    if (field.date_value !== undefined) console.log(`  date_value: ${field.date_value}`);
    console.log();
  }

  // Get functional expertises
  console.log('=== FUNCTIONAL EXPERTISES ===');
  const expertises = await getFunctionalExpertises(candidate.id, client);
  console.log(JSON.stringify(expertises, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
