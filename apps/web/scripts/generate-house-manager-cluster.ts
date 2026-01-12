/**
 * Generate House Manager Content Cluster (8 pieces)
 *
 * This script generates a complete content cluster for House Manager positions:
 * Employer content: Interview Questions, Hiring Guide, Salary Guide, What to Look For, Onboarding Guide
 * Candidate content: Position Overview, Career Path, Skills Required
 *
 * Estimated cost: ~$4-6 using Claude Sonnet 4.5
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
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

// House Manager Content Cluster posts
const houseManagerContentCluster = [
  // Employer-focused content
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'House Manager',
    location: '',
    primaryKeyword: 'house manager interview questions',
    targetWordCount: 2000,
    customInstructions: `This is a comprehensive guide to house manager interview questions for employers. Include:
- 25-30 essential interview questions organized by competency
- Questions about household operations, staff management, budget oversight, and vendor coordination
- What to look for in strong responses vs. red flags
- Behavioral questions about managing multiple properties, crisis situations, and technology integration
- Technical questions about HVAC systems, security protocols, and household budgets
- Situational scenarios (property emergencies, staff conflicts, family events)
- Cultural fit and leadership assessment questions

Write in a professional tone for high-net-worth employers. Include sample strong responses for key questions.`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'House Manager',
    location: '',
    primaryKeyword: 'how to hire a house manager',
    targetWordCount: 1800,
    customInstructions: `This is a comprehensive guide to hiring a house manager. Cover:
- Understanding the house manager role vs. estate manager vs. butler
- When you need a house manager vs. other household staff
- Creating an effective job description
- Where to find qualified candidates (agencies, networks)
- Essential qualifications and experience levels
- Salary expectations and compensation packages
- The interview and selection process
- Reference checking and background verification
- Trial periods and probationary arrangements
- Common hiring mistakes to avoid

Write with authority for UHNW employers. Do NOT focus on specific locations.`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'House Manager',
    location: '',
    primaryKeyword: 'house manager salary 2026',
    targetWordCount: 2000,
    customInstructions: `This is a comprehensive house manager salary guide for 2026. Include:
- Salary ranges by experience level (junior house manager, senior house manager, multi-property manager)
- Regional variations (US, UK, Middle East, Europe, Asia)
- Factors affecting salary (property size, staff oversight, budget responsibility, technical skills)
- Live-in vs. live-out compensation differences
- Benefits packages (accommodations, vehicles, bonuses)
- Impact of certifications (hospitality management, facility management)
- Single property vs. multiple properties compensation
- Technology proficiency impact on salary

Provide specific salary ranges with regional context. Address both employer and candidate perspectives.`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'House Manager',
    location: '',
    primaryKeyword: 'what to look for when hiring a house manager',
    targetWordCount: 1500,
    customInstructions: `This is a practical guide on what to look for when hiring a house manager. Focus on:
- Essential skills and competencies (organization, leadership, technical knowledge, vendor management)
- Relevant background and certifications (hospitality management, facility management, property management)
- Experience indicators (property types managed, staff size, budget responsibility)
- Red flags during hiring (poor communication, lack of technical knowledge, inflexibility)
- Green flags that indicate exceptional candidates
- Assessing cultural fit with family lifestyle
- Technical competencies (smart home systems, security protocols, maintenance oversight)
- Soft skills (communication, problem-solving, discretion)

Write in a clear, actionable style for employers. Do NOT focus on locations.`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'House Manager',
    location: '',
    primaryKeyword: 'how to onboard a house manager',
    targetWordCount: 1500,
    customInstructions: `This is an onboarding guide for employers who have hired a house manager. Cover:
- First day/week/month onboarding timeline
- Essential information to share (family preferences, household routines, property systems)
- Property walkthrough and systems training (HVAC, security, smart home)
- Staff introductions and household hierarchy
- Budget and vendor relationship handover
- Setting expectations and success metrics
- Building trust and rapport in the first 90 days
- Common onboarding mistakes to avoid
- Technology and systems training
- When to course-correct vs. give adjustment time

Write supportively for employers to set their house manager up for success.`,
  },

  // Candidate-focused content
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'House Manager',
    location: '',
    primaryKeyword: 'house manager job description',
    targetWordCount: 1800,
    customInstructions: `This is a comprehensive overview of the house manager role for candidates. Include:
- Detailed job description and typical responsibilities
- Day-to-day activities and workflow
- Types of house manager positions (single property, multi-property, estate coordinator)
- Work environment and conditions
- Who you'll be working with/for
- Career satisfaction factors
- Challenges and rewards of the profession
- Is this career right for you? (self-assessment)
- Modern house manager vs. traditional household roles

Write informatively to help candidates understand if this career suits them.`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'House Manager',
    location: '',
    primaryKeyword: 'house manager career path',
    targetWordCount: 1800,
    customInstructions: `This is a career development guide for house managers. Cover:
- Entry points into house management (hospitality, property management, military backgrounds)
- Relevant certifications and training (hospitality management, facility management)
- Junior House Manager → Senior House Manager → Multi-Property Manager progression
- Lateral moves (estate management, property management, facilities management)
- Skills development at each career stage
- Building your reputation and network
- International opportunities and relocation
- Salary progression expectations
- Success stories and career trajectories
- Continuing education and specialization (technology, security, sustainability)

Make this aspirational and motivating while being realistic.`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'House Manager',
    location: '',
    primaryKeyword: 'house manager skills required',
    targetWordCount: 1800,
    customInstructions: `This is a comprehensive skills breakdown for house manager candidates. Include:
- Organizational and time management skills
- Technical skills (smart home systems, security, HVAC, maintenance oversight)
- Soft skills (communication, leadership, problem-solving, discretion)
- Management skills (staff supervision, vendor coordination, budget management)
- Specialized knowledge (property maintenance, technology integration, event coordination)
- Financial skills (budgeting, expense tracking, vendor negotiation)
- How to develop each skill
- Skills gap analysis
- Demonstrating these skills in interviews
- Continuing education resources

Make this practical and actionable with specific development strategies.`,
  },
];

interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  targetKeywords: string[];
  answerCapsule: string;
  answerCapsuleQuestion: string;
  keyFacts: string[];
  contentType: string;
  targetAudience: string;
  position: string;
  primaryKeyword: string;
}

async function generateHouseManagerCluster() {
  console.log('\n🚀 Generating House Manager Content Cluster (8 pieces)\n');
  console.log('📊 Estimated cost: ~$4-6 using Claude Sonnet 4.5\n');

  const generatedPosts: GeneratedPost[] = [];

  for (let i = 0; i < houseManagerContentCluster.length; i++) {
    const params = houseManagerContentCluster[i];
    const postNum = i + 1;
    const totalPosts = houseManagerContentCluster.length;

    console.log(`\n📝 Generating Post ${postNum}/${totalPosts}: ${params.contentType.replace(/_/g, ' ').toUpperCase()}`);
    console.log(`   Audience: ${params.targetAudience}`);
    console.log(`   Keyword: "${params.primaryKeyword}"`);
    console.log(`   Target words: ${params.targetWordCount}`);
    console.log('');
    console.log('⏳ Generating content with Claude Sonnet 4.5...');

    try {
      const startTime = Date.now();

      const result = await generateBlogPost({
        contentType: params.contentType,
        targetAudience: params.targetAudience,
        position: params.position,
        location: params.location,
        primaryKeyword: params.primaryKeyword,
        targetWordCount: params.targetWordCount,
        relatedLandingPageUrls: [], // NO landing page links - blog-to-blog only
        customInstructions: params.customInstructions,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`✅ Generated in ${duration}s`);
      console.log(`   Title: ${result.title}`);
      console.log(`   Slug: ${result.slug}`);
      console.log(`   Content length: ${result.content.length} chars (~${Math.round(result.content.split(' ').length)} words)`);
      console.log(`   Answer Capsule: ${result.answerCapsule ? '✅' : '❌'}`);
      console.log(`   Key Facts: ${result.keyFacts.length}`);

      generatedPosts.push({
        ...result,
        contentType: params.contentType,
        targetAudience: params.targetAudience,
        position: params.position,
        primaryKeyword: params.primaryKeyword,
      });
    } catch (error) {
      console.error(`❌ Error generating post ${postNum}:`, error);
      throw error;
    }
  }

  console.log('\n\n💾 Inserting generated posts into database...\n');

  for (let i = 0; i < generatedPosts.length; i++) {
    const post = generatedPosts[i];
    const postNum = i + 1;

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          meta_title: post.metaTitle,
          meta_description: post.metaDescription,
          status: 'draft', // Save as draft for review
          content_type: post.contentType,
          target_audience: post.targetAudience,
          target_position: post.position,
          primary_keyword: post.primaryKeyword,
          target_keywords: post.targetKeywords,
          answer_capsule: post.answerCapsule,
          answer_capsule_question: post.answerCapsuleQuestion,
          key_facts: post.keyFacts,
          related_landing_page_urls: null, // NO landing page links
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting post ${postNum}:`, error);
        throw error;
      }

      console.log(`✅ Inserted post ${postNum}: ${post.title}`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Preview: http://localhost:3004/blog/${post.slug}?preview=true`);
    } catch (error) {
      console.error(`❌ Error inserting post ${postNum}:`, error);
      throw error;
    }
  }

  console.log('\n\n🎉 Success! Generated and saved 8 House Manager blog posts.');
  console.log('\n📋 Next Steps:');
  console.log('1. Review all posts in preview mode');
  console.log('2. Run create-house-manager-content-links.ts to interconnect all 8 posts');
  console.log('3. Publish the content cluster');
  console.log('4. Replicate for Private Chef and yacht crew positions');
}

// Run the generation
generateHouseManagerCluster()
  .then(() => {
    console.log('\n✅ Generation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Generation failed:', error);
    process.exit(1);
  });
