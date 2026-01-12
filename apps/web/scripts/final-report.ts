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
  console.log('BUBBLE IMPORT - FINAL QUALITY REPORT');
  console.log('========================================\n');

  // Get documents
  const { data: allDocs } = await supabase
    .from('documents')
    .select('entity_id, type, extracted_text')
    .eq('entity_type', 'candidate')
    .contains('metadata', { source: 'bubble_import' })
    .limit(5000);

  const uniqueCandidateIds = [...new Set(allDocs?.map(d => d.entity_id) || [])];
  
  // Get candidates
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, embedding, cv_extracted_at, positions_extracted, yacht_experience_extracted, languages_extracted')
    .in('id', uniqueCandidateIds)
    .is('deleted_at', null);

  const withEmbeddings = candidates?.filter(c => c.embedding !== null).length || 0;
  const withExtraction = candidates?.filter(c => c.cv_extracted_at !== null).length || 0;
  const withPositions = candidates?.filter(c => 
    c.positions_extracted && Array.isArray(c.positions_extracted) && c.positions_extracted.length > 0
  ).length || 0;
  const withYachtExp = candidates?.filter(c => 
    c.yacht_experience_extracted && Array.isArray(c.yacht_experience_extracted) && c.yacht_experience_extracted.length > 0
  ).length || 0;
  const withLanguages = candidates?.filter(c => 
    c.languages_extracted && Array.isArray(c.languages_extracted) && c.languages_extracted.length > 0
  ).length || 0;

  const cvs = allDocs?.filter(d => d.type === 'cv') || [];
  const cvsWithText = cvs.filter(d => d.extracted_text && d.extracted_text.length > 50);

  const docTypes: Record<string, number> = {};
  allDocs?.forEach(d => {
    docTypes[d.type] = (docTypes[d.type] || 0) + 1;
  });

  console.log('IMPORT STATISTICS');
  console.log('-----------------');
  console.log(`Candidates imported: ${candidates?.length || 0}`);
  console.log(`Documents imported: ${allDocs?.length || 0}`);
  console.log(`Average docs per candidate: ${((allDocs?.length || 0) / (candidates?.length || 1)).toFixed(1)}`);

  console.log('\nEMBEDDINGS & SEARCH');
  console.log('-------------------');
  console.log(`With embeddings: ${withEmbeddings}/${candidates?.length} (${((withEmbeddings / (candidates?.length || 1)) * 100).toFixed(1)}%)`);

  console.log('\nCV PROCESSING');
  console.log('-------------');
  console.log(`Total CVs: ${cvs.length}`);
  console.log(`CVs with text extracted: ${cvsWithText.length}/${cvs.length} (${((cvsWithText.length / cvs.length) * 100).toFixed(1)}%)`);
  console.log(`CV data extraction: ${withExtraction}/${candidates?.length} (${((withExtraction / (candidates?.length || 1)) * 100).toFixed(1)}%)`);

  console.log('\nEXTRACTED DATA QUALITY');
  console.log('----------------------');
  console.log(`With positions: ${withPositions}/${candidates?.length} (${((withPositions / (candidates?.length || 1)) * 100).toFixed(1)}%)`);
  console.log(`With yacht experience: ${withYachtExp}/${candidates?.length} (${((withYachtExp / (candidates?.length || 1)) * 100).toFixed(1)}%)`);
  console.log(`With languages: ${withLanguages}/${candidates?.length} (${((withLanguages / (candidates?.length || 1)) * 100).toFixed(1)}%)`);

  console.log('\nDOCUMENT TYPES');
  console.log('--------------');
  Object.entries(docTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`${type.padEnd(15)} ${count}`);
    });

  console.log('\n========================================');
  console.log('QUALITY ASSESSMENT');
  console.log('========================================\n');

  const embScore = (withEmbeddings / (candidates?.length || 1)) * 100;
  const extractScore = (withExtraction / (candidates?.length || 1)) * 100;
  const textScore = (cvsWithText.length / cvs.length) * 100;

  const scores = [
    { name: 'Embeddings', score: embScore, target: 95 },
    { name: 'CV Extraction', score: extractScore, target: 25 },
    { name: 'CV Text', score: textScore, target: 80 }
  ];

  let excellent = true;
  scores.forEach(s => {
    const status = s.score >= s.target ? '✅' : '⚠️ ';
    console.log(`${status} ${s.name}: ${s.score.toFixed(1)}% (target: ${s.target}%)`);
    if (s.score < s.target) excellent = false;
  });

  if (excellent) {
    console.log('\n🎉 Status: EXCELLENT - All quality targets met!');
  } else {
    console.log('\n⚠️  Status: NEEDS IMPROVEMENT - Some targets not met');
  }

  console.log('\n========================================\n');
}

main().catch(console.error);
