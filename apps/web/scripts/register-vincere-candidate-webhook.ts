/**
 * Register Vincere Webhook for Candidate Updates
 * 
 * This script registers a webhook with Vincere to receive candidate update events.
 * 
 * Usage:
 *   cd apps/web && npx tsx scripts/register-vincere-candidate-webhook.ts [webhook-url]
 * 
 * If webhook-url is not provided, it will use NEXT_PUBLIC_APP_URL or prompt for it.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  getVincereClient,
  listWebhooks,
  registerCandidateWebhook,
  findWebhookByUrl,
  deleteWebhook,
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
  console.log("Vincere Candidate Webhook Registration");
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
    console.error("   npx tsx scripts/register-vincere-candidate-webhook.ts https://your-domain.com");
    console.error("");
    console.error("   Or set NEXT_PUBLIC_APP_URL in .env.local");
    process.exit(1);
  }

  // Ensure URL ends with the webhook path
  const webhookPath = "/api/webhooks/vincere/candidates";
  if (!webhookUrl.endsWith(webhookPath)) {
    webhookUrl = `${webhookUrl.replace(/\/$/, "")}${webhookPath}`;
  }

  console.log(`📡 Webhook URL: ${webhookUrl}`);
  console.log(`📋 Events: CANDIDATE entity with CREATE, UPDATE, ARCHIVE, DELETE actions`);
  console.log("");

  try {
    const vincere = getVincereClient();

    // List existing webhooks
    console.log("🔍 Checking existing webhooks...");
    const existingWebhooks = await listWebhooks(vincere);
    console.log(`   Found ${existingWebhooks.length} existing webhook(s)`);

    // Check if webhook already exists
    const existing = existingWebhooks.find((w) => (w.webhook_url || w.url) === webhookUrl);

    if (existing) {
      console.log(`\n⚠️  Webhook already exists with ID: ${existing.id}`);
      console.log("   Events:", JSON.stringify(existing.events, null, 2));
      console.log("   Active:", existing.active ? "Yes" : "No");
      console.log("");

      // Ask if we should update it
      console.log("   Deleting old webhook to recreate...");
      if (existing.id) {
        // Delete and recreate to ensure it's up to date
        await deleteWebhook(existing.id, vincere);
        console.log("   ✓ Deleted old webhook");
      }
    }

    // Register the webhook
    console.log("\n📝 Registering candidate webhook...");
    const webhook = await registerCandidateWebhook(
      webhookUrl,
      ['CREATE', 'UPDATE', 'ARCHIVE', 'DELETE']
    );

    console.log("\n✅ Webhook registered successfully!");
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.webhook_url || webhook.url || "N/A"}`);
    if (webhook.events && Array.isArray(webhook.events)) {
      const eventStr = webhook.events
        .map((e: any) => {
          if (typeof e === "string") return e;
          return `${e.entity_type}:${e.action_types?.join(",") || "N/A"}`;
        })
        .join("; ");
      console.log(`   Events: ${eventStr}`);
    }
    console.log(`   Active: ${webhook.active ? "Yes" : "No"}`);
    console.log("");

    console.log("🎉 Done! Vincere will now send candidate updates to your webhook endpoint.");
    console.log("");
    console.log("   Test the webhook:");
    console.log(`   curl ${webhookUrl.replace("/api/webhooks/vincere/candidates", "")}/api/webhooks/vincere/candidates`);
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

