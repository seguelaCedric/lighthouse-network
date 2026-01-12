/**
 * Generate PA Content Cluster - Remaining Posts (5 pieces)
 *
 * This script generates the remaining pieces of the PA content cluster:
 * 3. What to Look For in a PA (employer-focused)
 * 4. PA Position Overview (candidate-focused)
 * 5. PA Career Path (candidate-focused)
 * 6. PA Skills Required (candidate-focused)
 * 7. PA Onboarding Guide (employer-focused)
 *
 * Estimated cost: ~$2.50-5.00 using Claude Sonnet 4.5
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

// Remaining PA Content Cluster posts
const paContentClusterRemaining = [
  {
    contentType: 'what_to_look_for' as const,
    targetAudience: 'employer' as const,
    position: 'Personal Assistant',
    location: '', // Global, not location-specific
    primaryKeyword: 'what to look for when hiring a personal assistant',
    targetWordCount: 1500,
    customInstructions: `This is a practical guide for employers on what to look for when hiring a Personal Assistant. Focus on:
- Essential skills and competencies (organizational, communication, discretion)
- Red flags to watch for during hiring process
- Green flags that indicate a strong candidate
- How to assess cultural fit and personality compatibility
- Questions to ask during interviews to evaluate key traits
- Experience level considerations (entry vs. executive PA)
- Industry-specific requirements for different sectors

Write in a clear, actionable style that helps employers make informed hiring decisions.
Do NOT focus on specific locations. This is a global guide.`,
  },
  {
    contentType: 'position_overview' as const,
    targetAudience: 'candidate' as const,
    position: 'Personal Assistant',
    location: '', // Global
    primaryKeyword: 'personal assistant job description',
    targetWordCount: 1800,
    customInstructions: `This is a comprehensive overview of the Personal Assistant role for candidates. Include:
- Detailed job description and typical responsibilities
- Day-to-day activities and workflow
- Types of PAs (family PA, executive PA, celebrity PA, estate PA)
- Work environment and conditions
- Who you'll be working with/for
- Career satisfaction factors
- Challenges and rewards of the role
- Is this career right for you? (self-assessment section)

Write in an informative, encouraging tone that helps candidates understand if this career path suits them.`,
  },
  {
    contentType: 'career_path' as const,
    targetAudience: 'candidate' as const,
    position: 'Personal Assistant',
    location: '', // Global
    primaryKeyword: 'personal assistant career path',
    targetWordCount: 1800,
    customInstructions: `This is a career development guide for Personal Assistants. Cover:
- Entry points into the PA profession (from admin assistant, hospitality, etc.)
- Junior PA → Senior PA → Executive PA progression
- Lateral moves (family office, estate management, chief of staff)
- Skills development at each career stage
- Certifications and professional development opportunities
- Networking and building your reputation
- Salary progression expectations (link to salary guide)
- Success stories and career trajectories

Make this aspirational and motivating while being realistic about career timelines and requirements.`,
  },
  {
    contentType: 'skills_required' as const,
    targetAudience: 'candidate' as const,
    position: 'Personal Assistant',
    location: '', // Global
    primaryKeyword: 'personal assistant skills required',
    targetWordCount: 1800,
    customInstructions: `This is a comprehensive skills breakdown for Personal Assistant candidates. Include:
- Hard skills (calendar management, travel coordination, expense tracking, tech proficiency)
- Soft skills (communication, discretion, anticipation, emotional intelligence)
- Technical tools and software (Microsoft Office, Google Workspace, project management tools)
- Industry-specific skills for different sectors
- How to develop each skill
- Skills gap analysis (what you have vs. what you need)
- How to demonstrate these skills in interviews
- Continuing education and upskilling

Make this practical and actionable with specific examples and development strategies.`,
  },
  {
    contentType: 'onboarding_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Personal Assistant',
    location: '', // Global
    primaryKeyword: 'how to onboard a personal assistant',
    targetWordCount: 1500,
    customInstructions: `This is a practical onboarding guide for employers who have hired a Personal Assistant. Focus on:
- First day/week/month onboarding timeline
- Essential information to share (family/business context, preferences, routines)
- Systems and tools training (email, calendar, communication protocols)
- Setting clear expectations and boundaries
- Building trust and rapport in the first 90 days
- Common onboarding mistakes to avoid
- How to give effective feedback in the early stages
- When to course-correct vs. give more time to adjust

Write in a supportive, practical tone that helps employers set their new PA up for success.`,
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

async function generatePAClusterRemaining() {
  console.log('\n🚀 Generating PA Content Cluster - Remaining Posts (5 pieces)\n');
  console.log('📊 Estimated cost: ~$2.50-5.00 using Claude Sonnet 4.5\n');

  const generatedPosts: GeneratedPost[] = [];

  for (let i = 0; i < paContentClusterRemaining.length; i++) {
    const params = paContentClusterRemaining[i];
    const postNum = i + 1;
    const totalPosts = paContentClusterRemaining.length;

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

  console.log('\n\n🎉 Success! Generated and saved 5 PA blog posts.');
  console.log('\n📋 PA Content Cluster Status:');
  console.log('✅ PA Interview Questions (already exists)');
  console.log('✅ PA Hiring Guide (previously generated)');
  console.log('✅ PA Salary Guide (previously generated)');
  console.log('✅ What to Look For in a PA (just generated)');
  console.log('✅ PA Position Overview (just generated)');
  console.log('✅ PA Career Path (just generated)');
  console.log('✅ PA Skills Required (just generated)');
  console.log('✅ PA Onboarding Guide (just generated)');
  console.log('\n📊 Total PA Content Cluster: 8 pieces');
  console.log('\n💡 Next Steps:');
  console.log('1. Review all posts in preview mode');
  console.log('2. Create seo_content_links to interconnect all 8 PA posts');
  console.log('3. Publish the content cluster');
  console.log('4. Replicate for other positions (Butler, House Manager, etc.)');
}

// Run the generation
generatePAClusterRemaining()
  .then(() => {
    console.log('\n✅ Generation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Generation failed:', error);
    process.exit(1);
  });
