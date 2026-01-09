import { config } from 'dotenv';
config({ path: '.env.local' });

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL = 'seguelac+33334@gmail.com';
const TEST_PASSWORD = 'StellaLuna28!';
const BASE_URL = 'http://localhost:3004';

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

  const tokenData = (await tokenResponse.json()) as { id_token: string };
  if (!tokenResponse.ok) {
    throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  }

  return {
    token: tokenData.id_token,
    apiKey,
    domain,
  };
}

async function getVincereCandidate(
  token: string,
  apiKey: string,
  domain: string,
  vincereId: number
) {
  const response = await fetch(
    `https://${domain}.vincere.io/api/v2/candidate/${vincereId}`,
    {
      headers: {
        'x-api-key': apiKey,
        'id-token': token,
        accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET candidate failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('🧪 E2E Phone Sync Test');
  console.log('=====================');

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Launch browser
  console.log('🌐 Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console logs
  page.on('console', (msg) => {
    if (msg.text().includes('[autoSave]') || msg.text().includes('[syncCandidateUpdate]')) {
      console.log('📋 Browser console:', msg.text());
    }
  });

  try {
    // Step 1: Login
    console.log('🔑 Logging in...');
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(/\/(crew\/dashboard|crew\/profile)/, {
      timeout: 15000,
    });
    console.log('✅ Logged in');

    // Step 2: Navigate to profile edit
    console.log('📝 Navigating to profile edit...');
    await page.goto(`${BASE_URL}/crew/profile/edit`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('✅ On profile edit page');

    // Step 3: Get current phone value
    const phoneInput = page.locator('input[type="tel"]').first();
    const currentPhone = await phoneInput.inputValue();
    console.log('Current phone in form:', currentPhone);

    // Step 4: Generate new phone number
    const timestamp = Date.now().toString().slice(-6);
    const newPhone = `+336123${timestamp}`;
    console.log('New phone to enter:', newPhone);

    // Step 5: Clear and enter new phone
    await phoneInput.click();
    await phoneInput.clear();
    await phoneInput.fill(newPhone);
    console.log('✅ Entered new phone');

    // Step 6: Trigger auto-save by clicking elsewhere (blur the input)
    // Click on the First Name label to trigger blur
    await page.click('label:has-text("First Name")');

    // Wait for auto-save debounce (1.5s) plus network time
    console.log('⏳ Waiting for auto-save (5 seconds)...');
    await page.waitForTimeout(5000);

    // Step 7: Verify database update
    console.log('🔍 Verifying database...');
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id, vincere_id, phone, updated_at, last_synced_at')
      .eq('email', TEST_EMAIL)
      .single();

    if (!candidate) {
      throw new Error('Candidate not found in database');
    }

    console.log('Database phone:', candidate.phone);
    console.log('Database updated_at:', candidate.updated_at);
    console.log('Database last_synced_at:', candidate.last_synced_at);

    if (candidate.phone !== newPhone) {
      console.log('❌ Database phone does NOT match expected!');
      console.log('Expected:', newPhone);
      console.log('Got:', candidate.phone);
    } else {
      console.log('✅ Database updated correctly');
    }

    // Step 8: Wait a bit more for Vincere sync (fire-and-forget)
    console.log('⏳ Waiting for Vincere sync (3 more seconds)...');
    await page.waitForTimeout(3000);

    // Step 9: Verify Vincere
    console.log('🔍 Verifying Vincere...');
    const { token, apiKey, domain } = await getVincereToken();
    const vincereCandidate = (await getVincereCandidate(
      token,
      apiKey,
      domain,
      parseInt(candidate.vincere_id!)
    )) as { phone: string | null };

    console.log('Vincere phone:', vincereCandidate.phone);

    if (vincereCandidate.phone !== newPhone) {
      console.log('❌ FAILED! Vincere phone does NOT match!');
      console.log('Expected:', newPhone);
      console.log('Got:', vincereCandidate.phone);
    } else {
      console.log('✅ Vincere updated correctly');
      console.log('');
      console.log('🎉 TEST PASSED! Phone sync working end-to-end');
    }
  } finally {
    // Take screenshot before closing
    await page.screenshot({ path: 'phone-test-screenshot.png' });
    console.log('📸 Screenshot saved');

    await browser.close();
  }
}

main().catch(console.error);
