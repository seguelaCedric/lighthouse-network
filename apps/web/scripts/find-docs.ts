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
  // Check a known bubble candidate
  const { data: sampleCand } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, email')
    .eq('source', 'bubble_import')
    .not('email', 'is', null)
    .limit(5);

  console.log('\nSample bubble candidates:');
  sampleCand?.forEach(c => {
    console.log(`  ${c.first_name} ${c.last_name} (${c.id})`);
  });

  if (sampleCand && sampleCand.length > 0) {
    const candidateId = sampleCand[0].id;
    console.log(`\nChecking documents for ${sampleCand[0].first_name} ${sampleCand[0].last_name}:`);
    
    const { data: docs, count } = await supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('entity_id', candidateId)
      .eq('entity_type', 'candidate');

    console.log(`  Found ${count} documents`);
    docs?.forEach(d => {
      console.log(`    - ${d.type}: ${d.name}`);
    });
  }

  // Check total documents
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', 'candidate');

  console.log(`\nTotal candidate documents in DB: ${totalDocs}`);

  // Check documents with metadata source
  const { count: bubbleDocs } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', 'candidate')
    .contains('metadata', { source: 'bubble_import' });

  console.log(`Documents with metadata.source=bubble_import: ${bubbleDocs}`);
}

main().catch(console.error);
