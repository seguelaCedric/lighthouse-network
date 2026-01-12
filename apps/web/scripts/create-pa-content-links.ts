/**
 * Create Internal Content Links for PA Content Cluster
 *
 * This script creates bidirectional links between all PA blog posts to build
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

// PA Blog Posts (from database query)
const paPosts = {
  // Candidate-focused
  careerPath: {
    id: '33c93027-6653-408d-9c3b-12117e55f6ff',
    title: 'Complete personal assistant career path guide for 2026 growth',
    slug: 'complete-personal-assistant-career-path-guide-for-2026-growth',
    contentType: 'career_path',
    audience: 'candidate',
  },
  positionOverview1: {
    id: '837922d4-af7b-4b38-b0ab-bb804143c3d3',
    title: 'Complete Personal Assistant Job Description Guide for 2026',
    slug: 'complete-personal-assistant-job-description-guide-for-2026',
    contentType: 'position_overview',
    audience: 'candidate',
  },
  positionOverview2: {
    id: 'f2da90cc-a036-4304-8b79-9c5adc591960',
    title: 'Personal Assistant Career Guide: Roles, Skills, and Expectations',
    slug: 'personal-assistant-career-guide-skills-expectations',
    contentType: 'position_overview',
    audience: 'candidate',
  },
  skillsRequired: {
    id: '9bb67e52-5f7a-4ae0-8025-b7e3329eb282',
    title: 'Essential Personal Assistant Skills Required: Complete 2026 Guide',
    slug: 'essential-personal-assistant-skills-required-complete-2026-guide',
    contentType: 'skills_required',
    audience: 'candidate',
  },

  // Employer-focused
  hiringGuide: {
    id: '7b9e2c75-f21a-43c4-8a4d-fc0be0d2aa96',
    title: 'Complete Guide: How to Hire a Personal Assistant in 2026',
    slug: 'complete-guide-how-to-hire-a-personal-assistant-in-2026',
    contentType: 'hiring_guide',
    audience: 'employer',
  },
  hiringGuideNY: {
    id: '0712560b-5760-44d0-b2e1-45e5e6b93ae1',
    title: 'Hiring a Personal Assistant in New York: Executive Guide',
    slug: 'hiring-personal-assistant-new-york-executives',
    contentType: 'hiring_guide',
    audience: 'employer',
  },
  interviewQuestions: {
    id: '67022c6c-a07c-4605-ab66-f2369fed977f',
    title: '25+ Essential Personal Assistant Interview Questions for Success',
    slug: '25-essential-personal-assistant-interview-questions-for-success',
    contentType: 'interview_questions',
    audience: 'employer',
  },
  onboardingGuide: {
    id: 'cc808fe9-63f1-4e53-811a-51b61f9b6e89',
    title: 'How to Onboard a Personal Assistant: Complete 2026 Guide',
    slug: 'how-to-onboard-a-personal-assistant-complete-2026-guide',
    contentType: 'onboarding_guide',
    audience: 'employer',
  },
  whatToLookFor: {
    id: 'b953f405-0208-4fc9-af7a-4ae765c149d5',
    title: 'What to Look for When Hiring a Personal Assistant: Complete Guide',
    slug: 'what-to-look-for-when-hiring-a-personal-assistant-complete-guide',
    contentType: 'what_to_look_for',
    audience: 'employer',
  },

  // Both audiences
  salaryGuide1: {
    id: '65f1821e-459d-4443-b1cd-afc994f6e8a9',
    title: 'Personal Assistant Salary 2026: Complete Compensation Guide',
    slug: 'personal-assistant-salary-2026-complete-compensation-guide',
    contentType: 'salary_guide',
    audience: 'both',
  },
  salaryGuide2: {
    id: '69ece856-be04-47dc-9e4e-6e26351ce5f6',
    title: 'Personal Assistant Salaries in US Major Cities: Complete Guide',
    slug: 'personal-assistant-salaries-us-cities-guide',
    contentType: 'salary_guide',
    audience: 'both',
  },
};

// Define content links (from post → to related posts)
const contentLinks = [
  // Interview Questions → Related employer content
  {
    fromPost: paPosts.interviewQuestions,
    toPost: paPosts.hiringGuide,
    description: 'Learn the complete PA hiring process from job posting to onboarding',
    priority: 100,
  },
  {
    fromPost: paPosts.interviewQuestions,
    toPost: paPosts.whatToLookFor,
    description: 'Discover key qualities and red flags to watch for in PA candidates',
    priority: 90,
  },
  {
    fromPost: paPosts.interviewQuestions,
    toPost: paPosts.salaryGuide1,
    description: 'Understand 2026 PA salary ranges to make competitive offers',
    priority: 80,
  },

  // Hiring Guide → Related employer content
  {
    fromPost: paPosts.hiringGuide,
    toPost: paPosts.interviewQuestions,
    description: 'Review essential interview questions to evaluate PA candidates',
    priority: 100,
  },
  {
    fromPost: paPosts.hiringGuide,
    toPost: paPosts.whatToLookFor,
    description: 'Identify must-have skills and traits for your ideal PA',
    priority: 90,
  },
  {
    fromPost: paPosts.hiringGuide,
    toPost: paPosts.onboardingGuide,
    description: 'Set your new PA up for success with effective onboarding',
    priority: 85,
  },
  {
    fromPost: paPosts.hiringGuide,
    toPost: paPosts.salaryGuide1,
    description: 'Benchmark PA salaries to attract top talent',
    priority: 80,
  },

  // What to Look For → Related employer content
  {
    fromPost: paPosts.whatToLookFor,
    toPost: paPosts.hiringGuide,
    description: 'Follow the complete PA hiring process step-by-step',
    priority: 100,
  },
  {
    fromPost: paPosts.whatToLookFor,
    toPost: paPosts.interviewQuestions,
    description: 'Ask the right questions to assess these key PA traits',
    priority: 90,
  },
  {
    fromPost: paPosts.whatToLookFor,
    toPost: paPosts.skillsRequired,
    description: 'See the full breakdown of essential PA skills',
    priority: 80,
  },

  // Onboarding Guide → Related employer content
  {
    fromPost: paPosts.onboardingGuide,
    toPost: paPosts.hiringGuide,
    description: 'Review the complete hiring process before onboarding',
    priority: 90,
  },
  {
    fromPost: paPosts.onboardingGuide,
    toPost: paPosts.whatToLookFor,
    description: 'Understand what makes a great PA to guide your onboarding',
    priority: 85,
  },

  // Position Overview → Related candidate content
  {
    fromPost: paPosts.positionOverview1,
    toPost: paPosts.skillsRequired,
    description: 'Master the essential skills needed for PA success',
    priority: 100,
  },
  {
    fromPost: paPosts.positionOverview1,
    toPost: paPosts.careerPath,
    description: 'Explore PA career progression from junior to executive level',
    priority: 90,
  },
  {
    fromPost: paPosts.positionOverview1,
    toPost: paPosts.salaryGuide1,
    description: 'Research PA salary ranges for your experience level',
    priority: 80,
  },

  // Skills Required → Related candidate content
  {
    fromPost: paPosts.skillsRequired,
    toPost: paPosts.positionOverview1,
    description: 'Learn how these skills fit into the day-to-day PA role',
    priority: 100,
  },
  {
    fromPost: paPosts.skillsRequired,
    toPost: paPosts.careerPath,
    description: 'See how skill development drives PA career progression',
    priority: 90,
  },
  {
    fromPost: paPosts.skillsRequired,
    toPost: paPosts.interviewQuestions,
    description: 'Prepare to demonstrate these skills in PA interviews',
    priority: 80,
  },

  // Career Path → Related candidate content
  {
    fromPost: paPosts.careerPath,
    toPost: paPosts.skillsRequired,
    description: 'Identify skills you need to develop at each career stage',
    priority: 100,
  },
  {
    fromPost: paPosts.careerPath,
    toPost: paPosts.positionOverview1,
    description: 'Understand the full scope of PA responsibilities',
    priority: 90,
  },
  {
    fromPost: paPosts.careerPath,
    toPost: paPosts.salaryGuide1,
    description: 'Track salary expectations as you advance your PA career',
    priority: 80,
  },

  // Salary Guide 1 → Related content (both audiences)
  {
    fromPost: paPosts.salaryGuide1,
    toPost: paPosts.hiringGuide,
    description: 'Learn how to hire a PA at market-competitive rates',
    priority: 90,
  },
  {
    fromPost: paPosts.salaryGuide1,
    toPost: paPosts.careerPath,
    description: 'Understand how salary grows with career progression',
    priority: 85,
  },
  {
    fromPost: paPosts.salaryGuide1,
    toPost: paPosts.skillsRequired,
    description: 'See which skills command higher PA salaries',
    priority: 80,
  },
];

async function createPAContentLinks() {
  console.log('\n🔗 Creating Internal Content Links for PA Content Cluster\n');
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
  console.log('\n📊 PA Content Cluster Status:');
  console.log('✅ 11 blog posts published');
  console.log(`✅ ${contentLinks.length} internal content links created`);
  console.log('✅ Blog-to-blog navigation enabled');
  console.log('✅ User journey: Discovery → Education (2-3 articles) → Conversion');
  console.log('\n💡 Next Steps:');
  console.log('1. Test navigation flow by visiting any PA blog post');
  console.log('2. Verify "Continue Reading" section appears with related links');
  console.log('3. Check FloatingCTA appears based on target_audience');
  console.log('4. Monitor user engagement (time on site, articles per session)');
  console.log('5. Replicate this cluster strategy for other positions');
}

// Run the creation
createPAContentLinks()
  .then(() => {
    console.log('\n✅ Content links created successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create content links:', error);
    process.exit(1);
  });
