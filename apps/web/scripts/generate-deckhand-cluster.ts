/**
 * Generate Deckhand Content Cluster (8 pieces)
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const contentCluster = [
  {
    contentType: 'interview_questions' as const, targetAudience: 'employer' as const, position: 'Deckhand',
    primaryKeyword: 'deckhand interview questions yacht', targetWordCount: 2000,
    customInstructions: `Comprehensive deckhand interview questions. Include questions about deck maintenance, line handling, anchoring, tender operations, water toys, safety awareness, physical fitness, attitude, willingness to learn, and basic seamanship. Entry-level focused but thorough.`,
  },
  {
    contentType: 'hiring_guide' as const, targetAudience: 'employer' as const, position: 'Deckhand',
    primaryKeyword: 'how to hire a deckhand yacht', targetWordCount: 1800,
    customInstructions: `Guide to hiring a yacht deckhand. Cover minimum certifications (STCW, ENG1), what to look for in green vs experienced deckhands, day work trials, salary expectations, attitude vs experience balance, and common hiring mistakes.`,
  },
  {
    contentType: 'salary_guide' as const, targetAudience: 'both' as const, position: 'Deckhand',
    primaryKeyword: 'deckhand salary yacht 2026', targetWordCount: 2000,
    customInstructions: `Deckhand salary guide 2026. Include ranges by yacht size, entry-level vs experienced, charter vs private, regional variations, tip structures, benefits, and progression to lead deckhand/bosun.`,
  },
  {
    contentType: 'what_to_look_for' as const, targetAudience: 'employer' as const, position: 'Deckhand',
    primaryKeyword: 'what to look for hiring deckhand', targetWordCount: 1500,
    customInstructions: `What to look for when hiring a deckhand. Cover certifications, attitude indicators, physical fitness, willingness to learn, red flags, green flags, and day work assessment tips.`,
  },
  {
    contentType: 'onboarding_guide' as const, targetAudience: 'employer' as const, position: 'Deckhand',
    primaryKeyword: 'how to onboard deckhand yacht', targetWordCount: 1500,
    customInstructions: `Onboarding guide for deckhand. Cover safety orientation, deck familiarization, equipment training, watch schedules, team integration, expectations setting, and first 30 days milestones.`,
  },
  {
    contentType: 'position_overview' as const, targetAudience: 'candidate' as const, position: 'Deckhand',
    primaryKeyword: 'deckhand job description yacht', targetWordCount: 1800,
    customInstructions: `Deckhand job description overview. Cover responsibilities, daily duties, physical demands, work environment, entry-level expectations, career potential, and is this role right for you.`,
  },
  {
    contentType: 'career_path' as const, targetAudience: 'candidate' as const, position: 'Deckhand',
    primaryKeyword: 'deckhand career path yacht', targetWordCount: 1800,
    customInstructions: `Deckhand career path guide. Cover how to get started (STCW, day work), progression to lead deckhand → bosun → mate → captain, certifications to pursue, yacht size progression, and timeline expectations.`,
  },
  {
    contentType: 'skills_required' as const, targetAudience: 'candidate' as const, position: 'Deckhand',
    primaryKeyword: 'deckhand skills required yacht', targetWordCount: 1800,
    customInstructions: `Deckhand skills breakdown. Cover line handling, knots, tender driving, water toys, maintenance, paint/varnish, physical fitness, attitude, teamwork, and how to develop each skill.`,
  },
];

async function generate() {
  console.log('\n🚀 Generating Deckhand Content Cluster (8 pieces)\n');
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
