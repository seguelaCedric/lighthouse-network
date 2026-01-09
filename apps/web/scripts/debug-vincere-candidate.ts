/**
 * Debug Vincere Candidate Data
 *
 * Fetches a candidate from Vincere and shows all custom fields to debug mapping issues.
 *
 * Run with: npx tsx apps/web/scripts/debug-vincere-candidate.ts <email-or-vincere-id>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const args = process.argv.slice(2);
const emailOrId = args[0];

if (!emailOrId) {
  console.error('Usage: npx tsx apps/web/scripts/debug-vincere-candidate.ts <email-or-vincere-id>');
  process.exit(1);
}

async function main() {
  console.log(`Fetching Vincere candidate: ${emailOrId}\n`);

  const { getVincereClient } = await import('../lib/vincere/client');
  const { searchByEmail, getById, getCustomFields, getFullCandidateData } = await import('../lib/vincere/candidates');
  const { mapVincereToCandidate } = await import('../lib/vincere/sync');
  const { VINCERE_FIELD_KEYS } = await import('../lib/vincere/constants');

  const client = getVincereClient();

  let vincereId: number;

  // Determine if it's an email or ID
  if (emailOrId.includes('@')) {
    console.log(`Searching for candidate by email: ${emailOrId}`);
    const candidate = await searchByEmail(emailOrId, client);
    if (!candidate) {
      console.error('Candidate not found by email');
      process.exit(1);
    }
    vincereId = candidate.id;
    console.log(`Found candidate ID: ${vincereId}\n`);
  } else {
    vincereId = parseInt(emailOrId, 10);
    if (isNaN(vincereId)) {
      console.error('Invalid Vincere ID');
      process.exit(1);
    }
  }

  // Fetch full candidate data
  const fullData = await getFullCandidateData(vincereId, client);
  if (!fullData) {
    console.error('Failed to fetch candidate data');
    process.exit(1);
  }

  console.log('=== BASIC CANDIDATE DATA ===');
  console.log(JSON.stringify(fullData.candidate, null, 2));

  console.log('\n=== ALL CUSTOM FIELDS (RAW) ===');
  console.log(JSON.stringify(fullData.customFields, null, 2));

  console.log('\n=== FIELD KEY MAPPING ===');
  for (const [ourKey, vincereKey] of Object.entries(VINCERE_FIELD_KEYS)) {
    const field = fullData.customFields[vincereKey];
    if (field) {
      console.log(`${ourKey} (${vincereKey}):`);
      console.log(`  name: ${field.name}`);
      console.log(`  field_value: ${field.field_value ?? 'null'}`);
      console.log(`  field_values: ${JSON.stringify(field.field_values)}`);
      console.log(`  date_value: ${field.date_value ?? 'null'}`);
    } else {
      console.log(`${ourKey} (${vincereKey}): NOT FOUND`);
    }
  }

  console.log('\n=== MAPPED CANDIDATE DATA ===');
  const mapped = mapVincereToCandidate(fullData.candidate, fullData.customFields, {
    functionalExpertises: fullData.functionalExpertises,
    currentLocation: fullData.currentLocation,
    candidateStatus: fullData.candidateStatus,
  });
  console.log(JSON.stringify(mapped, null, 2));

  // Specifically check tattoo fields
  console.log('\n=== TATTOO FIELDS DEBUG ===');
  const tattoosField = fullData.customFields[VINCERE_FIELD_KEYS.tattoos];
  const tattooLocationField = fullData.customFields[VINCERE_FIELD_KEYS.tattooLocation];

  console.log('tattoos field:', JSON.stringify(tattoosField, null, 2));
  console.log('tattooLocation field:', JSON.stringify(tattooLocationField, null, 2));
  console.log('Mapped has_visible_tattoos:', mapped.has_visible_tattoos);
  console.log('Mapped tattoo_description:', mapped.tattoo_description);
}

main().catch(console.error);
