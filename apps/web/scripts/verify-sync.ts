import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function verify() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check database
  const { data: candidate } = await supabase
    .from('candidates')
    .select('phone, vincere_id, updated_at, last_synced_at')
    .eq('email', 'seguelac+33334@gmail.com')
    .single();

  console.log('=== DATABASE ===');
  console.log('Phone:', candidate?.phone);
  console.log('Updated at:', candidate?.updated_at);
  console.log('Last synced:', candidate?.last_synced_at);

  // Check Vincere
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
  const token = tokenData.id_token;

  const vincereResponse = await fetch(`https://${domain}.vincere.io/api/v2/candidate/${candidate?.vincere_id}`, {
    headers: {
      'x-api-key': apiKey,
      'id-token': token,
      'accept': 'application/json',
    },
  });

  const vincere = await vincereResponse.json() as any;

  console.log('');
  console.log('=== VINCERE ===');
  console.log('Phone:', vincere.phone);
  console.log('Mobile:', vincere.mobile);
  console.log('Updated:', vincere.updated_timestamp);

  console.log('');
  console.log('=== RESULT ===');
  if (candidate?.phone === vincere.phone) {
    console.log('✅ SUCCESS! Phone matches between database and Vincere');
  } else {
    console.log('❌ MISMATCH!');
    console.log('Database:', candidate?.phone);
    console.log('Vincere:', vincere.phone);
  }
}

verify().catch(console.error);
