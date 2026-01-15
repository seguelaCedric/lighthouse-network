/**
 * Check detailed webhook status from Vincere
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

  console.log("Fetching all webhooks...\n");
  const webhooks = await listWebhooks(client);

  console.log(`Total webhooks: ${webhooks.length}\n`);

  for (const w of webhooks) {
    const url = (w as any).webhook_url || (w as any).url || "";
    if (!url.includes("lighthouse-network-web.vercel.app")) continue;

    console.log("=".repeat(60));
    console.log("WEBHOOK DETAILS");
    console.log("=".repeat(60));
    console.log(JSON.stringify(w, null, 2));
    console.log("");

    // Try to get more details about this specific webhook
    try {
      const detail = await client.get(`/webhooks/${w.id}`);
      console.log("Detailed info:");
      console.log(JSON.stringify(detail, null, 2));
    } catch (e: any) {
      console.log("Could not fetch details:", e.message);
    }
  }
}

main().catch(console.error);
