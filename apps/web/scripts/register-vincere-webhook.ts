/**
 * Register Vincere Webhook for Job Updates
 * 
 * This script registers a webhook with Vincere to receive job update events.
 * 
 * Usage:
 *   cd apps/web && npx tsx scripts/register-vincere-webhook.ts [webhook-url]
 * 
 * If webhook-url is not provided, it will use NEXT_PUBLIC_APP_URL or prompt for it.
 * 
 * Environment variables required:
 * - VINCERE_CLIENT_ID
 * - VINCERE_API_KEY
 * - VINCERE_REFRESH_TOKEN
 * - NEXT_PUBLIC_APP_URL (optional, can be provided as argument)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  getVincereClient,
  listWebhooks,
  createWebhook,
  deleteWebhook,
  findWebhookByUrl,
  ensureJobWebhook,
  DEFAULT_JOB_WEBHOOK_EVENTS,
} from "../lib/vincere";

// Manually load .env.local since tsx doesn't do it automatically
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
const __dirname = new URL(".", import.meta.url).pathname;
const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "..", ".env.local"),
  resolve(process.cwd(), "../..", ".env.local"),
];

console.log("Loading .env.local from:", process.cwd());
for (const p of possiblePaths) {
  if (existsSync(p)) {
    console.log(`  Found: ${p}`);
    loadEnvFile(p);
  }
}

// Debug: Show what Vincere vars were loaded (without values)
const vincereVars = Object.keys(process.env).filter(k => k.includes('VINCERE'));
if (vincereVars.length > 0) {
  console.log(`  Loaded Vincere variables: ${vincereVars.join(', ')}`);
} else {
  console.log(`  No Vincere variables found in environment`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("Vincere Webhook Registration");
  console.log("=".repeat(60));
  console.log("");

  // Check required environment variables
  if (
    !process.env.VINCERE_CLIENT_ID ||
    !process.env.VINCERE_API_KEY ||
    !process.env.VINCERE_REFRESH_TOKEN
  ) {
    console.error("❌ Missing required Vincere environment variables:");
    console.error("   VINCERE_CLIENT_ID:", process.env.VINCERE_CLIENT_ID ? "✓" : "✗");
    console.error("   VINCERE_API_KEY:", process.env.VINCERE_API_KEY ? "✓" : "✗");
    console.error("   VINCERE_REFRESH_TOKEN:", process.env.VINCERE_REFRESH_TOKEN ? "✓" : "✗");
    process.exit(1);
  }

  // Get webhook URL from argument or environment
  let webhookUrl = process.argv[2];
  if (!webhookUrl) {
    webhookUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : null;
  }

  if (!webhookUrl) {
    console.error("❌ Webhook URL not provided.");
    console.error("   Please provide it as an argument:");
    console.error("   npx tsx scripts/register-vincere-webhook.ts https://your-domain.com");
    console.error("");
    console.error("   Or set NEXT_PUBLIC_APP_URL in .env.local");
    process.exit(1);
  }

  // Ensure URL ends with the webhook path
  const webhookPath = "/api/webhooks/vincere";
  if (!webhookUrl.endsWith(webhookPath)) {
    webhookUrl = `${webhookUrl.replace(/\/$/, "")}${webhookPath}`;
  }

  console.log(`📡 Webhook URL: ${webhookUrl}`);
  console.log(`📋 Events: ${DEFAULT_JOB_WEBHOOK_EVENTS.join(", ")}`);
  console.log("");

  try {
    const vincere = getVincereClient();

    // List existing webhooks
    console.log("🔍 Checking existing webhooks...");
    const existingWebhooks = await listWebhooks(vincere);
    console.log(`   Found ${existingWebhooks.length} existing webhook(s)`);

    // Check if webhook already exists
    const existing = existingWebhooks.find((w) => w.url === webhookUrl);

    if (existing) {
      console.log(`\n⚠️  Webhook already exists with ID: ${existing.id}`);
      console.log("   Events:", existing.events.join(", "));
      console.log("   Active:", existing.active ? "Yes" : "No");
      console.log("");

      // Ask if we should update it
      console.log("   Updating existing webhook...");
      if (existing.id) {
        // Delete and recreate to ensure it's up to date
        await deleteWebhook(existing.id, vincere);
        console.log("   ✓ Deleted old webhook");
      }
    }

    // List existing webhooks to see format
    if (existingWebhooks.length > 0) {
      console.log("\n📋 Existing webhook format example:");
      console.log(JSON.stringify(existingWebhooks[0], null, 2));
    }

    // Register the webhook
    console.log("\n📝 Registering webhook...");
    const webhook = await ensureJobWebhook(webhookUrl, DEFAULT_JOB_WEBHOOK_EVENTS);

    console.log("\n✅ Webhook registered successfully!");
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.webhook_url || webhook.url || 'N/A'}`);
    if (webhook.events && Array.isArray(webhook.events)) {
      const eventStr = webhook.events.map((e: any) => {
        if (typeof e === 'string') return e;
        return `${e.entity_type}:${e.action_types?.join(',') || 'N/A'}`;
      }).join('; ');
      console.log(`   Events: ${eventStr}`);
    }
    console.log(`   Active: ${webhook.active ? "Yes" : "No"}`);
    console.log("");

    console.log("🎉 Done! Vincere will now send job updates to your webhook endpoint.");
    console.log("");
    console.log("   Test the webhook:");
    console.log(`   curl ${webhookUrl.replace("/api/webhooks/vincere", "")}/api/webhooks/vincere`);
  } catch (error) {
    console.error("\n❌ Error registering webhook:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
    } else {
      console.error("   Unknown error:", error);
    }
    process.exit(1);
  }
}

main();

