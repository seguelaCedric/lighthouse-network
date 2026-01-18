/**
 * Check Vincere date format
 *
 * Run: cd apps/web && npx tsx scripts/check-vincere-date-format.ts
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
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(__dirname, "../.env.local"),
];
for (const p of possiblePaths) {
  loadEnvFile(p);
}

async function main() {
  const { VincereClient } = await import("../lib/vincere");

  const client = new VincereClient();
  await client.authenticate();

  // Get a candidate with a date_of_birth
  const candidate = await client.get<{
    id: number;
    first_name: string;
    date_of_birth: string;
  }>("/candidate/260172");

  console.log("Candidate 260172:");
  console.log("  date_of_birth:", candidate?.date_of_birth);
  console.log("  Type:", typeof candidate?.date_of_birth);
}

main().catch(console.error);
