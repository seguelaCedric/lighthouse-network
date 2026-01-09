/**
 * Test nationality field update in Vincere
 *
 * Run with: npx tsx apps/web/scripts/test-nationality-update.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

async function main() {
  const { getVincereClient } = await import('../lib/vincere/client');

  const client = getVincereClient();
  await client.authenticate();

  const vincereId = 258802;

  console.log('=== Testing Nationality Update ===\n');

  // Get current data
  const current = await client.get<any>(`/candidate/${vincereId}`);
  console.log(`Current nationality: ${current?.nationality} (type: ${typeof current?.nationality})`);

  // Test 1: Try updating with country code string
  console.log('\n--- Test 1: Update with "FR" string ---');
  try {
    const payload1 = {
      first_name: current?.first_name,
      last_name: current?.last_name,
      email: current?.email,
      registration_date: current?.registration_date,
      candidate_source_id: current?.candidate_source_id,
      nationality: 'FR',
    };
    const result1 = await client.put(`/candidate/${vincereId}`, payload1);
    console.log('Success:', JSON.stringify(result1, null, 2));

    await new Promise(r => setTimeout(r, 500));
    const after1 = await client.get<any>(`/candidate/${vincereId}`);
    console.log(`After update: nationality = ${after1?.nationality}`);
  } catch (err: any) {
    console.log('Error:', err.message?.substring(0, 200));
  }

  // Test 2: Try updating with "French" string
  console.log('\n--- Test 2: Update with "French" string ---');
  try {
    const payload2 = {
      first_name: current?.first_name,
      last_name: current?.last_name,
      email: current?.email,
      registration_date: current?.registration_date,
      candidate_source_id: current?.candidate_source_id,
      nationality: 'French',
    };
    const result2 = await client.put(`/candidate/${vincereId}`, payload2);
    console.log('Success:', JSON.stringify(result2, null, 2));

    await new Promise(r => setTimeout(r, 500));
    const after2 = await client.get<any>(`/candidate/${vincereId}`);
    console.log(`After update: nationality = ${after2?.nationality}`);
  } catch (err: any) {
    console.log('Error:', err.message?.substring(0, 200));
  }

  // Test 3: Check what our DB stores for nationality
  console.log('\n--- Checking DB nationality values ---');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, first_name, nationality')
    .not('nationality', 'is', null)
    .limit(10);

  console.log('Sample nationalities from DB:');
  for (const c of candidates || []) {
    console.log(`  ${c.first_name}: ${c.nationality}`);
  }

  // Test 4: See if Vincere returns different format
  console.log('\n--- Checking multiple Vincere candidates ---');
  const testIds = [160705, 74429, 202314];
  for (const id of testIds) {
    try {
      const c = await client.get<any>(`/candidate/${id}`);
      console.log(`  ${id}: nationality = ${c?.nationality}`);
    } catch {
      // ignore
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
