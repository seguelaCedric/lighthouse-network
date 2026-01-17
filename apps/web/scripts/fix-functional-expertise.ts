/**
 * Fix functional expertise for today's registrations
 *
 * Usage: npx tsx scripts/fix-functional-expertise.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { getVincereClient } from '../lib/vincere/client';
import { setFunctionalExpertises } from '../lib/vincere/candidates';
import { getVincereFunctionalExpertiseId } from '../lib/vincere/constants';

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

// Candidates to fix
const CANDIDATES = [
  {
    name: 'Bradley Dines',
    vincereId: 260138,
    position: 'chief_officer'
  },
  {
    name: 'Allanah Alldred',
    vincereId: 260104,
    position: 'second_stewardess'
  }
];

async function main() {
  console.log('=== Fixing Functional Expertise ===\n');

  const vincere = getVincereClient();

  for (const candidate of CANDIDATES) {
    console.log(`📋 ${candidate.name} (Vincere ID: ${candidate.vincereId})`);
    console.log(`   Position: ${candidate.position}`);

    // Get the expertise ID
    const expertiseId = getVincereFunctionalExpertiseId(candidate.position);

    if (!expertiseId) {
      console.log(`   ❌ No expertise ID found for position: ${candidate.position}\n`);
      continue;
    }

    console.log(`   Expertise ID: ${expertiseId}`);

    try {
      await setFunctionalExpertises(candidate.vincereId, [expertiseId], vincere);
      console.log(`   ✅ Successfully set functional expertise!\n`);
    } catch (error) {
      console.error(`   ❌ Failed:`, error);
      console.log('');
    }
  }

  console.log('=== Done! ===');
}

main().catch((error) => {
  console.error('\nScript failed:', error.message);
  process.exit(1);
});
