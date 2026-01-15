/**
 * Check Vincere webhook dead letter queue (failed deliveries)
 *
 * Usage:
 *   cd apps/web && npx tsx scripts/check-webhook-dlq.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

async function main() {
  const { getVincereClient, listWebhooks } = await import("../lib/vincere/client");
  const client = getVincereClient();

  console.log("Checking Vincere webhook DLQ (dead letter queue)...\n");

  // Get all webhooks
  const webhooks = await listWebhooks(client);

  // Filter to our Vercel webhooks
  const ourWebhooks = webhooks.filter((w: any) => {
    const url = w.webhook_url || w.url || "";
    return url.includes("lighthouse-network-web.vercel.app");
  });

  console.log(`Found ${ourWebhooks.length} Vercel webhook(s)\n`);

  for (const webhook of ourWebhooks) {
    const webhookId = webhook.id;
    const url = (webhook as any).webhook_url || (webhook as any).url || "";
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Webhook: ${webhookId}`);
    console.log(`URL: ${url}`);
    console.log(`Active: ${(webhook as any).active ? "Yes" : "No"}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      // POST to consume DLQ messages (returns up to 100 failed messages)
      const dlq = await client.post(`/webhooks/${webhookId}/dlq?limit=100`);
      console.log("DLQ (failed deliveries):");
      console.log(JSON.stringify(dlq, null, 2));
    } catch (e: any) {
      console.log("DLQ error:", e.message);
      // Check if it's a 404 (no DLQ messages) or other error
      if (e.statusCode === 404) {
        console.log("  -> No failed messages in DLQ (good!)");
      }
    }
  }
}

main();
