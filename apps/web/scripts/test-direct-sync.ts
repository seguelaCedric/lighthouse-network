import { config } from 'dotenv';
config({ path: '.env.local' });

import { syncCandidateUpdate } from '../lib/vincere/sync-service';
import { createClient } from '@supabase/supabase-js';

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get candidate
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, phone')
    .eq('email', 'seguelac+33334@gmail.com')
    .single();

  console.log('=== BEFORE ===');
  console.log('Database phone:', candidate?.phone);

  // Create the same payload the server action creates
  const syncPayload = {
    first_name: 'CedricTest',
    last_name: 'SeguelaTest',
    phone: '+33612341234', // NEW test value
  };

  console.log('\n=== CALLING SYNC ===');
  console.log('syncPayload:', JSON.stringify(syncPayload, null, 2));

  const result = await syncCandidateUpdate(candidate!.id, syncPayload);
  console.log('\n=== SYNC RESULT ===');
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);
