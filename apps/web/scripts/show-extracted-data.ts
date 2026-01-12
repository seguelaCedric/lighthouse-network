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
  console.log('\n=== CANDIDATES WITH CV DATA EXTRACTION ===\n');

  // Get candidates with extraction data
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, cv_extracted_at, positions_extracted, yacht_experience_extracted, languages_extracted, certifications_extracted')
    .eq('source', 'bubble_import')
    .is('deleted_at', null)
    .not('cv_extracted_at', 'is', null)
    .limit(20);

  if (!candidates || candidates.length === 0) {
    console.log('No candidates with extraction found.');
    return;
  }

  candidates.forEach((c, idx) => {
    console.log(`\n${idx + 1}. ${c.first_name} ${c.last_name}`);
    console.log('   ID:', c.id);
    console.log('   Extracted at:', c.cv_extracted_at);

    if (c.positions_extracted && Array.isArray(c.positions_extracted) && c.positions_extracted.length > 0) {
      console.log(`   Positions (${c.positions_extracted.length}):`);
      c.positions_extracted.slice(0, 3).forEach((pos: any) => {
        const title = pos.title || 'Unknown';
        const vessel = pos.vessel_name ? ` on ${pos.vessel_name}` : '';
        const dates = pos.start_date ? ` (${pos.start_date.slice(0, 4)})` : '';
        console.log(`     - ${title}${vessel}${dates}`);
      });
      if (c.positions_extracted.length > 3) {
        console.log(`     ... and ${c.positions_extracted.length - 3} more`);
      }
    } else {
      console.log('   Positions: None');
    }

    if (c.languages_extracted && Array.isArray(c.languages_extracted) && c.languages_extracted.length > 0) {
      const langs = c.languages_extracted.map((l: any) =>
        typeof l === 'string' ? l : (l.language || l.name)
      ).filter(Boolean);
      console.log('   Languages:', langs.join(', '));
    }

    if (c.yacht_experience_extracted && Array.isArray(c.yacht_experience_extracted) && c.yacht_experience_extracted.length > 0) {
      console.log(`   Yacht Experience: ${c.yacht_experience_extracted.length} vessels`);
      c.yacht_experience_extracted.slice(0, 2).forEach((y: any) => {
        const name = y.vessel_name || y.name || 'Unknown';
        const size = y.vessel_size ? ` (${y.vessel_size}m)` : '';
        console.log(`     - ${name}${size}`);
      });
    }

    if (c.certifications_extracted && Array.isArray(c.certifications_extracted) && c.certifications_extracted.length > 0) {
      console.log(`   Certifications (${c.certifications_extracted.length}):`);
      c.certifications_extracted.slice(0, 3).forEach((cert: any) => {
        const name = typeof cert === 'string' ? cert : (cert.name || cert.certification);
        if (name) console.log(`     - ${name}`);
      });
    }
  });

  console.log(`\n=== Showing ${candidates.length} of many candidates with extraction ===\n`);
}

main().catch(console.error);
