/**
 * Update Vincere Webhooks
 *
 * This script updates the Vincere webhooks to use the secret parameter.
 *
 * Run with: npx tsx apps/web/scripts/update-vincere-webhooks.ts <secret>
 *
 * Example: npx tsx apps/web/scripts/update-vincere-webhooks.ts b110151417000460413612469ca7a0f4b527961ddbcacf7676018f723a9e2274
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const args = process.argv.slice(2);
const secret = args[0];

if (!secret) {
  console.error('Usage: npx tsx apps/web/scripts/update-vincere-webhooks.ts <secret>');
  process.exit(1);
}

const BASE_URL = 'https://lighthouse-network-web.vercel.app';

// Webhook configurations to update
const WEBHOOK_CONFIGS = {
  candidates: {
    oldUrl: `${BASE_URL}/api/webhooks/vincere/candidates`,
    newUrl: `${BASE_URL}/api/webhooks/vincere/candidates?secret=${secret}`,
    events: [
      {
        entity_type: 'CANDIDATE',
        action_types: ['CREATE', 'UPDATE', 'ARCHIVE', 'DELETE'],
      },
    ],
  },
  jobs: {
    oldUrl: `${BASE_URL}/api/webhooks/vincere`,
    newUrl: `${BASE_URL}/api/webhooks/vincere?secret=${secret}`,
    events: [
      {
        entity_type: 'JOB',
        action_types: ['CREATE', 'UPDATE'],
      },
    ],
  },
};

interface VincereWebhook {
  id: string;
  tenant: string;
  webhook_url: string;
  events: Array<{
    entity_type: string;
    action_types: string[];
  }>;
}

async function main() {
  console.log('Updating Vincere webhooks with secret...\n');

  const { getVincereClient } = await import('../lib/vincere/client');
  const client = getVincereClient();

  // Authenticate
  await client.authenticate();
  console.log('Authenticated successfully\n');

  // Fetch existing webhooks
  const webhooks = await client.get<VincereWebhook[]>('/webhooks');
  console.log(`Found ${webhooks.length} existing webhooks\n`);

  // Process each webhook config
  for (const [name, config] of Object.entries(WEBHOOK_CONFIGS)) {
    console.log(`\n=== Processing ${name} webhook ===`);

    // Find existing webhook with the old URL (without secret)
    const existingWebhook = webhooks.find(
      (w) => w.webhook_url === config.oldUrl || w.webhook_url.startsWith(config.oldUrl + '?')
    );

    if (existingWebhook) {
      console.log(`Found existing webhook: ${existingWebhook.id}`);
      console.log(`  Current URL: ${existingWebhook.webhook_url}`);

      // Delete the old webhook
      try {
        await client.delete(`/webhooks/${existingWebhook.id}`);
        console.log(`  Deleted old webhook`);
      } catch (e) {
        console.error(`  Failed to delete old webhook:`, e);
      }
    } else {
      console.log(`No existing webhook found for ${config.oldUrl}`);
    }

    // Create new webhook with secret
    try {
      const newWebhook = await client.post<VincereWebhook>('/webhooks', {
        webhook_url: config.newUrl,
        events: config.events,
      });
      console.log(`  Created new webhook: ${newWebhook.id}`);
      console.log(`  New URL: ${config.newUrl}`);
    } catch (e) {
      console.error(`  Failed to create new webhook:`, e);
    }
  }

  // Show final webhook list
  console.log('\n\n=== Final Webhook List ===');
  const finalWebhooks = await client.get<VincereWebhook[]>('/webhooks');
  for (const webhook of finalWebhooks) {
    console.log(`\nID: ${webhook.id}`);
    console.log(`URL: ${webhook.webhook_url}`);
    console.log(`Events: ${webhook.events.map((e) => `${e.entity_type}:${e.action_types.join(',')}`).join('; ')}`);
  }
}

main().catch(console.error);
