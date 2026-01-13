/**
 * Generate Estate Manager Content Cluster (8 pieces)
 *
 * Estate Manager is a senior household management position overseeing multiple properties.
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

const estateManagerContentCluster = [
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'Estate Manager',
    location: '',
    primaryKeyword: 'estate manager interview questions',
    targetWordCount: 2000,
    customInstructions: `Comprehensive guide to estate manager interview questions. Include:
- 25-30 essential questions organized by competency
- Questions about multi-property management, large staff oversight, budget administration ($500K+)
- Vendor management, capital projects, and renovation oversight questions
- Crisis management and emergency protocols
- Technology systems (property management software, security integration)
- Questions about principal communication and family office coordination
- Red flags vs. strong response indicators`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Estate Manager',
    location: '',
    primaryKeyword: 'how to hire an estate manager',
    targetWordCount: 1800,
    customInstructions: `Comprehensive guide to hiring an estate manager. Cover:
- Estate Manager vs. House Manager vs. Property Manager distinctions
- When you need an estate manager (multiple properties, large staff, complex operations)
- Essential qualifications (hospitality management, facility management, MBA)
- Where to find candidates (agencies, hospitality networks, family office referrals)
- Salary expectations and compensation structures
- Interview and assessment process
- Background checks and reference verification
- Common hiring mistakes to avoid`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Estate Manager',
    location: '',
    primaryKeyword: 'estate manager salary 2026',
    targetWordCount: 2000,
    customInstructions: `Comprehensive estate manager salary guide for 2026. Include:
- Salary ranges by experience ($120K-$300K+ base)
- Regional variations (US, UK, Middle East, Europe)
- Factors affecting salary (portfolio size, staff count, budget responsibility)
- Benefits packages (housing, vehicles, bonuses, profit sharing)
- Single estate vs. multi-property portfolio compensation
- Family office integration impact on compensation
- Performance bonus structures`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Estate Manager',
    location: '',
    primaryKeyword: 'what to look for when hiring an estate manager',
    targetWordCount: 1500,
    customInstructions: `Practical guide on what to look for when hiring an estate manager:
- Essential skills (multi-property oversight, staff leadership, budget management)
- Background indicators (hospitality management, military logistics, corporate facilities)
- Technical competencies (property management systems, project management, vendor negotiation)
- Red flags during hiring
- Green flags indicating exceptional candidates
- Assessing cultural fit with family and family office`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Estate Manager',
    location: '',
    primaryKeyword: 'how to onboard an estate manager',
    targetWordCount: 1500,
    customInstructions: `Onboarding guide for estate managers:
- First 90 days timeline
- Property portfolio introduction and walkthroughs
- Staff introductions and organizational structure
- Budget and financial systems handover
- Vendor and contractor relationship transfers
- Family office coordination protocols
- Setting expectations and KPIs
- Common onboarding mistakes to avoid`,
  },
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Estate Manager',
    location: '',
    primaryKeyword: 'estate manager job description',
    targetWordCount: 1800,
    customInstructions: `Comprehensive overview of the estate manager role for candidates:
- Detailed job description and responsibilities
- Day-to-day activities across multiple properties
- Types of estate manager positions (single estate, portfolio, family office)
- Work environment and lifestyle considerations
- Career satisfaction factors
- Challenges and rewards
- Is this career right for you?`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Estate Manager',
    location: '',
    primaryKeyword: 'estate manager career path',
    targetWordCount: 1800,
    customInstructions: `Career development guide for estate managers:
- Entry points (house manager, hospitality, military, corporate facilities)
- House Manager → Estate Manager → Director of Residences progression
- Relevant certifications (CFM, hospitality management, project management)
- Building your portfolio and reputation
- International opportunities
- Salary progression expectations
- Family office career paths`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Estate Manager',
    location: '',
    primaryKeyword: 'estate manager skills required',
    targetWordCount: 1800,
    customInstructions: `Comprehensive skills breakdown for estate managers:
- Leadership and staff management (10-50+ staff)
- Financial skills (budgeting $500K-$5M+, forecasting, vendor negotiation)
- Technical skills (property management systems, security, building systems)
- Project management (renovations, capital improvements)
- Communication skills (principals, family office, staff, vendors)
- How to develop each skill
- Demonstrating skills in interviews`,
  },
];

async function generateEstateManagerCluster() {
  console.log('\n🚀 Generating Estate Manager Content Cluster (8 pieces)\n');

  const generatedPosts: any[] = [];

  for (let i = 0; i < estateManagerContentCluster.length; i++) {
    const params = estateManagerContentCluster[i];
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

  console.log('\n🎉 Success! Generated 8 Estate Manager blog posts.');
}

generateEstateManagerCluster().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
