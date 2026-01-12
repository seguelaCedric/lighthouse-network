/**
 * Generate Private Chef Content Cluster (8 pieces)
 *
 * This script generates a complete content cluster for Private Chef positions:
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

// Private Chef Content Cluster posts
const privateChefContentCluster = [
  // Employer-focused content
  {
    contentType: 'interview_questions' as const,
    targetAudience: 'employer' as const,
    position: 'Private Chef',
    location: '',
    primaryKeyword: 'private chef interview questions',
    targetWordCount: 2000,
    customInstructions: `This is a comprehensive guide to private chef interview questions for employers. Include:
- 25-30 essential interview questions organized by competency
- Questions about culinary skills, dietary accommodation, menu planning, and kitchen management
- What to look for in strong responses vs. red flags
- Behavioral questions about handling special dietary requirements, kitchen staff management, and event catering
- Technical questions about food safety, culinary techniques, and kitchen equipment
- Situational scenarios (allergies, last-minute guest additions, dietary restrictions)
- Cultural fit and lifestyle assessment questions (travel, live-in arrangements, family preferences)

Write in a professional tone for high-net-worth employers. Include sample strong responses for key questions.`,
  },
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Private Chef',
    location: '',
    primaryKeyword: 'how to hire a private chef',
    targetWordCount: 1800,
    customInstructions: `This is a comprehensive guide to hiring a private chef. Cover:
- Understanding the private chef role vs. personal cook vs. catering chef
- When you need a private chef vs. other culinary staff
- Creating an effective job description
- Where to find qualified candidates (agencies, culinary schools, networks)
- Essential qualifications and experience levels
- Salary expectations and compensation packages
- The interview and tasting process
- Reference checking and background verification
- Trial periods and probationary arrangements
- Common hiring mistakes to avoid

Write with authority for UHNW employers. Do NOT focus on specific locations.`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Private Chef',
    location: '',
    primaryKeyword: 'private chef salary 2026',
    targetWordCount: 2000,
    customInstructions: `This is a comprehensive private chef salary guide for 2026. Include:
- Salary ranges by experience level (junior chef, private chef, executive private chef)
- Regional variations (US, UK, Middle East, Europe, Asia)
- Factors affecting salary (household size, entertainment frequency, dietary complexity, travel requirements)
- Live-in vs. live-out compensation differences
- Benefits packages (accommodations, travel, bonuses, equipment allowances)
- Impact of culinary credentials (Michelin background, culinary school, certifications)
- Single household vs. multiple properties compensation
- Event and entertainment bonus structures

Provide specific salary ranges with regional context. Address both employer and candidate perspectives.`,
  },
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Private Chef',
    location: '',
    primaryKeyword: 'what to look for when hiring a private chef',
    targetWordCount: 1500,
    customInstructions: `This is a practical guide on what to look for when hiring a private chef. Focus on:
- Essential skills and competencies (culinary technique, menu planning, dietary knowledge, presentation)
- Relevant background and credentials (culinary schools, restaurant experience, private service)
- Experience indicators (types of households, dietary accommodations, event cooking)
- Red flags during hiring (poor food safety, inflexibility with menus, ego issues)
- Green flags that indicate exceptional candidates
- Assessing cultural fit with family lifestyle and dietary preferences
- Technical competencies (cuisine specialties, baking, pastry, international cuisines)
- Soft skills (adaptability, communication, discretion, organization)

Write in a clear, actionable style for employers. Do NOT focus on locations.`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Private Chef',
    location: '',
    primaryKeyword: 'how to onboard a private chef',
    targetWordCount: 1500,
    customInstructions: `This is an onboarding guide for employers who have hired a private chef. Cover:
- First day/week/month onboarding timeline
- Essential information to share (dietary preferences, allergies, entertaining schedule)
- Kitchen walkthrough and equipment orientation
- Grocery sourcing and vendor relationships
- Family preferences and mealtime routines
- Setting expectations for meal planning and communication
- Building rapport in the first 90 days
- Common onboarding mistakes to avoid
- Budget discussions and expense tracking
- When to course-correct vs. give adjustment time

Write supportively for employers to set their private chef up for success.`,
  },

  // Candidate-focused content
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Private Chef',
    location: '',
    primaryKeyword: 'private chef job description',
    targetWordCount: 1800,
    customInstructions: `This is a comprehensive overview of the private chef role for candidates. Include:
- Detailed job description and typical responsibilities
- Day-to-day activities and workflow
- Types of private chef positions (family chef, estate chef, traveling chef, yacht chef)
- Work environment and conditions
- Who you'll be working with/for
- Career satisfaction factors
- Challenges and rewards of the profession
- Is this career right for you? (self-assessment)
- Private chef vs. restaurant chef lifestyle comparison

Write informatively to help candidates understand if this career suits them.`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Private Chef',
    location: '',
    primaryKeyword: 'private chef career path',
    targetWordCount: 1800,
    customInstructions: `This is a career development guide for private chefs. Cover:
- Entry points into private chef work (restaurant backgrounds, culinary school, personal cooking)
- Relevant certifications and training (culinary degrees, food safety, specialized cuisines)
- Junior Chef → Private Chef → Executive Chef → Estate Chef progression
- Lateral moves (yacht chef, resort chef, catering business owner)
- Skills development at each career stage
- Building your reputation and network
- International opportunities and traveling positions
- Salary progression expectations
- Success stories and career trajectories
- Continuing education and specialization (pastry, plant-based, medical diets)

Make this aspirational and motivating while being realistic.`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Private Chef',
    location: '',
    primaryKeyword: 'private chef skills required',
    targetWordCount: 1800,
    customInstructions: `This is a comprehensive skills breakdown for private chef candidates. Include:
- Culinary technique skills (cooking methods, knife skills, plating, timing)
- Dietary knowledge (allergies, medical diets, religious restrictions, health-conscious cooking)
- Menu planning and creativity
- Kitchen management (inventory, ordering, equipment maintenance)
- Soft skills (adaptability, communication, discretion, client relationship management)
- Business skills (budgeting, vendor negotiation, meal costing)
- Specialized skills (pastry, baking, international cuisines, wine pairing)
- How to develop each skill
- Skills gap analysis
- Demonstrating these skills in interviews and tastings
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

async function generatePrivateChefCluster() {
  console.log('\n🚀 Generating Private Chef Content Cluster (8 pieces)\n');
  console.log('📊 Estimated cost: ~$4-6 using Claude Sonnet 4.5\n');

  const generatedPosts: GeneratedPost[] = [];

  for (let i = 0; i < privateChefContentCluster.length; i++) {
    const params = privateChefContentCluster[i];
    const postNum = i + 1;
    const totalPosts = privateChefContentCluster.length;

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

  console.log('\n\n🎉 Success! Generated and saved 8 Private Chef blog posts.');
  console.log('\n📋 Next Steps:');
  console.log('1. Review all posts in preview mode');
  console.log('2. Run create-private-chef-content-links.ts to interconnect all 8 posts');
  console.log('3. Publish the content cluster');
  console.log('4. Replicate for yacht crew positions');
}

// Run the generation
generatePrivateChefCluster()
  .then(() => {
    console.log('\n✅ Generation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Generation failed:', error);
    process.exit(1);
  });
