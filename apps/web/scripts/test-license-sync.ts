/**
 * Test license field sync to Vincere
 *
 * Run with: npx tsx apps/web/scripts/test-license-sync.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "apps/web/.env.local") });

async function main() {
  const { getVincereClient } = await import("../lib/vincere/client");
  const { VINCERE_FIELD_KEYS } = await import("../lib/vincere/constants");

  const client = getVincereClient();
  await client.authenticate();

  const vincereId = 258802;

  console.log("=== Checking Vincere License Fields ===\n");

  const customFields = await client.get<any[]>("/candidate/" + vincereId + "/customfields");
  const highestLicenceField = customFields?.find((f: any) => f.field_key === VINCERE_FIELD_KEYS.highestLicence);
  const secondLicenceField = customFields?.find((f: any) => f.field_key === VINCERE_FIELD_KEYS.secondLicence);

  console.log("highestLicence:", JSON.stringify(highestLicenceField, null, 2));
  console.log("secondLicence:", JSON.stringify(secondLicenceField, null, 2));
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
