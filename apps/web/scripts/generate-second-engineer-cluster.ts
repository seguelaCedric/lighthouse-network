/**
 * Generate Second Engineer Content Cluster (8 pieces)
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const contentCluster = [
  {
    contentType: 'interview_questions' as const, targetAudience: 'employer' as const, position: 'Second Engineer',
    primaryKeyword: 'second engineer interview questions yacht', targetWordCount: 2000,
    customInstructions: `Comprehensive second engineer interview questions. Include questions about engine room operations, maintenance procedures, troubleshooting, electrical systems, watch keeping, supporting chief engineer, certifications (Y4, AEC), and career goals.`,
  },
  {
    contentType: 'hiring_guide' as const, targetAudience: 'employer' as const, position: 'Second Engineer',
    primaryKeyword: 'how to hire second engineer yacht', targetWordCount: 1800,
    customInstructions: `Guide to hiring a yacht second engineer. Cover certification requirements (Y4, AEC), experience levels, working relationship with chief engineer, salary expectations, where to find candidates, and what to look for.`,
  },
  {
    contentType: 'salary_guide' as const, targetAudience: 'both' as const, position: 'Second Engineer',
    primaryKeyword: 'second engineer salary yacht 2026', targetWordCount: 2000,
    customInstructions: `Second engineer salary guide 2026. Include ranges by yacht size and certification, charter vs private, regional variations, benefits, rotation positions, and progression to chief engineer.`,
  },
  {
    contentType: 'what_to_look_for' as const, targetAudience: 'employer' as const, position: 'Second Engineer',
    primaryKeyword: 'what to look for hiring second engineer yacht', targetWordCount: 1500,
    customInstructions: `What to look for when hiring a second engineer. Cover certifications, technical skills, problem-solving ability, teamwork with chief, willingness to learn, red flags, and assessment criteria.`,
  },
  {
    contentType: 'onboarding_guide' as const, targetAudience: 'employer' as const, position: 'Second Engineer',
    primaryKeyword: 'how to onboard second engineer yacht', targetWordCount: 1500,
    customInstructions: `Onboarding guide for second engineer. Cover engine room familiarization, systems training, maintenance schedule handover, working with chief engineer, watch routines, and first 90 days.`,
  },
  {
    contentType: 'position_overview' as const, targetAudience: 'candidate' as const, position: 'Second Engineer',
    primaryKeyword: 'second engineer job description yacht', targetWordCount: 1800,
    customInstructions: `Second engineer job description overview. Cover responsibilities, daily duties, relationship with chief engineer, work environment, career stepping stone, and is this role right for you.`,
  },
  {
    contentType: 'career_path' as const, targetAudience: 'candidate' as const, position: 'Second Engineer',
    primaryKeyword: 'second engineer career path yacht', targetWordCount: 1800,
    customInstructions: `Second engineer career path guide. Cover entry points (ETO, marine engineering), progression to chief engineer, certification ladder, yacht size progression, and timeline expectations.`,
  },
  {
    contentType: 'skills_required' as const, targetAudience: 'candidate' as const, position: 'Second Engineer',
    primaryKeyword: 'second engineer skills required yacht', targetWordCount: 1800,
    customInstructions: `Second engineer skills breakdown. Cover mechanical systems, electrical, HVAC basics, troubleshooting, maintenance planning, documentation, working under chief, and how to develop each skill.`,
  },
];

async function generate() {
  console.log('\n🚀 Generating Second Engineer Content Cluster (8 pieces)\n');
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
