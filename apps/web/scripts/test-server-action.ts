import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { syncCandidateUpdate } from '../lib/vincere/sync-service';

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get candidate
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, phone, vincere_id')
    .eq('email', 'seguelac+33334@gmail.com')
    .single();

  if (!candidate) {
    console.log('Candidate not found');
    return;
  }

  console.log('=== BEFORE ===');
  console.log('Candidate ID:', candidate.id);
  console.log('Vincere ID:', candidate.vincere_id);
  console.log('Database phone:', candidate.phone);

  // Test with a unique VALID phone (format that Vincere accepts)
  const testPhone = `+336${Date.now().toString().slice(-8)}`;
  console.log('\n=== TEST SYNC ===');
  console.log('Test phone to sync:', testPhone);

  // This mimics exactly what the server action sends
  const syncPayload = {
    first_name: 'CedricTest',
    last_name: 'SeguelaTest',
    phone: testPhone,
  };

  console.log('syncPayload:', JSON.stringify(syncPayload, null, 2));

  const result = await syncCandidateUpdate(candidate.id, syncPayload);
  console.log('\n=== SYNC RESULT ===');
  console.log(JSON.stringify(result, null, 2));

  // Verify Vincere
  console.log('\n=== VERIFY VINCERE ===');
  const clientId = process.env.VINCERE_CLIENT_ID;
  const apiKey = process.env.VINCERE_API_KEY;
  const domain = process.env.VINCERE_DOMAIN || 'lighthouse-careers';
  const refreshToken = process.env.VINCERE_REFRESH_TOKEN;

  const tokenResponse = await fetch('https://id.vincere.io/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId!,
      refresh_token: refreshToken!,
    }),
  });

  const tokenData = (await tokenResponse.json()) as { id_token: string };

  const vincereResponse = await fetch(
    `https://${domain}.vincere.io/api/v2/candidate/${candidate.vincere_id}`,
    {
      headers: {
        'x-api-key': apiKey!,
        'id-token': tokenData.id_token,
        accept: 'application/json',
      },
    }
  );

  const vincereCandidate = (await vincereResponse.json()) as { phone: string | null };
  console.log('Vincere phone AFTER sync:', vincereCandidate.phone);

  if (vincereCandidate.phone === testPhone) {
    console.log('\n✅ SUCCESS! Phone synced correctly');
  } else {
    console.log('\n❌ FAILED! Phone mismatch');
    console.log('Expected:', testPhone);
    console.log('Got:', vincereCandidate.phone);
  }
}

test().catch(console.error);
