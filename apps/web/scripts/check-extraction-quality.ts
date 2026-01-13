import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('candidates')
    .select(`
      id,
      first_name,
      last_name,
      email,
      primary_position,
      years_experience,
      highest_license,
      has_stcw,
      has_eng1,
      positions_held,
      extraction_confidence,
      embedding_text
    `)
    .not('cv_extracted_at', 'is', null)
    .eq('source', 'bubble_import')
    .order('cv_extracted_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const c of data || []) {
    console.log('\n' + '='.repeat(70));
    console.log(c.first_name + ' ' + c.last_name + ' (' + c.email + ')');
    console.log('-'.repeat(70));
    console.log('Position: ' + c.primary_position);
    console.log('Experience: ' + c.years_experience + ' years');
    console.log('License: ' + c.highest_license);
    console.log('STCW: ' + c.has_stcw + ', ENG1: ' + c.has_eng1);
    console.log('Positions held: ' + (c.positions_held || []).join(', '));
    console.log('Confidence: ' + c.extraction_confidence);
    console.log('\nEmbedding preview (first 400 chars):');
    console.log((c.embedding_text || '').substring(0, 400));
  }
}

main();
