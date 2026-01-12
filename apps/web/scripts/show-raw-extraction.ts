#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('\n=== RAW EXTRACTION DATA SAMPLE ===\n');

  // Get a few candidates with good extraction
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, positions_extracted, yacht_experience_extracted, languages_extracted, certifications_extracted')
    .eq('source', 'bubble_import')
    .is('deleted_at', null)
    .not('cv_extracted_at', 'is', null)
    .limit(5);

  if (!candidates || candidates.length === 0) {
    console.log('No candidates found.');
    return;
  }

  candidates.forEach((c, idx) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${idx + 1}. ${c.first_name} ${c.last_name}`);
    console.log('='.repeat(60));

    console.log('\nPOSITIONS_EXTRACTED:');
    console.log(JSON.stringify(c.positions_extracted, null, 2));

    console.log('\nYACHT_EXPERIENCE_EXTRACTED:');
    console.log(JSON.stringify(c.yacht_experience_extracted, null, 2));

    console.log('\nLANGUAGES_EXTRACTED:');
    console.log(JSON.stringify(c.languages_extracted, null, 2));

    console.log('\nCERTIFICATIONS_EXTRACTED:');
    console.log(JSON.stringify(c.certifications_extracted, null, 2));
  });

  console.log('\n');
}

main().catch(console.error);
