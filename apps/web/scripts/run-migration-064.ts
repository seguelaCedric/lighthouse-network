#!/usr/bin/env npx tsx
/**
 * Run migration 064 - Add placed_by fields to placements
 */

import * as path from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(url, key);

  console.log('Running migration: Add placed_by fields to placements...');

  // Add columns using raw SQL via RPC
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE placements ADD COLUMN IF NOT EXISTS vincere_placed_by_id INTEGER;
      ALTER TABLE placements ADD COLUMN IF NOT EXISTS placed_by_name TEXT;
      CREATE INDEX IF NOT EXISTS idx_placements_vincere_placed_by_id ON placements(vincere_placed_by_id) WHERE vincere_placed_by_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_placements_placed_by_name ON placements(placed_by_name) WHERE placed_by_name IS NOT NULL;
    `
  });

  if (error) {
    // If exec_sql doesn't exist, we need to use the dashboard or direct connection
    console.log('Note: exec_sql RPC not available. Running via direct queries...');

    // Try to add columns via insert/update pattern (won't work for DDL)
    // Let's just check if columns exist
    const { data, error: checkError } = await supabase
      .from('placements')
      .select('vincere_placed_by_id, placed_by_name')
      .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('\nColumns do not exist yet. Please run this SQL in the Supabase dashboard:');
      console.log(`
ALTER TABLE placements ADD COLUMN IF NOT EXISTS vincere_placed_by_id INTEGER;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS placed_by_name TEXT;
CREATE INDEX IF NOT EXISTS idx_placements_vincere_placed_by_id ON placements(vincere_placed_by_id) WHERE vincere_placed_by_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_placements_placed_by_name ON placements(placed_by_name) WHERE placed_by_name IS NOT NULL;
      `);
    } else if (!checkError) {
      console.log('✓ Columns already exist!');
    } else {
      console.error('Check error:', checkError);
    }
  } else {
    console.log('✓ Migration completed successfully!');
  }
}

main().catch(console.error);
