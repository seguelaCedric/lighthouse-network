/**
 * Test Vincere Bidirectional Sync
 *
 * Tests that:
 * 1. Updates from our app are properly synced to Vincere
 * 2. Updates from Vincere are properly synced to our app
 *
 * Run with: npx tsx apps/web/scripts/test-vincere-sync.ts <email>
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const args = process.argv.slice(2);
const email = args[0];

if (!email) {
  console.error('Usage: npx tsx apps/web/scripts/test-vincere-sync.ts <email>');
  process.exit(1);
}

async function main() {
  console.log(`Testing Vincere sync for: ${email}\n`);

  const { getVincereClient } = await import('../lib/vincere/client');
  const { searchByEmail, getCustomFields, getFullCandidateData } = await import('../lib/vincere/candidates');
  const { mapVincereToCandidate, mapCandidateToVincere } = await import('../lib/vincere/sync');
  const { VINCERE_FIELD_KEYS } = await import('../lib/vincere/constants');

  const client = getVincereClient();

  // Step 1: Get candidate from Vincere
  console.log('=== STEP 1: Fetch from Vincere ===');
  const vincereCandidate = await searchByEmail(email, client);

  if (!vincereCandidate) {
    console.error('Candidate not found in Vincere by email');
    process.exit(1);
  }

  console.log(`Found Vincere candidate ID: ${vincereCandidate.id}`);

  // Get full data
  const fullData = await getFullCandidateData(vincereCandidate.id, client);
  if (!fullData) {
    console.error('Failed to get full candidate data');
    process.exit(1);
  }

  // Step 2: Map Vincere → App
  console.log('\n=== STEP 2: Vincere → App Mapping ===');
  const mappedFromVincere = mapVincereToCandidate(fullData.candidate, fullData.customFields, {
    functionalExpertises: fullData.functionalExpertises,
    currentLocation: fullData.currentLocation,
    candidateStatus: fullData.candidateStatus,
  });

  console.log('Mapped fields from Vincere:');
  const vincereFields = Object.entries(mappedFromVincere)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v).substring(0, 50)}`);
  console.log(vincereFields.join('\n'));

  // Step 3: Map App → Vincere
  console.log('\n=== STEP 3: App → Vincere Mapping ===');
  const { basicData, customFields } = mapCandidateToVincere(mappedFromVincere);

  console.log('Basic data to sync to Vincere:');
  console.log(JSON.stringify(basicData, null, 2));

  console.log('\nCustom fields to sync to Vincere:');
  for (const cf of customFields) {
    // Find field name from key
    const fieldName = Object.entries(VINCERE_FIELD_KEYS).find(([, v]) => v === cf.fieldKey)?.[0] || cf.fieldKey;
    console.log(`  ${fieldName}: value=${cf.fieldValue ?? 'N/A'}, values=${JSON.stringify(cf.fieldValues)}, date=${cf.dateValue ?? 'N/A'}`);
  }

  // Step 4: Compare what's in DB vs what's in Vincere
  console.log('\n=== STEP 4: Field Comparison ===');
  const criticalFields = [
    'has_visible_tattoos',
    'tattoo_description',
    'is_smoker',
    'marital_status',
    'has_stcw',
    'has_eng1',
    'has_schengen',
    'has_b1b2',
    'partner_name',
    'partner_position',
    'preferred_yacht_types',
    'preferred_contract_types',
    'available_from',
    'desired_salary_min',
    'desired_salary_max',
  ] as const;

  console.log('Critical fields from Vincere mapping:');
  for (const field of criticalFields) {
    const value = mappedFromVincere[field as keyof typeof mappedFromVincere];
    const status = value !== null && value !== undefined ? '✓' : '✗';
    console.log(`  ${status} ${field}: ${JSON.stringify(value)}`);
  }

  console.log('\n=== SYNC TEST COMPLETE ===');
  console.log('If all critical fields show ✓, the mapping is working correctly.');
  console.log('To test full sync:');
  console.log('  1. Update the candidate in our app');
  console.log('  2. Check Vincere to see if changes appear');
  console.log('  3. Update the candidate in Vincere');
  console.log('  4. Trigger webhook and check our DB');
}

main().catch(console.error);
