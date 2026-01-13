/**
 * Generate Nanny Content Cluster (8 pieces)
 *
 * Nanny is a high-demand childcare position in private households.
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

const nannyContentCluster = [
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'Nanny',
    location: '',
    primaryKeyword: 'nanny interview questions',
    targetWordCount: 2000,
    customInstructions: `Comprehensive guide to nanny interview questions for families. Include:
- 25-30 essential questions organized by competency
- Questions about childcare philosophy, discipline approaches, developmental milestones
- Safety and emergency protocol questions
- Experience with different age groups (infants, toddlers, school-age)
- Questions about schedule flexibility, travel, and live-in arrangements
- Behavioral scenarios (tantrums, sibling conflicts, medical emergencies)
- Cultural fit and family values alignment
- Red flags vs. strong response indicators`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Nanny',
    location: '',
    primaryKeyword: 'how to hire a nanny',
    targetWordCount: 1800,
    customInstructions: `Comprehensive guide to hiring a nanny. Cover:
- Nanny vs. au pair vs. babysitter vs. governess distinctions
- When you need a nanny (full-time, part-time, live-in, live-out)
- Essential qualifications and certifications (CPR, First Aid, early childhood education)
- Where to find candidates (agencies, referrals, online platforms)
- Legal considerations (taxes, contracts, insurance, work visas)
- Salary expectations and benefits packages
- Trial periods and probationary arrangements
- Background checks and reference verification
- Common hiring mistakes to avoid`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Nanny',
    location: '',
    primaryKeyword: 'nanny salary 2026',
    targetWordCount: 2000,
    customInstructions: `Comprehensive nanny salary guide for 2026. Include:
- Salary ranges by experience level and number of children
- Regional variations (US major cities, UK, Europe)
- Live-in vs. live-out compensation differences
- Factors affecting salary (qualifications, languages, special needs experience)
- Benefits packages (health insurance, paid time off, car allowance)
- Overtime and travel compensation
- Holiday and bonus expectations
- Nanny share arrangements and compensation`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Nanny',
    location: '',
    primaryKeyword: 'what to look for when hiring a nanny',
    targetWordCount: 1500,
    customInstructions: `Practical guide on what to look for when hiring a nanny:
- Essential skills (childcare experience, safety awareness, communication)
- Relevant certifications (CPR, First Aid, early childhood education)
- Experience indicators (age groups, special needs, multiples)
- Red flags during hiring (inconsistent employment, vague references)
- Green flags indicating exceptional candidates
- Assessing childcare philosophy alignment
- Observing candidate-child interaction during trial`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Nanny',
    location: '',
    primaryKeyword: 'how to onboard a nanny',
    targetWordCount: 1500,
    customInstructions: `Onboarding guide for families who have hired a nanny:
- First day/week/month timeline
- Introducing nanny to children gradually
- House rules and routines documentation
- Emergency contacts and medical information
- Communication expectations (daily updates, apps, check-ins)
- Building trust and rapport
- Setting boundaries (screen time, discipline, visitors)
- When to course-correct vs. give adjustment time
- Common onboarding mistakes to avoid`,
  },
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Nanny',
    location: '',
    primaryKeyword: 'nanny job description',
    targetWordCount: 1800,
    customInstructions: `Comprehensive overview of the nanny role for candidates:
- Detailed job description and responsibilities
- Day-to-day activities and routines
- Types of nanny positions (live-in, live-out, travel nanny, night nanny)
- Work environment and family dynamics
- Career satisfaction factors
- Challenges and rewards of the profession
- Is this career right for you?
- Professional nanny vs. casual babysitter distinction`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Nanny',
    location: '',
    primaryKeyword: 'nanny career path',
    targetWordCount: 1800,
    customInstructions: `Career development guide for nannies:
- Entry points into professional nannying
- Junior Nanny → Senior Nanny → Nanny Manager progression
- Specializations (newborn care, special needs, educational focus)
- Relevant certifications and training
- Building your reputation and references
- Transitioning to governess or household manager roles
- International opportunities and travel positions
- Salary progression expectations`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Nanny',
    location: '',
    primaryKeyword: 'nanny skills required',
    targetWordCount: 1800,
    customInstructions: `Comprehensive skills breakdown for nannies:
- Child development knowledge
- Safety and first aid skills
- Educational activity planning
- Communication skills (with children and parents)
- Patience and emotional regulation
- Organizational skills
- Cooking and nutrition for children
- Driving and transportation
- How to develop each skill
- Demonstrating skills in interviews and trials`,
  },
];

async function generateNannyCluster() {
  console.log('\n🚀 Generating Nanny Content Cluster (8 pieces)\n');

  const generatedPosts: any[] = [];

  for (let i = 0; i < nannyContentCluster.length; i++) {
    const params = nannyContentCluster[i];
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

  console.log('\n🎉 Success! Generated 8 Nanny blog posts.');
}

generateNannyCluster().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
