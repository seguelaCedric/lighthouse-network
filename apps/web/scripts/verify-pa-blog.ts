import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPABlogPost() {
  console.log('\n🔍 Verifying PA Blog Post Database Fields...\n');

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, target_audience, target_position, primary_keyword, related_landing_page_urls, answer_capsule, answer_capsule_question')
    .eq('slug', '25-essential-personal-assistant-interview-questions-for-success')
    .single();

  if (error) {
    console.error('❌ Error fetching blog post:', error);
    return;
  }

  if (!data) {
    console.error('❌ Blog post not found');
    return;
  }

  console.log('✅ Blog Post Found:', data.slug);
  console.log('');
  console.log('📊 Current State:');
  console.log('  - ID:', data.id);
  console.log('  - Target Audience:', data.target_audience || '(not set)');
  console.log('  - Target Position:', data.target_position || '(not set)');
  console.log('  - Primary Keyword:', data.primary_keyword || '(not set)');
  console.log('  - Related Landing Page URLs:', data.related_landing_page_urls ? `${data.related_landing_page_urls.length} URLs` : 'NULL ✅');
  console.log('  - Answer Capsule:', data.answer_capsule ? '✅ Present' : '❌ Missing');
  console.log('  - Answer Capsule Question:', data.answer_capsule_question || '(not set)');
  console.log('');

  // Check what needs to be updated
  const updates: string[] = [];

  if (data.target_audience !== 'employer') {
    updates.push(`target_audience: '${data.target_audience}' → 'employer'`);
  }

  if (data.target_position !== 'Personal Assistant') {
    updates.push(`target_position: '${data.target_position}' → 'Personal Assistant'`);
  }

  if (data.related_landing_page_urls !== null && data.related_landing_page_urls.length > 0) {
    updates.push(`related_landing_page_urls: ${data.related_landing_page_urls.length} URLs → NULL`);
  }

  if (updates.length > 0) {
    console.log('⚠️  Updates Needed:');
    updates.forEach(update => console.log('  -', update));
  } else {
    console.log('✅ All fields are correct!');
  }

  console.log('');
}

verifyPABlogPost().then(() => {
  console.log('✅ Verification complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
