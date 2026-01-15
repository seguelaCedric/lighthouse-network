/**
 * Activate Vincere webhooks for production
 *
 * Usage:
 *   cd apps/web && npx tsx scripts/activate-vincere-webhooks.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Manually load .env.local
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

// Try multiple locations for .env.local
const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "..", ".env.local"),
  resolve(process.cwd(), "../..", ".env.local"),
];

for (const p of possiblePaths) {
  if (existsSync(p)) {
    loadEnvFile(p);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Activating Vincere Webhooks");
  console.log("=".repeat(60));
  console.log("");

  const { getVincereClient, listWebhooks } = await import("../lib/vincere/client");

  const client = getVincereClient();
  const webhooks = await listWebhooks(client);

  const SECRET = "b110151417000460413612469ca7a0f4b527961ddbcacf7676018f723a9e2274";

  // Delete all existing Vercel webhooks first
  for (const webhook of webhooks) {
    const url = (webhook as any).webhook_url || (webhook as any).url || "";
    if (!url.includes("lighthouse-network-web.vercel.app")) continue;

    console.log("Deleting old webhook:", webhook.id);
    console.log("  URL:", url);
    try {
      await client.delete(`/webhooks/${webhook.id}`);
      console.log("  ✅ Deleted!");
    } catch (e: any) {
      console.error("  ❌ Delete failed:", e.message);
    }
  }

  // Create new webhooks with TRAILING SLASHES (Vercel requires this)
  const webhooksToCreate = [
    {
      // JOB webhook - note the trailing slash before the query param!
      webhook_url: `https://lighthouse-network-web.vercel.app/api/webhooks/vincere/?secret=${SECRET}`,
      events: [{ entity_type: "JOB", action_types: ["CREATE", "UPDATE"] }],
    },
    {
      // CANDIDATE webhook - note the trailing slash before the query param!
      webhook_url: `https://lighthouse-network-web.vercel.app/api/webhooks/vincere/candidates/?secret=${SECRET}`,
      events: [{ entity_type: "CANDIDATE", action_types: ["CREATE", "UPDATE", "ARCHIVE", "DELETE"] }],
    },
  ];

  console.log("\n--- Creating new webhooks with trailing slashes ---\n");

  for (const config of webhooksToCreate) {
    console.log("Creating webhook:");
    console.log("  URL:", config.webhook_url);
    try {
      const result = await client.post("/webhooks", {
        webhook_url: config.webhook_url,
        events: config.events,
        active: true,
      });
      console.log("  ✅ Created:", JSON.stringify(result, null, 2));
    } catch (e: any) {
      console.error("  ❌ Create failed:", e.message);
    }
    console.log("");
  }

  // Verify - show all webhooks pointing to Vercel
  console.log("=".repeat(60));
  console.log("Final webhook list...");
  console.log("=".repeat(60));
  const updated = await listWebhooks(client);
  for (const w of updated) {
    const url = (w as any).webhook_url || (w as any).url || "";
    if (url.includes("lighthouse-network-web.vercel.app")) {
      console.log(`\nWebhook ${w.id}:`);
      console.log(`  URL: ${url}`);
      console.log(`  Active: ${(w as any).active ? "✅ Yes" : "❌ No"}`);
      console.log(`  Events:`, JSON.stringify((w as any).events, null, 4));
    }
  }
}

main().catch(console.error);
