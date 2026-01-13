/**
 * Generate Stewardess Content Cluster (8 pieces)
 * Entry/mid-level interior position (not Chief Stew)
 */

import { createClient } from '@supabase/supabase-js';
import { generateBlogPost } from '../../../packages/ai/blog-generation/index';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const contentCluster = [
  {
    contentType: 'interview_questions' as const, targetAudience: 'employer' as const, position: 'Stewardess',
    primaryKeyword: 'stewardess interview questions yacht', targetWordCount: 2000,
    customInstructions: `Comprehensive stewardess interview questions. Include questions about housekeeping, laundry, service, table settings, guest interaction, attention to detail, flexibility, and willingness to learn. Cover both entry-level and experienced stews.`,
  },
  {
    contentType: 'hiring_guide' as const, targetAudience: 'employer' as const, position: 'Stewardess',
    primaryKeyword: 'how to hire a stewardess yacht', targetWordCount: 1800,
    customInstructions: `Guide to hiring a yacht stewardess. Cover certifications (STCW, ENG1), hospitality background value, entry-level vs experienced, day work trials, salary expectations, and what makes a great stew.`,
  },
  {
    contentType: 'salary_guide' as const, targetAudience: 'both' as const, position: 'Stewardess',
    primaryKeyword: 'stewardess salary yacht 2026', targetWordCount: 2000,
    customInstructions: `Stewardess salary guide 2026. Include 3rd stew, 2nd stew, and general stew ranges by yacht size, charter vs private, regional variations, tip structures, and progression to chief stew.`,
  },
  {
    contentType: 'what_to_look_for' as const, targetAudience: 'employer' as const, position: 'Stewardess',
    primaryKeyword: 'what to look for hiring stewardess yacht', targetWordCount: 1500,
    customInstructions: `What to look for when hiring a stewardess. Cover attention to detail, service mindset, flexibility, discretion, physical stamina, red flags, and trial day assessment.`,
  },
  {
    contentType: 'onboarding_guide' as const, targetAudience: 'employer' as const, position: 'Stewardess',
    primaryKeyword: 'how to onboard stewardess yacht', targetWordCount: 1500,
    customInstructions: `Onboarding guide for stewardess. Cover interior familiarization, housekeeping standards, laundry systems, service protocols, guest preference training, and first 30 days.`,
  },
  {
    contentType: 'position_overview' as const, targetAudience: 'candidate' as const, position: 'Stewardess',
    primaryKeyword: 'stewardess job description yacht', targetWordCount: 1800,
    customInstructions: `Stewardess job description overview. Cover responsibilities, daily duties, interior hierarchy (3rd/2nd/chief), work environment, lifestyle, career potential, and is this role right for you.`,
  },
  {
    contentType: 'career_path' as const, targetAudience: 'candidate' as const, position: 'Stewardess',
    primaryKeyword: 'stewardess career path yacht', targetWordCount: 1800,
    customInstructions: `Stewardess career path guide. Cover how to get started, progression 3rd stew → 2nd stew → chief stew, specializations (purser, wine), certifications to pursue, and timeline expectations.`,
  },
  {
    contentType: 'skills_required' as const, targetAudience: 'candidate' as const, position: 'Stewardess',
    primaryKeyword: 'stewardess skills required yacht', targetWordCount: 1800,
    customInstructions: `Stewardess skills breakdown. Cover housekeeping, laundry, silver service, table settings, flower arranging, guest interaction, discretion, organization, and how to develop each skill.`,
  },
];

async function generate() {
  console.log('\n🚀 Generating Stewardess Content Cluster (8 pieces)\n');
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
