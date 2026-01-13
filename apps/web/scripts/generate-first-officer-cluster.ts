/**
 * Generate First Officer Content Cluster (8 pieces)
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const contentCluster = [
  {
    contentType: 'interview_questions' as const, targetAudience: 'employer' as const, position: 'First Officer',
    primaryKeyword: 'first officer interview questions', targetWordCount: 2000,
    customInstructions: `Comprehensive first officer/chief officer interview questions. Include questions about navigation, watchkeeping, safety management, crew supervision, bridge operations, certification (OOW, Chief Mate), and career progression. Cover scenarios for different yacht sizes.`,
  },
  {
    contentType: 'hiring_guide' as const, targetAudience: 'employer' as const, position: 'First Officer',
    primaryKeyword: 'how to hire a first officer yacht', targetWordCount: 1800,
    customInstructions: `Guide to hiring a yacht first officer/chief officer. Cover certification requirements (OOW 3000GT, Chief Mate), experience levels, salary expectations, where to find candidates, and common hiring mistakes.`,
  },
  {
    contentType: 'salary_guide' as const, targetAudience: 'both' as const, position: 'First Officer',
    primaryKeyword: 'first officer yacht salary 2026', targetWordCount: 2000,
    customInstructions: `First officer/chief officer salary guide 2026. Include ranges by yacht size, charter vs private, regional variations, benefits, rotation positions, and progression to captain.`,
  },
  {
    contentType: 'what_to_look_for' as const, targetAudience: 'employer' as const, position: 'First Officer',
    primaryKeyword: 'what to look for hiring first officer', targetWordCount: 1500,
    customInstructions: `What to look for when hiring a first officer. Cover certifications, experience indicators, leadership potential, technical skills, red flags, and assessment criteria.`,
  },
  {
    contentType: 'onboarding_guide' as const, targetAudience: 'employer' as const, position: 'First Officer',
    primaryKeyword: 'how to onboard first officer yacht', targetWordCount: 1500,
    customInstructions: `Onboarding guide for first officer. Cover handover, vessel familiarization, safety systems, bridge equipment, crew dynamics, captain relationship, and first 90 days.`,
  },
  {
    contentType: 'position_overview' as const, targetAudience: 'candidate' as const, position: 'First Officer',
    primaryKeyword: 'first officer job description yacht', targetWordCount: 1800,
    customInstructions: `First officer job description overview. Cover responsibilities, daily duties, types of positions, work environment, career satisfaction, challenges, and is this role right for you.`,
  },
  {
    contentType: 'career_path' as const, targetAudience: 'candidate' as const, position: 'First Officer',
    primaryKeyword: 'first officer career path yacht', targetWordCount: 1800,
    customInstructions: `First officer career path guide. Cover progression from deckhand/bosun, certification requirements (OOW to Master), yacht size progression, timeline to captain, and salary expectations.`,
  },
  {
    contentType: 'skills_required' as const, targetAudience: 'candidate' as const, position: 'First Officer',
    primaryKeyword: 'first officer skills required yacht', targetWordCount: 1800,
    customInstructions: `First officer skills breakdown. Cover navigation, safety management, leadership, technical knowledge, communication, crew management, and how to develop each skill.`,
  },
];

async function generate() {
  console.log('\n🚀 Generating First Officer Content Cluster (8 pieces)\n');
  const posts: any[] = [];

  for (let i = 0; i < contentCluster.length; i++) {
    const p = contentCluster[i];
    console.log(`📝 ${i + 1}/8: ${p.contentType.replace(/_/g, ' ').toUpperCase()}`);
    const start = Date.now();
    const result = await generateBlogPost({ ...p, location: '', relatedLandingPageUrls: [] });
    console.log(`✅ ${((Date.now() - start) / 1000).toFixed(1)}s - ${result.title}`);
    posts.push({ ...result, ...p });
  }

  console.log('\n💾 Inserting...\n');
  for (const post of posts) {
    await supabase.from('blog_posts').insert({
      title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
      meta_title: post.metaTitle, meta_description: post.metaDescription, status: 'draft',
      content_type: post.contentType, target_audience: post.targetAudience, target_position: post.position,
      primary_keyword: post.primaryKeyword, target_keywords: post.targetKeywords,
      answer_capsule: post.answerCapsule, answer_capsule_question: post.answerCapsuleQuestion,
      key_facts: post.keyFacts,
    });
    console.log(`✅ ${post.title}`);
  }
  console.log('\n🎉 Done!');
}

generate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
