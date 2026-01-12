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

async function checkContentLinks() {
  console.log('\n🔗 Checking seo_content_links for PA Blog Post...\n');

  // First, get the blog post ID
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title')
    .eq('slug', '25-essential-personal-assistant-interview-questions-for-success')
    .single();

  if (postError || !post) {
    console.error('❌ Error fetching blog post:', postError);
    return;
  }

  console.log('✅ Blog Post:', post.title);
  console.log('📝 Post ID:', post.id);
  console.log('');

  // Check content links
  const { data: contentLinks, error: linksError } = await supabase
    .from('seo_content_links')
    .select('*')
    .eq('blog_post_id', post.id)
    .order('priority', { ascending: false });

  if (linksError) {
    console.error('❌ Error fetching content links:', linksError);
    return;
  }

  if (!contentLinks || contentLinks.length === 0) {
    console.log('⚠️  No content links found for this blog post');
    console.log('');
    console.log('💡 This is expected - we need to generate the PA content cluster first:');
    console.log('   1. PA Hiring Guide');
    console.log('   2. PA Salary Guide');
    console.log('   3. What to Look For in a PA');
    console.log('   4. PA Position Overview');
    console.log('   5. PA Career Path');
    console.log('   6. PA Skills Required');
    console.log('   7. PA Legal Requirements');
    console.log('');
    console.log('📋 Once these posts are generated, we\'ll populate seo_content_links');
    console.log('   to create the content cluster connections.');
  } else {
    console.log(`✅ Found ${contentLinks.length} content links:`);
    console.log('');
    contentLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.title}`);
      console.log(`   URL: ${link.url}`);
      console.log(`   Type: ${link.content_type}`);
      console.log(`   Priority: ${link.priority}`);
      console.log('');
    });
  }

  console.log('');
}

checkContentLinks().then(() => {
  console.log('✅ Check complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
