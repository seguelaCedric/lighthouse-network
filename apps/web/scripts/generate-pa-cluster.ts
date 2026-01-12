/**
 * Generate PA Content Cluster - Phase 1 (Test: 2 posts)
 *
 * This script generates the first 2 pieces of the PA content cluster:
 * 1. PA Hiring Guide (employer-focused)
 * 2. PA Salary Guide (both audiences)
 *
 * Estimated cost: ~$1-2 using Claude Sonnet 4.5
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

// PA Content Cluster - First 2 posts for testing
const paContentCluster = [
  {
    contentType: 'hiring_guide' as const,
    targetAudience: 'employer' as const,
    position: 'Personal Assistant',
    location: '', // Global, not location-specific
    primaryKeyword: 'how to hire a personal assistant',
    targetWordCount: 2000,
    customInstructions: `This is a comprehensive guide for employers hiring a Personal Assistant. Focus on:
- The hiring process from job posting to onboarding
- What qualities and skills to look for
- Red flags and green flags in candidates
- Interview strategies and questions
- Compensation considerations
- Setting clear expectations and boundaries
- Managing the employer-PA relationship

Do NOT focus on specific locations. This is a general guide applicable worldwide.
Write with authority and provide actionable advice.`,
  },
  {
    contentType: 'salary_guide' as const,
    targetAudience: 'both' as const,
    position: 'Personal Assistant',
    location: '', // Global with regional examples
    primaryKeyword: 'personal assistant salary 2026',
    targetWordCount: 2000,
    customInstructions: `This is a comprehensive salary guide for Personal Assistants in 2026. Include:
- Salary ranges by experience level (entry, mid, senior, executive PA)
- Regional variations (compare major markets: US, UK, Middle East, Asia)
- Factors affecting salary (complexity of role, discretion requirements, travel, hours)
- Benefits and total compensation packages
- Live-in vs live-out considerations
- Freelance vs full-time rates

Provide specific salary ranges but note they vary by location.
Be detailed and data-driven where possible.`,
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

async function generatePACluster() {
  console.log('\n🚀 Generating PA Content Cluster - Phase 1 (Test: 2 posts)\n');
  console.log('📊 Estimated cost: ~$1-2 using Claude Sonnet 4.5\n');

  const generatedPosts: GeneratedPost[] = [];

  for (let i = 0; i < paContentCluster.length; i++) {
    const params = paContentCluster[i];
    const postNum = i + 1;
    const totalPosts = paContentCluster.length;

    console.log(`\n📝 Generating Post ${postNum}/${totalPosts}: ${params.contentType.replace('_', ' ').toUpperCase()}`);
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

  console.log('\n\n🎉 Success! Generated and saved 2 PA blog posts.');
  console.log('\n📋 Next Steps:');
  console.log('1. Review the posts in preview mode');
  console.log('2. If quality is good, generate the remaining 4 PA posts');
  console.log('3. Create seo_content_links to interconnect all 7 PA posts');
  console.log('\n💡 To generate all remaining PA posts, run:');
  console.log('   npx tsx apps/web/scripts/generate-pa-cluster-full.ts');
}

// Run the generation
generatePACluster()
  .then(() => {
    console.log('\n✅ Generation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Generation failed:', error);
    process.exit(1);
  });
