/**
 * Generate Chief Stewardess Content Cluster (8 pieces)
 *
 * Chief Stewardess leads the interior department on a yacht.
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const chiefStewContentCluster = [
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'Chief Stewardess',
    location: '',
    primaryKeyword: 'chief stewardess interview questions',
    targetWordCount: 2000,
    customInstructions: `Comprehensive guide to chief stewardess interview questions. Include:
- 25-30 essential questions organized by competency
- Questions about interior management, service standards, and housekeeping excellence
- Guest relations and VIP service experience
- Team leadership and stew training
- Budget management and inventory control
- Table service, flower arranging, and presentation skills
- Charter experience and guest preference management
- Red flags vs. strong response indicators`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Chief Stewardess',
    location: '',
    primaryKeyword: 'how to hire a chief stewardess',
    targetWordCount: 1800,
    customInstructions: `Comprehensive guide to hiring a chief stewardess. Cover:
- Understanding chief stew qualifications by yacht size
- Charter vs. private yacht requirements
- Where to find qualified candidates (crew agencies, day worker docks)
- Essential certifications (STCW, ENG1, food safety)
- Salary expectations by yacht size
- Interview and trial day process
- Reference verification
- Common hiring mistakes to avoid`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Chief Stewardess',
    location: '',
    primaryKeyword: 'chief stewardess salary 2026',
    targetWordCount: 2000,
    customInstructions: `Comprehensive chief stewardess salary guide for 2026. Include:
- Salary ranges by yacht size (30m, 40m, 50m, 60m+)
- Charter vs. private yacht compensation
- Regional variations (Med, Caribbean, US)
- Tip structures and charter bonuses
- Benefits packages
- Rotation positions
- Chief Stew/Purser combined roles
- Impact of experience and certifications`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Chief Stewardess',
    location: '',
    primaryKeyword: 'what to look for when hiring a chief stewardess',
    targetWordCount: 1500,
    customInstructions: `Practical guide on what to look for when hiring a chief stewardess:
- Essential qualifications and certifications
- Experience indicators (yacht sizes, charter seasons, guest types)
- Leadership and team management skills
- Service excellence and attention to detail
- Red flags during hiring
- Green flags indicating exceptional candidates
- Assessing fit with captain and existing crew
- Trial day assessment criteria`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Chief Stewardess',
    location: '',
    primaryKeyword: 'how to onboard a chief stewardess',
    targetWordCount: 1500,
    customInstructions: `Onboarding guide for chief stewardess:
- Handover with outgoing chief stew
- Vessel familiarization (cabins, storage, laundry, galley interface)
- Interior team introductions
- Owner/guest preferences documentation
- Inventory systems and provisioning
- Service standards and protocols
- Budget and expense tracking
- First 90 days milestones`,
  },
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Chief Stewardess',
    location: '',
    primaryKeyword: 'chief stewardess job description',
    targetWordCount: 1800,
    customInstructions: `Comprehensive overview of the chief stewardess role:
- Detailed job description and responsibilities
- Day-to-day activities during charter, private trips, and yard periods
- Types of positions (private, charter, rotation)
- Work environment and lifestyle
- Career satisfaction factors
- Challenges and rewards
- Is this career right for you?`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Chief Stewardess',
    location: '',
    primaryKeyword: 'chief stewardess career path',
    targetWordCount: 1800,
    customInstructions: `Career development guide for chief stewardesses:
- Entry points (3rd stew → 2nd stew → chief stew)
- Required certifications (STCW, wine courses, management)
- Yacht size progression
- Building reputation through charter seasons
- Specializations (purser, events, wine)
- Transitioning to shore-based roles
- Salary progression expectations`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Chief Stewardess',
    location: '',
    primaryKeyword: 'chief stewardess skills required',
    targetWordCount: 1800,
    customInstructions: `Comprehensive skills breakdown for chief stewardesses:
- Service excellence and hospitality
- Leadership and team management
- Housekeeping and laundry expertise
- Table service and presentation
- Guest relations and discretion
- Inventory and provisioning
- Budget management
- How to develop each skill
- Demonstrating skills in interviews`,
  },
];

async function generateChiefStewCluster() {
  console.log('\n🚀 Generating Chief Stewardess Content Cluster (8 pieces)\n');

  const generatedPosts: any[] = [];

  for (let i = 0; i < chiefStewContentCluster.length; i++) {
    const params = chiefStewContentCluster[i];
    console.log(`\n📝 Generating Post ${i + 1}/8: ${params.contentType.replace(/_/g, ' ').toUpperCase()}`);
    console.log(`   Keyword: "${params.primaryKeyword}"`);
    console.log('⏳ Generating...');

    const startTime = Date.now();
    const result = await generateBlogPost({
      contentType: params.contentType,
      targetAudience: params.targetAudience,
      position: params.position,
      location: params.location,
      primaryKeyword: params.primaryKeyword,
      targetWordCount: params.targetWordCount,
      relatedLandingPageUrls: [],
      customInstructions: params.customInstructions,
    });

    console.log(`✅ Generated in ${((Date.now() - startTime) / 1000).toFixed(1)}s - ${result.title}`);
    generatedPosts.push({ ...result, contentType: params.contentType, targetAudience: params.targetAudience, position: params.position, primaryKeyword: params.primaryKeyword });
  }

  console.log('\n💾 Inserting posts into database...\n');

  for (const post of generatedPosts) {
    const { data, error } = await supabase.from('blog_posts').insert({
      title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
      meta_title: post.metaTitle, meta_description: post.metaDescription, status: 'draft',
      content_type: post.contentType, target_audience: post.targetAudience, target_position: post.position,
      primary_keyword: post.primaryKeyword, target_keywords: post.targetKeywords,
      answer_capsule: post.answerCapsule, answer_capsule_question: post.answerCapsuleQuestion,
      key_facts: post.keyFacts, related_landing_page_urls: null,
    }).select().single();

    if (error) throw error;
    console.log(`✅ Inserted: ${post.title}`);
  }

  console.log('\n🎉 Success! Generated 8 Chief Stewardess blog posts.');
}

generateChiefStewCluster().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
