/**
 * Generate Second Stewardess Content Cluster (8 pieces)
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const contentCluster = [
  {
    contentType: 'interview_questions' as const, targetAudience: 'employer' as const, position: 'Second Stewardess',
    primaryKeyword: 'second stewardess interview questions yacht', targetWordCount: 2000,
    customInstructions: `Comprehensive second stewardess interview questions. Include questions about housekeeping standards, laundry expertise, service skills, supporting chief stew, guest cabin management, inventory, charter experience, and career ambitions.`,
  },
  {
    contentType: 'hiring_guide' as const, targetAudience: 'employer' as const, position: 'Second Stewardess',
    primaryKeyword: 'how to hire second stewardess yacht', targetWordCount: 1800,
    customInstructions: `Guide to hiring a yacht second stewardess. Cover certification requirements (STCW, ENG1), experience levels, working with chief stew, salary expectations, where to find candidates, and trial day process.`,
  },
  {
    contentType: 'salary_guide' as const, targetAudience: 'both' as const, position: 'Second Stewardess',
    primaryKeyword: 'second stewardess salary yacht 2026', targetWordCount: 2000,
    customInstructions: `Second stewardess salary guide 2026. Include ranges by yacht size, charter vs private, regional variations, tips, benefits, rotation positions, and progression to chief stew.`,
  },
  {
    contentType: 'what_to_look_for' as const, targetAudience: 'employer' as const, position: 'Second Stewardess',
    primaryKeyword: 'what to look for hiring second stewardess yacht', targetWordCount: 1500,
    customInstructions: `What to look for when hiring a second stewardess. Cover experience indicators, housekeeping standards, laundry skills, service ability, teamwork with chief stew, red flags, and assessment criteria.`,
  },
  {
    contentType: 'onboarding_guide' as const, targetAudience: 'employer' as const, position: 'Second Stewardess',
    primaryKeyword: 'how to onboard second stewardess yacht', targetWordCount: 1500,
    customInstructions: `Onboarding guide for second stewardess. Cover interior familiarization, guest preferences, laundry systems, housekeeping standards, working with chief stew, cabin assignments, and first 90 days.`,
  },
  {
    contentType: 'position_overview' as const, targetAudience: 'candidate' as const, position: 'Second Stewardess',
    primaryKeyword: 'second stewardess job description yacht', targetWordCount: 1800,
    customInstructions: `Second stewardess job description overview. Cover responsibilities, daily duties, relationship with chief stew, work environment, career stepping stone, and is this role right for you.`,
  },
  {
    contentType: 'career_path' as const, targetAudience: 'candidate' as const, position: 'Second Stewardess',
    primaryKeyword: 'second stewardess career path yacht', targetWordCount: 1800,
    customInstructions: `Second stewardess career path guide. Cover entry from 3rd stew or hospitality, progression to chief stew, certification ladder, yacht size progression, specializations, and timeline expectations.`,
  },
  {
    contentType: 'skills_required' as const, targetAudience: 'candidate' as const, position: 'Second Stewardess',
    primaryKeyword: 'second stewardess skills required yacht', targetWordCount: 1800,
    customInstructions: `Second stewardess skills breakdown. Cover housekeeping excellence, laundry expertise, service skills, organization, guest relations, supporting chief stew, and how to develop each skill.`,
  },
];

async function generate() {
  console.log('\n🚀 Generating Second Stewardess Content Cluster (8 pieces)\n');
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
