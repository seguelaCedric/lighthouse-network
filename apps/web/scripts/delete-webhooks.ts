/**
 * Delete specific Vincere webhooks
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
  const { getVincereClient } = await import("../lib/vincere/client");
  const client = getVincereClient();

  const webhookIds = [
    "dfacd91c-9804-4b1f-97d3-afe1a5e88475",
  ];

  for (const id of webhookIds) {
    console.log("Deleting webhook:", id);
    try {
      await client.delete(`/webhooks/${id}`);
      console.log("  ✅ Deleted!");
    } catch (e: any) {
      console.error("  ❌ Error:", e.message);
    }
  }

  console.log("\nDone!");
}

main();
