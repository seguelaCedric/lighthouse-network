/**
 * Check a specific Vincere job to see what data is returned
 * 
 * Run: cd apps/web && npx tsx scripts/check-vincere-job.ts <job_id>
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { getVincereClient, getJobWithCustomFields } from "../lib/vincere";

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
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"),
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

async function main() {
  const jobId = process.argv[2];
  
  if (!jobId) {
    console.error("Usage: npx tsx scripts/check-vincere-job.ts <vincere_job_id>");
    process.exit(1);
  }

  const vincereId = parseInt(jobId, 10);
  if (isNaN(vincereId)) {
    console.error("Error: Job ID must be a number");
    process.exit(1);
  }

  console.log(`\n🔍 Fetching job ${vincereId} from Vincere...\n`);

  try {
    const result = await getJobWithCustomFields(vincereId);
    
    if (!result) {
      console.error(`❌ Job ${vincereId} not found in Vincere`);
      process.exit(1);
    }

    const { job, customFields } = result;

    console.log("📋 JOB DATA FROM VINCERE:");
    console.log("=" .repeat(60));
    console.log(`ID: ${job.id}`);
    console.log(`Title: ${job.job_title}`);
    console.log(`Company: ${job.company_name || "N/A"}`);
    console.log(`Status: ${job.status || job.job_status || "N/A"}`);
    console.log(`Created Date: ${job.created_date || "N/A"}`);
    console.log(`Open Date: ${job.open_date || "N/A"}`);
    console.log(`Close Date: ${job.close_date || "N/A"}`);
    console.log(`Closed Job: ${job.closed_job || false}`);
    console.log(`Location: ${job.location || "N/A"}`);
    console.log(`Start Date: ${job.start_date || "N/A"}`);
    console.log(`Salary From: ${job.salary_from || "N/A"}`);
    console.log(`Salary To: ${job.salary_to || "N/A"}`);
    
    console.log("\n📦 CUSTOM FIELDS:");
    console.log("=" .repeat(60));
    
    if (Object.keys(customFields).length === 0) {
      console.log("No custom fields found");
    } else {
      for (const [key, field] of Object.entries(customFields)) {
        console.log(`\nField Key: ${key}`);
        console.log(`  Name: ${field.name}`);
        if (field.field_value) {
          console.log(`  Value (string): ${field.field_value}`);
        }
        if (field.field_values && field.field_values.length > 0) {
          console.log(`  Values (IDs): ${JSON.stringify(field.field_values)}`);
        }
        if (field.date_value) {
          console.log(`  Date Value: ${field.date_value}`);
        }
      }
    }

    console.log("\n🔍 SPECIFIC FIELDS OF INTEREST:");
    console.log("=" .repeat(60));
    
    // Check contract type
    const contractTypeField = customFields['c980a4f92992081ead936fb8a358fb79'];
    if (contractTypeField) {
      console.log(`\nContract Type Field:`);
      console.log(`  Name: ${contractTypeField.name}`);
      if (contractTypeField.field_value) {
        console.log(`  String Value: "${contractTypeField.field_value}"`);
      }
      if (contractTypeField.field_values && contractTypeField.field_values.length > 0) {
        console.log(`  ID Values: ${JSON.stringify(contractTypeField.field_values)}`);
      }
    } else {
      console.log("\nContract Type Field: NOT FOUND");
    }

    // Check yacht field
    const yachtField = customFields['68df45f3ddb75e93afa7b9f8d66c17bd'];
    if (yachtField) {
      console.log(`\nYacht Field:`);
      console.log(`  Name: ${yachtField.name}`);
      if (yachtField.field_value) {
        console.log(`  Value: "${yachtField.field_value}"`);
      }
    }

    // Check holiday package
    const holidayField = customFields['a8c4e5f6d7b8c9d0e1f2a3b4c5d6e7f8'];
    if (holidayField) {
      console.log(`\nHoliday Package Field:`);
      console.log(`  Name: ${holidayField.name}`);
      if (holidayField.field_value) {
        console.log(`  Value: "${holidayField.field_value}"`);
      }
    }

    // List all custom field keys to help identify the right one
    console.log("\n📝 ALL CUSTOM FIELD KEYS:");
    console.log("=" .repeat(60));
    for (const [key, field] of Object.entries(customFields)) {
      console.log(`${key}: ${field.name}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
