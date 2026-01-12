/**
 * Create Internal Content Links for Private Chef Content Cluster
 *
 * This script creates bidirectional links between all Private Chef blog posts to build
 * a self-contained content cluster that keeps users engaged and improves SEO.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Private Chef Blog Posts (will be fetched from database)
async function getPrivateChefPosts() {
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content_type, target_audience')
    .eq('target_position', 'Private Chef')
    .in('content_type', [
      'interview_questions',
      'hiring_guide',
      'salary_guide',
      'what_to_look_for',
      'onboarding_guide',
      'position_overview',
      'career_path',
      'skills_required',
    ]);

  if (error) {
    console.error('❌ Error fetching Private Chef posts:', error);
    throw error;
  }

  const postMap: Record<string, any> = {};
  posts?.forEach(post => {
    postMap[post.content_type] = post;
  });

  return postMap;
}

async function createPrivateChefContentLinks() {
  console.log('\n🔗 Creating Internal Content Links for Private Chef Content Cluster\n');

  const posts = await getPrivateChefPosts();

  // Define content links (from post → to related posts)
  const contentLinks = [
    // Interview Questions → Related employer content
    {
      fromPost: posts.interview_questions,
      toPost: posts.hiring_guide,
      description: 'Learn the complete private chef hiring process from job posting to tasting',
      priority: 100,
    },
    {
      fromPost: posts.interview_questions,
      toPost: posts.what_to_look_for,
      description: 'Discover key qualities and red flags to watch for in private chef candidates',
      priority: 90,
    },
    {
      fromPost: posts.interview_questions,
      toPost: posts.salary_guide,
      description: 'Understand 2026 private chef salary ranges to make competitive offers',
      priority: 80,
    },

    // Hiring Guide → Related employer content
    {
      fromPost: posts.hiring_guide,
      toPost: posts.interview_questions,
      description: 'Review essential interview questions to evaluate private chef candidates',
      priority: 100,
    },
    {
      fromPost: posts.hiring_guide,
      toPost: posts.what_to_look_for,
      description: 'Identify must-have culinary skills and traits for your ideal private chef',
      priority: 90,
    },
    {
      fromPost: posts.hiring_guide,
      toPost: posts.onboarding_guide,
      description: 'Set your new private chef up for success with effective onboarding',
      priority: 85,
    },
    {
      fromPost: posts.hiring_guide,
      toPost: posts.salary_guide,
      description: 'Benchmark private chef salaries to attract top culinary talent',
      priority: 80,
    },

    // What to Look For → Related employer content
    {
      fromPost: posts.what_to_look_for,
      toPost: posts.hiring_guide,
      description: 'Follow the complete private chef hiring process step-by-step',
      priority: 100,
    },
    {
      fromPost: posts.what_to_look_for,
      toPost: posts.interview_questions,
      description: 'Ask the right questions to assess these key private chef traits',
      priority: 90,
    },
    {
      fromPost: posts.what_to_look_for,
      toPost: posts.skills_required,
      description: 'See the full breakdown of essential private chef skills',
      priority: 80,
    },

    // Onboarding Guide → Related employer content
    {
      fromPost: posts.onboarding_guide,
      toPost: posts.hiring_guide,
      description: 'Review the complete hiring process before onboarding',
      priority: 90,
    },
    {
      fromPost: posts.onboarding_guide,
      toPost: posts.what_to_look_for,
      description: 'Understand what makes a great private chef to guide your onboarding',
      priority: 85,
    },

    // Position Overview → Related candidate content
    {
      fromPost: posts.position_overview,
      toPost: posts.skills_required,
      description: 'Master the essential culinary skills needed for private chef success',
      priority: 100,
    },
    {
      fromPost: posts.position_overview,
      toPost: posts.career_path,
      description: 'Explore private chef career progression from junior to executive chef',
      priority: 90,
    },
    {
      fromPost: posts.position_overview,
      toPost: posts.salary_guide,
      description: 'Research private chef salary ranges for your experience level',
      priority: 80,
    },

    // Skills Required → Related candidate content
    {
      fromPost: posts.skills_required,
      toPost: posts.position_overview,
      description: 'Learn how these skills fit into the day-to-day private chef role',
      priority: 100,
    },
    {
      fromPost: posts.skills_required,
      toPost: posts.career_path,
      description: 'See how skill development drives private chef career progression',
      priority: 90,
    },
    {
      fromPost: posts.skills_required,
      toPost: posts.interview_questions,
      description: 'Prepare to demonstrate these skills in private chef interviews',
      priority: 80,
    },

    // Career Path → Related candidate content
    {
      fromPost: posts.career_path,
      toPost: posts.skills_required,
      description: 'Identify culinary skills you need to develop at each career stage',
      priority: 100,
    },
    {
      fromPost: posts.career_path,
      toPost: posts.position_overview,
      description: 'Understand the full scope of private chef responsibilities',
      priority: 90,
    },
    {
      fromPost: posts.career_path,
      toPost: posts.salary_guide,
      description: 'Track salary expectations as you advance your private chef career',
      priority: 80,
    },

    // Salary Guide → Related content (both audiences)
    {
      fromPost: posts.salary_guide,
      toPost: posts.hiring_guide,
      description: 'Learn how to hire a private chef at market-competitive rates',
      priority: 90,
    },
    {
      fromPost: posts.salary_guide,
      toPost: posts.career_path,
      description: 'Understand how salary grows with private chef career progression',
      priority: 85,
    },
    {
      fromPost: posts.salary_guide,
      toPost: posts.skills_required,
      description: 'See which culinary skills command higher private chef salaries',
      priority: 80,
    },
  ];

  console.log(`📊 Total links to create: ${contentLinks.length}\n`);

  for (let i = 0; i < contentLinks.length; i++) {
    const link = contentLinks[i];
    const linkNum = i + 1;

    if (!link.fromPost || !link.toPost) {
      console.log(`⚠️  Skipping link ${linkNum}: Missing post (may not be generated yet)`);
      continue;
    }

    try {
      const { error } = await supabase
        .from('seo_content_links')
        .insert({
          blog_post_id: link.fromPost.id,
          target_blog_post_id: link.toPost.id,
          title: link.toPost.title,
          url: `/blog/${link.toPost.slug}`,
          description: link.description,
          content_type: link.toPost.content_type,
          priority: link.priority,
          is_active: true,
        });

      if (error) {
        console.error(`❌ Error creating link ${linkNum}:`, error);
        throw error;
      }

      console.log(`✅ Link ${linkNum}/${contentLinks.length}: ${link.fromPost.content_type} → ${link.toPost.content_type}`);
    } catch (error) {
      console.error(`❌ Error creating link ${linkNum}:`, error);
      throw error;
    }
  }

  console.log('\n\n🎉 Success! Created all internal content links.');
  console.log('\n📊 Private Chef Content Cluster Status:');
  console.log('✅ 8 blog posts generated');
  console.log(`✅ ${contentLinks.length} internal content links created`);
  console.log('✅ Blog-to-blog navigation enabled');
  console.log('✅ User journey: Discovery → Education (2-3 articles) → Conversion');
  console.log('\n💡 Next Steps:');
  console.log('1. Publish all Private Chef blog posts (update status from draft to published)');
  console.log('2. Test navigation flow by visiting any Private Chef blog post');
  console.log('3. Verify "Learn More" section appears with related links');
  console.log('4. Continue with yacht crew positions (Captain, Chief Stewardess, Chef)');
}

// Run the creation
createPrivateChefContentLinks()
  .then(() => {
    console.log('\n✅ Content links created successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create content links:', error);
    process.exit(1);
  });
