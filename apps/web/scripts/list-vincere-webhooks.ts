/**
 * List all registered Vincere webhooks
 * 
 * Usage:
 *   cd apps/web && npx tsx scripts/list-vincere-webhooks.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { getVincereClient, listWebhooks } from "../lib/vincere";

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
  console.log("Registered Vincere Webhooks");
  console.log("=".repeat(60));
  console.log("");

  // Check required environment variables
  if (
    !process.env.VINCERE_CLIENT_ID ||
    !process.env.VINCERE_API_KEY ||
    !process.env.VINCERE_REFRESH_TOKEN
  ) {
    console.error("❌ Missing required Vincere environment variables");
    process.exit(1);
  }

  try {
    const vincere = getVincereClient();
    const webhooks = await listWebhooks(vincere);

    if (webhooks.length === 0) {
      console.log("No webhooks registered.");
    } else {
      webhooks.forEach((webhook, index) => {
        console.log(`Webhook #${index + 1}:`);
        console.log(`  ID: ${webhook.id}`);
        console.log(`  URL: ${webhook.webhook_url || webhook.url || "N/A"}`);
        console.log(`  Active: ${webhook.active ? "Yes" : "No"}`);
        if (webhook.events && Array.isArray(webhook.events)) {
          console.log(`  Events:`);
          webhook.events.forEach((event: any) => {
            if (typeof event === "string") {
              console.log(`    - ${event}`);
            } else {
              console.log(
                `    - Entity: ${event.entity_type}, Actions: ${event.action_types?.join(", ") || "N/A"}`
              );
            }
          });
        }
        if ((webhook as any).tenant) {
          console.log(`  Tenant: ${(webhook as any).tenant}`);
        }
        console.log("");
      });
    }

    console.log(`Total: ${webhooks.length} webhook(s)`);
  } catch (error) {
    console.error("❌ Error listing webhooks:");
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

