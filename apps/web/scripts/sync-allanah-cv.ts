/**
 * Sync Allanah Alldred's CV to Vincere
 *
 * Usage: npx tsx scripts/sync-allanah-cv.ts
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

const possiblePaths = [
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../.env'),
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

const ALLANAH_EMAIL = 'allanah.alldred7@gmail.com';
const VINCERE_ID = 260104;

async function main() {
  console.log('=== Syncing Allanah Alldred CV to Vincere ===\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const vincere = getVincereClient();

  // Find candidate
  console.log(`1. Looking up candidate: ${ALLANAH_EMAIL}`);
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, email, vincere_id')
    .eq('email', ALLANAH_EMAIL)
    .single();

  if (candidateError || !candidate) {
    throw new Error(`Candidate not found: ${candidateError?.message}`);
  }

  console.log(`   Found: ${candidate.first_name} ${candidate.last_name}`);
  console.log(`   Our ID: ${candidate.id}`);
  console.log(`   Vincere ID: ${candidate.vincere_id}\n`);

  // Find CV document
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

  // Generate signed URL
  console.log('3. Generating signed URL');
  const { data: signedData, error: signError } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 3600);

  if (signError || !signedData?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${signError?.message}`);
  }

  console.log(`   Signed URL generated\n`);

  // Upload to Vincere
  console.log(`4. Uploading CV to Vincere candidate ${VINCERE_ID}`);

  try {
    const result = await uploadCandidateCVByUrl(
      VINCERE_ID,
      signedData.signedUrl,
      document.name,
      vincere
    );

    console.log(`   ✅ Success! Vincere file ID: ${result.id}\n`);
  } catch (uploadError) {
    console.error(`   Upload failed:`, uploadError);
    throw uploadError;
  }

  console.log('=== Done! ===');
}

main().catch((error) => {
  console.error('\nScript failed:', error.message);
  process.exit(1);
});
