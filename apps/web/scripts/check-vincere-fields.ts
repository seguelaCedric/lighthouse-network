/**
 * Check what field names Vincere uses for phone and nationality
 *
 * Run with: npx tsx apps/web/scripts/check-vincere-fields.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

async function main() {
  const { getVincereClient } = await import('../lib/vincere/client');

  const client = getVincereClient();
  await client.authenticate();

  // Use a candidate we know exists
  const vincereId = 160705;

  console.log('=== Checking Vincere Field Names ===\n');

  const candidate = await client.get<any>(`/candidate/${vincereId}`);

  // Find phone-related fields
  console.log('Phone-related fields:');
  for (const [key, value] of Object.entries(candidate || {})) {
    if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }
  }

  // Find nationality-related fields
  console.log('\nNationality-related fields:');
  for (const [key, value] of Object.entries(candidate || {})) {
    if (key.toLowerCase().includes('nation')) {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }
  }

  // Also print some key fields
  console.log('\nKey fields:');
  const keyFields = ['phone', 'mobile', 'home_phone', 'work_phone', 'nationality', 'primary_email', 'email'];
  for (const field of keyFields) {
    console.log(`  ${field}: ${JSON.stringify((candidate as any)?.[field])}`);
  }

  // Test updating phone
  console.log('\n=== Testing Phone Update ===');

  const testCandidate = 258802;

  // Get current data
  const current = await client.get<any>(`/candidate/${testCandidate}`);
  console.log(`Current phone: ${current?.phone}`);
  console.log(`Current mobile: ${current?.mobile}`);
  console.log(`Current nationality: ${current?.nationality}`);

  // Try updating with phone field
  console.log('\nTrying to update phone to "+1234567890"...');

  try {
    const updatePayload = {
      first_name: current?.first_name,
      last_name: current?.last_name,
      email: current?.email,
      registration_date: current?.registration_date,
      candidate_source_id: current?.candidate_source_id,
      phone: '+1234567890',
    };

    console.log('Payload:', JSON.stringify(updatePayload, null, 2));

    const result = await client.put(`/candidate/${testCandidate}`, updatePayload);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.log('Error:', err.message?.substring(0, 300));
  }

  // Verify
  await new Promise(r => setTimeout(r, 1000));
  const updated = await client.get<any>(`/candidate/${testCandidate}`);
  console.log(`\nAfter update - phone: ${updated?.phone}`);
  console.log(`After update - mobile: ${updated?.mobile}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
