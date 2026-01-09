import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

/**
 * Full flow test: Update phone in database and verify Vincere sync
 * This simulates what happens when the profile edit form is saved
 */

const TEST_EMAIL = 'seguelac+33334@gmail.com';

async function getVincereToken() {
  const clientId = process.env.VINCERE_CLIENT_ID;
  const apiKey = process.env.VINCERE_API_KEY;
  const domain = process.env.VINCERE_DOMAIN || 'lighthouse-careers';
  const refreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!clientId || !apiKey || !refreshToken) {
    throw new Error('Missing Vincere credentials');
  }

  const tokenResponse = await fetch('https://id.vincere.io/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    }),
  });

  const tokenData = await tokenResponse.json() as any;
  if (!tokenResponse.ok) {
    throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  }

  return {
    token: tokenData.id_token,
    apiKey,
    domain,
  };
}

async function getVincereCandidate(token: string, apiKey: string, domain: string, vincereId: number) {
  const response = await fetch(`https://${domain}.vincere.io/api/v2/candidate/${vincereId}`, {
    headers: {
      'x-api-key': apiKey,
      'id-token': token,
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET candidate failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('🔍 Full Phone Sync Flow Test');
  console.log('============================');
  console.log('Test email:', TEST_EMAIL);
  console.log('');

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Get candidate from database
  console.log('1️⃣ Getting candidate from database...');
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('id, vincere_id, phone, email')
    .eq('email', TEST_EMAIL)
    .single();

  if (error || !candidate) {
    console.error('❌ Candidate not found:', error);
    return;
  }

  console.log('Database candidate:');
  console.log('  ID:', candidate.id);
  console.log('  Vincere ID:', candidate.vincere_id);
  console.log('  Current phone:', candidate.phone);

  if (!candidate.vincere_id) {
    console.error('❌ Candidate has no Vincere ID');
    return;
  }

  // Step 2: Get Vincere auth
  console.log('\n2️⃣ Getting Vincere auth...');
  const { token, apiKey, domain } = await getVincereToken();
  console.log('✅ Got token');

  // Step 3: Get current Vincere state
  console.log('\n3️⃣ Getting current Vincere state...');
  const vincereCandidate = await getVincereCandidate(token, apiKey, domain, parseInt(candidate.vincere_id)) as any;
  console.log('Vincere phone:', vincereCandidate.phone);
  console.log('Vincere mobile:', vincereCandidate.mobile);

  // Step 4: Compare
  console.log('\n4️⃣ Comparison:');
  console.log('Database phone:', candidate.phone);
  console.log('Vincere phone:', vincereCandidate.phone);

  if (candidate.phone === vincereCandidate.phone) {
    console.log('✅ Phone values match!');
  } else {
    console.log('❌ Phone values DO NOT match!');
    console.log('');
    console.log('This means the sync is not working properly.');
    console.log('');
    console.log('Debug info:');
    console.log('  - Database updated_at:', (await supabase.from('candidates').select('updated_at').eq('id', candidate.id).single()).data?.updated_at);
    console.log('  - Database last_synced_at:', (await supabase.from('candidates').select('last_synced_at').eq('id', candidate.id).single()).data?.last_synced_at);
    console.log('  - Vincere updated_timestamp:', vincereCandidate.updated_timestamp);
  }

  // Step 5: Now let's manually trigger the sync and watch what happens
  console.log('\n5️⃣ Triggering manual sync...');

  // Import and call the sync function
  const { syncCandidateUpdate } = await import('../lib/vincere/sync-service');

  const newPhone = '+33612345666';
  console.log('Updating phone to:', newPhone);

  // First update database
  await supabase
    .from('candidates')
    .update({ phone: newPhone })
    .eq('id', candidate.id);
  console.log('✅ Database updated');

  // Then trigger sync
  console.log('Calling syncCandidateUpdate...');
  const syncResult = await syncCandidateUpdate(candidate.id, { phone: newPhone });
  console.log('Sync result:', syncResult);

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check Vincere
  console.log('\n6️⃣ Verifying Vincere update...');
  const afterVincere = await getVincereCandidate(token, apiKey, domain, parseInt(candidate.vincere_id)) as any;
  console.log('Vincere phone after sync:', afterVincere.phone);

  if (afterVincere.phone === newPhone) {
    console.log('✅ SUCCESS! Vincere phone updated correctly');
  } else {
    console.log('❌ FAILED! Vincere phone not updated');
  }
}

main().catch(console.error);
