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
  console.log('\n=== BUBBLE IMPORT QUALITY CHECK ===\n');

  // Get all bubble candidates
  const { data: allCandidates } = await supabase
    .from('candidates')
    .select('id, embedding, cv_extracted_at')
    .eq('source', 'bubble_import')
    .is('deleted_at', null);

  console.log(`Total bubble_import candidates: ${allCandidates?.length || 0}`);

  // Get documents
  const { data: docs } = await supabase
    .from('documents')
    .select('entity_id, type, extracted_text')
    .eq('entity_type', 'candidate')
    .is('deleted_at', null)
    .in('entity_id', allCandidates?.map(c => c.id) || []);

  // Get unique candidates with docs
  const candidatesWithDocs = new Set(docs?.map(d => d.entity_id) || []);
  console.log(`Candidates with documents: ${candidatesWithDocs.size}`);

  // Candidates with embeddings (from those with docs)
  const withEmbeddings = allCandidates?.filter(c => 
    candidatesWithDocs.has(c.id) && c.embedding !== null
  ).length || 0;
  console.log(`With embeddings: ${withEmbeddings} (${((withEmbeddings / candidatesWithDocs.size) * 100).toFixed(1)}%)`);

  // Candidates with CV extraction (from those with docs)
  const withExtraction = allCandidates?.filter(c => 
    candidatesWithDocs.has(c.id) && c.cv_extracted_at !== null
  ).length || 0;
  console.log(`With CV data extraction: ${withExtraction} (${((withExtraction / candidatesWithDocs.size) * 100).toFixed(1)}%)`);

  // CV stats
  const cvs = docs?.filter(d => d.type === 'cv') || [];
  const cvsWithText = cvs.filter(d => d.extracted_text && d.extracted_text.length > 0);
  console.log(`\nTotal CVs: ${cvs.length}`);
  console.log(`CVs with text: ${cvsWithText.length} (${((cvsWithText.length / cvs.length) * 100).toFixed(1)}%)`);

  // Document types
  const docTypes: Record<string, number> = {};
  docs?.forEach(d => {
    docTypes[d.type] = (docTypes[d.type] || 0) + 1;
  });
  
  console.log(`\nDocument types:`);
  Object.entries(docTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  console.log('\n===================================\n');
}

main().catch(console.error);
