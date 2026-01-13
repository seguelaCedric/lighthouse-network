/**
 * Generate Governess Content Cluster (8 pieces)
 *
 * Governess is an educational childcare role combining teaching with childcare.
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

const governessContentCluster = [
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'Governess',
    location: '',
    primaryKeyword: 'governess interview questions',
    targetWordCount: 2000,
    customInstructions: `Comprehensive guide to governess interview questions for families. Include:
- 25-30 essential questions organized by competency
- Questions about educational philosophy, curriculum development, and teaching methodology
- Experience with different age groups and learning styles
- Language instruction and cultural education questions
- Questions about travel, international placements, and live-in arrangements
- Behavioral scenarios (learning difficulties, motivation challenges, sibling dynamics)
- Assessing academic credentials and teaching certifications
- Red flags vs. strong response indicators`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Governess',
    location: '',
    primaryKeyword: 'how to hire a governess',
    targetWordCount: 1800,
    customInstructions: `Comprehensive guide to hiring a governess. Cover:
- Governess vs. nanny vs. tutor distinctions
- When you need a governess (home education, international families, special educational needs)
- Essential qualifications (teaching credentials, degrees, language proficiency)
- Where to find candidates (specialist agencies, educational networks)
- Educational philosophy alignment
- Salary expectations and benefits packages
- Trial periods and assessment
- Background checks and credential verification
- Common hiring mistakes to avoid`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Governess',
    location: '',
    primaryKeyword: 'governess salary 2026',
    targetWordCount: 2000,
    customInstructions: `Comprehensive governess salary guide for 2026. Include:
- Salary ranges by qualifications and experience
- Regional variations (US, UK, Middle East, Europe, Asia)
- Live-in vs. live-out compensation differences
- Factors affecting salary (languages, subjects, credentials, travel)
- Benefits packages (housing, travel, professional development)
- International posting premiums
- Performance bonuses and educational achievement incentives
- Comparison with teaching salaries`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Governess',
    location: '',
    primaryKeyword: 'what to look for when hiring a governess',
    targetWordCount: 1500,
    customInstructions: `Practical guide on what to look for when hiring a governess:
- Essential qualifications (teaching degree, certifications, languages)
- Educational experience indicators
- Red flags during hiring
- Green flags indicating exceptional candidates
- Assessing teaching philosophy alignment
- Subject expertise evaluation
- Cultural fit with family values
- Observing teaching style during trial lessons`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Governess',
    location: '',
    primaryKeyword: 'how to onboard a governess',
    targetWordCount: 1500,
    customInstructions: `Onboarding guide for families who have hired a governess:
- First day/week/month timeline
- Educational goals and curriculum discussion
- Children's learning history and assessments
- Setting up learning spaces and materials
- Schedule and routine establishment
- Communication expectations with parents
- Progress reporting systems
- Building rapport with children
- Common onboarding mistakes to avoid`,
  },
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Governess',
    location: '',
    primaryKeyword: 'governess job description',
    targetWordCount: 1800,
    customInstructions: `Comprehensive overview of the governess role for candidates:
- Detailed job description and responsibilities
- Day-to-day activities and educational planning
- Types of governess positions (full-time, subject-specific, travel)
- Work environment in private households
- Career satisfaction factors
- Challenges and rewards
- Is this career right for you?
- Modern governess vs. traditional teaching roles`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Governess',
    location: '',
    primaryKeyword: 'governess career path',
    targetWordCount: 1800,
    customInstructions: `Career development guide for governesses:
- Entry points (teaching background, tutoring, nanny with educational focus)
- Junior Governess → Senior Governess → Educational Director progression
- Specializations (languages, STEM, arts, special needs)
- Relevant certifications and advanced degrees
- Building your reputation and references
- International opportunities
- Transitioning to educational consulting or school leadership
- Salary progression expectations`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Governess',
    location: '',
    primaryKeyword: 'governess skills required',
    targetWordCount: 1800,
    customInstructions: `Comprehensive skills breakdown for governesses:
- Teaching and curriculum development
- Subject matter expertise
- Child development knowledge
- Language proficiency (multiple languages valued)
- Patience and adaptability
- Communication with parents
- Assessment and progress tracking
- Educational technology
- How to develop each skill
- Demonstrating skills in interviews and trial lessons`,
  },
];

async function generateGovernessCluster() {
  console.log('\n🚀 Generating Governess Content Cluster (8 pieces)\n');

  const generatedPosts: any[] = [];

  for (let i = 0; i < governessContentCluster.length; i++) {
    const params = governessContentCluster[i];
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

  console.log('\n🎉 Success! Generated 8 Governess blog posts.');
}

generateGovernessCluster().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
