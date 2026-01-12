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
  // Count candidates by source
  const { count: bubbleSource } = await supabase
    .from('candidates')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'bubble_import')
    .is('deleted_at', null);

  // Count candidates with embeddings
  const { count: bubbleWithEmb } = await supabase
    .from('candidates')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'bubble_import')
    .is('deleted_at', null)
    .not('embedding', 'is', null);

  console.log('\nBubble Import Candidates:');
  console.log('========================');
  console.log('Total:', bubbleSource);
  console.log('With embeddings:', bubbleWithEmb);
  console.log('Coverage:', (bubbleWithEmb! / bubbleSource! * 100).toFixed(1) + '%');
  console.log('');
}

main().catch(console.error);
