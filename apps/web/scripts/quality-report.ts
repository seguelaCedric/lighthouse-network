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

  // Fetch all candidates and documents in batches
  let allCandidates: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data } = await supabase
      .from('candidates')
      .select('id, embedding, cv_extracted_at, positions_extracted, yacht_experience_extracted')
      .eq('source', 'bubble_import')
      .is('deleted_at', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (!data || data.length === 0) break;
    allCandidates = allCandidates.concat(data);
    page++;
    if (data.length < pageSize) break;
  }

  console.log(`✓ Loaded ${allCandidates.length} bubble_import candidates\n`);

  // Get all documents
  const candidateIds = allCandidates.map(c => c.id);
  let allDocs: any[] = [];
  
  for (let i = 0; i < candidateIds.length; i += 1000) {
    const batch = candidateIds.slice(i, i + 1000);
    const { data } = await supabase
      .from('documents')
      .select('entity_id, type, extracted_text')
      .eq('entity_type', 'candidate')
      .is('deleted_at', null)
      .in('entity_id', batch);
    
    if (data) allDocs = allDocs.concat(data);
  }

  console.log(`✓ Loaded ${allDocs.length} documents\n`);

  // Analysis
  const candidatesWithDocs = new Set(allDocs.map(d => d.entity_id));
  const candidatesWithDocsArray = allCandidates.filter(c => candidatesWithDocs.has(c.id));

  const withEmbeddings = candidatesWithDocsArray.filter(c => c.embedding !== null).length;
  const withExtraction = candidatesWithDocsArray.filter(c => c.cv_extracted_at !== null).length;
  const withPositions = candidatesWithDocsArray.filter(c => 
    c.positions_extracted && Array.isArray(c.positions_extracted) && c.positions_extracted.length > 0
  ).length;
  const withYachtExp = candidatesWithDocsArray.filter(c => 
    c.yacht_experience_extracted && Array.isArray(c.yacht_experience_extracted) && c.yacht_experience_extracted.length > 0
  ).length;

  const cvs = allDocs.filter(d => d.type === 'cv');
  const cvsWithText = cvs.filter(d => d.extracted_text && d.extracted_text.length > 50);

  console.log('RESULTS:');
  console.log('--------');
  console.log(`1. Candidates with documents: ${candidatesWithDocs.size}`);
  console.log(`2. With embeddings: ${withEmbeddings} (${((withEmbeddings / candidatesWithDocs.size) * 100).toFixed(1)}%)`);
  console.log(`3. With CV data extraction: ${withExtraction} (${((withExtraction / candidatesWithDocs.size) * 100).toFixed(1)}%)`);
  console.log(`4. With positions extracted: ${withPositions} (${((withPositions / candidatesWithDocs.size) * 100).toFixed(1)}%)`);
  console.log(`5. With yacht experience: ${withYachtExp} (${((withYachtExp / candidatesWithDocs.size) * 100).toFixed(1)}%)`);
  console.log(`\n6. Total CVs: ${cvs.length}`);
  console.log(`7. CVs with text (>50 chars): ${cvsWithText.length} (${((cvsWithText.length / cvs.length) * 100).toFixed(1)}%)`);

  // Document types
  const docTypes: Record<string, number> = {};
  allDocs.forEach(d => {
    docTypes[d.type] = (docTypes[d.type] || 0) + 1;
  });
  
  console.log(`\n8. Document types:`);
  Object.entries(docTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

  console.log('\n========================================\n');

  // Quality assessment
  const embeddingScore = (withEmbeddings / candidatesWithDocs.size) * 100;
  const extractionScore = (withExtraction / candidatesWithDocs.size) * 100;
  const textScore = (cvsWithText.length / cvs.length) * 100;

  console.log('QUALITY ASSESSMENT:');
  console.log('-------------------');
  if (embeddingScore >= 95 && extractionScore >= 95 && textScore >= 80) {
    console.log('✅ EXCELLENT - All metrics above target');
  } else if (embeddingScore >= 80 && extractionScore >= 80 && textScore >= 70) {
    console.log('✓ GOOD - Most metrics on track');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT:');
    if (embeddingScore < 95) console.log(`   - Embeddings: ${embeddingScore.toFixed(1)}% (target: 95%+)`);
    if (extractionScore < 95) console.log(`   - CV Extraction: ${extractionScore.toFixed(1)}% (target: 95%+)`);
    if (textScore < 80) console.log(`   - CV Text: ${textScore.toFixed(1)}% (target: 80%+)`);
  }

  console.log('\n========================================\n');
}

main().catch(console.error);
