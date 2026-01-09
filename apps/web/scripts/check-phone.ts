import { config } from 'dotenv';
config({ path: '.env.local' });

async function checkVincere() {
  const clientId = process.env.VINCERE_CLIENT_ID;
  const apiKey = process.env.VINCERE_API_KEY;
  const domain = process.env.VINCERE_DOMAIN || 'lighthouse-careers';
  const refreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!clientId || !apiKey || !refreshToken) {
    console.error('Missing Vincere credentials');
    return;
  }

  // Get access token
  const tokenUrl = 'https://id.vincere.io/oauth2/token';
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    }),
  });

  const tokenData = await tokenResponse.json() as any;
  console.log('Token response status:', tokenResponse.status);
  if (!tokenResponse.ok) {
    console.error('Token error:', tokenData);
    return;
  }
  const accessToken = tokenData.id_token; // Vincere uses id_token, not access_token

  // Get candidate
  const candidateResponse = await fetch(`https://${domain}.vincere.io/api/v2/candidate/258802`, {
    headers: {
      'x-api-key': apiKey,
      'id-token': accessToken,
    },
  });

  const candidate = await candidateResponse.json() as any;
  console.log('Vincere Candidate Phone Check:');
  console.log('============================');
  console.log('Status:', candidateResponse.status);
  console.log('Full response:', JSON.stringify(candidate, null, 2));
}

checkVincere().catch(console.error);
