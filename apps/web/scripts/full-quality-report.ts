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
  console.log('BUBBLE IMPORT - COMPLETE QUALITY REPORT');
  console.log('========================================\n');

  console.log('Loading data...\n');

  // Get ALL documents in batches
  let allDocs: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data } = await supabase
      .from('documents')
      .select('entity_id, type, extracted_text')
      .eq('entity_type', 'candidate')
      .contains('metadata', { source: 'bubble_import' })
      .range(offset, offset + batchSize - 1);
    
    if (!data || data.length === 0) break;
    allDocs = allDocs.concat(data);
    offset += batchSize;
    console.log(`  Loaded ${allDocs.length} documents...`);
  }

  const uniqueCandidateIds = [...new Set(allDocs.map(d => d.entity_id))];
  console.log(`\n✓ Loaded ${allDocs.length} documents for ${uniqueCandidateIds.length} candidates\n`);

  // Get ALL candidates in batches
  let allCandidates: any[] = [];
  for (let i = 0; i < uniqueCandidateIds.length; i += 100) {
    const batch = uniqueCandidateIds.slice(i, i + 100);
    const { data } = await supabase
      .from('candidates')
      .select('id, embedding, cv_extracted_at, positions_extracted, yacht_experience_extracted, languages_extracted')
      .in('id', batch)
      .is('deleted_at', null);
    
    if (data) allCandidates = allCandidates.concat(data);
  }

  console.log(`✓ Loaded ${allCandidates.length} candidates\n`);

  // Calculate metrics
  const withEmbeddings = allCandidates.filter(c => c.embedding !== null).length;
  const withExtraction = allCandidates.filter(c => c.cv_extracted_at !== null).length;
  const withPositions = allCandidates.filter(c => 
    c.positions_extracted && Array.isArray(c.positions_extracted) && c.positions_extracted.length > 0
  ).length;
  const withYachtExp = allCandidates.filter(c => 
    c.yacht_experience_extracted && Array.isArray(c.yacht_experience_extracted) && c.yacht_experience_extracted.length > 0
  ).length;
  const withLanguages = allCandidates.filter(c => 
    c.languages_extracted && Array.isArray(c.languages_extracted) && c.languages_extracted.length > 0
  ).length;

  const cvs = allDocs.filter(d => d.type === 'cv');
  const cvsWithText = cvs.filter(d => d.extracted_text && d.extracted_text.length > 50);

  const docTypes: Record<string, number> = {};
  allDocs.forEach(d => {
    docTypes[d.type] = (docTypes[d.type] || 0) + 1;
  });

  console.log('========================================');
  console.log('IMPORT STATISTICS');
  console.log('========================================\n');
  console.log(`Candidates imported: ${allCandidates.length}`);
  console.log(`Documents imported: ${allDocs.length}`);
  console.log(`Average docs per candidate: ${(allDocs.length / allCandidates.length).toFixed(1)}`);

  console.log('\n========================================');
  console.log('EMBEDDINGS & SEARCH');
  console.log('========================================\n');
  console.log(`With embeddings: ${withEmbeddings}/${allCandidates.length} (${((withEmbeddings / allCandidates.length) * 100).toFixed(1)}%)`);

  console.log('\n========================================');
  console.log('CV PROCESSING');
  console.log('========================================\n');
  console.log(`Total CVs: ${cvs.length}`);
  console.log(`CVs with text extracted: ${cvsWithText.length}/${cvs.length} (${((cvsWithText.length / cvs.length) * 100).toFixed(1)}%)`);
  console.log(`Candidates with CV data extraction: ${withExtraction}/${allCandidates.length} (${((withExtraction / allCandidates.length) * 100).toFixed(1)}%)`);

  console.log('\n========================================');
  console.log('EXTRACTED DATA QUALITY');
  console.log('========================================\n');
  console.log(`With positions extracted: ${withPositions}/${allCandidates.length} (${((withPositions / allCandidates.length) * 100).toFixed(1)}%)`);
  console.log(`With yacht experience: ${withYachtExp}/${allCandidates.length} (${((withYachtExp / allCandidates.length) * 100).toFixed(1)}%)`);
  console.log(`With languages extracted: ${withLanguages}/${allCandidates.length} (${((withLanguages / allCandidates.length) * 100).toFixed(1)}%)`);

  console.log('\n========================================');
  console.log('DOCUMENT TYPE BREAKDOWN');
  console.log('========================================\n');
  Object.entries(docTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`${type.padEnd(20)} ${count.toString().padStart(4)}`);
    });

  console.log('\n========================================');
  console.log('QUALITY ASSESSMENT');
  console.log('========================================\n');

  const embScore = (withEmbeddings / allCandidates.length) * 100;
  const extractScore = (withExtraction / allCandidates.length) * 100;
  const textScore = (cvsWithText.length / cvs.length) * 100;

  const targets = [
    { name: 'Embeddings', score: embScore, target: 95, actual: withEmbeddings, total: allCandidates.length },
    { name: 'CV Data Extraction', score: extractScore, target: 25, actual: withExtraction, total: allCandidates.length },
    { name: 'CV Text Extraction', score: textScore, target: 80, actual: cvsWithText.length, total: cvs.length }
  ];

  let allExcellent = true;
  targets.forEach(t => {
    const status = t.score >= t.target ? '✅' : '⚠️ ';
    console.log(`${status} ${t.name.padEnd(22)} ${t.score.toFixed(1)}% (${t.actual}/${t.total})`);
    console.log(`   ${''.padEnd(25)} Target: ${t.target}%`);
    if (t.score < t.target) {
      allExcellent = false;
      const needed = Math.ceil((t.target / 100) * t.total) - t.actual;
      console.log(`   ${''.padEnd(25)} Need: ${needed} more`);
    }
    console.log('');
  });

  if (allExcellent) {
    console.log('🎉 Status: EXCELLENT - All quality targets met!');
  } else {
    console.log('⚠️  Status: NEEDS IMPROVEMENT');
  }

  console.log('\n========================================\n');
}

main().catch(console.error);
