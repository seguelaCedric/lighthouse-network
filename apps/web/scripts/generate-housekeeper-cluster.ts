/**
 * Generate Housekeeper Content Cluster (8 pieces)
 *
 * Housekeeper/Head Housekeeper is a core household staff position.
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

const housekeeperContentCluster = [
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'Housekeeper',
    location: '',
    primaryKeyword: 'housekeeper interview questions',
    targetWordCount: 2000,
    customInstructions: `Comprehensive guide to housekeeper interview questions for employers. Include:
- 25-30 essential questions organized by competency
- Questions about cleaning techniques, organization, and attention to detail
- Experience with fine fabrics, antiques, and luxury materials
- Laundry and garment care expertise
- Questions about discretion and privacy
- Inventory management and supply ordering
- Schedule flexibility and live-in arrangements
- Red flags vs. strong response indicators
- Questions for Head Housekeeper candidates about staff supervision`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Housekeeper',
    location: '',
    primaryKeyword: 'how to hire a housekeeper',
    targetWordCount: 1800,
    customInstructions: `Comprehensive guide to hiring a housekeeper. Cover:
- Housekeeper vs. cleaning service vs. maid distinctions
- Head Housekeeper vs. Housekeeper roles
- When you need a private housekeeper
- Essential qualifications and experience
- Where to find candidates (agencies, referrals)
- Legal considerations (taxes, contracts, insurance)
- Salary expectations and benefits
- Trial periods and assessment
- Background checks and reference verification
- Common hiring mistakes to avoid`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Housekeeper',
    location: '',
    primaryKeyword: 'housekeeper salary 2026',
    targetWordCount: 2000,
    customInstructions: `Comprehensive housekeeper salary guide for 2026. Include:
- Salary ranges for Housekeeper vs. Head Housekeeper
- Regional variations (US, UK, Europe, Middle East)
- Live-in vs. live-out compensation differences
- Factors affecting salary (property size, staff supervised, specialized skills)
- Benefits packages (housing, health insurance, uniforms)
- Overtime and travel compensation
- Holiday and bonus expectations
- Career progression impact on salary`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Housekeeper',
    location: '',
    primaryKeyword: 'what to look for when hiring a housekeeper',
    targetWordCount: 1500,
    customInstructions: `Practical guide on what to look for when hiring a housekeeper:
- Essential skills (cleaning expertise, organization, attention to detail)
- Experience with luxury homes and fine materials
- Red flags during hiring
- Green flags indicating exceptional candidates
- Assessing discretion and trustworthiness
- Technical skills (laundry, silver polishing, delicate fabrics)
- Physical requirements and stamina
- Trial day assessment tips`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Housekeeper',
    location: '',
    primaryKeyword: 'how to onboard a housekeeper',
    targetWordCount: 1500,
    customInstructions: `Onboarding guide for employers who have hired a housekeeper:
- First day/week/month timeline
- Property walkthrough and inventory
- Cleaning standards and preferences documentation
- Product and supply preferences
- Schedule and routine establishment
- Access and security protocols
- Communication expectations
- Building trust in the first 90 days
- Common onboarding mistakes to avoid`,
  },
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Housekeeper',
    location: '',
    primaryKeyword: 'housekeeper job description',
    targetWordCount: 1800,
    customInstructions: `Comprehensive overview of the housekeeper role for candidates:
- Detailed job description and responsibilities
- Day-to-day activities and routines
- Types of positions (full-time, part-time, live-in, Head Housekeeper)
- Work environment in private households
- Career satisfaction factors
- Challenges and rewards
- Is this career right for you?
- Private housekeeper vs. hotel/commercial housekeeping`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Housekeeper',
    location: '',
    primaryKeyword: 'housekeeper career path',
    targetWordCount: 1800,
    customInstructions: `Career development guide for housekeepers:
- Entry points into private household work
- Housekeeper → Head Housekeeper → House Manager progression
- Specializations (laundress, wardrobe management)
- Relevant training and certifications
- Building your reputation and references
- International opportunities
- Transitioning to estate management roles
- Salary progression expectations`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Housekeeper',
    location: '',
    primaryKeyword: 'housekeeper skills required',
    targetWordCount: 1800,
    customInstructions: `Comprehensive skills breakdown for housekeepers:
- Cleaning techniques and best practices
- Fine fabric and garment care
- Silver, crystal, and antique care
- Organization and inventory management
- Discretion and confidentiality
- Time management and efficiency
- Physical stamina and attention to detail
- Communication with household staff
- How to develop each skill
- Demonstrating skills in interviews`,
  },
];

async function generateHousekeeperCluster() {
  console.log('\n🚀 Generating Housekeeper Content Cluster (8 pieces)\n');

  const generatedPosts: any[] = [];

  for (let i = 0; i < housekeeperContentCluster.length; i++) {
    const params = housekeeperContentCluster[i];
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

  console.log('\n🎉 Success! Generated 8 Housekeeper blog posts.');
}

generateHousekeeperCluster().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
