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
  console.log('\n=== BUBBLE IMPORT QUALITY REPORT (Candidates with Documents) ===\n');

  // Get unique candidates that have documents
  const { data: candidatesWithDocs } = await supabase.rpc('exec_sql', {
    query: `
      SELECT COUNT(DISTINCT c.id) as count
      FROM candidates c
      JOIN documents d ON d.entity_id = c.id AND d.entity_type = 'candidate'
      WHERE c.source = 'bubble_import'
        AND c.deleted_at IS NULL
        AND d.deleted_at IS NULL
    `
  }) as any;

  const totalCandidates = candidatesWithDocs?.[0]?.count || 0;
  console.log(`1. Candidates with documents: ${totalCandidates}`);

  // With embeddings
  const { data: withEmbStats } = await supabase.rpc('exec_sql', {
    query: `
      SELECT COUNT(DISTINCT c.id) as count
      FROM candidates c
      JOIN documents d ON d.entity_id = c.id AND d.entity_type = 'candidate'
      WHERE c.source = 'bubble_import'
        AND c.deleted_at IS NULL
        AND d.deleted_at IS NULL
        AND c.embedding IS NOT NULL
    `
  }) as any;

  const withEmbeddings = withEmbStats?.[0]?.count || 0;
  const embeddingPct = totalCandidates ? ((withEmbeddings / totalCandidates) * 100).toFixed(1) : 0;
  console.log(`2. With embeddings: ${withEmbeddings} (${embeddingPct}%)`);

  // With CV extraction
  const { data: withExtrStats } = await supabase.rpc('exec_sql', {
    query: `
      SELECT COUNT(DISTINCT c.id) as count
      FROM candidates c
      JOIN documents d ON d.entity_id = c.id AND d.entity_type = 'candidate'
      WHERE c.source = 'bubble_import'
        AND c.deleted_at IS NULL
        AND d.deleted_at IS NULL
        AND c.cv_extracted_at IS NOT NULL
    `
  }) as any;

  const withExtraction = withExtrStats?.[0]?.count || 0;
  const extractionPct = totalCandidates ? ((withExtraction / totalCandidates) * 100).toFixed(1) : 0;
  console.log(`3. With CV data extraction: ${withExtraction} (${extractionPct}%)`);

  // CVs with text
  const { data: cvStats } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        COUNT(*) as total_cvs,
        COUNT(CASE WHEN d.extracted_text IS NOT NULL AND d.extracted_text != '' THEN 1 END) as with_text
      FROM documents d
      JOIN candidates c ON c.id = d.entity_id
      WHERE d.type = 'cv'
        AND d.entity_type = 'candidate'
        AND c.source = 'bubble_import'
        AND d.deleted_at IS NULL
        AND c.deleted_at IS NULL
    `
  }) as any;

  if (cvStats && cvStats.length > 0) {
    const textPct = cvStats[0].total_cvs ? ((cvStats[0].with_text / cvStats[0].total_cvs) * 100).toFixed(1) : 0;
    console.log(`4. Total CVs: ${cvStats[0].total_cvs}`);
    console.log(`5. CVs with text extracted: ${cvStats[0].with_text} (${textPct}%)`);
  }

  // Document type breakdown
  const { data: docTypes } = await supabase.rpc('exec_sql', {
    query: `
      SELECT d.type, COUNT(*) as count
      FROM documents d
      JOIN candidates c ON c.id = d.entity_id
      WHERE d.entity_type = 'candidate'
        AND c.source = 'bubble_import'
        AND d.deleted_at IS NULL
        AND c.deleted_at IS NULL
      GROUP BY d.type
      ORDER BY count DESC
      LIMIT 5
    `
  }) as any;

  console.log('\n6. Top document types:');
  if (docTypes && docTypes.length > 0) {
    docTypes.forEach((dt: any) => {
      console.log(`   - ${dt.type}: ${dt.count}`);
    });
  }

  console.log('\n===============================================================\n');
}

main().catch(console.error);
