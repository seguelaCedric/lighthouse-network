/**
 * Check Vincere files for a candidate
 * Shows full file details including original_cv flag
 *
 * Usage: npx tsx scripts/check-vincere-files.ts <vincere_id>
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getVincereClient } from '../lib/vincere/client';

// Load .env.local
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const possiblePaths = [
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../.env'),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

async function main() {
  const vincereId = process.argv[2] || '260138'; // Default to Bradley

  console.log(`=== Checking Vincere Files for Candidate ${vincereId} ===\n`);

  const vincere = getVincereClient();

  // Get all files
  const files = await vincere.get<any[]>(`/candidate/${vincereId}/files`);

  console.log(`Found ${files?.length || 0} files:\n`);

  if (files && files.length > 0) {
    for (const file of files) {
      console.log(`📄 File ID: ${file.id}`);
      console.log(`   Name: ${file.file_name || file.original_file_name || 'unknown'}`);
      console.log(`   Original CV: ${file.original_cv === true ? '✅ YES' : '❌ NO'}`);
      console.log(`   Document Type ID: ${file.document_type_id || 'not set'}`);
      console.log(`   Uploaded: ${file.uploaded_date || 'unknown'}`);
      console.log('');
    }

    // Check if any is marked as original CV
    const originalCv = files.find(f => f.original_cv === true);
    if (originalCv) {
      console.log(`✅ Primary CV is: ${originalCv.file_name || originalCv.id}`);
    } else {
      console.log(`⚠️  No file is marked as original_cv (primary CV)!`);
    }
  } else {
    console.log('No files found.');
  }

  // Also get functional expertise
  console.log('\n--- Functional Expertise ---');
  try {
    const expertise = await vincere.get<any[]>(`/candidate/${vincereId}/functionalexpertises`);
    if (expertise && expertise.length > 0) {
      expertise.forEach(e => console.log(`   ✅ ${e.name} (ID: ${e.id})`));
    } else {
      console.log('   ❌ None set');
    }
  } catch (err) {
    console.log('   Error fetching expertise');
  }

  // Get custom fields
  console.log('\n--- Custom Fields ---');
  try {
    const customFields = await vincere.get<any>(`/candidate/${vincereId}/customfields`);
    const keys = Object.keys(customFields || {}).filter(k => customFields[k] !== null && customFields[k] !== '');
    console.log(`   Total non-empty: ${keys.length}`);
    keys.forEach(k => console.log(`   ${k}: ${JSON.stringify(customFields[k])}`));
  } catch (err) {
    console.log('   Error fetching custom fields');
  }
}

main().catch((error) => {
  console.error('\nScript failed:', error.message);
  process.exit(1);
});
