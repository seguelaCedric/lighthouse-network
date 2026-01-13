/**
 * Generate Bosun Content Cluster (8 pieces)
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const contentCluster = [
  {
    contentType: 'interview_questions' as const, targetAudience: 'employer' as const, position: 'Bosun',
    primaryKeyword: 'bosun interview questions yacht', targetWordCount: 2000,
    customInstructions: `Comprehensive bosun interview questions. Include questions about deck operations, tender driving, water toys, deck maintenance, paint work, line handling, anchoring, docking, deckhand supervision, and safety. Cover certifications (Yachtmaster, PWC, diving).`,
  },
  {
    contentType: 'hiring_guide' as const, targetAudience: 'employer' as const, position: 'Bosun',
    primaryKeyword: 'how to hire a bosun yacht', targetWordCount: 1800,
    customInstructions: `Guide to hiring a yacht bosun. Cover experience requirements, certifications (STCW, Yachtmaster, diving, PWC), salary expectations by yacht size, where to find candidates, and what distinguishes great bosuns.`,
  },
  {
    contentType: 'salary_guide' as const, targetAudience: 'both' as const, position: 'Bosun',
    primaryKeyword: 'bosun salary yacht 2026', targetWordCount: 2000,
    customInstructions: `Bosun salary guide 2026. Include ranges by yacht size, charter vs private, regional variations, diving premiums, tip structures, and progression to mate/officer roles.`,
  },
  {
    contentType: 'what_to_look_for' as const, targetAudience: 'employer' as const, position: 'Bosun',
    primaryKeyword: 'what to look for hiring bosun yacht', targetWordCount: 1500,
    customInstructions: `What to look for when hiring a bosun. Cover experience, certifications, leadership, technical skills, water sports expertise, red flags, and assessment criteria.`,
  },
  {
    contentType: 'onboarding_guide' as const, targetAudience: 'employer' as const, position: 'Bosun',
    primaryKeyword: 'how to onboard bosun yacht', targetWordCount: 1500,
    customInstructions: `Onboarding guide for bosun. Cover deck familiarization, equipment inventory, maintenance schedules, water toys, tender operations, deckhand management, and first 90 days.`,
  },
  {
    contentType: 'position_overview' as const, targetAudience: 'candidate' as const, position: 'Bosun',
    primaryKeyword: 'bosun job description yacht', targetWordCount: 1800,
    customInstructions: `Bosun job description overview. Cover responsibilities, daily duties, types of programs, work environment, career satisfaction, physical demands, and is this role right for you.`,
  },
  {
    contentType: 'career_path' as const, targetAudience: 'candidate' as const, position: 'Bosun',
    primaryKeyword: 'bosun career path yacht', targetWordCount: 1800,
    customInstructions: `Bosun career path guide. Cover progression from deckhand, certifications to obtain (Yachtmaster, OOW), yacht size progression, timeline to mate/officer, and salary expectations.`,
  },
  {
    contentType: 'skills_required' as const, targetAudience: 'candidate' as const, position: 'Bosun',
    primaryKeyword: 'bosun skills required yacht', targetWordCount: 1800,
    customInstructions: `Bosun skills breakdown. Cover seamanship, tender driving, water toys, maintenance, paint/varnish, leadership, navigation basics, diving, and how to develop each skill.`,
  },
];

async function generate() {
  console.log('\n🚀 Generating Bosun Content Cluster (8 pieces)\n');
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
