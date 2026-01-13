/**
 * Generate Chief Engineer Content Cluster (8 pieces)
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const contentCluster = [
  {
    contentType: 'interview_questions' as const, targetAudience: 'employer' as const, position: 'Chief Engineer',
    primaryKeyword: 'yacht chief engineer interview questions', targetWordCount: 2000,
    customInstructions: `Comprehensive chief engineer interview questions. Include questions about engine room management, propulsion systems, electrical systems, HVAC, generators, hydraulics, ISM compliance, maintenance planning, budget management, and certification (Y4 to Unlimited). Cover scenarios for different yacht sizes and systems.`,
  },
  {
    contentType: 'hiring_guide' as const, targetAudience: 'employer' as const, position: 'Chief Engineer',
    primaryKeyword: 'how to hire yacht chief engineer', targetWordCount: 1800,
    customInstructions: `Guide to hiring a yacht chief engineer. Cover certification requirements (MCA Y4, Y3, Y2, Y1), experience levels by yacht size, AV/IT integration knowledge, salary expectations, where to find candidates, and common hiring mistakes.`,
  },
  {
    contentType: 'salary_guide' as const, targetAudience: 'both' as const, position: 'Chief Engineer',
    primaryKeyword: 'yacht chief engineer salary 2026', targetWordCount: 2000,
    customInstructions: `Chief engineer salary guide 2026. Include ranges by yacht size and certification level, charter vs private, regional variations, build/refit supervision bonuses, benefits, and rotation positions.`,
  },
  {
    contentType: 'what_to_look_for' as const, targetAudience: 'employer' as const, position: 'Chief Engineer',
    primaryKeyword: 'what to look for hiring chief engineer yacht', targetWordCount: 1500,
    customInstructions: `What to look for when hiring a chief engineer. Cover certifications, technical expertise indicators, problem-solving ability, budget management, red flags, and assessment criteria.`,
  },
  {
    contentType: 'onboarding_guide' as const, targetAudience: 'employer' as const, position: 'Chief Engineer',
    primaryKeyword: 'how to onboard chief engineer yacht', targetWordCount: 1500,
    customInstructions: `Onboarding guide for chief engineer. Cover handover, engine room familiarization, maintenance schedules, spare parts inventory, vendor relationships, budget systems, and first 90 days.`,
  },
  {
    contentType: 'position_overview' as const, targetAudience: 'candidate' as const, position: 'Chief Engineer',
    primaryKeyword: 'yacht chief engineer job description', targetWordCount: 1800,
    customInstructions: `Chief engineer job description overview. Cover responsibilities, daily duties, types of positions, work environment, career satisfaction, challenges, and is this role right for you.`,
  },
  {
    contentType: 'career_path' as const, targetAudience: 'candidate' as const, position: 'Chief Engineer',
    primaryKeyword: 'yacht chief engineer career path', targetWordCount: 1800,
    customInstructions: `Chief engineer career path guide. Cover progression from 2nd engineer/ETO, certification ladder (Y4 to Unlimited), yacht size progression, specializations (new builds, expedition), and salary expectations.`,
  },
  {
    contentType: 'skills_required' as const, targetAudience: 'candidate' as const, position: 'Chief Engineer',
    primaryKeyword: 'yacht chief engineer skills required', targetWordCount: 1800,
    customInstructions: `Chief engineer skills breakdown. Cover mechanical systems, electrical, HVAC, hydraulics, PLC/automation, budget management, leadership, problem-solving, and how to develop each skill.`,
  },
];

async function generate() {
  console.log('\n🚀 Generating Chief Engineer Content Cluster (8 pieces)\n');
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
