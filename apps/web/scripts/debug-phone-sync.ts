import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Debug script to test phone sync to Vincere
 * This directly tests the Vincere API to verify phone updates work
 */

const VINCERE_ID = 258802; // The test candidate ID

async function getToken() {
  const clientId = process.env.VINCERE_CLIENT_ID;
  const apiKey = process.env.VINCERE_API_KEY;
  const domain = process.env.VINCERE_DOMAIN || 'lighthouse-careers';
  const refreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!clientId || !apiKey || !refreshToken) {
    throw new Error('Missing Vincere credentials');
  }

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
  if (!tokenResponse.ok) {
    throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  }

  return {
    token: tokenData.id_token,
    apiKey,
    domain,
  };
}

async function getCandidate(token: string, apiKey: string, domain: string) {
  const response = await fetch(`https://${domain}.vincere.io/api/v2/candidate/${VINCERE_ID}`, {
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

async function updateCandidate(token: string, apiKey: string, domain: string, phone: string) {
  const payload = { phone };
  console.log('\n📤 PATCH Request:');
  console.log('URL:', `https://${domain}.vincere.io/api/v2/candidate/${VINCERE_ID}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(`https://${domain}.vincere.io/api/v2/candidate/${VINCERE_ID}`, {
    method: 'PATCH',
    headers: {
      'x-api-key': apiKey,
      'id-token': token,
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log('\n📥 PATCH Response:');
  console.log('Status:', response.status);
  console.log('Body:', text || '(empty)');

  if (!response.ok) {
    throw new Error(`PATCH candidate failed: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : {};
}

async function main() {
  console.log('🔍 Debug Phone Sync to Vincere');
  console.log('================================');
  console.log('Candidate Vincere ID:', VINCERE_ID);
  console.log('');

  // Step 1: Get auth
  console.log('1️⃣ Getting auth token...');
  const { token, apiKey, domain } = await getToken();
  console.log('✅ Got token');

  // Step 2: Get current candidate state
  console.log('\n2️⃣ Getting current candidate state...');
  const before = await getCandidate(token, apiKey, domain) as any;
  console.log('Current phone:', before.phone);
  console.log('Current mobile:', before.mobile);

  // Step 3: Update phone
  const newPhone = '+33612345777';
  console.log(`\n3️⃣ Updating phone to: ${newPhone}`);
  await updateCandidate(token, apiKey, domain, newPhone);

  // Step 4: Verify the update
  console.log('\n4️⃣ Verifying update...');
  // Small delay to allow Vincere to process
  await new Promise(resolve => setTimeout(resolve, 1000));

  const after = await getCandidate(token, apiKey, domain) as any;
  console.log('Updated phone:', after.phone);
  console.log('Updated mobile:', after.mobile);

  // Step 5: Check if it worked
  console.log('\n5️⃣ Result:');
  if (after.phone === newPhone) {
    console.log('✅ SUCCESS! Phone was updated correctly');
  } else {
    console.log('❌ FAILED! Phone was not updated');
    console.log('Expected:', newPhone);
    console.log('Got:', after.phone);
  }
}

main().catch(console.error);
