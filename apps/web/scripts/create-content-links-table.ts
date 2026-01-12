import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createContentLinksTable() {
  console.log('\n📦 Creating seo_content_links table...\n');

  // Read the migration SQL
  const migrationPath = path.resolve(__dirname, '../../../supabase/migrations/20260112152849_create_seo_content_links_table.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Execute the SQL
  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

  if (error) {
    // Try direct execution via REST API
    console.log('⚠️  RPC method not available, trying direct execution...');

    // Split into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      const { error: stmtError } = await supabase.rpc('exec', { query: statement + ';' });
      if (stmtError) {
        console.error(`❌ Error executing statement: ${stmtError.message}`);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }
  }

  // Verify table was created
  const { data: tables, error: checkError } = await supabase
    .from('seo_content_links')
    .select('count')
    .limit(0);

  if (checkError && checkError.code === '42P01') {
    console.error('❌ Table was not created. Error:', checkError.message);
    console.log('\n💡 Please run this SQL manually in Supabase Dashboard:');
    console.log('\n' + migrationSQL);
    return;
  }

  console.log('✅ Table seo_content_links created successfully!');
  console.log('');
}

createContentLinksTable().then(() => {
  console.log('✅ Setup complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
