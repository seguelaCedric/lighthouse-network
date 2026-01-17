/**
 * Re-sync Bradley Dines' CV to Vincere
 *
 * Fixes the issue where the CV was uploaded to the wrong Vincere candidate
 * due to a race condition during registration.
 *
 * Usage: npx tsx scripts/resync-bradley-cv.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { getVincereClient } from '../lib/vincere/client';
import { uploadCandidateCVByUrl } from '../lib/vincere/files';

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

// Try loading from multiple possible paths
const possiblePaths = [
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../.env'),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

const BRADLEY_EMAIL = 'bradley.dines@outlook.com';
const CORRECT_VINCERE_ID = 260138;

async function main() {
  console.log('=== Re-syncing Bradley Dines CV to Vincere ===\n');

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Find Bradley's candidate record
  console.log(`1. Looking up candidate: ${BRADLEY_EMAIL}`);
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, email, vincere_id')
    .eq('email', BRADLEY_EMAIL)
    .single();

  if (candidateError || !candidate) {
    throw new Error(`Candidate not found: ${candidateError?.message}`);
  }

  console.log(`   Found: ${candidate.first_name} ${candidate.last_name}`);
  console.log(`   Our ID: ${candidate.id}`);
  console.log(`   Vincere ID in DB: ${candidate.vincere_id}`);
  console.log(`   Target Vincere ID: ${CORRECT_VINCERE_ID}\n`);

  // Step 2: Find Bradley's CV document
  console.log('2. Looking up CV document');
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('id, name, file_path, file_url, mime_type, file_size')
    .eq('entity_id', candidate.id)
    .eq('entity_type', 'candidate')
    .eq('type', 'cv')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (docError || !document) {
    throw new Error(`CV document not found: ${docError?.message}`);
  }

  console.log(`   Found: ${document.name}`);
  console.log(`   Size: ${(document.file_size / 1024).toFixed(1)} KB`);
  console.log(`   Type: ${document.mime_type}\n`);

  // Step 3: Generate signed URL
  console.log('3. Generating signed URL for Vincere to fetch');
  const { data: signedData, error: signError } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 3600); // 1 hour expiry

  if (signError || !signedData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signError?.message}`);
  }

  console.log(`   Signed URL generated (expires in 1 hour)\n`);

  // Step 4: Upload to Vincere
  console.log(`4. Uploading CV to Vincere candidate ${CORRECT_VINCERE_ID}`);
  const vincere = getVincereClient();

  try {
    const result = await uploadCandidateCVByUrl(
      CORRECT_VINCERE_ID,
      signedData.signedUrl,
      document.name,
      vincere
    );

    console.log(`   Success! Vincere file ID: ${result.id}\n`);
  } catch (uploadError) {
    console.error(`   Upload failed:`, uploadError);
    throw uploadError;
  }

  // Step 5: Update vincere_id if needed
  if (candidate.vincere_id !== CORRECT_VINCERE_ID.toString()) {
    console.log(`5. Updating vincere_id in database to ${CORRECT_VINCERE_ID}`);
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        vincere_id: CORRECT_VINCERE_ID.toString(),
        last_synced_at: new Date().toISOString()
      })
      .eq('id', candidate.id);

    if (updateError) {
      console.error(`   Failed to update vincere_id:`, updateError);
    } else {
      console.log(`   Updated successfully\n`);
    }
  }

  console.log('=== Done! ===');
  console.log(`\nBradley's CV has been uploaded to Vincere candidate ${CORRECT_VINCERE_ID}.`);
  console.log(`Remember to delete the duplicate candidate 260137 from Vincere.`);
}

main().catch((error) => {
  console.error('\nScript failed:', error.message);
  process.exit(1);
});
