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
  // Get documents
  const { count: docsCount } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', 'candidate')
    .contains('metadata', { source: 'bubble_import' });

  console.log(`Total bubble documents: ${docsCount}`);

  // Get unique candidate IDs from documents
  const { data: docs } = await supabase
    .from('documents')
    .select('entity_id')
    .eq('entity_type', 'candidate')
    .contains('metadata', { source: 'bubble_import' })
    .limit(5000);

  const uniqueCandidateIds = [...new Set(docs?.map(d => d.entity_id) || [])];
  console.log(`Unique candidates from documents: ${uniqueCandidateIds.length}`);

  // Check how many are deleted
  const { count: notDeleted } = await supabase
    .from('candidates')
    .select('id', { count: 'exact', head: true })
    .in('id', uniqueCandidateIds)
    .is('deleted_at', null);

  const { count: deleted } = await supabase
    .from('candidates')
    .select('id', { count: 'exact', head: true })
    .in('id', uniqueCandidateIds)
    .not('deleted_at', 'is', null);

  console.log(`Not deleted: ${notDeleted}`);
  console.log(`Deleted: ${deleted}`);
}

main().catch(console.error);
