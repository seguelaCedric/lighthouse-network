/**
 * Create Internal Content Links for Butler Content Cluster
 *
 * This script creates bidirectional links between all Butler blog posts to build
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

// Butler Blog Posts (from database query)
const butlerPosts = {
  // Candidate-focused
  careerPath: {
    id: 'd67f9b6c-abe3-4b8a-b9c1-5396e1d8d333',
    title: 'The Complete Butler Career Path: Your Guide to Excellence',
    slug: 'the-complete-butler-career-path-your-guide-to-excellence',
    contentType: 'career_path',
    audience: 'candidate',
  },
  positionOverview: {
    id: 'bd8e0e09-1483-4f75-906c-453e2daab81d',
    title: 'The Complete Butler Job Description: Your Guide to Excellence',
    slug: 'the-complete-butler-job-description-your-guide-to-excellence',
    contentType: 'position_overview',
    audience: 'candidate',
  },
  skillsRequired: {
    id: '031d19bf-110c-4573-89f2-ec5c2aafd246',
    title: 'Butler Skills Required: Essential Qualifications Guide for 2026',
    slug: 'butler-skills-required-essential-qualifications-guide-for-2026',
    contentType: 'skills_required',
    audience: 'candidate',
  },

  // Employer-focused
  hiringGuide: {
    id: '19accbee-9238-4f37-ba3e-e85571ed00ab',
    title: 'How to Hire a Butler: Complete Guide for Discerning Employers',
    slug: 'how-to-hire-a-butler-complete-guide-for-discerning-employers',
    contentType: 'hiring_guide',
    audience: 'employer',
  },
  interviewQuestions: {
    id: '6e4f84bb-3399-4e9a-ab9e-6afb72f5258b',
    title: 'Essential Butler Interview Questions for Hiring Excellence in 2026',
    slug: 'essential-butler-interview-questions-for-hiring-excellence-in-2026',
    contentType: 'interview_questions',
    audience: 'employer',
  },
  onboardingGuide: {
    id: '17eb6d4f-06a8-421a-97e4-8a49f527afbd',
    title: 'How to Onboard a Butler: Your Complete Guide to Success',
    slug: 'how-to-onboard-a-butler-your-complete-guide-to-success',
    contentType: 'onboarding_guide',
    audience: 'employer',
  },
  whatToLookFor: {
    id: '9c5065b9-136c-4d4f-bfba-3caff83056f0',
    title: 'What to Look for When Hiring a Butler: The Complete 2026 Guide',
    slug: 'what-to-look-for-when-hiring-a-butler-the-complete-2026-guide',
    contentType: 'what_to_look_for',
    audience: 'employer',
  },

  // Both audiences
  salaryGuide: {
    id: 'd0f0fd47-2b67-4167-9326-8d50ecbfe59a',
    title: 'Butler Salary 2026: Complete Guide to Private Service Pay Rates',
    slug: 'butler-salary-2026-complete-guide-to-private-service-pay-rates',
    contentType: 'salary_guide',
    audience: 'both',
  },
};

// Define content links (from post → to related posts)
const contentLinks = [
  // Interview Questions → Related employer content
  {
    fromPost: butlerPosts.interviewQuestions,
    toPost: butlerPosts.hiringGuide,
    description: 'Learn the complete butler hiring process from job posting to onboarding',
    priority: 100,
  },
  {
    fromPost: butlerPosts.interviewQuestions,
    toPost: butlerPosts.whatToLookFor,
    description: 'Discover key qualities and red flags to watch for in butler candidates',
    priority: 90,
  },
  {
    fromPost: butlerPosts.interviewQuestions,
    toPost: butlerPosts.salaryGuide,
    description: 'Understand 2026 butler salary ranges to make competitive offers',
    priority: 80,
  },

  // Hiring Guide → Related employer content
  {
    fromPost: butlerPosts.hiringGuide,
    toPost: butlerPosts.interviewQuestions,
    description: 'Review essential interview questions to evaluate butler candidates',
    priority: 100,
  },
  {
    fromPost: butlerPosts.hiringGuide,
    toPost: butlerPosts.whatToLookFor,
    description: 'Identify must-have skills and traits for your ideal butler',
    priority: 90,
  },
  {
    fromPost: butlerPosts.hiringGuide,
    toPost: butlerPosts.onboardingGuide,
    description: 'Set your new butler up for success with effective onboarding',
    priority: 85,
  },
  {
    fromPost: butlerPosts.hiringGuide,
    toPost: butlerPosts.salaryGuide,
    description: 'Benchmark butler salaries to attract top talent',
    priority: 80,
  },

  // What to Look For → Related employer content
  {
    fromPost: butlerPosts.whatToLookFor,
    toPost: butlerPosts.hiringGuide,
    description: 'Follow the complete butler hiring process step-by-step',
    priority: 100,
  },
  {
    fromPost: butlerPosts.whatToLookFor,
    toPost: butlerPosts.interviewQuestions,
    description: 'Ask the right questions to assess these key butler traits',
    priority: 90,
  },
  {
    fromPost: butlerPosts.whatToLookFor,
    toPost: butlerPosts.skillsRequired,
    description: 'See the full breakdown of essential butler skills',
    priority: 80,
  },

  // Onboarding Guide → Related employer content
  {
    fromPost: butlerPosts.onboardingGuide,
    toPost: butlerPosts.hiringGuide,
    description: 'Review the complete hiring process before onboarding',
    priority: 90,
  },
  {
    fromPost: butlerPosts.onboardingGuide,
    toPost: butlerPosts.whatToLookFor,
    description: 'Understand what makes a great butler to guide your onboarding',
    priority: 85,
  },

  // Position Overview → Related candidate content
  {
    fromPost: butlerPosts.positionOverview,
    toPost: butlerPosts.skillsRequired,
    description: 'Master the essential skills needed for butler success',
    priority: 100,
  },
  {
    fromPost: butlerPosts.positionOverview,
    toPost: butlerPosts.careerPath,
    description: 'Explore butler career progression from junior to head butler',
    priority: 90,
  },
  {
    fromPost: butlerPosts.positionOverview,
    toPost: butlerPosts.salaryGuide,
    description: 'Research butler salary ranges for your experience level',
    priority: 80,
  },

  // Skills Required → Related candidate content
  {
    fromPost: butlerPosts.skillsRequired,
    toPost: butlerPosts.positionOverview,
    description: 'Learn how these skills fit into the day-to-day butler role',
    priority: 100,
  },
  {
    fromPost: butlerPosts.skillsRequired,
    toPost: butlerPosts.careerPath,
    description: 'See how skill development drives butler career progression',
    priority: 90,
  },
  {
    fromPost: butlerPosts.skillsRequired,
    toPost: butlerPosts.interviewQuestions,
    description: 'Prepare to demonstrate these skills in butler interviews',
    priority: 80,
  },

  // Career Path → Related candidate content
  {
    fromPost: butlerPosts.careerPath,
    toPost: butlerPosts.skillsRequired,
    description: 'Identify skills you need to develop at each career stage',
    priority: 100,
  },
  {
    fromPost: butlerPosts.careerPath,
    toPost: butlerPosts.positionOverview,
    description: 'Understand the full scope of butler responsibilities',
    priority: 90,
  },
  {
    fromPost: butlerPosts.careerPath,
    toPost: butlerPosts.salaryGuide,
    description: 'Track salary expectations as you advance your butler career',
    priority: 80,
  },

  // Salary Guide → Related content (both audiences)
  {
    fromPost: butlerPosts.salaryGuide,
    toPost: butlerPosts.hiringGuide,
    description: 'Learn how to hire a butler at market-competitive rates',
    priority: 90,
  },
  {
    fromPost: butlerPosts.salaryGuide,
    toPost: butlerPosts.careerPath,
    description: 'Understand how salary grows with butler career progression',
    priority: 85,
  },
  {
    fromPost: butlerPosts.salaryGuide,
    toPost: butlerPosts.skillsRequired,
    description: 'See which skills command higher butler salaries',
    priority: 80,
  },
];

async function createButlerContentLinks() {
  console.log('\n🔗 Creating Internal Content Links for Butler Content Cluster\n');
  console.log(`📊 Total links to create: ${contentLinks.length}\n`);

  for (let i = 0; i < contentLinks.length; i++) {
    const link = contentLinks[i];
    const linkNum = i + 1;

    try {
      const { error } = await supabase
        .from('seo_content_links')
        .insert({
          blog_post_id: link.fromPost.id,
          target_blog_post_id: link.toPost.id,
          title: link.toPost.title,
          url: `/blog/${link.toPost.slug}`,
          description: link.description,
          content_type: link.toPost.contentType,
          priority: link.priority,
          is_active: true,
        });

      if (error) {
        console.error(`❌ Error creating link ${linkNum}:`, error);
        throw error;
      }

      console.log(`✅ Link ${linkNum}/${contentLinks.length}: ${link.fromPost.contentType} → ${link.toPost.contentType}`);
    } catch (error) {
      console.error(`❌ Error creating link ${linkNum}:`, error);
      throw error;
    }
  }

  console.log('\n\n🎉 Success! Created all internal content links.');
  console.log('\n📊 Butler Content Cluster Status:');
  console.log('✅ 8 blog posts generated');
  console.log(`✅ ${contentLinks.length} internal content links created`);
  console.log('✅ Blog-to-blog navigation enabled');
  console.log('✅ User journey: Discovery → Education (2-3 articles) → Conversion');
  console.log('\n💡 Next Steps:');
  console.log('1. Publish all Butler blog posts (update status from draft to published)');
  console.log('2. Test navigation flow by visiting any Butler blog post');
  console.log('3. Verify "Learn More" section appears with related links');
  console.log('4. Replicate this cluster strategy for other positions');
}

// Run the creation
createButlerContentLinks()
  .then(() => {
    console.log('\n✅ Content links created successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create content links:', error);
    process.exit(1);
  });
