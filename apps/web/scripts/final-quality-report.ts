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
  console.log('\n========================================');
  console.log('BUBBLE IMPORT QUALITY REPORT');
  console.log('========================================\n');

  // Get all bubble documents  
  let allDocs: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data } = await supabase
      .from('documents')
      .select('entity_id, type, extracted_text, name')
      .eq('entity_type', 'candidate')
      .is('deleted_at', null)
      .contains('metadata', { source: 'bubble_import' })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (!data || data.length === 0) break;
    allDocs = allDocs.concat(data);
    page++;
    console.log(`  Loaded ${allDocs.length} documents...`);
    if (data.length < pageSize) break;
  }

  console.log(`\n✓ Total documents: ${allDocs.length}\n`);

  // Get unique candidates
  const uniqueCandidateIds = [...new Set(allDocs.map(d => d.entity_id))];
  console.log(`✓ Unique candidates: ${uniqueCandidateIds.length}\n`);

  // Fetch candidate data
  let allCandidates: any[] = [];
  for (let i = 0; i < uniqueCandidateIds.length; i += 1000) {
    const batch = uniqueCandidateIds.slice(i, i + 1000);
    const { data } = await supabase
      .from('candidates')
      .select('id, embedding, cv_extracted_at, positions_extracted, yacht_experience_extracted')
      .in('id', batch)
      .is('deleted_at', null);
    
    if (data) allCandidates = allCandidates.concat(data);
  }

  console.log(`✓ Loaded candidate data for ${allCandidates.length} candidates\n`);

  // Analysis
  const withEmbeddings = allCandidates.filter(c => c.embedding !== null).length;
  const withExtraction = allCandidates.filter(c => c.cv_extracted_at !== null).length;
  const withPositions = allCandidates.filter(c => 
    c.positions_extracted && Array.isArray(c.positions_extracted) && c.positions_extracted.length > 0
  ).length;
  const withYachtExp = allCandidates.filter(c => 
    c.yacht_experience_extracted && Array.isArray(c.yacht_experience_extracted) && c.yacht_experience_extracted.length > 0
  ).length;

  const cvs = allDocs.filter(d => d.type === 'cv');
  const cvsWithText = cvs.filter(d => d.extracted_text && d.extracted_text.length > 50);

  console.log('========================================');
  console.log('RESULTS');
  console.log('========================================\n');
  console.log(`1. Candidates with documents: ${allCandidates.length}`);
  console.log(`2. Total documents: ${allDocs.length}`);
  console.log(`3. With embeddings: ${withEmbeddings} (${((withEmbeddings / allCandidates.length) * 100).toFixed(1)}%)`);
  console.log(`4. With CV data extraction: ${withExtraction} (${((withExtraction / allCandidates.length) * 100).toFixed(1)}%)`);
  console.log(`5. With positions extracted: ${withPositions} (${((withPositions / allCandidates.length) * 100).toFixed(1)}%)`);
  console.log(`6. With yacht experience: ${withYachtExp} (${((withYachtExp / allCandidates.length) * 100).toFixed(1)}%)`);
  console.log(`\n7. Total CVs: ${cvs.length}`);
  console.log(`8. CVs with text (>50 chars): ${cvsWithText.length} (${((cvsWithText.length / cvs.length) * 100).toFixed(1)}%)`);

  // Document types
  const docTypes: Record<string, number> = {};
  allDocs.forEach(d => {
    docTypes[d.type] = (docTypes[d.type] || 0) + 1;
  });
  
  console.log(`\n9. Document type breakdown:`);
  Object.entries(docTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

  console.log('\n========================================');
  console.log('QUALITY ASSESSMENT');
  console.log('========================================\n');

  const embeddingScore = (withEmbeddings / allCandidates.length) * 100;
  const extractionScore = (withExtraction / allCandidates.length) * 100;
  const textScore = (cvsWithText.length / cvs.length) * 100;

  if (embeddingScore >= 95 && extractionScore >= 25 && textScore >= 80) {
    console.log('✅ EXCELLENT');
    console.log(`   - Embeddings: ${embeddingScore.toFixed(1)}% ✓`);
    console.log(`   - CV Extraction: ${extractionScore.toFixed(1)}% ✓`);
    console.log(`   - CV Text: ${textScore.toFixed(1)}% ✓`);
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT:\n');
    if (embeddingScore < 95) console.log(`   - Embeddings: ${embeddingScore.toFixed(1)}% (target: 95%+)`);
    if (extractionScore < 25) console.log(`   - CV Extraction: ${extractionScore.toFixed(1)}% (target: 25%+)`);
    if (textScore < 80) console.log(`   - CV Text: ${textScore.toFixed(1)}% (target: 80%+)`);
  }

  console.log('\n========================================\n');
}

main().catch(console.error);
